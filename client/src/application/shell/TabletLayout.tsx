import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  PanelLeftClose,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePanelStore } from './usePanelStore';

interface TabletLayoutProps {
  children?: ReactNode;
  sidebar?: ReactNode;
  artifactPanel?: ReactNode;
}

/**
 * Tablet Layout (768-1024px)
 * - Two column layout (Chat + Artifact side-by-side)
 * - Sidebar hidden by default (toggle with button)
 * - Artifact panel can be opened/closed
 * - When both sidebar and artifact are open, artifact overlays
 * - Optimized spacing for medium screens
 */
export function TabletLayout({ children, sidebar, artifactPanel }: TabletLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const artifactPanelOpen = usePanelStore((state) => state.artifactPanelOpen);
  const setArtifactPanelOpen = usePanelStore((state) => state.setArtifactPanelOpen);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen w-full bg-[#061623] overflow-hidden">
      {/* Main Content Area - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with Hamburger Menu */}
          <header className="h-14 bg-[#30714C] flex items-center justify-between px-4 flex-shrink-0 shadow-md">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </button>

            {/* App Title */}
            <h1 className="text-white font-semibold text-lg">AgFin</h1>

            {/* Artifact Toggle Button */}
            <button
              onClick={() => setArtifactPanelOpen(!artifactPanelOpen)}
              className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label={artifactPanelOpen ? 'Close artifacts' : 'Open artifacts'}
            >
              {artifactPanelOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </header>

          {/* Chat Content */}
          <main className="flex-1 overflow-y-auto">
            {children || (
              <div className="h-full flex items-center justify-center">
                <p className="text-white/60 text-lg">Chat content</p>
              </div>
            )}
          </main>
        </div>

        {/* Artifact Column - Side by side with chat */}
        <AnimatePresence>
          {artifactPanelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="flex-shrink-0 border-l border-[#0D2233] flex flex-col bg-[#061623] overflow-hidden"
            >
              {/* Artifact Header */}
              <div className="h-14 bg-[#0D2233] border-b border-[#061623] flex items-center justify-between px-4 flex-shrink-0">
                <h3 className="text-white font-medium">Artifacts</h3>
                <button
                  onClick={() => setArtifactPanelOpen(false)}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                  aria-label="Close artifact panel"
                >
                  <PanelLeftClose size={20} />
                </button>
              </div>

              {/* Artifact Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {artifactPanel || (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/60 text-sm">Artifact content</p>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar Drawer - Overlays on top when open */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />

            {/* Sidebar - slides from left, overlays everything */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[320px] bg-[#061623] z-50 shadow-2xl flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="h-14 bg-[#30714C] flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-[#30714C] font-bold text-lg">A</span>
                  </div>
                  <h2 className="text-white font-semibold text-lg">AgFin</h2>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close sidebar"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto">
                {sidebar || (
                  <div className="p-4">
                    <p className="text-white/60 text-sm">Sidebar content</p>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar Toggle Button (when sidebar is closed) */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-30 bg-[#30714C] text-white p-2 rounded-lg hover:bg-[#3d8a5f] transition-colors shadow-lg"
            aria-label="Open sidebar"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
