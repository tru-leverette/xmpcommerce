'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProtectedRouteGuardProps {
  children: React.ReactNode
  requiredRole?: string[]
  redirectTo?: string
}

export default function ProtectedRouteGuard({ 
  children, 
  requiredRole = [], 
  redirectTo = '/auth/login' 
}: ProtectedRouteGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const token = localStorage.getItem('token')
        
        if (!token) {
          console.warn('No token found - redirecting to login')
          router.push(`${redirectTo}?redirect=${window.location.pathname}`)
          return
        }

        // Server-side verification with appropriate endpoint
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
          router.push(`${redirectTo}?redirect=${window.location.pathname}&reason=invalid_token`)
          return
        }

        // Additional role check if required
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
            router.push(`${redirectTo}?redirect=${window.location.pathname}&reason=token_parse_error`)
            return
          }
        }

        // If we get here, access is authorized
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Auth verification failed:', error)
        localStorage.clear()
        router.push(`${redirectTo}?redirect=${window.location.pathname}&reason=verification_failed`)
      } finally {
        setIsLoading(false)
      }
    }

    verifyAccess()
  }, [requiredRole, redirectTo, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!isAuthenticated ? 'Redirecting to login...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
