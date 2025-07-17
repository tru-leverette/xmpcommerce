import { NextResponse } from 'next/server'
import { verifyToken } from './auth'

export interface ApiErrorDetails {
    errorType: string
    errorMessage: string
    endpoint: string
    method: string
    gameId?: string
    userId?: string
    timestamp: string
    stack?: string
    additionalContext?: Record<string, unknown>
}

export interface StandardErrorResponse {
    error: string
    errorCode: string
    details?: string
    gameId?: string
    userId?: string
}

export enum ApiErrorCodes {
    // Authentication errors
    AUTH_REQUIRED = 'AUTH_REQUIRED',
    AUTH_INVALID = 'AUTH_INVALID',

    // Authorization errors
    INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

    // Validation errors
    MISSING_GAME_ID = 'MISSING_GAME_ID',
    MISSING_CLUE_ID = 'MISSING_CLUE_ID',
    INVALID_CLUE_NUMBER = 'INVALID_CLUE_NUMBER',
    INVALID_COORDINATES = 'INVALID_COORDINATES',
    INVALID_LOCATION = 'INVALID_LOCATION',
    INVALID_JSON = 'INVALID_JSON',
    MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

    // Not Found errors
    PARTICIPANT_NOT_FOUND = 'PARTICIPANT_NOT_FOUND',
    PROGRESS_NOT_FOUND = 'PROGRESS_NOT_FOUND',
    GAME_NOT_FOUND = 'GAME_NOT_FOUND',
    CLUE_NOT_FOUND = 'CLUE_NOT_FOUND',

    // Business Logic errors
    CLUE_SET_ASSIGNMENT_FAILED = 'CLUE_SET_ASSIGNMENT_FAILED',
    SUBMISSION_PROCESSING_ERROR = 'SUBMISSION_PROCESSING_ERROR',
    PROGRESS_UPDATE_FAILED = 'PROGRESS_UPDATE_FAILED',

    // System errors
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

export const ERROR_MESSAGES: Record<ApiErrorCodes, string> = {
    [ApiErrorCodes.AUTH_REQUIRED]: 'Authentication is required to access this resource',
    [ApiErrorCodes.AUTH_INVALID]: 'Invalid or expired authentication token',
    [ApiErrorCodes.INSUFFICIENT_PERMISSIONS]: 'You do not have permission to access this resource',

    [ApiErrorCodes.MISSING_GAME_ID]: 'Game ID is required',
    [ApiErrorCodes.MISSING_CLUE_ID]: 'Clue ID is required',
    [ApiErrorCodes.INVALID_CLUE_NUMBER]: 'Valid clue number is required (must be a positive integer)',
    [ApiErrorCodes.INVALID_COORDINATES]: 'Invalid location coordinates provided',
    [ApiErrorCodes.INVALID_LOCATION]: 'Valid location coordinates are required',
    [ApiErrorCodes.INVALID_JSON]: 'Invalid JSON in request body',
    [ApiErrorCodes.MISSING_REQUIRED_FIELD]: 'Required field is missing',

    [ApiErrorCodes.PARTICIPANT_NOT_FOUND]: 'Participant not found - You may not be registered for this game',
    [ApiErrorCodes.PROGRESS_NOT_FOUND]: 'No game progress found - Progress may not be initialized',
    [ApiErrorCodes.GAME_NOT_FOUND]: 'Game not found or no longer available',
    [ApiErrorCodes.CLUE_NOT_FOUND]: 'Clue not found for the specified game',

    [ApiErrorCodes.CLUE_SET_ASSIGNMENT_FAILED]: 'Failed to assign participant to appropriate clue set',
    [ApiErrorCodes.SUBMISSION_PROCESSING_ERROR]: 'Failed to process clue submission',
    [ApiErrorCodes.PROGRESS_UPDATE_FAILED]: 'Failed to update game progress',

    [ApiErrorCodes.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred on the server',
    [ApiErrorCodes.DATABASE_ERROR]: 'Database operation failed',
    [ApiErrorCodes.EXTERNAL_SERVICE_ERROR]: 'External service is currently unavailable'
}

/**
 * Log error to activities table for tracking and debugging
 */
export async function logApiError(
    errorDetails: ApiErrorDetails,
    authToken?: string
): Promise<void> {
    try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/activities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken || ''}`
            },
            body: JSON.stringify({
                type: 'ERROR_OCCURRED',
                description: `API Error: ${errorDetails.errorMessage}`,
                details: errorDetails,
                userId: errorDetails.userId || 'anonymous'
            })
        })
    } catch (logError) {
        console.error('Failed to log API error to activities:', logError)
    }
}

/**
 * Create a standardized error response with optional logging
 */
export function createErrorResponse(
    errorCode: ApiErrorCodes,
    status: number,
    additionalDetails?: {
        gameId?: string
        userId?: string
        endpoint?: string
        method?: string
        context?: Record<string, unknown>
    },
    authToken?: string
): NextResponse {
    const errorMessage = ERROR_MESSAGES[errorCode]

    const response: StandardErrorResponse = {
        error: errorMessage,
        errorCode,
        gameId: additionalDetails?.gameId,
        userId: additionalDetails?.userId
    }

    // Add development details in dev environment
    if (process.env.NODE_ENV === 'development' && additionalDetails?.context) {
        response.details = JSON.stringify(additionalDetails.context)
    }

    // Log error if endpoint and method are provided
    if (additionalDetails?.endpoint && additionalDetails?.method) {
        const errorDetails: ApiErrorDetails = {
            errorType: errorCode,
            errorMessage,
            endpoint: additionalDetails.endpoint,
            method: additionalDetails.method,
            gameId: additionalDetails.gameId,
            userId: additionalDetails.userId,
            timestamp: new Date().toISOString(),
            additionalContext: additionalDetails.context
        }

        // Fire and forget error logging
        logApiError(errorDetails, authToken).catch(() => {
            // Ignore logging errors to prevent cascading failures
        })
    }

    return NextResponse.json(response, { status })
}

/**
 * Verify authentication and return decoded token or error response
 */
export function verifyApiAuthentication(
    authHeader: string | null,
    endpoint: string,
    method: string
): { success: true; decoded: { userId: string;[key: string]: unknown } } | { success: false; response: NextResponse } {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
            success: false,
            response: createErrorResponse(
                ApiErrorCodes.AUTH_REQUIRED,
                401,
                { endpoint, method }
            )
        }
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
        return {
            success: false,
            response: createErrorResponse(
                ApiErrorCodes.AUTH_INVALID,
                401,
                { endpoint, method }
            )
        }
    }

    return { success: true, decoded: decoded as unknown as { userId: string;[key: string]: unknown } }
}

/**
 * Validate required request parameters
 */
export function validateRequiredParams(
    params: Record<string, unknown>,
    required: string[],
    endpoint: string,
    method: string
): NextResponse | null {
    for (const param of required) {
        if (!params[param]) {
            return createErrorResponse(
                ApiErrorCodes.MISSING_REQUIRED_FIELD,
                400,
                {
                    endpoint,
                    method,
                    context: { missingField: param }
                }
            )
        }
    }
    return null
}

/**
 * Handle and log unexpected errors in API routes
 */
export async function handleApiError(
    error: unknown,
    context: {
        endpoint: string
        method: string
        gameId?: string
        userId?: string
    },
    authToken?: string
): Promise<NextResponse> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    const errorDetails: ApiErrorDetails = {
        errorType: ApiErrorCodes.INTERNAL_SERVER_ERROR,
        errorMessage,
        endpoint: context.endpoint,
        method: context.method,
        gameId: context.gameId,
        userId: context.userId,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
    }

    console.error(`API Error in ${context.method} ${context.endpoint}:`, error)

    // Log error to activities
    await logApiError(errorDetails, authToken)

    return createErrorResponse(
        ApiErrorCodes.INTERNAL_SERVER_ERROR,
        500,
        {
            endpoint: context.endpoint,
            method: context.method,
            gameId: context.gameId,
            userId: context.userId,
            context: process.env.NODE_ENV === 'development' ? { errorMessage } : undefined
        }
    )
}
