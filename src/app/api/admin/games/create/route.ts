import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { location } = await req.json();

    // Get userId from cookies (set on login)
    const userId = req.cookies.get("userId")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden: SuprerAdmins only" }, { status: 403 });
    }

    const game = await prisma.game.create({
      data: {
        gameId: nanoid(12),
        location,
        status: "PENDING",
        createdAt: new Date(),
        createdBy: { connect: { id: user.id } },
      },
    });

    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to launch game" }, { status: 500 });
  }
}