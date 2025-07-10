import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Expire cookies by setting them to empty and an immediate expiry date
  response.cookies.set("auth", "", { path: "/", httpOnly: true, expires: new Date(0) });
  response.cookies.set("userId", "", { path: "/", httpOnly: true, expires: new Date(0) });
  response.cookies.set("role", "", { path: "/", httpOnly: true, expires: new Date(0) });

  return response;
}