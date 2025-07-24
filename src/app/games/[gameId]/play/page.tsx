'use client'

import PirateMapLoader from '@/components/PirateMapLoader'
import ProtectedRouteGuard from '@/components/ProtectedRouteGuard'
import {
  ErrorTypes,
  getUserFriendlyErrorMessage,
  handleApiError,
  handleGeolocationError,
  handleNetworkError,
  logError
} from '@/lib/errorHandling'
import { showToast } from '@/lib/toast'
import { useParams, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

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
}

interface Progress {
  currentClueNumber: number;
  totalClues: number;
  isGameComplete: boolean;
  currentStage: string;
  // ...other fields as needed
}

function PlayGame() {
  const params = useParams()
  const searchParams = useSearchParams()
  const gameId = params.gameId as string

  const [showPirateMap, setShowPirateMap] = useState(true)
  const [currentClue, setCurrentClue] = useState<Clue | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [textAnswer, setTextAnswer] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null)
  const [currentClueNumber, setCurrentClueNumber] = useState(1)
  const [totalClues, setTotalClues] = useState(4)
  const [gameComplete, setGameComplete] = useState(false)
  const [gameError, setGameError] = useState<string | null>(null)
  const [redirected, setRedirected] = useState(false);
  const [currentStageId, setCurrentStageId] = useState<string | null>(null)

  // Initialize location from URL parameters or capture fresh location
  useEffect(() => {
    const initializeLocation = async () => {
      // First check if location was passed in URL parameters
      const urlLat = searchParams.get('lat')
      const urlLng = searchParams.get('lng')

      if (urlLat && urlLng) {
        const lat = parseFloat(urlLat)
        const lng = parseFloat(urlLng)

        if (!isNaN(lat) && !isNaN(lng)) {
          console.log(`Location from URL: ${lat}, ${lng}`)
          setLocation({ lat, lng })
          return
        }
      }

      // If no valid location in URL, try to capture fresh location
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000 // Cache for 1 minute
              }
            )
          })

          const { latitude, longitude } = position.coords
          console.log(`Fresh location captured: ${latitude}, ${longitude}`)
          setLocation({ lat: latitude, lng: longitude })

        } catch (error) {
          console.error('Error capturing fresh location:', error)
          // Don't show error toast here as it might be called during initial load
          // The API will handle the missing location scenario
        }
      }
    }

    initializeLocation()
  }, [searchParams])

  // Fetch user's progress from database
  const fetchProgress = useCallback(async (): Promise<Progress | null> => {
    try {
      const token = sessionStorage.getItem('token');
      const userId = sessionStorage.getItem('userId');
      const response = await fetch(`/api/games/${gameId}/progress`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        const progress: Progress = data.progress;
        setCurrentClueNumber(progress.currentClueNumber);
        setTotalClues(progress.totalClues);
        setGameComplete(progress.isGameComplete);
        setCurrentStageId(progress.currentStage);
        return progress;
      } else {
        const errorDetails = await handleApiError(response, {
          endpoint: `/api/games/${gameId}/progress`,
          method: 'GET',
          gameId,
          userId: userId || undefined
        });
        console.error('Progress fetch API error:', errorDetails);
        return null;
      }
    } catch (error) {
      const errorDetails = await handleNetworkError(error as Error, {
        operation: 'fetch_progress',
        gameId,
        userId: sessionStorage.getItem('userId') || undefined
      });
      console.error('Progress fetch network error:', errorDetails);
      return null;
    }
  }, [gameId])

  // Update progress in database when clue is completed
  const updateProgress = useCallback(async (clueNumber: number, isCorrect: boolean, submissionData?: object) => {
    try {
      const token = sessionStorage.getItem('token')
      const userId = sessionStorage.getItem('userId')

      const response = await fetch(`/api/games/${gameId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          clueNumber,
          isCorrect,
          submissionData,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        const errorDetails = await handleApiError(response, {
          endpoint: `/api/games/${gameId}/progress`,
          method: 'POST',
          gameId,
          userId: userId || undefined
        })

        console.error('Progress update API error:', errorDetails)
        throw new Error(`Progress update failed: ${errorDetails.errorMessage}`)
      }

      const data = await response.json()
      console.log('Progress updated successfully:', data)
      return data
    } catch (error) {
      const errorDetails = await handleNetworkError(error as Error, {
        operation: 'update_progress',
        gameId,
        userId: sessionStorage.getItem('userId') || undefined
      })

      console.error('Progress update network error:', errorDetails)
      throw error
    }
  }, [gameId])
  const fetchCurrentClue = useCallback(
    async (clueNumber: number, stageId: string, retryCount = 0) => {
      try {
        const token = sessionStorage.getItem('token');
        const userId = sessionStorage.getItem('userId');
        let url = `/api/games/${gameId}/clues?clueNumber=${clueNumber}`;
        if (location) {
          url += `&lat=${location.lat}&lng=${location.lng}`;
        }
        if (stageId) {
          url += `&stageId=${stageId}`;
        }
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token || ''}`
          }
        });

        let data: unknown = {};
        try {
          data = await response.json();
        } catch { }

        // Handle 'preparing' status or 404 (Not Found)
        // Type guard helpers
        const isPreparing = (d: unknown): d is { preparing: boolean } => {
          return (
            typeof d === 'object' && d !== null &&
            Object.prototype.hasOwnProperty.call(d, 'preparing') &&
            (d as Record<string, unknown>).preparing === true
          );
        };
        const isErrorObj = (d: unknown): d is { error: string } => {
          return (
            typeof d === 'object' && d !== null &&
            Object.prototype.hasOwnProperty.call(d, 'error') &&
            typeof (d as Record<string, unknown>).error === 'string'
          );
        };
        const isLocationRequired = (d: unknown): d is { isLocationRequired: boolean, message: string } => {
          return (
            typeof d === 'object' && d !== null &&
            Object.prototype.hasOwnProperty.call(d, 'isLocationRequired') &&
            (d as Record<string, unknown>).isLocationRequired === true
          );
        };
        const isGeographicRestriction = (d: unknown): d is { isGeographicRestriction: boolean, message: string } => {
          return (
            typeof d === 'object' && d !== null &&
            Object.prototype.hasOwnProperty.call(d, 'isGeographicRestriction') &&
            (d as Record<string, unknown>).isGeographicRestriction === true
          );
        };
        const isNoCluesAvailable = (d: unknown): d is { isNoCluesAvailable: boolean, message: string } => {
          return (
            typeof d === 'object' && d !== null &&
            Object.prototype.hasOwnProperty.call(d, 'isNoCluesAvailable') &&
            (d as Record<string, unknown>).isNoCluesAvailable === true
          );
        };
        const isClueObj = (d: unknown): d is { clue: Clue, totalClues?: number } => {
          return (
            typeof d === 'object' && d !== null &&
            Object.prototype.hasOwnProperty.call(d, 'clue') &&
            typeof (d as Record<string, unknown>).clue === 'object'
          );
        };

        if (response.status === 202 || isPreparing(data) || response.status === 404) {
          if (retryCount < 5) {
            setLoading(true);
            setGameError(null);
            setTimeout(() => {
              fetchCurrentClue(clueNumber, stageId, retryCount + 1);
            }, 2000);
            return;
          } else {
            setGameError('Game is still being prepared. Please try again in a few moments.');
            setLoading(false);
            return;
          }
        }

        if (!response.ok) {
          if (
            isErrorObj(data) &&
            data.error === 'Sorry we were unable to create your hunt, please try again.' &&
            typeof window !== 'undefined' &&
            !redirected
          ) {
            setRedirected(true);
            window.location.href = '/games/hunt-error';
            return;
          }
          const errorDetails = await handleApiError(response, {
            endpoint: url,
            method: 'GET',
            gameId,
            userId: userId || undefined
          });
          const userMessage = getUserFriendlyErrorMessage(errorDetails.errorType as ErrorTypes);
          console.error('Clue API error details:', errorDetails);
          setGameError(`Error loading clue: ${userMessage}`);
          showToast.error(`Error loading clue: ${userMessage}`);
          setLoading(false);
          return;
        }

        if (isLocationRequired(data)) {
          const locationMessage = `Location Required: ${data.message}`;
          setGameError(locationMessage);
          showToast.warning(locationMessage);
          setLoading(false);
          return;
        }
        if (isGeographicRestriction(data)) {
          const restrictionMessage = `Geographic Restriction: ${data.message}`;
          setGameError(restrictionMessage);
          showToast.warning(restrictionMessage);
          setLoading(false);
          return;
        }
        if (isNoCluesAvailable(data)) {
          const noCluesMessage = `No Clues Available: ${data.message}`;
          setGameError(noCluesMessage);
          showToast.info(noCluesMessage);
          setLoading(false);
          return;
        }
        if (isClueObj(data)) {
          setCurrentClue(data.clue);
          setTotalClues(data.totalClues || 4);
          setCurrentClueNumber(data.clue.clueNumber);
        } else {
          const errorDetails = {
            errorType: ErrorTypes.CLUE_LOADING_ERROR,
            errorMessage: 'No clue data returned from server',
            timestamp: new Date().toISOString(),
            gameId,
            userId: userId || undefined,
            additionalContext: {
              requestedClueNumber: clueNumber,
              responseData: data,
              endpoint: url
            }
          };
          await logError(errorDetails);
          const userMessage = getUserFriendlyErrorMessage(ErrorTypes.CLUE_LOADING_ERROR);
          showToast.error(userMessage);
        }
      } catch (error) {
        const errorDetails = await handleNetworkError(error as Error, {
          operation: 'fetch_current_clue',
          gameId,
          userId: sessionStorage.getItem('userId') || undefined
        });
        console.error('Network error fetching clue:', errorDetails);
        const userMessage = getUserFriendlyErrorMessage(errorDetails.errorType as ErrorTypes);
        const errorMessage = `Network error: ${userMessage}`;
        setGameError(errorMessage);
        showToast.error(errorMessage);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    },
    [gameId, location, redirected]
  );

  const requestLocation = useCallback(async () => {
    if (navigator.geolocation) {
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
        return
      }

      // If permission is not granted yet, show informative message
      if (permissionStatus === 'prompt') {
        showToast.info('Location access needed. Please allow location sharing when prompted.')
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setLocation(newLocation)
          console.log('Location obtained successfully:', position.coords.latitude, position.coords.longitude)

          // Refetch clue with new location
          if (currentStageId) {
            fetchCurrentClue(currentClueNumber, currentStageId);
          }
          showToast.success('Location updated successfully!')
        },
        async (error) => {
          // Use enhanced error handling
          const errorDetails = await handleGeolocationError(error, gameId, sessionStorage.getItem('userId') || undefined)
          const userMessage = getUserFriendlyErrorMessage(errorDetails.errorType as ErrorTypes)

          console.error('Geolocation error details:', errorDetails)

          // Log the error using the proper utility
          await logError(errorDetails)

          // Enhanced error messages for permission denied
          if (error.code === error.PERMISSION_DENIED) {
            showToast.error(
              'Location permission denied. Please:\n' +
              '1. Click the location icon in your browser address bar\n' +
              '2. Select "Allow" for location access\n' +
              '3. Refresh the page and try again'
            )
          } else {
            // For development/testing, set a default location (Calabar, Nigeria)
            if (process.env.NODE_ENV === 'development') {
              console.warn('Using default location for development due to:', errorDetails.errorMessage)
              setLocation({
                lat: 4.9518,
                lng: 8.3229
              })
              showToast.warning(`Development Mode: ${userMessage}\n\nUsing default location (Calabar, Nigeria) for testing.`)
            } else {
              showToast.error(userMessage)
            }
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout
          maximumAge: 300000 // 5 minutes
        }
      )
    } else {
      console.error('Geolocation is not supported by this browser')

      // Enhanced error handling for unsupported browsers
      const errorDetails = {
        errorType: ErrorTypes.GEOLOCATION_NOT_SUPPORTED,
        errorMessage: 'Geolocation is not supported by this browser',
        timestamp: new Date().toISOString(),
        gameId,
        userId: sessionStorage.getItem('userId') || undefined
      }

      // Log the error using the proper utility
      await logError(errorDetails)

      const userMessage = getUserFriendlyErrorMessage(ErrorTypes.GEOLOCATION_NOT_SUPPORTED)

      if (process.env.NODE_ENV === 'development') {
        console.warn('Using default location - geolocation not supported')
        setLocation({
          lat: 4.9518,
          lng: 8.3229
        })
        showToast.warning(`Development Mode: ${userMessage}\n\nUsing default location (Calabar, Nigeria) for testing.`)
      } else {
        showToast.error(userMessage)
      }
    }
  }, [gameId, currentClueNumber, fetchCurrentClue, currentStageId])

  useEffect(() => {
    console.log('UseEffect triggered - showPirateMap:', showPirateMap, 'loading:', loading, 'gameError:', gameError)
    // Only fetch data after pirate map animation completes and if we don't have a clue yet and no error state
    if (!showPirateMap && !currentClue && loading && !gameError) {
      console.log('Pirate map completed, fetching clue data...')
      let isMounted = true // Prevent state updates if component unmounts

      const fetchData = async () => {
        try {
          // Fetch progress and get currentStage and currentClueNumber
          const progress = await fetchProgress();
          if (!isMounted || !progress) return;
          // Fetch clue using both currentClueNumber and currentStage
          await fetchCurrentClue(progress.currentClueNumber, progress.currentStage);
          if (!isMounted) return;
          requestLocation();
        } catch (error) {
          console.error('Error during initial game load:', error)
          if (isMounted) {
            const errorMessage = 'Failed to load game. This might be because you are not in the correct geographic location for this game. Please try refreshing the page or contact support.'
            setGameError(errorMessage)
            showToast.error(errorMessage)
            setLoading(false)
          }
        }
      }

      fetchData()

      return () => {
        isMounted = false
      }
    }
  }, [showPirateMap, currentClue, loading, gameError, fetchCurrentClue, fetchProgress, requestLocation])

  // Fallback: if still loading after pirate map is gone for too long, force completion
  useEffect(() => {
    if (!showPirateMap && loading) {
      const fallbackTimer = setTimeout(() => {
        console.log('Fallback: Force completing loading state')
        setLoading(false)
        // Create a default clue if none exists
        if (!currentClue) {
          setCurrentClue({
            id: 'fallback-clue',
            clueNumber: 1,
            question: 'Welcome to the hunt! This is a test clue. What sound does a lion make?',
            hint: 'Think about the king of the jungle',
            type: 'TEXT_ANSWER',
            huntId: 'test-hunt'
          })
        }
      }, 5000) // Wait 5 seconds max

      return () => clearTimeout(fallbackTimer)
    }
  }, [showPirateMap, loading, currentClue])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const submitAnswer = async () => {
    if (!currentClue || !location) {
      const errorMessage = !currentClue ? 'No clue available to submit answer for' : 'Location not available for submission'

      // Log validation error
      const errorDetails = {
        errorType: ErrorTypes.VALIDATION_ERROR,
        errorMessage,
        timestamp: new Date().toISOString(),
        gameId,
        userId: sessionStorage.getItem('userId') || undefined,
        additionalContext: {
          hasCurrentClue: !!currentClue,
          hasLocation: !!location,
          errorOccurredAt: 'submit_answer_validation'
        }
      }

      // Log the error using the proper utility
      await logError(errorDetails)

      showToast.error(errorMessage)
      return
    }

    setSubmitting(true)

    try {
      const token = sessionStorage.getItem('token')
      const userId = sessionStorage.getItem('userId')

      const submissionData: {
        clueId: string
        location: { lat: number, lng: number }
        submissionType?: string
        textAnswer?: string
        photoUrl?: string
      } = {
        clueId: currentClue.id,
        location
      }

      // Validate submission based on clue type
      if (currentClue.type === 'TEXT_ANSWER' || currentClue.type === 'COMBINED') {
        if (!textAnswer.trim()) {
          showToast.warning('Please enter an answer')
          setSubmitting(false)
          return
        }
        submissionData.submissionType = 'TEXT_ANSWER'
        submissionData.textAnswer = textAnswer
      }

      if (currentClue.type === 'PHOTO_UPLOAD' || currentClue.type === 'COMBINED') {
        if (!selectedFile) {
          showToast.warning('Please select a photo')
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

      // Enhanced API error handling
      if (!response.ok) {
        const errorDetails = await handleApiError(response, {
          endpoint: `/api/games/${gameId}/clues`,
          method: 'POST',
          gameId,
          userId: userId || undefined
        })

        const userMessage = getUserFriendlyErrorMessage(errorDetails.errorType as ErrorTypes)
        console.error('Submission API error details:', errorDetails)
        showToast.error(`Error submitting answer: ${userMessage}`)
        return
      }

      const data = await response.json()

      if (data.submission) {
        setLastSubmission(data.submission)

        // Update progress in database
        try {
          await updateProgress(currentClueNumber, data.submission.isCorrect, submissionData)
        } catch (progressError) {
          // Log progress update error but don't block user flow
          const errorDetails = await handleNetworkError(progressError as Error, {
            operation: 'update_progress',
            gameId,
            userId: userId || undefined
          })

          console.error('Progress update error:', errorDetails)
          // Don't alert the user, just log it
        }

        if (data.submission.isCorrect) {
          if (data.isGameComplete) {
            setGameComplete(true)
            // Show completion message
            setTimeout(() => {
              showToast.success('🎉 Congratulations! You\'ve completed this stage! Well done, treasure hunter!')
            }, 1000)
          } else if (data.nextClueNumber) {
            // Move to next clue after a delay
            setTimeout(() => {
              setCurrentClueNumber(data.nextClueNumber)
              fetchCurrentClue(data.nextClueNumber, data.currentStage)
              setTextAnswer('')
              setSelectedFile(null)
              setLastSubmission(null)
            }, 3000)
          }
        }
      } else {
        // Handle unexpected response format
        const errorDetails = {
          errorType: ErrorTypes.SUBMISSION_ERROR,
          errorMessage: 'Unexpected response format from submission API',
          timestamp: new Date().toISOString(),
          gameId,
          userId: userId || undefined,
          additionalContext: {
            responseData: data,
            submissionData,
            errorOccurredAt: 'submit_answer_response_processing'
          }
        }

        // Log the error using the proper utility
        await logError(errorDetails)

        showToast.error('Unexpected response format. Please try again.')
      }
    } catch (error) {
      // Enhanced network error handling
      const errorDetails = await handleNetworkError(error as Error, {
        operation: 'submit_answer',
        gameId,
        userId: sessionStorage.getItem('userId') || undefined
      })

      console.error('Network error submitting answer:', errorDetails)
      const userMessage = getUserFriendlyErrorMessage(errorDetails.errorType as ErrorTypes)
      showToast.error(`Network error: ${userMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (showPirateMap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PirateMapLoader
          onComplete={() => {
            console.log('PirateMapLoader onComplete called')
            setShowPirateMap(false)
          }}
          duration={3000} // 3 seconds for testing - change back to 10000 for production
        />
      </div>
    )
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

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-6xl mb-4">🏆</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Congratulations, Treasure Hunter!
              </h1>
              <p className="text-lg text-gray-700 mb-6">
                You&apos;ve successfully completed this stage! You found all {totalClues} clues and proved yourself as a true adventurer.
              </p>

              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 border border-red-300 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-red-800 mb-4">Game Loading Error</h2>
            <p className="text-red-700 mb-4">{gameError}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setGameError(null)
                  setLoading(true)
                  setShowPirateMap(true)
                  setCurrentClue(null)
                }}
                className="bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 w-full"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/games'}
                className="bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 w-full"
              >
                Back to Games
              </button>
            </div>
          </div>
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
              <span className="text-sm text-gray-600">
                Clue {currentClue.clueNumber} of {totalClues}
              </span>
              <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Progress: {Math.round((currentClue.clueNumber / totalClues) * 100)}%
              </div>
              {location ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600">📍 Location detected</span>
                  <button
                    onClick={requestLocation}
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                    title="Refresh location"
                  >
                    🔄 Refresh
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-orange-600">📍 Location needed</span>
                  <button
                    onClick={requestLocation}
                    className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
                    title="Get location"
                  >
                    📍 Get Location
                  </button>
                </div>
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
            <div className={`rounded-xl shadow-lg p-6 ${lastSubmission.isCorrect
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
              }`}>
              <div className="flex items-center mb-4">
                <span className={`text-2xl mr-3 ${lastSubmission.isCorrect ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {lastSubmission.isCorrect ? '✅' : '❌'}
                </span>
                <h3 className={`text-lg font-semibold ${lastSubmission.isCorrect ? 'text-green-800' : 'text-red-800'
                  }`}>
                  {lastSubmission.isCorrect ? 'Correct!' : 'Try Again!'}
                </h3>
              </div>

              <p className={`mb-4 ${lastSubmission.isCorrect ? 'text-green-700' : 'text-red-700'
                }`}>
                {lastSubmission.aiAnalysis}
              </p>



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
