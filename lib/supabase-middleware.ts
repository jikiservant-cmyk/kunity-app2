import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route protection logic
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');
  const isMemberPage = request.nextUrl.pathname.startsWith('/member');

  // If there's no user, redirect to login for protected routes
  if (!user && (isAdminPage || isMemberPage)) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  // If user exists, fetch their role using the public.admin_profiles table
  if (user) {
    if (isAuthPage) {
      // Don't let logged-in users see the auth page
      const { data: profile } = await supabase
        .schema('public')
        .from('admin_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const url = request.nextUrl.clone();
      if (profile?.role === 'sacco_admin' || profile?.role === 'system_admin' || profile?.role === 'super_admin') {
        url.pathname = '/admin';
      } else {
        url.pathname = '/member';
      }
      return NextResponse.redirect(url);
    }

    if (isAdminPage || isMemberPage) {
      const { data: profile } = await supabase
        .schema('public')
        .from('admin_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      const role = profile?.role || 'member';
      const isSaccoAdmin = ['sacco_admin', 'system_admin', 'super_admin'].includes(role);

      // Protect /admin routes, must be strictly admin
      if (isAdminPage && !isSaccoAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = role === 'member' ? '/member' : '/auth';
        return NextResponse.redirect(url);
      }

      // Protect /member routes, must be strictly member
      if (isMemberPage && role !== 'member') {
        const url = request.nextUrl.clone();
        url.pathname = isSaccoAdmin ? '/admin' : '/auth';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
