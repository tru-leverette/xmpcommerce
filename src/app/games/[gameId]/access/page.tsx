"use client";
import PirateMapLoader from '@/components/PirateMapLoader';
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getGame } from './accessCheck';
import { Game } from './accessTypes';


type Progress = {
    pebbles: number;
    scavengerStones: number;
    currentLevel: number;
    currentStage: string | null;
    isStageCompleted: boolean;
    isLevelCompleted: boolean;
    isGameComplete: boolean;
    canAdvanceToNextStage: boolean;
    canAdvanceToNextLevel: boolean;
    startedAt: string | null;
    lastPlayedAt: string | null;
    completedAt: string | null;
    [key: string]: unknown;
};

export default function GameAccess() {
    const params = useParams();
    const router = useRouter();
    const gameId = params.gameId as string;
    // Use stored participant coordinates from progress
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [eligible, setEligible] = useState<boolean | null>(null);
    const [reasons, setReasons] = useState<string[]>([]);
    // const [progress, setProgress] = useState<Progress | null>(null);
    // const [game, setGame] = useState<Game | null>(null);

    // Fetch user, game, and progress info on mount (and get stored coordinates from progress)
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = sessionStorage.getItem('token');
                if (!token) {
                    reasons.push('You are not logged in.');
                    setEligible(false);
                    setReasons(reasons);
                    setLoading(false);
                    return;
                }

                const gameData: Game | null = await getGame(gameId);
                if (!gameData) {
                    reasons.push('Game not found or inaccessible.');
                }

                // Fetch progress (should include stored coordinates)
                const progressRes = await fetch(`/api/games/${gameId}/progress`, { headers: { Authorization: `Bearer ${token}` } });
                let progressData: Progress | null = null;
                let storedCoords: { lat: number; lng: number } | null = null;
                if (progressRes.ok) {
                    const data = await progressRes.json();
                    progressData = data.progress;
                    // Assume progressData contains stored coordinates (adjust field names as needed)
                    if (progressData && typeof progressData.lat === 'number' && typeof progressData.lng === 'number') {
                        storedCoords = { lat: progressData.lat, lng: progressData.lng };
                    }
                } else {
                    reasons.push('No progress found for this game.');
                }
                // Eligibility checks
                if (gameData && progressData) {
                    if (gameData.status !== 'ACTIVE') reasons.push('This game is not currently active.');
                    if (progressData.isGameComplete) reasons.push('You have already completed this game.');
                }
                if (reasons.length === 0) {
                    setEligible(true);
                } else {
                    setEligible(false);
                }
                // Set stored coordinates for use in clue set assignment
                setCoords(storedCoords);
            } catch {
                reasons.push('An unexpected error occurred.');
                setEligible(false);
            }
            setReasons(reasons);
            setLoading(false);
        };
        fetchData();
    }, [gameId, reasons]);

    // If eligible, assign clue set and navigate to play
    useEffect(() => {
        if (eligible && coords) {
            const assignClueSetAndNavigate = async () => {
                try {
                    const token = sessionStorage.getItem('token');
                    if (!token) return;
                    await fetch(`/api/games/${gameId}/clue-sets`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ lat: coords.lat, lng: coords.lng, action: 'test-assignment' })
                    });
                    setTimeout(() => {
                        router.push(`/games/${gameId}/play`);
                    }, 1000);
                } catch {
                    // Ignore, handled by play page
                }
            };
            assignClueSetAndNavigate();
        }
    }, [eligible, gameId, router, coords]);

    // UI
    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
                <PirateMapLoader onComplete={() => { }} duration={2000} />
            </div>
        );
    }

    if (eligible) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
                <PirateMapLoader onComplete={() => { }} duration={2000} />
            </div>
        );
    }

    // Not eligible: show reasons and debug info
    const debugInfo = {
        gameId,
        tokenPresent: Boolean(sessionStorage.getItem('token')),
        reasons,
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Cannot Start Game</h1>
                <p className="text-gray-700 mb-6">You are not eligible to play this game at this time for the following reason(s):</p>
                <ul className="text-left mb-6 list-disc list-inside">
                    {reasons.map((reason, idx) => (
                        <li key={idx} className="text-red-600">{reason}</li>
                    ))}
                </ul>
                <details className="mb-4 text-xs text-gray-500 bg-gray-100 rounded p-2">
                    <summary>Debug Info</summary>
                    <pre style={{ textAlign: 'left', whiteSpace: 'pre-wrap' }}>{JSON.stringify(debugInfo, null, 2)}</pre>
                </details>
                <button
                    onClick={() => router.push('/games')}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
                >
                    Back to Games
                </button>
            </div>
        </div>
    );
}
