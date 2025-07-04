import Image from "next/image";
import Link from "next/link"; // Add this import

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={120}
          height={25}
          priority
        />
        <h1 className="text-5xl font-bold text-center text-red-600 mb-4">404</h1>
        <p className="text-xl text-center mb-2">
          Oops! The page you are looking for does not exist.
        </p>
        <p className="text-center text-gray-500 mb-6">
          It looks like you&apos;ve reached a page that doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-base h-12 px-5 w-full sm:w-auto md:w-[158px]"
        >
          Go back home
        </Link>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Next.js
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/vercel.svg"
            alt="Vercel icon"
            width={16}
            height={16}
          />
          Vercel
        </a>
      </footer>
    </div>
  );
}
