
import OpenAI from 'openai';

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
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' });

    const prompt = `You are a game master for a geolocation-based scavenger hunt. Generate ${params.cluesCount} clues for players in the area around ${params.locationName} (center: ${params.center.lat}, ${params.center.lng}, radius: ${params.radiusKm}km). The clues should be ${params.difficulty} and appropriate for phase ${params.phase}, level ${params.level}, stage ${params.stage}. Each clue should require the player to physically visit or interact with something within the area. Format as numbered list. For each clue, specify the type in brackets at the end: [TEXT_ANSWER], [PHOTO_UPLOAD], or [COMBINED].`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: 'You are a creative scavenger hunt clue generator.' },
        { role: 'user', content: prompt },
    ];

    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        max_tokens: 512,
        temperature: 0.8,
    });

    const text: string = response.choices[0].message?.content ?? '';

    // Improved clue parsing: expects format "1. Clue text [TYPE]"
    const clueRegex = /\d+\.\s*(.+?)\s*\[(TEXT_ANSWER|PHOTO_UPLOAD|COMBINED)\]/gi;
    const clues: GeneratedClue[] = [];
    let match: RegExpExecArray | null;
    while ((match = clueRegex.exec(text)) !== null) {
        const clueText = match[1].trim();
        const type = match[2] as ClueType;
        clues.push({ clue: clueText, type });
    }

    // Fallback: if parsing fails, return all as COMBINED
    if (clues.length === 0) {
        return text
            .split(/\n\d+\. /)
            .filter((clue: string) => Boolean(clue))
            .map((clue: string): GeneratedClue => ({
                clue: clue.trim(),
                type: 'COMBINED',
            }));
    }
    return clues;
}
