// Centralized error configuration
export const ERROR_CONFIG = {
    AUTH_REQUIRED: {
        status: 401,
        message: 'Unauthorized access - Authentication required',
    },
    AUTH_INVALID: {
        status: 401,
        message: 'Invalid or expired authentication token',
    },
    GAME_NOT_FOUND: {
        status: 404,
        message: 'Game not found',
    },
    PARTICIPANT_NOT_FOUND: {
        status: 404,
        message: 'Participant not found - You may not be registered for this game',
    },
    PROGRESS_NOT_FOUND: {
        status: 404,
        message: 'No game progress found - Progress may not be initialized',
    },
    CLUE_NOT_FOUND: {
        status: 404,
        message: 'Clue not found',
    },
    INTERNAL_SERVER_ERROR: {
        status: 500,
        message: 'Internal server error occurred while fetching clue',
    },
    SUBMISSION_PROCESSING_ERROR: {
        status: 500,
        message: 'Internal server error occurred while processing submission',
    },
    INVALID_JSON: {
        status: 400,
        message: 'Invalid JSON in request body',
    },
    MISSING_CLUE_ID: {
        status: 400,
        message: 'Clue ID is required for submission',
    },
    INVALID_LOCATION: {
        status: 400,
        message: 'Valid location coordinates are required',
    },
    CLUE_SET_ASSIGNMENT_FAILED: {
        status: 500,
        message: 'Failed to assign participant to appropriate clue set',
    },
};