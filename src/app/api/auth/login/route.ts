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

  const response = NextResponse.json({
    success: true,
    user: {
      userId: user.userId,
      role: user.role,
      name: user.name,
      email: user.email,
      // add other fields as needed
    }
  });
  response.cookies.set('auth', 'true', { path: '/', httpOnly: true });
  response.cookies.set('userId', user.userId, { path: '/', httpOnly: true });
  response.cookies.set('role', user.role, { path: '/', httpOnly: true });

  return response;
}