import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma'
// import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// GET current clue for participant
export async function GET(request: NextRequest) {
  try {
    // const { gameId } = params
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

    // Get participant and their current progress
    // const participant = await prisma.participant.findUnique({
    //   where: {
    //     userId_gameId: {
    //       userId: decoded.userId,
    //       gameId
    //     }
    //   },
    //   include: {
    //     progress: {
    //       include: {
    //         stage: {
    //           include: {
    //             hunts: {
    //               include: {
    //                 clues: true
    //               }
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // })

    // if (!participant) {
    //   return NextResponse.json(
    //     { error: 'Not registered for this game' },
    //     { status: 404 }
    //   )
    // }

    // Generate AI-powered clue based on current location and game location
    // This would integrate with OpenAI API

    // Mock clue progression system
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
        question: 'Take a photo of nature\'s recycling system - something that falls from trees in autumn.',
        hint: 'They change colors and cover the ground',
        type: 'PHOTO_UPLOAD' as const,
        huntId: 'hunt-1',
        expectedAnswers: ['leaves', 'leaf', 'fallen leaves']
      },
      {
        id: 'clue-5',
        clueNumber: 5,
        question: 'Find something that has numbers and helps people know when to arrive. What time does it show right now?',
        hint: 'Look for something that ticks and has hands or digits',
        type: 'COMBINED' as const,
        huntId: 'hunt-1',
        expectedAnswers: ['clock', 'time', 'watch']
      },
      {
        id: 'clue-6',
        clueNumber: 6,
        question: 'Locate a place where people gather to learn. Take a photo of the entrance and tell me what subject you would most like to study there.',
        hint: 'Knowledge is power, and this place is full of it',
        type: 'COMBINED' as const,
        huntId: 'hunt-1',
        expectedAnswers: ['library', 'school', 'university', 'college', 'museum']
      },
      {
        id: 'clue-7',
        clueNumber: 7,
        question: 'Find something that provides light when the sun goes down. What color is its glow?',
        hint: 'It stands tall and illuminates the path for travelers',
        type: 'TEXT_ANSWER' as const,
        huntId: 'hunt-1',
        expectedAnswers: ['white', 'yellow', 'orange', 'warm white', 'street light', 'lamp']
      },
      {
        id: 'clue-8',
        clueNumber: 8,
        question: 'Capture an image of man\'s best friend and describe what they\'re doing in one word.',
        hint: 'Loyal, furry, and loves to play fetch',
        type: 'COMBINED' as const,
        huntId: 'hunt-1',
        expectedAnswers: ['dog', 'puppy', 'playing', 'walking', 'running', 'sitting']
      },
      {
        id: 'clue-9',
        clueNumber: 9,
        question: 'Find where people go to get their daily fuel - not for cars, but for their bodies. What\'s the most popular morning beverage served there?',
        hint: 'It\'s a place of aromas and warmth, where people gather before work',
        type: 'TEXT_ANSWER' as const,
        huntId: 'hunt-1',
        expectedAnswers: ['coffee', 'espresso', 'latte', 'cappuccino', 'tea']
      },
      {
        id: 'clue-10',
        clueNumber: 10,
        question: 'For your final challenge: Take a photo of yourself at a place that represents community gathering - somewhere people come together to celebrate, learn, or help each other. Write one word that describes how this place makes you feel.',
        hint: 'Think about the heart of your neighborhood',
        type: 'COMBINED' as const,
        huntId: 'hunt-1',
        expectedAnswers: ['community center', 'park', 'church', 'temple', 'mosque', 'town hall', 'happy', 'peaceful', 'connected', 'welcomed', 'safe']
      }
    ]

    // Get current clue based on participant progress 
    // In production this would query the database for user progress:
    // 1. Get participant from database using userId and gameId  
    // 2. Check their current progress/completed clues
    // 3. Return the next clue they should work on

    // For now, using URL query parameter but preparing for database integration
    const url = new URL(request.url)
    const requestedClueNumber = parseInt(url.searchParams.get('clueNumber') || '1')

    // Ensure clue number is within valid range
    const currentClueIndex = Math.min(Math.max(requestedClueNumber - 1, 0), mockClues.length - 1)
    const mockClue = mockClues[currentClueIndex]

    return NextResponse.json({
      clue: mockClue,
      totalClues: mockClues.length,
      isLastClue: currentClueIndex === mockClues.length - 1,
      currentClueNumber: currentClueIndex + 1
      // In production, also return: participantProgress, completedClues, etc.
    })

  } catch (error) {
    console.error('Error fetching clue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST submit clue answer
export async function POST(request: NextRequest) {
  try {
    // const { gameId } = params
    // Authentication would be checked here
    // const authHeader = request.headers.get('authorization')
    const { submissionType, textAnswer, clueId } = await request.json()
    // const { photoUrl, location } would be used in real implementation

    // const token = getTokenFromHeader(authHeader)
    // if (!token) {
    //   return NextResponse.json(
    //     { error: 'Authentication required' },
    //     { status: 401 }
    //   )
    // }

    // const decoded = verifyToken(token)

    // Get the clue and validate submission
    // const clue = await prisma.clue.findUnique({
    //   where: { id: clueId }
    // })

    // if (!clue) {
    //   return NextResponse.json(
    //     { error: 'Clue not found' },
    //     { status: 404 }
    //   )
    // }

    // AI analysis of submission (integrate with OpenAI)
    let isCorrect = false
    let aiAnalysis = ''

    // Enhanced mock validation system
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
        expectedAnswers: ['leaves', 'leaf', 'fallen leaves'],
        successMessage: 'Perfect! Nature\'s recycling system at work.',
        failMessage: 'Think about what trees shed in autumn that enriches the soil.'
      },
      {
        id: 'clue-5',
        expectedAnswers: ['clock', 'time', 'watch'],
        successMessage: 'Time well spent! You found it.',
        failMessage: 'Look for something that helps people be punctual.'
      },
      {
        id: 'clue-6',
        expectedAnswers: ['library', 'school', 'university', 'college', 'museum'],
        successMessage: 'Knowledge is power! Great find.',
        failMessage: 'Think about places dedicated to learning and knowledge.'
      },
      {
        id: 'clue-7',
        expectedAnswers: ['white', 'yellow', 'orange', 'warm white', 'street light', 'lamp'],
        successMessage: 'Illuminating answer! You\'re brightening up the hunt.',
        failMessage: 'Think about the color of artificial lighting at night.'
      },
      {
        id: 'clue-8',
        expectedAnswers: ['dog', 'puppy', 'playing', 'walking', 'running', 'sitting'],
        successMessage: 'Pawsome! Man\'s best friend indeed.',
        failMessage: 'Look for humanity\'s most loyal companion.'
      },
      {
        id: 'clue-9',
        expectedAnswers: ['coffee', 'espresso', 'latte', 'cappuccino', 'tea'],
        successMessage: 'That\'s the daily grind! Perfect answer.',
        failMessage: 'Think about what gets people energized in the morning.'
      },
      {
        id: 'clue-10',
        expectedAnswers: ['community center', 'park', 'church', 'temple', 'mosque', 'town hall', 'happy', 'peaceful', 'connected', 'welcomed', 'safe'],
        successMessage: 'Beautiful! You\'ve found the heart of community.',
        failMessage: 'Think about places where people come together for shared experiences.'
      }
    ]

    // Find the current clue for validation based on clueId
    const currentClueNum = parseInt(clueId?.split('-')[1] || '1')
    const currentClueIndex = Math.min(currentClueNum - 1, mockClues.length - 1)
    const currentClue = mockClues[currentClueIndex]

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

    // Create submission record
    // const submission = await prisma.clueSubmission.create({
    //   data: {
    //     participantId: participant.id,
    //     clueId,
    //     submissionType,
    //     textAnswer,
    //     photoUrl,
    //     location,
    //     isCorrect,
    //     aiAnalysis
    //   }
    // })

    // If correct, update participant progress and award pebbles
    if (isCorrect) {
      // Award pebbles and update progress
      // await prisma.participant.update({
      //   where: { id: participant.id },
      //   data: {
      //     pebbles: { increment: 10 }
      //   }
      // })
    }

    const mockSubmission = {
      id: `submission-${Date.now()}`,
      isCorrect,
      aiAnalysis,
      pebblesEarned: isCorrect ? 10 : 0
    }

    // Determine next clue information
    const nextClueNum = currentClueNum + 1
    const totalClues = 10 // Total number of mock clues
    const hasNextClue = nextClueNum <= totalClues

    return NextResponse.json({
      submission: mockSubmission,
      message: isCorrect
        ? hasNextClue
          ? `Correct! Moving to clue ${nextClueNum} of ${totalClues}.`
          : 'Congratulations! You\'ve completed the scavenger hunt!'
        : 'Try again!',
      nextClueNumber: isCorrect && hasNextClue ? nextClueNum : null,
      isGameComplete: isCorrect && !hasNextClue
    })

  } catch (error) {
    console.error('Error submitting clue answer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
