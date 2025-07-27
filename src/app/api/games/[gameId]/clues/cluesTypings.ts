export // Enhanced geographic restriction check based on game phases
    type GeographicRestrictionResult = {
        isRestricted: boolean;
        reason?: string;
        suggestedAction?: string;
    };

export type Clue = { id: string; clueNumber: number; question: string; hint?: string | null; type: string; huntId: string };

export interface GeneratedHunt {
    id: string;
    name: string;
    description: string | null;
    clues: GeneratedClue[];
    clueSetId?: string | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    stageId?: string;
    huntNumber?: number;
}

interface GeneratedClue {
    id: string;
    clueNumber: number;
    question: string;
    type: string;
    huntId: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    isActive?: boolean;
    hint?: string | null;
    answer?: string | null;
    aiGenerated?: boolean;
    requiredLatitude?: number | null;
    requiredLongitude?: number | null;
    locationRadius?: number | null;
    aiContext?: unknown;
}