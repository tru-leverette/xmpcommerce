
import { ClueType, Phase, PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const prisma = new PrismaClient();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set.');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface GenerateCluesRequest {
    latitude: number;
    longitude: number;
    phase: Phase;
    level: number;
    stage: number;
    gameId: string;
    mainTarget?: string;
    theme?: string;
}

interface AIClue {
    question: string;
    answer: string;
    hint?: string;
    type: ClueType;
}

type DifficultyText = 'Easy' | 'Intermediate' | 'Hard' | 'Difficult';
const phaseToDifficulty: Record<Phase, DifficultyText> = {
    PHASE_1: 'Easy',
    PHASE_2: 'Intermediate',
    PHASE_3: 'Hard',
    PHASE_4: 'Difficult',
};

async function generateAIClues(
    latitude: number,
    longitude: number,
    difficulty: DifficultyText,
    mainTarget?: string,
    theme?: string,
    numClues: number = 2
): Promise<AIClue[]> {
    const prompt = `Generate ${numClues} scavenger hunt clues and answers as a logical progression, where each clue leads to the next, culminating in a final goal. The clues must be connected, with each clue's answer or location providing the context or access for the next clue. The final clue should lead to the ultimate goal or location.

Parameters:
- Difficulty Level: ${difficulty}
- Main Target: ${mainTarget || "(infer based on difficulty and theme)"}
- Theme: ${theme || "(select based on prior narrative)"}

Requirements:
1. The clues must form a chain: each clue should logically lead to the next, and the final clue should reveal or require the ultimate goal.
2. Each clue must include a clear, concise, and unambiguous answer in the 'answer' field. Do not leave the answer blank or vague.
3. Each clue should be logically solvable, with subtle hints that encourage deduction.
4. Clues should reflect the selected theme and target (or inferred ones) while maintaining narrative continuity and progression.
5. Difficulty should influence complexity of clue structure—higher levels include layered metaphors, wordplay, or symbolic references.
6. Output only a JSON array, no explanations or extra text. Each clue must have: question, answer, (optional) hint, and type.

Example of a progressive clue chain:
[
  {"question": "Go to the restaurant downtown known for its deep-dish pizza and take a selfie outside.", "answer": "Photo at Giordano's restaurant", "type": "PHOTO_UPLOAD"},
  {"question": "Now, visit the golf course where Chicago's famous baseball player relaxes. Take a selfie in the lobby.", "answer": "Photo at Harborside International Golf Center lobby", "type": "PHOTO_UPLOAD"},
  {"question": "Finally, find the parking space number 22 at Wrigley Field and take a selfie there.", "answer": "Photo at parking space 22, Wrigley Field", "type": "PHOTO_UPLOAD"}
]

Respond in JSON array format, e.g.:
[
  {"question": "...", "answer": "...", "hint": "...", "type": "TEXT_ANSWER"},
  {"question": "...", "answer": "...", "type": "PHOTO_UPLOAD"}
]
`;
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
    let clues: AIClue[] = [];
    try {
        clues = JSON.parse(content);
    } catch {
        throw new Error('Failed to parse AI response as JSON: ' + content);
    }
    // Validate and sanitize clues
    if (!Array.isArray(clues) || clues.length === 0) {
        throw new Error('No clues returned from AI');
    }
    const validatedClues = clues.map((clue, idx) => {

        if (
            typeof clue.question !== 'string' ||
            typeof clue.answer !== 'string' ||
            clue.question.trim().length <= 1 ||
            clue.answer.trim().length <= 1
        ) {
            throw new Error(`Clue or answer missing, invalid, or too short at index ${idx}`);
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

export async function POST(req: NextRequest) {
    try {
        console.log('POST /api/clues/generate called');
        const body = (await req.json()) as GenerateCluesRequest;
        const { latitude, longitude, phase, level, stage, gameId } = body;

        if (
            typeof latitude !== 'number' ||
            typeof longitude !== 'number' ||
            !phase ||
            typeof level !== 'number' ||
            typeof stage !== 'number' ||
            !gameId
        ) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // Generate clues using AI (no fallback)
        const difficulty = phaseToDifficulty[phase];

        let aiClues: AIClue[];
        try {
            aiClues = await generateAIClues(
                latitude,
                longitude,
                difficulty,
                body.mainTarget,
                body.theme,
                2
            );
            console.log('AI clues generated:');
            aiClues.forEach((clue, idx) => {
                console.log(`Clue #${idx + 1}:`, JSON.stringify(clue, null, 2));
            });
        } catch (error) {
            console.error('AI clue generation error:', error);
            return NextResponse.json({ error: 'Sorry we were unable to create your hunt, please try again.' }, { status: 500 });
        }


        // Find the participant for this user and game
        // (Assume userId is available from session or request context, e.g. req.headers)
        const authHeader = req.headers.get('authorization');
        let userId: string | null = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                userId = payload.userId;
            } catch { }
        }

        let clueSet = null;
        if (userId) {
            // Try to use the participant's assigned clueSet for this game
            const participant = await prisma.participant.findFirst({
                where: { userId, gameId },
                select: { clueSetId: true }
            });
            if (participant?.clueSetId) {
                clueSet = await prisma.clueSet.findUnique({ where: { id: participant.clueSetId } });
            }
        }
        // If not found, look for any clueSet for this game/phase/level/stage
        if (!clueSet) {
            clueSet = await prisma.clueSet.findFirst({
                where: {
                    gameId,
                    phase,
                    levelNumber: level,
                    stageNumber: stage,
                    isActive: true,
                },
            });
        }
        // Only create a new clueSet if truly none exists for this game/phase/level/stage
        if (!clueSet) {
            clueSet = await prisma.clueSet.create({
                data: {
                    name: `ClueSet_${gameId}_${phase}_${level}_${stage}`,
                    centerLatitude: latitude,
                    centerLongitude: longitude,
                    radiusKm: 3, // Default for early levels, adjust as needed
                    minLatitude: latitude - 0.027,
                    maxLatitude: latitude + 0.027,
                    minLongitude: longitude - 0.027,
                    maxLongitude: longitude + 0.027,
                    gameId,
                    phase,
                    levelNumber: level,
                    stageNumber: stage,
                },
            });
        }

        // Create a new hunt for this stage/level if not exists
        let hunt = await prisma.hunt.findFirst({
            where: {
                stage: {
                    level: {
                        gameId,
                        levelNumber: level,
                    },
                    stageNumber: stage,
                },
                clueSetId: clueSet.id,
            },
        });

        if (!hunt) {
            // Find the stage
            const stageObj = await prisma.stage.findFirst({
                where: {
                    level: {
                        gameId,
                        levelNumber: level,
                    },
                    stageNumber: stage,
                },
            });
            if (!stageObj) {
                return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
            }
            hunt = await prisma.hunt.create({
                data: {
                    huntNumber: 1, // You may want to increment or set appropriately
                    name: `Hunt_${level}_${stage}`,
                    stageId: stageObj.id,
                    clueSetId: clueSet.id,
                },
            });
        }

        // Store clues in the database before returning
        const createdClues = await Promise.all(
            aiClues.map(async (clue, idx) => {
                console.log(`Saving clue #${idx + 1} to DB:`, JSON.stringify(clue, null, 2));
                return prisma.clue.create({
                    data: {
                        clueNumber: idx + 1,
                        question: clue.question,
                        answer: clue.answer,
                        hint: clue.hint,
                        type: clue.type,
                        isActive: true,
                        aiGenerated: true,
                        requiredLatitude: latitude,
                        requiredLongitude: longitude,
                        locationRadius: clue.type === 'PHOTO_UPLOAD' ? 0.1 : 0.05,
                        huntId: hunt!.id,
                    },
                });
            })
        );
        return NextResponse.json({ clues: createdClues }, { status: 201 });
    } catch (error) {
        console.error('Clue generation error:', error);
        return NextResponse.json({ error: 'Sorry we were unable to create your hunt, please try again.' }, { status: 500 });
    }
}
