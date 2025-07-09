import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, country } = await req.json();

    if (!name || !email || !password || !country) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: 'User already exists.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        userId: nanoid(11), // e.g., "g4YwuTTqNNA"
        name,
        email,
        password: hashedPassword,
        country
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful!',
      createdAt: user.createdAt
    }, { status: 200 });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }
  // Don't return password!
  const { password, ...userWithoutPassword } = user;
  void password; //for linting purposes, explicitly mark as intentionally unused
  return NextResponse.json(userWithoutPassword, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    await prisma.user.delete({ where: { email } });

    return NextResponse.json({ success: true, message: 'User deleted.' }, { status: 200 });
  } catch (err) {
    console.error('Delete user error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { email, ...updateData } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Remove password2 if present (from form)
    if ('password2' in updateData) delete updateData.password2;

    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: updateData,
    });

    // Don't return password
    const { password, ...userWithoutPassword } = updatedUser;
    void password; //for linting purposes, explicitly mark as intentionally unused
    return NextResponse.json({ success: true, user: userWithoutPassword }, { status: 200 });
  } catch (err) {
    console.error('Update user error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}