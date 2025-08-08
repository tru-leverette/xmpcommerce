'use client'

import { showToast } from '@/lib/toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

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
  // const [capturingLocation, setCapturingLocation] = useState<string | null>(null)
  const router = useRouter()

  // Handle navigation with loading state
  const handleNavigation = (url: string) => {
    setIsNavigating(true)
    router.push(url)
  }

  // Fixed cache key and expiration (5 minutes)
  const CACHE_KEY = 'games_data_cache';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in ms

  interface GeocodeResponse {
    address: { city?: string; town?: string; village?: string;[key: string]: unknown };
  }

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to reverse-geocode location');
      const data: GeocodeResponse = await response.json();
      return data.address.city || data.address.town || data.address.village || '';
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return '';
    }
  }, []);

  // Remove old timestamp-based cache keys
  useEffect(() => {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('games_data_') && key !== CACHE_KEY) {
        sessionStorage.removeItem(key);
      }
    });
  }, [reverseGeocode]);

  const fetchGames = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      const headers: HeadersInit = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/games', { headers });
      const data = await response.json();

      const gamesData = data.games || [];
      setGames(gamesData);

      // Cache the data with timestamp
      const cacheValue = JSON.stringify({ games: gamesData, timestamp: Date.now() });
      sessionStorage.setItem(CACHE_KEY, cacheValue);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check authentication status and fetch games only once
    const token = sessionStorage.getItem('token');
    setIsAuthenticated(!!token);

    // Use fixed cache key and check expiration
    const cachedData = sessionStorage.getItem(CACHE_KEY);
    if (cachedData) {
      try {
        const { games, timestamp } = JSON.parse(cachedData);
        if (games && timestamp && Date.now() - timestamp < CACHE_DURATION) {
          setGames(games);
          setLoading(false);
          return;
        } else {
          // Cache expired, remove
          sessionStorage.removeItem(CACHE_KEY);
        }
      } catch {
        // Clear bad cache and continue
        sessionStorage.removeItem(CACHE_KEY);
      }
    }

    fetchGames();
  }, [fetchGames, CACHE_DURATION]);

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
    setRegistering(gameId);
    if (!navigator.geolocation) {
      showToast.error('Geolocation is not supported by your browser.');
      setRegistering(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos: GeolocationPosition) => {
      const lat: number = pos.coords.latitude;
      const lng: number = pos.coords.longitude;
      const city: string = await reverseGeocode(lat, lng);
      if (!city) {
        showToast.error('Could not determine your city from your location.');
        setRegistering(null);
        return;
      }
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`/api/games/${gameId}/participants`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            registrationCity: city,
            registrationLatitude: lat,
            registrationLongitude: lng
          })
        });
        const data = await response.json();
        if (response.ok) {
          showToast.success('Successfully registered for the game!');
          setGames(prevGames =>
            prevGames.map(game =>
              game.id === gameId
                ? { ...game, isRegistered: true, _count: { ...game._count, participants: game._count.participants + 1 } }
                : game
            )
          );
        } else {
          showToast.error(data.error || 'Registration failed');
        }
      } catch (error) {
        console.error('Error registering for game:', error);
        showToast.error('Error registering for game');
      } finally {
        setRegistering(null);
      }
    }, (err: GeolocationPositionError) => {
      showToast.error(err.message || 'Geolocation error');
      setRegistering(null);
    }, { enableHighAccuracy: true, timeout: 10000 });
  }, [reverseGeocode]);

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
    const token = sessionStorage.getItem('token')

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
                {game.isRegistered && (
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

                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg">
                      ✓ Already Registered
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
