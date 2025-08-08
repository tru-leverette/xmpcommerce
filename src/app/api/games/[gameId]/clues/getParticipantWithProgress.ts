
import { prisma } from '@/lib/prisma';

export async function getParticipantWithProgress(userId: string, gameId: string) {
    return prisma.participant.findFirst({
        where: { userId, gameId },
        include: {
            progress: {
                include: {
                    stage: {
                        include: {
                            hunts: {
                                include: {
                                    clues: {
                                        orderBy: { clueNumber: 'asc' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            clueSet: true
        }
    });
}