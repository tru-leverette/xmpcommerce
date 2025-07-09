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
        <Link href="/hub" className="text-blue-500 hover:underline">
          Dashboard
        </Link>
        <Link href="/hub/scavenger-status" className="text-blue-500 hover:underline">
          Scavenger Status
        </Link>
        <Link href="/hub/my-group" className="text-blue-500 hover:underline">
          My Group
        </Link>
        <Link href="/hub/badges-roles" className="text-blue-500 hover:underline">
          Badges and Roles
        </Link>
        <Link href="/hub/access-unlocks" className="text-blue-500 hover:underline">
          Access Unlocks
        </Link>
        <Link href="/hub/merit-tracker" className="text-blue-500 hover:underline">
          Merit Tracker
        </Link>
        <Link href="/hub/territory-board" className="text-blue-500 hover:underline">
          Territory Board
        </Link>
        <Link href="/hub/community" className="text-blue-500 hover:underline">
          Community
        </Link>
      </div>
    </>
  );
}