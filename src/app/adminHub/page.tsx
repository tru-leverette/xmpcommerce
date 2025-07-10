"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Example: Check role from localStorage (replace with real auth in production)
    const role = window.localStorage.getItem("role");
  
    if (role === "ADMIN" || role === "SUPERADMIN") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
      router.replace("/");
    }
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.localStorage.clear();
    router.push("/");
  };

  if (isAdmin === null) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex flex-col items-center py-16">
      <h1 className="text-4xl font-bold text-white mb-8 drop-shadow">Admin Panel</h1>
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4 text-blue-900">Welcome, Admin!</h2>
        <ul className="space-y-4">
          <li>
            {(typeof window !== "undefined" && localStorage.getItem("role") === "SUPERADMIN") && (
              <Link
                href="/adminHub/create-game"
                className="block w-full px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition text-center"
              >
                Create New Game
              </Link>
            )}
          </li>
          <li>
            <button className="w-full px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition">
              Manage Users
            </button>
          </li>
          <li>
            <button className="w-full px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition">
              View All Games
            </button>
          </li>
          {/* Add more admin actions here */}
        </ul>
        <button
          onClick={handleLogout}
          className="mt-8 w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Log out
        </button>
      </div>
    </div>
  );
}