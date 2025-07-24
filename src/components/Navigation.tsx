'use client'


import { useAuth } from '@/lib/AuthContext'
import { useTabSecurity } from '@/lib/hooks/useTabSecurity'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function Navigation() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  // const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  useTabSecurity();

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // No need to check auth state on route change, handled by context

  const handleLogout = async () => {
    const token = sessionStorage.getItem('token');
    // Call logout API to record activity before clearing token
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Failed to log logout activity:', error);
        // Continue with logout even if API call fails
      }
    }
    setShowDropdown(false);
    logout(); // This will update context and redirect
  }

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Prevent hydration mismatch by not rendering auth-dependent content until mounted
  if (!mounted || isLoading) {
    return null;
  }

  // Don't render navigation on home page
  if (pathname === '/') {
    return null;
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
                    className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 overflow-hidden"
                    aria-label="User menu"
                  >
                    {user?.avatar ? (
                      <Image
                        src={`/assets/avatars/${user.avatar}`}
                        alt="Avatar"
                        width={40}
                        height={40}
                        className="object-cover w-10 h-10 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {getInitials(user?.username || user?.email || 'User')}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div id="navigation-icon-dropdown" className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowDropdown(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <Link
                        href="/user/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        Settings
                      </Link>
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
