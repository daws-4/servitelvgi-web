import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware rules (swapped routes):
// - The login page is now `/` (was `/login`). The protected home is `/dashboard` (was `/`).
// - If no session (no `token` cookie): allow `/` (login) and auth APIs, redirect other pages to `/`.
// - If session exists: prevent access to `/` (login) and redirect to `/dashboard`, allow other pages.
// - For compatibility, requests to the old `/login` path are redirected to `/`.
// - Static assets and Next internals are excluded by the matcher below.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Read session token cookie. Adjust the cookie name if you use a different one.
  const token = req.cookies.get("token")?.value ?? null;

  // Compatibility redirect: old login path -> new login root
  if (pathname === "/login" || pathname === "/login/") {
    const toRoot = req.nextUrl.clone();
    toRoot.pathname = "/";
    return NextResponse.redirect(toRoot);
  }

  const isLoginPath = pathname === "/" || pathname === "/"; // new login is /
  const isAuthApi = pathname.startsWith("/api/auth");
  const isAgentApi = pathname.startsWith("/api/agent");

  if (!token) {
    // No session: allow only the login page (now `/`), auth APIs and agent webhook API.
    // This lets external services (N8N, webhooks) call /api/agent/* without being redirected.
    if (isLoginPath || isAuthApi || isAgentApi) {
      return NextResponse.next();
    }

    // Redirect other requests to the login root `/`
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/";
    return NextResponse.redirect(loginUrl);
  }

  // There is a token: prevent visiting the login root `/` and send to /dashboard
  if (pathname === "/" || pathname === "/") {
    const dashboard = req.nextUrl.clone();
    dashboard.pathname = "/dashboard";
    return NextResponse.redirect(dashboard);
  }

  // Otherwise allow the request. Note: consider verifying the token server-side
  // for stronger security (expiration, signature).
  return NextResponse.next();
}

// Apply middleware to all routes except Next internals and static files.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
