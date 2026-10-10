import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              request.cookies.set(
                name,
                value
              );

              response = NextResponse.next({
                request,
              });

              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  /*
   * Refresh the Supabase session.
   * This is important for keeping auth cookies updated.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  /*
   * Protect all /admin routes
   */
  if (pathname.startsWith("/admin")) {
    // Not logged in
    if (!user) {
      const loginUrl = request.nextUrl.clone();

      loginUrl.pathname = "/login";
      loginUrl.searchParams.set(
        "redirect",
        pathname
      );

      return NextResponse.redirect(
        loginUrl
      );
    }

    /*
     * Check user's role from profiles table
     */
    const { data: profile } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    /*
     * Logged-in but not admin
     */
    if (profile?.role !== "admin") {
      const dashboardUrl =
        request.nextUrl.clone();

      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";

      return NextResponse.redirect(
        dashboardUrl
      );
    }
  }

  /*
   * Prevent logged-in users from going
   * back to login unnecessarily.
   *
   * Admin will be redirected to admin dashboard.
   */
  if (pathname === "/login" && user) {
    const { data: profile } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (profile?.role === "admin") {
      const adminUrl =
        request.nextUrl.clone();

      adminUrl.pathname =
        "/admin/dashboard";
      adminUrl.search = "";

      return NextResponse.redirect(
        adminUrl
      );
    }

    const dashboardUrl =
      request.nextUrl.clone();

    dashboardUrl.pathname =
      "/dashboard";
    dashboardUrl.search = "";

    return NextResponse.redirect(
      dashboardUrl
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
  ],
};