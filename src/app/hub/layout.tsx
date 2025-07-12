"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { useUserStore } from "@/store/useUserStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

type User = {
  userId: string;
  name: string;
  email: string;
  role: string;
  image?: string;
};

export default function HubLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [avatarDropdown, setAvatarDropdown] = useState<boolean>(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setUser(data.user); // for local state if you still need it
          useUserStore.getState().setUser(data.user); // hydrate Zustand
        } else {
          setUser(null);
          useUserStore.getState().clearUser();
        }
      });
  }, []);

  const handleLogout = async (): Promise<void> => {
    await fetch("/api/auth/logout", { method: "POST" });
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

  // --- Mobile Side Nav Overlay ---
  const MobileNav = () => (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-500 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />
      {/* Side Nav */}
      <nav
        className={`fixed top-0 left-0 z-50 bg-gradient-to-b from-blue-900 to-cyan-800 shadow-xl w-64 h-full p-6
        transform transition-transform duration-500 ease-in-out
        ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-10 flex items-center gap-3">
          <span className="text-3xl">🦜</span>
          <span className="text-white text-2xl font-extrabold tracking-wide">XMP</span>
        </div>
        <ul className="flex flex-col gap-4 text-blue-100 font-medium">
          <li className="hover:bg-blue-700 rounded px-3 py-2 transition cursor-pointer">
            <Link href={`/hub/users/${user?.userId ?? ""}`} onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
          </li>
          <li className="hover:bg-blue-700 rounded px-3 py-2 transition cursor-pointer">
            <Link href={`/hub/users/${user?.userId ?? ""}/scavenger`} onClick={() => setMenuOpen(false)}>
              Scavenger Hunt
            </Link>
          </li>
          <li className="hover:bg-blue-700 rounded px-3 py-2 transition cursor-pointer">
            <a href="/community" onClick={() => setMenuOpen(false)}>
              Community
            </a>
          </li>
        </ul>
        <div className="mt-auto pt-10">
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold py-2 rounded-full shadow hover:from-cyan-500 hover:to-blue-700 transition"
          >
            Logout
          </button>
        </div>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-white">
      {/* Hamburger for mobile */}
      <button
        className="sm:hidden fixed top-4 left-4 z-50 bg-blue-900 text-white p-2 rounded-full shadow-lg"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Open navigation"
      >
        <svg width={28} height={28} fill="none" viewBox="0 0 24 24">
          <rect y="4" width="24" height="2" rx="1" fill="currentColor" />
          <rect y="11" width="24" height="2" rx="1" fill="currentColor" />
          <rect y="18" width="24" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>
      {/* Mobile Side Nav */}
      <MobileNav />
      {/* Desktop Side Nav */}
      <nav className="hidden sm:flex w-64 min-h-screen bg-gradient-to-b from-blue-900 to-cyan-800 shadow-xl flex-col px-6 py-8">
        <div className="mb-10 flex items-center gap-3">
          <span className="text-3xl">🦜</span>
          <span className="text-white text-2xl font-extrabold tracking-wide">XMP</span>
        </div>
        <ul className="flex flex-col gap-4 text-blue-100 font-medium">
          <li className="hover:bg-blue-700 rounded px-3 py-2 transition cursor-pointer">
            <Link href={`/hub/users/${user?.userId ?? ""}`}>
              Dashboard
            </Link>
          </li>
          <li className="hover:bg-blue-700 rounded px-3 py-2 transition cursor-pointer">
            <Link href={`/hub/users/${user?.userId ?? ""}/scavenger`}>
              Scavenger Hunt
            </Link>
          </li>
          <li className="hover:bg-blue-700 rounded px-3 py-2 transition cursor-pointer">
            <a href="/community">
              Community
            </a>
          </li>
        </ul>
        <div className="mt-auto pt-10">
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold py-2 rounded-full shadow hover:from-cyan-500 hover:to-blue-700 transition"
          >
            Logout
          </button>
        </div>
      </nav>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="w-full px-4 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-blue-900 to-cyan-800 shadow flex items-center justify-between">
          <h1 id="hub-header" className="text-2xl font-bold text-white tracking-wide w-full text-center sm:text-left">
            Hub
          </h1>
          <div className="flex items-center gap-4">
            <span id="user-name" className="text-white font-medium hidden sm:inline whitespace-nowrap">
              {user?.name ?? "User"}
            </span>
            <div
              id="user-avatar"
              className="ml-4 relative"
              ref={avatarRef}
            >
              <Image
                src={user?.image || "/avatars/pirate_treasure.png"}
                alt="User Avatar"
                width={72}
                height={72}
                className="rounded-full border-2 border-blue-300 dark:border-gray-700 cursor-pointer shadow w-[56px] sm:w-[72px] aspect-square object-cover"
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
                  {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
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
        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8">
          <div className="bg-white/90 dark:bg-gray-900/90  p-8 min-h-full w-full  mt-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}