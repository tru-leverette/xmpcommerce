"use client";

import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black p-8">
      <div className="w-full max-w-md bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white" style={{ color: "var(--color-plum)" }}>
          Login
        </h1>
        <form className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Name"
            className="px-4 py-3 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="px-4 py-3 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="px-4 py-3 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
          <button
            type="submit"
            className="bg-black dark:bg-white text-white dark:text-black font-semibold py-3 rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Login
          </button>
        </form>
        <div className="mt-6 text-center">
          <span className="text-gray-600 dark:text-gray-400">
            Do not have an account?{" "}
          </span>
          <Link
            href="/register"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Register
          </Link>
        </div>
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}