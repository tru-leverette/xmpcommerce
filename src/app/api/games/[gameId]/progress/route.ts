import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma'
// import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// GET user's current progress for a game
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    try {
        const { gameId } = await params // eslint-disable-line @typescript-eslint/no-unused-vars

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

        // In production, query user's progress from database:
        // const participant = await prisma.participant.findUnique({
        //   where: {
        //     userId_gameId: {
        //       userId: decoded.userId,
        //       gameId
        //     }
        //   },
        //   include: {
        //     clueSubmissions: {
        //       where: { isCorrect: true },
        //       orderBy: { createdAt: 'asc' }
        //     }
        //   }
        // })

        // For now, return mock progress data
        // In a real app, this would come from database queries
        const mockProgress = {
            // Current position in game
            currentLevel: 1,
            currentStage: 1,
            currentHunt: 1,
            currentClue: 1,
            currentClueNumber: 1, // For simplified UI display (backwards compatibility)

            // Completion status
            isStageCompleted: false,
            isLevelCompleted: false,
            isGameComplete: false,
            stagesCompletedInLevel: 0,

            // Advancement eligibility
            canAdvanceToNextStage: false,
            canAdvanceToNextLevel: false,

            // Resources
            pebbles: 1000, // Starting amount
            scavengerStones: 0,

            // Location tracking
            lastLocation: {
                latitude: null,
                longitude: null,
                isValid: false
            },

            // Completed items (arrays of IDs)
            completedClues: [], // ClueSubmission IDs where isCorrect=true
            completedHunts: [],
            completedStages: [],
            completedLevels: [],

            // Badges earned
            badges: [
                // {
                //   id: "badge-1",
                //   name: "Stage 1 Explorer", 
                //   badgeType: "STAGE",
                //   levelNumber: 1,
                //   stageNumber: 1,
                //   earnedAt: "2025-07-16T10:30:00Z"
                // }
            ],

            // Game metadata
            totalClues: 10, // Simplified for current mock system
            totalLevels: 12,
            totalStagesPerLevel: 4,
            totalCluesPerStage: 4,

            // Timestamps
            startedAt: new Date().toISOString(),
            lastPlayedAt: new Date().toISOString(),
            completedAt: null
        }

        return NextResponse.json({
            progress: mockProgress
        })

    } catch (error) {
        console.error('Error fetching progress:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
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
