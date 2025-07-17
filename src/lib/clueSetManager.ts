import { prisma } from './prisma'

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
    return degrees * (Math.PI / 180)
}

/**
 * Calculate bounding box for a given center point and radius in kilometers
 */
export function calculateBoundingBox(center: Location, radiusKm: number): ClueSetBounds {
    const R = 6371 // Earth's radius in kilometers

    // Calculate latitude bounds
    const latOffset = (radiusKm / R) * (180 / Math.PI)
    const minLat = center.lat - latOffset
    const maxLat = center.lat + latOffset

    // Calculate longitude bounds (accounting for latitude)
    const lngOffset = (radiusKm / R) * (180 / Math.PI) / Math.cos(toRadians(center.lat))
    const minLng = center.lng - lngOffset
    const maxLng = center.lng + lngOffset

    return {
        minLat,
        maxLat,
        minLng,
        maxLng,
        centerLat: center.lat,
        centerLng: center.lng
    }
}

/**
 * Check if a point is within a clue set's radius
 */
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
        return desiredLocation
    }

    // Find alternative position by moving away from overlapping areas
    // Try positions in a spiral pattern around the desired location
    const searchRadiusKm = radiusKm * 2.2 // Start search beyond the radius
    const maxAttempts = 16

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const angle = (attempt * 45) * (Math.PI / 180) // 45-degree increments
        const searchRadius = searchRadiusKm + (attempt * radiusKm * 0.5)

        // Calculate new position
        const offsetLat = (searchRadius / 6371) * (180 / Math.PI) * Math.cos(angle)
        const offsetLng = (searchRadius / 6371) * (180 / Math.PI) * Math.sin(angle) /
            Math.cos(toRadians(desiredLocation.lat))

        const candidateLocation = {
            lat: desiredLocation.lat + offsetLat,
            lng: desiredLocation.lng + offsetLng
        }

        // Check if this candidate position works
        const candidateBounds = calculateBoundingBox(candidateLocation, radiusKm)
        let candidateHasOverlap = false

        for (const existing of existingClueSets) {
            const existingBounds = calculateBoundingBox(
                { lat: existing.centerLatitude, lng: existing.centerLongitude },
                existing.radiusKm
            )

            if (cluesetsOverlap(candidateBounds, existingBounds, radiusKm)) {
                candidateHasOverlap = true
                break
            }
        }

        if (!candidateHasOverlap) {
            return candidateLocation
        }
    }

    // If we couldn't find a good position, return desired location anyway
    // This should be rare in real-world scenarios
    console.warn('Could not find optimal clue set position, using desired location')
    return desiredLocation
}

/**
 * Create a new clue set for a given location
 */
export async function createClueSet(
    gameId: string,
    location: Location,
    name: string,
    description?: string
) {
    const radiusKm = 16.09344 // 10 miles in kilometers

    // Find optimal position that doesn't overlap
    const optimalLocation = await findOptimalClueSetPosition(gameId, location, radiusKm)

    // Calculate bounding box
    const bounds = calculateBoundingBox(optimalLocation, radiusKm)

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
    })

    return clueSet
}

/**
 * Assign a participant to the appropriate clue set based on their location
 */
export async function assignParticipantToClueSet(
    participantId: string,
    gameId: string,
    location: Location
) {
    // First try to find existing clue set
    let clueSet = await findExistingClueSet(gameId, location)

    if (!clueSet) {
        // Create new clue set
        const locationName = `ClueSet-${Math.round(location.lat * 1000)}-${Math.round(location.lng * 1000)}`
        clueSet = await createClueSet(
            gameId,
            location,
            locationName,
            `Auto-generated clue set for location ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
        )
    }

    // Update participant with clue set assignment
    await prisma.participant.update({
        where: { id: participantId },
        data: {
            clueSetId: clueSet.id,
            currentLatitude: location.lat,
            currentLongitude: location.lng,
            lastLocationUpdate: new Date()
        }
    })

    return clueSet
}

/**
 * Get or create clues for a clue set
 */
export async function getCluesForClueSet(clueSetId: string, stageId: string) {
    // Check if hunts already exist for this clue set and stage
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
    })

    if (existingHunts.length > 0) {
        return existingHunts
    }

    // If no hunts exist, we need to generate them
    // For now, return empty array - in a real implementation, you'd call your AI service here
    return []
}
