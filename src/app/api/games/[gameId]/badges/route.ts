import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

interface Badge {
  id: string
  type: string
  level?: number
  stage?: number
  earnedAt: Date
}

// Get user's badges for a specific game
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

    // Get participant
    const participant = await prisma.participant.findUnique({
      where: {
        userId_gameId: {
          userId: decoded.userId,
          gameId: gameId
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant in this game' },
        { status: 403 }
      )
    }

    // For now, return empty badges array until schema is updated
    // Once schema is active, we'll query the actual badges
    const badges: Badge[] = []

    return NextResponse.json({
      badges,
      summary: {
        totalBadges: badges.length,
        stageBadges: 0,
        levelBadges: 0,
        pendingMerges: 0
      }
    })

  } catch (error) {
    console.error('Badge fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Award a badge (will be triggered by completing stages/levels)
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
    const { participantId, badgeType, level, stage, reason } = await request.json()

    if (!participantId || !badgeType) {
      return NextResponse.json(
        { error: 'Participant ID and badge type are required' },
        { status: 400 }
      )
    }

    // For now, just log the badge award
    // Once schema is updated, we'll create actual Badge records
    
    try {
      await prisma.activity.create({
        data: {
          type: 'USER_UPDATED', // We'll add BADGE_AWARDED to ActivityType later
          description: `Badge awarded: ${badgeType} ${level ? `Level ${level}` : ''} ${stage ? `Stage ${stage}` : ''}`,
          userId: decoded.userId,
          details: {
            participantId,
            badgeType,
            level,
            stage,
            reason: reason || 'Achievement unlocked',
            awardedBy: decoded.userId
          }
        }
      })
    } catch (activityError) {
      console.error('Failed to log badge activity:', activityError)
    }

    return NextResponse.json({
      message: `Badge awarded: ${badgeType}`,
      badgeType,
      level,
      stage
    })

  } catch (error) {
    console.error('Badge award error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
