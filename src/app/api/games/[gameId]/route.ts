import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

// Dynamic route configuration to prevent static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// PUT update existing game (SuperAdmin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    // Lazy load dependencies
    const { prisma } = await import('@/lib/prisma')
    const { verifyToken, getTokenFromHeader } = await import('@/lib/auth')

    const { gameId } = await params
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

    const {
      title,
      description,
      location,
      launchDate,
      status,
      region,
      minLatitude,
      maxLatitude,
      minLongitude,
      maxLongitude,
      totalLevels,
      stagesPerLevel,
      cluesPerStage
    } = await request.json()

    if (!title || !location) {
      return NextResponse.json(
        { error: 'Title and location are required' },
        { status: 400 }
      )
    }

    // Get the current game to check if location is changing
    const currentGame = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!currentGame) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // If location is changing, check if there's already an active game on the new continent
    if (currentGame.location !== location) {
      const existingGame = await prisma.game.findFirst({
        where: {
          location: location,
          status: {
            in: ['UPCOMING', 'ACTIVE']
          },
          id: {
            not: gameId // Exclude current game
          }
        }
      })

      if (existingGame) {
        return NextResponse.json(
          { error: `A game is already active or scheduled for ${location}. Only one game per continent is allowed at a time.` },
          { status: 409 }
        )
      }
    }

    // Update the game in the database
    const updateData: {
      title: string
      description?: string
      location: string
      launchDate: Date | null
      status?: 'PENDING' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED'
      region?: string | null
      minLatitude?: number | null
      maxLatitude?: number | null
      minLongitude?: number | null
      maxLongitude?: number | null
      totalLevels?: number
      stagesPerLevel?: number
      cluesPerStage?: number
    } = {
      title,
      location,
      launchDate: launchDate ? new Date(launchDate) : null
    }

    // Add optional fields if they're provided
    if (description !== undefined) updateData.description = description
    if (status) updateData.status = status as 'PENDING' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED'
    if (region !== undefined) updateData.region = region || null
    if (minLatitude !== undefined) updateData.minLatitude = minLatitude ? Number(minLatitude) : null
    if (maxLatitude !== undefined) updateData.maxLatitude = maxLatitude ? Number(maxLatitude) : null
    if (minLongitude !== undefined) updateData.minLongitude = minLongitude ? Number(minLongitude) : null
    if (maxLongitude !== undefined) updateData.maxLongitude = maxLongitude ? Number(maxLongitude) : null
    if (totalLevels !== undefined) updateData.totalLevels = Number(totalLevels)
    if (stagesPerLevel !== undefined) updateData.stagesPerLevel = Number(stagesPerLevel)
    if (cluesPerStage !== undefined) updateData.cluesPerStage = Number(cluesPerStage)

    const game = await prisma.game.update({
      where: { id: gameId },
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

    // Log the activity
    try {
      const changes = []
      if (currentGame.title !== title) changes.push(`title: "${currentGame.title}" → "${title}"`)
      if (currentGame.location !== location) changes.push(`continent: "${currentGame.location}" → "${location}"`)
      if (status && currentGame.status !== status) changes.push(`status: "${currentGame.status}" → "${status}"`)
      if (currentGame.launchDate !== updateData.launchDate) {
        const oldDate = currentGame.launchDate ? new Date(currentGame.launchDate).toLocaleDateString() : 'None'
        const newDate = updateData.launchDate ? new Date(updateData.launchDate).toLocaleDateString() : 'None'
        changes.push(`launch date: ${oldDate} → ${newDate}`)
      }

      if (changes.length > 0) {
        await prisma.activity.create({
          data: {
            type: 'GAME_UPDATED',
            description: `Updated game "${title}": ${changes.join(', ')}`,
            userId: decoded.userId,
            details: {
              gameId: game.id,
              gameTitle: title,
              changes: changes
            }
          }
        })
      }
    } catch (activityError) {
      console.error('Failed to log game update activity:', activityError)
      // Don't fail the main operation if activity logging fails
    }

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
  { params }: { params: Promise<{ gameId: string }> }
) {
  return PUT(request, { params })
}

// DELETE game (SuperAdmin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    // Lazy load dependencies
    const { prisma } = await import('@/lib/prisma')
    const { verifyToken, getTokenFromHeader } = await import('@/lib/auth')

    const { gameId } = await params
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

    // Delete the game and all related records
    const gameToDelete = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        title: true,
        location: true
      }
    })

    if (!gameToDelete) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Delete all related records in the correct order to respect foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete clue submissions first
      await tx.clueSubmission.deleteMany({
        where: {
          participant: {
            gameId: gameId
          }
        }
      })

      // Delete clues
      await tx.clue.deleteMany({
        where: {
          hunt: {
            stage: {
              level: {
                gameId: gameId
              }
            }
          }
        }
      })

      // Delete hunts
      await tx.hunt.deleteMany({
        where: {
          stage: {
            level: {
              gameId: gameId
            }
          }
        }
      })

      // Delete badges
      await tx.badge.deleteMany({
        where: {
          progress: {
            participant: {
              gameId: gameId
            }
          }
        }
      })

      // Delete participant progress
      await tx.participantProgress.deleteMany({
        where: {
          participant: {
            gameId: gameId
          }
        }
      })

      // Delete transactions and wallets
      await tx.transaction.deleteMany({
        where: {
          wallet: {
            participant: {
              gameId: gameId
            }
          }
        }
      })

      await tx.wallet.deleteMany({
        where: {
          participant: {
            gameId: gameId
          }
        }
      })

      // Delete participants
      await tx.participant.deleteMany({
        where: {
          gameId: gameId
        }
      })

      // Delete clue sets
      await tx.clueSet.deleteMany({
        where: {
          gameId: gameId
        }
      })

      // Delete stages
      await tx.stage.deleteMany({
        where: {
          level: {
            gameId: gameId
          }
        }
      })

      // Delete levels
      await tx.level.deleteMany({
        where: {
          gameId: gameId
        }
      })

      // Finally delete the game
      await tx.game.delete({
        where: { id: gameId }
      })
    })

    // Log the activity
    try {
      await prisma.activity.create({
        data: {
          type: 'GAME_DELETED',
          description: `Deleted game "${gameToDelete.title}" from ${gameToDelete.location}`,
          userId: decoded.userId,
          details: {
            gameId: gameToDelete.id,
            gameTitle: gameToDelete.title,
            continent: gameToDelete.location
          }
        }
      })
    } catch (activityError) {
      console.error('Failed to log game deletion activity:', activityError)
      // Don't fail the main operation if activity logging fails
    }

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

// DEBUG: GET game details with extra diagnostics
export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const { verifyToken, getTokenFromHeader } = await import('@/lib/auth');
    const { gameId } = params;
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required', debug: { gameId, tokenPresent: false } }, { status: 401 });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired authentication token', debug: { gameId, tokenPresent: true } }, { status: 401 });
    }
    // Find the game and include all relevant relations
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        creator: true,
        levels: { include: { stages: true } },
        participants: true,
      },
    });
    if (!game) {
      return NextResponse.json({ error: 'Game not found', debug: { gameId, found: false } }, { status: 404 });
    }
    // Check for required relations
    const hasLevels = Array.isArray(game.levels) && game.levels.length > 0;
    const hasStages = hasLevels && game.levels.some(l => Array.isArray(l.stages) && l.stages.length > 0);
    const hasCreator = !!game.creator;
    // Return all debug info
    return NextResponse.json({
      game,
      debug: {
        gameId,
        found: true,
        status: game.status,
        hasLevels,
        hasStages,
        hasCreator,
        participants: game.participants.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', debug: { message: (error as Error).message } }, { status: 500 });
  }
}
