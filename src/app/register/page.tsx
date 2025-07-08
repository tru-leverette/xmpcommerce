"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";

export default function RegisterPage() {
  const {
    loading,
    message,
    success,
    reset,
  } = useUserStore();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
    country: "",
  });
  const [error, setError] = useState("");


  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear previous error
    if (form.password !== form.password2) {
      setError("Passwords do not match."); 
      return;
    }
    try {
      await useUserStore.getState().addUser(form, () => {
        router.push("/register/success");
        setTimeout(() => {
          reset();
        }, 2000); // Reset after navigation and delay
      });
    } catch (err) {
      setError("Registration failed. Please try again.");
      console.error("Registration error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black p-8">
      {/* Loading Modal */}
      {loading && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            success ? "bg-green-200 bg-opacity-80" : "bg-black bg-opacity-40"
          }`}
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg px-8 py-6 flex flex-col items-center">
            {!success ? (
              // Spinner while registering
              <>
                <svg
                  className="animate-spin h-8 w-8 mb-4 text-black dark:text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                <span className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  Registering...
                </span>
              </>
            ) : (
              // Animated checkmark on success
              <>
                <svg
                  className="h-16 w-16 mb-4 text-green-600"
                  viewBox="0 0 52 52"
                  fill="none"
                >
                  <circle
                    cx="26"
                    cy="26"
                    r="25"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="opacity-20"
                  />
                  <path
                    d="M14 27l7 7 17-17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: 48,
                      strokeDashoffset: 48,
                      animation: "checkmark 1s forwards"
                    }}
                  />
                </svg>
                <span className="text-lg font-medium text-green-700 dark:text-green-400">
                  Registration Successful!
                </span>
                <style jsx>{`
                  @keyframes checkmark {
                    to {
                      stroke-dashoffset: 0;
                    }
                  }
                `}</style>
              </>
            )}
          </div>
        </div>
      )}
      <div className="w-full max-w-md bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white" style={{ color: "var(--color-plum)" }}>
          Register User should change
        </h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            className="px-4 py-3 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
            value={form.name}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="px-4 py-3 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
            value={form.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="px-4 py-3 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
            value={form.password}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password2"
            placeholder="Re-type Password"
            className="px-4 py-3 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
            value={form.password2}
            onChange={handleChange}
          />
          <select
            name="country"
            required
            className="px-4 py-3 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            value={form.country}
            onChange={handleChange}
          >
            <option value="" disabled>
              Select Country
            </option>
            {/* Alphabetical, current + top 15 African countries, US disabled */}
            <option value="au">Australia</option>
            <option value="br">Brazil</option>
            <option value="ca">Canada</option>
            <option value="cd">Congo (DRC)</option>
            <option value="cm">Cameroon</option>
            <option value="de">Germany</option>
            <option value="eg">Egypt</option>
            <option value="et">Ethiopia</option>
            <option value="fr">France</option>
            <option value="gh">Ghana</option>
            <option value="in">India</option>
            <option value="jp">Japan</option>
            <option value="ke">Kenya</option>
            <option value="ma">Morocco</option>
            <option value="mg">Madagascar</option>
            <option value="mz">Mozambique</option>
            <option value="ng">Nigeria</option>
            <option value="sd">Sudan</option>
            <option value="tz">Tanzania</option>
            <option value="za">South Africa</option>
            <option value="gb">United Kingdom</option>
            <option value="us" disabled>
              United States (Restricted)
            </option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="bg-black dark:bg-white text-white dark:text-black font-semibold py-3 rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            {loading ? "Registering..." : "Register"}
          </button>
          {message && (
            <div className="text-center text-sm text-red-600 dark:text-red-400 mt-2">{message}</div>
          )}
          {error && (
            <div className="text-center text-sm text-red-600 dark:text-red-400 mt-2">{error}</div>
          )}
        </form>
        <div className="mt-6 text-center">
          <span className="text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
          </span>
          <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Login
          </Link>
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:underline"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}