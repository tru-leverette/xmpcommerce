import Link from "next/link";

export default function Dashboard() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white" style={{ color: "var(--color-plum)" }}>
        User Dashboard
      </h1>
      <p className="text-lg text-center text-gray-700 dark:text-gray-300 mb-8">
        Welcome to your dashboard! Here you can manage your account, view your activity, and update your profile.
      </p>
      <div className="flex flex-col gap-4 items-center">
        <Link
          href="/"
          className="bg-black dark:bg-white text-white dark:text-black font-semibold py-3 px-6 rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          Go to Home
        </Link>
        <Link
          href="/login"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Log out
        </Link>
        </div>
        </>
  )
}