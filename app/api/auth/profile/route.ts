import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // Initialize a supabase client with the service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    console.log('📥 Profile setup request:', body);
    const { userId, fullName, orgId, email, phone } = body;

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Missing userId or orgId' }, { status: 400 });
    }

    // Only insert into kuntiy.members! No profiles table!
    console.log('🔄 Upserting member in kuntiy.members...');
    const memberData = {
      id: userId,
      organization_id: orgId,
      profile_id: userId,
      first_name: fullName.split(' ')[0] || fullName,
      last_name: fullName.split(' ').slice(1).join(' ') || '',
      email,
      phone
    };

    const { data: member, error: memberError } = await supabaseAdmin
      .schema('kuntiy')
      .from('members')
      .upsert(memberData, { onConflict: 'id' })
      .select('id')
      .single();

    if (memberError) {
      console.error('❌ Member error:', memberError);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }
    console.log('✅ Member upserted successfully:', member);

    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
        ? String((err as any).message)
        : 'Internal server error';

    console.error('❌ API Route Exception:', JSON.stringify(err, null, 2));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
