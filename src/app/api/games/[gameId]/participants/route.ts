import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma'
// import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// POST - Register for a game
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params
    const authHeader = request.headers.get('authorization')
    
    console.log('Registering for game:', gameId)
    console.log('Auth header:', authHeader)
    
    // Authentication check
    // const token = getTokenFromHeader(authHeader)
    // if (!token) {
    //   return NextResponse.json(
    //     { error: 'Authentication required' },
    //     { status: 401 }
    //   )
    // }

    // const decoded = verifyToken(token)

    // Check if game exists and has launch date
    // const game = await prisma.game.findUnique({
    //   where: { id: gameId }
    // })

    // if (!game) {
    //   return NextResponse.json(
    //     { error: 'Game not found' },
    //     { status: 404 }
    //   )
    // }

    // if (game.status !== 'UPCOMING') {
    //   return NextResponse.json(
    //     { error: 'Game registration is not available' },
    //     { status: 400 }
    //   )
    // }

    // Check if already registered
    // const existingParticipant = await prisma.participant.findUnique({
    //   where: {
    //     userId_gameId: {
    //       userId: decoded.userId,
    //       gameId
    //     }
    //   }
    // })

    // if (existingParticipant) {
    //   return NextResponse.json(
    //     { error: 'Already registered for this game' },
    //     { status: 409 }
    //   )
    // }

    // Create participant and wallet
    // const participant = await prisma.participant.create({
    //   data: {
    //     userId: decoded.userId,
    //     gameId,
    //     pebbles: 100, // Starting pebbles
    //     wallet: {
    //       create: {
    //         balance: 100
    //       }
    //     }
    //   },
    //   include: {
    //     wallet: true,
    //     user: {
    //       select: {
    //         username: true,
    //         email: true
    //       }
    //     }
    //   }
    // })

    const mockParticipant = {
      id: 'participant-id',
      pebbles: 100,
      wallet: { balance: 100 },
      user: { username: 'testuser', email: 'test@example.com' }
    }

    return NextResponse.json({
      message: 'Successfully registered for game',
      participant: mockParticipant
    })

  } catch (error) {
    console.error('Error registering for game:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get game participants (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params
    const authHeader = request.headers.get('authorization')
    
    console.log('Getting participants for game:', gameId)
    console.log('Auth header:', authHeader)
    
    // const token = getTokenFromHeader(authHeader)
    // if (!token) {
    //   return NextResponse.json(
    //     { error: 'Authentication required' },
    //     { status: 401 }
    //   )
    // }

    // const decoded = verifyToken(token)
    
    // if (!['ADMIN', 'SUPERADMIN'].includes(decoded.role)) {
    //   return NextResponse.json(
    //     { error: 'Insufficient permissions' },
    //     { status: 403 }
    //   )
    // }

    // const participants = await prisma.participant.findMany({
    //   where: { gameId },
    //   include: {
    //     user: {
    //       select: {
    //         username: true,
    //         email: true
    //       }
    //     },
    //     wallet: true,
    //     progress: {
    //       include: {
    //         stage: true,
    //         badges: true
    //       }
    //     }
    //   }
    // })

    const mockParticipants = [
      {
        id: 'p1',
        status: 'ACTIVE',
        pebbles: 150,
        user: { username: 'player1', email: 'player1@example.com' },
        wallet: { balance: 150 },
        progress: []
      }
    ]

    return NextResponse.json({ participants: mockParticipants })

  } catch (error) {
    console.error('Error fetching participants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
