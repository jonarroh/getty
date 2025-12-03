import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

interface Props {
  left: React.ReactNode;
  right: React.ReactNode;
  initialLeftWidth?: number; // Pixels
  minLeftWidth?: number;
  maxLeftWidth?: number;
  className?: string;
}

export const ResizableSplit: React.FC<Props> = ({
  left,
  right,
  initialLeftWidth = 300,
  minLeftWidth = 200,
  maxLeftWidth = 800,
  className
}) => {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      if (newWidth >= minLeftWidth && newWidth <= maxLeftWidth) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minLeftWidth, maxLeftWidth]);

  return (
    <div ref={containerRef} className={clsx("flex h-full w-full overflow-hidden", className)}>
      <div style={{ width: leftWidth }} className="flex-shrink-0 h-full overflow-hidden relative z-0">
        {left}
        {/* Overlay to catch events over iframes during drag */}
        {isDragging && <div className="absolute inset-0 z-50 bg-transparent" />}
      </div>

      {/* Handle */}
      <div
        onMouseDown={startResize}
        className={clsx(
          "w-1 h-full cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors flex-shrink-0 z-10",
          isDragging ? "bg-primary" : "bg-slate-800"
        )}
      />

      <div className="flex-1 min-w-0 h-full overflow-hidden relative z-0">
        {right}
        {/* Overlay to catch events over iframes during drag */}
        {isDragging && <div className="absolute inset-0 z-50 bg-transparent" />}
      </div>
    </div>
  );
};