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

// PATCH - Ban/Unban user or change role (Admin/SuperAdmin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { prisma, verifyToken, getTokenFromHeader } = await loadDependencies()
    const { userId } = await params
    // Authentication check
    const authHeader = request.headers.get('authorization')
    const { action, role } = await request.json()
    
    const token = getTokenFromHeader(authHeader)
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    
    if (!['ADMIN', 'SUPERADMIN'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // For role changes, only SuperAdmin can do it
    if (role && decoded.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Only SuperAdmins can change user roles' },
        { status: 403 }
      )
    }

    const updateData: {
      status?: 'ACTIVE' | 'BANNED'
      role?: 'USER' | 'ADMIN' | 'SUPERADMIN'
    } = {}

    if (action === 'ban') {
      updateData.status = 'BANNED'
    } else if (action === 'unban') {
      updateData.status = 'ACTIVE'
    }

    if (role) {
      updateData.role = role
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true
      }
    })

    // Log the activity
    try {
      let description = ''
      if (action === 'ban') {
        description = `Banned user ${updatedUser.username}`
      } else if (action === 'unban') {
        description = `Unbanned user ${updatedUser.username}`
      } else if (role) {
        description = `Updated user ${updatedUser.username} role to ${role}`
      }

      if (description) {
        await prisma.activity.create({
          data: {
            type: action === 'ban' ? 'USER_BANNED' : action === 'unban' ? 'USER_UNBANNED' : 'USER_UPDATED',
            description,
            userId: decoded.userId,
            details: {
              targetUserId: userId,
              targetUsername: updatedUser.username,
              action,
              newRole: role,
              newStatus: updateData.status
            }
          }
        })
      }
    } catch (activityError) {
      console.error('Failed to log user update activity:', activityError)
      // Don't fail the main operation if activity logging fails
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
