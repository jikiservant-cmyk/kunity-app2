'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import SetupRequired from '@/components/SetupRequired';
import { Loader2 } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch role to redirect to correct dashboard
        const { data: profile } = await supabase
          .schema('kuntiy')
          .from('profiles')
          .select('roles')
          .eq('id', session.user.id)
          .single();
          
        if (profile?.roles?.includes('sacco_admin') || profile?.roles?.includes('super_admin') || profile?.roles?.includes('system_admin')) {
          router.replace('/admin');
        } else {
          router.replace('/member');
        }
      } else {
        router.replace('/auth');
      }
    };

    checkSession();
  }, [router]);

  if (!isSupabaseConfigured()) {
    return <SetupRequired />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FEF6EE]">
      <Loader2 className="w-8 h-8 animate-spin text-[#F97316]" />
    </div>
  );
}
