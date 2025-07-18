// Quick test to verify error logging is working
// Run this in the browser console while on a page with a user logged in

async function testErrorLogging() {
    try {
        // Test the logError function directly
        const { logError, ErrorTypes } = await import('./src/lib/errorHandling.ts');

        const testError = {
            errorType: ErrorTypes.VALIDATION_ERROR,
            errorMessage: 'Test error for logging verification',
            timestamp: new Date().toISOString(),
            gameId: 'test-game',
            userId: localStorage.getItem('userId') || undefined,
            additionalContext: {
                testCase: 'manual_error_logging_test',
                timestamp: new Date().toISOString()
            }
        };

        console.log('Testing error logging with:', testError);

        await logError(testError);

        console.log('Error logging test completed - check admin dashboard');

    } catch (error) {
        console.error('Error logging test failed:', error);
    }
}

// Call the test function
testErrorLogging();
