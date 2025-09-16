const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "OK" };
  }

  try {
    const { priceId, product } = JSON.parse(event.body || "{}");
    if (!priceId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing priceId" })
      };
    }

    const isBasic = product === "basic";
    const successUrl = isBasic
      ? "https://smartgrowthmedia.co.uk/cro-audit-thank-you?session_id={CHECKOUT_SESSION_ID}"
      : "https://smartgrowthmedia.co.uk/all-in-audit-thank-you?session_id={CHECKOUT_SESSION_ID}";
    const cancelUrl = isBasic
      ? "https://smartgrowthmedia.co.uk/conversion-rate-audit"
      : "https://smartgrowthmedia.co.uk/conversion-rate-optimisation-audit";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_creation: "always",
      custom_fields: [
        {
          key: "website_url",
          label: { type: "custom", custom: "Website URL" },
          type: "text"
        }
      ],
      metadata: { product: product || "unknown" },
      success_url: successUrl,
      cancel_url: cancelUrl
    });

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message })
    };
  }
};
