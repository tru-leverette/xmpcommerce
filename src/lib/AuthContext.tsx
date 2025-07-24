'use client'

import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (accessToken: string, refreshToken: string) => void
  logout: () => void
  verifyAuth: (requiredRole?: string[]) => Promise<boolean>
  refreshAccessToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Global cache to prevent multiple API calls
const authCache = {
  isValid: false,
  token: '',
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 minutes
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = sessionStorage.getItem('refreshToken')

      if (!refreshToken) {
        console.warn('No refresh token found')
        return false
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      })

      if (!response.ok) {
        console.warn('Refresh token failed')
        return false
      }

      const data = await response.json()

      // Store the new access token
      sessionStorage.setItem('token', data.accessToken)
      authCache.isValid = false // Reset cache for new token

      console.log('Access token refreshed successfully')
      return true

    } catch (error) {
      console.error('Token refresh error:', error)
      return false
    }
  }, [])

  const verifyAuth = useCallback(async (requiredRole: string[] = []): Promise<boolean> => {
    try {
      let token = sessionStorage.getItem('token')

      if (!token) {
        console.warn('No token found')
        setIsAuthenticated(false)
        setUser(null)
        setIsLoading(false)
        return false
      }

      // Check cache first
      const now = Date.now()
      if (authCache.isValid && authCache.token === token && (now - authCache.timestamp) < authCache.ttl) {
        console.log('Using cached auth verification - no API call needed')
        setIsAuthenticated(true)
        setIsLoading(false)
        return true
      }

      // Parse user from token for basic info (optimization)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const userData: User = {
          id: payload.userId,
          email: payload.email,
          username: payload.username || payload.email.split('@')[0],
          role: payload.role,
          avatar: payload.avatar || '',
        };
        setUser(userData)

        // Check role requirements from token
        if (requiredRole.length > 0 && !requiredRole.includes(userData.role)) {
          console.warn('Insufficient role permissions')
          setIsAuthenticated(false)
          setIsLoading(false)
          return false
        }
      } catch (tokenError) {
        console.error('Token parsing failed:', tokenError)
        setIsAuthenticated(false)
        setUser(null)
        setIsLoading(false)
        return false
      }

      // Only make API call for verification if cache is invalid
      console.log('Making single auth verification API call')
      const testEndpoint = requiredRole.includes('ADMIN') || requiredRole.includes('SUPERADMIN')
        ? '/api/admin/users'
        : '/api/user/profile'

      let response = await fetch(testEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // If token expired, try to refresh it automatically
      if (response.status === 401) {
        console.log('Access token expired, attempting refresh...')
        const refreshSuccess = await refreshAccessToken()

        if (refreshSuccess) {
          // Retry with the new token
          const newToken = sessionStorage.getItem('token')!
          response = await fetch(testEndpoint, {
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          })
          // Update token for cache
          token = newToken
        }
      }

      if (!response.ok) {
        console.warn('Server-side auth failed')
        sessionStorage.clear()
        authCache.isValid = false
        setIsAuthenticated(false)
        setUser(null)
        setIsLoading(false)
        return false
      }

      // Update cache
      authCache.isValid = true
      authCache.token = token
      authCache.timestamp = now

      console.log('Auth verification successful')
      setIsAuthenticated(true)
      setIsLoading(false)
      return true

    } catch (error) {
      console.error('Auth verification error:', error)
      sessionStorage.clear()
      authCache.isValid = false
      setIsAuthenticated(false)
      setUser(null)
      setIsLoading(false)
      return false
    }
  }, [refreshAccessToken])

  const login = useCallback((accessToken: string, refreshToken: string) => {
    sessionStorage.setItem('token', accessToken)
    sessionStorage.setItem('refreshToken', refreshToken)
    authCache.isValid = false // Reset cache on new login
    verifyAuth()
  }, [verifyAuth])

  const logout = useCallback(() => {
    sessionStorage.clear()
    authCache.isValid = false
    setIsAuthenticated(false)
    setUser(null)
    setIsLoading(false)
    router.push('/auth/login')
  }, [router])

  useEffect(() => {
    verifyAuth()
  }, [verifyAuth])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated,
      login,
      logout,
      verifyAuth,
      refreshAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
