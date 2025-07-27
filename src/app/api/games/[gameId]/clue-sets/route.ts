import { verifyToken } from '@/lib/auth';
import {
    calculateDistance,
    createClueSet,
    findExistingClueSet,
    type Location
} from '@/lib/clueSetManager';
import { prisma } from '@/lib/prisma';
import { Phase } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to demonstrate clue set assignment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
): Promise<NextResponse> {
    try {
        const resolvedParams = await params;
        const gameId: string = resolvedParams.gameId;
        // Verify authentication
        const authHeader: string | null = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token: string = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        let body: { lat: number; lng: number; action: string };
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
        const { lat, lng, action } = body;
        if (typeof lat !== 'number' || typeof lng !== 'number' || typeof action !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
        }
        const location: Location = { lat, lng };

        // Ensure game exists
        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (!game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        if (action === 'test-assignment') {
            // Get participant progression and associated clueSet
            const participant = await prisma.participant.findFirst({
                where: { gameId, userId: decoded.userId },
                include: { progress: true, clueSet: true }
            });
            if (!participant || !participant.progress || participant.progress.length === 0) {
                return NextResponse.json({ error: 'Participant or progress not found' }, { status: 404 });
            }
            const progress = participant.progress[0];
            const { phase, currentLevel, currentStage } = progress;
            let clueSet = participant.clueSet;
            let created = false;
            // If no clueSet association, use location to find or create one (Phase 1 only)
            if (!clueSet) {
                const foundClueSet = await findExistingClueSet(gameId, location);
                clueSet = foundClueSet
                    ? {
                        ...foundClueSet,
                        levelNumber: foundClueSet.levelNumber ?? currentLevel,
                        phase: foundClueSet.phase as Phase
                    }
                    : null;
                if (!clueSet) {
                    const locationName = `ClueSet-${Math.round(location.lat * 1000)}-${Math.round(location.lng * 1000)}`;
                    clueSet = await createClueSet({
                        gameId,
                        location,
                        name: locationName,
                        description: `Auto-generated clue set for location ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
                        phase,
                        level: currentLevel,
                        stage: currentStage,
                        cluesCount: 4,
                        stageId: '' // will be set below
                    });
                    created = true;
                }
                // Associate clueSet to participant
                await prisma.participant.update({
                    where: { id: participant.id },
                    data: { clueSet: { connect: { id: clueSet.id } } }
                });
            }
            // Find or create level
            let level = await prisma.level.findFirst({ where: { gameId, levelNumber: currentLevel } });
            if (!level) {
                level = await prisma.level.create({
                    data: {
                        gameId,
                        levelNumber: currentLevel,
                        name: `Level ${currentLevel}`,
                        description: `Auto-created Level ${currentLevel}`,
                    },
                });
            }
            // Find or create stage
            let stage = await prisma.stage.findFirst({ where: { levelId: level.id, stageNumber: currentStage } });
            if (!stage) {
                stage = await prisma.stage.create({
                    data: {
                        levelId: level.id,
                        stageNumber: currentStage,
                        name: `Stage ${currentStage}`,
                        description: `Auto-created Stage ${currentStage}`,
                    },
                });
            }
            const stageId: string = stage.id;
            // Find or create hunt for this clueSet and stage
            let hunt = await prisma.hunt.findFirst({ where: { clueSetId: clueSet.id, stageId } });
            if (!hunt) {
                hunt = await prisma.hunt.create({
                    data: {
                        stageId,
                        clueSetId: clueSet.id,
                        huntNumber: 1,
                        name: `Hunt for ClueSet ${clueSet.name} Stage ${currentStage}`,
                        description: `Auto-generated hunt for ClueSet ${clueSet.name} Stage ${currentStage}`,
                    }
                });
            }
            // Check if clues exist for this hunt
            const cluesForStage = await prisma.clue.findMany({ where: { huntId: hunt.id } });
            if (cluesForStage.length === 0) {
                // Generate clues for this hunt
                for (let i = 1; i <= 4; i++) {
                    await prisma.clue.create({
                        data: {
                            huntId: hunt.id,
                            clueNumber: i,
                            question: `Auto-generated clue ${i} for Stage ${currentStage}`,
                            type: 'TEXT_ANSWER',
                            isActive: true,
                            aiGenerated: true,
                            answer: 'test',
                        }
                    });
                }
            }
            const distance = calculateDistance(
                location,
                { lat: clueSet.centerLatitude, lng: clueSet.centerLongitude }
            );
            const response = {
                id: clueSet.id,
                name: clueSet.name,
                description: clueSet.description,
                center: {
                    lat: clueSet.centerLatitude,
                    lng: clueSet.centerLongitude
                },
                radius: `${clueSet.radiusKm} km`,
                distance: `${distance.toFixed(2)} km`,
                created
            };
            return NextResponse.json({ result: created ? 'created' : 'existing_clue_set', clueSet: response });
        }

        if (action === 'create-test-clue-set') {
            let level = await prisma.level.findFirst({ where: { gameId } });
            if (!level) {
                level = await prisma.level.create({
                    data: {
                        gameId,
                        levelNumber: 1,
                        name: 'Level 1',
                        description: 'Auto-created Level 1',
                    },
                });
            }
            let stage = await prisma.stage.findFirst({ where: { levelId: level.id } });
            if (!stage) {
                stage = await prisma.stage.create({
                    data: {
                        levelId: level.id,
                        stageNumber: 1,
                        name: 'Stage 1',
                        description: 'Auto-created Stage 1',
                    },
                });
            }
            const locationName = `Test-${Math.round(lat * 1000)}-${Math.round(lng * 1000)}`;
            const clueSet = await createClueSet({
                gameId,
                location,
                name: locationName,
                description: `Test clue set for location ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                phase: 'PHASE_1',
                level: 1,
                stage: 1,
                cluesCount: 4,
                stageId: stage.id
            });

            return NextResponse.json({
                result: 'created',
                clueSet: {
                    id: clueSet.id,
                    name: clueSet.name,
                    description: clueSet.description,
                    center: {
                        lat: clueSet.centerLatitude,
                        lng: clueSet.centerLongitude
                    },
                    radius: `${clueSet.radiusKm} km`
                }
            });
        }

        if (action === 'list-clue-sets') {
            const clueSets = await prisma.clueSet.findMany({
                where: { gameId, isActive: true },
                include: {
                    participants: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    username: true
                                }
                            }
                        }
                    }
                }
            });

            const clueSetInfo = clueSets.map((cs: {
                id: string;
                name: string;
                description: string | null;
                centerLatitude: number;
                centerLongitude: number;
                radiusKm: number;
                participants: Array<{ id: string; user: { username: string } }>;
            }) => ({
                id: cs.id,
                name: cs.name,
                description: cs.description,
                center: {
                    lat: cs.centerLatitude,
                    lng: cs.centerLongitude
                },
                radius: `${cs.radiusKm} km`,
                participantCount: cs.participants.length,
                participants: cs.participants.map((p: { user: { username: string } }) => p.user.username)
            }));

            return NextResponse.json({
                result: 'listed',
                clueSets: clueSetInfo
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: unknown) {
        let message = 'Internal server error';
        let details = '';
        if (error instanceof Error) {
            message = error.message;
            details = error.stack || '';
            // Log only non-OpenAI key errors to avoid leaking config
            if (!message.includes('OpenAI API key')) {
                console.error('Error in clue set test:', error);
            }
        } else {
            console.error('Unknown error in clue set test:', error);
        }
        // If OpenAI key/config error, return 500 with clear message
        if (message.includes('OpenAI API key')) {
            return NextResponse.json({ error: message }, { status: 500 });
        }
        return NextResponse.json({ error: message, details }, { status: 500 });
    }
}
