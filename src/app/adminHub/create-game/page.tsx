"use client";
import React, { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

const continents = [
  "Africa",
  "Antarctica",
  "Asia",
  "Australia",
  "Europe",
  "North America",
  "South America",
];

export default function CreateGamePage(): React.JSX.Element {
  const [location, setLocation] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/games/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location }),
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: "Game created!", type: "success" });
        setTimeout(() => {
          router.push("/adminHub");
        }, 5000);
      } else {
        setToast({ message: data.error || "Failed to create game.", type: "error" });
      }
    } catch (err) {
      void err
      setToast({ message: "Failed to create game.", type: "error" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-blue-900">Create New Game</h1>
        <form onSubmit={handleSubmit}>
          <select
            className="w-full mb-4 px-4 py-2 border rounded"
            required
            value={location}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setLocation(e.target.value)}
          >
            <option value="">Select Location</option>
            {continents.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition"
            disabled={!location}
          >
            Create Game
          </button>
        </form>
        <button
          type="button"
          className="mt-4 w-full bg-gray-200 text-blue-900 py-2 rounded hover:bg-gray-300 transition"
          onClick={() => router.push("/adminHub")}
        >
          &larr; Back to Admin Panel
        </button>
        {toast && (
          <div
            className={`mt-6 px-4 py-3 rounded text-center font-semibold ${
              toast.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {toast.message}
            {toast.type === "success" && (
              <div className="text-xs mt-2 text-gray-500">
                Redirecting to Admin Panel in 5 seconds...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}