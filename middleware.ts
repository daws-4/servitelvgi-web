import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware rules:
// - If no session (no `token` cookie): allow `/` and `/login` and auth APIs, redirect other pages to `/login`.
// - If session exists: prevent access to `/login` (redirect to `/`), allow other pages.
// - Static assets and Next internals are excluded by the matcher below.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Read session token cookie. Adjust the cookie name if you use a different one.
  const token = req.cookies.get("token")?.value ?? null;

  // Allow unauthenticated access only to the login page and authentication APIs.
  // The root `/` will require a session and will redirect to `/login` when no session.
  const isLoginPath = pathname === "/login" || pathname === "/login/";
  const isRoot = pathname === "/";
  const isAuthApi = pathname.startsWith("/api/auth");

  if (!token) {
    // No session: allow only login and auth APIs. Root `/` is NOT allowed and
    // will be redirected to `/login` by the fallback below.
    if (isLoginPath || isAuthApi) {
      return NextResponse.next();
    }

    // Redirect other requests (including `/`) to /login
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // There is a token: prevent visiting /login (redirect to home)
  if (isLoginPath) {
    const home = req.nextUrl.clone();
    home.pathname = "/";
    return NextResponse.redirect(home);
  }

  // Otherwise allow the request. Note: you may want to verify the token
  // server-side in API routes or perform JWT validation here.
  return NextResponse.next();
}

// Apply middleware to all routes except Next internals and static files.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
