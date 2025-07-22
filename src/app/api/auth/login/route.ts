import { NextRequest, NextResponse } from 'next/server'

// Dynamic route configuration to prevent static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy load dependencies to avoid build-time issues
const loadDependencies = async () => {
  const { prisma } = await import('@/lib/prisma')
  const { comparePasswords, generateToken, generateRefreshToken, createRefreshTokenRecord } = await import('@/lib/auth')
  return { prisma, comparePasswords, generateToken, generateRefreshToken, createRefreshTokenRecord }
}

export async function POST(request: NextRequest) {
  try {
    const { prisma, comparePasswords, generateToken, generateRefreshToken, createRefreshTokenRecord } = await loadDependencies()

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
      // Log failed login attempt with system user
      try {
        let systemUser = await prisma.user.findUnique({
          where: { email: 'system@xmpcommerce.com' }
        })
        if (!systemUser) {
          systemUser = await prisma.user.create({
            data: {
              email: 'system@xmpcommerce.com',
              username: 'system',
              password: 'system-account-not-for-login',
              role: 'USER'
            }
          })
        }
        await prisma.activity.create({
          data: {
            type: 'USER_ERROR',
            description: `Failed login attempt: user not found for email ${email}`,
            userId: systemUser.id,
            details: {
              email,
              reason: 'User not found',
              loginTime: new Date().toISOString(),
              indicator: 'red-dot'
            }
          }
        })
      } catch (activityError) {
        console.error('Failed to log failed login activity (user not found):', activityError)
      }
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
      // Log failed login attempt
      try {
        await prisma.activity.create({
          data: {
            type: 'USER_ERROR',
            description: `Failed login attempt: invalid password for user ${user.username}`,
            userId: user.id,
            details: {
              email,
              reason: 'Invalid password',
              loginTime: new Date().toISOString(),
              indicator: 'red-dot'
            }
          }
        })
      } catch (activityError) {
        console.error('Failed to log failed login activity (invalid password):', activityError)
      }
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT tokens (access + refresh)
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      type: 'access'
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      type: 'refresh'
    })

    // Store refresh token in database
    await createRefreshTokenRecord(user.id, refreshToken)

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
      accessToken,
      refreshToken,
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
