import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma'
// import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// GET current clue for participant
export async function GET() {
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
    const mockClue = {
      id: 'clue-1',
      clueNumber: 1,
      question: 'Find the majestic creature that roams the savanna, known as the king of beasts. What sound does it make?',
      hint: 'Listen carefully to the sounds of the African plains',
      type: 'TEXT_ANSWER',
      huntId: 'hunt-1'
    }

    return NextResponse.json({ clue: mockClue })

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
    const { submissionType, textAnswer } = await request.json()
    // const { clueId, photoUrl, location } would be used in real implementation
    
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

    if (submissionType === 'TEXT_ANSWER') {
      // Simple mock validation - in real app, use AI
      isCorrect = textAnswer?.toLowerCase().includes('roar') || false
      aiAnalysis = isCorrect ? 'Correct! Lions do roar.' : 'Not quite right. Think about the sound a lion makes.'
    } else if (submissionType === 'PHOTO_UPLOAD') {
      // In real app, analyze photo with AI vision
      isCorrect = Math.random() > 0.3 // Mock 70% success rate
      aiAnalysis = isCorrect ? 'Great photo! This matches the clue.' : 'This doesn\'t seem to match what we\'re looking for.'
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
      id: 'submission-1',
      isCorrect,
      aiAnalysis,
      pebblesEarned: isCorrect ? 10 : 0
    }

    return NextResponse.json({
      submission: mockSubmission,
      message: isCorrect ? 'Correct! Moving to next clue.' : 'Try again!'
    })

  } catch (error) {
    console.error('Error submitting clue answer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
