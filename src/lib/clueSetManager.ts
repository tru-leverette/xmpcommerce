import type { Hunt } from '@prisma/client';
import type { Location } from "../types/location";
// Assign a participant to a clue set based on location and game
export async function assignParticipantToClueSet(participantId: string, gameId: string, location: Location): Promise<string | null> {
    // Find an existing clue set for the game and location
    const clueSet = await findExistingClueSet(gameId, location);
    if (!clueSet) {
        // Optionally, create a new clue set if none exists (logic can be expanded)
        throw new Error('No clue set found for this location');
    }
    // Assign the clue set to the participant
    await prisma.participant.update({
        where: { id: participantId },
        data: { clueSetId: clueSet.id }
    });
    return clueSet.id;
}
export interface ClueExtended {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    type: string;
    isActive: boolean;
    clueNumber: number;
    question: string;
    hint: string | null;
    answer: string | null;
    answerVariations: unknown;
    explanation?: string;
    aiGenerated?: boolean;
    requiredLatitude?: number | null;
    requiredLongitude?: number | null;
    locationRadius?: number | null;
    aiContext?: string;
    huntId: string;
}
export interface HuntWithClues extends Hunt {
    clues: ClueExtended[];
}
export async function getCluesForClueSet(clueSetId: string): Promise<HuntWithClues[]> {
    // Find hunts for the clue set
    const huntsRaw = await prisma.hunt.findMany({
        where: { clueSetId },
        include: {
            clues: {
                orderBy: { clueNumber: 'asc' }
            }
        }
    });
    // Map clues to ClueExtended type for type safety
    const hunts: HuntWithClues[] = huntsRaw.map(hunt => ({
        ...hunt,
        clues: hunt.clues.map(clue => ({
            id: clue.id,
            createdAt: clue.createdAt,
            updatedAt: clue.updatedAt,
            type: clue.type,
            isActive: clue.isActive,
            clueNumber: clue.clueNumber,
            question: clue.question,
            hint: clue.hint ?? null,
            answer: clue.answer ?? null,
            answerVariations: clue.answerVariations ?? [],
            explanation: clue.explanation ?? '',
            aiGenerated: clue.aiGenerated ?? false,
            requiredLatitude: clue.requiredLatitude ?? null,
            requiredLongitude: clue.requiredLongitude ?? null,
            locationRadius: clue.locationRadius ?? null,
            huntId: clue.huntId
        }))
    }));
    return hunts;
}
// Find an existing clue set for a game and location (within radius)

export async function findExistingClueSet(
    gameId: string,
    location: Location,
    maxRadiusKm: number = 1.0
): Promise<ClueSet | null> {
    // Find all clue sets for the game
    const clueSets = await prisma.clueSet.findMany({
        where: { gameId, isActive: true }
    });
    // Find the first clue set within maxRadiusKm
    for (const clueSet of clueSets) {
        const distance = calculateDistance(location, {
            lat: clueSet.centerLatitude,
            lng: clueSet.centerLongitude
        });
        if (distance <= clueSet.radiusKm && distance <= maxRadiusKm) {
            return clueSet;
        }
    }
    return null;
}
// Calculate the distance between two geo points in kilometers using the Haversine formula
export function calculateDistance(
    pointA: Location,
    pointB: Location
): number {
    const toRadians = (deg: number): number => deg * (Math.PI / 180);
    const earthRadiusKm = 6371;
    const dLat = toRadians(pointB.lat - pointA.lat);
    const dLng = toRadians(pointB.lng - pointA.lng);
    const lat1 = toRadians(pointA.lat);
    const lat2 = toRadians(pointB.lat);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}
// Function to generate AI-powered clues



import { ClueSet } from '@prisma/client';
import OpenAI from 'openai';
import { prisma } from './prisma';

export interface ClueAI {
    clueNumber: number;
    question: string;
    explanation: string;
    answerVariations: string[];
    type: string;
}

const AI_GENERATION_ERROR = 'AI clue generation failed.';

export async function generateAIClues(
    location: { lat: number; lng: number },
    difficulty: string,
    clueCount: number,
    radiusKm: number,
    mainSubject?: string
): Promise<{ clues: ClueAI[]; mainSubject: string | undefined }> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const subjectInstruction = mainSubject
        ? `Main subject: ${mainSubject}.`
        : `If no main subject is provided, create a main subject relevant to the location and difficulty.`;

    const prompt = `
You are an expert scavenger hunt clue designer.
You must generate exactly ${clueCount} clues for a scavenger hunt at latitude ${location.lat}, longitude ${location.lng}.
${subjectInstruction} Difficulty: ${difficulty}.

IMPORTANT: Your response will be rejected if you do not generate exactly ${clueCount} clues, numbered 1 to ${clueCount}. Do not generate more or fewer clues. Do not stop early. Do not skip any clue numbers. Each clue must be a separate JSON object as described below.

Constraints:
1. Begin by selecting a final answer (e.g., a specific object, person, or location) that is clearly tied to the main subject.
2. Reverse-engineer the clue chain: each clue should logically lead to the next, ending with the final answer.
3. Clues must be specific, unambiguous, and solvable with one clearly correct answer (with minor acceptable variations). Do not use neighborhood names, park names, or store names as answers unless the clue references a unique, verifiable, and unambiguous feature, landmark, lore or item that can only be found or known at one location within ${radiusKm} km of the provided coordinates. Avoid clues that could apply to multiple locations, items, or situations.
4. Each clue must be tailored to a unique, verifiable item, feature, or landmark, and not something that could describe multiple places or things. The answer must be something that can be verified on a map or with a photo, or within the lore of the area and should not be ambiguous or apply to multiple scenarios, items or situations.
5. Each clue should still logically lead up to the mainSubject, with clear narrative progression.
6. For EASY difficulty:
   - Avoid metaphors or layered symbolism.
   - Use direct logic and clear context.
   - Ensure clues are answerable by someone with basic local or cultural knowledge.
7. For MEDIUM and HARD difficulty:
   - Introduce misdirection, metaphor, or layered references.
   - Maintain logical solvability and thematic continuity.

Output Format:
Each clue must be a JSON object with the following fields:
{
  "clueNumber": 1,
  "question": "...",
  "explanation": "...", // Explain how the clue connects to the previous one and the main subject.
  "answerVariations": ["...", "..."], // Acceptable answers
  "type": "TEXT_ANSWER" // or "PHOTO_UPLOAD"
}

You must output exactly ${clueCount} clues, numbered 1 to ${clueCount}, and nothing else. Do not include any extra commentary or explanation outside the JSON objects.

Example Logic:
Main subject: Millennium Park.
Final answer: PHOTO_UPLOAD of where the Mike Ditka bobblehead used to stand in Millennium Park.
Clue chain builds backward from this object, using thematic misdirection and narrative progression.

Ensure clues reflect the location and never reference internal system details.

Example of a bad clue and answer:
At the heart of Chicago there is a cross section of two streets that is where all the action happens. Where am I?
Answer: Damen and Western Avenue.
Why is this bad? It references a specific intersection without thematic connection to the main subject, lacks narrative progression, and does not lead to a final answer that ties back to the main subject. More importantly, Chicago is a large area with many cross sections, where many lively things happen at each cross section. Making it too broad and not narrow enough to a specific destination. This clue has 1000 possible answers and is not specific enough to the clue or leading to the main subject.
`;



    let response;
    try {
        response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are an expert scavenger hunt clue generator.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 512
        });
    } catch (err) {
        console.log(err)
        throw new Error(AI_GENERATION_ERROR);
    }
    const content = response.choices[0]?.message?.content || '';
    // Debug: log the raw AI response
    console.log('AI raw response:', content);
    const mainSubjectMatch = content.match(/Main subject: (.*)/i);
    console.log(
        `logging the mainsubject match`,
        mainSubjectMatch && mainSubjectMatch[1] ? mainSubjectMatch[1].trim() : 'No main subject found'
    );

    let extractedMainSubject = mainSubject;
    if (!mainSubject && mainSubjectMatch) {
        extractedMainSubject = mainSubjectMatch[1].trim();
    }
    // Match all JSON objects in the content
    const jsonRegex = /\{[\s\S]*?\}/g;
    const jsonMatches = content.match(jsonRegex) || [];
    const clues: ClueAI[] = jsonMatches.map((jsonStr, i) => {
        let parsed: Partial<ClueAI> = {};
        try {
            parsed = JSON.parse(jsonStr);
        } catch (jsonErr) {
            console.error('Failed to parse clue JSON:', jsonStr, jsonErr);
            throw new Error(`AI clue JSON parsing failed at index ${i}`);
        }
        // Validate required fields
        if (!parsed.type || typeof parsed.type !== 'string') {
            console.error('AI clue parsed', parsed);
            console.error('AI clue missing required type at index', i, 'Raw AI response:', content);
            throw new Error(`AI clue missing required type at index ${i}`);
        }
        if (!parsed.clueNumber) parsed.clueNumber = i + 1;
        if (!parsed.question) parsed.question = '';
        if (!parsed.explanation) parsed.explanation = '';
        if (!parsed.answerVariations || !Array.isArray(parsed.answerVariations)) parsed.answerVariations = [];
        return parsed as ClueAI;
    });
    // Debug: log the number of clues parsed
    console.log(`AI clues parsed: ${clues.length} (expected: ${clueCount})`);

    // If fewer clues than requested, throw an error
    if (clues.length < clueCount) {
        console.error(`AI returned only ${clues.length} clues, expected ${clueCount}.`);
        throw new Error(`AI did not generate enough clues. Expected ${clueCount}, got ${clues.length}.`);
    }
    return { clues, mainSubject: extractedMainSubject };
}

