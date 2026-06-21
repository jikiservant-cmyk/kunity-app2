import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client with the service role key to bypass RLS for webhook posting.
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321', // Dummy fallback for build phase
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key'
  );
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let body;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // LivePay usually sends reference, status, etc. in the webhook payload.
    // Example: { internal_reference: "uuid", status: "success", amount: 50000, fee: 500, currency: "UGX", ... }
    const { internal_reference, status, amount, fee, currency, phone_number, provider } = body;

    if (!internal_reference) {
      return NextResponse.json({ error: 'Missing internal_reference' }, { status: 400 });
    }

    // (Optional) Implement webhook signature validation here.
    // e.g. using crypto to verify headers['x-livepay-signature'] against LIVEPAY_SECRET_KEY

    // Call the database RPC to handle the double-entry posting atomically
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.rpc('process_livepay_webhook', {
      p_internal_reference: internal_reference,
      p_status: status || 'success', // Assuming the webhook sends 'success' or 'failed'
      p_amount: amount || 0,
      p_fee: fee || 0,
      p_currency: currency || 'UGX',
      p_payload: body
    });

    if (error) {
      console.error('Error processing livepay webhook:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Returns a 200 OK so LivePay knows we received it
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
