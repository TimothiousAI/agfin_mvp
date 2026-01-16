import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArtifactTabBar } from './ArtifactTabBar';
import ArtifactToolbar from './ArtifactToolbar';
import {
  artifactSlideVariants,
  contentFadeVariants,
} from './artifactAnimations';
import type { Artifact as ContentArtifact } from './ArtifactContent';

interface Artifact {
  id: string;
  title: string;
  type: 'document' | 'chart' | 'code' | 'form';
  content: React.ReactNode;
}

interface ArtifactPanelProps {
  artifacts?: Artifact[];
  activeArtifactId?: string;
  onSelectArtifact?: (artifactId: string) => void;
  onCloseArtifact?: (artifactId: string) => void;
  onReorderArtifacts?: (artifactIds: string[]) => void;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ArtifactPanel({
  artifacts = [],
  activeArtifactId,
  onSelectArtifact,
  onCloseArtifact,
  onReorderArtifacts,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: ArtifactPanelProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [localCollapsed, setLocalCollapsed] = useState(collapsed);

  const isCollapsed = onToggleCollapse ? collapsed : localCollapsed;
  const handleToggleCollapse = onToggleCollapse || (() => setLocalCollapsed(!localCollapsed));

  const activeArtifact = artifacts.find(a => a.id === activeArtifactId) || artifacts[0];

  if (isCollapsed) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="artifact-panel"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={artifactSlideVariants}
        className="flex flex-col h-full bg-[#061623]"
        style={{
          width: isFullScreen ? '100%' : '400px',
        }}
      >
          {/* Header with Tab Bar */}
          <div className="h-14 bg-[#0D2233] border-b border-[#061623] flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className="text-white font-medium flex-shrink-0">Artifacts</h3>
              {artifacts.length > 0 && (
                <span className="text-white/60 text-sm">({artifacts.length})</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Full Screen Toggle */}
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                aria-label={isFullScreen ? 'Exit full screen' : 'Full screen'}
              >
                {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>

              {/* Close Button */}
              <button
                onClick={onClose || handleToggleCollapse}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                aria-label="Close artifact panel"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Tab Bar for Multiple Artifacts */}
          {artifacts.length > 0 && onSelectArtifact && onCloseArtifact && (
            <ArtifactTabBar
              artifacts={artifacts}
              activeArtifactId={activeArtifactId || null}
              onSelectArtifact={onSelectArtifact}
              onCloseArtifact={onCloseArtifact}
              onReorderArtifacts={onReorderArtifacts}
            />
          )}

          {/* Content Area with Scroll */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={contentFadeVariants}
            className="flex-1 overflow-y-auto p-4"
          >
            {artifacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-[#0D2233] rounded-xl flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-white/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-white/60 text-sm mb-1">No artifacts yet</p>
                <p className="text-white/40 text-xs max-w-xs">
                  Artifacts like documents, charts, and forms will appear here
                </p>
              </div>
            ) : activeArtifact ? (
              <div className="space-y-4">
                {/* Artifact Type Badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-[#30714C] text-white">
                    {activeArtifact.type}
                  </span>
                  <h4 className="text-white font-medium">{activeArtifact.title}</h4>
                </div>

                {/* Artifact Toolbar - Edit, Versions, Export */}
                <ArtifactToolbar
                  artifact={activeArtifact as unknown as ContentArtifact}
                  onRepromptStart={() => {
                    // Optional: scroll to chat or provide visual feedback
                    console.log('Re-prompt started for artifact:', activeArtifact.id);
                  }}
                />

                {/* Artifact Content */}
                <div className="bg-[#0D2233] rounded-lg p-4">
                  {activeArtifact.content}
                </div>
              </div>
            ) : null}
          </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper component for artifact content rendering
export function ArtifactContent({ children }: { children: React.ReactNode }) {
  return <div className="text-white/80 text-sm leading-relaxed">{children}</div>;
}
