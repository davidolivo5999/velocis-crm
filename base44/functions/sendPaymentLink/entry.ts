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

    // Send email via Resend API
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        throw new Error("RESEND_API_KEY not configured");
      }

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "noreply@autorent.com",
          to: customerEmail,
          subject: `Your Rental Payment Link - ${String(vehicleName).substring(0, 100)}`,
          html: `<p>Hi ${customerName || "Valued Customer"},</p><p>Your rental has been created! Click the link below to pay <strong>$${(amount).toFixed(2)}</strong>:</p><p><a href="${session.url}" style="background-color: #222; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Complete Payment</a></p><p>This link is valid for 24 hours.</p><p>Thank you!</p>`,
        }),
      });

      if (!emailRes.ok) {
        throw new Error(`Resend API error: ${emailRes.statusText}`);
      }

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