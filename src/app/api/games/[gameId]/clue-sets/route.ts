import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Location } from '@/types/location';
import { NextRequest, NextResponse } from 'next/server';
import { handleCreateTestClueSet, handleListClueSets, handleTestAssignment } from './clueSetActions';

// endpoint to test access to clue set assignment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
): Promise<NextResponse> {
    try {
        const resolvedParams = await params;
        const gameId: string = resolvedParams.gameId;
        // Verify authentication
        const authHeader: string | null = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token: string = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        let body: { lat: number; lng: number; action: string };
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
        const { lat, lng, action } = body;
        if (typeof lat !== 'number' || typeof lng !== 'number' || typeof action !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
        }
        const location: Location = { lat, lng };

        // Ensure game exists
        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (!game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        if (action === 'test-assignment') {
            return await handleTestAssignment({ gameId, decoded, prisma, NextResponse });
        }

        if (action === 'create-test-clue-set') {
            return await handleCreateTestClueSet({ gameId, location, prisma, NextResponse });
        }

        if (action === 'list-clue-sets') {
            return await handleListClueSets({ gameId, prisma, NextResponse });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: unknown) {
        let message = 'Internal server error';
        let details = '';
        if (error instanceof Error) {
            message = error.message;
            details = error.stack || '';
            // Log only non-OpenAI key errors to avoid leaking config
            if (!message.includes('OpenAI API key')) {
                console.error('Error in clue set test:', error);
            }
        } else {
            console.error('Unknown error in clue set test:', error);
        }
        // If OpenAI key/config error, return 500 with clear message
        if (message.includes('OpenAI API key')) {
            return NextResponse.json({ error: message }, { status: 500 });
        }
        return NextResponse.json({ error: message, details }, { status: 500 });
    }
}
