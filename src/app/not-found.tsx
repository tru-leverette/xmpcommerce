import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-1/3 w-1 h-1 bg-green-400 rounded-full animate-pulse delay-700"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          
          {/* Large 404 with adventure map styling */}
          <div className="mb-8">
            <div className="relative">
              <h1 className="text-9xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 leading-none">
                404
              </h1>
              <div className="absolute inset-0 text-9xl md:text-[12rem] font-black text-yellow-500/20 blur-sm">
                404
              </div>
            </div>
          </div>

          {/* Adventure chest and compass */}
          <div className="mb-8 flex justify-center items-center space-x-6">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-xl transform rotate-3">
              <span className="text-3xl">🗝️</span>
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
              <span className="text-4xl">🧭</span>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-xl transform -rotate-3">
              <span className="text-3xl">📜</span>
            </div>
          </div>

          {/* Main heading and description */}
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Lost at Sea? 🏴‍☠️
            </h2>
            <p className="text-xl text-blue-100 mb-2">
              Ahoy! The adventure you seek has sailed to distant waters.
            </p>
            <p className="text-blue-200/80">
              This page seems to have been lost in the depths of the digital ocean.
            </p>
          </div>

          {/* Navigation buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link
              href="/dashboard"
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl">🏠</span>
                <span>Dashboard</span>
              </div>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            
            <Link
              href="/games"
              className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl">🎮</span>
                <span>Scavenger Hunts</span>
              </div>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>

            <Link
              href="/"
              className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl">⚓</span>
                <span>Home Port</span>
              </div>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>

          {/* Adventure tip card */}
          <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 backdrop-blur-sm border border-yellow-400/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-2xl">�</span>
              </div>
              <h3 className="text-xl font-bold text-yellow-300">Adventurer&apos;s Wisdom</h3>
            </div>
            <p className="text-yellow-100/90 text-center">
              &quot;Not all who wander are lost, but sometimes even the best navigators need to recalibrate their compass.&quot;
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-blue-300/60 text-sm">
            Error 404 • Page Not Found • Chart coordinates invalid
          </div>
        </div>
      </div>
    </div>
  )
}
