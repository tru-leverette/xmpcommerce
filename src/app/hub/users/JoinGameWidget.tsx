"use client";

import { useState, useEffect } from "react";
import { StepProgress } from "../../../components/progressions/StepProgression";
import { create } from "zustand";
import { Game } from "../../../types/game";

// Zustand store for games
type GameStore = {
  games: Game[];
  setGames: (games: Game[]) => void;
};

const useGameStore = create<GameStore>((set) => ({
  games: [],
  setGames: (games) => set({ games }),
}));

// Step components
function Step1({ selectedGame, setSelectedGame }: { selectedGame: string; setSelectedGame: (location: string) => void }) {
  const [loading, setLoading] = useState(true);
  const games = useGameStore((state) => state.games);
  const setGames = useGameStore((state) => state.setGames);

  useEffect(() => {
    if (games.length === 0) {
      setLoading(true);
      fetch("/api/admin/games/retrieve")
        .then((res) => res.json())
        .then((data) => {
          setGames(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <span className="text-4xl mb-2 drop-shadow">✅</span>
      {loading ? (
        <div className="mt-4 text-blue-700">Loading games...</div>
      ) : (
        <select
          className="mt-4 w-full max-w-xs rounded border border-blue-300 px-4 py-2 text-gray-800 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value)}
        >
          <option value="" disabled>
            Select a game...
          </option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.location}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
type CountryAPIResponse = {
  name: { common: string };
};

function Step2({
  selectedGame,
  selectedCountry,
  setSelectedCountry,
}: {
  selectedGame: string;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
}) {
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const games = useGameStore((state) => state.games);

  useEffect(() => {
    if (!selectedGame || games.length === 0) return;

    setLoading(true);
    fetch(
      `https://restcountries.com/v3.1/region/${encodeURIComponent(
        games.find((g) => g.id == Number(selectedGame))?.location.toLowerCase() || ""
      )}`
    )
      .then((res) => res.json())
      .then((data: CountryAPIResponse[]) => {
        setCountries(data.map((c) => c.name.common).sort());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedGame, games]);

  return (
    <div className="flex flex-col items-center w-full">
      <span className="text-4xl mb-2 drop-shadow">🏳️</span>
      {loading ? (
        <div className="mt-4 text-blue-700">Loading countries...</div>
      ) : (
        <select
          className="mt-4 w-full max-w-xs rounded border border-blue-300 px-4 py-2 text-gray-800 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={selectedCountry}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCountry(e.target.value)}
        >
          <option value="" disabled>
            Select a country...
          </option>
          {countries.map((country: string) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
function Step3({
  selectedSubregion,
  setSelectedSubregion,
}: {
  selectedSubregion: string;
  setSelectedSubregion: (subregion: string) => void;
}) {
  return (
    <div className="flex flex-col items-center w-full">
      <span className="text-4xl mb-2 drop-shadow">🌍</span>
      <p className="text-lg text-gray-800 dark:text-gray-100 text-center font-medium">
        Enter your City/Province.
      </p>
      <input
        type="text"
        className="mt-4 w-full max-w-xs rounded border border-blue-300 px-4 py-2 text-gray-800 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={selectedSubregion}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedSubregion(e.target.value)}
        placeholder="Type a subregion..."
      />
    </div>
  );
}
function Step4() {
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl mb-2 drop-shadow">🎉</span>
      <p className="text-lg text-gray-800 dark:text-gray-100 text-center font-medium">
        Final confirmation! Ready to play?
      </p>
    </div>
  );
}

export default function JoinGameWidget() {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedSubregion, setSelectedSubregion] = useState<string>(""); // <-- New state for subregion
  const userId = localStorage.getItem("userId");

  // Remove Step5 from stepNames
  const stepNames = ["Select A Game", "Country", "Location", "Final"];

  const handleFinish = async () => {
    // Replace with your actual userId logic (e.g. from session)
    const gameId = Number(selectedGame);

    try {
      await fetch("/api/participant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          gameId,
          participantStatus: "PENDING",
        }),
      });
      setModalOpen(false);
      setStep(0);
    } catch (error) {
      void error
      alert("Failed to join the game. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center ">
      <div id="join-game" className="rounded-3xl shadow-2xl p-10 flex flex-col items-center w-full max-w-md border border-blue-300 dark:border-gray-700 backdrop-blur-md bg-opacity-80 bg-gradient-to-br from-blue-900 via-indigo-800 to-sky-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <span className="text-3xl font-extrabold mb-2 text-white tracking-wide drop-shadow-lg">
          🎮 Join a Game
        </span>
        <p className="text-base text-blue-100 dark:text-gray-300 mb-6 text-center font-medium">
          Ready for adventure? Click below to join the next available game!
        </p>
        <button
          className="px-10 py-3 bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold rounded-full shadow-lg hover:from-cyan-500 hover:to-blue-700 transition text-lg tracking-wide border-2 border-blue-400"
          type="button"
          onClick={() => setModalOpen(true)}
        >
          JOIN GAME
        </button>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(23, 37, 84, 0.65)", backdropFilter: "blur(4px)" }}>
            <div
              id="step-container"
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg relative border border-blue-200 dark:border-gray-700"
              role="dialog"
              aria-modal="true"
            >
              {/* Header */}
              <div
                id="step-container-header"
                className="flex items-center justify-between mb-4 px-4 py-3 rounded-t-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-700"
              >
                <span className="text-xl font-bold text-white tracking-wide">
                  {stepNames[step]}
                </span>
                <button
                  className="text-white hover:text-cyan-200 text-2xl font-bold"
                  onClick={() => {
                    setModalOpen(false);
                    setStep(0); // <-- Reset to first step when closing with X
                  }}
                  aria-label="Close"
                  type="button"
                >
                  &times;
                </button>
              </div>
              {/* Stepper */}
              <StepProgress steps={stepNames} currentStep={step} />
              {/* Content */}
              <div className="flex flex-col justify-start items-center p-4">
                {step === 0 ? (
                  <Step1 selectedGame={selectedGame} setSelectedGame={setSelectedGame} />
                ) : step === 1 ? (
                  <Step2 selectedGame={selectedGame} selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry} />
                ) : step === 2 ? (
                  <Step3
                    selectedSubregion={selectedSubregion}
                    setSelectedSubregion={setSelectedSubregion}
                  />
                ) : (
                  <Step4 />
                )}
              </div>
              {/* Footer */}
              <div className="flex justify-between items-center m-6">
                <button
                  className={`px-6 py-2 rounded-full font-semibold shadow transition
                    bg-gray-200 text-gray-700 hover:bg-gray-300
                    ${step === 0 ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                  onClick={() => {
                    if (step > 0) setStep(step - 1);
                  }}
                  disabled={step === 0}
                  type="button"
                >
                  Back
                </button>
                <button
                  className={`px-6 py-2 rounded-full font-semibold shadow transition
                    ${step < stepNames.length - 1
                      ? "bg-gradient-to-r from-cyan-500 to-blue-700 text-white hover:from-cyan-600 hover:to-blue-800"
                      : "bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700"}
                    ${(step === 0 && !selectedGame) || (step === 1 && !selectedCountry) || (step === 2 && !selectedSubregion) ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                  onClick={async () => {
                    if (step < stepNames.length - 1) {
                      setStep(step + 1);
                    } else {
                      await handleFinish();
                    }
                  }}
                  disabled={(step === 0 && !selectedGame) || (step === 1 && !selectedCountry) || (step === 2 && !selectedSubregion)}
                  type="button"
                >
                  {step < stepNames.length - 1 ? "Next" : "Finish"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Animation keyframes */}
        <style jsx>{`
          .animate-fade-in {
            animation: fadeInModal 0.2s;
          }
          @keyframes fadeInModal {
            from { opacity: 0; transform: scale(0.96);}
            to { opacity: 1; transform: scale(1);}
          }
        `}</style>
      </div>
    </div>
  );
}