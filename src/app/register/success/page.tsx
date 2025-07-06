"use client";
import Link from "next/link";

export default function RegistrationSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black p-8">
      <div className="w-full max-w-md bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md p-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-green-600 dark:text-green-400" style={{ color: "var(--color-plum)" }}>
          Registration Successful!
        </h1>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Your account has been created. Please check your email for a confirmation link to activate your account.
        </p>
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          If you do not see the email, check your spam or junk folder.
        </p>
        <div className="mt-6">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}