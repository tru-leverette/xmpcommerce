"use client";

import React, { useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
// import { useRouter } from "next/navigation";
import type { LoginResponse } from "@/types/auth";

export default function LoginForm(): React.JSX.Element {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  // const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res: Response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });
      const data: LoginResponse = await res.json();
      if (data.success && data.user) {
        window.localStorage.setItem("userId", data.user.userId);
        window.localStorage.setItem("role", data.user.role);
        window.location.href = `/hub/users/${data.user.userId}`;
      } else {
        setError(data.error || "Login failed.");
      }
    } catch (err: unknown) {
      void err;
      setError("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black p-8">
      <div className="w-full max-w-md bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white" style={{ color: "var(--color-plum)" }}>
          Login
        </h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="px-4 py-3 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            disabled={loading}
            aria-label="Email"
          />
          <input
            type="password"
            placeholder="Password"
            className="px-4 py-3 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            disabled={loading}
            aria-label="Password"
          />
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className="bg-black dark:bg-white text-white dark:text-black font-semibold py-3 rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <span className="text-gray-600 dark:text-gray-400">
            Do not have an account?{" "}
          </span>
          <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
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