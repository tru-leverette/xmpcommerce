import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Set the auth cookie
  const response = NextResponse.json({ success: true, message: 'Login successful' });
  response.cookies.set('auth', 'true', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 3, // 3 hours in seconds
  });

  return response;
}