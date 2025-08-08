"use client";

import PirateMapLoader from "@/components/PirateMapLoader";
import { showToast } from "@/lib/toast";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Badge {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  badgeType: string;
  levelNumber?: number;
  stageNumber?: number | null;
}

interface Clue {
  id: string;
  clueNumber: number;
  question: string;
  hint?: string;
  type: "TEXT_ANSWER" | "PHOTO_UPLOAD" | "COMBINED";
  huntId: string;
}

interface Submission {
  id: string;
  isCorrect: boolean;
  aiAnalysis: string;
}

export default function PlayGame() {

  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;

  const [showPirateMap, setShowPirateMap] = useState(true);
  const [currentClue, setCurrentClue] = useState<Clue | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);
  // const [currentClueNumber, setCurrentClueNumber] = useState(1); // unused
  const [totalClues, setTotalClues] = useState(4);
  const [gameComplete, setGameComplete] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const [awardedStageBadge, setAwardedStageBadge] = useState<Badge | null>(null);
  const [awardedLevelBadge, setAwardedLevelBadge] = useState<Badge | null>(null);
  const [showStageComplete, setShowStageComplete] = useState(false);
  // const [redirected, setRedirected] = useState(false); // unused
  const [currentStageId, setCurrentStageId] = useState<string | null>(null);
  const [checkedCompletion, setCheckedCompletion] = useState(false);

  // Fetch the current clue and progress
  const fetchClue = useCallback(async () => {
    setLoading(true);
    setGameError(null);

    try {

      if (!location) {

        // Wait for location to be available
        setGameError("Location is required to start the hunt. Please enable location and try again.");
        setShowPirateMap(false);
        setLoading(false);
        return;
      }

      const token = sessionStorage.getItem("token");
      const url = `/api/games/${gameId}/clues?lat=${location.lat}&lng=${location.lng}`;
      const res = await fetch(url, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });


      if (!res.ok) {
        const errorText = await res.text();
        if (res.status === 404) {
          setGameError(
            "No clues are available for this game. Please make sure you are registered and the game has started. If you believe this is a mistake, contact support."
          );
          setCheckedCompletion(true);
          setCurrentClue(null);
          setShowPirateMap(false);
          return;
        }
        throw new Error(errorText || "Failed to fetch clue");
      }
      const data = await res.json();
      // Debug log: print the full backend response

      console.log('[DEBUG] Clue API response:', data);
      setCurrentClue(data.clue);
      setTotalClues(data.totalClues);
      setCurrentStageId(data.stageId || null);
      setGameComplete(data.gameComplete || false);
      setCheckedCompletion(true);
      setShowPirateMap(false);
      setAwardedStageBadge(null);
      setAwardedLevelBadge(null);
      setShowStageComplete(false);
    } catch {
      setGameError(
        "Unable to load your clue at this time. Please try again later, or contact support if the problem persists."
      );
      setShowPirateMap(false);
    } finally {
      setLoading(false);
    }
  }, [gameId, location]);

  // Request geolocation
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast.error("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        showToast.error((err as GeolocationPositionError)?.message || "Geolocation error");
        setLocation(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Submit answer
  const submitAnswer = useCallback(async () => {
    if (!currentClue || !location) return;
    setSubmitting(true);
    setLastSubmission(null);
    try {
      const token = sessionStorage.getItem("token");
      const body: Record<string, unknown> = {
        clueId: currentClue.id,
        location: { lat: location.lat, lng: location.lng },
        submissionType: currentClue.type,
        textAnswer: textAnswer,
      };
      // File upload not supported in this endpoint; add if backend supports multipart
      const res = await fetch(`/api/games/${gameId}/clues`, {
        method: "POST",
        body: JSON.stringify(body),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        let errorMsg = "Failed to submit answer";
        try {
          const errJson = await res.json();
          errorMsg = errJson.error || errJson.message || errorMsg;
        } catch {
          // fallback to status text
          errorMsg = res.statusText || errorMsg;
        }
        showToast.error(errorMsg);
        return;
      }
      const data = await res.json();
      setLastSubmission(data.submission);
      if (data.submission.isCorrect) {
        if (data.successRedirectUrl) {
          // Navigate to the clue-success page immediately
          router.push(data.successRedirectUrl);
          return;
        }
        // If stage badge is awarded, show stage complete UI
        if (data.awardedStageBadge) {
          setAwardedStageBadge(data.awardedStageBadge);
          setShowStageComplete(true);
        }
        // If level badge is awarded, show game complete UI
        if (data.awardedLevelBadge) {
          setAwardedLevelBadge(data.awardedLevelBadge);
          setGameComplete(true);
        }
        // If nextStageId and nextClueNumber, advance to next stage/clue after showing badge
        if (data.nextStageId && data.nextClueNumber) {
          setTimeout(() => {
            setShowStageComplete(false);
            setAwardedStageBadge(null);
            setTextAnswer("");
            setSelectedFile(null);
            setLastSubmission(null);
            fetchClue();
          }, 3500);
        } else if (!data.awardedStageBadge && !data.awardedLevelBadge) {
          // Normal clue progression
          setTimeout(() => {
            setTextAnswer("");
            setSelectedFile(null);
            setLastSubmission(null);
            fetchClue();
          }, 3000);
        }
      }
    } catch (err: unknown) {
      showToast.error((err as Error)?.message || "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }, [currentClue, location, textAnswer, gameId, fetchClue, router]);


  // Request geolocation on mount
  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // Fetch clue only after location is set
  useEffect(() => {
    if (location) {
      fetchClue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, gameId]);

  if (showPirateMap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PirateMapLoader onComplete={() => { }} />
      </div>
    );
  }

  if (!checkedCompletion) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clue...</p>
        </div>
      </div>
    );
  }

  if (showStageComplete && awardedStageBadge) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="max-w-xl w-full mx-auto text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-center mb-4">
              <Image
                src={awardedStageBadge.imageUrl}
                alt={awardedStageBadge.name}
                width={96}
                height={96}
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Stage Complete!</h1>
            <p className="text-lg text-gray-700 mb-4">
              {awardedStageBadge.description}
            </p>
            <div className="flex justify-center mb-4">
              <svg width="80" height="80" fill="none" viewBox="0 0 80 80" aria-hidden="true">
                <circle cx="40" cy="40" r="38" stroke="#FBBF24" strokeWidth="4" fill="#FEF3C7" />
                <path d="M25 50 Q40 65 55 50" stroke="#F59E42" strokeWidth="3" fill="none" />
                <circle cx="32" cy="38" r="4" fill="#F59E42" />
                <circle cx="48" cy="38" r="4" fill="#F59E42" />
              </svg>
            </div>
            <p className="text-gray-600 mb-6">
              Get ready for the next stage!
            </p>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameComplete && awardedLevelBadge) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="max-w-xl w-full mx-auto text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-center mb-4">
              <Image
                src={awardedLevelBadge.imageUrl}
                alt={awardedLevelBadge.name}
                width={96}
                height={96}
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Level Complete!</h1>
            <p className="text-lg text-gray-700 mb-4">
              {awardedLevelBadge.description}
            </p>
            <div className="flex justify-center mb-4">
              <svg width="80" height="80" fill="none" viewBox="0 0 80 80" aria-hidden="true">
                <circle cx="40" cy="40" r="38" stroke="#FBBF24" strokeWidth="4" fill="#FEF3C7" />
                <path d="M25 50 Q40 65 55 50" stroke="#F59E42" strokeWidth="3" fill="none" />
                <circle cx="32" cy="38" r="4" fill="#F59E42" />
                <circle cx="48" cy="38" r="4" fill="#F59E42" />
              </svg>
            </div>
            <p className="text-gray-600 mb-6">
              Congratulations! You have completed all stages in this level.
            </p>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameError) {
    if (
      (gameError.toLowerCase().includes("permission") ||
        gameError.toLowerCase().includes("not allowed")) &&
      gameComplete
    ) {
      let levelNumber = 1;
      if (currentStageId) {
        const match = currentStageId.match(/level(\d+)/i);
        if (match && match[1]) {
          levelNumber = parseInt(match[1], 10);
        }
      }
      const badgeImg = `/assets/badges/level${levelNumber}_platinum.png`;
      return (
        <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 flex items-center justify-center">
          <div className="max-w-xl w-full mx-auto text-center">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex justify-center mb-4">
                <Image
                  src={badgeImg}
                  alt={`Level ${levelNumber} Platinum Badge`}
                  width={96}
                  height={96}
                  className="w-24 h-24 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                  priority
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Stage Complete!</h1>
              <p className="text-lg text-gray-700 mb-4">
                You&apos;ve completed this stage and found all {totalClues} clues. <br />
                <span className="font-semibold">The next stage is not yet available.</span>
              </p>
              <div className="flex justify-center mb-4">
                <svg width="80" height="80" fill="none" viewBox="0 0 80 80" aria-hidden="true">
                  <circle cx="40" cy="40" r="38" stroke="#FBBF24" strokeWidth="4" fill="#FEF3C7" />
                  <path d="M25 50 Q40 65 55 50" stroke="#F59E42" strokeWidth="3" fill="none" />
                  <circle cx="32" cy="38" r="4" fill="#F59E42" />
                  <circle cx="48" cy="38" r="4" fill="#F59E42" />
                </svg>
              </div>
              <p className="text-gray-600 mb-6">
                Please check back soon for the next adventure. We&apos;ll notify you when the next hunt is unlocked!
              </p>
              <button
                onClick={() => (window.location.href = "/dashboard")}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 border border-red-300 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-red-800 mb-4">Game Loading Error</h2>
            <p className="text-red-700 mb-4">{gameError}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setGameError(null);
                  setLoading(true);
                  setShowPirateMap(true);
                  setCurrentClue(null);
                }}
                className="bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 w-full"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/games")}
                className="bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 w-full"
              >
                Back to Games
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentClue && checkedCompletion && !gameError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No clues available</h2>
          <p className="text-gray-600">Please check back later, or ensure you are registered and the game is started.</p>
        </div>
      </div>
    );
  }

  if (!currentClue) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Scavenger Hunt</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Clue {currentClue.clueNumber} of {totalClues}
              </span>
              <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Progress: {Math.round((currentClue.clueNumber / totalClues) * 100)}%
              </div>
              {location ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600">📍 Location detected</span>
                  <button
                    onClick={requestLocation}
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                    title="Refresh location"
                  >
                    🔄 Refresh
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-orange-600">📍 Location needed</span>
                  <button
                    onClick={requestLocation}
                    className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
                    title="Get location"
                  >
                    📍 Get Location
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Clue Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Clue</h2>
            <p className="text-lg text-gray-700 mb-4">{currentClue.question}</p>

            {currentClue.hint && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <p className="text-sm text-blue-700">
                  <strong>Hint:</strong> {currentClue.hint}
                </p>
              </div>
            )}

            {/* Answer Input */}
            <div className="space-y-4">
              {(currentClue.type === "TEXT_ANSWER" || currentClue.type === "COMBINED") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer
                  </label>
                  <input
                    type="text"
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your answer..."
                  />
                </div>
              )}

              {(currentClue.type === "PHOTO_UPLOAD" || currentClue.type === "COMBINED") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {selectedFile && (
                    <p className="text-sm text-green-600 mt-2">✓ {selectedFile.name}</p>
                  )}
                </div>
              )}

              <button
                onClick={submitAnswer}
                disabled={submitting || !location}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Answer"}
              </button>
            </div>
          </div>

          {/* Submission Result */}
          {lastSubmission && (
            <div
              className={`rounded-xl shadow-lg p-6 ${lastSubmission.isCorrect
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
                }`}
            >
              <div className="flex items-center mb-4">
                <span
                  className={`text-2xl mr-3 ${lastSubmission.isCorrect ? "text-green-600" : "text-red-600"}`}
                >
                  {lastSubmission.isCorrect ? "✅" : "❌"}
                </span>
                <h3
                  className={`text-lg font-semibold ${lastSubmission.isCorrect ? "text-green-800" : "text-red-800"}`}
                >
                  {lastSubmission.isCorrect ? "Correct!" : "Try Again!"}
                </h3>
              </div>

              <p className={`mb-4 ${lastSubmission.isCorrect ? "text-green-700" : "text-red-700"}`}>
                {lastSubmission.aiAnalysis}
              </p>

              {lastSubmission.isCorrect && (
                <p className="text-green-600 text-sm mt-4">Moving to next clue in 3 seconds...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  // End of PlayGame component
}
