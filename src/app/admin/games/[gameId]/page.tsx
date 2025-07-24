"use client";
import ClueSetCluesModal, { Clue } from '@/components/ClueSetCluesModal';
import ProtectedRouteGuard from '@/components/ProtectedRouteGuard';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Level {
    id: string;
    levelNumber: number;
    phase: string;
    stages: Stage[];
}
interface Stage {
    id: string;
    stageNumber: number;
}
interface ClueSet {
    id: string;
    name: string;
    centerLatitude: number;
    centerLongitude: number;
}
interface Game {
    id: string;
    title: string;
    levels: Level[];
    clueSets: ClueSet[];
    participants: { id: string }[];
}

export default function AdminGamePage() {
    const params = useParams();
    const gameId = typeof params.gameId === 'string' ? params.gameId : Array.isArray(params.gameId) ? params.gameId[0] : '';
    const [game, setGame] = useState<Game | null>(null);
    const [phases, setPhases] = useState<string[]>([]);
    const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
    const [levels, setLevels] = useState<Level[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
    const [stages, setStages] = useState<Stage[]>([]);
    const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
    const [clueSets, setClueSets] = useState<ClueSet[]>([]);
    const [selectedClueSet, setSelectedClueSet] = useState<ClueSet | null>(null);
    const [clues, setClues] = useState<Clue[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchGame() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/admin/games/${gameId}`);
                if (!res.ok) throw new Error('Failed to load game');
                const data = await res.json();
                setGame(data.game);
                // Extract unique phases
                const phaseSet = new Set<string>();
                data.game.levels.forEach((lvl: Level) => phaseSet.add(lvl.phase));
                setPhases(Array.from(phaseSet));
            } catch (e) {
                setError((e as Error).message);
            } finally {
                setLoading(false);
            }
        }
        fetchGame();
    }, [gameId]);

    // When phase changes, update levels
    useEffect(() => {
        if (!game || !selectedPhase) {
            setLevels([]);
            setSelectedLevel(null);
            return;
        }
        const filtered = game.levels.filter(lvl => lvl.phase === selectedPhase);
        setLevels(filtered);
        setSelectedLevel(null);
        setStages([]);
        setSelectedStage(null);
        setClueSets([]);
        setSelectedClueSet(null);
    }, [selectedPhase, game]);

    // When level changes, update stages
    useEffect(() => {
        if (!selectedLevel) {
            setStages([]);
            setSelectedStage(null);
            return;
        }
        setStages(selectedLevel.stages);
        setSelectedStage(null);
        setClueSets([]);
        setSelectedClueSet(null);
    }, [selectedLevel]);

    // When stage changes, update clueSets
    useEffect(() => {
        if (!selectedStage || !game) {
            setClueSets([]);
            setSelectedClueSet(null);
            return;
        }
        // Find clueSets for this stage (by location or other logic)
        setClueSets(game.clueSets);
        setSelectedClueSet(null);
    }, [selectedStage, game]);

    // When clueSet selected, fetch clues
    const handleClueSetSelect = async (clueSet: ClueSet) => {
        setSelectedClueSet(clueSet);
        setModalOpen(true);
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/clue-sets/${clueSet.id}/clues`);
            if (!res.ok) throw new Error('Failed to load clues');
            const data = await res.json();
            setClues(data.clues);
        } catch (e) {
            setError((e as Error).message);
            setClues([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRouteGuard requiredRole={['ADMIN', 'SUPERADMIN']}>
            <main className="p-8">
                <nav className="mb-6 text-sm text-gray-600">
                    <Link href="/admin" className="hover:underline">Admin</Link>
                    <span className="mx-2">{'>'}</span>
                    <span className="font-semibold">{game?.title || 'Game'}</span>
                </nav>
                <h1 className="text-2xl font-bold mb-4">{game?.title || 'Game Details'}</h1>
                {error && <div className="text-red-600 mb-4">{error}</div>}
                {loading && <div className="text-gray-500 mb-4">Loading...</div>}
                {/* Progressive dropdowns */}
                <div className="mb-6 space-y-4">
                    <div>
                        <label className="block font-semibold mb-1">Phase</label>
                        <select
                            className="border rounded px-2 py-1"
                            value={selectedPhase || ''}
                            onChange={e => setSelectedPhase(e.target.value || null)}
                        >
                            <option value="">Select phase</option>
                            {phases.map(phase => (
                                <option key={phase} value={phase}>{phase}</option>
                            ))}
                        </select>
                    </div>
                    {levels.length > 0 && (
                        <div>
                            <label className="block font-semibold mb-1">Level</label>
                            <select
                                className="border rounded px-2 py-1"
                                value={selectedLevel?.id || ''}
                                onChange={e => {
                                    const lvl = levels.find(l => l.id === e.target.value);
                                    setSelectedLevel(lvl || null);
                                }}
                            >
                                <option value="">Select level</option>
                                {levels.map(level => (
                                    <option key={level.id} value={level.id}>Level {level.levelNumber}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {stages.length > 0 && (
                        <div>
                            <label className="block font-semibold mb-1">Stage</label>
                            <select
                                className="border rounded px-2 py-1"
                                value={selectedStage?.id || ''}
                                onChange={e => {
                                    const stg = stages.find(s => s.id === e.target.value);
                                    setSelectedStage(stg || null);
                                }}
                            >
                                <option value="">Select stage</option>
                                {stages.map(stage => (
                                    <option key={stage.id} value={stage.id}>Stage {stage.stageNumber}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {clueSets.length > 0 && (
                        <div>
                            <label className="block font-semibold mb-1">Clue Set</label>
                            <select
                                className="border rounded px-2 py-1"
                                value={selectedClueSet?.id || ''}
                                onChange={e => {
                                    const cs = clueSets.find(c => c.id === e.target.value);
                                    if (cs) handleClueSetSelect(cs);
                                }}
                            >
                                <option value="">Select clue set</option>
                                {clueSets.map(cs => (
                                    <option key={cs.id} value={cs.id}>{cs.name} ({cs.centerLatitude}, {cs.centerLongitude})</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <ClueSetCluesModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    clues={clues}
                    clueSetName={selectedClueSet?.name || ''}
                />
            </main>
        </ProtectedRouteGuard>
    );
}