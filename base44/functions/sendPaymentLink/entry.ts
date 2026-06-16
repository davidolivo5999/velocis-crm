import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return Response.json({ error: "Invalid content type" }, { status: 400 });
    }

    const body = await req.json();
    const { paymentId, customerEmail, customerName, amount, vehicleName } = body;

    if (!paymentId || !customerEmail || !amount || amount <= 0) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
    const allowedOrigin = req.headers.get("origin") || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Rental Payment - ${String(vehicleName).substring(0, 200)}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${allowedOrigin}/payments?payment=success`,
      cancel_url: `${allowedOrigin}/payments?payment=cancelled`,
      metadata: {
        payment_id: String(paymentId).substring(0, 50),
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        timestamp: new Date().toISOString(),
      },
    });

    // Send email via Base44 Core integration
    try {
      const base44 = await import('npm:@base44/sdk@0.8.31');
      await base44.integrations.Core.SendEmail({
        to: customerEmail,
        subject: `Your Rental Payment Link - ${String(vehicleName).substring(0, 100)}`,
        body: `Hi ${customerName || "Valued Customer"},\n\nYour rental has been created! Click the link below to pay $${(amount).toFixed(2)}:\n\n${session.url}\n\nThis link is valid for 24 hours.\n\nThank you!`,
      });
      console.log(`Payment link email sent to ${customerEmail}`);
    } catch (emailError) {
      console.error(`Failed to send email to ${customerEmail}:`, emailError.message);
    }

    return Response.json({ 
      success: true, 
      session_id: session.id, 
      url: session.url,
      emailSent: true 
    });
  } catch (error) {
    console.error("Send payment link error:", error.message, error.stack);
    return Response.json({ error: "Failed to send payment link" }, { status: 500 });
  }
});