import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {

  const isAuth = request.cookies.get("auth")?.value === "true";
  const isHub = request.nextUrl.pathname.startsWith("/hub");
  const isLogin = request.nextUrl.pathname === "/login";

  // Protect /hub
  if (isHub && !isAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from /login
  if (isLogin && isAuth) {
    return NextResponse.redirect(new URL("/hub", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/hub/:path*", "/login"],
};