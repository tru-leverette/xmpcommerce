import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuth = request.cookies.get("auth")?.value === "true";
  const isHub = request.nextUrl.pathname.startsWith("/hub");
  const isAdminHub = request.nextUrl.pathname.startsWith("/adminHub");
  const isLogin = request.nextUrl.pathname === "/login";
  const userId = request.cookies.get("userId")?.value;
  const role = request.cookies.get("role")?.value;

  // Protect /hub
  if (isHub && !isAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect /adminHub
  if (isAdminHub && (role !== "ADMIN" && role !== "SUPERADMIN")) {
    console.log(role)
    return NextResponse.redirect(new URL(`/hub/users/${userId}`, request.url));
  }

  // Redirect authenticated users away from /login
  if (isLogin && isAuth && userId) {
    return NextResponse.redirect(new URL(`/hub/users/${userId}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/hub/:path*", "/adminHub/:path*", "/login"],
};