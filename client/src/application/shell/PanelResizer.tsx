import { useState, useCallback, useEffect, useRef } from 'react';

interface PanelResizerProps {
  onResize: (delta: number) => void;
  onDoubleClick?: () => void;
  direction: 'horizontal' | 'vertical';
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

export function PanelResizer({
  onResize,
  onDoubleClick,
  direction = 'horizontal',
  minWidth: _minWidth,
  maxWidth: _maxWidth,
  className = '',
}: PanelResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const startXRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [direction]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const delta = e.clientX - startXRef.current;
      startXRef.current = e.clientX;

      onResize(delta);
    },
    [isDragging, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (onDoubleClick) {
      onDoubleClick();
    }
  }, [onDoubleClick]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const cursorClass =
    direction === 'horizontal'
      ? 'cursor-col-resize hover:bg-[#30714C]/20'
      : 'cursor-row-resize hover:bg-[#30714C]/20';

  return (
    <div
      className={`
        group relative flex-shrink-0 transition-colors
        ${direction === 'horizontal' ? 'w-1 h-full' : 'w-full h-1'}
        ${cursorClass}
        ${isDragging ? 'bg-[#30714C]/40' : 'bg-transparent'}
        ${className}
      `}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      role="separator"
      aria-orientation={direction}
      aria-label="Resize panel"
    >
      {/* Visual indicator on hover */}
      {(isHovering || isDragging) && (
        <div
          className={`
            absolute bg-[#30714C] transition-all
            ${direction === 'horizontal'
              ? 'left-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-full'
              : 'top-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full'
            }
          `}
        />
      )}
    </div>
  );
}
