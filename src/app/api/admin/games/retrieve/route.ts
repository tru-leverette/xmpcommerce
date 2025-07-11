// filepath: src/app/api/games/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      where: {
        status: { not: "FINISHED" }
      }
    });
    return NextResponse.json(games);
  } catch (error) {
    console.log (error);
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}