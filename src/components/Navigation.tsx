'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
      // In a real app, you'd decode the JWT to get user info
      // For now, we'll assume they're a regular user
      setUserRole('USER')
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    setUserRole(null)
    router.push('/')
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Treasure Hunt
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {isAuthenticated && (
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
            )}
            
            <Link href="/games" className="text-gray-700 hover:text-blue-600">
              Games
            </Link>

            {!isAuthenticated ? (
              <>
                <Link 
                  href="/auth/login" 
                  className="text-gray-700 hover:text-blue-600"
                >
                  Login
                </Link>
                <Link 
                  href="/auth/register" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                {(userRole === 'ADMIN' || userRole === 'SUPERADMIN') && (
                  <Link 
                    href="/admin" 
                    className="text-gray-700 hover:text-blue-600"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
