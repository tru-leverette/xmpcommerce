'use client'

import { useEffect, useState } from 'react';

interface PirateMapLoaderProps {
  onComplete: () => void
  duration?: number // Duration in milliseconds, default 10 seconds
}

export default function PirateMapLoader({ onComplete, duration = 10000 }: PirateMapLoaderProps) {
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('Gathering location');
  const [showTreasure] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setProgress(0);
    setMessage('Gathering location');

    // Step 1: Location check
    const locationTimeout = setTimeout(() => {
      if (!isMounted) return;
      setProgress(25);
      setMessage('Granting Access');


      // End accessTimeout
    }, duration * 0.25);
    // End locationTimeout

    return () => {
      isMounted = false;
      clearTimeout(locationTimeout);
    };
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-amber-100 via-yellow-50 to-amber-200 overflow-hidden">
      {/* Parchment Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 via-amber-50 to-yellow-200 opacity-90">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Torn Paper Edges */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-4 bg-amber-200 transform -skew-y-1 shadow-md" />
        <div className="absolute bottom-0 left-0 w-full h-4 bg-amber-200 transform skew-y-1 shadow-md" />
        <div className="absolute top-0 left-0 w-4 h-full bg-amber-200 transform skew-x-1 shadow-md" />
        <div className="absolute top-0 right-0 w-4 h-full bg-amber-200 transform -skew-x-1 shadow-md" />
      </div>

      {/* Map Content */}
      <div className="relative h-full w-full p-8">

        <div className="fixed inset-0 z-50 bg-gradient-to-b from-amber-100 via-yellow-50 to-amber-200 overflow-hidden">
          {/* Parchment Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 via-amber-50 to-yellow-200 opacity-90">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Torn Paper Edges */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-4 bg-amber-200 transform -skew-y-1 shadow-md" />
            <div className="absolute bottom-0 left-0 w-full h-4 bg-amber-200 transform skew-y-1 shadow-md" />
            <div className="absolute top-0 left-0 w-4 h-full bg-amber-200 transform skew-x-1 shadow-md" />
            <div className="absolute top-0 right-0 w-4 h-full bg-amber-200 transform -skew-x-1 shadow-md" />
          </div>

          {/* Map Content */}
          <div className="relative h-full w-full p-8">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-6xl font-bold text-amber-900 mb-2 font-serif drop-shadow-lg transform -rotate-2">
                Treasure Map
              </h1>
              <p className="text-2xl text-amber-800 font-serif italic">
                &ldquo;Where Adventure Awaits...&rdquo;
              </p>
            </div>
            {/* Progress Bar */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-80">
              <div className="bg-amber-900 rounded-full h-6 p-1 shadow-lg">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
                </div>
              </div>
              <div className="text-center mt-2 text-amber-900 font-serif font-bold">
                {message}
              </div>
            </div>
            {/* Decorative Elements, Wind Effects, etc. */}
          </div>
        </div>
        <svg className="w-full h-full" viewBox="0 0 800 600">
          <path
            d="M150 300 Q180 280 220 320 Q250 350 200 380 Q160 360 150 300"
            fill="#F4A460"
            stroke="#8B4513"
            strokeWidth="2"
          />

          {/* Mountain */}
          <polygon
            points="300,250 350,180 400,250 350,280"
            fill="#8B7355"
            stroke="#654321"
            strokeWidth="2"
          />

          {/* Palm Trees */}
          <g transform="translate(180,350)">
            <rect x="0" y="0" width="6" height="40" fill="#8B4513" />
            <ellipse cx="3" cy="-10" rx="20" ry="15" fill="#228B22" />
          </g>
          <g transform="translate(500,320)">
            <rect x="0" y="0" width="6" height="35" fill="#8B4513" />
            <ellipse cx="3" cy="-8" rx="18" ry="12" fill="#228B22" />
          </g>

          {/* Skull Rock */}
          <circle cx="550" cy="400" r="25" fill="#D3D3D3" stroke="#A9A9A9" strokeWidth="2" />
          <circle cx="545" cy="395" r="3" fill="#000" />
          <circle cx="555" cy="395" r="3" fill="#000" />
          <path d="M545 405 Q550 410 555 405" stroke="#000" strokeWidth="2" fill="none" />
        </svg>

        {/* X Marks the Spot - Center */}
        <div className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${showTreasure ? 'scale-125 animate-pulse' : ''}`}>
          <div className="relative">
            <div className="text-6xl font-bold text-red-600 drop-shadow-lg transform rotate-12">X</div>
            {showTreasure && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="text-4xl">💰</div>
              </div>
            )}
          </div>
        </div>

        {/* Dotted Path to Treasure */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path
            d="M100 500 Q200 400 300 350 Q350 320 400 300"
            stroke="#8B4513"
            strokeWidth="3"
            fill="none"
            strokeDasharray="10,10"
            strokeLinecap="round"
          />
        </svg>

        {/* Ship at Starting Point */}
        <div className="absolute bottom-8 left-8 text-4xl transform -rotate-12 animate-bounce">
          🚢
        </div>

        {/* Treasure Chest (appears near end) */}
        {progress > 70 && (
          <div className={`absolute bottom-12 right-12 text-3xl transform transition-all duration-500 ${showTreasure ? 'scale-110' : ''}`}>
            📦
          </div>
        )}

        {/* Sea Monsters */}
        <div className="absolute top-8 left-1/4 text-2xl animate-pulse">🐙</div>
        <div className="absolute bottom-16 right-1/4 text-2xl animate-pulse">🦈</div>

      </div>

      {/* Progress Bar */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-80">
        <div className="bg-amber-900 rounded-full h-6 p-1 shadow-lg">
          <div
            className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
          </div>
        </div>
        <div className="text-center mt-2 text-amber-900 font-serif font-bold">
          {progress < 100 ? `Charting Course... ${Math.round(progress)}%` : 'Adventure Awaits!'}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-8 text-xl transform rotate-12">⚓</div>
      <div className="absolute top-1/3 right-8 text-xl transform -rotate-12">🗡️</div>
      <div className="absolute bottom-1/4 left-16 text-lg">🦜</div>
      <div className="absolute top-8 right-1/3 text-lg">☠️</div>

      {/* Wind Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute text-amber-300 opacity-60 animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '3s'
            }}
          >
            💨
          </div>
        ))}
      </div>

    </div >
  )
}
