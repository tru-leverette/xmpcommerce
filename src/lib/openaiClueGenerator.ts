

import OpenAI from 'openai';

// Fallback: Load .env.local with dotenv if not already loaded (for direct script usage)
if (!process.env.OPENAI_API_KEY) {
    (async () => {
        try {
            const dotenv = await import('dotenv');
            const path = await import('path');
            dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
        } catch {
            // Ignore if dotenv is not available
        }
    })();
}

export interface ClueGenerationParams {
    locationName: string;
    center: { lat: number; lng: number };
    radiusKm: number;
    phase: string;
    level: number;
    stage: number;
    difficulty: 'easy' | 'medium' | 'hard';
    cluesCount: number;
}

export type ClueType = 'TEXT_ANSWER' | 'PHOTO_UPLOAD' | 'COMBINED';

export interface GeneratedClue {
    clue: string;
    type: ClueType;
}

export async function generateClues(params: ClueGenerationParams): Promise<GeneratedClue[]> {

    // Ensure this code is running server-side
    if (typeof process === 'undefined' || typeof process.env === 'undefined') {
        throw new Error('Environment variables are not available. This function must be run server-side.');
    }

    const apiKey: string | undefined = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('your-ope')) {
        throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment.');
    }

    let openai: OpenAI;
    try {
        openai = new OpenAI({ apiKey });
    } catch (err: unknown) {
        throw new Error('Failed to initialize OpenAI client. ' + (err instanceof Error ? err.message : 'Unknown error'));
    }

    const prompt: string = `You are a game master for a geolocation-based scavenger hunt. Generate ${params.cluesCount} clues for players in the area around ${params.locationName} (center: ${params.center.lat}, ${params.center.lng}, radius: ${params.radiusKm}km). The clues should be ${params.difficulty} and appropriate for phase ${params.phase}, level ${params.level}, stage ${params.stage}. Each clue should require the player to physically visit or interact with something within the area. Format as numbered list. For each clue, specify the type in brackets at the end: [TEXT_ANSWER], [PHOTO_UPLOAD], or [COMBINED].`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: 'You are a creative scavenger hunt clue generator.' },
        { role: 'user', content: prompt },
    ];

    let response: OpenAI.Chat.Completions.ChatCompletion | undefined;
    try {
        response = await openai.chat.completions.create({
            model: 'gpt-4.1',
            messages,
            max_tokens: 512,
            temperature: 0.8,
        });
    } catch (err: unknown) {
        // Log the full error for debugging

        console.error('[OpenAI API Error]', err);
        if (err instanceof Error && err.message.includes('Incorrect API key')) {
            console.error('OpenAI API key is invalid. Please check your OPENAI_API_KEY environment variable.');
            throw new Error('OpenAI API key is invalid. Please check your OPENAI_API_KEY.');
        }
        // If error has response details (e.g., from axios or fetch)
        type ErrorWithResponse = Error & { response?: { data?: unknown } };
        const errorObj = err as ErrorWithResponse;
        const errorDetails = errorObj.response?.data || errorObj.response || '';
        throw new Error('Failed to generate clues using OpenAI. ' + (err instanceof Error ? err.message : 'Unknown error') + (errorDetails ? ` | Details: ${JSON.stringify(errorDetails)}` : ''));
    }

    const text: string = response.choices[0].message?.content ?? '';
    console.log('[ClueGen] Raw OpenAI response:', text);

    const clueRegex = /\d+\.\s*(.+?)\s*\[(TEXT_ANSWER|PHOTO_UPLOAD|COMBINED)\]/gi;
    const clues: GeneratedClue[] = [];
    let match: RegExpExecArray | null;
    while ((match = clueRegex.exec(text)) !== null) {
        const clueText: string = match[1].trim();
        const type: ClueType = match[2] as ClueType;
        clues.push({ clue: clueText, type });
    }

    if (clues.length === 0) {
        const fallbackClues: GeneratedClue[] = text
            .split(/\n\d+\. /)
            .filter((clue: string) => Boolean(clue))
            .map((clue: string): GeneratedClue => ({
                clue: clue.trim(),
                type: 'COMBINED',
            }));
        console.log('[ClueGen] Returning fallback clues:', fallbackClues);
        return fallbackClues;
    }
    console.log('[ClueGen] Returning parsed clues:', clues);
    return clues;
}
