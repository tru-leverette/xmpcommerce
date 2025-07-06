"use client";

import { useState } from "react";
import Link from "next/link";
import Dashboard from "./Dashboard";

export default function DashboardWrapper() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Set header height (must match the header's actual height)
  const HEADER_HEIGHT = 72; // 4 (py-4) + 8 (px-8) + font/line, adjust if needed

  return (
    <div id="dashooard-wrapper" className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Menu Header */}
      <header className="w-full" style={{ height: HEADER_HEIGHT }}>
        <nav className="flex justify-between items-center py-4 px-8 shadow h-full" style={{ color: "var(--color-plum)" }}>
          <span className="text-xl font-bold">
            XMPCommerce
          </span>
          <div className="flex gap-6 items-center">
            {/* Hamburger Icon */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-8 h-8 focus:outline-none"
              aria-label="Open menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="block w-6 h-0.5 bg-gray-700 dark:bg-gray-200 mb-1"></span>
              <span className="block w-6 h-0.5 bg-gray-700 dark:bg-gray-200 mb-1"></span>
              <span className="block w-6 h-0.5 bg-gray-700 dark:bg-gray-200"></span>
            </button>
            <Link
              href="/dashboard"
              className="hidden md:inline hover:underline font-medium"
              style={{ color: "var(--color-plum)" }}
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className="hidden md:inline hover:underline font-medium"
              style={{ color: "var(--color-plum)" }}
            >
              Home
            </Link>
          </div>
        </nav>
      </header>
      {/* Main content area */}
      <div className="flex flex-1 min-h-0 w-full mx-auto py-4" style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
        {/* Side Navigation - always on the left, always full height minus header */}
        <aside
          className={`
            bg-gray-100 dark:bg-gray-800 shadow-lg flex flex-col
            rounded-lg z-50 left-0
            transition-all duration-300
            fixed
            ${menuOpen ? "w-64" : "w-16"}
            h-full
            py-6
            top-[${HEADER_HEIGHT}px]
          `}
          style={{
            left: 0,
            top: HEADER_HEIGHT,
            height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          }}
        >
          {/* Hamburger Icon and nav in a vertical flex, aligned */}
          <nav className={`flex flex-col gap-4 w-full ${menuOpen ? "items-start px-2" : "items-center"}`}>
            <div className={`w-full flex ${menuOpen ? "justify-end" : "justify-center"}`}>
              <button
                className="flex flex-col justify-center items-center w-8 h-8 mb-2 focus:outline-none"
                aria-label={menuOpen ? "Collapse menu" : "Expand menu"}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? (
                  // Left arrow icon when expanded, aligned right
                  <span aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </span>
                ) : (
                  // Hamburger icon when collapsed, centered
                  <>
                    <span className="block w-6 h-0.5 bg-gray-700 dark:bg-gray-200 mb-1"></span>
                    <span className="block w-6 h-0.5 bg-gray-700 dark:bg-gray-200 mb-1"></span>
                    <span className="block w-6 h-0.5 bg-gray-700 dark:bg-gray-200"></span>
                  </>
                )}
              </button>
            </div>
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 text-gray-800 dark:text-gray-100 hover:underline font-medium px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
              onClick={() => setMenuOpen(false)}
            >
              <span aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" stroke="currentColor" fill="none"/>
                  <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" stroke="currentColor" fill="none"/>
                  <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" stroke="currentColor" fill="none"/>
                  <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" stroke="currentColor" fill="none"/>
                </svg>
              </span>
              <span className={`transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>Dashboard</span>
            </Link>
            <a
              href="#profile"
              className={`flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:underline px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
              onClick={() => setMenuOpen(false)}
            >
              <span aria-hidden="true">👤</span>
              <span className={`transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>Profile</span>
            </a>
            <a
              href="#settings"
              className={`flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:underline px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
              onClick={() => setMenuOpen(false)}
            >
              <span aria-hidden="true">⚙️</span>
              <span className={`transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>Settings</span>
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