'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ProtectedRouteGuardProps {
  children: React.ReactNode
  requiredRole?: string[]
  redirectTo?: string
}

// Global cache to prevent multiple API calls
const authCache = {
  isValid: false,
  token: '',
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 minutes
}

export default function ProtectedRouteGuard({ 
  children, 
  requiredRole = [], 
  redirectTo = '/auth/login' 
}: ProtectedRouteGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const hasVerified = useRef(false)

  const verifyAccess = useCallback(async () => {
    // Prevent multiple simultaneous verifications
    if (hasVerified.current) {
      console.log('Already verified - skipping duplicate verification')
      return
    }
    hasVerified.current = true

    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.warn('No token found - redirecting to login')
        setIsLoading(false)
        setIsAuthenticated(false)
        router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`)
        return
      }

      // Check cache first
      const now = Date.now()
      if (authCache.isValid && authCache.token === token && (now - authCache.timestamp) < authCache.ttl) {
        console.log('Using cached auth verification - skipping API call')
        setIsAuthenticated(true)
        setIsLoading(false)
        return
      }

      // Only call API if cache is invalid
      console.log('Making auth verification API call')
      const testEndpoint = requiredRole.includes('ADMIN') || requiredRole.includes('SUPERADMIN') 
        ? '/api/admin/users' 
        : '/api/user/profile'

      const response = await fetch(testEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        console.warn('Server-side auth failed - token invalid or insufficient permissions')
        localStorage.clear()
        authCache.isValid = false
        setIsAuthenticated(false)
        setIsLoading(false)
        router.push(`${redirectTo}?redirect=${window.location.pathname}&reason=invalid_token`)
        return
      }

      // Update cache
      authCache.isValid = true
      authCache.token = token
      authCache.timestamp = now

      setIsAuthenticated(true)
      if (requiredRole.length > 0) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const userRole = payload.role
          
          if (!requiredRole.includes(userRole)) {
            console.warn('Insufficient role permissions')
            router.push(`${redirectTo}?redirect=${window.location.pathname}&reason=insufficient_permissions`)
            return
          }
        } catch (error) {
          console.error('Token parsing failed:', error)
          localStorage.clear()
          authCache.isValid = false
          router.push(`${redirectTo}?redirect=${window.location.pathname}&reason=token_parse_error`)
          return
        }
      }

      console.log('Server-side auth successful')
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Auth verification failed:', error)
      localStorage.clear()
      authCache.isValid = false
      router.push(`${redirectTo}?redirect=${window.location.pathname}&reason=verification_failed`)
    } finally {
      setIsLoading(false)
    }
  }, [requiredRole, redirectTo, router])

  useEffect(() => {
    verifyAccess()
  }, [verifyAccess])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!isAuthenticated ? 'Verifying access...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
