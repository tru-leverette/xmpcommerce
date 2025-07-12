import React, { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setVisible(true);
    // Fade out after 4.5s, then remove after 5s
    const fadeOutTimer = setTimeout(() => setVisible(false), 4500);
    const removeTimer = setTimeout(onClose, 5000);
    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
    };
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 px-8 py-4 rounded-xl shadow-2xl
        bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white font-semibold text-lg
        transition-opacity duration-500 ease-in-out
        ${visible ? "opacity-100" : "opacity-0"}
        animate-toast-slide`}
      style={{
        zIndex: 9999,
        minWidth: 240,
        maxWidth: 400,
        pointerEvents: "none",
        letterSpacing: "0.01em",
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
      role="alert"
      aria-live="assertive"
    >
      <span className="flex items-center gap-2">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="text-white">
          <circle cx="12" cy="12" r="12" fill="#22d3ee" opacity="0.2"/>
          <path d="M9.5 12.5l2 2 3-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {message}
      </span>
    </div>
  );
};

export default Toast;

// Add this to your global CSS or Tailwind config:
/*
.animate-toast-slide {
  animation: toast-slide-in 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes toast-slide-in {
  from { transform: translateX(-50%) translateY(40px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}
*/