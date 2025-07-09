import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set("auth", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0), // Expire immediately
  });
  return response;
}