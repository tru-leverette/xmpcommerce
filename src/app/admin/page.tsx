'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ProtectedRouteGuard from '@/components/ProtectedRouteGuard'

interface User {
  id: string
  email: string
  username: string
  role: 'USER' | 'ADMIN' | 'SUPERADMIN'
  status: 'ACTIVE' | 'BANNED'
  createdAt: string
  _count: {
    participants: number
  }
}

interface Game {
  id: string
  title: string
  description: string
  theme: string
  status: 'ACTIVE' | 'UPCOMING' | 'PENDING' | 'COMPLETED'
  launchDate: string | null
  createdAt: string
  _count: {
    participants: number
  }
}

interface Activity {
  id: string
  type: 'GAME_CREATED' | 'GAME_UPDATED' | 'GAME_DELETED' | 'USER_UPDATED' | 'USER_LOGIN'
  description: string
  timestamp: string
  userId: string
  username: string
  details?: Record<string, unknown>
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'users' | 'games' | 'activity'>('users')
  const [showCreateGame, setShowCreateGame] = useState(false)
  const [creatingGame, setCreatingGame] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [gameForm, setGameForm] = useState({
    title: '',
    theme: '',
    launchDate: ''
  })
  const [gameErrors, setGameErrors] = useState<{ [key: string]: string }>({})

  // Game editing states
  const [editingGame, setEditingGame] = useState<string | null>(null)
  const [editGameForm, setEditGameForm] = useState({
    title: '',
    theme: '',
    launchDate: ''
  })
  const [editGameErrors, setEditGameErrors] = useState<{[key: string]: string}>({})
  const [updatingGame, setUpdatingGame] = useState<string | null>(null)
  const [deletingGame, setDeletingGame] = useState<string | null>(null)

  // Password confirmation for deletion
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [gameToDelete, setGameToDelete] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deletePasswordError, setDeletePasswordError] = useState('')

  // Password confirmation for game creation
  const [showCreateConfirmation, setShowCreateConfirmation] = useState(false)
  const [createPassword, setCreatePassword] = useState('')
  const [createPasswordError, setCreatePasswordError] = useState('')

  // Track occupied continents
  const [occupiedContinents, setOccupiedContinents] = useState<Set<string>>(new Set())

  // Activity pagination state
  const [activityPage, setActivityPage] = useState(1)
  const [activityTotalPages, setActivityTotalPages] = useState(1)
  const [activityTotalCount, setActivityTotalCount] = useState(0)
  const [loadingActivities, setLoadingActivities] = useState(false)

  const verifyAdminAccess = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('No token found - redirecting to login')
        window.location.href = '/auth/login?redirect=/admin'
        return
      }

      // Test token validity with server-side verification
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        console.warn('Token invalid or insufficient permissions - redirecting to login')
        localStorage.clear() // Clear invalid token
        window.location.href = '/auth/login?redirect=/admin&reason=invalid_token'
        return
      }

      // If we get here, token is valid and user has admin access
      await fetchCurrentUser()
      await fetchUsers()
      await fetchGames()
      await fetchActivities()
    } catch (error) {
      console.error('Admin access verification failed:', error)
      localStorage.clear()
      window.location.href = '/auth/login?redirect=/admin&reason=verification_failed'
    }
  }

  useEffect(() => {
    // Verify server-side authentication before loading admin data
    verifyAdminAccess()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        // Server-side verification happens in verifyAdminAccess
        // This is just for UI display purposes
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUserRole(payload.role || 'USER')
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      setCurrentUserRole('USER')
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchGames = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/games', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setGames(data.games)
        
        // Track occupied continents (UPCOMING and ACTIVE games)
        const occupied = new Set<string>()
        data.games.forEach((game: Game) => {
          if (game.status === 'UPCOMING' || game.status === 'ACTIVE') {
            occupied.add(game.theme)
          }
        })
        setOccupiedContinents(occupied)
      }
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async (page: number = 1) => {
    try {
      setLoadingActivities(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/activities?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Transform the data to match our interface
        const transformedActivities = data.activities.map((activity: {
          id: string
          type: string
          description: string
          createdAt: string
          userId: string
          user: { username: string }
          details: Record<string, unknown>
        }) => ({
          id: activity.id,
          type: activity.type as Activity['type'],
          description: activity.description,
          timestamp: activity.createdAt,
          userId: activity.userId,
          username: activity.user.username,
          details: activity.details
        }))
        setActivities(transformedActivities)
        
        // Update pagination state
        if (data.pagination) {
          setActivityPage(data.pagination.currentPage)
          setActivityTotalPages(data.pagination.totalPages)
          setActivityTotalCount(data.pagination.totalCount)
        }
      } else {
        console.error('Failed to fetch activities')
        // Fallback to empty array if API fails
        setActivities([])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      // Fallback to empty array if fetch fails
      setActivities([])
    } finally {
      setLoadingActivities(false)
    }
  }

  const handleGameInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Prevent selecting occupied continents
    if (name === 'theme' && value && occupiedContinents.has(value)) {
      toast.error(`${value} is currently occupied by an active game. Please select a different continent.`)
      return
    }
    
    let processedValue = value
    if (name === 'launchDate' && value) {
      // For datetime-local inputs, just remove minutes and seconds from the string
      // Input format is YYYY-MM-DDTHH:MM, we want YYYY-MM-DDTHH:00
      const [datePart, timePart] = value.split('T')
      if (timePart) {
        const hour = timePart.split(':')[0]
        processedValue = `${datePart}T${hour}:00`
      }
    }
    
    setGameForm(prev => ({
      ...prev,
      [name]: processedValue
    }))
    
    if (gameErrors[name]) {
      setGameErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleEditGameInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    let processedValue = value
    if (name === 'launchDate' && value) {
      // Ensure minutes and seconds are set to 00
      const date = new Date(value)
      date.setMinutes(0, 0, 0)
      processedValue = date.toISOString().slice(0, 16)
    }
    
    setEditGameForm(prev => ({
      ...prev,
      [name]: processedValue
    }))
    
    if (editGameErrors[name]) {
      setEditGameErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateGameForm = (form: typeof gameForm) => {
    const newErrors: { [key: string]: string } = {}
    
    if (!form.title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!form.theme.trim()) {
      newErrors.theme = 'Location is required'
    } else if (occupiedContinents.has(form.theme)) {
      newErrors.theme = `${form.theme} is currently occupied by an active game. Please select a different continent.`
    }
    
    return newErrors
  }

  const createGame = async () => {
    const errors = validateGameForm(gameForm)
    if (Object.keys(errors).length > 0) {
      setGameErrors(errors)
      return
    }

    // Show password confirmation modal
    setShowCreateConfirmation(true)
    setCreatePassword('')
    setCreatePasswordError('')
  }

  const confirmCreateGame = async () => {
    if (!createPassword) {
      setCreatePasswordError('Password is required')
      return
    }

    setCreatingGame(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: gameForm.title,
          theme: gameForm.theme,
          launchDate: gameForm.launchDate || null,
          password: createPassword
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Game published successfully!')
        setShowCreateGame(false)
        setShowCreateConfirmation(false)
        setGameForm({
          title: '',
          theme: '',
          launchDate: ''
        })
        setGameErrors({})
        setCreatePassword('')
        fetchGames() // Refresh the list
      } else {
        if (response.status === 401 && data.error === 'Invalid password') {
          setCreatePasswordError('Incorrect password')
        } else {
          toast.error(data.error || 'Failed to publish game')
        }
      }
    } catch (error) {
      console.error('Error creating game:', error)
      toast.error('Error publishing game. Please try again.')
    } finally {
      setCreatingGame(false)
    }
  }

  const cancelCreateGame = () => {
    setShowCreateConfirmation(false)
    setCreatePassword('')
    setCreatePasswordError('')
  }

  const cancelGameCreation = () => {
    setShowCreateGame(false)
    setGameForm({
      title: '',
      theme: '',
      launchDate: ''
    })
    setGameErrors({})
  }

  const startEditGame = (game: Game) => {
    setEditingGame(game.id)
    setEditGameForm({
      title: game.title,
      theme: game.theme,
      launchDate: game.launchDate ? new Date(game.launchDate).toISOString().slice(0, 13) + ':00' : ''
    })
    setEditGameErrors({})
  }

  const updateGame = async (gameId: string) => {
    const errors = validateGameForm(editGameForm)
    if (Object.keys(errors).length > 0) {
      setEditGameErrors(errors)
      return
    }

    setUpdatingGame(gameId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editGameForm.title,
          theme: editGameForm.theme,
          launchDate: editGameForm.launchDate || null
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Game updated successfully!')
        setEditingGame(null)
        setEditGameForm({
          title: '',
          theme: '',
          launchDate: ''
        })
        setEditGameErrors({})
        fetchGames() // Refresh the list
      } else {
        toast.error(data.error || 'Failed to update game')
      }
    } catch (error) {
      console.error('Error updating game:', error)
      toast.error('Error updating game')
    } finally {
      setUpdatingGame(null)
    }
  }

  const cancelEditGame = () => {
    setEditingGame(null)
    setEditGameForm({
      title: '',
      theme: '',
      launchDate: ''
    })
    setEditGameErrors({})
  }

  const deleteGame = async (gameId: string) => {
    // Show password confirmation modal
    setGameToDelete(gameId)
    setShowDeleteConfirmation(true)
    setDeletePassword('')
    setDeletePasswordError('')
  }

  const confirmDeleteGame = async () => {
    if (!deletePassword) {
      setDeletePasswordError('Password is required')
      return
    }

    if (!gameToDelete) return

    setDeletingGame(gameToDelete)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/games/${gameToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: deletePassword
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Game deleted successfully!')
        fetchGames() // Refresh the list
        setShowDeleteConfirmation(false)
        setGameToDelete(null)
        setDeletePassword('')
      } else {
        if (response.status === 401 && data.error === 'Invalid password') {
          setDeletePasswordError('Incorrect password')
        } else {
          toast.error(data.error || 'Failed to delete game')
        }
      }
    } catch (error) {
      console.error('Error deleting game:', error)
      toast.error('Error deleting game')
    } finally {
      setDeletingGame(null)
    }
  }

  const cancelDeleteGame = () => {
    setShowDeleteConfirmation(false)
    setGameToDelete(null)
    setDeletePassword('')
    setDeletePasswordError('')
  }

  const updateUser = async (userId: string, action: string, role?: string) => {
    setUpdating(userId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, role })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('User updated successfully')
        fetchUsers() // Refresh the list
      } else {
        toast.error(data.error || 'Update failed')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Error updating user')
    } finally {
      setUpdating(null)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800'
      case 'ADMIN':
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800'
      default:
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'
      case 'BANNED':
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800'
      default:
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800'
    }
  }

  const getGameStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'
      case 'UPCOMING':
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800'
      case 'PENDING':
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800'
      default:
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800'
    }
  }

  // Handle tab switching and reset states
  const handleTabSwitch = (tab: 'users' | 'games' | 'activity') => {
    setActiveTab(tab)
    
    // Reset game management states when switching away from games tab
    if (tab !== 'games') {
      setShowCreateGame(false)
      setEditingGame(null)
      setShowCreateConfirmation(false)
      setShowDeleteConfirmation(false)
      setGameToDelete(null)
      setCreatePassword('')
      setDeletePassword('')
      setCreatePasswordError('')
      setDeletePasswordError('')
    }
    
    // Fetch activities when switching to activity tab
    if (tab === 'activity') {
      fetchActivities(1) // Reset to first page when switching to activity tab
    }
  }

  // Handle activity page change
  const handleActivityPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= activityTotalPages) {
      fetchActivities(newPage)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRouteGuard requiredRole={['ADMIN', 'SUPERADMIN']}>
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          {/* Navigation Breadcrumbs */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link 
              href="/dashboard" 
              className="hover:text-blue-600 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-gray-900 font-medium">Admin</span>
          </div>

          {/* Page Title and Back Button */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage users and games</p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Quick Navigation */}
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  href="/games"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 0h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Games
                </Link>
                <Link
                  href="/user/profile"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Link>
              </div>
              
              {/* Back Button */}
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabSwitch('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => handleTabSwitch('games')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'games'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Game Management
              </button>
              <button
                onClick={() => handleTabSwitch('activity')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Activity Log
              </button>
            </nav>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {activeTab === 'users' ? (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter((u: User) => u.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Banned Users</h3>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter((u: User) => u.status === 'BANNED').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Admins</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {users.filter((u: User) => u.role === 'ADMIN' || u.role === 'SUPERADMIN').length}
                </p>
              </div>
            </>
          ) : activeTab === 'games' ? (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Games</h3>
                <p className="text-2xl font-bold text-gray-900">{games.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Active Games</h3>
                <p className="text-2xl font-bold text-green-600">
                  {games.filter((g: Game) => g.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Upcoming Games</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {games.filter((g: Game) => g.status === 'UPCOMING').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Completed Games</h3>
                <p className="text-2xl font-bold text-gray-600">
                  {games.filter((g: Game) => g.status === 'COMPLETED').length}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Activities</h3>
                <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Games Created</h3>
                <p className="text-2xl font-bold text-green-600">
                  {activities.filter((a: Activity) => a.type === 'GAME_CREATED').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">User Updates</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {activities.filter((a: Activity) => a.type === 'USER_UPDATED').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Recent Logins</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {activities.filter((a: Activity) => a.type === 'USER_LOGIN').length}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Content */}
        {activeTab === 'users' ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user: User) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getRoleBadge(user.role)}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(user.status)}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user._count.participants}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {user.status === 'ACTIVE' ? (
                          <button
                            onClick={() => updateUser(user.id, 'ban')}
                            disabled={updating === user.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {updating === user.id ? 'Updating...' : 'Ban'}
                          </button>
                        ) : (
                          <button
                            onClick={() => updateUser(user.id, 'unban')}
                            disabled={updating === user.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {updating === user.id ? 'Updating...' : 'Unban'}
                          </button>
                        )}
                        
                        {user.role === 'USER' && currentUserRole === 'SUPERADMIN' && (
                          <button
                            onClick={() => updateUser(user.id, '', 'ADMIN')}
                            disabled={updating === user.id}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            Make Admin
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'games' ? (
          <div className="space-y-6">
            {/* Create Game Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Game Management</h2>
              {currentUserRole === 'SUPERADMIN' && (
                <button
                  onClick={() => setShowCreateGame(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create New Game
                </button>
              )}
            </div>

            {/* Create Game Form */}
            {showCreateGame && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Game</h3>
                
                {/* Game Rules Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Game Rules</h4>
                      <div className="mt-1 text-sm text-blue-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Games take 1 year to complete</li>
                          <li>Only one game per continent can be active at a time</li>
                          <li>Occupied continents are marked and cannot be selected</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Game Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={gameForm.title}
                      onChange={handleGameInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter game title"
                    />
                    {gameErrors.title && (
                      <p className="text-red-500 text-sm mt-1">{gameErrors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    {occupiedContinents.size > 0 && (
                      <div className="mb-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        ⚠️ {occupiedContinents.size} continent{occupiedContinents.size > 1 ? 's' : ''} currently occupied by active games
                      </div>
                    )}
                    <select
                      name="theme"
                      value={gameForm.theme}
                      onChange={handleGameInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a continent</option>
                      <option 
                        value="Africa" 
                        disabled={occupiedContinents.has('Africa')}
                        className={occupiedContinents.has('Africa') ? 'text-gray-400 bg-gray-100' : ''}
                      >
                        Africa {occupiedContinents.has('Africa') ? '(Occupied)' : ''}
                      </option>
                      <option 
                        value="Antarctica" 
                        disabled={occupiedContinents.has('Antarctica')}
                        className={occupiedContinents.has('Antarctica') ? 'text-gray-400 bg-gray-100' : ''}
                      >
                        Antarctica {occupiedContinents.has('Antarctica') ? '(Occupied)' : ''}
                      </option>
                      <option 
                        value="Asia" 
                        disabled={occupiedContinents.has('Asia')}
                        className={occupiedContinents.has('Asia') ? 'text-gray-400 bg-gray-100' : ''}
                      >
                        Asia {occupiedContinents.has('Asia') ? '(Occupied)' : ''}
                      </option>
                      <option 
                        value="Europe" 
                        disabled={occupiedContinents.has('Europe')}
                        className={occupiedContinents.has('Europe') ? 'text-gray-400 bg-gray-100' : ''}
                      >
                        Europe {occupiedContinents.has('Europe') ? '(Occupied)' : ''}
                      </option>
                      <option 
                        value="North America" 
                        disabled={occupiedContinents.has('North America')}
                        className={occupiedContinents.has('North America') ? 'text-gray-400 bg-gray-100' : ''}
                      >
                        North America {occupiedContinents.has('North America') ? '(Occupied)' : ''}
                      </option>
                      <option 
                        value="Oceania" 
                        disabled={occupiedContinents.has('Oceania')}
                        className={occupiedContinents.has('Oceania') ? 'text-gray-400 bg-gray-100' : ''}
                      >
                        Oceania {occupiedContinents.has('Oceania') ? '(Occupied)' : ''}
                      </option>
                      <option 
                        value="South America" 
                        disabled={occupiedContinents.has('South America')}
                        className={occupiedContinents.has('South America') ? 'text-gray-400 bg-gray-100' : ''}
                      >
                        South America {occupiedContinents.has('South America') ? '(Occupied)' : ''}
                      </option>
                    </select>
                    {gameErrors.theme && (
                      <p className="text-red-500 text-sm mt-1">{gameErrors.theme}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Launch Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      name="launchDate"
                      value={gameForm.launchDate}
                      onChange={handleGameInputChange}
                      step="3600"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={cancelGameCreation}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createGame}
                    disabled={creatingGame}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {creatingGame ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </div>
            )}

            {/* Games Table */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Games</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Game
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participants
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Launched
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {games.map((game: Game) => (
                      <tr key={game.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingGame === game.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                name="title"
                                value={editGameForm.title}
                                onChange={handleEditGameInputChange}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Game title"
                              />
                              {editGameErrors.title && (
                                <p className="text-red-500 text-xs">{editGameErrors.title}</p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-medium text-gray-900">{game.title}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingGame === game.id ? (
                            <div>
                              <select
                                name="theme"
                                value={editGameForm.theme}
                                onChange={handleEditGameInputChange}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Select a continent</option>
                                <option value="Africa">Africa</option>
                                <option value="Antarctica">Antarctica</option>
                                <option value="Asia">Asia</option>
                                <option value="Europe">Europe</option>
                                <option value="North America">North America</option>
                                <option value="Oceania">Oceania</option>
                                <option value="South America">South America</option>
                              </select>
                              {editGameErrors.theme && (
                                <p className="text-red-500 text-xs mt-1">{editGameErrors.theme}</p>
                              )}
                            </div>
                          ) : (
                            game.theme
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getGameStatusBadge(game.status)}>
                            {game.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {game._count.participants}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(game.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {game.launchDate ? new Date(game.launchDate).toLocaleDateString() : 'Not set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {editingGame === game.id ? (
                            <>
                              <button
                                onClick={() => updateGame(game.id)}
                                disabled={updatingGame === game.id}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                {updatingGame === game.id ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={cancelEditGame}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {currentUserRole === 'SUPERADMIN' && (
                                <>
                                  <button
                                    onClick={() => startEditGame(game)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteGame(game.id)}
                                    disabled={deletingGame === game.id}
                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                  >
                                    {deletingGame === game.id ? 'Deleting...' : 'Delete'}
                                  </button>
                                </>
                              )}
                              <button className="text-green-600 hover:text-green-900">
                                Manage
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
        
        {activeTab === 'activity' && (
          <div className="bg-white shadow rounded-lg relative">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map((activity: Activity) => (
                    <tr key={activity.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${
                            activity.type === 'GAME_CREATED' ? 'bg-green-500' :
                            activity.type === 'USER_UPDATED' ? 'bg-blue-500' :
                            activity.type === 'USER_LOGIN' ? 'bg-purple-500' :
                            'bg-gray-500'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-900">
                            {activity.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {activity.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Activity Pagination */}
            {activityTotalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handleActivityPageChange(activityPage - 1)}
                    disabled={activityPage === 1 || loadingActivities}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleActivityPageChange(activityPage + 1)}
                    disabled={activityPage === activityTotalPages || loadingActivities}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(activityPage - 1) * 20 + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(activityPage * 20, activityTotalCount)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{activityTotalCount}</span> activities
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handleActivityPageChange(activityPage - 1)}
                        disabled={activityPage === 1 || loadingActivities}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, activityTotalPages) }, (_, i) => {
                        let pageNum
                        if (activityTotalPages <= 5) {
                          pageNum = i + 1
                        } else if (activityPage <= 3) {
                          pageNum = i + 1
                        } else if (activityPage >= activityTotalPages - 2) {
                          pageNum = activityTotalPages - 4 + i
                        } else {
                          pageNum = activityPage - 2 + i
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handleActivityPageChange(pageNum)}
                            disabled={loadingActivities}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === activityPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                      
                      <button
                        onClick={() => handleActivityPageChange(activityPage + 1)}
                        disabled={activityPage === activityTotalPages || loadingActivities}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading overlay for activity table */}
            {loadingActivities && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Password Confirmation Modal for Game Creation - Only show on games tab */}
      {showCreateConfirmation && activeTab === 'games' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Game Creation
            </h3>
            <p className="text-gray-600 mb-4">
              Please enter your password to confirm creating this game.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={createPassword}
                onChange={(e) => {
                  setCreatePassword(e.target.value)
                  setCreatePasswordError('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your password"
                autoFocus
              />
              {createPasswordError && (
                <p className="text-red-500 text-sm mt-1">{createPasswordError}</p>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelCreateGame}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmCreateGame}
                disabled={creatingGame}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {creatingGame ? 'Publishing...' : 'Publish Game'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Confirmation Modal for Game Deletion - Only show on games tab */}
      {showDeleteConfirmation && activeTab === 'games' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Game Deletion
            </h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. Please enter your password to confirm deletion.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value)
                  setDeletePasswordError('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter your password"
                autoFocus
              />
              {deletePasswordError && (
                <p className="text-red-500 text-sm mt-1">{deletePasswordError}</p>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDeleteGame}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteGame}
                disabled={deletingGame !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletingGame ? 'Deleting...' : 'Delete Game'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRouteGuard>
  )
}
