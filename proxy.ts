import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // API routes that don't require authentication
  const publicApiRoutes = ["/api/auth"];
  const isPublicApiRoute = publicApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Static files and assets
  const isStaticRoute =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".");

  // Allow public routes and static files
  if (isPublicRoute || isPublicApiRoute || isStaticRoute) {
    // Redirect logged-in users away from auth pages
    if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  const user = req.auth?.user;
  const userRole = user?.role;

  // Admin-only routes
  const adminRoutes = ["/admin"];
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  if (isAdminRoute && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Professional-only routes (clinicians and support)
  const professionalRoutes = ["/patients", "/notes"];
  const isProfessionalRoute = professionalRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (
    isProfessionalRoute &&
    userRole !== "CLINICIAN" &&
    userRole !== "SUPPORT" &&
    userRole !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Parent-only routes
  const parentRoutes = ["/children"];
  const isParentRoute = parentRoutes.some((route) => pathname.startsWith(route));
  if (isParentRoute && userRole !== "PARENT" && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Child-only routes
  const childRoutes = ["/garden"];
  const isChildRoute = childRoutes.some((route) => pathname.startsWith(route));
  if (isChildRoute && userRole !== "CHILD" && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
