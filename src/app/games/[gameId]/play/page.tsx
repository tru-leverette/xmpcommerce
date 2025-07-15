'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import ProtectedRouteGuard from '@/components/ProtectedRouteGuard'

interface Clue {
  id: string
  clueNumber: number
  question: string
  hint?: string
  type: 'TEXT_ANSWER' | 'PHOTO_UPLOAD' | 'COMBINED'
  huntId: string
}

interface Submission {
  id: string
  isCorrect: boolean
  aiAnalysis: string
  pebblesEarned: number
}

function PlayGame() {
  const params = useParams()
  const gameId = params.gameId as string
  
  const [currentClue, setCurrentClue] = useState<Clue | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [textAnswer, setTextAnswer] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null)

  const fetchCurrentClue = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/games/${gameId}/clues`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (response.ok) {
        setCurrentClue(data.clue)
      } else {
        alert(data.error || 'Error fetching clue')
      }
    } catch {
      alert('Error fetching clue')
    } finally {
      setLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    const fetchData = async () => {
      await fetchCurrentClue()
      requestLocation()
    }
    fetchData()
  }, [fetchCurrentClue])

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Location access is required for this game. Please enable location services.')
        }
      )
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const submitAnswer = async () => {
    if (!currentClue || !location) return
    
    setSubmitting(true)
    
    try {
      const token = localStorage.getItem('token')
      
      const submissionData: {
        clueId: string
        location: {lat: number, lng: number}
        submissionType?: string
        textAnswer?: string
        photoUrl?: string
      } = {
        clueId: currentClue.id,
        location
      }

      if (currentClue.type === 'TEXT_ANSWER' || currentClue.type === 'COMBINED') {
        if (!textAnswer.trim()) {
          alert('Please enter an answer')
          setSubmitting(false)
          return
        }
        submissionData.submissionType = 'TEXT_ANSWER'
        submissionData.textAnswer = textAnswer
      }

      if (currentClue.type === 'PHOTO_UPLOAD' || currentClue.type === 'COMBINED') {
        if (!selectedFile) {
          alert('Please select a photo')
          setSubmitting(false)
          return
        }
        
        // In a real app, you would upload the file first
        submissionData.submissionType = 'PHOTO_UPLOAD'
        submissionData.photoUrl = 'mock-photo-url'
      }

      const response = await fetch(`/api/games/${gameId}/clues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })

      const data = await response.json()
      
      if (response.ok) {
        setLastSubmission(data.submission)
        if (data.submission.isCorrect) {
          // Move to next clue after a delay
          setTimeout(() => {
            fetchCurrentClue()
            setTextAnswer('')
            setSelectedFile(null)
            setLastSubmission(null)
          }, 3000)
        }
      } else {
        alert(data.error || 'Error submitting answer')
      }
    } catch {
      alert('Error submitting answer')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clue...</p>
        </div>
      </div>
    )
  }

  if (!currentClue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No clues available</h2>
          <p className="text-gray-600">Please check back later or contact support.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Scavenger Hunt</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Clue #{currentClue.clueNumber}</span>
              {location && (
                <span className="text-xs text-green-600">📍 Location detected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Clue Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Clue</h2>
            <p className="text-lg text-gray-700 mb-4">{currentClue.question}</p>
            
            {currentClue.hint && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <p className="text-sm text-blue-700">
                  <strong>Hint:</strong> {currentClue.hint}
                </p>
              </div>
            )}

            {/* Answer Input */}
            <div className="space-y-4">
              {(currentClue.type === 'TEXT_ANSWER' || currentClue.type === 'COMBINED') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer
                  </label>
                  <input
                    type="text"
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your answer..."
                  />
                </div>
              )}

              {(currentClue.type === 'PHOTO_UPLOAD' || currentClue.type === 'COMBINED') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {selectedFile && (
                    <p className="text-sm text-green-600 mt-2">✓ {selectedFile.name}</p>
                  )}
                </div>
              )}

              <button
                onClick={submitAnswer}
                disabled={submitting || !location}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          </div>

          {/* Submission Result */}
          {lastSubmission && (
            <div className={`rounded-xl shadow-lg p-6 ${
              lastSubmission.isCorrect 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center mb-4">
                <span className={`text-2xl mr-3 ${
                  lastSubmission.isCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {lastSubmission.isCorrect ? '✅' : '❌'}
                </span>
                <h3 className={`text-lg font-semibold ${
                  lastSubmission.isCorrect ? 'text-green-800' : 'text-red-800'
                }`}>
                  {lastSubmission.isCorrect ? 'Correct!' : 'Try Again!'}
                </h3>
              </div>
              
              <p className={`mb-4 ${
                lastSubmission.isCorrect ? 'text-green-700' : 'text-red-700'
              }`}>
                {lastSubmission.aiAnalysis}
              </p>
              
              {lastSubmission.isCorrect && lastSubmission.pebblesEarned > 0 && (
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                  <p className="text-yellow-800 font-medium">
                    🏆 You earned {lastSubmission.pebblesEarned} pebbles!
                  </p>
                </div>
              )}
              
              {lastSubmission.isCorrect && (
                <p className="text-green-600 text-sm mt-4">
                  Moving to next clue in 3 seconds...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Wrap the component with ProtectedRouteGuard
export default function ProtectedPlayGame() {
  return (
    <ProtectedRouteGuard>
      <PlayGame />
    </ProtectedRouteGuard>
  )
}
