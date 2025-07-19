
"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";


type Game = {
    id: string;
    location: string;
    phase?: string;
    centerLatitude?: number;
    centerLongitude?: number;
    // Add other properties as needed
};

export default function GameAccess() {
    const params = useParams();
    const gameId = params.gameId as string;
    const [userName, setUserName] = useState("");
    const [gameLocation, setGameLocation] = useState("");
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [gameCoords, setGameCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [gamePhase, setGamePhase] = useState<string | undefined>(undefined);
    // For rendering only
    const userContinentText = coords ? getContinent(coords.lat, coords.lng) : "(not available)";
    // Modal state
    const [showModal, setShowModal] = useState(false);
    // Progress type
    type Progress = {
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
        [key: string]: unknown;
    };
    const [progress, setProgress] = useState<Progress | null>(null);

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
                    (pos) => {
                        const userLat = pos.coords.latitude;
                        const userLng = pos.coords.longitude;
                        setCoords({ lat: userLat, lng: userLng });
                    },
                    () => {
                        setCoords(null);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                );
            }
        };
        fetchData();
    }, [gameId]);

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
