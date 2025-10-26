import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database.types";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  // Use service role key for middleware to bypass RLS when checking profiles
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile to check role and status
  let userProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    userProfile = profile;
  }

  console.log("profile: " + userProfile)

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/login", "/auth/register-donor", "/auth/signup-school", "/auth/callback"];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname === route
  );

  // If no user and trying to access protected route, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If user is authenticated but profile not found, redirect to login
  // EXCEPT for registration completion routes
  const registrationCompletionRoutes = ["/auth/register-school", "/auth/register-donor"];
  const isRegistrationCompletion = registrationCompletionRoutes.some((route) =>
    request.nextUrl.pathname === route
  );

  if (user && !userProfile && !isPublicRoute && !isRegistrationCompletion) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Handle inactive school accounts specially
  if (user && userProfile && userProfile.is_active === false && userProfile.role === "school") {
    const pathname = request.nextUrl.pathname;

    // Check if school has completed registration
    const { data: schoolRecord } = await supabase
      .from("schools")
      .select("id, approval_status")
      .eq("id", user.id)
      .single();

    // If no school record exists, redirect to registration form
    if (!schoolRecord) {
      if (pathname !== "/auth/register-school") {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/register-school";
        return NextResponse.redirect(url);
      }
    } else {
      // School record exists but awaiting approval
      // Only allow access to a pending approval page
      if (pathname !== "/school/pending") {
        const url = request.nextUrl.clone();
        url.pathname = "/school/pending";
        return NextResponse.redirect(url);
      }
    }
  }

  // Handle donor accounts - check verification status from donors table
  if (user && userProfile && userProfile.role === "donor") {
    const pathname = request.nextUrl.pathname;

    // Fetch donor verification status from donors table
    const { data: donorData } = await supabase
      .from("donors")
      .select("verification_status, is_verified")
      .eq("id", user.id)
      .single();

    if (donorData) {
      // Check verification status
      if (donorData.verification_status === "pending" || !donorData.is_verified) {
        // Allow access to pending page only
        if (pathname !== "/donor/pending") {
          const url = request.nextUrl.clone();
          url.pathname = "/donor/pending";
          return NextResponse.redirect(url);
        }
      } else if (donorData.verification_status === "rejected") {
        // If rejected, sign out
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        url.searchParams.set("error", "rejected");
        return NextResponse.redirect(url);
      }
    }
  }

  // Check if account is inactive (non-school, non-donor roles)
  if (user && userProfile && userProfile.is_active === false && userProfile.role !== "school" && userProfile.role !== "donor") {
    // Sign out other inactive users and redirect to login
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("error", "inactive");
    return NextResponse.redirect(url);
  }

  // If user is authenticated and active, check role-based access
  if (user && userProfile && userProfile.is_active) {
    const pathname = request.nextUrl.pathname;

    // Redirect from home to user's dashboard
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `/${userProfile.role}`;
      return NextResponse.redirect(url);
    }

    // Role-based route protection
    if (pathname.startsWith("/admin") && userProfile.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = `/${userProfile.role}`;
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/approver") && userProfile.role !== "approver" && userProfile.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = `/${userProfile.role}`;
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/donor") && userProfile.role !== "donor") {
      const url = request.nextUrl.clone();
      url.pathname = `/${userProfile.role}`;
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/school") && userProfile.role !== "school") {
      const url = request.nextUrl.clone();
      url.pathname = `/${userProfile.role}`;
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
