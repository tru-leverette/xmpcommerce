

import { verifyToken } from '@/lib/auth';
import {
  assignParticipantToClueSet,
  getCluesForClueSet,
  type Location
} from '@/lib/clueSetManager';
import { prisma } from '@/lib/prisma';
import { ClueType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

// Centralized error configuration
const ERROR_CONFIG = {
  AUTH_REQUIRED: {
    status: 401,
    message: 'Unauthorized access - Authentication required',
  },
  AUTH_INVALID: {
    status: 401,
    message: 'Invalid or expired authentication token',
  },
  GAME_NOT_FOUND: {
    status: 404,
    message: 'Game not found',
  },
  PARTICIPANT_NOT_FOUND: {
    status: 404,
    message: 'Participant not found - You may not be registered for this game',
  },
  PROGRESS_NOT_FOUND: {
    status: 404,
    message: 'No game progress found - Progress may not be initialized',
  },
  CLUE_NOT_FOUND: {
    status: 404,
    message: 'Clue not found',
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    message: 'Internal server error occurred while fetching clue',
  },
  SUBMISSION_PROCESSING_ERROR: {
    status: 500,
    message: 'Internal server error occurred while processing submission',
  },
  INVALID_JSON: {
    status: 400,
    message: 'Invalid JSON in request body',
  },
  MISSING_CLUE_ID: {
    status: 400,
    message: 'Clue ID is required for submission',
  },
  INVALID_LOCATION: {
    status: 400,
    message: 'Valid location coordinates are required',
  },
  CLUE_SET_ASSIGNMENT_FAILED: {
    status: 500,
    message: 'Failed to assign participant to appropriate clue set',
  },
};



// Enhanced geographic restriction check based on game phases
type GeographicRestrictionResult = {
  isRestricted: boolean;
  reason?: string;
  suggestedAction?: string;
};

async function checkGeographicRestriction(
  userLocation: { lat: number; lng: number },
  gameLocation: string
): Promise<GeographicRestrictionResult> {
  const continents: Record<string, { latMin: number; latMax: number; lngMin: number; lngMax: number }> = {
    'Africa': { latMin: -35, latMax: 37, lngMin: -20, lngMax: 55 },
    'North America': { latMin: 15, latMax: 83, lngMin: -168, lngMax: -52 },
    'Europe': { latMin: 35, latMax: 71, lngMin: -25, lngMax: 45 },
    'Asia': { latMin: -10, latMax: 77, lngMin: 40, lngMax: 180 },
  };
  const gameContinent = continents[gameLocation as keyof typeof continents];
  if (!gameContinent) return { isRestricted: false };
  const isOnCorrectContinent = userLocation.lat >= gameContinent.latMin &&
    userLocation.lat <= gameContinent.latMax &&
    userLocation.lng >= gameContinent.lngMin &&
    userLocation.lng <= gameContinent.lngMax;
  if (!isOnCorrectContinent) {
    return {
      isRestricted: true,
      reason: `This game is designed for players in ${gameLocation}. You appear to be on a different continent.`,
      suggestedAction: 'Please check if there are games available in your region.'
    };
  }
  return { isRestricted: false };
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const gameId: string = resolvedParams.gameId;
    const { searchParams } = new URL(request.url);
    const clueNumber: number = parseInt(searchParams.get('clueNumber') || '1');
    const lat: number = parseFloat(searchParams.get('lat') || '0');
    const lng: number = parseFloat(searchParams.get('lng') || '0');
    const clueSetId: string | null = searchParams.get('clueSetId');
    const stageId: string | null = searchParams.get('stageId');

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = ERROR_CONFIG.AUTH_REQUIRED;
      return NextResponse.json({ error: err.message, errorCode: 'AUTH_REQUIRED' }, { status: err.status });
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      const err = ERROR_CONFIG.AUTH_INVALID;
      return NextResponse.json({ error: err.message, errorCode: 'AUTH_INVALID' }, { status: err.status });
    }

    // Always fetch game data first so it is available for all branches
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        title: true,
        location: true,
        region: true
      }
    });
    if (!game) {
      const err = ERROR_CONFIG.GAME_NOT_FOUND;
      return NextResponse.json({ error: err.message, errorCode: 'GAME_NOT_FOUND' }, { status: err.status });
    }

    // If clueSetId and stageId are provided, validate and fetch clues for that clue set and stage directly
    if (clueSetId && stageId) {
      // Validate CUID/UUID format (Prisma default is CUID, 24 chars, starts with 'c')
      const cuidRegex = /^c[a-z0-9]{24}$/i;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidId = (id: string) => cuidRegex.test(id) || uuidRegex.test(id);
      if (!isValidId(clueSetId) || !isValidId(stageId)) {
        return NextResponse.json({
          error: 'Invalid clueSetId or stageId format. Must be a valid CUID or UUID.',
          errorCode: 'INVALID_ID_FORMAT',
          clueSetId,
          stageId
        }, { status: 400 });
      }
      // Check for required API key (e.g., OpenAI)
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({
          error: 'Clue generation is currently unavailable because the OpenAI API key is not configured on the server. Please contact support or your administrator to resolve this.',
          errorCode: 'API_KEY_NOT_CONFIGURED',
          details: {
            message: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment.'
          }
        }, { status: 500 });
      }
      try {
        const hunts = await getCluesForClueSet(clueSetId, stageId);
        if (!hunts || hunts.length === 0) {
          return NextResponse.json({ error: 'NO_CLUES_AVAILABLE', message: 'No clues are available for this clue set and stage.' }, { status: 200 });
        }
        type Clue = { id: string; clueNumber: number; question: string; hint?: string | null; type: string; huntId: string };
        let targetHunt: typeof hunts[0] | null = null;
        let targetClue: Clue | null = null;
        let totalClues = 0;
        for (const hunt of hunts) {
          totalClues += hunt.clues.length;
          const clue = hunt.clues.find((c: Clue) => c.clueNumber === clueNumber);
          if (clue) {
            targetHunt = hunt;
            targetClue = clue;
            break;
          }
        }
        if (!targetClue || !targetHunt) {
          const err = ERROR_CONFIG.CLUE_NOT_FOUND;
          return NextResponse.json({ error: err.message, errorCode: 'CLUE_NOT_FOUND' }, { status: err.status });
        }
        return NextResponse.json({
          clue: {
            id: targetClue.id,
            clueNumber: targetClue.clueNumber,
            question: targetClue.question,
            hint: targetClue.hint,
            type: targetClue.type,
            huntId: targetHunt.id
          },
          totalClues,
          huntName: targetHunt.name,
          clueSetInfo: {
            id: clueSetId
          }
        });
      } catch (err) {
        const errorObj = ERROR_CONFIG.INTERNAL_SERVER_ERROR;
        return NextResponse.json({
          error: errorObj.message,
          errorCode: 'INTERNAL_SERVER_ERROR',
          details: process.env.NODE_ENV === 'development'
            ? (err instanceof Error ? { message: err.message, stack: err.stack } : err)
            : undefined
        }, { status: errorObj.status });
      }
    }

    // Check for geographic restriction FIRST - before any other processing
    if (game.location && game.location !== 'Global') {
      if (lat === 0 && lng === 0) {
        return NextResponse.json({
          error: 'LOCATION_REQUIRED',
          message: `This game requires your location. Please enable location sharing to continue.`,
          gameRegion: game.location,
          clue: null,
          totalClues: 0,
          isLocationRequired: true,
          suggestedAction: 'Please enable location sharing and try again.'
        }, { status: 200 });
      }
      const restrictionCheck = await checkGeographicRestriction(
        { lat, lng },
        game.location
      );
      if (restrictionCheck.isRestricted) {
        return NextResponse.json({
          error: 'GEOGRAPHIC_RESTRICTION',
          message: restrictionCheck.reason,
          userLocation: { lat, lng },
          gameRegion: game.location,
          clue: null,
          totalClues: 0,
          isGeographicRestriction: true,
          suggestedAction: restrictionCheck.suggestedAction
        }, { status: 200 });
      }
    }

    // Get participant
    const participant = await prisma.participant.findFirst({
      where: {
        userId: decoded.userId,
        gameId: gameId
      },
      include: {
        progress: {
          include: {
            stage: {
              include: {
                hunts: {
                  include: {
                    clues: {
                      orderBy: { clueNumber: 'asc' }
                    }
                  }
                }
              }
            }
          }
        },
        clueSet: true
      }
    });
    if (!participant) {
      // Instead of a hard error, return a 'preparing' status so the frontend can retry
      return NextResponse.json({
        preparing: true,
        message: 'Preparing your hunt, please wait...'
      }, { status: 202 });
    }

    // Update participant location and assign to clue set if provided
    if (lat !== 0 && lng !== 0) {
      try {
        const location: Location = { lat, lng };
        await assignParticipantToClueSet(participant.id, gameId, location);
      } catch (clueSetError) {
        const err = ERROR_CONFIG.CLUE_SET_ASSIGNMENT_FAILED;
        return NextResponse.json({
          error: err.message,
          errorCode: 'CLUE_SET_ASSIGNMENT_FAILED',
          details: clueSetError instanceof Error ? clueSetError.message : 'Unknown error'
        }, { status: err.status });
      }
    }

    // Get current progress
    const currentProgress = participant.progress[0];
    if (!currentProgress) {
      return NextResponse.json({ preparing: true, message: 'Preparing your hunt, please wait...' }, { status: 202 });
    }

    // If game is complete, block further clue access
    if (currentProgress.completedAt) {
      return NextResponse.json({ error: 'Game already completed', isGameComplete: true }, { status: 403 });
    }

    // ...existing code for getting hunts and clues...
    const currentStage = currentProgress.stage;
    let hunts = currentStage.hunts;
    if (participant.clueSetId) {
      hunts = hunts.filter((hunt: { clueSetId: string | null }) => typeof hunt.clueSetId === 'string' && hunt.clueSetId === participant.clueSetId);
    }
    if (hunts.length === 0 && participant.clueSetId && currentStage?.id) {
      try {
        const generatedHunts = await getCluesForClueSet(participant.clueSetId, currentStage.id);
        if (generatedHunts.length > 0) {
          // ...existing code for mapping generated hunts...
          interface GeneratedClue {
            id: string;
            clueNumber: number;
            question: string;
            type: string;
            huntId: string;
            createdAt?: string | Date;
            updatedAt?: string | Date;
            isActive?: boolean;
            hint?: string | null;
            answer?: string | null;
            aiGenerated?: boolean;
            requiredLatitude?: number | null;
            requiredLongitude?: number | null;
            locationRadius?: number | null;
            aiContext?: unknown;
          }
          interface GeneratedHunt {
            id: string;
            name: string;
            description: string | null;
            clues: GeneratedClue[];
            clueSetId?: string | null;
            createdAt?: string | Date;
            updatedAt?: string | Date;
            stageId?: string;
            huntNumber?: number;
          }
          hunts = (generatedHunts as GeneratedHunt[]).map((hunt) => ({
            id: hunt.id,
            name: hunt.name,
            description: hunt.description ?? null,
            clueSetId: hunt.clueSetId ?? null,
            createdAt: hunt.createdAt ? new Date(hunt.createdAt) : new Date(),
            updatedAt: hunt.updatedAt ? new Date(hunt.updatedAt) : new Date(),
            stageId: hunt.stageId ?? currentStage?.id ?? '',
            huntNumber: typeof hunt.huntNumber === 'number' ? hunt.huntNumber : 1,
            clues: (hunt.clues || []).map((clue) => ({
              id: clue.id,
              clueNumber: clue.clueNumber,
              question: clue.question,
              type: clue.type as ClueType,
              huntId: clue.huntId,
              createdAt: clue.createdAt ? new Date(clue.createdAt) : new Date(),
              updatedAt: clue.updatedAt ? new Date(clue.updatedAt) : new Date(),
              isActive: typeof clue.isActive === 'boolean' ? clue.isActive : true,
              hint: clue.hint ?? null,
              answer: clue.answer ?? null,
              aiGenerated: typeof clue.aiGenerated === 'boolean' ? clue.aiGenerated : false,
              requiredLatitude: clue.requiredLatitude ?? null,
              requiredLongitude: clue.requiredLongitude ?? null,
              locationRadius: clue.locationRadius ?? null,
              aiContext: clue.aiContext ?? null
            }))
          }));
        } else {
          throw new Error('Failed to generate clues');
        }
      } catch (err) {
        return NextResponse.json({
          error: 'NO_CLUES_AVAILABLE',
          message: 'No clues are available for your current location and clue generation failed.',
          userLocation: { lat, lng },
          gameRegion: game.location,
          clue: null,
          totalClues: 0,
          isNoCluesAvailable: true,
          suggestedAction: 'Please try again later or contact support.',
          details: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.message : err) : undefined
        }, { status: 200 });
      }
    }
    let targetHunt: typeof hunts[0] | null = null;
    let targetClue: { id: string; clueNumber: number; question: string; hint?: string | null; type: string; huntId: string } | null = null;
    let totalClues = 0;
    for (const hunt of hunts) {
      totalClues += hunt.clues.length;
      const clue = hunt.clues.find((c: { clueNumber: number }) => c.clueNumber === clueNumber);
      if (clue) {
        targetHunt = hunt;
        targetClue = clue;
        break;
      }
    }
    if (!targetClue || !targetHunt) {
      const err = ERROR_CONFIG.CLUE_NOT_FOUND;
      return NextResponse.json({ error: err.message, errorCode: 'CLUE_NOT_FOUND' }, { status: err.status });
    }
    return NextResponse.json({
      clue: {
        id: targetClue.id,
        clueNumber: targetClue.clueNumber,
        question: targetClue.question,
        hint: targetClue.hint,
        type: targetClue.type,
        huntId: targetHunt.id
      },
      totalClues,
      huntName: targetHunt.name,
      clueSetInfo: participant.clueSet ? {
        id: participant.clueSet.id,
        name: participant.clueSet.name,
        description: participant.clueSet.description
      } : null
    });
  } catch (error) {
    const err = ERROR_CONFIG.INTERNAL_SERVER_ERROR;
    return NextResponse.json({
      error: err.message,
      errorCode: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development'
        ? (error instanceof Error ? { message: error.message, stack: error.stack } : error)
        : undefined
    }, { status: err.status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const gameId: string = resolvedParams.gameId;
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = ERROR_CONFIG.AUTH_REQUIRED;
      return NextResponse.json({ error: err.message, errorCode: 'AUTH_REQUIRED' }, { status: err.status });
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      const err = ERROR_CONFIG.AUTH_INVALID;
      return NextResponse.json({ error: err.message, errorCode: 'AUTH_INVALID' }, { status: err.status });
    }
    let body: { clueId: string; location: { lat: number; lng: number }; submissionType: string; textAnswer?: string; photoUrl?: string };
    try {
      body = await request.json();
    } catch {
      const err = ERROR_CONFIG.INVALID_JSON;
      return NextResponse.json({ error: err.message, errorCode: 'INVALID_JSON' }, { status: err.status });
    }
    const { clueId, location, submissionType, textAnswer, photoUrl } = body;
    if (!clueId) {
      const err = ERROR_CONFIG.MISSING_CLUE_ID;
      return NextResponse.json({ error: err.message, errorCode: 'MISSING_CLUE_ID' }, { status: err.status });
    }
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      const err = ERROR_CONFIG.INVALID_LOCATION;
      return NextResponse.json({ error: err.message, errorCode: 'INVALID_LOCATION' }, { status: err.status });
    }
    const participant = await prisma.participant.findFirst({
      where: {
        userId: decoded.userId,
        gameId: gameId
      }
    });
    if (!participant) {
      const err = ERROR_CONFIG.PARTICIPANT_NOT_FOUND;
      return NextResponse.json({ error: err.message, errorCode: 'PARTICIPANT_NOT_FOUND' }, { status: err.status });
    }
    const clue = await prisma.clue.findUnique({
      where: { id: clueId },
      include: {
        hunt: {
          include: {
            stage: true
          }
        }
      }
    });
    if (!clue) {
      const err = ERROR_CONFIG.CLUE_NOT_FOUND;
      return NextResponse.json({ error: 'Clue not found - No clues available for submission', errorCode: 'CLUE_NOT_FOUND' }, { status: err.status });
    }
    let isCorrect = false;
    let aiAnalysis = 'Answer submitted';
    if (submissionType === 'TEXT_ANSWER' && textAnswer && clue.answer) {
      isCorrect = textAnswer.toLowerCase().trim() === clue.answer.toLowerCase().trim();
      aiAnalysis = isCorrect ? 'Correct! Well done!' : 'Not quite right. Try again!';
    } else if (submissionType === 'PHOTO_UPLOAD') {
      isCorrect = true;
      aiAnalysis = 'Photo submitted successfully!';
    }
    const submission = await prisma.clueSubmission.create({
      data: {
        participantId: participant.id,
        clueId: clueId,
        submissionType,
        textAnswer,
        photoUrl,
        location,
        isCorrect,
        aiAnalysis
      }
    });
    let isGameComplete = false;
    let nextClueNumber: number | null = null;
    if (isCorrect) {
      const allClues = await prisma.clue.findMany({
        where: {
          hunt: {
            stageId: clue.hunt.stage.id,
            ...(participant.clueSetId && { clueSetId: participant.clueSetId })
          }
        },
        orderBy: { clueNumber: 'asc' }
      });
      const currentIndex = allClues.findIndex((c: { id: string }) => c.id === clueId);
      if (currentIndex < allClues.length - 1) {
        nextClueNumber = allClues[currentIndex + 1].clueNumber;
      } else {
        isGameComplete = true;
        // Mark progress as complete
        await prisma.participantProgress.updateMany({
          where: { participantId: participant.id, stageId: clue.hunt.stage.id },
          data: { completedAt: new Date() }
        });
        // Fetch stage for badge info
        const stage = await prisma.stage.findUnique({
          where: { id: clue.hunt.stage.id },
          select: { badgeName: true, badgeDescription: true, badgeImage: true, levelId: true, stageNumber: true }
        });
        // Fetch level number
        let levelNumber = 1;
        if (stage?.levelId) {
          const level = await prisma.level.findUnique({ where: { id: stage.levelId }, select: { levelNumber: true } });
          if (level?.levelNumber) levelNumber = level.levelNumber;
        }
        // Fetch progressId for this stage
        const progress = await prisma.participantProgress.findFirst({
          where: { participantId: participant.id, stageId: clue.hunt.stage.id },
          select: { id: true }
        });
        await prisma.badge.create({
          data: {
            name: stage?.badgeName || 'Stage Complete',
            description: stage?.badgeDescription || 'Completed all clues in this stage',
            imageUrl: stage?.badgeImage || null,
            badgeType: 'STAGE',
            levelNumber,
            stageNumber: stage?.stageNumber || 1,
            progressId: progress?.id || ''
          }
        });
      }
    }
    return NextResponse.json({
      submission: {
        id: submission.id,
        isCorrect,
        aiAnalysis
      },
      isGameComplete,
      nextClueNumber
    });
  } catch (error) {
    const err = ERROR_CONFIG.SUBMISSION_PROCESSING_ERROR;
    return NextResponse.json({
      error: err.message,
      errorCode: 'SUBMISSION_PROCESSING_ERROR',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: err.status });
  }
}
