import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES, LOGIN_ROUTE, DEFAULT_REDIRECT } from "@/lib/routes";

// Middleware rules (swapped routes):
// - The login page is now `/` (was `/login`). The protected home is `/dashboard` (was `/`).
// - If no session (no `token` cookie): allow `/` (login) and auth APIs, redirect other pages to `/`.
// - If session exists: prevent access to `/` (login) and redirect to `/dashboard`, allow other pages.
// - For compatibility, requests to the old `/login` path are redirected to `/`.
// - Static assets and Next internals are excluded by the matcher below.

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Read session token cookie. Adjust the cookie name if you use a different one.
  const token = req.cookies.get("token")?.value ?? null;

  // Compatibility redirect: old login path -> new login root
  if (pathname === "/login" || pathname === "/login/") {
    const toRoot = req.nextUrl.clone();
    toRoot.pathname = LOGIN_ROUTE;
    return NextResponse.redirect(toRoot);
  }

  const isLoginPath =
    pathname === LOGIN_ROUTE || pathname === ROUTES.auth.legacyLogin;
  const isAuthApi =
    pathname.startsWith(ROUTES.api.auth.login.replace("/login", "")) ||
    pathname.startsWith("/api/auth");
  const isAgentApi = pathname.startsWith("/api/agent");
  const isMobileApi = pathname.startsWith("/api/mobile");
  const isRecoveryPath = pathname.startsWith("/recuperar-contrasena");

  if (!token) {
    // No session: allow only the login page, auth APIs and the agent webhook API.
    // External services (N8N, webhooks) can call /api/agent/* without authentication.
    if (isLoginPath || isAuthApi || isAgentApi || isMobileApi || isRecoveryPath || isRecoveryPath) {
      return NextResponse.next();
    }

    // Deny access to web API routes and protected pages when no token: redirect to login
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = LOGIN_ROUTE;
    return NextResponse.redirect(loginUrl);
  }

  // If there's a token, prevent visiting the login root and redirect to dashboard
  if (isLoginPath) {
    const dashboard = req.nextUrl.clone();
    dashboard.pathname = DEFAULT_REDIRECT;
    return NextResponse.redirect(dashboard);
  }

  // Check if the route exists - redirect to appropriate page if not found
  // Valid route patterns for authenticated users
  const validRoutes = [
    '/api/',
    '/recuperar-contrasena',
  ];

  // Valid dashboard subroutes
  const validDashboardRoutes = [
    '/dashboard',
    '/dashboard/orders',
    '/dashboard/installers',
    '/dashboard/crews',
    '/dashboard/inventory',
  ];

  // Check if it's a valid route (non-dashboard)
  const isValidNonDashboardRoute = validRoutes.some((route) => pathname.startsWith(route));
  
  // Check if it's a valid dashboard route
  const isValidDashboardRoute = validDashboardRoutes.some((route) => {
    // Exact match or dynamic route match (e.g., /dashboard/orders/[id])
    return pathname === route || 
           pathname.startsWith(route + '/') ||
           pathname === route + '/';
  });

  const isValidRoute = 
    isValidNonDashboardRoute || 
    isValidDashboardRoute ||
    pathname === '/'; // Root is valid (will redirect based on auth)

  // If route doesn't match any valid pattern, redirect based on auth status
  if (!isValidRoute) {
    const redirectUrl = req.nextUrl.clone();
    
    // Check if it's an invalid dashboard subroute
    const isInvalidDashboardSubroute = pathname.startsWith('/dashboard/');
    
    if (token) {
      // Logged in: redirect to dashboard with 404 indicator
      redirectUrl.pathname = DEFAULT_REDIRECT;
      if (isInvalidDashboardSubroute) {
        redirectUrl.searchParams.set('notFound', 'true');
        redirectUrl.searchParams.set('attempted', pathname);
      }
    } else {
      // Not logged in: redirect to login
      redirectUrl.pathname = LOGIN_ROUTE;
    }
    return NextResponse.redirect(redirectUrl);
  }

  // With a token, allow all requests to proceed. Note: for stronger security,
  // validate the token server-side (expiration, signature) in an API route or middleware.
  return NextResponse.next();
}

// Apply middleware to all routes except Next internals and static files.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
