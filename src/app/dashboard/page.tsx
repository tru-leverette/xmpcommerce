'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ProtectedRouteGuard from '@/components/ProtectedRouteGuard'

interface UserData {
  id: string
  email: string
  username: string
  role: string
}

interface GameParticipation {
  id: string
  game: {
    id: string
    title: string
    description: string
    status: string
  }
  status: string
  pebbles: number
  joinedAt: string
  progress: {
    currentLevel: number
    currentStage: number
    currentHunt: number
    currentClue: number
    isCompleted: boolean
  }[]
}

interface Badge {
  id: string
  name: string
  description: string
  imageUrl: string
  earnedAt: string
}

export default function UserDashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [participations, setParticipations] = useState<GameParticipation[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPebbles, setTotalPebbles] = useState(0)

  useEffect(() => {
    // Skip if already fetching or already loaded
    if (!loading || (participations.length > 0 && badges.length > 0)) {
      return
    }

    // Check session storage for cached data to prevent duplicate calls
    const cacheKey = 'dashboard_data_' + Date.now().toString().slice(0, -5) // 5-minute cache
    const cachedData = sessionStorage.getItem(cacheKey)
    
    if (cachedData) {
      try {
        const { user, participations, badges, totalPebbles } = JSON.parse(cachedData)
        setUser(user)
        setParticipations(participations)
        setBadges(badges)
        setTotalPebbles(totalPebbles)
        setLoading(false)
        return
      } catch {
        // Clear bad cache and continue
        sessionStorage.removeItem(cacheKey)
      }
    }

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          return
        }

        // Get user data from token instead of API call (optimization)
        let userData: UserData | null = null
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          userData = {
            id: payload.userId,
            email: payload.email,
            username: payload.username || payload.email.split('@')[0],
            role: payload.role
          }
          setUser(userData)
        } catch {
          console.warn('Could not parse user from token, falling back to API')
          // Fallback to API call only if token parsing fails
          const userResponse = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (userResponse.ok) {
            const userResponseData = await userResponse.json()
            userData = userResponseData.user
            setUser(userData)
          }
        }

        // Use Promise.all to fetch both endpoints simultaneously for better performance
        const [participationsResponse, badgesResponse] = await Promise.all([
          fetch('/api/user/participations', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/user/badges', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        let participationsData: GameParticipation[] = []
        let badgesData: Badge[] = []
        let totalPebblesCount = 0

        if (participationsResponse.ok) {
          const participationsResult = await participationsResponse.json()
          participationsData = participationsResult.participations || []
          setParticipations(participationsData)
          
          // Calculate total pebbles
          totalPebblesCount = participationsData.reduce((sum: number, p: GameParticipation) => sum + p.pebbles, 0)
          setTotalPebbles(totalPebblesCount)
        }

        if (badgesResponse.ok) {
          const badgesResult = await badgesResponse.json()
          badgesData = badgesResult.badges || []
          setBadges(badgesData)
        }

        // Cache the data to prevent duplicate API calls
        if (userData && (participationsData.length > 0 || badgesData.length > 0)) {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            user: userData,
            participations: participationsData,
            badges: badgesData,
            totalPebbles: totalPebblesCount
          }))
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [loading, participations.length, badges.length])

  if (loading) {
    return (
      <ProtectedRouteGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </ProtectedRouteGuard>
    )
  }

  return (
    <ProtectedRouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Welcome Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.username || 'User'}!
            </h1>
            <p className="text-gray-600 mt-2">Ready for your next scavenger hunt adventure?</p>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold">💎</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pebbles</p>
                <p className="text-2xl font-semibold text-gray-900">{totalPebbles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">🎮</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Games</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {participations.filter(p => p.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">🏆</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Badges Earned</p>
                <p className="text-2xl font-semibold text-gray-900">{badges.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Games</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {participations.filter(p => p.progress.some(prog => prog.isCompleted)).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Games */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Your Games</h2>
            </div>
            <div className="p-6">
              {participations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">You haven&apos;t joined any games yet!</p>
                  <Link
                    href="/games"
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Browse available games →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {participations.slice(0, 3).map((participation) => (
                    <div key={participation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{participation.game.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          participation.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {participation.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{participation.game.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>💎 {participation.pebbles} pebbles</span>
                          {participation.progress.length > 0 && (
                            <span>Level {participation.progress[0].currentLevel}</span>
                          )}
                        </div>
                        <Link
                          href={`/games/${participation.game.id}/play`}
                          className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                        >
                          Continue →
                        </Link>
                      </div>
                    </div>
                  ))}
                  {participations.length > 3 && (
                    <div className="text-center pt-4">
                      <Link
                        href="/games"
                        className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                      >
                        View all games →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Badges */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Badges</h2>
            </div>
            <div className="p-6">
              {badges.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No badges earned yet!</p>
                  <p className="text-sm text-gray-400">Complete stages to earn your first badges</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {badges.slice(0, 4).map((badge) => (
                    <div key={badge.id} className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        {badge.imageUrl ? (
                          <Image src={badge.imageUrl} alt={badge.name} width={32} height={32} className="w-8 h-8" />
                        ) : (
                          <span className="text-yellow-600 text-xl">🏆</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{badge.name}</h3>
                        <p className="text-sm text-gray-500">{badge.description}</p>
                        <p className="text-xs text-gray-400">
                          Earned {new Date(badge.earnedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/games"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-blue-600 text-xl">🎮</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Browse Games</h3>
                <p className="text-sm text-gray-500">Find new scavenger hunts</p>
              </div>
            </Link>

            <Link
              href="/leaderboard"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-purple-600 text-xl">🏆</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Leaderboard</h3>
                <p className="text-sm text-gray-500">See top players</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRouteGuard>
  )
}
