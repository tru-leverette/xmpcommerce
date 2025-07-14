import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('=== REGISTRATION REQUEST START ===')
    
    // Import prisma dynamically to avoid build-time database connection issues
    const { prisma } = await import('@/lib/prisma')
    
    const { email, username, password } = await request.json()
    console.log('Request data:', { email, username, passwordLength: password?.length })

    // Validate input
    if (!email || !username || !password) {
      console.log('Validation failed: Missing required fields')
      return NextResponse.json(
        { error: 'Email, username, and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    console.log('Checking for existing user...')
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })
    console.log('Existing user check result:', existingUser ? 'User exists' : 'No existing user')

    if (existingUser) {
      console.log('User already exists, returning error')
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 409 }
      )
    }

    // Hash password and create user
    console.log('Hashing password...')
    const hashedPassword = await hashPassword(password)
    console.log('Password hashed successfully')
    
    console.log('Creating user in database...')
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'USER'
      }
    })
    console.log('User created successfully:', { id: user.id, email: user.email, username: user.username })

    // Generate JWT token
    console.log('Generating JWT token...')
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })
    console.log('JWT token generated successfully')

    console.log('Sending success response...')
    return NextResponse.json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email,
        username,
        role: user.role
      }
    })

  } catch (error) {
    console.error('=== REGISTRATION ERROR ===')
    console.error('Full error:', error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('=========================')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
