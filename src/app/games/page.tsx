'use client'

import { showToast } from '@/lib/toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

// Geographic restriction check function
function checkGeographicRestriction(
  userLocation: { lat: number; lng: number },
  gameLocation: string
): { isRestricted: boolean; reason?: string; suggestedAction?: string } {
  // Define rough geographic regions for continent-level restrictions
  const continents = {
    'Africa': {
      latMin: -35,
      latMax: 37,
      lngMin: -20,
      lngMax: 55
    },
    'North America': {
      latMin: 15,
      latMax: 83,
      lngMin: -168,
      lngMax: -52
    },
    'Europe': {
      latMin: 35,
      latMax: 71,
      lngMin: -25,
      lngMax: 45
    },
    'Asia': {
      latMin: -10,
      latMax: 77,
      lngMin: 40,
      lngMax: 180
    }
  }

  // First check: Are they on the right continent for this game?
  const gameContinent = continents[gameLocation as keyof typeof continents]
  if (!gameContinent) {
    // If we don't have continent data, allow access (could be global game)
    return { isRestricted: false }
  }

  // Check if user is on the correct continent
  const isOnCorrectContinent = userLocation.lat >= gameContinent.latMin &&
    userLocation.lat <= gameContinent.latMax &&
    userLocation.lng >= gameContinent.lngMin &&
    userLocation.lng <= gameContinent.lngMax

  if (!isOnCorrectContinent) {
    return {
      isRestricted: true,
      reason: `This game is designed for players in ${gameLocation}. You appear to be on a different continent.`,
      suggestedAction: 'Please check if there are games available in your region.'
    }
  }

  return { isRestricted: false }
}

interface Game {
  id: string
  title: string
  description: string
  location: string
  status: 'PENDING' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED'
  launchDate?: Date
  phase: string
  creator: {
    username: string
  }
  _count: {
    participants: number
  }
  isRegistered?: boolean // Track if current user is registered
}

function Games() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [capturingLocation, setCapturingLocation] = useState<string | null>(null)
  const router = useRouter()

  // Handle navigation with loading state
  const handleNavigation = (url: string) => {
    setIsNavigating(true)
    router.push(url)
  }

  // Handle continue game with geolocation capture
  const handleContinueGame = async (gameId: string, gameLocation: string) => {
    setCapturingLocation(gameId)

    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        showToast.error('Geolocation is not supported by this browser')
        setCapturingLocation(null)
        return
      }

      // Check current permission status if available
      let permissionStatus = 'unknown'
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' })
          permissionStatus = permission.state
          console.log('Geolocation permission status:', permissionStatus)
        } catch {
          console.log('Permissions API not supported, proceeding with geolocation request')
        }
      }

      // If permission is denied, show helpful message
      if (permissionStatus === 'denied') {
        showToast.error('Location access is blocked. Please enable location sharing in your browser settings and refresh the page.')
        setCapturingLocation(null)
        return
      }

      // If permission is not granted yet, show informative message
      if (permissionStatus === 'prompt') {
        showToast.info('Location access needed. Please allow location sharing when prompted.')
      }

      // Get user's current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000, // Increased timeout for better success rate
            maximumAge: 60000 // Cache location for 1 minute
          }
        )
      })

      const { latitude, longitude } = position.coords
      console.log(`Location captured: ${latitude}, ${longitude}`)

      // Check geographic restrictions before navigating
      if (gameLocation && gameLocation !== 'Global') {
        const isRestricted = checkGeographicRestriction(
          { lat: latitude, lng: longitude },
          gameLocation
        )

        if (isRestricted.isRestricted) {
          showToast.error(`Geographic Restriction: ${isRestricted.reason}\n\n${isRestricted.suggestedAction}`)
          setCapturingLocation(null)
          return
        }
      }

      // Navigate to game access page
      const url = `/games/${gameId}/access`
      showToast.success('Location captured successfully!')

      setIsNavigating(true)
      router.push(url)

    } catch (error) {
      console.error('Error capturing location:', error)

      // Handle different geolocation errors
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            showToast.error(
              'Location permission denied. Please:\n' +
              '1. Click the location icon in your browser address bar\n' +
              '2. Select "Allow" for location access\n' +
              '3. Refresh the page and try again'
            )
            break
          case error.POSITION_UNAVAILABLE:
            showToast.error('Location information unavailable. Please try again or check your device settings.')
            break
          case error.TIMEOUT:
            showToast.error('Location request timed out. Please try again.')
            break
          default:
            showToast.error('An unknown error occurred while getting location. Please try again.')
        }
      } else {
        showToast.error('Unable to capture location. Please try again.')
      }
    } finally {
      setCapturingLocation(null)
    }
  }

  const fetchGames = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {}

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/games', { headers })
      const data = await response.json()
      const gamesData = data.games || []
      setGames(gamesData)

      // Cache the data to prevent duplicate API calls
      const cacheKey = 'games_data_' + Date.now().toString().slice(0, -5) // 5-minute cache
      sessionStorage.setItem(cacheKey, JSON.stringify({ games: gamesData }))
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Check authentication status and fetch games only once
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)

    // Add caching to prevent duplicate API calls
    const cacheKey = 'games_data_' + Date.now().toString().slice(0, -5) // 5-minute cache
    const cachedData = sessionStorage.getItem(cacheKey)

    if (cachedData) {
      try {
        const { games } = JSON.parse(cachedData)
        setGames(games || [])
        setLoading(false)
        return
      } catch {
        // Clear bad cache and continue
        sessionStorage.removeItem(cacheKey)
      }
    }

    fetchGames()
  }, [fetchGames])

  useEffect(() => {
    // Reset navigation loading state after a short delay
    // This handles cases where the router.push completes quickly
    if (isNavigating) {
      const timer = setTimeout(() => {
        setIsNavigating(false)
      }, 1000) // Reset after 1 second max

      return () => clearTimeout(timer)
    }
  }, [isNavigating])

  const registerForGame = useCallback(async (gameId: string) => {
    setRegistering(gameId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/games/${gameId}/participants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        showToast.success('Successfully registered for the game!')
        // Update the local state to show registration status
        setGames(prevGames =>
          prevGames.map(game =>
            game.id === gameId
              ? { ...game, isRegistered: true, _count: { ...game._count, participants: game._count.participants + 1 } }
              : game
          )
        )
      } else {
        showToast.error(data.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Error registering for game:', error)
      showToast.error('Error registering for game')
    } finally {
      setRegistering(null)
    }
  }, [])

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-gray-100 text-gray-800',
      UPCOMING: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-red-100 text-red-800'
    }
    return `px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`
  }

  const getActionButton = (game: Game) => {
    const token = localStorage.getItem('token')

    if (!token) {
      return (
        <button
          onClick={() => handleNavigation("/auth/register")}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          Register to Join
        </button>
      )
    }

    switch (game.status) {
      case 'PENDING':
        return (
          <span className="text-gray-500 text-sm">Coming Soon</span>
        )
      case 'UPCOMING':
        if (game.isRegistered) {
          return (
            <button
              disabled
              className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed opacity-50"
            >
              Registered
            </button>
          )
        }
        return (
          <button
            onClick={() => registerForGame(game.id)}
            disabled={registering === game.id}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {registering === game.id ? 'Registering...' : 'Register'}
          </button>
        )
      case 'ACTIVE':
        return (
          <button
            onClick={() => handleNavigation(`/games/${game.id}/play`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Play Now
          </button>
        )
      case 'COMPLETED':
        return (
          <span className="text-gray-500 text-sm">Completed</span>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading games...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-700 font-medium">Loading...</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Available Games</h1>
            {isAuthenticated && (
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-500 font-medium"
                onClick={() => handleNavigation("/dashboard")}
              >
                ← Back to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Visitor Information Banner */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👋</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Welcome, Explorer!</h3>
                  <p className="text-gray-600">Browse our exciting scavenger hunt games. Register to join the adventure!</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/auth/register"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Register Now
                </Link>
                <Link
                  href="/"
                  className="text-blue-600 hover:text-blue-500 font-medium px-4 py-2"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Games Grid */}
      <div className="container mx-auto px-4 py-8">
        {games.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No games available at the moment.</p>
            <p className="text-gray-500 mt-2">Check back later for new adventures!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div key={game.id} id={`game-${game.id}`} className="relative bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{game.title}</h3>
                    <span className={getStatusBadge(game.status)}>
                      {game.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4">{game.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Location:</span>
                      <span className="ml-2">{game.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Phase:</span>
                      <span className="ml-2">{game.phase.replace('PHASE_', 'Phase ')}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Participants:</span>
                      <span className="ml-2">{game._count.participants}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Created by:</span>
                      <span className="ml-2">{game.creator.username}</span>
                    </div>
                    {game.launchDate && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="font-medium">Launch Date:</span>
                        <span className="ml-2">
                          {new Date(game.launchDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    {getActionButton(game)}
                  </div>
                </div>

                {/* Gray overlay for registered games - covers entire card */}
                {game.isRegistered && game.status === 'UPCOMING' && (
                  <div
                    id="registered-overlay"
                    className="absolute inset-0 rounded-xl flex items-center justify-center transition-all duration-200 group"
                    style={{
                      backgroundColor: 'rgba(107, 114, 128, 0.5)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.6)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.5)'
                    }}
                  >
                    <button
                      onClick={() => handleContinueGame(game.id, game.location)}
                      disabled={capturingLocation === game.id}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium shadow-lg transform transition-all group-hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                    >
                      {capturingLocation === game.id ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Capturing Location...
                        </span>
                      ) : (
                        'Continue'
                      )}
                    </button>
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg">
                      ✓ Already Registered - Click to Continue
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Games
