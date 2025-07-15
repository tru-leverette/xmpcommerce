/**
 * Client-side authentication verification
 * Checks if the current user's token is still valid and user exists
 */

export const verifyClientAuth = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token')
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
      localStorage.removeItem('token')
      return false
    }

    return true
  } catch (error) {
    console.error('Auth verification failed:', error)
    localStorage.removeItem('token')
    return false
  }
}

export const logoutUser = () => {
  localStorage.removeItem('token')
  window.location.href = '/auth/login'
}
