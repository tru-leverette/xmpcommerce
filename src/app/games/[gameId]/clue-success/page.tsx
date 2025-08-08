"use client";


import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Progress {
  currentLevel: number;
  currentStage: number;
  currentHunt: number;
  currentClue: number;
  stagesCompletedInLevel: number;
  isStageCompleted: boolean;
  isLevelCompleted: boolean;
  totalCluesPerStage: number;
}

export default function ClueSuccessPage() {
  const searchParams = useSearchParams();
  const badgeName = searchParams.get("badgeName") || "Clue Solved!";
  const badgeDescription = searchParams.get("badgeDescription") || "You have successfully solved this clue. Ready for the next one?";
  const badgeImageUrl = searchParams.get("badgeImageUrl") || "/assets/badges/clue_success.png";

  const params = useParams();
  const gameId = params?.gameId as string;
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Track if this is the last clue in the stage (from query param or progress)
  const [isLastClue, setIsLastClue] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchProgress() {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
        const res = await fetch(`/api/games/${gameId}/progress`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch progress");
        const data = await res.json();
        setProgress(data.progress || data);
        // If the query param nextStage is present, this was the last clue in the stage
        const nextStageParam = searchParams.get("nextStage");
        if (nextStageParam === "true") {
          setIsLastClue(true);
        } else if (data.progress && data.progress.currentClue === data.progress.totalCluesPerStage) {
          // Fallback: if currentClue equals totalCluesPerStage, treat as last clue
          setIsLastClue(true);
        } else {
          setIsLastClue(false);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || "Error loading progress");
        } else {
          setError("Error loading progress");
        }
      } finally {
        setLoading(false);
      }
    }
    if (gameId) fetchProgress();

  }, [gameId, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-center mb-4">
            <Image
              src={badgeImageUrl}
              alt={badgeName}
              width={96}
              height={96}
              className="w-24 h-24 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{badgeName}</h1>
          <p className="text-lg text-gray-700 mb-4">{badgeDescription}</p>
          <div className="flex justify-center mb-4">
            <svg width="80" height="80" fill="none" viewBox="0 0 80 80" aria-hidden="true">
              <circle cx="40" cy="40" r="38" stroke="#FBBF24" strokeWidth="4" fill="#FEF3C7" />
              <path d="M25 50 Q40 65 55 50" stroke="#F59E42" strokeWidth="3" fill="none" />
              <circle cx="32" cy="38" r="4" fill="#F59E42" />
              <circle cx="48" cy="38" r="4" fill="#F59E42" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">
            Ready for your next clue?
          </p>
          {/* Progression Display */}
          <div className="mb-6">
            {loading ? (
              <p className="text-blue-600">Loading your progress...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : progress ? (
              <div className="bg-blue-50 rounded-lg p-4 text-left">
                <h2 className="text-lg font-semibold mb-2 text-blue-800">Your Progress</h2>
                <ul className="text-blue-900 text-sm space-y-1">
                  <li>Level: <b>{progress.currentLevel}</b></li>
                  <li>Stage: <b>{progress.currentStage}</b></li>
                  <li>Hunt: <b>{progress.currentHunt}</b></li>
                  <li>Clue: <b>{progress.currentClue}</b></li>
                  <li>Stages Completed in Level: <b>{progress.stagesCompletedInLevel}</b></li>
                  <li>Stage Completed: <b>{progress.isStageCompleted ? "Yes" : "No"}</b></li>
                  <li>Level Completed: <b>{progress.isLevelCompleted ? "Yes" : "No"}</b></li>
                </ul>
              </div>
            ) : null}
          </div>
          <button
            onClick={async () => {
              try {
                const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
                await fetch(`/api/games/${gameId}/progress`, {
                  method: "POST",
                  credentials: "include",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify({ clueNumber: progress?.currentClue, isCorrect: true })
                });
                if (isLastClue) {
                  router.push(`/dashboard`);
                  return;
                }
              } catch {
                // Optionally handle error
              }
              // Default: go to play page
              router.push(window.location.pathname.replace('/clue-success', '/play'));
            }}
            className="bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700"
          >
            {isLastClue ? "Dashboard" : "Search for Next Clue"}
          </button>
        </div>
      </div>
    </div>
  );
}
