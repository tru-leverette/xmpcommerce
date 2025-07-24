import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { clueSetId: string } }) {
    try {
        const clueSetId = params.clueSetId;
        if (!clueSetId) return NextResponse.json({ error: 'Missing clueSetId' }, { status: 400 });
        // Find all hunts for this clue set
        const hunts = await prisma.hunt.findMany({
            where: { clueSetId },
            select: { id: true },
        });
        const huntIds = hunts.map(h => h.id);
        if (huntIds.length === 0) return NextResponse.json({ clues: [] });
        const clues = await prisma.clue.findMany({
            where: { huntId: { in: huntIds } },
            orderBy: { clueNumber: 'asc' },
            select: {
                id: true,
                clueNumber: true,
                question: true,
                answer: true,
                hint: true,
                type: true,
            },
        });
        return NextResponse.json({ clues });
    } catch (error) {
        console.error('Admin clue fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
