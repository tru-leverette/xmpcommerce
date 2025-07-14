import { NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma'
// import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// GET all users (Admin/SuperAdmin only)
export async function GET() {
  try {
    // Authentication would be checked here
    // const authHeader = request.headers.get('authorization')
    
    // const token = getTokenFromHeader(authHeader)
    // if (!token) {
    //   return NextResponse.json(
    //     { error: 'Authentication required' },
    //     { status: 401 }
    //   )
    // }

    // const decoded = verifyToken(token)
    
    // if (!['ADMIN', 'SUPERADMIN'].includes(decoded.role)) {
    //   return NextResponse.json(
    //     { error: 'Insufficient permissions' },
    //     { status: 403 }
    //   )
    // }

    // const users = await prisma.user.findMany({
    //   select: {
    //     id: true,
    //     email: true,
    //     username: true,
    //     role: true,
    //     status: true,
    //     createdAt: true,
    //     _count: {
    //       select: {
    //         participants: true
    //       }
    //     }
    //   },
    //   orderBy: {
    //     createdAt: 'desc'
    //   }
    // })

    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        username: 'user1',
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date(),
        _count: { participants: 3 }
      },
      {
        id: '2',
        email: 'admin@example.com',
        username: 'admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: new Date(),
        _count: { participants: 0 }
      }
    ]

    return NextResponse.json({ users: mockUsers })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
