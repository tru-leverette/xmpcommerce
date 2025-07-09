import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    void req
  // Clear the auth cookie by setting it to empty and expired
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('auth', '', { httpOnly: true, path: '/', expires: new Date(0) });
  return response;
}