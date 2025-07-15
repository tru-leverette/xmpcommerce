import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// Validate if participant's location is within the game's geographic bounds
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
    const { gameId, latitude, longitude } = await request.json()

    if (!gameId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Game ID, latitude, and longitude are required' },
        { status: 400 }
      )
    }

    // Get game geographic bounds
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        title: true,
        region: true,
        minLatitude: true,
        maxLatitude: true,
        minLongitude: true,
        maxLongitude: true
      }
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Check if participant exists in this game
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

    // Validate location is within game bounds
    let isValidLocation = false
    let locationMessage = ''

    if (game.minLatitude && game.maxLatitude && game.minLongitude && game.maxLongitude) {
      isValidLocation = (
        latitude >= game.minLatitude &&
        latitude <= game.maxLatitude &&
        longitude >= game.minLongitude &&
        longitude <= game.maxLongitude
      )
      
      if (isValidLocation) {
        locationMessage = `Location validated for ${game.region || game.title}`
      } else {
        locationMessage = `Location outside game region. You must be in ${game.region || game.title} to participate.`
      }
    } else {
      // If no bounds set, accept any location for now
      isValidLocation = true
      locationMessage = 'Location accepted (geographic bounds not yet configured)'
    }

    // Update participant's location
    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date()
      }
    })

    // Log location validation activity
    try {
      await prisma.activity.create({
        data: {
          type: 'USER_LOGIN', // We'll add LOCATION_UPDATE to ActivityType later
          description: `Location ${isValidLocation ? 'validated' : 'rejected'} for ${game.title}`,
          userId: decoded.userId,
          details: {
            gameId,
            latitude,
            longitude,
            isValid: isValidLocation,
            region: game.region
          }
        }
      })
    } catch (activityError) {
      console.error('Failed to log location activity:', activityError)
    }

    return NextResponse.json({
      isValidLocation,
      message: locationMessage,
      game: {
        id: game.id,
        title: game.title,
        region: game.region
      },
      location: {
        latitude,
        longitude
      }
    })

  } catch (error) {
    console.error('Location validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
