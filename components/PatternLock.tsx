import React, { useState, useEffect, useRef } from 'react';

interface PatternLockProps {
  onComplete: (pattern: number[]) => void;
  onStart?: () => void;
  error?: boolean;
}

const PatternLock: React.FC<PatternLockProps> = ({ onComplete, onStart, error }) => {
  const [pattern, setPattern] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const DOTS = 9; // 3x3 grid
  
  useEffect(() => {
    if (error) {
      setTimeout(() => {
        setPattern([]);
      }, 500);
    }
  }, [error]);
  
  const handleStart = (e: React.PointerEvent | React.TouchEvent, index: number) => {
    setIsDrawing(true);
    setPattern([index]);
    if (onStart) onStart();
  };
  
  const handleMove = (e: React.PointerEvent | React.TouchEvent) => {
    if (!isDrawing || !containerRef.current) return;
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const elements = document.elementsFromPoint(clientX, clientY);
    const dotElement = elements.find(el => el.hasAttribute('data-dot-index'));
    
    if (dotElement) {
      const index = parseInt(dotElement.getAttribute('data-dot-index')!, 10);
      if (!pattern.includes(index)) {
        setPattern(prev => [...prev, index]);
      }
    }
  };
  
  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (pattern.length > 0) {
      onComplete(pattern);
    }
  };
  
  // Calculate lines between dots
  const renderLines = () => {
    if (pattern.length < 2 || !containerRef.current) return null;
    
    const lines = [];
    const containerRect = containerRef.current.getBoundingClientRect();
    const padding = 12; // Adjusted padding
    
    // We assume 3 cols, 3 rows. The container is a grid gap-4 or gap-6.
    // Instead of precise positions, we can calculate based on percentages.
    
    for (let i = 0; i < pattern.length - 1; i++) {
      const start = pattern[i];
      const end = pattern[i + 1];
      
      const startX = (start % 3) * 33.333 + 16.666; 
      const startY = Math.floor(start / 3) * 33.333 + 16.666;
      
      const endX = (end % 3) * 33.333 + 16.666;
      const endY = Math.floor(end / 3) * 33.333 + 16.666;
      
      const dx = endX - startX;
      const dy = endY - startY;
      
      // We must calculate the distance based on actual pixel width because percentages are relative to the container width.
      // But since it's a square container (w-64 h-64), X% and Y% are the same pixel distance.
      // So percentage distance is valid.
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      
      lines.push(
        <div
          key={`${start}-${end}`}
          style={{
            position: 'absolute',
            left: `${startX}%`,
            top: `${startY}%`,
            width: `${distance}%`,
            height: '4px',
            backgroundColor: error ? '#ef4444' : '#3b82f6',
            transformOrigin: '0 50%',
            transform: `rotate(${angle}deg) translateY(-50%)`,
            zIndex: 1,
            pointerEvents: 'none',
            borderRadius: '2px',
          }}
        />
      );
    }
    return lines;
  };

  return (
    <div 
      className="relative w-64 h-64 mx-auto touch-none select-none"
      ref={containerRef}
      onPointerMove={handleMove}
      onPointerUp={handleEnd}
      onPointerLeave={handleEnd}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      <div className="absolute inset-0 z-0">
         {renderLines()}
      </div>
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 z-10 w-full h-full">
        {Array.from({ length: DOTS }).map((_, index) => {
          const isActive = pattern.includes(index);
          return (
            <div 
              key={index} 
              className="flex items-center justify-center w-full h-full"
            >
              <div
                data-dot-index={index}
                onPointerDown={(e) => handleStart(e, index)}
                onTouchStart={(e) => handleStart(e, index)}
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer relative ${
                  isActive 
                    ? error ? 'bg-red-500/20' : 'bg-blue-500/20'
                    : 'bg-transparent'
                }`}
              >
                <div 
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    isActive 
                      ? error ? 'bg-red-500 scale-150 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-blue-500 scale-150 shadow-[0_0_10px_rgba(59,130,246,0.8)]'
                      : 'bg-white/30 border border-white/50'
                  }`} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PatternLock;
