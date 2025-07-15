import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenAndUser, getTokenFromHeader } from '@/lib/auth'
import type { JWTPayload } from '@/lib/auth'

/**
 * Authentication middleware that can be reused across API endpoints
 * @param request - The NextRequest object
 * @param requiredRoles - Array of required roles (e.g., ['ADMIN', 'SUPERADMIN'])
 * @returns Object with either error response or authenticated user
 */
export async function requireAuth(
  request: NextRequest,
  requiredRoles: string[] = []
): Promise<{ error?: NextResponse; user?: JWTPayload }> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)
    
    if (!token) {
      return { 
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    // Use enhanced verification that checks user exists in database
    const user = await verifyTokenAndUser(token)
    
    // Check role permissions if required roles are specified
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      return {
        error: NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    return { user }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      error: NextResponse.json(
        { error: 'Invalid token or user no longer exists' },
        { status: 401 }
      )
    }
  }
}

/**
 * Middleware for admin-only endpoints
 */
export async function requireAdmin(request: NextRequest) {
  return requireAuth(request, ['ADMIN', 'SUPERADMIN'])
}

/**
 * Middleware for super admin-only endpoints
 */
export async function requireSuperAdmin(request: NextRequest) {
  return requireAuth(request, ['SUPERADMIN'])
}

/**
 * Middleware for any authenticated user
 */
export async function requireUser(request: NextRequest) {
  return requireAuth(request, [])
}
