import React from 'react';
import { Clock } from 'lucide-react';

interface DecantingTimeLogoProps {
  decantingTime: string;
  wineType: string;
  className?: string;
}

export function DecantingTimeLogo({ decantingTime, wineType, className = "" }: DecantingTimeLogoProps) {
  const getBgColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'red': return 'bg-red-900';
      case 'white': return 'bg-yellow-900';
      case 'sparkling': return 'bg-yellow-800';
      case 'champagne': return 'bg-amber-900';
      case 'rose': return 'bg-pink-900';
      case 'sweet': return 'bg-orange-900';
      case 'fortified': return 'bg-amber-950';
      default: return 'bg-neutral-950';
    }
  };

  return (
    <div className={`relative w-full h-full rounded-2xl ${getBgColor(wineType)} flex flex-col items-center justify-center p-4 text-white border border-neutral-800 ${className}`}>
      <Clock className="w-12 h-12 mb-3 text-white" strokeWidth={1.5} />
      <span className="text-sm text-white/80 uppercase tracking-wider mb-2">建議醒酒:</span>
      <span className="text-sm font-medium text-center text-white">
        {decantingTime}
      </span>
    </div>
  );
}
