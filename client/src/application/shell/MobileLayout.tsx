import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  MessageSquare,
  FileText,
  Settings,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePanelStore } from './usePanelStore';

interface MobileLayoutProps {
  children?: ReactNode;
  sidebar?: ReactNode;
  artifactPanel?: ReactNode;
}

type MobileView = 'chat' | 'artifact' | 'settings';

/**
 * Mobile Layout (<768px)
 * - Single column layout
 * - Chat as primary view
 * - Bottom navigation bar
 * - Collapsible sidebar via hamburger menu (slide from left)
 * - Artifact as slide-over modal (slide from bottom)
 * - Touch-friendly tap targets (44x44px minimum)
 */
export function MobileLayout({ children, sidebar, artifactPanel }: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<MobileView>('chat');
  const artifactPanelOpen = usePanelStore((state) => state.artifactPanelOpen);
  const setArtifactPanelOpen = usePanelStore((state) => state.setArtifactPanelOpen);

  // Close sidebar when changing views
  useEffect(() => {
    setSidebarOpen(false);
  }, [currentView]);

  // Close artifact panel when navigating away from artifact view
  useEffect(() => {
    if (currentView !== 'artifact') {
      setArtifactPanelOpen(false);
    }
  }, [currentView, setArtifactPanelOpen]);

  // Prevent body scroll when sidebar or artifact is open
  useEffect(() => {
    if (sidebarOpen || artifactPanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, artifactPanelOpen]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#061623] overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 bg-[#30714C] flex items-center justify-between px-4 flex-shrink-0 shadow-lg">
        {/* Hamburger Menu Button - 44x44px touch target */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center justify-center w-11 h-11 text-white hover:bg-white/10 rounded-lg transition-colors active:scale-95"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        {/* App Title */}
        <h1 className="text-white font-semibold text-lg">AgFin</h1>

        {/* Spacer to center title */}
        <div className="w-11" />
      </header>

      {/* Main Content Area - Chat is primary view */}
      <main className="flex-1 overflow-y-auto">
        {currentView === 'chat' && (
          <div className="h-full">{children}</div>
        )}
        {currentView === 'artifact' && (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-white/60 text-center">
              Select an artifact from the chat to view it here
            </p>
          </div>
        )}
        {currentView === 'settings' && (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-white/60 text-center">Settings view</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar - 56px height for accessibility */}
      <nav className="h-14 bg-[#0D2233] border-t border-[#061623] flex items-center justify-around px-2 flex-shrink-0 shadow-lg">
        {/* Home/Chat Button - 44x44px touch target */}
        <button
          onClick={() => setCurrentView('chat')}
          className={`
            flex flex-col items-center justify-center w-20 h-11 rounded-lg transition-colors active:scale-95
            ${currentView === 'chat'
              ? 'text-[#30714C] bg-[#30714C]/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
            }
          `}
          aria-label="Chat"
          aria-current={currentView === 'chat' ? 'page' : undefined}
        >
          <MessageSquare size={20} />
          <span className="text-xs mt-1">Chat</span>
        </button>

        {/* Artifacts Button - 44x44px touch target */}
        <button
          onClick={() => {
            setCurrentView('artifact');
            setArtifactPanelOpen(true);
          }}
          className={`
            flex flex-col items-center justify-center w-20 h-11 rounded-lg transition-colors active:scale-95
            ${currentView === 'artifact'
              ? 'text-[#30714C] bg-[#30714C]/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
            }
          `}
          aria-label="Artifacts"
          aria-current={currentView === 'artifact' ? 'page' : undefined}
        >
          <FileText size={20} />
          <span className="text-xs mt-1">Artifacts</span>
        </button>

        {/* Settings Button - 44x44px touch target */}
        <button
          onClick={() => setCurrentView('settings')}
          className={`
            flex flex-col items-center justify-center w-20 h-11 rounded-lg transition-colors active:scale-95
            ${currentView === 'settings'
              ? 'text-[#30714C] bg-[#30714C]/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
            }
          `}
          aria-label="Settings"
          aria-current={currentView === 'settings' ? 'page' : undefined}
        >
          <Settings size={20} />
          <span className="text-xs mt-1">Settings</span>
        </button>
      </nav>

      {/* Sidebar Drawer - slides from left */}
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

            {/* Sidebar */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#061623] z-50 shadow-2xl flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="h-14 bg-[#30714C] flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-[#30714C] font-bold text-lg">A</span>
                  </div>
                  <h2 className="text-white font-semibold text-lg">AgFin</h2>
                </div>

                {/* Close Button - 44x44px touch target */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center justify-center w-11 h-11 text-white hover:bg-white/10 rounded-lg transition-colors active:scale-95"
                  aria-label="Close menu"
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

      {/* Artifact Slide-Over Modal - slides from bottom */}
      <AnimatePresence>
        {artifactPanelOpen && currentView === 'artifact' && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setArtifactPanelOpen(false)}
              aria-hidden="true"
            />

            {/* Artifact Sheet */}
            <motion.aside
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#061623] z-50 shadow-2xl flex flex-col rounded-t-2xl max-h-[85vh]"
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
                <div className="w-12 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Artifact Header */}
              <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0">
                <h3 className="text-white font-medium text-lg">Artifact</h3>

                {/* Close Button - 44x44px touch target */}
                <button
                  onClick={() => setArtifactPanelOpen(false)}
                  className="flex items-center justify-center w-11 h-11 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors active:scale-95"
                  aria-label="Close artifact"
                >
                  <ChevronUp size={24} />
                </button>
              </div>

              {/* Artifact Content */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {artifactPanel || (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/60 text-sm">Artifact content</p>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
