import { showToast } from '@/lib/toast';
import { useState } from 'react';

interface LocationPermissionHelperProps {
    onLocationObtained: (location: { lat: number; lng: number }) => void
    onError?: (error: string) => void
}

export function LocationPermissionHelper({ onLocationObtained, onError }: LocationPermissionHelperProps) {
    const [showInstructions, setShowInstructions] = useState(false)
    const [requesting, setRequesting] = useState(false)

    const requestLocation = async () => {
        setRequesting(true)

        try {
            // Check if geolocation is available
            if (!navigator.geolocation) {
                const errorMsg = 'Geolocation is not supported by this browser'
                onError?.(errorMsg)
                showToast.error(errorMsg)
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

            // If permission is denied, show instructions
            if (permissionStatus === 'denied') {
                setShowInstructions(true)
                return
            }

            // If permission is not granted yet, show informative message
            if (permissionStatus === 'prompt') {
                showToast.info('Please allow location sharing when prompted by your browser.')
            }

            // Request location
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 60000
                    }
                )
            })

            const { latitude, longitude } = position.coords
            onLocationObtained({ lat: latitude, lng: longitude })
            showToast.success('Location captured successfully!')

        } catch (error) {
            console.error('Error capturing location:', error)

            if (error instanceof GeolocationPositionError) {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setShowInstructions(true)
                        break
                    case error.POSITION_UNAVAILABLE:
                        const msg = 'Location information unavailable. Please try again or check your device settings.'
                        onError?.(msg)
                        showToast.error(msg)
                        break
                    case error.TIMEOUT:
                        const timeoutMsg = 'Location request timed out. Please try again.'
                        onError?.(timeoutMsg)
                        showToast.error(timeoutMsg)
                        break
                    default:
                        const defaultMsg = 'An unknown error occurred while getting location. Please try again.'
                        onError?.(defaultMsg)
                        showToast.error(defaultMsg)
                }
            } else {
                const genericMsg = 'Unable to capture location. Please try again.'
                onError?.(genericMsg)
                showToast.error(genericMsg)
            }
        } finally {
            setRequesting(false)
        }
    }

    const getBrowserInstructions = () => {
        const userAgent = navigator.userAgent.toLowerCase()

        if (userAgent.includes('chrome')) {
            return {
                browser: 'Chrome',
                steps: [
                    'Look for the location icon (📍) in your browser address bar',
                    'Click on it and select "Allow" for location access',
                    'If you don\'t see the icon, click the padlock icon next to the URL',
                    'Find "Location" in the settings and change it to "Allow"',
                    'Refresh the page and try again'
                ]
            }
        } else if (userAgent.includes('firefox')) {
            return {
                browser: 'Firefox',
                steps: [
                    'Look for the location icon in your browser address bar',
                    'Click on it and select "Allow Location Access"',
                    'If you don\'t see the icon, click the shield icon next to the URL',
                    'Find location settings and change to "Allow"',
                    'Refresh the page and try again'
                ]
            }
        } else if (userAgent.includes('safari')) {
            return {
                browser: 'Safari',
                steps: [
                    'Go to Safari menu → Settings → Websites',
                    'Click on "Location" in the left sidebar',
                    'Find this website and change permission to "Allow"',
                    'Refresh the page and try again'
                ]
            }
        } else if (userAgent.includes('edge')) {
            return {
                browser: 'Edge',
                steps: [
                    'Look for the location icon in your browser address bar',
                    'Click on it and select "Allow" for location access',
                    'If you don\'t see the icon, click the padlock icon next to the URL',
                    'Find "Location" in the settings and change it to "Allow"',
                    'Refresh the page and try again'
                ]
            }
        } else {
            return {
                browser: 'Your Browser',
                steps: [
                    'Look for a location icon in your browser address bar',
                    'Click on it and select "Allow" for location access',
                    'You may need to check your browser settings for location permissions',
                    'Refresh the page and try again'
                ]
            }
        }
    }

    const instructions = getBrowserInstructions()

    return (
        <div>
            <button
                onClick={requestLocation}
                disabled={requesting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
                {requesting ? 'Requesting Location...' : 'Request Location'}
            </button>

            {/* Instructions Modal */}
            {showInstructions && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">📍 Location Permission Needed</h3>
                        <p className="text-gray-700 mb-4">
                            This game requires your location to provide location-specific clues. Please follow these steps to enable location sharing:
                        </p>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h4 className="font-medium text-blue-900 mb-2">For {instructions.browser}:</h4>
                            <ol className="text-sm text-blue-800 space-y-1">
                                {instructions.steps.map((step, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="font-medium mr-2">{index + 1}.</span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowInstructions(false)
                                    requestLocation()
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex-1"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => setShowInstructions(false)}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium flex-1"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
