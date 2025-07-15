import { NextRequest, NextResponse } from 'next/server'

// Dynamic route configuration to prevent static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy load dependencies to avoid build-time issues
const loadDependencies = async () => {
  const { verifyTokenAndUser, getTokenFromHeader } = await import('@/lib/auth')
  return { verifyTokenAndUser, getTokenFromHeader }
}

// GET - Verify if user token is still valid
export async function GET(request: NextRequest) {
  try {
    const { verifyTokenAndUser, getTokenFromHeader } = await loadDependencies()
    
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const decoded = await verifyTokenAndUser(token)
    
    return NextResponse.json({
      valid: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    })

  } catch (error) {
    console.error('Token verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid token or user no longer exists' },
      { status: 401 }
    )
  }
}
