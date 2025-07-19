import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

// Dynamic route configuration to prevent static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET all games (public - for viewing available games)
export async function GET(request: NextRequest) {
  try {
    // Lazy load dependencies
    const { prisma } = await import('@/lib/prisma')
    const { getTokenFromHeader, verifyToken } = await import('@/lib/auth')

    // Check if user is authenticated (optional for this endpoint)
    const authHeader = request.headers.get('authorization')
    let currentUserId = null

    if (authHeader) {
      try {
        const token = getTokenFromHeader(authHeader)
        if (token) {
          const decoded = verifyToken(token)
          currentUserId = decoded.userId
        }
      } catch {
        // Ignore auth errors for public endpoint
      }
    }

    const games = await prisma.game.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        status: true,
        launchDate: true,
        phase: true,
        createdAt: true,
        totalLevels: true,
        stagesPerLevel: true,
        cluesPerStage: true,
        creator: {
          select: {
            username: true
          }
        },
        _count: {
          select: {
            participants: true
          }
        },
        participants: currentUserId ? {
          where: {
            userId: currentUserId
          },
          select: {
            id: true
          }
        } : false
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Add isRegistered flag for authenticated users
    const gamesWithRegistration = games.map(game => ({
      ...game,
      isRegistered: currentUserId ? game.participants.length > 0 : false,
      participants: undefined // Remove participants array from response
    }))

    return NextResponse.json({ games: gamesWithRegistration })

  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new game (SuperAdmin only)
export async function POST(request: NextRequest) {
  try {
    // Lazy load dependencies
    const { prisma } = await import('@/lib/prisma')
    const { verifyToken, getTokenFromHeader } = await import('@/lib/auth')

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

    if (decoded.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { title, location, launchDate, password } = await request.json()

    if (!title || !location) {
      return NextResponse.json(
        { error: 'Title and location are required' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Verify password by checking current user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Check if there's already an active game on this continent
    const existingGame = await prisma.game.findFirst({
      where: {
        location: location,
        status: {
          in: ['UPCOMING', 'ACTIVE']
        }
      }
    })

    if (existingGame) {
      return NextResponse.json(
        { error: `A game is already active or scheduled for ${location}. Only one game per continent is allowed at a time.` },
        { status: 409 }
      )
    }

    // Create the game in the database
    const game = await prisma.game.create({
      data: {
        title,
        description: '', // Empty description as we removed this field from the form
        location,
        creatorId: decoded.userId,
        status: 'UPCOMING',
        launchDate: launchDate ? new Date(launchDate) : null
      },
      include: {
        creator: {
          select: {
            username: true
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      }
    })

    // Log the activity
    try {
      await prisma.activity.create({
        data: {
          type: 'GAME_CREATED',
          description: `Created game "${title}" for ${location}`,
          userId: decoded.userId,
          details: {
            gameId: game.id,
            gameTitle: title,
            continent: location,
            launchDate: launchDate || null
          }
        }
      })
    } catch (activityError) {
      console.error('Failed to log activity:', activityError)
      // Don't fail the main operation if activity logging fails
    }

    return NextResponse.json({
      message: 'Game created successfully',
      game
    })

  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
