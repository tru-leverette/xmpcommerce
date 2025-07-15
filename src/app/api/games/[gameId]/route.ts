import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// PUT update existing game (SuperAdmin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
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

    const { title, theme, launchDate, status } = await request.json()

    if (!title || !theme) {
      return NextResponse.json(
        { error: 'Title and location are required' },
        { status: 400 }
      )
    }

    // Get the current game to check if theme is changing
    const currentGame = await prisma.game.findUnique({
      where: { id: params.gameId }
    })

    if (!currentGame) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // If theme is changing, check if there's already an active game on the new continent
    if (currentGame.theme !== theme) {
      const existingGame = await prisma.game.findFirst({
        where: {
          theme: theme,
          status: {
            in: ['UPCOMING', 'ACTIVE']
          },
          id: {
            not: params.gameId // Exclude current game
          }
        }
      })

      if (existingGame) {
        return NextResponse.json(
          { error: `A game is already active or scheduled for ${theme}. Only one game per continent is allowed at a time.` },
          { status: 409 }
        )
      }
    }

    // Update the game in the database
    const updateData: {
      title: string
      theme: string
      launchDate: Date | null
      status?: 'UPCOMING' | 'ACTIVE' | 'COMPLETED'
    } = {
      title,
      theme,
      launchDate: launchDate ? new Date(launchDate) : null
    }

    // Only update status if it's provided
    if (status) {
      updateData.status = status as 'UPCOMING' | 'ACTIVE' | 'COMPLETED'
    }

    const game = await prisma.game.update({
      where: { id: params.gameId },
      data: updateData,
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

    return NextResponse.json({
      message: 'Game updated successfully',
      game
    })

  } catch (error) {
    console.error('Error updating game:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH update existing game (SuperAdmin only) - alias for PUT
export async function PATCH(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  return PUT(request, { params })
}

// DELETE game (SuperAdmin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
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

    // Get password from request body
    const { password } = await request.json()

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

    // Import bcrypt for password verification
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Delete the game from the database
    await prisma.game.delete({
      where: { id: params.gameId }
    })

    return NextResponse.json({
      message: 'Game deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting game:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
