import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    // Validate request method
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    // Validate content type
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return Response.json({ error: "Invalid content type" }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
    const body = await req.json();
    const { amount, description, metadata = {}, successUrl, cancelUrl } = body;

    // Validate amount - must be positive number and reasonable limit
    if (!Number.isFinite(amount) || amount <= 0 || amount > 999999) {
      console.warn(`Invalid amount attempted: ${amount}`);
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Validate description to prevent injection
    const sanitizedDescription = String(description || "Rental Payment")
      .substring(0, 256)
      .replace(/[<>]/g, "");

    // Validate URLs to prevent open redirect
    const allowedOrigin = req.headers.get("origin") || "http://localhost:5173";
    const isValidUrl = (url, baseOrigin) => {
      try {
        const parsed = new URL(url);
        return parsed.origin === baseOrigin;
      } catch {
        return false;
      }
    };

    const finalSuccessUrl = (successUrl && isValidUrl(successUrl, allowedOrigin))
      ? successUrl
      : `${allowedOrigin}/payments?payment=success`;
    const finalCancelUrl = (cancelUrl && isValidUrl(cancelUrl, allowedOrigin))
      ? cancelUrl
      : `${allowedOrigin}/payments?payment=cancelled`;

    // Validate metadata to prevent injection attacks
    const sanitizedMetadata = {};
    if (typeof metadata === "object" && metadata !== null) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (typeof key === "string" && (typeof value === "string" || typeof value === "number")) {
          sanitizedMetadata[key.substring(0, 50)] = String(value).substring(0, 500);
        }
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: sanitizedDescription,
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
        ...sanitizedMetadata,
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`Stripe session created: ${session.id} for amount: ${amount}`);
    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error("Stripe checkout error:", error.message, error.stack);
    // Never expose internal error details to client
    return Response.json({ error: "Payment processing failed. Please try again." }, { status: 500 });
  }
});