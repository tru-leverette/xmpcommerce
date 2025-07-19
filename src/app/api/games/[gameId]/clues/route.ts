import { verifyToken } from '@/lib/auth';
import {
  assignParticipantToClueSet,
  type Location
} from '@/lib/clueSetManager';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// Enhanced geographic restriction check based on game phases
async function checkGeographicRestriction(
  userLocation: { lat: number; lng: number },
  gameLocation: string,
  gameLevel: number = 1
): Promise<{ isRestricted: boolean; reason?: string; suggestedAction?: string }> {

  // Define rough geographic regions for continent-level restrictions
  const continents = {
    'Africa': {
      latMin: -35,
      latMax: 37,
      lngMin: -20,
      lngMax: 55
    },
    'North America': {
      latMin: 15,
      latMax: 83,
      lngMin: -168,
      lngMax: -52
    },
    'Europe': {
      latMin: 35,
      latMax: 71,
      lngMin: -25,
      lngMax: 45
    },
    'Asia': {
      latMin: -10,
      latMax: 77,
      lngMin: 40,
      lngMax: 180
    }
  }

  // First check: Are they on the right continent for this game?
  const gameContinent = continents[gameLocation as keyof typeof continents]
  if (!gameContinent) {
    // If we don't have continent data, allow access (could be global game)
    return { isRestricted: false }
  }

  // Check if user is on the correct continent
  const isOnCorrectContinent = userLocation.lat >= gameContinent.latMin &&
    userLocation.lat <= gameContinent.latMax &&
    userLocation.lng >= gameContinent.lngMin &&
    userLocation.lng <= gameContinent.lngMax

  if (!isOnCorrectContinent) {
    return {
      isRestricted: true,
      reason: `This game is designed for players in ${gameLocation}. You appear to be on a different continent.`,
      suggestedAction: 'Please check if there are games available in your region.'
    }
  }

  // Determine game phase based on level
  const getGamePhase = (level: number): number => {
    if (level >= 1 && level <= 3) return 1  // Individual area play
    if (level >= 4 && level <= 6) return 2  // Group area play
    if (level >= 7 && level <= 9) return 3  // Group state play
    if (level >= 10 && level <= 12) return 4 // Group country play
    return 1 // Default to phase 1
  }

  const currentPhase = getGamePhase(gameLevel)

  // Phase-based restrictions will be handled by clue set assignment
  // For now, if they're on the right continent, allow access
  // The clue set assignment will handle the detailed geographic restrictions

  // Log the phase for debugging
  console.log(`Game phase ${currentPhase} for level ${gameLevel}`)

  return { isRestricted: false }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const resolvedParams = await params
    const gameId = resolvedParams.gameId

    const { searchParams } = new URL(request.url)
    const clueNumber = parseInt(searchParams.get('clueNumber') || '1')
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')

    console.log(`Clues API called with: clueNumber=${clueNumber}, lat=${lat}, lng=${lng}`)
    console.log(`URL parameters:`, {
      clueNumber: searchParams.get('clueNumber'),
      lat: searchParams.get('lat'),
      lng: searchParams.get('lng')
    })

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Unauthorized access - Authentication required',
        errorCode: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({
        error: 'Invalid or expired authentication token',
        errorCode: 'AUTH_INVALID'
      }, { status: 401 })
    }

    // Validate request parameters
    if (!gameId) {
      return NextResponse.json({
        error: 'Game ID is required',
        errorCode: 'MISSING_GAME_ID'
      }, { status: 400 })
    }

    if (isNaN(clueNumber) || clueNumber < 1) {
      return NextResponse.json({
        error: 'Valid clue number is required (must be a positive integer)',
        errorCode: 'INVALID_CLUE_NUMBER'
      }, { status: 400 })
    }

    if ((lat !== 0 || lng !== 0) && (isNaN(lat) || isNaN(lng))) {
      return NextResponse.json({
        error: 'Invalid location coordinates provided',
        errorCode: 'INVALID_COORDINATES'
      }, { status: 400 })
    }

    // Get game data
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        title: true,
        location: true,
        region: true
      }
    })

    if (!game) {
      return NextResponse.json({
        error: 'Game not found',
        errorCode: 'GAME_NOT_FOUND'
      }, { status: 404 })
    }

    // Check for geographic restriction FIRST - before any other processing
    if (game.location && game.location !== 'Global') {
      // If no location is provided, we need to require it for location-specific games
      if (lat === 0 && lng === 0) {
        console.log(`No location provided for location-specific game: ${game.location}`)

        // Log the missing location attempt for admin awareness
        try {
          await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/activities`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token || ''}`
            },
            body: JSON.stringify({
              type: 'LOCATION_REQUIRED',
              description: `User attempted to access location-specific game without providing location`,
              details: {
                userId: decoded.userId,
                gameId,
                gameRegion: game.location,
                timestamp: new Date().toISOString()
              },
              userId: decoded.userId
            })
          })
        } catch (logError) {
          console.error('Failed to log location required:', logError)
        }

        return NextResponse.json({
          error: 'LOCATION_REQUIRED',
          message: `This game requires your location. Please enable location sharing to continue.`,
          gameRegion: game.location,
          clue: null,
          totalClues: 0,
          isLocationRequired: true,
          suggestedAction: 'Please enable location sharing and try again.'
        }, { status: 200 }) // 200 OK - this is expected behavior, not an error
      }

      console.log(`Checking geographic restriction: User at (${lat}, ${lng}) for game in ${game.location}`)

      // Check geographic restriction based on game phase
      const restrictionCheck = await checkGeographicRestriction(
        { lat, lng },
        game.location,
        1 // Default to level 1 for now
      )

      if (restrictionCheck.isRestricted) {
        // Log geographic restriction access attempt for admin awareness
        try {
          await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/activities`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token || ''}`
            },
            body: JSON.stringify({
              type: 'GEOGRAPHIC_RESTRICTION_ACCESSED',
              description: `User from different region attempted to access game clues`,
              details: {
                userId: decoded.userId,
                gameId,
                userLocation: { lat, lng },
                gameRegion: game.location,
                restrictionReason: restrictionCheck.reason,
                timestamp: new Date().toISOString()
              },
              userId: decoded.userId
            })
          })
        } catch (logError) {
          console.error('Failed to log geographic restriction access:', logError)
        }

        console.log(`Geographic restriction applied: ${restrictionCheck.reason}`)

        // Return proper response for geographic restriction
        return NextResponse.json({
          error: 'GEOGRAPHIC_RESTRICTION',
          message: restrictionCheck.reason,
          userLocation: { lat, lng },
          gameRegion: game.location,
          clue: null,
          totalClues: 0,
          isGeographicRestriction: true,
          suggestedAction: restrictionCheck.suggestedAction
        }, { status: 200 }) // 200 OK - this is expected behavior, not an error
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
    })

    if (!participant) {
      return NextResponse.json({
        error: 'Participant not found - You may not be registered for this game',
        errorCode: 'PARTICIPANT_NOT_FOUND',
        gameId,
        userId: decoded.userId
      }, { status: 404 })
    }

    // Update participant location and assign to clue set if provided
    if (lat !== 0 && lng !== 0) {
      try {
        const location: Location = { lat, lng }

        // Assign participant to appropriate clue set
        await assignParticipantToClueSet(participant.id, gameId, location)
      } catch (clueSetError) {
        console.error('Error assigning participant to clue set:', clueSetError)
        return NextResponse.json({
          error: 'Failed to assign participant to appropriate clue set',
          errorCode: 'CLUE_SET_ASSIGNMENT_FAILED',
          details: clueSetError instanceof Error ? clueSetError.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    // Get current progress
    const currentProgress = participant.progress[0]
    if (!currentProgress) {
      return NextResponse.json({
        error: 'No game progress found - Progress may not be initialized',
        errorCode: 'PROGRESS_NOT_FOUND',
        gameId,
        userId: decoded.userId
      }, { status: 404 })
    }

    // Get current stage and hunts
    const currentStage = currentProgress.stage
    let hunts = currentStage.hunts

    // If participant has a clue set assigned, filter hunts by clue set
    if (participant.clueSetId) {
      hunts = hunts.filter(hunt => hunt.clueSetId === participant.clueSetId)
    }

    // If no hunts exist for this clue set, return no clues available
    if (hunts.length === 0) {
      // Log that no clues are available for this location
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/activities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || ''}`
          },
          body: JSON.stringify({
            type: 'NO_CLUES_AVAILABLE',
            description: `No clues available for participant's location`,
            details: {
              userId: decoded.userId,
              gameId,
              userLocation: { lat, lng },
              gameRegion: game.location,
              clueSetId: participant.clueSetId,
              clueNumber,
              timestamp: new Date().toISOString()
            },
            userId: decoded.userId
          })
        })
      } catch (logError) {
        console.error('Failed to log no clues available:', logError)
      }

      return NextResponse.json({
        error: 'NO_CLUES_AVAILABLE',
        message: 'No clues are available for your current location.',
        userLocation: { lat, lng },
        gameRegion: game.location,
        clue: null,
        totalClues: 0,
        isNoCluesAvailable: true,
        suggestedAction: 'Please wait for clues to be generated for your area, or try a different location.'
      }, { status: 200 })
    }

    // Find the hunt that contains the requested clue
    let targetHunt = null
    let targetClue = null
    let totalClues = 0

    for (const hunt of hunts) {
      totalClues += hunt.clues.length
      const clue = hunt.clues.find(c => c.clueNumber === clueNumber)
      if (clue) {
        targetHunt = hunt
        targetClue = clue
        break
      }
    }

    if (!targetClue || !targetHunt) {
      return NextResponse.json({ error: 'Clue not found' }, { status: 404 })
    }

    // Return the clue data
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
    })
  } catch (error) {
    console.error('Error in clues GET API:', error)

    // Log error to activities table
    try {
      const resolvedParams = await params
      const gameId = resolvedParams.gameId
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.substring(7)
      const decoded = token ? verifyToken(token) : null

      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          type: 'ERROR_OCCURRED',
          description: `Clues GET API Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: {
            errorType: 'API_ERROR',
            endpoint: `/api/games/${gameId}/clues`,
            method: 'GET',
            gameId: gameId,
            userId: decoded?.userId || 'anonymous',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          },
          userId: decoded?.userId || 'anonymous'
        })
      })
    } catch (logError) {
      console.error('Failed to log clues API error:', logError)
    }

    return NextResponse.json({
      error: 'Internal server error occurred while fetching clue',
      errorCode: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const resolvedParams = await params
    const gameId = resolvedParams.gameId

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Unauthorized access - Authentication required',
        errorCode: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({
        error: 'Invalid or expired authentication token',
        errorCode: 'AUTH_INVALID'
      }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({
        error: 'Invalid JSON in request body',
        errorCode: 'INVALID_JSON'
      }, { status: 400 })
    }

    const { clueId, location, submissionType, textAnswer, photoUrl } = body

    // Validate required fields
    if (!clueId) {
      return NextResponse.json({
        error: 'Clue ID is required for submission',
        errorCode: 'MISSING_CLUE_ID'
      }, { status: 400 })
    }

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return NextResponse.json({
        error: 'Valid location coordinates are required',
        errorCode: 'INVALID_LOCATION'
      }, { status: 400 })
    }

    // Get participant
    const participant = await prisma.participant.findFirst({
      where: {
        userId: decoded.userId,
        gameId: gameId
      }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    // Handle real database clues
    const clue = await prisma.clue.findUnique({
      where: { id: clueId },
      include: {
        hunt: {
          include: {
            stage: true
          }
        }
      }
    })

    if (!clue) {
      return NextResponse.json({
        error: 'Clue not found - No clues available for submission',
        errorCode: 'CLUE_NOT_FOUND'
      }, { status: 404 })
    }

    // Simple answer checking logic (you can enhance this with AI)
    let isCorrect = false
    let aiAnalysis = 'Answer submitted'

    if (submissionType === 'TEXT_ANSWER' && textAnswer && clue.answer) {
      isCorrect = textAnswer.toLowerCase().trim() === clue.answer.toLowerCase().trim()
      aiAnalysis = isCorrect
        ? 'Correct! Well done!'
        : 'Not quite right. Try again!'
    } else if (submissionType === 'PHOTO_UPLOAD') {
      // For photos, we'll assume correct for now (you can add AI photo analysis)
      isCorrect = true
      aiAnalysis = 'Photo submitted successfully!'
    }

    // Create submission
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
    })

    // Calculate pebbles earned
    const pebblesEarned = isCorrect ? 10 : 0

    // Update participant pebbles
    if (pebblesEarned > 0) {
      await prisma.participant.update({
        where: { id: participant.id },
        data: {
          pebbles: {
            increment: pebblesEarned
          }
        }
      })
    }

    // Check if this completes the stage/hunt
    let isGameComplete = false
    let nextClueNumber = null

    if (isCorrect) {
      // Get all clues in the current stage
      const allClues = await prisma.clue.findMany({
        where: {
          hunt: {
            stageId: clue.hunt.stage.id,
            // Filter by clue set if participant has one
            ...(participant.clueSetId && { clueSetId: participant.clueSetId })
          }
        },
        orderBy: { clueNumber: 'asc' }
      })

      // Find next clue
      const currentIndex = allClues.findIndex(c => c.id === clueId)
      if (currentIndex < allClues.length - 1) {
        nextClueNumber = allClues[currentIndex + 1].clueNumber
      } else {
        isGameComplete = true
      }
    }

    return NextResponse.json({
      submission: {
        id: submission.id,
        isCorrect,
        aiAnalysis,
        pebblesEarned
      },
      isGameComplete,
      nextClueNumber
    })
  } catch (error) {
    console.error('Error in clue submission POST API:', error)

    // Log error to activities table
    try {
      const resolvedParams = await params
      const gameId = resolvedParams.gameId
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.substring(7)
      const decoded = token ? verifyToken(token) : null

      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          type: 'ERROR_OCCURRED',
          description: `Clue submission POST API Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: {
            errorType: 'SUBMISSION_ERROR',
            endpoint: `/api/games/${gameId}/clues`,
            method: 'POST',
            gameId: gameId,
            userId: decoded?.userId || 'anonymous',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          },
          userId: decoded?.userId || 'anonymous'
        })
      })
    } catch (logError) {
      console.error('Failed to log clue submission error:', logError)
    }

    return NextResponse.json({
      error: 'Internal server error occurred while processing submission',
      errorCode: 'SUBMISSION_PROCESSING_ERROR',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
