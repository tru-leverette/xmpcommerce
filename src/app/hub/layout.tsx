"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // Calculate the left margin based on menu state
  const mainMargin = menuOpen ? "ml-64" : "ml-16";


  const handleLogout = async () => {
    // Optionally call your logout API to clear cookies/session
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <div id="participant-hub-wrapper" className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Sidebar */}
      <aside
        className={`
          shadow-lg flex flex-col
          z-50 left-0
          transition-all duration-300
          fixed
          ${menuOpen ? "w-64" : "w-16"}
          h-full
          py-0
        `}
        style={{
          background: "var(--color-dodge-blue)",
          left: 0,
          top: 0,
          cursor: !menuOpen ? "pointer" : "default",
        }}
        onClick={
          !menuOpen
            ? (e) => {
                if (
                  e.target instanceof HTMLElement &&
                  !e.target.closest("a") &&
                  !e.target.closest("button")
                ) {
                  setMenuOpen(true);
                }
              }
            : undefined
        }
      >
        {/* Header with logo and toggle */}
        <div className={`flex items-center justify-between w-full px-2`} style={{ minHeight: "56px" }}>
          <div className={`flex items-center gap-2 ${menuOpen ? "pl-0" : "justify-center w-full"}`}>
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-500">
              <span className="text-xl font-black text-white">X</span>
            </span>
            <span className={`text-white font-extrabold text-lg tracking-wide select-none transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>
              XMPHONIC.
            </span>
          </div>
          {menuOpen && (
            <button
              className="flex flex-col justify-center items-center w-8 h-8 focus:outline-none"
              aria-label="Collapse menu"
              onClick={() => setMenuOpen(false)}
            >
              <span aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </span>
            </button>
          )}
        </div>
        {/* Separator line */}
        <div className="w-full h-0.5 bg-gray-200 shadow-md mb-4" />
        <nav className={`flex flex-col gap-4 w-full ${menuOpen ? "items-start px-2" : "items-center"}`}>
          <Link
            href="/hub"
            className={`flex items-center gap-2 text-white hover:underline font-medium px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
            onClick={() => setMenuOpen(false)}
          >
            <span aria-hidden="true">🏠</span>
            <span className={`transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>Dashboard</span>
          </Link>
          <Link
            href="/hub/scavenger-status"
            className={`flex items-center gap-2 text-white hover:underline px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
            onClick={() => setMenuOpen(false)}
          >
            {/* Safari/compass icon */}
            <span aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path stroke="currentColor" strokeWidth="2" d="M16 8l-4 8-4-8 8 4-8-4z"/>
              </svg>
            </span>
            <span className={`transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>Scavenger Status</span>
          </Link>
          <a
            href="#my-group"
            className={`flex items-center gap-2 text-white hover:underline px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
            onClick={() => setMenuOpen(false)}
          >
            <span aria-hidden="true">👥</span>
            <span className={`transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>My Group</span>
          </a>
          <a
            href="#badges-roles"
            className={`flex items-center gap-2 text-white hover:underline px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
            onClick={() => setMenuOpen(false)}
          >
            <span aria-hidden="true">🎖️</span>
            <span className={`transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>Badges and Roles</span>
          </a>
          <a
            href="#access-unlocks"
            className={`flex items-center gap-2 text-white hover:underline px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
            onClick={() => setMenuOpen(false)}
          >
            <span aria-hidden="true">🔓</span>
            <span className={`transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>Access Unlocks</span>
          </a>
          <a
            href="#merit-tracker"
            className={`flex items-center gap-2 text-white hover:underline px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
            onClick={() => setMenuOpen(false)}
          >
            <span aria-hidden="true">📈</span>
            <span className={`transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>Merit Tracker</span>
          </a>
          <a
            href="#territory-board"
            className={`flex items-center gap-2 text-white hover:underline px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
            onClick={() => setMenuOpen(false)}
          >
            <span aria-hidden="true">🗺️</span>
            <span className={`transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>Territory Board</span>
          </a>
          <a
            href="#community"
            className={`flex items-center gap-2 text-white hover:underline px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
            onClick={() => setMenuOpen(false)}
          >
            <span aria-hidden="true">🌐</span>
            <span className={`transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>Community</span>
          </a>
        </nav>
      </aside>
      {/* Overlay for mobile menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      {/* Main content area (header + children) */}
      <div className={`flex flex-col transition-all duration-300 ${mainMargin} min-h-screen`}>
        {/* Header */}
        <div
          className="w-full flex items-center justify-between px-8"
          style={{
            minHeight: "56px", // Match the sidebar header height (py-6 on aside = 1.5rem top/bottom)
            background: "var(--color-dodge-blue)",
          }}
        >
          <span className="text-xl font-bold text-white">Participant Hub</span>
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-white hover:underline ml-auto"
          >
            Log out
          </button>
        </div>
        <main className="flex-1 flex flex-col">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md p-8 min-h-full w-full border-l-4 border-gray-300 dark:border-gray-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}