import Link from "next/link";

export default function TopNav() {
  return (
    <nav
      className="w-full p-4 flex gap-4"
      style={{
        background: "#ede9fe", // lighter purple for nav
      }}
    >
      <Link href="/" style={{ color: "#7c3aed" }}>Home</Link>
      <Link href="/register" style={{ color: "#7c3aed" }}>Register</Link>
      <Link href="/user" style={{ color: "#7c3aed" }}>User</Link>
      {/* Add more links as needed */}
    </nav>
  );
}