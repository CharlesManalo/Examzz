const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { subscriptionId } = JSON.parse(event.body);

    if (!subscriptionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing subscriptionId' }),
      };
    }

    // For PayMongo, we don't have native subscriptions like Stripe
    // We'll mark the subscription as canceled in the database
    // and prevent automatic renewals

    // Update user subscription status to canceled
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        subscription_status: 'canceled',
        plan_type: 'free'
      })
      .eq('subscription_id', subscriptionId);

    if (updateError) {
      throw updateError;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Subscription canceled successfully',
        subscriptionId: subscriptionId,
      }),
    };
  } catch (error) {
    console.error('Error canceling PayMongo subscription:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
