import { NextRequest, NextResponse } from 'next/server'

// Dynamic route configuration to prevent static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy load dependencies to avoid build-time issues
const loadDependencies = async () => {
  const { prisma } = await import('@/lib/prisma')
  const { comparePasswords, generateToken } = await import('@/lib/auth')
  return { prisma, comparePasswords, generateToken }
}

export async function POST(request: NextRequest) {
  try {
    const { prisma, comparePasswords, generateToken } = await loadDependencies()
    
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user is banned
    if (user.status === 'BANNED') {
      return NextResponse.json(
        { error: 'Account has been banned' },
        { status: 403 }
      )
    }

    // Verify password
    const isValidPassword = await comparePasswords(password, user.password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Log the login activity
    try {
      await prisma.activity.create({
        data: {
          type: 'USER_LOGIN',
          description: `User ${user.username} logged in`,
          userId: user.id,
          details: {
            email: user.email,
            role: user.role,
            loginTime: new Date().toISOString()
          }
        }
      })
    } catch (activityError) {
      console.error('Failed to log login activity:', activityError)
      // Don't fail the login if activity logging fails
    }

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email,
        username: user.username,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
