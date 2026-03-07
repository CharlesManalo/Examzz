const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

exports.handler = async (event) => {
  try {
    const signature = event.headers["paymongo-signature"];

    if (!signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing PayMongo signature" }),
      };
    }

    // Verify webhook signature (PayMongo uses HMAC-SHA256)
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
    const body = event.body;

    // Extract timestamp from signature
    const timestamp = signature.split(",")[0].split("=")[1];
    const signatureHash = signature.split(",")[1].split("=")[1];

    // Create expected signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(timestamp + body)
      .digest("hex");

    if (signatureHash !== expectedSignature) {
      console.log("Webhook signature verification failed");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid webhook signature" }),
      };
    }

    const webhookEvent = JSON.parse(body);

    switch (webhookEvent.data.attributes.type) {
      case "payment.paid":
        await handlePaymentPaid(webhookEvent.data);
        break;

      case "payment.failed":
        await handlePaymentFailed(webhookEvent.data);
        break;

      case "payment.updated":
        await handlePaymentUpdated(webhookEvent.data);
        break;

      default:
        console.log(
          `Unhandled event type ${webhookEvent.data.attributes.type}`,
        );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error("Error processing PayMongo webhook:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

async function handlePaymentPaid(paymentData) {
  const payment = paymentData.attributes;
  const userId = payment.metadata?.userId;
  const customerId = payment.customer;

  if (!userId) {
    console.log("No userId found in payment metadata");
    return;
  }

  // Check if this is a subscription payment
  if (payment.description?.includes("Premium Plan")) {
    // Calculate subscription end date (1 month from payment)
    const paymentDate = new Date(payment.paid_at * 1000);
    const subscriptionEnd = new Date(paymentDate);
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

    // Update user subscription status in Supabase
    await supabase
      .from("users")
      .update({
        subscription_status: "active",
        plan_type: "premium",
        subscription_id: payment.id,
        subscription_end_date: subscriptionEnd.toISOString(),
        paymongo_customer_id: customerId,
        is_premium: true,
      })
      .eq("id", userId);

    // Create subscription record
    await supabase.from("subscriptions").upsert({
      user_id: userId,
      plan_id: "premium",
      status: "active",
      current_period_start: paymentDate.toISOString(),
      current_period_end: subscriptionEnd.toISOString(),
      paymongo_subscription_id: payment.id,
      paymongo_customer_id: customerId,
      cancel_at_period_end: false,
      amount: 95.0,
      currency: "PHP",
    });

    // Create payment transaction record
    await supabase.from("payment_transactions").insert({
      user_id: userId,
      paymongo_payment_id: payment.id,
      amount: payment.amount / 100, // Convert from cents
      currency: "PHP",
      status: "paid",
      payment_method: payment.payment_method?.type || "unknown",
      description: payment.description,
      metadata: payment.metadata || {},
      paid_at: paymentDate.toISOString(),
    });

    console.log(
      `Subscription activated for user ${userId}, payment ${payment.id}`,
    );
  }
}

async function handlePaymentFailed(paymentData) {
  const payment = paymentData.attributes;
  const userId = payment.metadata?.userId;

  if (!userId) {
    console.log("No userId found in payment metadata");
    return;
  }

  // Update user subscription status to failed
  await supabase
    .from("users")
    .update({
      subscription_status: "past_due",
    })
    .eq("id", userId);

  // Create failed payment transaction record
  await supabase.from("payment_transactions").insert({
    user_id: userId,
    paymongo_payment_id: payment.id,
    amount: payment.amount / 100,
    currency: "PHP",
    status: "failed",
    payment_method: payment.payment_method?.type || "unknown",
    description: payment.description,
    metadata: payment.metadata || {},
  });

  console.log(`Payment failed for user ${userId}, payment ${payment.id}`);
}

async function handlePaymentUpdated(paymentData) {
  const payment = paymentData.attributes;
  const userId = payment.metadata?.userId;

  if (!userId) {
    console.log("No userId found in payment metadata");
    return;
  }

  // Handle payment status updates
  if (payment.status === "paid") {
    await handlePaymentPaid(paymentData);
  } else if (payment.status === "failed") {
    await handlePaymentFailed(paymentData);
  }

  // Update payment transaction record
  await supabase.from("payment_transactions").upsert({
    user_id: userId,
    paymongo_payment_id: payment.id,
    amount: payment.amount / 100,
    currency: "PHP",
    status: payment.status,
    payment_method: payment.payment_method?.type || "unknown",
    description: payment.description,
    metadata: payment.metadata || {},
    updated_at: new Date().toISOString(),
  });

  console.log(`Payment updated for user ${userId}, status: ${payment.status}`);
}
