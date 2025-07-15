import { NextRequest, NextResponse } from 'next/server'

// Dynamic route configuration to prevent static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy load dependencies to avoid build-time issues
const loadDependencies = async () => {
  const { prisma } = await import('@/lib/prisma')
  const { verifyTokenAndUser, getTokenFromHeader } = await import('@/lib/auth')
  return { prisma, verifyTokenAndUser, getTokenFromHeader }
}

// SECURE stage advancement endpoint
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { prisma, verifyTokenAndUser, getTokenFromHeader } = await loadDependencies()
    const { gameId } = await params
    const authHeader = request.headers.get('authorization')
    
    // Enhanced authentication
    const token = getTokenFromHeader(authHeader)
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = await verifyTokenAndUser(token)
    const { targetStageId } = await request.json()

    if (!targetStageId) {
      return NextResponse.json(
        { error: 'Target stage ID is required' },
        { status: 400 }
      )
    }

    // 🔒 SECURITY: Fetch ALL data from database - NEVER trust client
    const participant = await prisma.participant.findUnique({
      where: {
        userId_gameId: {
          userId: decoded.userId,
          gameId
        }
      },
      include: {
        progress: {
          include: {
            stage: true
          }
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Not a participant in this game' },
        { status: 403 }
      )
    }

    // 🔒 SECURITY: Get target stage requirements from database
    const targetStage = await prisma.stage.findUnique({
      where: { id: targetStageId },
      select: {
        id: true,
        stageNumber: true,
        requiredStones: true,
        requiredPebbles: true,
        levelId: true,
        level: {
          select: {
            levelNumber: true
          }
        }
      }
    })

    if (!targetStage) {
      return NextResponse.json(
        { error: 'Target stage not found' },
        { status: 404 }
      )
    }

    // 🔒 SECURITY: Server-side validation ONLY
    const canAdvance = validateAdvancement(participant, targetStage)
    
    if (!canAdvance.allowed) {
      return NextResponse.json(
        { error: canAdvance.reason },
        { status: 403 }
      )
    }

    // 🔒 SECURITY: Atomic transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Deduct stones (server controls the amounts)
      await tx.participant.update({
        where: { id: participant.id },
        data: {
          scavengerStones: {
            decrement: targetStage.requiredStones
          },
          pebbles: {
            decrement: targetStage.requiredPebbles
          }
        }
      })

      // Update progress
      const updatedProgress = await tx.participantProgress.upsert({
        where: {
          participantId_stageId: {
            participantId: participant.id,
            stageId: targetStageId
          }
        },
        create: {
          participantId: participant.id,
          stageId: targetStageId,
          currentLevel: targetStage.level.levelNumber,
          currentStage: targetStage.stageNumber,
          currentHunt: 1,
          currentClue: 1
        },
        update: {
          currentLevel: targetStage.level.levelNumber,
          currentStage: targetStage.stageNumber,
          currentHunt: 1,
          currentClue: 1
        }
      })

      return updatedProgress
    })

    // Log advancement activity
    await prisma.activity.create({
      data: {
        type: 'GAME_REGISTERED', // We should add STAGE_ADVANCED
        description: `Advanced to stage ${targetStage.stageNumber} (Level ${targetStage.level.levelNumber})`,
        userId: decoded.userId,
        details: {
          gameId,
          stageId: targetStageId,
          stonesSpent: targetStage.requiredStones,
          pebblesSpent: targetStage.requiredPebbles
        }
      }
    })

    return NextResponse.json({
      message: 'Successfully advanced to next stage',
      progress: result
    })

  } catch (error) {
    console.error('Stage advancement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 🔒 SECURITY: Server-side validation function
function validateAdvancement(
  participant: {
    scavengerStones: number;
    pebbles: number;
    progress: Array<{
      currentStage: number;
      currentLevel: number;
    }>;
  },
  targetStage: {
    requiredStones: number;
    requiredPebbles: number;
    stageNumber: number;
    level: {
      levelNumber: number;
    };
  }
): { allowed: boolean; reason?: string } {
  // Check if user has enough stones
  if (participant.scavengerStones < targetStage.requiredStones) {
    return {
      allowed: false,
      reason: `Insufficient scavenger stones. Required: ${targetStage.requiredStones}, You have: ${participant.scavengerStones}`
    }
  }

  // Check if user has enough pebbles  
  if (participant.pebbles < targetStage.requiredPebbles) {
    return {
      allowed: false,
      reason: `Insufficient pebbles. Required: ${targetStage.requiredPebbles}, You have: ${participant.pebbles}`
    }
  }

  // Additional validation: Check stage progression order
  const currentStage = participant.progress?.[0]?.currentStage || 0
  const currentLevel = participant.progress?.[0]?.currentLevel || 1
  
  if (targetStage.level.levelNumber > currentLevel + 1) {
    return {
      allowed: false,
      reason: 'Cannot skip levels'
    }
  }

  if (targetStage.level.levelNumber === currentLevel && targetStage.stageNumber > currentStage + 1) {
    return {
      allowed: false,
      reason: 'Cannot skip stages'
    }
  }

  return { allowed: true }
}
