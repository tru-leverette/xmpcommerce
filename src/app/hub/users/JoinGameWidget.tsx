"use client";

import { useState } from "react";

// Step components
function Step1() {
  return <p className="mb-8 text-gray-700 dark:text-gray-200 min-h-[60px] flex items-center">Step 1: Confirm your readiness to join the game.</p>;
}
function Step2() {
  return <p className="mb-8 text-gray-700 dark:text-gray-200 min-h-[60px] flex items-center">Step 2: Choose your character.</p>;
}
function Step3() {
  return <p className="mb-8 text-gray-700 dark:text-gray-200 min-h-[60px] flex items-center">Step 3: Select your starting location.</p>;
}
function Step4() {
  return <p className="mb-8 text-gray-700 dark:text-gray-200 min-h-[60px] flex items-center">Step 4: Review the game rules.</p>;
}
function Step5() {
  return <p className="mb-8 text-gray-700 dark:text-gray-200 min-h-[60px] flex items-center">Step 5: Final confirmation! Ready to play?</p>;
}

const steps = [Step1, Step2, Step3, Step4, Step5];

export default function JoinGameWidget() {
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  const handleNext = () => {
    setAnimating(true);
    setTimeout(() => {
      setStep((prev) => prev + 1);
      setAnimating(false);
    }, 300); // Animation duration
  };

  const handleOpen = () => {
    setStep(0);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setStep(0);
    setAnimating(false);
  };

  const StepComponent = steps[step];

  return (
    <div className="flex justify-center mt-8">
      <div className="bg-gradient-to-br from-blue-500 via-sky-400 to-blue-700 dark:from-gray-800 dark:via-gray-700 dark:to-gray-900 rounded-xl shadow-lg p-8 flex flex-col items-center w-full max-w-md border border-blue-200 dark:border-gray-700">
        <span className="text-2xl font-bold mb-2 text-white tracking-wide drop-shadow">
          🎮 Join a Game
        </span>
        <p className="text-base text-blue-100 dark:text-gray-300 mb-6 text-center">
          Ready for adventure? Click below to join the next available game!
        </p>
        <button
          className="px-8 py-3 bg-white text-blue-700 font-semibold rounded-full shadow hover:bg-blue-100 transition text-lg tracking-wide border-2 border-blue-400"
          type="button"
          onClick={handleOpen}
        >
          JOIN GAME
        </button>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
               style={{ background: "rgba(23, 37, 84, 0.85)" }}>
            <div
              className={`bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 w-full max-w-lg relative animate-fade-in transition-transform duration-300 ease-in-out ${
                animating ? "translate-x-[100vw] opacity-0" : "translate-x-0 opacity-100"
              }`}
            >
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl"
                onClick={handleClose}
                aria-label="Close"
                type="button"
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-200">
                {`Process ${step + 1} of ${steps.length}`}
              </h2>
              <div className="relative min-h-[60px]">
                <StepComponent />
              </div>
              <div className="flex justify-end gap-2">
                {step < steps.length - 1 ? (
                  <button
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    onClick={handleNext}
                    disabled={animating}
                    type="button"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    onClick={handleClose}
                    type="button"
                  >
                    Finish
                  </button>
                )}
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