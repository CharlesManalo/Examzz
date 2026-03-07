const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let webhookEvent;

  try {
    webhookEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook signature verification failed' }),
    };
  }

  try {
    switch (webhookEvent.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(webhookEvent.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(webhookEvent.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(webhookEvent.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(webhookEvent.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(webhookEvent.data.object);
        break;
      
      default:
        console.log(`Unhandled event type ${webhookEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function handleInvoicePaymentSucceeded(invoice) {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;

  // Update user subscription status to active
  await supabase
    .from('users')
    .update({ 
      subscription_status: 'active',
      plan_type: 'premium',
      subscription_end_date: new Date(invoice.period_end * 1000).toISOString()
    })
    .eq('stripe_customer_id', customerId);

  console.log(`Invoice payment succeeded for subscription ${subscriptionId}`);
}

async function handleInvoicePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;

  // Update user subscription status to past_due
  await supabase
    .from('users')
    .update({ 
      subscription_status: 'past_due'
    })
    .eq('stripe_customer_id', customerId);

  console.log(`Invoice payment failed for subscription ${subscriptionId}`);
}

async function handleSubscriptionCreated(subscription) {
  const customerId = subscription.customer;
  const userId = subscription.metadata.userId;

  // Update user with subscription info
  await supabase
    .from('users')
    .update({ 
      subscription_status: subscription.status,
      plan_type: 'premium',
      subscription_id: subscription.id,
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('id', userId);

  console.log(`Subscription created: ${subscription.id}`);
}

async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;

  // Update user subscription status
  await supabase
    .from('users')
    .update({ 
      subscription_status: subscription.status,
      plan_type: subscription.status === 'active' ? 'premium' : 'free',
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('stripe_customer_id', customerId);

  console.log(`Subscription updated: ${subscription.id}`);
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  // Update user subscription status
  await supabase
    .from('users')
    .update({ 
      subscription_status: 'canceled',
      plan_type: 'free',
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('stripe_customer_id', customerId);

  console.log(`Subscription deleted: ${subscription.id}`);
}
