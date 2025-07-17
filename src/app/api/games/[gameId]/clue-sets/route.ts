import { verifyToken } from '@/lib/auth'
import {
    calculateDistance,
    createClueSet,
    findExistingClueSet,
    type Location
} from '@/lib/clueSetManager'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Test endpoint to demonstrate clue set assignment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    try {
        const resolvedParams = await params
        const gameId = resolvedParams.gameId
        // Verify authentication
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const decoded = verifyToken(token)
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const body = await request.json()
        const { lat, lng, action } = body

        const location: Location = { lat, lng }

        if (action === 'test-assignment') {
            // Test the clue set assignment logic
            const existingClueSet = await findExistingClueSet(gameId, location)

            if (existingClueSet) {
                const distance = calculateDistance(
                    location,
                    { lat: existingClueSet.centerLatitude, lng: existingClueSet.centerLongitude }
                )

                return NextResponse.json({
                    result: 'existing_clue_set',
                    clueSet: {
                        id: existingClueSet.id,
                        name: existingClueSet.name,
                        distance: `${distance.toFixed(2)} km`,
                        center: {
                            lat: existingClueSet.centerLatitude,
                            lng: existingClueSet.centerLongitude
                        }
                    }
                })
            } else {
                // Would create a new clue set
                return NextResponse.json({
                    result: 'would_create_new',
                    message: 'No existing clue set found. Would create new one.',
                    location
                })
            }
        }

        if (action === 'create-test-clue-set') {
            // Create a test clue set
            const locationName = `Test-${Math.round(lat * 1000)}-${Math.round(lng * 1000)}`
            const clueSet = await createClueSet(
                gameId,
                location,
                locationName,
                `Test clue set for location ${lat.toFixed(4)}, ${lng.toFixed(4)}`
            )

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
                    radius: `${clueSet.radiusKm} km`
                }
            })
        }

        if (action === 'list-clue-sets') {
            // List all clue sets for this game
            const clueSets = await prisma.clueSet.findMany({
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
            })

            const clueSetInfo = clueSets.map(cs => ({
                id: cs.id,
                name: cs.name,
                description: cs.description,
                center: {
                    lat: cs.centerLatitude,
                    lng: cs.centerLongitude
                },
                radius: `${cs.radiusKm} km`,
                participantCount: cs.participants.length,
                participants: cs.participants.map(p => p.user.username)
            }))

            return NextResponse.json({
                result: 'listed',
                clueSets: clueSetInfo
            })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (error) {
        console.error('Error in clue set test:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
