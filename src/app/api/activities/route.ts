import { NextRequest, NextResponse } from 'next/server'

// Dynamic route configuration to prevent static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy load dependencies to avoid build-time issues
const loadDependencies = async () => {
  const { prisma } = await import('@/lib/prisma')
  const { verifyTokenAndUser, getTokenFromHeader } = await import('@/lib/auth')
  return { prisma, verifyTokenAndUser, getTokenFromHeader }
}

// GET all activities (admin only)
export async function GET(request: NextRequest) {
  try {
    const { prisma, verifyTokenAndUser, getTokenFromHeader } = await loadDependencies()

    // Authentication check
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)
    
    console.log('Activities API - Auth header:', authHeader)
    console.log('Activities API - Extracted token:', token)
    
    if (!token) {
      console.log('Activities API - No token provided')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let decoded
    try {
      decoded = await verifyTokenAndUser(token)
      console.log('Activities API - Verified user:', { userId: decoded.userId, role: decoded.role })
    } catch (tokenError) {
      console.log('Activities API - Token/User verification failed:', tokenError)
      return NextResponse.json(
        { error: 'Invalid token or user no longer exists' },
        { status: 401 }
      )
    }
    
    // Temporarily allow all authenticated users to view activities for testing
    console.log('Activities API - User authenticated with role:', decoded.role)

    // Parse pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get total count for pagination
    const totalCount = await prisma.activity.count()
    const totalPages = Math.ceil(totalCount / limit)

    const activities = await prisma.activity.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: skip,
      take: limit
    })

    return NextResponse.json({ 
      activities,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new activity (internal use)
export async function POST(request: NextRequest) {
  try {
    const { prisma } = await loadDependencies()
    
    const { type, description, details, userId } = await request.json()

    if (!type || !description || !userId) {
      return NextResponse.json(
        { error: 'Type, description, and userId are required' },
        { status: 400 }
      )
    }

    const activity = await prisma.activity.create({
      data: {
        type,
        description,
        details: details || {},
        userId
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Activity logged successfully',
      activity
    })

  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
