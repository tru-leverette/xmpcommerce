// Enhanced error handling and logging utility
interface ErrorDetails {
    errorType: string
    errorCode?: number | string
    errorMessage: string
    userAgent?: string
    url?: string
    timestamp: string
    userId?: string
    gameId?: string
    additionalContext?: Record<string, unknown>
}

interface GeolocationErrorDetails extends ErrorDetails {
    geolocationSupported: boolean
    permissionState?: string
    coordinates?: {
        lat: number
        lng: number
    }
}

// Comprehensive error types
export enum ErrorTypes {
    GEOLOCATION_PERMISSION_DENIED = 'GEOLOCATION_PERMISSION_DENIED',
    GEOLOCATION_POSITION_UNAVAILABLE = 'GEOLOCATION_POSITION_UNAVAILABLE',
    GEOLOCATION_TIMEOUT = 'GEOLOCATION_TIMEOUT',
    GEOLOCATION_NOT_SUPPORTED = 'GEOLOCATION_NOT_SUPPORTED',
    GEOLOCATION_UNKNOWN = 'GEOLOCATION_UNKNOWN',
    API_FETCH_ERROR = 'API_FETCH_ERROR',
    API_AUTHENTICATION_ERROR = 'API_AUTHENTICATION_ERROR',
    API_NETWORK_ERROR = 'API_NETWORK_ERROR',
    CLUE_LOADING_ERROR = 'CLUE_LOADING_ERROR',
    SUBMISSION_ERROR = 'SUBMISSION_ERROR',
    PROGRESS_UPDATE_ERROR = 'PROGRESS_UPDATE_ERROR',
    PARTICIPANT_ASSIGNMENT_ERROR = 'PARTICIPANT_ASSIGNMENT_ERROR',
    CLUE_SET_CREATION_ERROR = 'CLUE_SET_CREATION_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    AUTHENTICATION_TOKEN_EXPIRED = 'AUTHENTICATION_TOKEN_EXPIRED',
    PERMISSION_ERROR = 'PERMISSION_ERROR'
}

// Enhanced error messages
export const ERROR_MESSAGES = {
    [ErrorTypes.GEOLOCATION_PERMISSION_DENIED]: {
        user: 'Location access was denied. Please enable location services in your browser settings and reload the page to continue playing.',
        technical: 'User denied geolocation permission. Browser geolocation API returned PERMISSION_DENIED error.'
    },
    [ErrorTypes.GEOLOCATION_POSITION_UNAVAILABLE]: {
        user: 'Your location could not be determined. Please check your device\'s GPS settings and ensure you have a stable internet connection.',
        technical: 'Geolocation position unavailable. Possible causes: GPS disabled, network issues, or device location services malfunction.'
    },
    [ErrorTypes.GEOLOCATION_TIMEOUT]: {
        user: 'Location request timed out. Please ensure you have a stable connection and try again.',
        technical: 'Geolocation request exceeded timeout limit. Device may be having difficulty acquiring GPS signal.'
    },
    [ErrorTypes.GEOLOCATION_NOT_SUPPORTED]: {
        user: 'Your browser doesn\'t support location services. Please use a modern browser like Chrome, Firefox, or Safari to play this game.',
        technical: 'Browser does not support navigator.geolocation API. Legacy browser or geolocation disabled.'
    },
    [ErrorTypes.GEOLOCATION_UNKNOWN]: {
        user: 'An unexpected error occurred while getting your location. Please refresh the page and try again.',
        technical: 'Unknown geolocation error occurred. Error code not recognized by standard geolocation API.'
    },
    [ErrorTypes.API_FETCH_ERROR]: {
        user: 'Failed to load game data. Please check your internet connection and try again.',
        technical: 'API request failed. Network error or server unavailable.'
    },
    [ErrorTypes.API_AUTHENTICATION_ERROR]: {
        user: 'Your session has expired. Please log in again to continue playing.',
        technical: 'Authentication failed. Token invalid, expired, or missing.'
    },
    [ErrorTypes.API_NETWORK_ERROR]: {
        user: 'Network connection error. Please check your internet connection and try again.',
        technical: 'Network request failed. Possible causes: no internet, server down, or firewall blocking.'
    },
    [ErrorTypes.CLUE_LOADING_ERROR]: {
        user: 'Failed to load game clues. Please refresh the page and try again.',
        technical: 'Clue data could not be retrieved from server. Database query failed or no clues available.'
    },
    [ErrorTypes.SUBMISSION_ERROR]: {
        user: 'Failed to submit your answer. Please check your connection and try again.',
        technical: 'Clue submission failed to process. Server error or validation failure.'
    },
    [ErrorTypes.PROGRESS_UPDATE_ERROR]: {
        user: 'Failed to save your progress. Your answer was recorded but progress may not be updated.',
        technical: 'Progress tracking update failed. Database write error or constraint violation.'
    },
    [ErrorTypes.PARTICIPANT_ASSIGNMENT_ERROR]: {
        user: 'Failed to assign you to a game area. Please try reloading the page.',
        technical: 'Participant could not be assigned to clue set. Database constraint or geolocation processing error.'
    },
    [ErrorTypes.CLUE_SET_CREATION_ERROR]: {
        user: 'Failed to create game area for your location. Please try a different location or contact support.',
        technical: 'Clue set creation failed. Geolocation processing error or database constraint violation.'
    },
    [ErrorTypes.DATABASE_ERROR]: {
        user: 'Database error occurred. Please try again or contact support.',
        technical: 'Database operation failed. Connection issue or constraint violation.'
    },
    [ErrorTypes.VALIDATION_ERROR]: {
        user: 'Invalid data provided. Please check your input and try again.',
        technical: 'Data validation failed. Input does not meet required format or constraints.'
    },
    [ErrorTypes.AUTHENTICATION_TOKEN_EXPIRED]: {
        user: 'Your session has expired. Please log in again.',
        technical: 'Authentication token has expired and needs renewal.'
    },
    [ErrorTypes.PERMISSION_ERROR]: {
        user: 'You do not have permission to perform this action.',
        technical: 'User lacks required permissions for requested operation.'
    }
}

// Log error to server and create activity record
export async function logError(errorDetails: ErrorDetails): Promise<void> {
    try {
        const token = localStorage.getItem('token')

        // Enhanced error details
        const fullErrorDetails = {
            ...errorDetails,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            screenResolution: `${screen.width}x${screen.height}`,
            browserLanguage: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }

        // Log to server for activity tracking
        await fetch('/api/activities', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
            },
            body: JSON.stringify({
                type: 'ERROR_OCCURRED',
                description: `${errorDetails.errorType}: ${errorDetails.errorMessage}`,
                details: fullErrorDetails
            })
        })

        // Also log to console for development
        console.error('Error logged:', fullErrorDetails)

    } catch (logError) {
        console.error('Failed to log error to server:', logError)
    }
}

// Enhanced geolocation error handler
export function handleGeolocationError(
    error: GeolocationPositionError,
    gameId: string,
    userId?: string
): GeolocationErrorDetails {

    let errorType: ErrorTypes
    let errorCode: number

    switch (error.code) {
        case error.PERMISSION_DENIED:
            errorType = ErrorTypes.GEOLOCATION_PERMISSION_DENIED
            errorCode = 1
            break
        case error.POSITION_UNAVAILABLE:
            errorType = ErrorTypes.GEOLOCATION_POSITION_UNAVAILABLE
            errorCode = 2
            break
        case error.TIMEOUT:
            errorType = ErrorTypes.GEOLOCATION_TIMEOUT
            errorCode = 3
            break
        default:
            errorType = ErrorTypes.GEOLOCATION_UNKNOWN
            errorCode = error.code
            break
    }

    const errorDetails: GeolocationErrorDetails = {
        errorType,
        errorCode,
        errorMessage: ERROR_MESSAGES[errorType].technical + ` Original error: ${error.message}`,
        timestamp: new Date().toISOString(),
        userId,
        gameId,
        geolocationSupported: 'geolocation' in navigator,
        additionalContext: {
            originalErrorMessage: error.message,
            browserSupportsGeolocation: 'geolocation' in navigator,
            httpsEnabled: location.protocol === 'https:',
            errorOccurredAt: 'game_play_location_request'
        }
    }

    // Log the error
    logError(errorDetails)

    return errorDetails
}

// Enhanced API error handler
export async function handleApiError(
    response: Response,
    requestDetails: {
        endpoint: string
        method: string
        gameId?: string
        userId?: string
    }
): Promise<ErrorDetails> {

    let errorType: ErrorTypes
    let errorMessage: string

    if (response.status === 401) {
        errorType = ErrorTypes.API_AUTHENTICATION_ERROR
        errorMessage = `Authentication failed for ${requestDetails.endpoint}. Status: ${response.status}`
    } else if (response.status === 403) {
        errorType = ErrorTypes.PERMISSION_ERROR
        errorMessage = `Permission denied for ${requestDetails.endpoint}. Status: ${response.status}`
    } else if (response.status >= 500) {
        errorType = ErrorTypes.API_FETCH_ERROR
        errorMessage = `Server error for ${requestDetails.endpoint}. Status: ${response.status}`
    } else {
        errorType = ErrorTypes.API_FETCH_ERROR
        errorMessage = `API request failed for ${requestDetails.endpoint}. Status: ${response.status}`
    }

    let responseBody = ''
    try {
        const responseText = await response.text()
        responseBody = responseText
    } catch {
        responseBody = 'Could not read response body'
    }

    const errorDetails: ErrorDetails = {
        errorType,
        errorCode: response.status,
        errorMessage,
        timestamp: new Date().toISOString(),
        userId: requestDetails.userId,
        gameId: requestDetails.gameId,
        additionalContext: {
            endpoint: requestDetails.endpoint,
            method: requestDetails.method,
            responseStatus: response.status,
            responseStatusText: response.statusText,
            responseBody: responseBody.substring(0, 500), // Limit response body size
            requestTimestamp: new Date().toISOString()
        }
    }

    // Log the error
    logError(errorDetails)

    return errorDetails
}

// Get user-friendly error message
export function getUserFriendlyErrorMessage(errorType: ErrorTypes): string {
    return ERROR_MESSAGES[errorType]?.user || 'An unexpected error occurred. Please try again or contact support.'
}

// Enhanced network error handler
export function handleNetworkError(
    error: Error,
    context: {
        operation: string
        gameId?: string
        userId?: string
    }
): ErrorDetails {

    const errorDetails: ErrorDetails = {
        errorType: ErrorTypes.API_NETWORK_ERROR,
        errorMessage: `Network error during ${context.operation}: ${error.message}`,
        timestamp: new Date().toISOString(),
        userId: context.userId,
        gameId: context.gameId,
        additionalContext: {
            operation: context.operation,
            networkError: error.message,
            errorStack: error.stack,
            online: navigator.onLine,
            connectionType: (navigator as typeof navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType || 'unknown'
        }
    }

    // Log the error
    logError(errorDetails)

    return errorDetails
}
