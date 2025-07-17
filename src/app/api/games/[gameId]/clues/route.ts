import { verifyToken } from '@/lib/auth'
import {
  assignParticipantToClueSet,
  type Location
} from '@/lib/clueSetManager'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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

    // If no hunts exist for this clue set, fall back to default mock clues
    if (hunts.length === 0) {
      const mockClues = [
        {
          id: 'clue-1',
          clueNumber: 1,
          question: 'Find the majestic creature that roams the savanna, known as the king of beasts. What sound does it make?',
          hint: 'Listen carefully to the sounds of the African plains',
          type: 'TEXT_ANSWER' as const,
          huntId: 'hunt-1',
          expectedAnswers: ['roar', 'roars', 'roaring']
        },
        {
          id: 'clue-2',
          clueNumber: 2,
          question: 'Capture a photo of something red that brings joy to children and has wheels.',
          hint: 'Think about playground equipment or toys',
          type: 'PHOTO_UPLOAD' as const,
          huntId: 'hunt-1',
          expectedAnswers: ['bicycle', 'bike', 'tricycle', 'wagon', 'toy car']
        },
        {
          id: 'clue-3',
          clueNumber: 3,
          question: 'Find the tallest structure you can see and tell me: What flies high above it during the day?',
          hint: 'Look up to the sky for something that waves in the wind',
          type: 'TEXT_ANSWER' as const,
          huntId: 'hunt-1',
          expectedAnswers: ['flag', 'bird', 'birds', 'airplane', 'plane', 'clouds']
        },
        {
          id: 'clue-4',
          clueNumber: 4,
          question: 'For your final challenge in this stage: Take a photo of yourself at a place that represents community gathering - somewhere people come together to celebrate, learn, or help each other. Write one word that describes how this place makes you feel.',
          hint: 'Think about the heart of your neighborhood',
          type: 'COMBINED' as const,
          huntId: 'hunt-1',
          expectedAnswers: ['community center', 'park', 'church', 'temple', 'mosque', 'town hall', 'happy', 'peaceful', 'connected', 'welcomed', 'safe']
        }
      ]

      const currentClueIndex = Math.min(Math.max(clueNumber - 1, 0), mockClues.length - 1)
      const mockClue = mockClues[currentClueIndex]

      return NextResponse.json({
        clue: mockClue,
        totalClues: mockClues.length,
        isLastClue: currentClueIndex === mockClues.length - 1,
        currentClueNumber: currentClueIndex + 1,
        clueSetInfo: participant.clueSet ? {
          id: participant.clueSet.id,
          name: participant.clueSet.name,
          description: participant.clueSet.description
        } : null
      })
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

    // Handle mock clues (when using fallback system)
    if (clueId && clueId.startsWith('clue-')) {
      // Enhanced mock validation system - 4 clues per stage
      const mockClues = [
        {
          id: 'clue-1',
          expectedAnswers: ['roar', 'roars', 'roaring'],
          successMessage: 'Correct! Lions do roar.',
          failMessage: 'Not quite right. Think about the sound a lion makes.'
        },
        {
          id: 'clue-2',
          expectedAnswers: ['bicycle', 'bike', 'tricycle', 'wagon', 'toy car'],
          successMessage: 'Great photo! That\'s exactly what we were looking for.',
          failMessage: 'This doesn\'t seem to match what we\'re looking for. Try finding something red with wheels.'
        },
        {
          id: 'clue-3',
          expectedAnswers: ['flag', 'bird', 'birds', 'airplane', 'plane', 'clouds'],
          successMessage: 'Excellent observation! You\'re really looking up.',
          failMessage: 'Look higher! What do you see flying or waving above the tallest structure?'
        },
        {
          id: 'clue-4',
          expectedAnswers: ['community center', 'park', 'church', 'temple', 'mosque', 'town hall', 'happy', 'peaceful', 'connected', 'welcomed', 'safe'],
          successMessage: 'Beautiful! You\'ve completed this stage and found the heart of community.',
          failMessage: 'Think about places where people come together for shared experiences.'
        }
      ]

      // Find the current clue for validation based on clueId
      const currentClueNum = parseInt(clueId?.split('-')[1] || '1')
      const currentClueIndex = Math.min(currentClueNum - 1, mockClues.length - 1)
      const currentClue = mockClues[currentClueIndex]

      let isCorrect = false
      let aiAnalysis = ''

      if (submissionType === 'TEXT_ANSWER') {
        // Check if answer matches any expected answers
        const userAnswer = textAnswer?.toLowerCase().trim() || ''
        isCorrect = currentClue.expectedAnswers.some(expectedAnswer =>
          userAnswer.includes(expectedAnswer.toLowerCase())
        )
        aiAnalysis = isCorrect ? currentClue.successMessage : currentClue.failMessage
      } else if (submissionType === 'PHOTO_UPLOAD') {
        // In real app, analyze photo with AI vision
        // For testing, we'll accept all photo uploads as correct
        isCorrect = true // Always accept photos for testing purposes
        aiAnalysis = currentClue.successMessage
      } else if (submissionType === 'COMBINED') {
        // For combined submissions, we accept photos and check text answers
        const userAnswer = textAnswer?.toLowerCase().trim() || ''
        isCorrect = currentClue.expectedAnswers.some(expectedAnswer =>
          userAnswer.includes(expectedAnswer.toLowerCase())
        ) || Math.random() > 0.4 // 60% success rate for combined if no text match
        aiAnalysis = isCorrect ? currentClue.successMessage : currentClue.failMessage
      }

      const mockSubmission = {
        id: `submission-${Date.now()}`,
        isCorrect,
        aiAnalysis,
        pebblesEarned: isCorrect ? 10 : 0
      }

      // If correct, update participant pebbles
      if (isCorrect) {
        await prisma.participant.update({
          where: { id: participant.id },
          data: {
            pebbles: { increment: 10 }
          }
        })
      }

      // Determine next clue information
      const nextClueNum = currentClueNum + 1
      const totalClues = 4 // 4 clues per stage
      const hasNextClue = nextClueNum <= totalClues

      return NextResponse.json({
        submission: mockSubmission,
        message: isCorrect
          ? hasNextClue
            ? `Correct! Moving to clue ${nextClueNum} of ${totalClues}.`
            : 'Congratulations! You\'ve completed this stage!'
          : 'Try again!',
        nextClueNumber: isCorrect && hasNextClue ? nextClueNum : null,
        isGameComplete: isCorrect && !hasNextClue
      })
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
      return NextResponse.json({ error: 'Clue not found' }, { status: 404 })
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
