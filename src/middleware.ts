import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuth = request.cookies.get("auth")?.value === "true";
  const isHub = request.nextUrl.pathname.startsWith("/hub");

  if (isHub && !isAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Optionally, only run on /hub routes:
export const config = {
  matcher: ["/hub/:path*"],
};