"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarDropdown, setAvatarDropdown] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserId(window.localStorage.getItem("userId"));
    }
  }, []);

  // Calculate the left margin based on menu state
  const mainMargin = menuOpen ? "ml-64" : "ml-16";

  const handleLogout = async () => {
    // Optionally call your logout API to clear cookies/session
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setAvatarDropdown(false);
      }
    }
    if (avatarDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [avatarDropdown]);

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
            href={`/hub/users/${userId}`}
            className={`flex items-center gap-2 text-white hover:underline font-medium px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
            onClick={() => setMenuOpen(false)}
          >
            <span aria-hidden="true">🏠</span>
            <span className={`transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>Dashboard</span>
          </Link>
          <Link
            href={`/hub/users/${userId}/scavenger-status`}
            className={`flex items-center gap-2 text-white hover:underline px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
            onClick={() => setMenuOpen(false)}
          >
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
            href="/community"
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
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-white hover:underline ml-4"
              type="button"
            >
              Log out
            </button>
            <div
              id="user-avatar"
              className="ml-4 relative"
              ref={avatarRef}
            >
              <Image
                src="/avatars/pirate_treasure.png"
                alt="User Avatar"
                width={32}
                height={32}
                className="rounded-full border border-gray-300 cursor-pointer"
                onClick={() => setAvatarDropdown((v) => !v)}
              />
              {avatarDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-50">
                  <a
                    href="/settings"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setAvatarDropdown(false)}
                  >
                    Settings
                  </a>
                </div>
              )}
            </div>
          </div>
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