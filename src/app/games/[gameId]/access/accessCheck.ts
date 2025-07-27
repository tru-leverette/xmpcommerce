import { Game } from './accessTypes';


// Utility to get user coordinates using browser geolocation
export const getUserCoordinates = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const userLat = pos.coords.latitude;
                const userLng = pos.coords.longitude;
                if (userLat === 0 && userLng === 0) {
                    resolve(null);
                    return;
                }
                resolve({ lat: userLat, lng: userLng });
            },
            () => {
                resolve(null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    });
};


export const getGame = async (gameId: string): Promise<Game | null> => {
    const token = sessionStorage.getItem('token');
    const gameRes = await fetch(`/api/games/${gameId}`, { headers: { Authorization: `Bearer ${token}` } });
    let gameData: Game | null = null;
    if (gameRes.ok) {
        const data = await gameRes.json();
        gameData = data.game || data;
    }

    return gameData;
}