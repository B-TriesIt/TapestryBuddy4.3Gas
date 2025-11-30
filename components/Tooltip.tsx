import React, { useState } from 'react';

// --- HEADER: Tooltip Component ---
// Provides a floating text label when hovering over UI elements.
// Z-Index is set to 9999 to ensure it appears above all modals and floating panels.

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'bottom' }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Position logic
  let positionClasses = "";
  switch (position) {
    case 'top': positionClasses = "bottom-full mb-2 left-1/2 -translate-x-1/2"; break;
    case 'bottom': positionClasses = "top-full mt-2 left-1/2 -translate-x-1/2"; break;
    case 'left': positionClasses = "right-full mr-2 top-1/2 -translate-y-1/2"; break;
    case 'right': positionClasses = "left-full ml-2 top-1/2 -translate-y-1/2"; break;
  }

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-[9999] px-3 py-1 text-xs font-medium text-slate-700 bg-brand-light border border-brand rounded-md shadow-sm whitespace-nowrap pointer-events-none transition-opacity duration-200 ${positionClasses}`}>
          {text}
          {/* Arrow */}
          <div className={`absolute w-2 h-2 bg-brand-light border-brand transform rotate-45 ${
             position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2 border-t border-l' :
             position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2 border-b border-r' :
             '' 
          }`}></div>
        </div>
      )}
    </div>
  );
};