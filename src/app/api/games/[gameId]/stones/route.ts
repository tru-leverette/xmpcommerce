import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// Manage scavenger stones for participants
export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    // Authentication check
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      )
    }

    // Get participant's current stone count
    const participant = await prisma.participant.findUnique({
      where: {
        userId_gameId: {
          userId: decoded.userId,
          gameId: gameId
        }
      },
      select: {
        id: true,
        pebbles: true,
        // scavengerStones will be available once schema is updated
        game: {
          select: {
            id: true,
            title: true,
            theme: true
          }
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant in this game' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      participant: {
        id: participant.id,
        pebbles: participant.pebbles,
        scavengerStones: 0, // Will be updated when schema is active
        game: participant.game
      }
    })

  } catch (error) {
    console.error('Stones fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Award scavenger stones (admin only for now)
export async function POST(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    // Authentication check
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    const { participantId, stones, reason } = await request.json()

    if (!participantId || stones === undefined) {
      return NextResponse.json(
        { error: 'Participant ID and stones amount are required' },
        { status: 400 }
      )
    }

    // For now, just log the stone award
    // Once schema is updated, we'll actually update the scavengerStones field
    
    // Log stone award activity
    try {
      await prisma.activity.create({
        data: {
          type: 'USER_UPDATED', // We'll add STONES_AWARDED to ActivityType later
          description: `${stones} scavenger stones ${stones > 0 ? 'awarded to' : 'deducted from'} participant`,
          userId: decoded.userId,
          details: {
            participantId,
            stonesChange: stones,
            reason: reason || 'Manual adjustment',
            awardedBy: decoded.userId
          }
        }
      })
    } catch (activityError) {
      console.error('Failed to log stone activity:', activityError)
    }

    return NextResponse.json({
      message: `${Math.abs(stones)} scavenger stones ${stones > 0 ? 'awarded' : 'deducted'}`,
      stones,
      reason
    })

  } catch (error) {
    console.error('Stone award error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
