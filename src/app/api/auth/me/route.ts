
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const role = cookieStore.get("role")?.value;

  if (!userId || !role) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch user from DB
  const user: Pick<User, "userId" | "name" | "email" | "role"> | null = await prisma.user.findUnique({
    where: { userId },
    select: { userId: true, name: true, email: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}