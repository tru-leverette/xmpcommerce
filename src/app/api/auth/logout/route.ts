import { NextRequest, NextResponse } from 'next/server'

// Dynamic route configuration to prevent static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy load dependencies to avoid build-time issues
const loadDependencies = async () => {
  const { prisma } = await import('@/lib/prisma')
  const { verifyToken, getTokenFromHeader } = await import('@/lib/auth')
  return { prisma, verifyToken, getTokenFromHeader }
}

export async function POST(request: NextRequest) {
  try {
    const { prisma, verifyToken, getTokenFromHeader } = await loadDependencies()
    
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    let decoded
    try {
      decoded = verifyToken(token)
    } catch (tokenError) {
      console.log('Logout API - Token verification failed:', tokenError)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user details for logging
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Log the logout activity
    try {
      await prisma.activity.create({
        data: {
          type: 'USER_LOGOUT',
          description: `User ${user.username} logged out`,
          userId: user.id,
          details: {
            email: user.email,
            role: user.role,
            logoutTime: new Date().toISOString()
          }
        }
      })
    } catch (activityError) {
      console.error('Failed to log logout activity:', activityError)
      // Don't fail the logout if activity logging fails
    }

    return NextResponse.json({
      message: 'Logout successful'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
