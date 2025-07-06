"use client";

import { useState } from "react";
import Link from "next/link";
import Dashboard from "./Dashboard";

export default function DashboardWrapper() {
  const [menuOpen, setMenuOpen] = useState(true);

  return (
    <div id="dashooard-wrapper" className="min-h-screen bg-white dark:bg-black p-0 flex flex-col">
      {/* Menu Header */}
      <header className="w-full mb-8">
        <nav className="flex justify-between items-center py-4 px-8 bg-gray-100 dark:bg-gray-800 shadow">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
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
              className="hidden md:inline text-gray-700 dark:text-gray-200 hover:underline font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className="hidden md:inline text-gray-700 dark:text-gray-200 hover:underline font-medium"
            >
              Home
            </Link>
          </div>
        </nav>
      </header>
      <div className="flex flex-1 w-full max-w-5xl mx-auto px-4">
        {/* Side Navigation */}
        <aside
          className={`
            fixed top-0 left-0 h-full z-40 bg-gray-100 dark:bg-gray-800 shadow-lg p-6 flex flex-col gap-4 w-64
            transform transition-transform duration-300
            ${menuOpen ? "translate-x-0" : "-translate-x-full"}
            md:static md:translate-x-0 md:w-48 md:mr-8 md:rounded-lg md:shadow md:p-6 md:h-auto
            md:flex md:flex-col md:gap-4
            h-full
          `}
          style={{ minHeight: "calc(100vh - 2rem)" }} // ensures full height on desktop
        >
          <div className="flex items-center justify-between mb-6 md:hidden">
            <span className="text-lg font-bold text-gray-900 dark:text-white">Menu</span>
            <button
              className="w-8 h-8 flex items-center justify-center"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              <span className="block w-6 h-0.5 bg-gray-700 dark:bg-gray-200 rotate-45 absolute"></span>
              <span className="block w-6 h-0.5 bg-gray-700 dark:bg-gray-200 -rotate-45"></span>
            </button>
          </div>
          <Link
            href="/dashboard"
            className="text-gray-800 dark:text-gray-100 hover:underline font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Overview
          </Link>
          <a
            href="#profile"
            className="text-gray-700 dark:text-gray-300 hover:underline"
            onClick={() => setMenuOpen(false)}
          >
            Profile
          </a>
          <a
            href="#settings"
            className="text-gray-700 dark:text-gray-300 hover:underline"
            onClick={() => setMenuOpen(false)}
          >
            Settings
          </a>
        </aside>
        {/* Overlay for mobile menu */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <main className="flex-1">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md p-8 min-h-full">
            <Dashboard />
          </div>
        </main>
      </div>
      <div className="flex justify-center items-center py-4">
        <span className="text-gray-600 dark:text-gray-400"> Have an account? </span>
        <Link
          href="/register"
          className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          Sign up
        </Link>
      </div>
      <p>Easy to get started!</p>
      <span> All set!</span>
    </div>
  );
}