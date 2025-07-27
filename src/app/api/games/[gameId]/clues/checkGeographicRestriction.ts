import { GeographicRestrictionResult } from './cluesTypings';

export async function checkGeographicRestriction(
    userLocation: { lat: number; lng: number },
    gameLocation: string
): Promise<GeographicRestrictionResult> {
    const continents: Record<string, { latMin: number; latMax: number; lngMin: number; lngMax: number }> = {
        'Africa': { latMin: -35, latMax: 37, lngMin: -20, lngMax: 55 },
        'North America': { latMin: 15, latMax: 83, lngMin: -168, lngMax: -52 },
        'Europe': { latMin: 35, latMax: 71, lngMin: -25, lngMax: 45 },
        'Asia': { latMin: -10, latMax: 77, lngMin: 40, lngMax: 180 },
    };
    const gameContinent = continents[gameLocation as keyof typeof continents];
    if (!gameContinent) return { isRestricted: false };
    const isOnCorrectContinent = userLocation.lat >= gameContinent.latMin &&
        userLocation.lat <= gameContinent.latMax &&
        userLocation.lng >= gameContinent.lngMin &&
        userLocation.lng <= gameContinent.lngMax;
    if (!isOnCorrectContinent) {
        return {
            isRestricted: true,
            reason: `This game is designed for players in ${gameLocation}. You appear to be on a different continent.`,
            suggestedAction: 'Please check if there are games available in your region.'
        };
    }
    return { isRestricted: false };
}
