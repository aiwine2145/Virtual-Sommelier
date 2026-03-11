import React from 'react';
import { Sparkles } from 'lucide-react';

interface WineCategoryLogoProps {
  type: string;
  className?: string;
}

export function WineCategoryLogo({ type, className = "" }: WineCategoryLogoProps) {
  const renderLogo = () => {
    switch (type.toLowerCase()) {
      case 'red':
        return (
          <div className={`relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-br from-red-950 via-rose-950/40 to-black flex items-center justify-center ${className}`}>
            <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full opacity-40 transform scale-150" />
            <svg viewBox="0 0 100 100" className="w-40 h-40 md:w-56 md:h-56 relative z-10 drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Liquid - Red Wine (Wide Bowl) */}
              <path d="M25 45 C25 65, 40 75, 50 75 C60 75, 75 65, 75 45 Z" fill="#991b1b" className="opacity-90" />
              {/* Liquid Surface */}
              <ellipse cx="50" cy="45" rx="25" ry="4" fill="#7f1d1d" />
              {/* Glass Outline */}
              <path d="M30 20 C20 35, 25 65, 50 75 C75 65, 80 35, 70 20 Z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              {/* Stem */}
              <line x1="50" y1="75" x2="50" y2="95" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
              {/* Base */}
              <line x1="35" y1="95" x2="65" y2="95" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
              {/* Highlight */}
              <path d="M32 35 C28 45, 30 55, 40 65" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'white':
        return (
          <div className={`relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-br from-amber-900/40 via-yellow-900/10 to-black flex items-center justify-center ${className}`}>
            <div className="absolute inset-0 bg-yellow-200/10 blur-3xl rounded-full opacity-50 transform scale-150" />
            <svg viewBox="0 0 100 100" className="w-40 h-40 md:w-56 md:h-56 relative z-10 drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Liquid - White Wine (Narrower U-shape) */}
              <path d="M32 45 C32 65, 42 75, 50 75 C58 75, 68 65, 68 45 Z" fill="#fef08a" className="opacity-80" />
              {/* Liquid Surface */}
              <ellipse cx="50" cy="45" rx="18" ry="3" fill="#fde047" />
              {/* Glass Outline */}
              <path d="M35 20 C30 35, 32 65, 50 75 C68 65, 70 35, 65 20 Z" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
              {/* Stem */}
              <line x1="50" y1="75" x2="50" y2="95" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
              {/* Base */}
              <line x1="38" y1="95" x2="62" y2="95" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
              {/* Highlight */}
              <path d="M36 35 C34 45, 36 55, 42 65" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'sparkling':
        return (
          <div className={`relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-900/30 via-amber-900/20 to-black flex items-center justify-center ${className}`}>
            <div className="absolute inset-0 bg-yellow-300/20 blur-3xl rounded-full opacity-50 transform scale-150" />
            <svg viewBox="0 0 100 100" className="w-40 h-40 md:w-56 md:h-56 relative z-10 drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Liquid - Flute */}
              <path d="M38 35 C38 60, 45 75, 50 75 C55 75, 62 60, 62 35 Z" fill="#fde047" className="opacity-70" />
              {/* Liquid Surface */}
              <ellipse cx="50" cy="35" rx="12" ry="2" fill="#fef08a" />
              {/* Bubbles */}
              <g className="animate-pulse">
                <circle cx="48" cy="65" r="1.5" fill="rgba(255,255,255,0.8)" />
                <circle cx="52" cy="55" r="1" fill="rgba(255,255,255,0.6)" />
                <circle cx="47" cy="45" r="1.2" fill="rgba(255,255,255,0.9)" />
                <circle cx="53" cy="40" r="0.8" fill="rgba(255,255,255,0.5)" />
                <circle cx="50" cy="50" r="1.5" fill="rgba(255,255,255,0.7)" />
              </g>
              {/* Glass Outline */}
              <path d="M40 15 C38 30, 38 60, 50 75 C62 60, 62 30, 60 15 Z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
              {/* Stem */}
              <line x1="50" y1="75" x2="50" y2="95" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
              {/* Base */}
              <line x1="40" y1="95" x2="60" y2="95" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
              {/* Highlight */}
              <path d="M41 25 C40 40, 41 55, 45 65" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'champagne':
        return (
          <div className={`relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-700/40 via-amber-600/20 to-black flex items-center justify-center ${className}`}>
            <div className="absolute inset-0 bg-yellow-400/30 blur-3xl rounded-full opacity-50 transform scale-150" />
            <div className="absolute inset-0 flex items-center justify-center opacity-60">
              <Sparkles className="absolute top-1/4 left-1/4 w-8 h-8 text-yellow-300 animate-pulse" />
              <Sparkles className="absolute bottom-1/3 right-1/4 w-5 h-5 text-yellow-200 animate-pulse delay-300" />
              <Sparkles className="absolute top-1/3 right-1/3 w-4 h-4 text-yellow-100 animate-pulse delay-700" />
            </div>
            <svg viewBox="0 0 100 100" className="w-40 h-40 md:w-56 md:h-56 relative z-10 drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Liquid - Coupe Glass */}
              <path d="M20 35 C20 50, 40 60, 50 60 C60 60, 80 50, 80 35 Z" fill="#eab308" className="opacity-80" />
              {/* Liquid Surface */}
              <ellipse cx="50" cy="35" rx="30" ry="4" fill="#facc15" />
              {/* Bubbles */}
              <g className="animate-pulse">
                <circle cx="45" cy="50" r="1.5" fill="rgba(255,255,255,0.9)" />
                <circle cx="55" cy="45" r="1" fill="rgba(255,255,255,0.7)" />
                <circle cx="50" cy="40" r="1.2" fill="rgba(255,255,255,0.8)" />
                <circle cx="35" cy="42" r="0.8" fill="rgba(255,255,255,0.6)" />
                <circle cx="65" cy="42" r="1" fill="rgba(255,255,255,0.7)" />
              </g>
              {/* Glass Outline */}
              <path d="M15 25 C15 45, 35 60, 50 60 C65 60, 85 45, 85 25 Z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
              {/* Stem */}
              <line x1="50" y1="60" x2="50" y2="95" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
              {/* Base */}
              <line x1="35" y1="95" x2="65" y2="95" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
              {/* Highlight */}
              <path d="M20 35 C25 45, 35 52, 45 56" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'rose':
        return (
          <div className={`relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-br from-pink-950 via-rose-900/30 to-black flex items-center justify-center ${className}`}>
            <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full opacity-40 transform scale-150" />
            <svg viewBox="0 0 100 100" className="w-40 h-40 md:w-56 md:h-56 relative z-10 drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Liquid - Rose Wine */}
              <path d="M28 45 C28 65, 40 75, 50 75 C60 75, 72 65, 72 45 Z" fill="#f472b6" className="opacity-80" />
              {/* Liquid Surface */}
              <ellipse cx="50" cy="45" rx="22" ry="3.5" fill="#fbcfe8" />
              {/* Glass Outline */}
              <path d="M32 20 C25 35, 28 65, 50 75 C72 65, 75 35, 68 20 Z" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
              {/* Stem */}
              <line x1="50" y1="75" x2="50" y2="95" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
              {/* Base */}
              <line x1="38" y1="95" x2="62" y2="95" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
              {/* Highlight */}
              <path d="M33 35 C31 45, 33 55, 40 65" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'sweet':
        return (
          <div className={`relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-br from-amber-950 via-orange-900/40 to-black flex items-center justify-center ${className}`}>
            <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full opacity-40 transform scale-150" />
            <svg viewBox="0 0 100 100" className="w-40 h-40 md:w-56 md:h-56 relative z-10 drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Liquid - Sweet Wine (Small Copita) */}
              <path d="M35 55 C35 70, 45 75, 50 75 C55 75, 65 70, 65 55 Z" fill="#fbbf24" className="opacity-90" />
              {/* Liquid Surface */}
              <ellipse cx="50" cy="55" rx="15" ry="2.5" fill="#fcd34d" />
              {/* Glass Outline */}
              <path d="M38 35 C32 50, 35 70, 50 75 C65 70, 68 50, 62 35 Z" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
              {/* Stem */}
              <line x1="50" y1="75" x2="50" y2="95" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
              {/* Base */}
              <line x1="40" y1="95" x2="60" y2="95" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
              {/* Highlight */}
              <path d="M38 45 C37 55, 39 65, 45 70" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'fortified':
        return (
          <div className={`relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-br from-purple-950 via-slate-900 to-black flex items-center justify-center ${className}`}>
            <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full opacity-40 transform scale-150" />
            <svg viewBox="0 0 100 100" className="w-40 h-40 md:w-56 md:h-56 relative z-10 drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Liquid - Fortified Wine (Port Glass) */}
              <path d="M30 50 C30 68, 42 75, 50 75 C58 75, 70 68, 70 50 Z" fill="#581c87" className="opacity-95" />
              {/* Liquid Surface */}
              <ellipse cx="50" cy="50" rx="20" ry="3" fill="#4c1d95" />
              {/* Glass Outline */}
              <path d="M35 30 C28 45, 30 68, 50 75 C70 68, 72 45, 65 30 Z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              {/* Stem */}
              <line x1="50" y1="75" x2="50" y2="95" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
              {/* Base */}
              <line x1="38" y1="95" x2="62" y2="95" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
              {/* Highlight */}
              <path d="M34 40 C32 50, 34 60, 42 70" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center ${className}`}>
            <div className="absolute inset-0 bg-slate-500/10 blur-3xl rounded-full opacity-40 transform scale-150" />
            <svg viewBox="0 0 100 100" className="w-40 h-40 md:w-56 md:h-56 relative z-10 drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 45 C30 65, 42 75, 50 75 C58 75, 70 65, 70 45 Z" fill="#64748b" className="opacity-50" />
              <ellipse cx="50" cy="45" rx="20" ry="3" fill="#475569" />
              <path d="M35 20 C28 35, 30 65, 50 75 C70 65, 72 35, 65 20 Z" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <line x1="50" y1="75" x2="50" y2="95" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
              <line x1="38" y1="95" x2="62" y2="95" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {renderLogo()}
      {/* Decorative Rings */}
      <div className="absolute inset-0 border border-white/5 rounded-2xl m-4 pointer-events-none" />
      <div className="absolute inset-0 border border-white/5 rounded-2xl m-8 pointer-events-none" />
    </div>
  );
}
