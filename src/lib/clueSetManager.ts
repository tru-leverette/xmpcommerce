/**
 * Find all clue sets that overlap a given location and return the closest one.
 */
export async function findClosestOverlappingClueSet(
    gameId: string,
    location: Location
): Promise<{
    id: string;
    name: string;
    description: string | null;
    centerLatitude: number;
    centerLongitude: number;
    radiusKm: number;
    createdAt: Date;
    updatedAt: Date;
    minLatitude: number;
    maxLatitude: number;
    minLongitude: number;
    maxLongitude: number;
    phase: string;
    isActive: boolean;
    gameId: string;
    stageNumber: number;
    levelNumber: number;
} | null> {
    const clueSets = await prisma.clueSet.findMany({
        where: { gameId, isActive: true },
        select: {
            id: true,
            name: true,
            description: true,
            centerLatitude: true,
            centerLongitude: true,
            radiusKm: true,
            createdAt: true,
            updatedAt: true,
            minLatitude: true,
            maxLatitude: true,
            minLongitude: true,
            maxLongitude: true,
            phase: true,
            isActive: true,
            gameId: true,
            stageNumber: true,
            levelNumber: true
        }
    });
    // Filter to only those that overlap the location
    const overlapping = clueSets.filter(cs => isPointInClueSet(location, cs));
    if (overlapping.length === 0) return null;
    // Return the closest overlapping clue set
    let minDist = Number.POSITIVE_INFINITY;
    let closest: typeof overlapping[0] | null = null;
    for (const cs of overlapping) {
        const dist = calculateDistance(location, { lat: cs.centerLatitude, lng: cs.centerLongitude });
        if (dist < minDist) {
            minDist = dist;
            closest = cs;
        }
    }
    if (closest) {
        return {
            ...closest,
            levelNumber: closest.levelNumber ?? 1
        };
    }
    return null;
}
/**
 * Calculate bounding box for a given center point and radius in kilometers
 */
export function calculateBoundingBox(center: Location, radiusKm: number): ClueSetBounds {
    const R = 6371; // Earth's radius in kilometers
    // Latitude bounds
    const latOffset = (radiusKm / R) * (180 / Math.PI);
    const minLat = center.lat - latOffset;
    const maxLat = center.lat + latOffset;
    // Longitude bounds (accounting for latitude)
    const lngOffset = (radiusKm / R) * (180 / Math.PI) / Math.cos(center.lat * Math.PI / 180);
    const minLng = center.lng - lngOffset;
    const maxLng = center.lng + lngOffset;
    return {
        minLat,
        maxLat,
        minLng,
        maxLng,
        centerLat: center.lat,
        centerLng: center.lng
    };
}
/**
 * Find a different clue set (not the one at the given location)
 */
export async function findDifferentClueSet(gameId: string, location: Location): Promise<{ id: string; name: string; description: string | null; centerLatitude: number; centerLongitude: number; radiusKm: number } | null> {
    const clueSets = await prisma.clueSet.findMany({
        where: { gameId, isActive: true },
        select: {
            id: true,
            name: true,
            description: true,
            centerLatitude: true,
            centerLongitude: true,
            radiusKm: true
        }
    });
    for (const clueSet of clueSets) {
        // If the center is more than 0.5 miles away, consider it different
        const dist = calculateDistance(location, { lat: clueSet.centerLatitude, lng: clueSet.centerLongitude });
        if (dist > 0.8) return clueSet;
    }
    return null;
}

/**
 * Find a different group's clue set (placeholder: just finds a different clue set for now)
 */
export async function findDifferentGroupClueSet(gameId: string, location: Location): Promise<{ id: string; name: string; description: string | null; centerLatitude: number; centerLongitude: number; radiusKm: number } | null> {
    // For now, just call findDifferentClueSet (group logic not implemented)
    return findDifferentClueSet(gameId, location);
}


/**
 * Fetch participant progress from the database
 */


import { ClueType, PrismaClient } from '@prisma/client';
// import path from 'path';
// import { NextRequest } from 'next/server';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { default: OpenAI } = require('openai');

const prisma = new PrismaClient();

type DifficultyText = 'Easy' | 'Intermediate' | 'Hard' | 'Difficult';

async function generateAIClues(
    latitude: number,
    longitude: number,
    difficulty: DifficultyText,
    mainTarget?: string,
    theme?: string,
    numClues: number = 2
): Promise<{ question: string; answer: string; hint?: string; type: ClueType }[]> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY environment variable is not set.');
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const prompt = `Generate ${numClues} scavenger hunt clues and answers as a logical progression, where each clue leads to the next, culminating in a final goal. The clues must be connected, with each clue's answer or location providing the context or access for the next clue. The final clue should lead to the ultimate goal or location.\n\nParameters:\n- Difficulty Level: ${difficulty}\n- Main Target: ${mainTarget || "(infer based on difficulty and theme)"}\n- Theme: ${theme || "(select based on prior narrative)"}\n\nSTRICT REQUIREMENTS (do not violate any of these):\n1. The clues must form a chain: each clue should logically lead to the next, and the final clue should reveal or require the ultimate goal.\n2. Each clue must include a clear, concise, and unambiguous answer in the 'answer' field. Do not leave the answer blank or vague.\n3. Each clue should be logically solvable, with subtle hints that encourage deduction.\n4. Clues should reflect the selected theme and target (or inferred ones) while maintaining narrative continuity and progression.\n5. Difficulty should influence complexity of clue structure—higher levels include layered metaphors, wordplay, or symbolic references.\n6. Output only a JSON array, no explanations or extra text. Each clue must have: question, answer, (optional) hint, and type.\n7. UNDER NO CIRCUMSTANCES may any clue or answer reference the words 'ClueSet', 'clue set', 'clue-set', 'clueset', or any internal system name, code, or ID. All clues and answers must be natural, thematic, and never mention internal system details.\n\nExample of a progressive clue chain:\n[\n  {"question": "Go to the restaurant downtown known for its deep-dish pizza and take a selfie outside.", "answer": "Photo at Giordano's restaurant", "type": "PHOTO_UPLOAD"},\n  {"question": "Now, visit the golf course where Chicago's famous baseball player relaxes. Take a selfie in the lobby.", "answer": "Photo at Harborside International Golf Center lobby", "type": "PHOTO_UPLOAD"},\n  {"question": "Finally, find the parking space number 22 at Wrigley Field and take a selfie there.", "answer": "Photo at parking space 22, Wrigley Field", "type": "PHOTO_UPLOAD"}\n]\n\nRespond in JSON array format, e.g.:\n[\n  {"question": "...", "answer": "...", "hint": "...", "type": "TEXT_ANSWER"},\n  {"question": "...", "answer": "...", "type": "PHOTO_UPLOAD"}\n]`;
    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            { role: 'system', content: 'You are a helpful scavenger hunt clue generator.' },
            { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 600,
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No content from OpenAI');
    let clues: { question: string; answer: string; hint?: string; type: ClueType }[] = [];
    try {
        clues = JSON.parse(content);
    } catch {
        throw new Error('Failed to parse AI response as JSON: ' + content);
    }
    if (!Array.isArray(clues) || clues.length === 0) {
        throw new Error('No clues returned from AI');
    }
    const forbiddenTerms = [
        'clueset', 'clue set', 'clue-set', 'ClueSet', 'Clue Set', 'Clue-Set', 'CLUESET', 'CLUE SET', 'CLUE-SET', 'clueSet', 'Clueset', 'CLUEset', 'cluesets', 'ClueSets', 'CLUESETS', 'clue sets', 'Clue Sets', 'CLUE SETS', 'clue_set', 'Clue_Set', 'CLUE_SET', 'clue_set_id', 'ClueSetId', 'clueSetId', 'CLUESETID', 'clue set id', 'Clue Set Id', 'CLUE SET ID', 'clue set number', 'Clue Set Number', 'CLUE SET NUMBER', 'clue set code', 'Clue Set Code', 'CLUE SET CODE', 'clue set reference', 'Clue Set Reference', 'CLUE SET REFERENCE', 'clue set name', 'Clue Set Name', 'CLUE SET NAME', 'clue set description', 'Clue Set Description', 'CLUE SET DESCRIPTION', 'clue set location', 'Clue Set Location', 'CLUE SET LOCATION', 'clue set center', 'Clue Set Center', 'CLUE SET CENTER', 'clue set radius', 'Clue Set Radius', 'CLUE SET RADIUS', 'clue set bounds', 'Clue Set Bounds', 'CLUE SET BOUNDS', 'clue set details', 'Clue Set Details', 'CLUE SET DETAILS', 'clue set info', 'Clue Set Info', 'CLUE SET INFO', 'clue set data', 'Clue Set Data', 'CLUE SET DATA', 'clue set internal', 'Clue Set Internal', 'CLUE SET INTERNAL', 'clue set system', 'Clue Set System', 'CLUE SET SYSTEM', 'clue set meta', 'Clue Set Meta', 'CLUE SET META', 'clue set id', 'clue set number', 'clue set code', 'clue set reference', 'clue set name', 'clue set description', 'clue set location', 'clue set center', 'clue set radius', 'clue set bounds', 'clue set details', 'clue set info', 'clue set data', 'clue set internal', 'clue set system', 'clue set meta'
    ];
    const forbiddenRegex = new RegExp(forbiddenTerms.join('|'), 'i');
    const validatedClues = clues.map((clue, idx) => {
        if (
            typeof clue.question !== 'string' ||
            typeof clue.answer !== 'string' ||
            clue.question.trim().length <= 1 ||
            clue.answer.trim().length <= 1
        ) {
            throw new Error(`Clue or answer missing, invalid, or too short at index ${idx}`);
        }
        if (forbiddenRegex.test(clue.question) || forbiddenRegex.test(clue.answer)) {
            throw new Error(`Clue or answer at index ${idx} contains forbidden internal system references.`);
        }
        return {
            question: clue.question,
            answer: clue.answer,
            hint: typeof clue.hint === 'string' ? clue.hint : undefined,
            type: clue.type === 'PHOTO_UPLOAD' ? 'PHOTO_UPLOAD' as ClueType : 'TEXT_ANSWER' as ClueType,
        };
    });
    return validatedClues;
}
// import { prisma } from './prisma';

export interface Location {
    lat: number
    lng: number
}

export interface ClueSetBounds {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
    centerLat: number
    centerLng: number
}

/**
 * Calculate distance between two points in kilometers using Haversine formula
 */
export function calculateDistance(point1: Location, point2: Location): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = toRadians(point2.lat - point1.lat)
    const dLng = toRadians(point2.lng - point1.lng)

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

export type CreateClueSetOptions = {
    gameId: string;
    location: Location;
    name: string;
    description?: string;
    phase?: string;
    level?: number;
    stage?: number;
    cluesCount?: number;
    stageId: string;
};

// ...existing code...

/**
 * Assign a participant to the appropriate clue set based on their location
 */
export async function assignParticipantToClueSet(
    participantId: string,
    gameId: string,
    location: Location
) {
    // Get participant
    const participant = await prisma.participant.findUnique({
        where: { id: participantId },
        select: { clueSetId: true }
    });
    // If already assigned, do nothing
    if (participant?.clueSetId) {
        return null;
    }
    // Get participant progress (latest)
    const progress = await prisma.participantProgress.findFirst({
        where: { participantId },
        orderBy: { createdAt: 'desc' },
        select: { currentLevel: true, currentStage: true, stageId: true }
    });
    if (!progress) throw new Error('Participant progress not found');
    const level = progress.currentLevel;
    const stage = progress.currentStage;
    const stageId = progress.stageId;

    // 1. Check if a clue set exists for this location
    let clueSet = await findExistingClueSet(gameId, location);
    if (!clueSet) {
        // 2. Check if a new clue set can be created at this location without overlapping
        const allClueSets = await prisma.clueSet.findMany({
            where: { gameId, isActive: true },
            select: {
                id: true,
                centerLatitude: true,
                centerLongitude: true,
                radiusKm: true
            }
        });
        const newBounds = calculateBoundingBox(location, 1); // Assume default radius 1km for new sets
        let canCreate = true;
        for (const cs of allClueSets) {
            const existingBounds = calculateBoundingBox({ lat: cs.centerLatitude, lng: cs.centerLongitude }, cs.radiusKm);
            if (cluesetsOverlap(newBounds, existingBounds, Math.max(1, cs.radiusKm))) {
                canCreate = false;
                break;
            }
        }
        if (canCreate) {
            // Create new clue set and assign
            const locationName = `ClueSet-${Math.round(location.lat * 1000)}-${Math.round(location.lng * 1000)}`;
            clueSet = await createClueSet({
                gameId,
                location,
                name: locationName,
                description: `Auto-generated clue set for location ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
                phase: 'PHASE_1',
                level,
                stage,
                cluesCount: 4,
                stageId
            });
        } else {
            // Assign to closest existing clue set
            clueSet = await findClosestOverlappingClueSet(gameId, location);
        }
    }

    // Update participant with clue set assignment
    if (clueSet) {
        await prisma.participant.update({
            where: { id: participantId },
            data: {
                clueSetId: clueSet.id,
                currentLatitude: location.lat,
                currentLongitude: location.lng,
                lastLocationUpdate: new Date()
            }
        });
    }
    return clueSet;
}
export function isPointInClueSet(point: Location, clueSet: {
    centerLatitude: number
    centerLongitude: number
    radiusKm: number
}): boolean {
    const center = { lat: clueSet.centerLatitude, lng: clueSet.centerLongitude }
    const distance = calculateDistance(point, center)
    return distance <= clueSet.radiusKm
}

/**
 * Check if two clue sets would overlap
 */
export function cluesetsOverlap(
    clueSet1: ClueSetBounds,
    clueSet2: ClueSetBounds,
    radiusKm: number
): boolean {
    const center1 = { lat: clueSet1.centerLat, lng: clueSet1.centerLng }
    const center2 = { lat: clueSet2.centerLat, lng: clueSet2.centerLng }
    const distance = calculateDistance(center1, center2)

    // If distance between centers is less than sum of radii, they overlap
    return distance < (radiusKm * 2)
}

/**
 * Find an existing clue set that contains the given location
 */
export async function findExistingClueSet(
    gameId: string,
    location: Location
): Promise<{
    id: string;
    name: string;
    description: string | null;
    centerLatitude: number;
    centerLongitude: number;
    radiusKm: number;
    createdAt: Date;
    updatedAt: Date;
    minLatitude: number;
    maxLatitude: number;
    minLongitude: number;
    maxLongitude: number;
    phase: string;
    isActive: boolean;
    gameId: string;
    stageNumber: number;
    levelNumber: number;
} | null> {
    // First, do a rough bounding box search for performance
    const clueSets = await prisma.clueSet.findMany({
        where: {
            gameId,
            isActive: true,
            // Rough bounding box check
            minLatitude: { lte: location.lat },
            maxLatitude: { gte: location.lat },
            minLongitude: { lte: location.lng },
            maxLongitude: { gte: location.lng }
        },
        select: {
            id: true,
            name: true,
            description: true,
            centerLatitude: true,
            centerLongitude: true,
            radiusKm: true,
            createdAt: true,
            updatedAt: true,
            minLatitude: true,
            maxLatitude: true,
            minLongitude: true,
            maxLongitude: true,
            phase: true,
            isActive: true,
            gameId: true,
            stageNumber: true,
            levelNumber: true
        }
    })

    // Then check exact distance for each candidate
    for (const clueSet of clueSets) {
        if (isPointInClueSet(location, clueSet)) {
            return clueSet;
        }
    }
    return null;
}

/**
 * Find the best position for a new clue set that doesn't overlap with existing ones
 */
export async function findOptimalClueSetPosition(
    gameId: string,
    desiredLocation: Location,
    radiusKm: number = 16.09344 // 10 miles
): Promise<Location> {
    const existingClueSets = await prisma.clueSet.findMany({
        where: {
            gameId,
            isActive: true
        },
        select: {
            centerLatitude: true,
            centerLongitude: true,
            radiusKm: true
        }
    })

    // If no existing clue sets, use desired location
    if (existingClueSets.length === 0) {
        return desiredLocation
    }

    // Check if desired location works
    const desiredBounds = calculateBoundingBox(desiredLocation, radiusKm)
    let hasOverlap = false

    for (const existing of existingClueSets) {
        const existingBounds = calculateBoundingBox(
            { lat: existing.centerLatitude, lng: existing.centerLongitude },
            existing.radiusKm
        )

        if (cluesetsOverlap(desiredBounds, existingBounds, radiusKm)) {
            hasOverlap = true
            break
        }
    }

    if (!hasOverlap) {
        return desiredLocation;
    }
    console.warn('Could not find optimal clue set position, using desired location');
    return desiredLocation;
}

/**
 * Create a new clue set for a given location using options object
 */
export async function createClueSet(options: CreateClueSetOptions) {
    const gameId: string = options.gameId;
    const location: Location = options.location;
    const name: string = options.name;
    const description: string = options.description ?? '';
    // phase is not used; removed to resolve lint error.
    const level: number = options.level ?? 1;
    const stage: number = options.stage ?? 1;
    const cluesCount: number = options.cluesCount ?? 4;
    const stageId: string = options.stageId;

    // Determine radius based on level/group
    let radiusKm: number = 16.09344; // default 10 miles
    if (level === 1 || level === 2) {
        radiusKm = 4.82803; // 3 miles in km
    } else if (level === 4 || level === 5) {
        radiusKm = 16.09344; // 10 miles in km (group clue sets)
    }

    // Find optimal position that doesn't overlap
    const optimalLocation = await findOptimalClueSetPosition(gameId, location, radiusKm);

    // Calculate bounding box
    const bounds = calculateBoundingBox(optimalLocation, radiusKm);

    // Create the clue set
    const clueSet = await prisma.clueSet.create({
        data: {
            name,
            description,
            gameId,
            centerLatitude: optimalLocation.lat,
            centerLongitude: optimalLocation.lng,
            radiusKm,
            minLatitude: bounds.minLat,
            maxLatitude: bounds.maxLat,
            minLongitude: bounds.minLng,
            maxLongitude: bounds.maxLng
        }
    });

    // Generate clues using OpenAI
    const generatedClues = await generateAIClues(
        optimalLocation.lat,
        optimalLocation.lng,
        level <= 3 ? 'Easy' : level <= 6 ? 'Intermediate' : 'Hard',
        name,
        undefined,
        cluesCount
    );

    try {
        // Find the next hunt number for this stage
        const existingHunts = await prisma.hunt.findMany({
            where: { stageId },
            select: { huntNumber: true },
            orderBy: { huntNumber: 'desc' },
            take: 1
        });
        const nextHuntNumber = existingHunts.length > 0 ? (existingHunts[0].huntNumber ?? 0) + 1 : 1;

        // Create a hunt for this clue set and stage
        const hunt = await prisma.hunt.create({
            data: {
                name: `${name} Hunt`,
                description: `Hunt for ${name} (Level ${level}, Stage ${stage})`,
                clueSetId: clueSet.id,
                stageId: stageId,
                huntNumber: nextHuntNumber
            }
        });

        // Store generated clues
        for (let i = 0; i < generatedClues.length; i++) {
            await prisma.clue.create({
                data: {
                    clueNumber: i + 1,
                    question: generatedClues[i].question,
                    answer: generatedClues[i].answer,
                    hint: generatedClues[i].hint,
                    type: generatedClues[i].type,
                    huntId: hunt.id
                }
            });
        }
        return clueSet;
    } catch (err: unknown) {
        // Propagate OpenAI errors up
        if (err instanceof Error) {
            throw new Error('Failed to create hunt and clues: ' + err.message);
        }
        throw new Error('Failed to create hunt and clues: Unknown error');
    }
}

/**
 * Assign a participant to the appropriate clue set based on their location
 */

/**
 * Get or create clues for a clue set
 */

export async function getCluesForClueSet(
    clueSetId: string,
    stageId: string
): Promise<Array<{ id: string; name: string; description: string | null; clues: Array<{ id: string; clueNumber: number; question: string; type: string; huntId: string }> }>> {
    // Check if hunts already exist for this clue set and stage
    try {
        const existingHunts = await prisma.hunt.findMany({
            where: {
                clueSetId,
                stageId
            },
            include: {
                clues: {
                    orderBy: { clueNumber: 'asc' }
                }
            }
        });
        if (existingHunts.length > 0) {
            return existingHunts;
        }
    } catch (err) {
        throw new Error('Database error while checking for existing hunts: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }

    // If no hunts exist, auto-generate clues and create hunt
    let clueSet;
    let stage;
    try {
        clueSet = await prisma.clueSet.findUnique({ where: { id: clueSetId } });
        stage = await prisma.stage.findUnique({ where: { id: stageId }, include: { level: true } });
        if (!clueSet || !stage || !stage.level) {
            throw new Error('ClueSet, Stage, or Level not found');
        }
    } catch (err) {
        throw new Error('Database error while fetching clueSet or stage: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }

    // Prepare parameters for AI clue generation
    let generatedClues: { question: string; answer: string; hint?: string; type: ClueType }[];
    try {
        generatedClues = await generateAIClues(
            clueSet.centerLatitude,
            clueSet.centerLongitude,
            stage.level.levelNumber <= 3 ? 'Easy' : stage.level.levelNumber <= 6 ? 'Intermediate' : 'Hard',
            clueSet.name,
            undefined,
            4
        );
    } catch (err) {
        throw new Error('AI clue generation failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
    try {
        // Removed legacy generateClues usage; unified on generateAIClues above.
    } catch (err) {
        throw new Error('AI clue generation failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }

    // Find the next hunt number for this stage
    let nextHuntNumber = 1;
    try {
        const existingHuntNumbers = await prisma.hunt.findMany({
            where: { stageId },
            select: { huntNumber: true },
            orderBy: { huntNumber: 'desc' },
            take: 1
        });
        nextHuntNumber = existingHuntNumbers.length > 0 ? (existingHuntNumbers[0].huntNumber ?? 0) + 1 : 1;
    } catch (err) {
        throw new Error('Database error while determining next hunt number: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }

    // Create a hunt for this clue set and stage
    let hunt;
    try {
        hunt = await prisma.hunt.create({
            data: {
                name: `${clueSet.name} Hunt`,
                description: `Hunt for ${clueSet.name} (Level ${stage.level.levelNumber}, Stage ${stage.stageNumber})`,
                clueSetId: clueSet.id,
                stageId: stage.id,
                huntNumber: nextHuntNumber
            }
        });
    } catch (err) {
        throw new Error('Database error while creating hunt: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }

    // Store generated clues
    try {
        for (let i = 0; i < generatedClues.length; i++) {
            await prisma.clue.create({
                data: {
                    clueNumber: i + 1,
                    question: generatedClues[i].question,
                    answer: generatedClues[i].answer,
                    hint: generatedClues[i].hint,
                    type: generatedClues[i].type,
                    huntId: hunt.id
                }
            });
        }
    } catch (err) {
        throw new Error('Database error while storing generated clues: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }

    // Return the newly created hunt with clues
    try {
        const newHunt = await prisma.hunt.findUnique({
            where: { id: hunt.id },
            include: {
                clues: { orderBy: { clueNumber: 'asc' } }
            }
        });
        return newHunt ? [newHunt] : [];
    } catch (err) {
        throw new Error('Database error while fetching new hunt: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
}
