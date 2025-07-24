"use client";
import PirateMapLoader from '@/components/PirateMapLoader';
import { useParams, useRouter } from "next/navigation";


import { useEffect, useState } from "react";





export default function GameAccess() {
    const params = useParams();
    const router = useRouter();
    const gameId = params.gameId as string;
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [backgroundWorkDone, setBackgroundWorkDone] = useState(false);

    // 1. Fetch user, game, and progress info on mount (background work)
    useEffect(() => {
        let isMounted = true;
        const fetchInitialData = async () => {
            try {
                const token = sessionStorage.getItem("token");
                if (!token) return;
                await fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } });
                await fetch("/api/games", { headers: { Authorization: `Bearer ${token}` } });
                await fetch(`/api/games/${gameId}/progress`, { headers: { Authorization: `Bearer ${token}` } });
            } catch { }
            if (isMounted) setBackgroundWorkDone(true);
        };
        fetchInitialData();
        return () => { isMounted = false; };
    }, [gameId]);

    // 2. Get user geolocation once on mount (background work)
    useEffect(() => {
        if (!coords && typeof window !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const userLat = pos.coords.latitude;
                    const userLng = pos.coords.longitude;
                    if (userLat === 0 && userLng === 0) {
                        setCoords(null);
                        return;
                    }
                    setCoords({ lat: userLat, lng: userLng });
                },
                () => {
                    setCoords(null);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        }
    }, [coords]);

    // 3. Fetch clue set and clues when coords, progress, or gameId changes (background work)
    useEffect(() => {
        const fetchClueSetAndClues = async () => {
            if (!coords) return;
            try {
                const token = sessionStorage.getItem("token");
                if (!token) return;
                await fetch(`/api/games/${gameId}/clue-sets`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ lat: coords.lat, lng: coords.lng, action: "test-assignment" })
                });
                // Optionally: fetch clues as well
            } catch { }
        };
        fetchClueSetAndClues();
    }, [coords, gameId]);




    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (backgroundWorkDone) {
            timeout = setTimeout(() => {
                router.push(`/games/${gameId}/play`);
            }, 3000);
        }
        return () => { if (timeout) clearTimeout(timeout); };
    }, [backgroundWorkDone, gameId, router]);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
            <PirateMapLoader
                onComplete={() => { }}
                duration={3000}
            />
        </div>
    );
}
