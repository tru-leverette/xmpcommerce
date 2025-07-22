import { NextRequest, NextResponse } from 'next/server'

// Dynamic route configuration to prevent static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy load dependencies to avoid build-time issues
const loadDependencies = async () => {
  const { validateRefreshToken, generateToken } = await import('@/lib/auth')
  const { prisma } = await import('@/lib/prisma')
  return { validateRefreshToken, generateToken, prisma }
}

export async function POST(request: NextRequest) {
  try {
    const { validateRefreshToken, generateToken, prisma } = await loadDependencies()

    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    // Validate the refresh token
    const userData = await validateRefreshToken(refreshToken)

    if (!userData) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    // Generate new access token
    const newAccessToken = generateToken({
      userId: userData.userId,
      email: userData.email,
      role: userData.role as 'USER' | 'ADMIN' | 'SUPERADMIN',
      type: 'access'
    })

    // Optional: Rotate refresh token for enhanced security
    // For now, we'll keep the same refresh token but could generate a new one

    // Log the token refresh activity
    try {
      await prisma.activity.create({
        data: {
          type: 'TOKEN_REFRESH',
          description: `Access token refreshed for user ${userData.email}`,
          userId: userData.userId,
          details: {
            email: userData.email,
            role: userData.role,
            refreshTime: new Date().toISOString()
          }
        }
      })
    } catch (activityError) {
      console.error('Failed to log token refresh activity:', activityError)
      // Don't fail the refresh if activity logging fails
    }

    return NextResponse.json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      user: {
        id: userData.userId,
        email: userData.email,
        role: userData.role
      }
    })

  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    )
  }
}
