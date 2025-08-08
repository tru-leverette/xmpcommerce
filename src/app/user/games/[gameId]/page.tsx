"use client";

import ProtectedRouteGuard from "@/components/ProtectedRouteGuard";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface GameDetail {
    id: string;
    title: string;
    description: string;
    status: string;
    phase?: string;
    scavengerStones: number;
    joinedAt: string;
    participantCount: number;
    group?: {
        id: string;
        name: string;
        members: { id: string; username: string }[];
    } | null;
    badges: {
        id: string;
        name: string;
        description: string;
        imageUrl: string;
        earnedAt: string;
    }[];
    progress: {
        currentLevel: number;
        currentStage: number;
        currentHunt: number;
        currentClue: number;
        isCompleted: boolean;
    }[];
}

export default function UserGameDetailPage() {
    const params = useParams();
    const { gameId } = params as { gameId: string };
    const [game, setGame] = useState<GameDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGameDetail = async () => {
            try {
                const token = sessionStorage.getItem("token");
                if (!token) {
                    setLoading(false);
                    return;
                }
                const response = await fetch(`/api/user/games/${gameId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setGame(data.game);
                }
            } catch (error) {
                console.error('Error fetching users game details:', error)
            } finally {
                setLoading(false);
            }
        };
        fetchGameDetail();
    }, [gameId]);

    if (loading) {
        return (
            <ProtectedRouteGuard>
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading game details...</p>
                    </div>
                </div>
            </ProtectedRouteGuard>
        );
    }

    if (!game) {
        return (
            <ProtectedRouteGuard>
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                    <div className="text-center">
                        <p className="text-gray-600">Game not found or you are not a participant.</p>
                        <Link href="/dashboard" className="text-blue-600 hover:text-blue-500 font-medium mt-4 inline-block">Back to Dashboard</Link>
                    </div>
                </div>
            </ProtectedRouteGuard>
        );
    }

    // Find the latest progress (by highest level, then stage, then hunt, then clue)
    let latestProgress: typeof game.progress[0] | null = null;
    if (game.progress.length > 0) {
        latestProgress = game.progress.reduce((latest, curr) => {
            if (!latest) return curr;
            if (curr.currentLevel > latest.currentLevel) return curr;
            if (curr.currentLevel === latest.currentLevel && curr.currentStage > latest.currentStage) return curr;
            if (curr.currentLevel === latest.currentLevel && curr.currentStage === latest.currentStage && curr.currentHunt > latest.currentHunt) return curr;
            if (curr.currentLevel === latest.currentLevel && curr.currentStage === latest.currentStage && curr.currentHunt === latest.currentHunt && curr.currentClue > latest.currentClue) return curr;
            return latest;
        }, game.progress[0]);
    }
    return (
        <ProtectedRouteGuard>
            <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-green-100 to-blue-100 relative overflow-hidden">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 relative z-10">
                    <nav aria-label="Breadcrumb" className="mb-4">
                        <ol className="flex items-center space-x-2 text-sm text-brown-700">
                            <li>
                                <Link href="/dashboard" className="hover:underline flex items-center gap-1">
                                    <span className="text-lg">📋</span> Dashboard
                                </Link>
                            </li>
                            <li>
                                <span className="mx-2 text-brown-400">/</span>
                            </li>
                            <li className="font-bold text-brown-900 flex items-center gap-1">
                                <span className="text-lg">🗺️</span> {game.title}
                            </li>
                        </ol>
                    </nav>
                    <div className="flex items-center gap-4 mb-6">
                        <span className="inline-block bg-yellow-300 rounded-full p-3 shadow-lg text-3xl">🗺️</span>
                        <h1 className="text-4xl font-extrabold text-brown-900 tracking-tight drop-shadow-lg">{game.title}</h1>
                        <Link
                            href={game.status === 'ACTIVE' ? `/games/${game.id}/access` : '#'}
                            className={`inline-flex items-center gap-2 px-6 py-3 font-extrabold rounded-lg shadow-lg text-lg transition-transform ${game.status === 'ACTIVE' ? 'bg-gradient-to-r from-yellow-400 to-green-400 text-brown-900 hover:scale-105 hover:from-yellow-300 hover:to-green-300' : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60 pointer-events-none'}`}
                            aria-disabled={game.status !== 'ACTIVE'}
                            tabIndex={game.status === 'ACTIVE' ? 0 : -1}
                        >
                            <span>Continue Game</span>
                            <span className="text-2xl">🧭</span>
                        </Link>
                    </div>
                    <p className="text-lg text-brown-800 mb-6 italic border-l-4 border-yellow-400 pl-4 bg-yellow-50 rounded">{game.description}</p>
                    <div className="flex flex-wrap gap-4 mb-8">
                        <span className="px-4 py-2 bg-blue-200 text-blue-900 rounded-full text-base font-bold shadow">Status: {game.status}</span>
                        {game.phase && <span className="px-4 py-2 bg-green-200 text-green-900 rounded-full text-base font-bold shadow">Phase: {game.phase.replace("PHASE_", "Phase ")}</span>}
                        <span className="px-4 py-2 bg-yellow-200 text-yellow-900 rounded-full text-base font-bold shadow">💎 {game.scavengerStones} stones</span>
                        <span className="px-4 py-2 bg-gray-200 text-gray-900 rounded-full text-base font-bold shadow">Joined: {new Date(game.joinedAt).toLocaleDateString()}</span>
                        <span className="px-4 py-2 bg-indigo-200 text-indigo-900 rounded-full text-base font-bold shadow">👥 {game.participantCount} participants</span>
                    </div>
                    {game.group && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-brown-900 mb-2 flex items-center gap-2">🏴‍☠️ Your Crew</h2>
                            <div className="bg-white/80 rounded-lg shadow p-4 border-2 border-yellow-200">
                                <div className="font-semibold text-brown-800 mb-2">{game.group.name}</div>
                                <div className="flex flex-wrap gap-2">
                                    {game.group.members.map((member) => (
                                        <span key={member.id} className="px-3 py-1 bg-yellow-100 border border-yellow-300 rounded text-sm text-brown-700 font-semibold shadow">{member.username}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-brown-900 mb-2 flex items-center gap-2">🧩 Current Progress</h2>
                        {latestProgress ? (
                            <div className="bg-white/80 rounded-lg shadow p-4 border-2 border-green-200">
                                <span className="text-lg">🧭</span>
                                <span>Level <b>{latestProgress.currentLevel}</b>, Stage <b>{latestProgress.currentStage}</b>, Hunt <b>{latestProgress.currentHunt}</b>, Clue <b>{latestProgress.currentClue}</b> {latestProgress.isCompleted && <span className="text-green-600 font-bold">(Completed)</span>}</span>
                            </div>
                        ) : (
                            <p className="text-gray-500">No progress yet. Your adventure awaits!</p>
                        )}
                        {/* Optionally, show history below */}
                        {game.progress.length > 1 && (
                            <div className="mt-4">
                                <h3 className="text-lg font-bold text-brown-800 mb-2">Progress History</h3>
                                <ul className="list-none pl-0 text-brown-800 space-y-2">
                                    {game.progress.map((prog, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <span className="text-lg">🧭</span>
                                            <span>Level <b>{prog.currentLevel}</b>, Stage <b>{prog.currentStage}</b>, Hunt <b>{prog.currentHunt}</b>, Clue <b>{prog.currentClue}</b> {prog.isCompleted && <span className="text-green-600 font-bold">(Completed)</span>}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-brown-900 mb-2 flex items-center gap-2">🏆 Badges & Treasures</h2>
                        {game.badges.length === 0 ? (
                            <p className="text-gray-500">No badges earned in this game yet. Seek out hidden treasures!</p>
                        ) : (
                            <div className="flex flex-wrap gap-6">
                                {game.badges.map((badge: {
                                    id: string;
                                    name: string;
                                    description: string;
                                    imageUrl: string;
                                    badgeType?: 'STAGE' | 'LEVEL';
                                    levelNumber?: number;
                                    stageNumber?: number | null;
                                    earnedAt: string;
                                }) => {
                                    let badgeImg = badge.imageUrl;
                                    if (!badgeImg || badgeImg === '') {
                                        if (badge.badgeType === 'LEVEL' && badge.levelNumber) {
                                            badgeImg = `/assets/badges/level${badge.levelNumber}_platinum.png`;
                                        } else if (badge.badgeType === 'STAGE' && badge.levelNumber) {
                                            badgeImg = `/assets/badges/level${badge.levelNumber}_stage${badge.stageNumber ?? 1}.png`;
                                        }
                                    }
                                    return (
                                        <div key={badge.id} className="flex items-center space-x-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg shadow p-3">
                                            <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center border-2 border-yellow-400">
                                                {badgeImg ? (
                                                    <Image src={badgeImg} alt={badge.name} width={40} height={40} className="w-10 h-10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                ) : (
                                                    <span className="text-yellow-600 text-2xl">🏆</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-brown-900">{badge.name}</div>
                                                <div className="text-sm text-brown-700">{badge.description}</div>
                                                <div className="text-xs text-gray-500">Earned {new Date(badge.earnedAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="mt-10 flex justify-between items-center">
                        <span className="text-brown-700 italic text-sm">Happy hunting, adventurer!</span>
                    </div>
                </div>
            </div>
        </ProtectedRouteGuard>
    );
}
