import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId, gameId, participantStatus } = await req.json();

    if (!userId || !gameId) {
      return NextResponse.json({ error: "Missing userId or gameId" }, { status: 400 });
    }

    const participant = await prisma.participant.create({
      data: {
        userId,
        gameId,
        participantStatus: participantStatus || "PENDING",
      },
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    void error
    return NextResponse.json({ error: "Failed to create participant" }, { status: 500 });
  }
}