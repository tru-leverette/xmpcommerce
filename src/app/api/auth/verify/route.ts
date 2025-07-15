import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenAndUser, getTokenFromHeader } from '@/lib/auth'

// GET - Verify if user token is still valid
export async function GET(request: NextRequest) {
  try {
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
