import { useEffect, useRef } from 'react'

/**
 * Hook to detect and handle multi-tab security issues
 */
export function useTabSecurity() {
  const tabId = useRef<string>('')
  const lastTokenCheck = useRef<string | null>(null)

  useEffect(() => {
    // Generate unique tab identifier
    tabId.current = `tab_${Date.now()}_${Math.random()}`
    
    // Store tab session info
    sessionStorage.setItem('tabId', tabId.current)
    sessionStorage.setItem('tabStartTime', Date.now().toString())

    const validateTabSecurity = () => {
      const currentToken = localStorage.getItem('token')
      const storedTabId = sessionStorage.getItem('tabId')
      
      // Check if token changed unexpectedly
      if (lastTokenCheck.current && 
          lastTokenCheck.current !== currentToken &&
          currentToken !== null) {
        
        console.warn('Token changed in another tab - potential security issue')
        
        // Force re-authentication in this tab
        window.location.href = '/auth/login?reason=token_changed'
        return
      }
      
      // Check if tab ID was tampered with
      if (storedTabId !== tabId.current) {
        console.warn('Tab ID mismatch - potential tab hijacking')
        sessionStorage.clear()
        window.location.href = '/auth/login?reason=tab_security'
        return
      }
      
      lastTokenCheck.current = currentToken
    }

    // Check security every 30 seconds
    const securityInterval = setInterval(validateTabSecurity, 30000)
    
    // Check when tab becomes visible (user switches back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        validateTabSecurity()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(securityInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return { tabId: tabId.current }
}
