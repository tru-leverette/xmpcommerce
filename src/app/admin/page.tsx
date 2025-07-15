'use client'

import { useState, useEffect } from 'react'

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

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (response.ok) {
        setUsers(data.users || [])
      } else {
        alert(data.error || 'Error fetching users')
      }
    } catch {
      alert('Error fetching users')
    } finally {
      setLoading(false)
    }
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
        alert('User updated successfully')
        fetchUsers() // Refresh the list
      } else {
        alert(data.error || 'Update failed')
      }
    } catch {
      alert('Error updating user')
    } finally {
      setUpdating(null)
    }
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      USER: 'bg-gray-100 text-gray-800',
      ADMIN: 'bg-blue-100 text-blue-800',
      SUPERADMIN: 'bg-purple-100 text-purple-800'
    }
    return `px-2 py-1 text-xs font-medium rounded-full ${styles[role as keyof typeof styles]}`
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      BANNED: 'bg-red-100 text-red-800'
    }
    return `px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users and system administration</p>
        </div>
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
            <p className="text-2xl font-bold text-green-600">
              {users.filter(u => u.status === 'ACTIVE').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Banned Users</h3>
            <p className="text-2xl font-bold text-red-600">
              {users.filter(u => u.status === 'BANNED').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Admins</h3>
            <p className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === 'ADMIN' || u.role === 'SUPERADMIN').length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
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
                {users.map((user) => (
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
                      
                      {user.role === 'USER' && (
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
      </div>
    </div>
  )
}
