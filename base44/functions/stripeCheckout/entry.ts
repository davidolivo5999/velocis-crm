import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
    const { amount, description, metadata = {}, successUrl, cancelUrl } = await req.json();

    if (!amount || amount <= 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";
    const finalSuccessUrl = successUrl || `${origin}/payments?payment=success`;
    const finalCancelUrl = cancelUrl || `${origin}/payments?payment=cancelled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: description || "Rental Payment",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        ...metadata,
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
      },
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error("Stripe checkout error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});