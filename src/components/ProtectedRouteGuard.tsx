'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProtectedRouteGuardProps {
  children: React.ReactNode
}

export default function ProtectedRouteGuard({ children }: ProtectedRouteGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        // User is not logged in, redirect to login
        router.push('/auth/login')
      } else {
        // User is logged in, allow access
        setIsAuthenticated(true)
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

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
