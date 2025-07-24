import { NextRequest, NextResponse } from 'next/server';

// Dynamic route configuration to prevent static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST - Register for a game
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
): Promise<NextResponse> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const { verifyTokenAndUser, getTokenFromHeader } = await import('@/lib/auth');
    const { gameId } = await params;
    const authHeader = request.headers.get('authorization');

    // Strict authentication
    const token: string | null = getTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    let decoded: { userId: string; role: string };
    try {
      decoded = await verifyTokenAndUser(token);
    } catch (authError) {
      return NextResponse.json({ error: 'Invalid token or user no longer exists', details: String(authError) }, { status: 401 });
    }

    // Transaction: ensure level, stage, participant, wallet, progress are created atomically
    const participant = await prisma.$transaction(async (tx) => {
      // Check game
      const game = await tx.game.findUnique({ where: { id: gameId } });
      if (!game) {
        throw new Error('Game not found');
      }
      if (game.status !== 'UPCOMING') {
        throw new Error('Game registration is not available');
      }
      // Check if already registered
      const existingParticipant = await tx.participant.findUnique({
        where: { userId_gameId: { userId: decoded.userId, gameId } }
      });
      if (existingParticipant) {
        throw new Error('Already registered for this game');
      }
      // Ensure level and stage
      let level = await tx.level.findFirst({ where: { gameId } });
      if (!level) {
        level = await tx.level.create({
          data: { gameId, levelNumber: 1, name: 'Level 1', description: 'Auto-created Level 1' }
        });
      }
      let stage = await tx.stage.findFirst({ where: { levelId: level.id } });
      if (!stage) {
        stage = await tx.stage.create({
          data: { levelId: level.id, stageNumber: 1, name: 'Stage 1', description: 'Auto-created Stage 1' }
        });
      }
      // Create participant, wallet, progress
      const participant = await tx.participant.create({
        data: {
          userId: decoded.userId,
          gameId,
          pebbles: 1000,
          scavengerStones: 0,
          wallet: { create: { balance: 0 } },
          progress: {
            create: {
              stageId: stage.id,
              currentLevel: 1,
              currentStage: 1,
              currentHunt: 1,
              currentClue: 1,
              phase: 'PHASE_1',
            }
          }
        },
        include: {
          wallet: true,
          user: { select: { username: true, email: true } },
          progress: true
        }
      });
      // Log registration activity
      await tx.activity.create({
        data: {
          type: 'GAME_REGISTERED',
          description: `Registered for game: ${game.title}`,
          userId: decoded.userId,
          details: { gameId, gameTitle: game.title, participantId: participant.id }
        }
      });
      return participant;
    });
    return NextResponse.json({
      message: 'Successfully registered for game',
      participant: {
        id: participant.id,
        pebbles: participant.pebbles,
        scavengerStones: participant.scavengerStones,
        wallet: participant.wallet,
        user: participant.user
      }
    });
  } catch (error) {
    // Robust error logging
    console.error('Error registering for game:', error);
    let message = 'Internal server error';
    let details = '';
    if (error instanceof Error) {
      message = error.message;
      details = error.stack || '';
    } else if (typeof error === 'string') {
      message = error;
    }
    return NextResponse.json({ error: message, details }, { status: 500 });
  }
}

// GET - Get game participants (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    // Lazy load dependencies
    const { prisma } = await import('@/lib/prisma')
    const { verifyTokenAndUser, getTokenFromHeader } = await import('@/lib/auth')

    const { gameId } = await params
    const authHeader = request.headers.get('authorization')

    console.log('Getting participants for game:', gameId)
    console.log('Auth header:', authHeader)

    const token = getTokenFromHeader(authHeader)
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = await verifyTokenAndUser(token)

    if (!['ADMIN', 'SUPERADMIN'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const participants = await prisma.participant.findMany({
      where: { gameId },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        wallet: true,
        progress: {
          include: {
            stage: true,
            badges: true
          }
        }
      }
    })

    return NextResponse.json({ participants })

  } catch (error) {
    console.error('Error fetching participants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
