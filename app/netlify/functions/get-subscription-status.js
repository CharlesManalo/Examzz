const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
      .select('stripe_customer_id, subscription_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    if (!user.stripe_customer_id) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No Stripe customer found' }),
      };
    }

    // Get subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      limit: 1,
      status: 'active',
    });

    if (subscriptions.data.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No active subscription found' }),
      };
    }

    const subscription = subscriptions.data[0];

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: subscription.id,
        userId: userId,
        planId: subscription.items.data[0].price.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      }),
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
