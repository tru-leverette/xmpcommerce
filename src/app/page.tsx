"use client";

import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-white dark:bg-black">
      <Image
        className="dark:invert mb-8"
        src="/next.svg"
        alt="Next.js logo"
        width={120}
        height={25}
        priority
      />
      <h1 className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-4">
        Coming Soon
      </h1>
      <p className="text-xl text-center text-gray-600 dark:text-gray-300 mb-8">
        Our site is under construction. Stay tuned for something amazing!
      </p>
      <div className="flex gap-4">
        <a
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-base h-12 px-5"
          href="mailto:info@xmpcommerce.com"
        >
          Contact Us
        </a>
        <a
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-base h-12 px-5"
          href="https://twitter.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Follow on Twitter
        </a>
      </div>
    </div>
  );
}
