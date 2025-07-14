import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

export async function GET(request: NextRequest) {
  try {
    // Import prisma dynamically to avoid build-time database connection issues
    const { prisma } = await import('@/lib/prisma')
    
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)

    // Get user's badges through their progress
    const badges = await prisma.badge.findMany({
      where: {
        progress: {
          participant: {
            userId: decoded.userId
          }
        }
      },
      orderBy: {
        earnedAt: 'desc'
      }
    })

    return NextResponse.json({
      badges
    })

  } catch (error) {
    console.error('Badges fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
