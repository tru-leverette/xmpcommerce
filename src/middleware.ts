import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  void request

  const isAuth = request.cookies.get("auth")?.value === "true";
  const isHub = request.nextUrl.pathname.startsWith("/hub");
  const isLogin = request.nextUrl.pathname === "/login";
  const userId = request.cookies.get("userId")?.value;

  // Protect /hub
  if (isHub && !isAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from /login
  if (isLogin && isAuth && userId) {
    return NextResponse.redirect(new URL(`/hub/users/${userId}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/hub/:path*", "/login"],
};