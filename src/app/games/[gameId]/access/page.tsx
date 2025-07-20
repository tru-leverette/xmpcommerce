
"use client";
import Link from "next/link";
import { useParams } from "next/navigation";


import { useEffect, useState } from "react";

interface Clue {
    id: string;
    clueNumber: number;
    question: string;
    hint?: string | null;
    type: 'TEXT_ANSWER' | 'PHOTO_UPLOAD' | 'COMBINED';
    huntId: string;
}

interface ClueSet {
    id: string;
    name: string;
    description?: string | null;
    center: { lat: number; lng: number };
    radius: string;
    distance: string;
    created: boolean;
}

interface Progress {
    currentLevel?: number;
    currentStage?: number;
    currentHunt?: string;
    currentClue?: string;
    currentClueNumber?: number;
    isStageCompleted?: boolean;
    isLevelCompleted?: boolean;
    isGameComplete?: boolean;
    stagesCompletedInLevel?: number;
    canAdvanceToNextStage?: boolean;
    canAdvanceToNextLevel?: boolean;
    scavengerStones?: number;
    lastLocation?: string | { lat: number; lng: number };
    completedClues?: unknown[];
    completedHunts?: unknown[];
    completedStages?: unknown[];
    completedLevels?: unknown[];
    badges?: unknown[];
    totalClues?: number;
    totalLevels?: number;
    totalStagesPerLevel?: number;
    totalCluesPerStage?: number;
    startedAt?: string;
    lastPlayedAt?: string;
    completedAt?: string;
}

interface Game {
    id: string;
    location: string;
    phase?: string;
    centerLatitude?: number;
    centerLongitude?: number;
    // Add other properties as needed
}

// Central error configuration
const ERROR_CONFIG: Record<string, string> = {
    LOCATION_REQUIRED: 'This game requires your location. Please enable location sharing in your browser settings and reload the page.',
    NO_CLUES_AVAILABLE: 'No clues are available for your current location. Please wait for clues to be generated for your area, or try a different location.',
    GEOGRAPHIC_RESTRICTION: 'You are not in the correct region for this game. Please check if there are games available in your area.',
    PARTICIPANT_NOT_FOUND: 'You are not registered for this game. Please register to participate.',
    PROGRESS_NOT_FOUND: 'No game progress found. Please contact support or try rejoining the game.',
    CLUE_SET_ASSIGNMENT_FAILED: 'Failed to assign you to a clue set. Please try again or contact support.',
    CLUE_NOT_FOUND: 'Clue not found. Please try another clue or contact support.',
    AUTH_REQUIRED: 'Authentication error. Please log in again.',
    AUTH_INVALID: 'Authentication error. Please log in again.',
    INTERNAL_SERVER_ERROR: 'An internal server error occurred. Please try again later.'
};

export default function GameAccess() {
    const params = useParams();
    const gameId = params.gameId as string;
    const [userName, setUserName] = useState<string>("");
    const [gameLocation, setGameLocation] = useState<string>("");
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [gameCoords, setGameCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [gamePhase, setGamePhase] = useState<string | undefined>(undefined);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [clueSet, setClueSet] = useState<ClueSet | null>(null);
    // Removed unused clueSetCreated state
    const [clues, setClues] = useState<Clue[]>([]);
    const [cluesLoading, setCluesLoading] = useState<boolean>(false);
    const [cluesError, setCluesError] = useState<string | null>(null);
    const userContinentText = coords ? getContinent(coords.lat, coords.lng) : "(not available)";

    // 1. Fetch user, game, and progress info on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
                // User profile
                const userRes = await fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } });
                const userData = await userRes.json();
                setUserName(userData.user?.username || "");
                // Game info
                const gamesRes = await fetch("/api/games", { headers: { Authorization: `Bearer ${token}` } });
                const gamesData = await gamesRes.json();
                const game = gamesData.games?.find((g: Game) => g.id === gameId);
                setGameLocation(game?.location || "");
                setGamePhase(game?.phase);
                if (game?.centerLatitude && game?.centerLongitude) {
                    setGameCoords({ lat: game.centerLatitude, lng: game.centerLongitude });
                } else {
                    setGameCoords(null);
                }
                // Progress
                const progressRes = await fetch(`/api/games/${gameId}/progress`, { headers: { Authorization: `Bearer ${token}` } });
                if (progressRes.ok) {
                    const progressData = await progressRes.json();
                    setProgress(progressData.progress || null);
                } else {
                    setProgress(null);
                }
            } catch {
                setProgress(null);
            }
        };
        fetchInitialData();
    }, [gameId]);

    // 2. Get user geolocation once on mount
    useEffect(() => {
        if (!coords && typeof window !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const userLat = pos.coords.latitude;
                    const userLng = pos.coords.longitude;
                    if (userLat === 0 && userLng === 0) {
                        setGeoError('Your device returned coordinates (0,0). Please ensure location services are enabled and try again.');
                        setCoords(null);
                        return;
                    }
                    setCoords({ lat: userLat, lng: userLng });
                    setGeoError(null);
                },
                (err) => {
                    setCoords(null);
                    if (err.code === 1) {
                        setGeoError('Location permission denied. Please enable location sharing in your browser settings.');
                    } else if (err.code === 2) {
                        setGeoError('Location unavailable. Please check your device settings.');
                    } else if (err.code === 3) {
                        setGeoError('Location request timed out. Please try again.');
                    } else {
                        setGeoError('Failed to get your location.');
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        }
    }, [coords]);

    // 3. Fetch clue set and clues when coords, progress, or gameId changes
    useEffect(() => {
        const fetchClueSetAndClues = async () => {
            if (!coords || !progress?.currentStage) return;
            setCluesLoading(true);
            setCluesError(null);
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error('AUTH_REQUIRED');
                // Fetch clue set
                const clueSetRes = await fetch(`/api/games/${gameId}/clue-sets`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ lat: coords.lat, lng: coords.lng, action: "test-assignment" })
                });
                const clueSetData = await clueSetRes.json();
                if (clueSetData.clueSet) {
                    setClueSet(clueSetData.clueSet);
                    // Fetch clues
                    const stageId = progress.currentStage;
                    const cluesRes = await fetch(`/api/games/${gameId}/clues?clueSetId=${clueSetData.clueSet.id}&stageId=${stageId}&lat=${coords.lat}&lng=${coords.lng}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const cluesData = await cluesRes.json();
                    // Robustly handle both array and single clue object
                    if (cluesRes.ok) {
                        if (Array.isArray(cluesData.clues)) {
                            setClues(cluesData.clues);
                        } else if (cluesData.clue) {
                            setClues([cluesData.clue]);
                        } else {
                            setClues([]);
                            setCluesError(cluesData.error || 'No clues found.');
                        }
                    } else {
                        setClues([]);
                        setCluesError(cluesData.error || 'No clues found.');
                    }
                } else {
                    setClueSet(null);
                    setClues([]);
                    setCluesError(clueSetData.error || 'CLUE_SET_ASSIGNMENT_FAILED');
                }
            } catch (err: unknown) {
                setClueSet(null);
                setClues([]);
                if (typeof err === 'string') setCluesError(err);
                else if (err instanceof Error) setCluesError(err.message);
                else setCluesError('INTERNAL_SERVER_ERROR');
            } finally {
                setCluesLoading(false);
            }
        };
        fetchClueSetAndClues();
    }, [coords, progress?.currentStage, gameId]);

    // Show modal if user's continent does not match game location
    useEffect(() => {
        if (!coords || !gameLocation) return;
        const userContinent = getContinent(coords.lat, coords.lng);
        const logActivity = async (userId: string) => {
            const token = localStorage.getItem("token");
            await fetch("/api/activities", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: "USER_ERROR",
                    description: `User seems lost: continent (${userContinent}) does not match game location (${gameLocation}) for game id (${gameId})`,
                    userId,
                    details: {
                        gameId,
                        userCoords: `${coords.lat}, ${coords.lng}`,
                        userContinent,
                        gameLocation,
                        match: false,
                        indicator: "red-dot"
                    }
                })
            });
        };
        if (userContinent !== gameLocation) {
            // Get userId from local user profile fetch
            const token = localStorage.getItem("token");
            fetch("/api/user/profile", {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(userData => {
                    if (userData.user?.id) {
                        logActivity(userData.user.id);
                    }
                });
            setShowModal(true);
        } else {
            setShowModal(false);
        }
    }, [coords, gameLocation, gameId]);

    // Haversine formula to check if user is within 16.09344km (10 miles) of gameCoords
    function isWithinGameArea(user: { lat: number, lng: number } | null, game: { lat: number, lng: number } | null, radiusKm = 16.09344) {
        if (!user || !game) return false;
        const toRad = (deg: number) => deg * (Math.PI / 180);
        const R = 6371; // Earth radius in km
        const dLat = toRad(game.lat - user.lat);
        const dLng = toRad(game.lng - user.lng);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(user.lat)) * Math.cos(toRad(game.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d <= radiusKm;
    }

    const inGameArea = isWithinGameArea(coords, gameCoords);

    function getContinent(lat: number, lng: number): string {
        if (lat >= -35 && lat <= 37 && lng >= -20 && lng <= 55) return "Africa";
        if (lat >= 15 && lat <= 83 && lng >= -168 && lng <= -52) return "North America";
        if (lat >= 35 && lat <= 71 && lng >= -25 && lng <= 45) return "Europe";
        if (lat >= -10 && lat <= 77 && lng >= 40 && lng <= 180) return "Asia";
        if (lat >= -55 && lat <= -10 && lng >= 110 && lng <= 180) return "Australia";
        if (lat >= -90 && lat <= -60) return "Antarctica";
        if (lat >= -56 && lat <= 12 && lng >= -81 && lng <= -34) return "South America";
        return "Unknown";
    }

    // Compare the user's continent (from coordinates) to the game's location (continent name)
    const userCoordsText = coords ? `${coords.lat}, ${coords.lng}` : "(not available)";
    const userContinent = coords ? getContinent(coords.lat, coords.lng) : "(not available)";
    const gameLocationText = gameLocation || "(not available)";
    const continentMatch = userContinent === gameLocationText;

    return (
        <>
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: 32, borderRadius: 8, minWidth: 300, textAlign: 'center' }}>
                        <h2>You seem to be lost</h2>
                        <p>Your coordinates do not match the expected game location.</p>
                        <Link href="/dashboard">
                            <button style={{ marginTop: 16, padding: '8px 24px', fontSize: 16 }}>Go back to Dashboard</button>
                        </Link>
                    </div>
                </div>
            )}
            <div>
                {clueSet && (
                    <div style={{ marginBottom: 16, padding: 12, border: '1px solid #e0e0e0', borderRadius: 8, background: '#fafbfc' }}>
                        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Clue Set: {clueSet.name}</div>
                        {clueSet.description && <div style={{ fontSize: 14, color: '#555', marginBottom: 4 }}>{clueSet.description}</div>}
                        <div style={{ fontSize: 13, color: '#666' }}>
                            <b>ID:</b> {clueSet.id}<br />
                            <b>Center:</b> ({clueSet.center.lat}, {clueSet.center.lng})<br />
                            <b>Radius:</b> {clueSet.radius}<br />
                            <b>Distance from you:</b> {clueSet.distance}
                        </div>
                        <div style={{ fontSize: 12, color: clueSet.created ? '#388e3c' : '#1976d2', marginTop: 4 }}>
                            {clueSet.created ? 'New clue set created for your location.' : 'Using existing clue set.'}
                        </div>
                    </div>
                )}
                {geoError && <div style={{ color: 'red', marginBottom: 8 }}>{geoError}</div>}
                {cluesLoading && <div>Loading clues...</div>}
                {cluesError && (
                    <div style={{ color: 'red' }}>
                        {ERROR_CONFIG[cluesError] || cluesError}
                    </div>
                )}
                {clues.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                        <b>Clues:</b>
                        <ol style={{ margin: 0, paddingLeft: 20 }}>
                            {clues.map(clue => (
                                <li key={clue.id}>
                                    <b>#{clue.clueNumber}:</b> {clue.question}
                                    {clue.hint && <div style={{ fontStyle: 'italic', color: '#888' }}>Hint: {clue.hint}</div>}
                                    <div style={{ fontSize: 12, color: '#666' }}>Type: {clue.type}</div>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
                {progress && typeof progress === 'object' ? (
                    <div style={{ marginBottom: 12 }}>
                        <b>Progress:</b>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {progress.currentLevel && (
                                <li><b>Current Level:</b> {progress.currentLevel}</li>
                            )}
                            {progress.currentStage && (
                                <li><b>Current Stage:</b> {progress.currentStage}</li>
                            )}
                            {progress.isLevelCompleted !== undefined && (
                                <li><b>Level Completed:</b> {progress.isLevelCompleted ? 'Yes' : 'No'}</li>
                            )}
                            {progress.isStageCompleted !== undefined && (
                                <li><b>Stage Completed:</b> {progress.isStageCompleted ? 'Yes' : 'No'}</li>
                            )}
                            {progress.scavengerStones !== undefined && (
                                <li><b>Scavenger Stones:</b> {String(progress.scavengerStones)}</li>
                            )}
                        </ul>
                    </div>
                ) : null}
                Welcome, <b>{userName}</b>!<br />
                Game location: <b>{gameLocation}</b><br />
                Game phase: <b>{gamePhase ? gamePhase.replace('PHASE_', 'Phase ') : '(not available)'}</b><br />
                Game coordinates: <b>{gameCoords ? `${gameCoords.lat}, ${gameCoords.lng}` : "(not available)"}</b><br />
                Your coordinates: <b>{userCoordsText}</b><br />
                Your continent: <b>{userContinentText}</b><br />
                <span>
                    User continent matches game location: <b style={{ color: continentMatch ? 'green' : 'red' }}>{continentMatch ? 'Yes' : 'No'}</b>
                </span><br />
                {coords && gameCoords && (
                    <span>
                        {inGameArea ? (
                            <span style={{ color: 'green' }}>You are within the game area.</span>
                        ) : (
                            <span style={{ color: 'red' }}>You are NOT within the game area.</span>
                        )}
                    </span>
                )}
            </div>
        </>
    );
}
