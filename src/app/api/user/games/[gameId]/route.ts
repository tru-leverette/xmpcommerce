import { getTokenFromHeader, verifyTokenAndUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Typings for response
export interface GameDetailResponse {
    game: {
        id: string;
        title: string;
        description: string;
        status: string;
        phase?: string;
        scavengerStones: number;
        joinedAt: string;
        participantCount: number;
        group?: {
            id: string;
            name: string;
            members: { id: string; username: string }[];
        } | null;
        badges: {
            id: string;
            name: string;
            description: string;
            imageUrl: string;
            earnedAt: string;
        }[];
        progress: {
            currentLevel: number;
            currentStage: number;
            currentHunt: number;
            currentClue: number;
            isCompleted: boolean;
        }[];
    } | null;
}

const ParamsSchema = z.object({
    gameId: z.string().min(1)
});

export async function GET(req: NextRequest, { params }: { params: { gameId: string } }) {
    try {
        const authHeader = req.headers.get('authorization');
        const token = getTokenFromHeader(authHeader);
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = await verifyTokenAndUser(token);
        if (!user?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { gameId } = ParamsSchema.parse(params);

        // Find participant for this user and game
        const participant = await prisma.participant.findUnique({
            where: {
                userId_gameId: {
                    userId: user.userId,
                    gameId
                }
            },
            include: {
                game: true,
                progress: {
                    include: { badges: true }
                },
                // Add group and group members if you have group logic
            }
        });
        if (!participant) {
            return NextResponse.json({ game: null }, { status: 404 });
        }

        // Count participants in the game
        const participantCount = await prisma.participant.count({
            where: { gameId }
        });

        // Map badges (flatten all progress badges)
        const badges = (participant.progress || [])
            .flatMap((prog) =>
                (prog.badges || []).map((badge) => ({
                    id: badge.id,
                    name: badge.name,
                    description: badge.description ?? '',
                    imageUrl: badge.imageUrl ?? '',
                    earnedAt: badge.earnedAt.toISOString()
                }))
            );

        // Map progress
        const progress = (participant.progress || []).map((prog) => ({
            currentLevel: prog.currentLevel,
            currentStage: prog.currentStage,
            currentHunt: prog.currentHunt,
            currentClue: prog.currentClue,
            isCompleted: prog.isStageCompleted || prog.isLevelCompleted
        }));

        // Group info (if you have group logic, add here)
        const group = null;

        return NextResponse.json({
            game: {
                id: participant.game.id,
                title: participant.game.title,
                description: participant.game.description,
                status: participant.game.status,
                phase: participant.game.phase,
                scavengerStones: participant.scavengerStones,
                joinedAt: participant.joinedAt.toISOString(),
                participantCount,
                group,
                badges,
                progress
            }
        } satisfies GameDetailResponse, { status: 200 });
    } catch (error) {
        // Robust error handling
        console.error('Error in GET /api/user/games/[gameId]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
