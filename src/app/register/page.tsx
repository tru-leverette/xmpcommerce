"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
    country: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    if (form.password !== form.password2) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/register", { // <-- backend URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Registration successful!");
        // Optionally redirect or clear form here
      } else {
        setMessage(data.error || "Registration failed.");
      }
    } catch {
      setMessage("Something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black p-8">
      <div className="w-full max-w-md bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white" style={{ color: "var(--color-plum)" }}>
          Register
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