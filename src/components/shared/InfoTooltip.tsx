'use client';

import { InfoIcon } from 'lucide-react';
import { useState } from 'react';

interface InfoTooltipProps {
  content: string;
  size?: 'sm' | 'md';
}

export function InfoTooltip({ content, size = 'sm' }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Más información"
      >
        <InfoIcon className={iconSize} />
      </button>

      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 pointer-events-none">
          <div className="bg-popover text-popover-foreground rounded-md border shadow-lg p-3 text-xs">
            <div className="relative">
              {content}
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                <div className="border-8 border-transparent border-t-border" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-[7px] border-[7px] border-transparent border-t-popover" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}