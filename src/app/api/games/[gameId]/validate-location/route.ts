import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

interface LocationValidationRequest {
  latitude: number
  longitude: number
}

// Validate if a location is within game boundaries
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params
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
    const { latitude, longitude }: LocationValidationRequest = await request.json()

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    // Get game with geographic boundaries
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        title: true,
        location: true,
        region: true,
        maxLatitude: true,
        minLatitude: true,
        maxLongitude: true,
        minLongitude: true,
        status: true
      }
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    if (game.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Game is not active' },
        { status: 400 }
      )
    }

    // Check if user is a participant
    const participant = await prisma.participant.findUnique({
      where: {
        userId_gameId: {
          userId: decoded.userId,
          gameId: gameId
        }
      },
      select: {
        id: true,
        scavengerStones: true,
        currentLatitude: true,
        currentLongitude: true
      }
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant in this game' },
        { status: 403 }
      )
    }

    // Validate location is within game boundaries
    const isWithinBounds = !game.maxLatitude || !game.minLatitude || !game.maxLongitude || !game.minLongitude || (
      latitude <= game.maxLatitude &&
      latitude >= game.minLatitude &&
      longitude <= game.maxLongitude &&
      longitude >= game.minLongitude
    )

    if (!isWithinBounds) {
      return NextResponse.json({
        valid: false,
        reason: 'OUTSIDE_GAME_AREA',
        message: `Location is outside the ${game.region || 'game'} area`,
        bounds: {
          north: game.maxLatitude,
          south: game.minLatitude,
          east: game.maxLongitude,
          west: game.minLongitude
        }
      })
    }

    // Calculate distance from last known location (if exists)
    let distanceFromLast = null
    if (participant.currentLatitude && participant.currentLongitude) {
      const R = 6371 // Earth's radius in kilometers
      const dLat = (latitude - participant.currentLatitude) * Math.PI / 180
      const dLon = (longitude - participant.currentLongitude) * Math.PI / 180
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(participant.currentLatitude * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      distanceFromLast = R * c // Distance in kilometers
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
          type: 'USER_UPDATED',
          description: `Location validated in ${game.region || 'game area'} for ${game.title}`,
          userId: decoded.userId,
          details: {
            gameId,
            latitude,
            longitude,
            region: game.region,
            distanceFromLast
          }
        }
      })
    } catch (activityError) {
      console.error('Failed to log location activity:', activityError)
    }

    return NextResponse.json({
      valid: true,
      location: {
        latitude,
        longitude,
        region: game.region
      },
      participant: {
        scavengerStones: participant.scavengerStones
      },
      distanceFromLast,
      bounds: {
        north: game.maxLatitude,
        south: game.minLatitude,
        east: game.maxLongitude,
        west: game.minLongitude
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
