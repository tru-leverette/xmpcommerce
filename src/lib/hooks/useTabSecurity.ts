import { useEffect, useRef } from 'react';

/**
 * Hook to detect and handle multi-tab security issues
 */
export function useTabSecurity() {

  // Only generate a new tabId if one does not already exist in sessionStorage
  const tabId = useRef<string>('');
  const lastTokenCheck = useRef<string | null>(null);

  useEffect(() => {
    let existingTabId = sessionStorage.getItem('tabId');
    if (!existingTabId) {
      existingTabId = `tab_${Date.now()}_${Math.random()}`;
      sessionStorage.setItem('tabId', existingTabId);
      sessionStorage.setItem('tabStartTime', Date.now().toString());
    }
    tabId.current = existingTabId;


    const validateTabSecurity = () => {
      const currentToken = sessionStorage.getItem('token');
      const storedTabId = sessionStorage.getItem('tabId');

      // Check if token changed unexpectedly
      if (
        lastTokenCheck.current &&
        lastTokenCheck.current !== currentToken &&
        currentToken !== null
      ) {
        console.warn('Token changed in another tab - potential security issue');
        // Force re-authentication in this tab
        window.location.href = '/auth/login?reason=token_changed';
        return;
      }

      // Check if tab ID was tampered with
      if (storedTabId !== tabId.current) {
        console.warn('Tab ID mismatch - potential tab hijacking');
        sessionStorage.clear();
        window.location.href = '/auth/login?reason=tab_security';
        return;
      }

      lastTokenCheck.current = currentToken;
    };

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
