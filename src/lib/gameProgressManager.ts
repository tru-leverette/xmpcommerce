import { prisma } from './prisma';

export type GameProgressData = {
    phase: string;
    levelId?: string;
    stageId?: string;
};

export async function getGameProgress(gameId: string): Promise<GameProgressData | null> {
    const progress = await prisma.gameProgress.findUnique({ where: { gameId } });
    if (!progress) return null;
    return {
        phase: progress.phase,
        levelId: progress.levelId ?? undefined,
        stageId: progress.stageId ?? undefined,
    };
}

export async function setGameProgress(gameId: string, data: GameProgressData): Promise<void> {
    await prisma.gameProgress.upsert({
        where: { gameId },
        update: { phase: data.phase, levelId: data.levelId, stageId: data.stageId },
        create: { gameId, phase: data.phase, levelId: data.levelId, stageId: data.stageId }
    });
}