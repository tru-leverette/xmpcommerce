// Unify hunt type for all usages
import { verifyToken } from '@/lib/auth';
import type { HuntWithClues } from '@/lib/clueSetManager';
import { getCluesForClueSet } from '@/lib/clueSetManager';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { Clue } from './cluesTypings';
import { ERROR_CONFIG } from './errorConfig';
import { getParticipantWithProgress } from './getParticipantWithProgress';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const gameId: string = resolvedParams.gameId;
    const { searchParams } = new URL(request.url);
    let clueNumber: number | null = null;
    const clueNumberParam = searchParams.get('clueNumber');
    if (clueNumberParam && !isNaN(Number(clueNumberParam))) {
      clueNumber = parseInt(clueNumberParam, 10);
    }
    const clueSetIdParam = searchParams.get('clueSetId');
    const levelNumberParam = searchParams.get('levelNumber');
    const stageNumberParam = searchParams.get('stageNumber');
    const clueSetId: string | null = clueSetIdParam && typeof clueSetIdParam === 'string' ? clueSetIdParam : null;
    const levelNumber: number | null = levelNumberParam && !isNaN(Number(levelNumberParam)) ? parseInt(levelNumberParam, 10) : null;
    const stageNumber: number | null = stageNumberParam && !isNaN(Number(stageNumberParam)) ? parseInt(stageNumberParam, 10) : null;

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
    const game = await prisma.game.findUnique({ where: { id: gameId } });

    if (clueSetId && levelNumber !== null && stageNumber !== null) {
      try {
        const hunts = await getCluesForClueSet(clueSetId);
        if (!hunts || hunts.length === 0) {
          return NextResponse.json({ error: 'NO_CLUES_AVAILABLE', message: 'No clues are available for this clue set, level, and stage.' }, { status: 200 });
        }
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
    } else {
      // Robust hunt validation using progress and clueSetId
      const participant = await getParticipantWithProgress(decoded.userId, gameId);
      if (!participant) {
        const err = ERROR_CONFIG.PARTICIPANT_NOT_FOUND;
        return NextResponse.json({ error: err.message, errorCode: 'PARTICIPANT_NOT_FOUND' }, { status: err.status });
      }
      const currentProgress = participant.progress;
      if (!currentProgress) {
        return NextResponse.json({ error: 'No progress found for participant', errorCode: 'NO_PROGRESS' }, { status: 400 });
      }
      clueNumber = currentProgress.currentClue;
      let hunts: HuntWithClues[] = [];
      if (
        participant.clueSetId &&
        typeof currentProgress.currentLevel === 'number' &&
        typeof currentProgress.currentStage === 'number'
      ) {
        try {
          hunts = await getCluesForClueSet(participant.clueSetId);
          if (hunts.length > 0) {
            for (const hunt of hunts) {
              console.log('[DEBUG] Hunt:', hunt.id, 'Clues:', hunt.clues.length);
            }
          } else {
            throw new Error('Failed to generate clues');
          }
        } catch (err) {
          console.error('[DEBUG] getCluesForClueSet error:', err);
          return NextResponse.json({
            error: 'NO_CLUES_AVAILABLE',
            message: 'No clues are available for your current location and clue generation failed.',
            gameRegion: game?.location,
            clue: null,
            totalClues: 0,
            isNoCluesAvailable: true,
            suggestedAction: 'Please try again later or contact support.',
            details: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.message : String(err)) : undefined
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
          targetClue = {
            id: clue.id,
            clueNumber: clue.clueNumber,
            question: clue.question,
            hint: clue.hint,
            type: clue.type,
            huntId: hunt.id
          };
          console.log('[DEBUG] Found clue:', clue.id, 'in hunt:', hunt.id, 'for clueNumber:', clueNumber);
          break;
        }
      }
      if (!targetClue || !targetHunt) {
        const err = ERROR_CONFIG.CLUE_NOT_FOUND;
        console.warn('[DEBUG] No clue found for clueNumber:', clueNumber, 'in hunts:', hunts.map(h => h.id));
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
        clueSetInfo: participant.clueSet
          ? {
            id: participant.clueSet.id,
            name: participant.clueSet.name,
            description: participant.clueSet.description
          }
          : null
      });
    }
  } catch (error) {
    const err = ERROR_CONFIG.INTERNAL_SERVER_ERROR;
    return NextResponse.json({
      error: err.message,
      errorCode: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development'
        ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: err.status });
  }
}

