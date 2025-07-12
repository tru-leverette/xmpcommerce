import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userPk = cookieStore.get("userPk")?.value; // <-- get userPk from cookie

    const { gameId, participantStatus } = await req.json();

    if (!userPk || !gameId) {
      return NextResponse.json({ error: "Missing userId or gameId" }, { status: 400 });
    }

    await prisma.participant.create({
      data: {
        userId: Number(userPk),
        gameId: Number(gameId),
        participantStatus: participantStatus || "PENDING",
      },
    });
    const user = await prisma.user.findUnique({
      where: { id: Number(userPk) },
      include: { participants: true },
    });
    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("Failed to create participant:", error);
    return NextResponse.json({ error: "Failed to create participant" }, { status: 500 });
  }
}