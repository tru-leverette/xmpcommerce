import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)

    // Get user's game participations with progress
    const participations = await prisma.participant.findMany({
      where: { userId: decoded.userId },
      include: {
        game: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true
          }
        },
        progress: {
          select: {
            currentLevel: true,
            currentStage: true,
            currentHunt: true,
            currentClue: true,
            isCompleted: true,
            completedAt: true
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    })

    return NextResponse.json({
      participations
    })

  } catch (error) {
    console.error('Participations fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
