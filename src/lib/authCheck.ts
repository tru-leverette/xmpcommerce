/**
 * Client-side authentication verification
 * Checks if the current user's token is still valid and user exists
 */

export const verifyClientAuth = async (): Promise<boolean> => {
  try {
    const token = sessionStorage.getItem('token')
    if (!token) {
      return false
    }

    // Test the token by making a lightweight API call
    const response = await fetch('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      // Token is invalid or user doesn't exist - clear it
      sessionStorage.removeItem('token')
      return false
    }

    return true
  } catch (error) {
    console.error('Auth verification failed:', error)
    sessionStorage.removeItem('token')
    return false
  }
}

export const logoutUser = () => {
  sessionStorage.removeItem('token')
  window.location.href = '/auth/login'
}
