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
      cookieOptions: {
        sameSite: 'none',
        secure: true
      },
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
            supabaseResponse.cookies.set(name, value, { ...options, sameSite: 'none', secure: true })
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

  // If user exists, fetch their role using the kuntiy.profiles table
  if (user) {
    if (isAuthPage) {
      // Don't let logged-in users see the auth page
      const { data: profile } = await supabase
        .schema('kuntiy')
        .from('profiles')
        .select('roles')
        .eq('id', user.id)
        .maybeSingle();

      const url = request.nextUrl.clone();
      const roles = profile?.roles || ['member'];
      const isSaccoAdmin = ['sacco_admin', 'system_admin', 'super_admin'].some(r => roles.includes(r));
      if (isSaccoAdmin) {
        url.pathname = '/admin';
      } else {
        url.pathname = '/member';
      }
      return NextResponse.redirect(url);
    }

    if (isAdminPage || isMemberPage) {
      const { data: profile } = await supabase
        .schema('kuntiy')
        .from('profiles')
        .select('roles')
        .eq('id', user.id)
        .maybeSingle();
      
      const roles = profile?.roles || ['member'];
      const isSaccoAdmin = ['sacco_admin', 'system_admin', 'super_admin'].some(r => roles.includes(r));
      const isMember = roles.includes('member') || !isSaccoAdmin;

      // Protect /admin routes, must be strictly admin
      if (isAdminPage && !isSaccoAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = isMember ? '/member' : '/auth';
        return NextResponse.redirect(url);
      }

      // Protect /member routes, must be strictly member
      if (isMemberPage && isSaccoAdmin && !isMember) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
