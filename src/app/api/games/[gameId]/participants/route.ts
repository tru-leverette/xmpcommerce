// PATCH - Update a participant's progress reference
import { Participant } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
): Promise<NextResponse> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const { verifyTokenAndUser, getTokenFromHeader } = await import('@/lib/auth');
    await params; // gameId not needed here
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON with progressId.' }, { status: 400 });
    }
    type PatchPayload = { participantId: string; progressId: string };
    const { participantId, progressId }: PatchPayload = body as PatchPayload;
    if (
      typeof participantId !== 'string' ||
      typeof progressId !== 'string' ||
      !participantId.trim() ||
      !progressId.trim()
    ) {
      return NextResponse.json({ error: 'participantId (string) and progressId (string) are required in the request body.' }, { status: 400 });
    }

    // Only allow the participant themselves or an admin to update
    if (decoded.userId !== participantId && !['ADMIN', 'SUPERADMIN'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Update the participant's progress reference
    let updated: Participant | null = null;
    try {
      updated = await prisma.participant.update({
        where: { id: participantId },
        data: { progress: { connect: { id: progressId } } },
        include: { progress: true }
      });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to update participant progress', details: String(err) }, { status: 500 });
    }
    return NextResponse.json({ message: 'Participant progress updated', participant: updated });
  } catch (error) {
    console.error('Error updating participant progress:', error);
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

    // Parse and validate registration geolocation/city
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON with registrationCity, registrationLatitude, and registrationLongitude.' }, { status: 400 });
    }
    type RegistrationPayload = {
      registrationCity: string;
      registrationLatitude: number;
      registrationLongitude: number;
    };
    const { registrationCity, registrationLatitude, registrationLongitude }: RegistrationPayload = body as RegistrationPayload;
    if (
      typeof registrationCity !== 'string' ||
      typeof registrationLatitude !== 'number' ||
      typeof registrationLongitude !== 'number' ||
      !registrationCity.trim() ||
      registrationLatitude < -90 || registrationLatitude > 90 ||
      registrationLongitude < -180 || registrationLongitude > 180
    ) {
      return NextResponse.json({ error: 'registrationCity (string), registrationLatitude (number), and registrationLongitude (number) are required in the request body.' }, { status: 400 });
    }

    // Transaction: ensure level, stage, participant, wallet, progress are created atomically
    const participant = await prisma.$transaction(async (tx) => {
      // Check game
      const game = await tx.game.findUnique({ where: { id: gameId } });
      if (!game) {
        throw new Error('Game not found');
      }
      if (game.status === 'COMPLETED') {
        throw new Error('Game registration is not available');
      }
      // Check if already registered
      const existingParticipant = await tx.participant.findUnique({
        where: { userId_gameId: { userId: decoded.userId, gameId } }
      });
      if (existingParticipant) {
        throw new Error('Already registered for this game');
      }
      // Create participant
      const createdParticipant = await tx.participant.create({
        data: {
          userId: decoded.userId,
          gameId,
          scavengerStones: 0,
          registrationCity,
          registrationLatitude,
          registrationLongitude
        }
      });
      // Create progress for participant (no stageId, no level/stage creation)
      await tx.participantProgress.create({
        data: {
          participantId: createdParticipant.id,
          currentLevel: 1,
          currentStage: 1,
          currentHunt: 1,
          currentClue: 1
        }
      });
      await tx.activity.create({
        data: {
          type: 'GAME_REGISTERED',
          description: `Registered for game: ${game.title}`,
          userId: decoded.userId,
          details: { gameId, gameTitle: game.title, participantId: createdParticipant.id }
        }
      });
      return createdParticipant;
    });
    return NextResponse.json({
      message: 'Successfully registered for game',
      participant: {
        id: participant.id,
        scavengerStones: participant.scavengerStones,
        registrationCity: participant.registrationCity,
        registrationLatitude: participant.registrationLatitude,
        registrationLongitude: participant.registrationLongitude,
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
