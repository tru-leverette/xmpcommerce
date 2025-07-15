import { NextRequest, NextResponse } from 'next/server'

// Dynamic route configuration to prevent static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST - Register for a game
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    // Lazy load dependencies
    const { prisma } = await import('@/lib/prisma')
    const { verifyTokenAndUser, getTokenFromHeader } = await import('@/lib/auth')
    const { gameId } = await params
    const authHeader = request.headers.get('authorization')
    
    console.log('Registering for game:', gameId)
    
    // Authentication check
    const token = getTokenFromHeader(authHeader)
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let decoded
    try {
      decoded = await verifyTokenAndUser(token)
    } catch (authError) {
      console.error('Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Invalid token or user no longer exists' },
        { status: 401 }
      )
    }

    // Check if game exists and has launch date
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    if (game.status !== 'UPCOMING') {
      return NextResponse.json(
        { error: 'Game registration is not available' },
        { status: 400 }
      )
    }

    // Check if already registered
    const existingParticipant = await prisma.participant.findUnique({
      where: {
        userId_gameId: {
          userId: decoded.userId,
          gameId
        }
      }
    })

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'Already registered for this game' },
        { status: 409 }
      )
    }

    // Create participant and wallet
    const participant = await prisma.participant.create({
      data: {
        userId: decoded.userId,
        gameId,
        pebbles: 1000, // Starting pebbles as per schema default
        scavengerStones: 0, // Starting stones
        wallet: {
          create: {
            balance: 0 // Starting wallet balance
          }
        }
      },
      include: {
        wallet: true,
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    })

    // Log registration activity
    try {
      await prisma.activity.create({
        data: {
          type: 'GAME_REGISTERED',
          description: `Registered for game: ${game.title}`,
          userId: decoded.userId,
          details: {
            gameId,
            gameTitle: game.title,
            participantId: participant.id
          }
        }
      })
    } catch (activityError) {
      console.error('Failed to log registration activity:', activityError)
    }

    return NextResponse.json({
      message: 'Successfully registered for game',
      participant: {
        id: participant.id,
        pebbles: participant.pebbles,
        scavengerStones: participant.scavengerStones,
        wallet: participant.wallet,
        user: participant.user
      }
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
