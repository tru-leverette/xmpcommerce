"use client";

import { useState, useRef, useEffect, ReactNode, MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HubLayout({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [showNavText, setShowNavText] = useState<boolean>(false);
  const [avatarDropdown, setAvatarDropdown] = useState<boolean>(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setUserId(window.localStorage.getItem("userId"));
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (menuOpen) {
      timeout = setTimeout(() => setShowNavText(true), 300);
    } else {
      setShowNavText(false);
    }
    return () => clearTimeout(timeout);
  }, [menuOpen]);

  const mainMargin = menuOpen ? "ml-64" : "ml-20";

  const handleLogout = async (): Promise<void> => {
    await fetch("/api/auth/logout", { method: "POST" }); // This should clear cookies server-side
    window.localStorage.clear();
    router.push("/");
  };

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
    <div id="hub-wrapper" className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-blue-200 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex">
      {/* Sidebar */}
      <aside
        className={`
          shadow-2xl flex flex-col
          z-50 left-0
          transition-all duration-300
          fixed
          ${menuOpen ? "w-64" : "w-20"}
          h-full
          py-0
          bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
        `}
        style={{
          left: 0,
          top: 0,
          cursor: !menuOpen ? "pointer" : "default",
        }}
        onClick={
          !menuOpen
            ? (e: ReactMouseEvent<HTMLDivElement>) => {
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
        {/* Sidebar header */}
        <div className="flex items-center justify-between w-full px-3 py-4 border-b border-blue-800 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-500 shadow-lg">
              <span className="text-2xl font-black text-white">X</span>
            </span>
            <span className={`text-white font-extrabold text-lg tracking-wide select-none transition-all duration-300 ${menuOpen ? "inline" : "hidden"}`}>
              XMPHONIC.
            </span>
          </div>
          <button
            className="flex flex-col justify-center items-center w-8 h-8 focus:outline-none hover:bg-blue-800 rounded transition"
            aria-label={menuOpen ? "Collapse menu" : "Expand menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span aria-hidden="true">
              {menuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </span>
          </button>
        </div>
        {/* Nav links */}
        <nav className={`flex flex-col gap-2 w-full mt-6 ${menuOpen ? "items-start px-3" : "items-center"}`}>
          {userId && (
            <>
              <Link
                href={`/hub/users/${userId}`}
                className={`flex items-center gap-2 text-white hover:bg-blue-800 font-medium px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
                onClick={() => setMenuOpen(false)}
              >
                <span aria-hidden="true">🏠</span>
                {showNavText && <span className="transition-all duration-300">Dashboard</span>}
              </Link>
              <Link
                href={`/hub/users/${userId}/scavenger`}
                className={`flex items-center gap-2 text-white hover:bg-blue-800 px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`}
                onClick={() => setMenuOpen(false)}
              >
                <span aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path stroke="currentColor" strokeWidth="2" d="M16 8l-4 8-4-8 8 4-8-4z"/>
                  </svg>
                </span>
                {showNavText && <span className="transition-all duration-300">Scavenger</span>}
              </Link>
            </>
          )}
          {/* Static links */}
          <a href="#my-group" className={`flex items-center gap-2 text-white hover:bg-blue-800 px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`} onClick={() => setMenuOpen(false)}>
            <span aria-hidden="true">👥</span>
            {showNavText && <span>My Group</span>}
          </a>
          <a href="#badges-roles" className={`flex items-center gap-2 text-white hover:bg-blue-800 px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`} onClick={() => setMenuOpen(false)}>
            <span aria-hidden="true">🎖️</span>
            {showNavText && <span>Badges and Roles</span>}
          </a>
          <a href="#access-unlocks" className={`flex items-center gap-2 text-white hover:bg-blue-800 px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`} onClick={() => setMenuOpen(false)}>
            <span aria-hidden="true">🔓</span>
            {showNavText && <span>Access Unlocks</span>}
          </a>
          <a href="#merit-tracker" className={`flex items-center gap-2 text-white hover:bg-blue-800 px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`} onClick={() => setMenuOpen(false)}>
            <span aria-hidden="true">📈</span>
            {showNavText && <span>Merit Tracker</span>}
          </a>
          <a href="#territory-board" className={`flex items-center gap-2 text-white hover:bg-blue-800 px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`} onClick={() => setMenuOpen(false)}>
            <span aria-hidden="true">🗺️</span>
            {showNavText && <span>Territory Board</span>}
          </a>
          <a href="/community" className={`flex items-center gap-2 text-white hover:bg-blue-800 px-2 py-2 rounded transition-all duration-300 w-full ${menuOpen ? "justify-start" : "justify-center"}`} onClick={() => setMenuOpen(false)}>
            <span aria-hidden="true">🌐</span>
            {showNavText && <span>Community</span>}
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
      {/* Main content area */}
      <div className={`flex flex-col transition-all duration-300 ${mainMargin} min-h-screen w-full`}>
        {/* Header */}
        <header
          className="w-full flex items-center justify-between px-8 py-4 bg-white/80 dark:bg-gray-900/80 shadow-md sticky top-0 z-40"
          style={{
            minHeight: "64px",
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ width: 120 }} />
          <span className="text-2xl font-bold text-blue-900 dark:text-white mx-auto tracking-wide drop-shadow">Participant</span>
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-blue-700 dark:text-white hover:underline ml-4"
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
                width={36}
                height={36}
                className="rounded-full border-2 border-blue-300 dark:border-gray-700 cursor-pointer shadow"
                onClick={() => setAvatarDropdown((v: boolean) => !v)}
              />
              {avatarDropdown && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50">
                  <a
                    href="/settings"
                    className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setAvatarDropdown(false)}
                  >
                    Settings
                  </a>
                  {(typeof window !== "undefined" && (localStorage.getItem("role") === "ADMIN" || localStorage.getItem("role") === "SUPERADMIN")) && (
                    <a
                      href="/adminHub"
                      className="block px-4 py-2 text-blue-700 dark:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold"
                      onClick={() => setAvatarDropdown(false)}
                    >
                      Admin Panel
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col pt-2">
          <div className="bg-white/90 dark:bg-gray-900/90 rounded-lg shadow-md p-8 min-h-full w-full border-l-4 border-blue-200 dark:border-gray-700 mt-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}