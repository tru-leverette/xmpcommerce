
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
        const currentStage = progress?.stageId || null;
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
            pebbles: participant.pebbles ?? 0,
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
        const { gameId } = await params
        const { clueNumber, isCorrect, submissionData } = await request.json() // eslint-disable-line @typescript-eslint/no-unused-vars

        // Authentication would be checked here
        // const authHeader = request.headers.get('authorization')
        // const token = getTokenFromHeader(authHeader)
        // if (!token) {
        //   return NextResponse.json(
        //     { error: 'Authentication required' },
        //     { status: 401 }
        //   )
        // }

        // const decoded = verifyToken(token)

        if (isCorrect) {
            // In production, update user progress in database:
            // await prisma.participant.update({
            //   where: {
            //     userId_gameId: {
            //       userId: decoded.userId,
            //       gameId
            //     }
            //   },
            //   data: {
            //     currentClue: clueNumber + 1,
            //     pebbles: { increment: 10 },
            //     lastPlayedAt: new Date()
            //   }
            // })

            // Create clue submission record:
            // await prisma.clueSubmission.create({
            //   data: {
            //     participantId: participant.id,
            //     clueId: submissionData.clueId,
            //     submissionType: submissionData.type,
            //     textAnswer: submissionData.textAnswer,
            //     photoUrl: submissionData.photoUrl,
            //     isCorrect: true,
            //     aiAnalysis: submissionData.aiAnalysis
            //   }
            // })

            console.log('Progress updated for game:', gameId, 'clue:', clueNumber)
        }

        // Return updated progress
        const nextClueNumber = isCorrect ? clueNumber + 1 : clueNumber
        const isGameComplete = isCorrect && nextClueNumber > 10

        return NextResponse.json({
            success: true,
            nextClueNumber: isGameComplete ? null : nextClueNumber,
            isGameComplete,
            pebblesEarned: isCorrect ? 10 : 0
        })

    } catch (error) {
        console.error('Error updating progress:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
