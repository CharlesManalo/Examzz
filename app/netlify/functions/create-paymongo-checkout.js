const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// PayMongo API configuration
const PAYMONGO_API_BASE_URL = "https://api.paymongo.com/v1";

exports.handler = async (event) => {
  try {
    const { amount, description, userId, userEmail, successUrl, cancelUrl } =
      JSON.parse(event.body);

    if (!amount || !description || !userId || !userEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameters" }),
      };
    }

    // Get or create PayMongo customer
    let customerId;

    // First, try to get existing customer from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("paymongo_customer_id")
      .eq("id", userId)
      .single();

    if (userError && userError.code !== "PGRST116") {
      throw userError;
    }

    if (user?.paymongo_customer_id) {
      customerId = user.paymongo_customer_id;
    } else {
      // Create new PayMongo customer
      const customerResponse = await axios.post(
        `${PAYMONGO_API_BASE_URL}/customers`,
        {
          data: {
            attributes: {
              email: userEmail,
              metadata: {
                userId: userId,
              },
            },
          },
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
            "Content-Type": "application/json",
          },
        },
      );

      customerId = customerResponse.data.data.id;

      // Update user with PayMongo customer ID
      await supabase
        .from("users")
        .update({ paymongo_customer_id: customerId })
        .eq("id", userId);
    }

    // Create checkout session
    const checkoutResponse = await axios.post(
      `${PAYMONGO_API_BASE_URL}/checkout_sessions`,
      {
        data: {
          attributes: {
            send_billing_receipt: true,
            show_description: true,
            show_line_items: true,
            payment_method_types: ["gcash", "paymaya", "card", "bank_transfer"],
            line_items: [
              {
                name: description,
                amount: amount * 100, // PayMongo uses amount in cents
                currency: "PHP",
                quantity: 1,
              },
            ],
            description: description,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
              userId: userId,
            },
            customer: customerId,
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
          "Content-Type": "application/json",
        },
      },
    );

    const checkout = checkoutResponse.data.data;

    return {
      statusCode: 200,
      body: JSON.stringify({
        checkoutId: checkout.id,
        checkout_url: checkout.attributes.checkout_url,
        reference_number: checkout.attributes.reference_number,
      }),
    };
  } catch (error) {
    console.error("Error creating PayMongo checkout:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};
