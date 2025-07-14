import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma'
// import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// GET all games (public - for viewing available games)
export async function GET() {
  try {
    // const games = await prisma.game.findMany({
    //   include: {
    //     creator: {
    //       select: {
    //         username: true
    //       }
    //     },
    //     _count: {
    //       select: {
    //         participants: true
    //       }
    //     }
    //   },
    //   orderBy: {
    //     createdAt: 'desc'
    //   }
    // })

    const mockGames = [
      {
        id: '1',
        title: 'African Adventure',
        description: 'Explore the wonders of Africa through challenging hunts',
        theme: 'Africa',
        status: 'UPCOMING',
        launchDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        creator: { username: 'admin' },
        _count: { participants: 25 }
      },
      {
        id: '2',
        title: 'Ancient Egypt Quest',
        description: 'Uncover the mysteries of ancient Egypt',
        theme: 'Ancient Egypt',
        status: 'ACTIVE',
        launchDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        creator: { username: 'admin' },
        _count: { participants: 150 }
      }
    ]

    return NextResponse.json({ games: mockGames })

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
    
    // if (decoded.role !== 'SUPERADMIN') {
    //   return NextResponse.json(
    //     { error: 'Insufficient permissions' },
    //     { status: 403 }
    //   )
    // }

    const { title, description, theme } = await request.json()

    if (!title || !description || !theme) {
      return NextResponse.json(
        { error: 'Title, description, and theme are required' },
        { status: 400 }
      )
    }

    // const game = await prisma.game.create({
    //   data: {
    //     title,
    //     description,
    //     theme,
    //     creatorId: decoded.userId,
    //     status: 'PENDING'
    //   },
    //   include: {
    //     creator: {
    //       select: {
    //         username: true
    //       }
    //     }
    //   }
    // })

    const mockGame = {
      id: 'new-game-id',
      title,
      description,
      theme,
      status: 'PENDING',
      creator: { username: 'admin' }
    }

    return NextResponse.json({
      message: 'Game created successfully',
      game: mockGame
    })

  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
