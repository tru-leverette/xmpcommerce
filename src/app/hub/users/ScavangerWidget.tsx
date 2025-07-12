"use client";
import React from "react";

export default function ScavangerWidget() {
  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full p-8 rounded-2xl shadow-lg"
      style={{
        background: `linear-gradient(180deg, #ffe9b3 0%, #f7d488 40%, #b8e0e6 100%)`,
        backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "250px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Optional overlay for readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255, 255, 255, 0.55)",
          zIndex: 1,
        }}
      />
      <div className="relative z-10 flex flex-col items-center">
        <span className="text-5xl mb-4 drop-shadow">🏝️</span>
        <p className="text-gray-700 dark:text-gray-200 mb-4 text-center">
          Join the hunt, complete challenges, and collect rewards!
        </p>
        <button
          className="px-6 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold rounded-full shadow hover:from-green-500 hover:to-blue-600 transition"
          type="button"
          onClick={() => alert("Scavenger Hunt coming soon!")}
        >
          Start Hunting
        </button>
      </div>
    </div>
  );
}