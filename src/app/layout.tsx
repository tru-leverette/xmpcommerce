import type { Metadata } from "next";
import "./globals.css";

import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
  title: "Scavenger Hunt Platform",
  description: "An interactive scavenger hunt gaming platform with AI-powered clues and location-based challenges",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
