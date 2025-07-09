"use client";

import { useState } from "react";
import Link from "next/link";
import Dashboard from "./Dashboard";

export default function DashboardWrapper() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div id="dashooard-wrapper" className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Main content area */}
      <div className="flex flex-1 min-h-0 w-full mx-auto py-4" style={{ height: `100vh` }}>
        {/* Side Navigation */}
        <aside
          className={`
            shadow-lg flex flex-col
            rounded-lg z-50 left-0
            transition-all duration-300
            fixed
            ${menuOpen ? "w-64" : "w-16"}
            h-full
            py-6
          `}
          style={{
            background: "var(--color-dodge-blue)",
            left: 0,
            top: 0,
            cursor: !menuOpen ? "pointer" : "default", // pointer when closed
          }}
          onClick={
            !menuOpen
              ? (e) => {
                  // Only expand if not clicking a link or button
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
          <div className={`flex items-center justify-between w-full px-2 mb-6`}>
            {/* Logo and text, aligned with nav items */}
            <div className={`flex items-center gap-2 ${menuOpen ? "pl-0" : "justify-center w-full"}`}>
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-500">
                {/* X logo (SVG or text) */}
                <span className="text-xl font-black text-white">X</span>
              </span>
              <span className={`text-white font-extrabold text-lg tracking-wide select-none transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>
                XMPHONIC.
              </span>
            </div>
            {/* Toggle button: only show when expanded */}
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
          {/* Hamburger Icon and nav in a vertical flex, aligned */}
          <nav className={`flex flex-col gap-4 w-full ${menuOpen ? "items-start px-2" : "items-center"}`}>
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 text-white hover:underline font-medium px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
              onClick={() => setMenuOpen(false)}
            >
              <span aria-hidden="true">🏠</span>
              <span className={`transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>Dashboard</span>
            </Link>
            <a
              href="#scavenger-status"
              className={`flex items-center gap-2 text-white hover:underline px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
              onClick={() => setMenuOpen(false)}
            >
              <span aria-hidden="true">🔎</span>
              <span className={`transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>Scavenger Status</span>
            </a>
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
        <main className={`flex-1 min-h-0 flex transition-all duration-300 mr-2 ${!menuOpen ? "ml-18" : ""}`}>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md p-8 min-h-full w-full border-l-4 border-gray-300 dark:border-gray-700">
            <Dashboard />
          </div>
        </main>
      </div>
    </div>
  );
}