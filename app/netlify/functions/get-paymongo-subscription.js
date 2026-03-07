const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// PayMongo API configuration
const PAYMONGO_API_BASE_URL = 'https://api.paymongo.com/v1';

exports.handler = async (event) => {
  try {
    const userId = event.queryStringParameters.userId;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userId parameter' }),
      };
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('paymongo_customer_id, subscription_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    if (!user.paymongo_customer_id) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No PayMongo customer found' }),
      };
    }

    // Get payments from PayMongo (since PayMongo doesn't have subscriptions like Stripe)
    // We'll use payments to track subscription status
    const paymentsResponse = await axios.get(
      `${PAYMONGO_API_BASE_URL}/payments?customer=${user.paymongo_customer_id}&limit=10`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const payments = paymentsResponse.data.data;
    
    // Find the most recent successful payment for subscription
    const latestPayment = payments.find(payment => 
      payment.attributes.status === 'paid' && 
      payment.attributes.description?.includes('Premium Plan')
    );

    if (!latestPayment) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No active subscription found' }),
      };
    }

    // Calculate subscription period (1 month from payment date)
    const paymentDate = new Date(latestPayment.attributes.paid_at * 1000);
    const subscriptionEnd = new Date(paymentDate);
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

    // Check if subscription is still active
    const isActive = new Date() < subscriptionEnd;

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: latestPayment.id,
        userId: userId,
        planId: 'premium',
        status: isActive ? 'active' : 'expired',
        currentPeriodStart: paymentDate.toISOString(),
        currentPeriodEnd: subscriptionEnd.toISOString(),
        paymongoPaymentId: latestPayment.id,
        paymongoCustomerId: user.paymongo_customer_id,
        cancelAtPeriodEnd: false,
      }),
    };
  } catch (error) {
    console.error('Error getting PayMongo subscription status:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
