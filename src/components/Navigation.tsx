'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useTabSecurity } from '@/lib/hooks/useTabSecurity'

export default function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Add tab security monitoring at component level
  useTabSecurity()

  useEffect(() => {
    setMounted(true)
    
    const checkAuth = () => {
      // Check if user is authenticated
      const token = localStorage.getItem('token')
      if (token) {
        setIsAuthenticated(true)
        
        // Try to decode JWT token to get user info
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          setUserRole(payload.role || 'USER')
          setUserName(payload.username || payload.email || 'User')
          console.log('User role from token:', payload.role)
        } catch {
          // If token parsing fails, treat as unauthenticated
          setIsAuthenticated(false)
          setUserRole(null)
          setUserName('')
          console.log('Token parsing failed - user unauthenticated')
        }
      } else {
        setIsAuthenticated(false)
        setUserRole(null)
        setUserName('')
      }
    }

    // Initial check
    checkAuth()

    // Listen for storage changes (when login/logout happens in the same tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        checkAuth()
      }
    }

    // Listen for custom events (for same-tab login/logout)
    const handleAuthChange = () => {
      checkAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authChange', handleAuthChange)

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authChange', handleAuthChange)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Check auth state when pathname changes (route navigation)
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      if (token) {
        setIsAuthenticated(true)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          setUserRole(payload.role || 'USER')
          setUserName(payload.username || payload.email || 'User')
        } catch {
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            const userData = JSON.parse(storedUser)
            setUserRole(userData.role || 'USER')
            setUserName(userData.username || userData.email || 'User')
          } else {
            setUserRole('SUPERADMIN')
            setUserName('Admin User')
          }
        }
      } else {
        setIsAuthenticated(false)
        setUserRole(null)
        setUserName('')
      }
    }

    checkAuth()
  }, [pathname]) // Re-run when route changes

  const handleLogout = async () => {
    const token = localStorage.getItem('token')
    
    // Call logout API to record activity before clearing token
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      } catch (error) {
        console.error('Failed to log logout activity:', error)
        // Continue with logout even if API call fails
      }
    }
    
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    setUserRole(null)
    setUserName('')
    setShowDropdown(false)
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authChange'))
    
    router.push('/')
  }

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // Prevent hydration mismatch by not rendering auth-dependent content until mounted
  if (!mounted) {
    return (
      <nav className="bg-white shadow-lg relative z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image 
                src="/parrot_logo.png" 
                alt="Scavenger Hunt Logo" 
                width={250} 
                height={80}
                style={{ width: 'auto', height: '80px' }}
                priority
              />
            </Link>

            {/* Navigation Links - skeleton while loading */}
            <div className="flex items-center space-x-6">
              <Link href="/games" className="text-gray-700 hover:text-blue-600">
                Games
              </Link>
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Don't render navigation on home page
  if (pathname === '/') {
    return null
  }

  return (
    <nav className="bg-white shadow-lg relative z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image 
              src="/parrot_logo.png" 
              alt="Scavenger Hunt Logo" 
              width={250} 
              height={80}
              style={{ width: 'auto', height: '80px' }}
              priority
            />
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {/* Games link - available to everyone */}
            <Link 
              href="/games" 
              className="text-gray-700 hover:text-blue-600"
            >
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
              <div className="flex items-center space-x-6">
                {/* Dashboard link for authenticated users */}
                <Link 
                  href="/dashboard" 
                  className="text-gray-700 hover:text-blue-600"
                >
                  Dashboard
                </Link>
                
                {/* User Avatar Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span className="text-sm font-medium">
                      {getInitials(userName || 'User')}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <Link
                        href="/user/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        Settings
                      </Link>
                      
                      {(userRole === 'ADMIN' || userRole === 'SUPERADMIN') && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowDropdown(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      
                      <hr className="my-1" />
                      
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
