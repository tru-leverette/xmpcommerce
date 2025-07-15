'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Game {
  id: string
  title: string
  description: string
  theme: string
  status: 'PENDING' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED'
  launchDate?: Date
  creator: {
    username: string
  }
  _count: {
    participants: number
  }
}

export default function Games() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
    
    fetchGames()
  }, [])

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games')
      const data = await response.json()
      setGames(data.games || [])
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoading(false)
    }
  }

  const registerForGame = async (gameId: string) => {
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
        alert('Successfully registered for the game!')
        fetchGames() // Refresh the games list
      } else {
        alert(data.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Error registering for game:', error)
      alert('Error registering for game')
    } finally {
      setRegistering(null)
    }
  }

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
        <Link 
          href="/auth/login"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Login to Join
        </Link>
      )
    }

    switch (game.status) {
      case 'PENDING':
        return (
          <span className="text-gray-500 text-sm">Coming Soon</span>
        )
      case 'UPCOMING':
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
          <Link 
            href={`/games/${game.id}/play`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Play Now
          </Link>
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
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Scavenger Quest</h1>
            <Link 
              href={isAuthenticated ? "/dashboard" : "/"}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              ← {isAuthenticated ? "Back to Dashboard" : "Back to Home"}
            </Link>
          </div>
        </div>
      </div>

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
              <div key={game.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                      <span className="ml-2">{game.theme}</span>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
