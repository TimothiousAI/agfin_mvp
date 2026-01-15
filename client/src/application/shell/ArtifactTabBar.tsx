import { X, FileText, BarChart3, Code2, FileInput, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Artifact {
  id: string;
  title: string;
  type: 'document' | 'chart' | 'code' | 'form';
  content?: React.ReactNode;
}

interface ArtifactTabBarProps {
  artifacts: Artifact[];
  activeArtifactId: string | null;
  onSelectArtifact: (artifactId: string) => void;
  onCloseArtifact: (artifactId: string) => void;
  onReorderArtifacts?: (artifactIds: string[]) => void;
}

const artifactIcons = {
  document: FileText,
  chart: BarChart3,
  code: Code2,
  form: FileInput,
};

export function ArtifactTabBar({
  artifacts,
  activeArtifactId,
  onSelectArtifact,
  onCloseArtifact,
  onReorderArtifacts,
}: ArtifactTabBarProps) {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check scroll overflow
  useEffect(() => {
    const checkScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 1);
    };

    checkScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [artifacts]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 200;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleDragStart = (e: React.DragEvent, artifactId: string) => {
    setDraggedTabId(artifactId);
    e.dataTransfer.effectAllowed = 'move';
    // Set drag image
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent, artifactId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTabId && draggedTabId !== artifactId) {
      setDropTargetId(artifactId);
    }
  };

  const handleDragLeave = () => {
    setDropTargetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTabId || draggedTabId === targetId || !onReorderArtifacts) {
      setDraggedTabId(null);
      setDropTargetId(null);
      return;
    }

    const draggedIndex = artifacts.findIndex((a) => a.id === draggedTabId);
    const targetIndex = artifacts.findIndex((a) => a.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTabId(null);
      setDropTargetId(null);
      return;
    }

    // Reorder artifacts
    const newArtifacts = [...artifacts];
    const [removed] = newArtifacts.splice(draggedIndex, 1);
    newArtifacts.splice(targetIndex, 0, removed);

    onReorderArtifacts(newArtifacts.map((a) => a.id));

    setDraggedTabId(null);
    setDropTargetId(null);
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
    setDropTargetId(null);
  };

  const handleCloseTab = (e: React.MouseEvent, artifactId: string) => {
    e.stopPropagation();
    onCloseArtifact(artifactId);
  };

  if (artifacts.length === 0) {
    return null;
  }

  return (
    <div className="relative flex items-center bg-[#0D2233] border-b border-[#061623]">
      {/* Left scroll button */}
      {showLeftScroll && (
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-0 z-10 h-full px-2 bg-gradient-to-r from-[#0D2233] to-transparent hover:from-[#0D2233]/90"
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} className="text-white/60 hover:text-white" />
        </button>
      )}

      {/* Tab container with scroll */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-1 px-2 py-2 overflow-x-auto scrollbar-hide flex-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <AnimatePresence mode="popLayout">
          {artifacts.map((artifact) => {
            const Icon = artifactIcons[artifact.type];
            const isActive = activeArtifactId === artifact.id;
            const isDragging = draggedTabId === artifact.id;
            const isDropTarget = dropTargetId === artifact.id;

            return (
              <motion.div
                key={artifact.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                draggable={!!onReorderArtifacts}
                onDragStart={(e) => handleDragStart(e as any, artifact.id)}
                onDragOver={(e) => handleDragOver(e as any, artifact.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e as any, artifact.id)}
                onDragEnd={handleDragEnd}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium
                  transition-all duration-150 cursor-pointer flex-shrink-0
                  ${
                    isActive
                      ? 'bg-[#30714C] text-white shadow-md'
                      : 'bg-[#061623] text-white/60 hover:text-white hover:bg-[#061623]/80'
                  }
                  ${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}
                  ${isDropTarget ? 'ring-2 ring-[#30714C]/50' : ''}
                `}
                onClick={() => onSelectArtifact(artifact.id)}
              >
                {/* Icon */}
                <Icon size={14} className={isActive ? 'text-white' : 'text-white/40'} />

                {/* Title */}
                <span className="max-w-[120px] truncate whitespace-nowrap">
                  {artifact.title}
                </span>

                {/* Close button */}
                <button
                  onClick={(e) => handleCloseTab(e, artifact.id)}
                  className={`
                    p-0.5 rounded hover:bg-white/10 transition-colors
                    ${isActive ? 'text-white/80 hover:text-white' : 'text-white/40 hover:text-white/60'}
                  `}
                  aria-label={`Close ${artifact.title}`}
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Right scroll button */}
      {showRightScroll && (
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-0 z-10 h-full px-2 bg-gradient-to-l from-[#0D2233] to-transparent hover:from-[#0D2233]/90"
          aria-label="Scroll right"
        >
          <ChevronRight size={16} className="text-white/60 hover:text-white" />
        </button>
      )}
    </div>
  );
}
