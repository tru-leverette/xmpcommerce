
import { JWTPayload } from '@/lib/auth';
import { generateAIClues } from '@/lib/clueSetManager';
import { Location } from '@/types/location';
import { Clue, ClueSet, ClueType, Hunt, Level, Participant, ParticipantProgress, Phase, PrismaClient, Stage } from '@prisma/client';
import { NextResponse } from 'next/server';


interface HandleTestAssignmentArgs {
    gameId: string;
    decoded: JWTPayload;
    prisma: PrismaClient;
    NextResponse: typeof NextResponse;
}

interface HandleCreateTestClueSetArgs {
    gameId: string;
    location: Location;
    prisma: PrismaClient;
    NextResponse: typeof NextResponse;
}

interface HandleListClueSetsArgs {
    gameId: string;
    prisma: PrismaClient;
    NextResponse: typeof NextResponse;
}

interface ClueSetWithParticipants extends ClueSet {
    participants: Array<{ id: string; user: { username: string } }>;
}

// Use Prisma-generated ParticipantProgress type for type safety
type ParticipantWithClueSet = Omit<Participant, 'progress'> & {
    progress: ParticipantProgress | null;
    clueSet: ClueSet | null;
};

interface ClueSetInfo {
    id: string;
    name: string;
    description: string | null;
    center: { lat: number; lng: number };
    radius: string;
    participantCount: number;
    participants: string[];
}

export async function updateClueSet({ clueSetId, prisma, data }: { clueSetId: string; prisma: PrismaClient; data: Partial<ClueSet>; }): Promise<ClueSet> {
    // Only allow updating fields that exist on ClueSet
    return await prisma.clueSet.update({
        where: { id: clueSetId },
        data
    });
}

export async function handleTestAssignment({ gameId, decoded, prisma, NextResponse }: HandleTestAssignmentArgs): Promise<NextResponse> {
    const participant: ParticipantWithClueSet | null = await prisma.participant.findFirst({
        where: { gameId, userId: decoded.userId },
        include: { progress: true, clueSet: true }
    });
    // Validate registration geolocation/city
    if (!participant ||
        participant.registrationCity == null ||
        typeof participant.registrationCity !== 'string' ||
        !participant.registrationCity.trim() ||
        typeof participant.registrationLatitude !== 'number' ||
        typeof participant.registrationLongitude !== 'number' ||
        participant.registrationLatitude < -90 || participant.registrationLatitude > 90 ||
        participant.registrationLongitude < -180 || participant.registrationLongitude > 180
    ) {
        return NextResponse.json({ error: 'Participant registration geolocation/city missing or invalid' }, { status: 400 });
    }
    if (!participant || !participant.progress) {
        return NextResponse.json({ error: 'Participant or progress not found' }, { status: 404 });
    }
    const progress = participant.progress;
    const { phase, currentLevel, currentStage } = progress;
    let clueSet = participant.clueSet;
    let created = false;
    const registrationLocation = {
        lat: participant.registrationLatitude,
        lng: participant.registrationLongitude
    };
    const registrationCity = participant.registrationCity;
    // Utility: calculate distance (Haversine)
    function calculateDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
        const toRadians = (deg: number): number => deg * (Math.PI / 180);
        const R = 6371;
        const dLat = toRadians(b.lat - a.lat);
        const dLng = toRadians(b.lng - a.lng);
        const lat1 = toRadians(a.lat);
        const lat2 = toRadians(b.lat);
        const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
        return R * c;
    }
    // Utility: is point in clue set
    function isPointInClueSet(location: { lat: number; lng: number }, clueSet: ClueSet): boolean {
        const distance = calculateDistance(location, { lat: clueSet.centerLatitude, lng: clueSet.centerLongitude });
        return distance <= (clueSet.radiusKm ?? (phase === 'PHASE_1' ? 3 : 5));
    }
    // Utility: do clue sets overlap
    function cluesetsOverlap(cs1: ClueSet, cs2: ClueSet): boolean {
        const distance = calculateDistance(
            { lat: cs1.centerLatitude, lng: cs1.centerLongitude },
            { lat: cs2.centerLatitude, lng: cs2.centerLongitude }
        );
        const r1 = cs1.radiusKm ?? (phase === 'PHASE_1' ? 3 : 5);
        const r2 = cs2.radiusKm ?? (phase === 'PHASE_1' ? 3 : 5);
        return distance < (r1 + r2);
    }
    if (!clueSet) {
        console.log(`Participant ${participant.id} has no clue set, assigning...`);
        console.log(`Participant ${participant.id} has no clue set, assigning...`);
        console.log(`Participant ${participant.id} has no clue set, assigning...`);
        console.log(`Participant ${participant.id} has no clue set, assigning...`);
        console.log(`Participant ${participant.id} has no clue set, assigning...`);
        if (phase === 'PHASE_1') {
            // Query clue sets only in the participant's registration city
            const clueSets = await prisma.clueSet.findMany({
                where: {
                    gameId,
                    phase: Phase.PHASE_1,
                    isActive: true,
                    city: registrationCity
                }
            });
            const clueSetsWithDistance = clueSets.map(cs => ({
                ...cs,
                distance: calculateDistance(registrationLocation, { lat: cs.centerLatitude, lng: cs.centerLongitude })
            }));
            const closestClueSets = clueSetsWithDistance
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 5);
            clueSet = closestClueSets.find(cs => isPointInClueSet(registrationLocation, cs)) || null;
            if (!clueSet) {
                // Iterative relocation logic
                let attempt = 0;
                let foundLocation = false;
                let newLat = registrationLocation.lat;
                let newLng = registrationLocation.lng;
                // removed unused lastOverlapIdx
                const radius = 3;
                const directions = [0, 120, 240]; // degrees: 0 (original direction), 120, 240
                while (attempt < 3 && !foundLocation) {
                    // Build new clue set object
                    const newClueSet: ClueSet = {
                        id: '',
                        name: '',
                        description: '',
                        mainSubject: '',
                        centerLatitude: newLat,
                        centerLongitude: newLng,
                        radiusKm: radius,
                        minLatitude: newLat,
                        maxLatitude: newLat,
                        minLongitude: newLng,
                        maxLongitude: newLng,
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        gameId,
                        phase: Phase.PHASE_1,
                        levelNumber: currentLevel,
                        stageNumber: currentStage,
                        city: registrationCity
                    };
                    // Check for overlap
                    let overlapIdx = -1;
                    for (let i = 0; i < closestClueSets.length; i++) {
                        if (cluesetsOverlap(newClueSet, closestClueSets[i])) {
                            overlapIdx = i;
                            break;
                        }
                    }
                    if (overlapIdx === -1) {
                        foundLocation = true;
                        break;
                    }
                    // Move center outside overlapping clue set's radius (direction of least resistance)
                    const overlapCS = closestClueSets[overlapIdx];
                    // Calculate vector from overlapCS to current location
                    const dLat = newLat - overlapCS.centerLatitude;
                    const dLng = newLng - overlapCS.centerLongitude;
                    let norm = Math.sqrt(dLat * dLat + dLng * dLng);
                    // If norm is 0, pick a default direction based on attempt
                    let moveLat, moveLng;
                    if (norm === 0) {
                        // Use direction angle (degrees)
                        const angle = directions[attempt] * (Math.PI / 180);
                        moveLat = Math.cos(angle);
                        moveLng = Math.sin(angle);
                        norm = 1;
                    } else {
                        moveLat = dLat / norm;
                        moveLng = dLng / norm;
                    }
                    // Move so that distance between centers is 2 * radius
                    newLat = overlapCS.centerLatitude + moveLat * (2 * radius / 111.32); // 1 deg lat ~ 111.32 km
                    newLng = overlapCS.centerLongitude + moveLng * (2 * radius / (111.32 * Math.cos(overlapCS.centerLatitude * Math.PI / 180)));
                    attempt++;
                    // removed lastOverlapIdx
                }
                if (foundLocation) {
                    const locationName = `ClueSet-${Math.round(newLat * 1000)}-${Math.round(newLng * 1000)}`;
                    clueSet = await prisma.clueSet.create({
                        data: {
                            gameId,
                            centerLatitude: newLat,
                            centerLongitude: newLng,
                            minLatitude: newLat,
                            maxLatitude: newLat,
                            minLongitude: newLng,
                            maxLongitude: newLng,
                            name: locationName,
                            description: `Auto-generated clue set for location ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`,
                            phase: Phase.PHASE_1,
                            levelNumber: currentLevel,
                            isActive: true,
                            radiusKm: radius,
                            city: registrationCity
                        }
                    });
                    created = true;
                } else {
                    // After 3 attempts, assign to closest clue set
                    clueSet = closestClueSets[0];
                    created = false;
                }
            }
            await prisma.participant.update({
                where: { id: participant.id },
                data: { clueSet: { connect: { id: clueSet.id } } }
            });
        } else {
            // For other phases, participant should already have a clue set
            return NextResponse.json({ error: 'Participant should already have a clue set in this phase' }, { status: 400 });
        }
    }
    // Hunt lookup and creation by clueSetId, levelNumber, stageNumber
    let hunt: Hunt | null = await prisma.hunt.findFirst({
        where: {
            clueSetId: clueSet.id
        }
    });
    if (!hunt) {
        hunt = await prisma.hunt.create({
            data: {
                clueSetId: clueSet.id,
                huntNumber: 1,
                name: `Hunt for ClueSet ${clueSet.name}`,
                description: `Auto-generated hunt for ClueSet ${clueSet.name}`
            }
        });
    }
    const cluesForStage: Clue[] = await prisma.clue.findMany({ where: { huntId: hunt.id } });
    if (cluesForStage.length === 0) {
        try {
            // Use the clue set's center coordinates for AI clue generation
            const aiResult = await generateAIClues(
                { lat: clueSet.centerLatitude, lng: clueSet.centerLongitude },
                'Easy',
                4,
                clueSet.radiusKm
            );
            // Update clue set with mainSubject if present
            if (aiResult.mainSubject) {
                await updateClueSet({ clueSetId: clueSet.id, prisma, data: { mainSubject: aiResult.mainSubject } });
            }
            for (const clue of aiResult.clues) {
                // Validate clue.type against ClueType enum
                let clueType: ClueType;
                if (Object.values(ClueType).includes(clue.type as ClueType)) {
                    clueType = clue.type as ClueType;
                } else {
                    throw new Error(`Invalid clue type '${clue.type}' for clue #${clue.clueNumber}`);
                }
                await prisma.clue.create({
                    data: {
                        clueNumber: clue.clueNumber,
                        question: clue.question,
                        answerVariations: clue.answerVariations,
                        explanation: clue.explanation,
                        type: clueType,
                        isActive: true,
                        aiGenerated: true,
                        huntId: hunt.id
                    }
                });
            }
        } catch (error) {
            // Robust error handling for AI clue generation
            return NextResponse.json({ error: 'Failed to generate AI clues', details: (error as Error).message }, { status: 500 });
        }
    }
    const distance = Math.sqrt(
        Math.pow(registrationLocation.lat - clueSet.centerLatitude, 2) +
        Math.pow(registrationLocation.lng - clueSet.centerLongitude, 2)
    );
    const response = {
        id: clueSet.id,
        name: clueSet.name,
        description: clueSet.description,
        center: {
            lat: clueSet.centerLatitude,
            lng: clueSet.centerLongitude
        },
        radius: `${clueSet.radiusKm ?? 1} km`,
        distance: `${distance.toFixed(2)} km`,
        created
    };
    return NextResponse.json({ result: created ? 'created' : 'existing_clue_set', clueSet: response });
}
export async function handleCreateTestClueSet({ gameId, location, prisma, NextResponse }: HandleCreateTestClueSetArgs): Promise<NextResponse> {
    let level: Level | null = await prisma.level.findFirst({ where: { gameId } });
    if (!level) {
        level = await prisma.level.create({
            data: {
                gameId,
                levelNumber: 1,
                name: 'Level 1',
                description: 'Auto-created Level 1',
            },
        });
    }
    let stage: Stage | null = await prisma.stage.findFirst({ where: { levelId: level.id } });
    if (!stage) {
        stage = await prisma.stage.create({
            data: {
                levelId: level.id,
                stageNumber: 1,
                name: 'Stage 1',
                description: 'Auto-created Stage 1',
            },
        });
    }
    const locationName = `Test-${Math.round(location.lat * 1000)}-${Math.round(location.lng * 1000)}`;
    const clueSet: ClueSet = await prisma.clueSet.create({
        data: {
            gameId,
            centerLatitude: location.lat,
            centerLongitude: location.lng,
            minLatitude: location.lat,
            maxLatitude: location.lat,
            minLongitude: location.lng,
            maxLongitude: location.lng,
            name: locationName,
            description: `Test clue set for location ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
            phase: Phase.PHASE_1,
            levelNumber: 1,
            isActive: true
        }
    });
    return NextResponse.json({
        result: 'created',
        clueSet: {
            id: clueSet.id,
            name: clueSet.name,
            description: clueSet.description,
            center: {
                lat: clueSet.centerLatitude,
                lng: clueSet.centerLongitude
            },
            radius: `${clueSet.radiusKm ?? 1} km`
        }
    });
}
export async function handleListClueSets({ gameId, prisma, NextResponse }: HandleListClueSetsArgs): Promise<NextResponse> {
    const clueSets: ClueSetWithParticipants[] = await prisma.clueSet.findMany({
        where: { gameId, isActive: true },
        include: {
            participants: {
                select: {
                    id: true,
                    user: {
                        select: {
                            username: true
                        }
                    }
                }
            }
        }
    });
    const clueSetInfo: ClueSetInfo[] = clueSets.map((cs: ClueSetWithParticipants) => ({
        id: cs.id,
        name: cs.name,
        description: cs.description,
        center: {
            lat: cs.centerLatitude,
            lng: cs.centerLongitude
        },
        radius: `${cs.radiusKm ?? 1} km`,
        participantCount: cs.participants.length,
        participants: cs.participants.map((p: { id: string; user: { username: string } }) => p.user.username)
    }));
    return NextResponse.json({
        result: 'listed',
        clueSets: clueSetInfo
    });
}