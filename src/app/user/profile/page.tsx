

'use client'




import ProtectedRouteGuard from '@/components/ProtectedRouteGuard'
import { showToast } from '@/lib/toast'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
// Modal component for avatar selection
interface AvatarModalProps {
  open: boolean;
  onClose: () => void;
  avatarOptions: string[];
  selectedAvatar: string;
  onSelect: (avatar: string) => void;
  loading: boolean;
}

function AvatarModal({ open, onClose, avatarOptions, selectedAvatar, onSelect, loading }: AvatarModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close modal"
        >
          ×
        </button>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Avatar</h3>
        {loading ? (
          <div className="text-center text-gray-500">Loading avatars...</div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {avatarOptions.map((avatar) => (
              <button
                key={avatar}
                type="button"
                className={`rounded-full border-2 p-1 transition-all ${selectedAvatar === avatar ? 'border-black' : 'border-transparent'} hover:border-gray-400 bg-white`}
                onClick={() => onSelect(avatar)}
                aria-label={`Select avatar ${avatar}`}
              >
                <Image src={`/assets/avatars/${avatar}`} alt={avatar} width={64} height={64} className="object-cover w-16 h-16 rounded-full" />
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 text-center">
          <span className="text-gray-500 text-xs">Click an avatar to select. Your choice will be saved when you update your profile.</span>
        </div>
      </div>
    </div>
  );
}

interface UserData {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  role: string;
  status: string;
  createdAt: string;
}



export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    avatar: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [avatarOptions, setAvatarOptions] = useState<string[]>([]);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const router = useRouter()

  // Load avatar options from public/assets/avatars
  useEffect(() => {
    setAvatarLoading(true);
    // List of avatars is static, hardcode for now (could fetch from API if needed)
    setAvatarOptions([
      'pirate ship_dinghy.png',
      'pirate_anchor.png',
      'pirate_bottle_message.png',
      'pirate_man_1.png',
      'pirate_man_2.png',
      'pirate_mermaid.png',
      'pirate_parrot.png',
      'pirate_treasure - Copy.png',
      'pirate_treasure.png',
      'pirate_woman_1.png',
      'pirate_woman_2.png',
      'pirate_woman_3 - Copy.png',
      'pirate_woman_3.png',
    ]);
    setAvatarLoading(false);
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/auth/login')
          return
        }

        // Try to get user data from token first (optimization)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const userData: UserData = {
            id: payload.userId,
            email: payload.email,
            username: payload.username || payload.email.split('@')[0],
            avatar: payload.avatar || '',
            role: payload.role,
            status: 'ACTIVE', // Default from token
            createdAt: new Date().toISOString() // Approximate
          }
          setUser(userData)
          setFormData({
            username: userData.username,
            email: userData.email,
            avatar: userData.avatar || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          })
          setLoading(false)
          return
        } catch {
          console.log('Token parsing failed, fetching from API')
        }

        // Fallback to API call if token parsing fails
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          setFormData({
            username: data.user.username,
            email: data.user.email,
            avatar: data.user.avatar || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          })
        } else {
          console.error('Failed to fetch profile')
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters'
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (formData.newPassword && !formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required to change password'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const updateData: {
        email: string;
        avatar: string;
        currentPassword?: string;
        newPassword?: string;
      } = {
        email: formData.email,
        avatar: formData.avatar
      }

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user);
        // Save new token if provided
        if (data.accessToken) {
          localStorage.setItem('token', data.accessToken);
        }
        setEditing(false);
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        showToast.success('Profile updated successfully!');
      } else {
        showToast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showToast.error('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      avatar: user?.avatar || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setErrors({})
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      USER: 'bg-gray-100 text-gray-800',
      ADMIN: 'bg-blue-100 text-blue-800',
      SUPERADMIN: 'bg-purple-100 text-purple-800'
    }
    return `px-3 py-1 text-sm font-medium rounded-full ${styles[role as keyof typeof styles] || styles.USER}`
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      BANNED: 'bg-red-100 text-red-800'
    }
    return `px-3 py-1 text-sm font-medium rounded-full ${styles[status as keyof typeof styles] || styles.ACTIVE}`
  }

  if (loading) {
    return (
      <ProtectedRouteGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </ProtectedRouteGuard>
    )
  }

  return (
    <ProtectedRouteGuard>
      <div className="min-h-screen bg-white text-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="list-none p-0 inline-flex">
              <li className="flex items-center">
                <Link href="/dashboard" className="hover:underline text-gray-700">Dashboard</Link>
                <span className="mx-2">/</span>
              </li>
              <li className="flex items-center text-gray-900 font-semibold">Profile</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-500 mb-8">Manage your account information and preferences</p>

          {/* Profile Overview and Account Information in the same card */}
          <div className="mb-8">
            <div className="bg-gray-900 rounded-lg shadow p-6 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="text-center md:text-left md:flex md:items-center">
                  <button
                    type="button"
                    className="w-24 h-24 rounded-full mx-auto md:mx-0 mb-4 md:mb-0 border-4 border-gray-700 bg-gray-800 flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => setAvatarModalOpen(true)}
                    aria-label="Change avatar"
                  >
                    {user?.avatar ? (
                      <Image src={`/assets/avatars/${user.avatar}`} alt="Avatar" width={96} height={96} className="object-cover w-24 h-24" />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </button>
                  <div className="md:ml-6">
                    <h3 className="text-xl font-semibold text-white">{user?.username}</h3>
                    <p className="text-gray-300">{user?.email}</p>
                    <div className="flex space-x-2 mt-4">
                      <span className={getRoleBadge(user?.role || 'USER') + ' bg-gray-700 text-white'}>
                        {user?.role}
                      </span>
                      <span className={getStatusBadge(user?.status || 'ACTIVE') + ' bg-gray-700 text-white'}>
                        {user?.status}
                      </span>
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-700 text-white">
                        VERIFIED
                      </span>
                    </div>
                    <div className="mt-4 text-sm text-gray-400">
                      Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                </div>
                <div className="mt-6 md:mt-0 md:ml-8 flex-shrink-0">
                  <div className="flex space-x-2">
                    {!editing ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Avatar Modal rendered outside the card, but inside the main section */}
            <AvatarModal
              open={avatarModalOpen}
              onClose={() => setAvatarModalOpen(false)}
              avatarOptions={avatarOptions}
              selectedAvatar={formData.avatar}
              onSelect={async (avatar: string) => {
                setFormData((prev) => ({ ...prev, avatar }));
                setUser((prev) => prev ? { ...prev, avatar } : prev);
                setAvatarModalOpen(false);
                try {
                  const token = localStorage.getItem('token');
                  if (!token) {
                    showToast.error('Not authenticated.');
                    return;
                  }
                  const response = await fetch('/api/user/profile', {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      email: formData.email,
                      avatar,
                    }),
                  });
                  const data = await response.json();
                  if (response.ok) {
                    setUser(data.user);
                    setFormData((prev) => ({ ...prev, avatar: data.user.avatar }));
                    if (data.accessToken) {
                      localStorage.setItem('token', data.accessToken);
                    }
                    showToast.success('Avatar updated successfully!');
                  } else {
                    showToast.error(data.error || 'Failed to update avatar');
                  }
                } catch (error) {
                  console.error('Error updating avatar:', error);
                  showToast.error('Error updating avatar');
                }
              }}
              loading={avatarLoading}
            />
            {/* Edit Form appears below the card when editing */}
            {editing && (
              <div className="bg-white rounded-lg shadow mt-6 p-6">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={true}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
                    />
                    <p className="text-gray-500 text-sm mt-1">
                      Username cannot be changed as it must remain unique across all users.
                    </p>
                    {errors.username && (
                      <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Password Change Section - Only shown when editing */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter current password to change"
                      />
                      {errors.currentPassword && (
                        <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new password (optional)"
                      />
                      {errors.newPassword && (
                        <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirm new password"
                      />
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRouteGuard>
  )
}
