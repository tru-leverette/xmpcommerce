'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface AuthRouteGuardProps {
  children: React.ReactNode
}

export default function AuthRouteGuard({ children }: AuthRouteGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem('token')

      if (token) {
        // User is logged in, redirect to dashboard
        setShouldRedirect(true)
        router.push('/dashboard')
      } else {
        // User is not logged in, allow access to auth pages
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading || shouldRedirect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {shouldRedirect ? 'Redirecting to dashboard...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
