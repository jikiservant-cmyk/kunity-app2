import { NextRequest, NextResponse } from "next/server";
import { paymentGateway } from "../../../../lib/payments/gateway";
import { apiLimiter } from "../../../../lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit to prevent payment spam
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    await apiLimiter.check(10, ip);

    const body = await req.json();
    const { amount, currency = "USD" } = body;

    // Basic validation
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Abstracted gateway handles the actual provider logic (LivePay currently)
    const intent = await paymentGateway.createPaymentIntent(amount, currency, {
      source: 'web_app',
      // user_id: auth.uid() // In production we would map this to the authenticated user
    });

    // Note: In production you would securely log this intent to the database
    // in a `payment_requests` table with an idempotency key before returning.

    return NextResponse.json({ success: true, intent });
  } catch (error) {
    console.error("Payment intent generation error:", error);
    return NextResponse.json(
      { error: "Failed to process payment request" },
      { status: 500 }
    );
  }
}
