import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { gameId: string } }) {
    try {
        const gameId = params.gameId;
        if (!gameId) return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
        const game = await prisma.game.findUnique({
            where: { id: gameId },
            include: {
                levels: { include: { stages: true } },
                clueSets: true,
                participants: { select: { id: true } },
            },
        });
        if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        // Attach phase to each level if not present
        type LevelWithStages = typeof game.levels[number] & { phase?: string };
        const levelsWithPhase: LevelWithStages[] = game.levels.map((level) => ({ ...level, phase: game.phase }));
        return NextResponse.json({ game: { ...game, levels: levelsWithPhase, phase: game.phase } });
    } catch (error) {
        console.error('Admin game fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
