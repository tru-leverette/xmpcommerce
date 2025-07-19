
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

export default function GameAccess() {
    const params = useParams();
    const gameId = params.gameId as string;
    const [userName, setUserName] = useState<string>("");
    const [gameLocation, setGameLocation] = useState<string>("");
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
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

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");
            // Fetch user profile
            const userRes = await fetch("/api/user/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const userData = await userRes.json();
            setUserName(userData.user?.username || "");

            // Fetch game info
            const gamesRes = await fetch("/api/games", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const gamesData = await gamesRes.json();
            const game = gamesData.games?.find((g: Game) => g.id === gameId);
            setGameLocation(game?.location || "");
            setGamePhase(game?.phase);
            if (game?.centerLatitude && game?.centerLongitude) {
                setGameCoords({ lat: game.centerLatitude, lng: game.centerLongitude });
            } else {
                setGameCoords(null);
            }

            // Fetch user progress for this game
            try {
                const progressRes = await fetch(`/api/games/${gameId}/progress`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (progressRes.ok) {
                    const progressData = await progressRes.json();
                    setProgress(progressData.progress || null);
                } else {
                    setProgress(null);
                }
            } catch {
                setProgress(null);
            }

            // Get user coordinates
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        const userLat = pos.coords.latitude;
                        const userLng = pos.coords.longitude;
                        setCoords({ lat: userLat, lng: userLng });
                        // Fetch clue set for this location
                        try {
                            const clueSetRes = await fetch(`/api/games/${gameId}/clue-sets`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                },
                                body: JSON.stringify({ lat: userLat, lng: userLng, action: "test-assignment" })
                            });
                            const clueSetData = await clueSetRes.json();
                            if (clueSetData.clueSet) {
                                setClueSet(clueSetData.clueSet);
                                // Fetch clues for this clueSet and current stage
                                setCluesLoading(true);
                                setCluesError(null);
                                try {
                                    // Use currentStage from progress if available
                                    const stageId = progress?.currentStage;
                                    if (stageId) {
                                        const cluesRes = await fetch(`/api/games/${gameId}/clues?clueSetId=${clueSetData.clueSet.id}&stageId=${stageId}`, {
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        const cluesData = await cluesRes.json();
                                        if (cluesRes.ok && Array.isArray(cluesData.clues)) {
                                            setClues(cluesData.clues);
                                        } else {
                                            setClues([]);
                                            setCluesError(cluesData.error || 'No clues found.');
                                        }
                                    } else {
                                        setClues([]);
                                        setCluesError('No stage information available.');
                                    }
                                } catch {
                                    setClues([]);
                                    setCluesError('Failed to fetch clues.');
                                } finally {
                                    setCluesLoading(false);
                                }
                            } else {
                                setClueSet(null);
                                setClues([]);
                            }
                        } catch {
                            setClueSet(null);
                            setClues([]);
                        }
                    },
                    () => {
                        setCoords(null);
                        setClueSet(null);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                );
            }
        };
        fetchData();
    }, [gameId, progress?.currentStage]);

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
                {cluesLoading && <div>Loading clues...</div>}
                {cluesError && <div style={{ color: 'red' }}>{cluesError}</div>}
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
