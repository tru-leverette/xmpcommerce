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


import { ClueGenerationParams, generateClues, GeneratedClue } from './openaiClueGenerator';
import { prisma } from './prisma';

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

    let clueSet: { id: string; name: string; description: string | null; centerLatitude: number; centerLongitude: number; radiusKm: number } | null = null;

    if (level === 3 && (stage === 3 || stage === 4)) {
        clueSet = await findDifferentClueSet(gameId, location);
    } else if (level === 6 && (stage === 3 || stage === 4)) {
        clueSet = await findDifferentGroupClueSet(gameId, location);
    } else {
        clueSet = await findExistingClueSet(gameId, location);
        if (!clueSet) {
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
    id: string
    name: string
    description: string | null
    centerLatitude: number
    centerLongitude: number
    radiusKm: number
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
            radiusKm: true
        }
    })

    // Then check exact distance for each candidate
    for (const clueSet of clueSets) {
        if (isPointInClueSet(location, clueSet)) {
            return clueSet
        }
    }

    return null
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
    const phase: string = options.phase ?? 'PHASE_1';
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
    const params: ClueGenerationParams = {
        locationName: name,
        center: { lat: optimalLocation.lat, lng: optimalLocation.lng },
        radiusKm,
        phase,
        level,
        stage,
        difficulty: level <= 3 ? 'easy' : level <= 6 ? 'medium' : 'hard',
        cluesCount
    };
    const generatedClues: GeneratedClue[] = await generateClues(params);

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
                    question: generatedClues[i].clue,
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

export async function getCluesForClueSet(clueSetId: string, stageId: string) {
    // Check if hunts already exist for this clue set and stage
    const existingHunts = await prisma.hunt.findMany({
        where: {
            clueSetId: clueSetId,
            stageId: stageId
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

    // If no hunts exist, auto-generate clues and create hunt
    const clueSet = await prisma.clueSet.findUnique({ where: { id: clueSetId } });
    const stage = await prisma.stage.findUnique({ where: { id: stageId }, include: { level: true } });
    if (!clueSet || !stage || !stage.level) {
        throw new Error('ClueSet, Stage, or Level not found');
    }
    const params: ClueGenerationParams = {
        locationName: clueSet.name,
        center: { lat: clueSet.centerLatitude, lng: clueSet.centerLongitude },
        radiusKm: clueSet.radiusKm,
        phase: 'PHASE_1',
        level: stage.level.levelNumber,
        stage: stage.stageNumber,
        difficulty: stage.level.levelNumber <= 3 ? 'easy' : stage.level.levelNumber <= 6 ? 'medium' : 'hard',
        cluesCount: 4
    };
    const generatedClues: GeneratedClue[] = await generateClues(params);

    // Find the next hunt number for this stage
    const existingHuntNumbers = await prisma.hunt.findMany({
        where: { stageId },
        select: { huntNumber: true },
        orderBy: { huntNumber: 'desc' },
        take: 1
    });
    const nextHuntNumber = existingHuntNumbers.length > 0 ? (existingHuntNumbers[0].huntNumber ?? 0) + 1 : 1;

    // Create a hunt for this clue set and stage
    const hunt = await prisma.hunt.create({
        data: {
            name: `${clueSet.name} Hunt`,
            description: `Hunt for ${clueSet.name} (Level ${stage.level.levelNumber}, Stage ${stage.stageNumber})`,
            clueSetId: clueSet.id,
            stageId: stage.id,
            huntNumber: nextHuntNumber
        }
    });

    // Store generated clues
    for (let i = 0; i < generatedClues.length; i++) {
        await prisma.clue.create({
            data: {
                clueNumber: i + 1,
                question: generatedClues[i].clue,
                type: generatedClues[i].type,
                huntId: hunt.id
            }
        });
    }

    // Return the newly created hunt with clues
    const newHunt = await prisma.hunt.findUnique({
        where: { id: hunt.id },
        include: {
            clues: { orderBy: { clueNumber: 'asc' } }
        }
    });
    return newHunt ? [newHunt] : [];
}
