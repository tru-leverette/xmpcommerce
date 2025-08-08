
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET user's current progress for a game
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    try {
        const { gameId } = await params;
        // Authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid or expired authentication token' }, { status: 401 });
        }

        // Find participant for this user/game
        const participant = await prisma.participant.findFirst({
            where: {
                userId: decoded.userId,
                gameId: gameId
            },
            include: {
                progress: true,
                submissions: {
                    where: { isCorrect: true },
                    orderBy: { submittedAt: 'asc' }
                }
            }
        });
        if (!participant) {
            return NextResponse.json({ error: 'No progress found for this user in this game' }, { status: 404 });
        }

        // Use the first progress record (if any)
        const progress = Array.isArray(participant.progress) && participant.progress.length > 0 ? participant.progress[0] : null;
        let currentStage = null;
        let stageNumber = null;
        if (progress?.stageId) {
            const stage = await prisma.stage.findUnique({ where: { id: progress.stageId }, select: { stageNumber: true } });
            stageNumber = stage?.stageNumber || null;
        }
        currentStage = stageNumber;
        const currentLevel = progress?.currentLevel || 1;
        const currentHunt = progress?.currentHunt || 1;
        const currentClue = progress?.currentClue || 1;

        // Compose response
        const result = {
            currentLevel,
            currentStage,
            currentHunt,
            currentClue,
            currentClueNumber: currentClue,
            isStageCompleted: progress?.isStageCompleted ?? false,
            isLevelCompleted: progress?.isLevelCompleted ?? false,
            isGameComplete: false, // TODO: implement
            stagesCompletedInLevel: progress?.stagesCompletedInLevel ?? 0,
            canAdvanceToNextStage: progress?.canAdvanceToNextStage ?? false,
            canAdvanceToNextLevel: progress?.canAdvanceToNextLevel ?? false,
            scavengerStones: participant.scavengerStones ?? 0,
            lastLocation: {
                latitude: participant.currentLatitude ?? null,
                longitude: participant.currentLongitude ?? null,
                isValid: typeof participant.currentLatitude === 'number' && typeof participant.currentLongitude === 'number'
            },
            completedClues: participant.submissions.map((cs: { id: string }) => cs.id),
            completedHunts: [],
            completedStages: [],
            completedLevels: [],
            badges: [],
            totalClues: 4, // TODO: fetch from game config
            totalLevels: 12, // TODO: fetch from game config
            totalStagesPerLevel: 4, // TODO: fetch from game config
            totalCluesPerStage: 4, // TODO: fetch from game config
            startedAt: participant.joinedAt?.toISOString() ?? null,
            lastPlayedAt: participant.updatedAt?.toISOString() ?? null,
            completedAt: progress?.completedAt?.toISOString() ?? null
        };
        return NextResponse.json({ progress: result });
    } catch (error) {
        console.error('Error fetching progress:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST update user's progress (when they complete a clue)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    try {
        const { gameId } = await params;
        const { clueNumber, isCorrect } = await request.json();

        // Find participant and their current progress
        const participant = await prisma.participant.findFirst({
            where: { gameId },
            include: {
                progress: true,
                submissions: {
                    where: { isCorrect: true },
                    orderBy: { submittedAt: 'asc' }
                }
            }
        });
        if (!participant) {
            return NextResponse.json({ error: 'No progress found for this user in this game' }, { status: 404 });
        }
        const progress = Array.isArray(participant.progress) && participant.progress.length > 0 ? participant.progress[0] : null;
        if (!progress) {
            return NextResponse.json({ error: 'No progress record found for this participant.' }, { status: 404 });
        }
        let nextClueNumber = clueNumber;

        // Fetch stage and level info (handle missing stageId)
        let stage = null;
        let level = null;
        let levelNumber = 1;
        let stageNumber = 1;
        if (progress.stageId) {
            stage = await prisma.stage.findUnique({
                where: { id: progress.stageId },
                select: { id: true, badgeName: true, badgeDescription: true, badgeImage: true, levelId: true, stageNumber: true }
            });
            if (stage?.levelId) {
                level = await prisma.level.findUnique({ where: { id: stage.levelId }, select: { id: true, levelNumber: true } });
                levelNumber = level?.levelNumber || 1;
            }
            stageNumber = stage?.stageNumber || 1;
        }

        // Get all clues in this stage (handle missing stageId)
        let allClues: { clueNumber: number }[] = [];
        let currentIndex = -1;
        if (progress.stageId) {
            allClues = await prisma.clue.findMany({
                where: {
                    hunt: {
                        stageId: progress.stageId,
                        ...(participant.clueSetId && { clueSetId: participant.clueSetId })
                    }
                },
                orderBy: { clueNumber: 'asc' }
            });
            currentIndex = allClues.findIndex((c: { clueNumber: number }) => c.clueNumber === clueNumber);
        }

        if (isCorrect) {
            // Always update to the next step if answered correctly
            const TOTAL_STAGES = 4;
            const TOTAL_LEVELS = 12;
            if (currentIndex < allClues.length - 1) {
                // Progress to next clue in this stage
                nextClueNumber = allClues[currentIndex + 1].clueNumber;
                await prisma.participantProgress.update({
                    where: { id: progress.id },
                    data: { currentClue: nextClueNumber }
                });
            } else {
                // Stage complete: mark progress as complete
                await prisma.participantProgress.update({
                    where: { id: progress.id },
                    data: { completedAt: new Date() }
                });
                // Award stage badge
                await prisma.badge.create({
                    data: {
                        name: stage?.badgeName || 'Stage Complete',
                        description: stage?.badgeDescription || 'Completed all clues in this stage',
                        imageUrl: stage?.badgeImage || `/assets/badges/level${levelNumber}_stage${stageNumber}.png`,
                        badgeType: 'STAGE',
                        levelNumber,
                        stageNumber,
                        progressId: progress.id
                    }
                });
                if (stageNumber < TOTAL_STAGES) {
                    // Find the next stage in this level
                    let nextStage = null;
                    if (stage) {
                        nextStage = await prisma.stage.findFirst({
                            where: {
                                levelId: stage.levelId,
                                stageNumber: stageNumber + 1
                            },
                            select: { id: true }
                        });
                    }
                    if (nextStage) {
                        const newProgress = await prisma.participantProgress.create({
                            data: {
                                participantId: participant.id,
                                stageId: nextStage.id,
                                currentClue: 1
                            }
                        });
                        // Update participant's progress reference
                        try {
                            const patchRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/games/${gameId}/participants`, {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: request.headers.get('authorization') || ''
                                },
                                body: JSON.stringify({ participantId: participant.id, progressId: newProgress.id })
                            });
                            if (!patchRes.ok) {
                                const err = await patchRes.json();
                                throw new Error(`Failed to update participant progress: ${err.error || patchRes.status}`);
                            }
                        } catch (err) {
                            console.error('Error updating participant progress reference:', err);
                        }
                    }
                } else if (levelNumber < TOTAL_LEVELS) {
                    // All stages in this level complete, award level badge
                    await prisma.badge.create({
                        data: {
                            name: `Level ${levelNumber} Platinum`,
                            description: `Earned by completing all 4 stages in Level ${levelNumber}`,
                            imageUrl: `/assets/badges/level${levelNumber}_platinum.png`,
                            badgeType: 'LEVEL',
                            levelNumber,
                            stageNumber: null,
                            progressId: progress.id
                        }
                    });
                    // Find the first stage of the next level
                    const nextLevel = await prisma.level.findFirst({
                        where: {
                            gameId: participant.gameId,
                            levelNumber: levelNumber + 1
                        },
                        select: { id: true }
                    });
                    if (nextLevel) {
                        const firstStage = await prisma.stage.findFirst({
                            where: {
                                levelId: nextLevel.id,
                                stageNumber: 1
                            },
                            select: { id: true }
                        });
                        if (firstStage) {
                            const newProgress = await prisma.participantProgress.create({
                                data: {
                                    participantId: participant.id,
                                    stageId: firstStage.id,
                                    currentClue: 1
                                }
                            });
                            // Update participant's progress reference
                            try {
                                const patchRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/games/${gameId}/participants`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: request.headers.get('authorization') || ''
                                    },
                                    body: JSON.stringify({ participantId: participant.id, progressId: newProgress.id })
                                });
                                if (!patchRes.ok) {
                                    const err = await patchRes.json();
                                    throw new Error(`Failed to update participant progress: ${err.error || patchRes.status}`);
                                }
                            } catch (err) {
                                console.error('Error updating participant progress reference:', err);
                            }
                        }
                    }
                } else {
                    // All levels, stages complete (do nothing)
                }
            }
        }

        return NextResponse.json({
            success: true
        });

    } catch (error) {
        console.error('Error updating progress:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
