import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose, HelpCircle, GraduationCap, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { useOnboardingStore } from '@/application/onboarding';
import { KeyboardShortcutsHelp } from '@/shared/ui/KeyboardShortcutsHelp';
import { usePanelStore } from './usePanelStore';
import { PanelResizer } from './PanelResizer';
import {
  getSidebarVariants,
  getArtifactPanelVariants,
  toggleButtonVariants,
  contentReflowVariants,
} from './animations';
import { FormSaveProvider, useOptionalFormSaveContext } from './FormSaveContext';
import { useGlobalShortcuts } from './useGlobalShortcuts';

interface AppLayoutProps {
  children?: ReactNode;
  sidebar?: ReactNode;
  artifactPanel?: ReactNode;
  /** Optional application ID for module navigation shortcuts */
  applicationId?: string;
}

/**
 * Inner layout component that uses the FormSaveContext
 */
function AppLayoutInner({ children, sidebar, artifactPanel, applicationId }: AppLayoutProps) {
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const sidebarCollapsed = usePanelStore((state) => state.sidebarCollapsed);
  const sidebarWidth = usePanelStore((state) => state.sidebarWidth);
  const setSidebarCollapsed = usePanelStore((state) => state.setSidebarCollapsed);
  const setSidebarWidth = usePanelStore((state) => state.setSidebarWidth);
  const resetSidebarWidth = usePanelStore((state) => state.resetSidebarWidth);

  const artifactPanelOpen = usePanelStore((state) => state.artifactPanelOpen);
  const artifactPanelWidth = usePanelStore((state) => state.artifactPanelWidth);
  const setArtifactPanelOpen = usePanelStore((state) => state.setArtifactPanelOpen);
  const setArtifactPanelWidth = usePanelStore((state) => state.setArtifactPanelWidth);
  const resetArtifactPanelWidth = usePanelStore((state) => state.resetArtifactPanelWidth);

  // Get form save context for global shortcuts
  const formSaveContext = useOptionalFormSaveContext();

  // Setup global keyboard shortcuts
  useGlobalShortcuts({
    applicationId,
    onSaveActiveForm: formSaveContext?.save || undefined,
    canSave: formSaveContext?.isDirty && !formSaveContext?.isSaving,
  });

  return (
    <div className="flex h-screen w-full bg-[#061623] overflow-hidden">
      {/* Sidebar - resizable width, collapsible with animation */}
      <motion.aside
        className="flex-shrink-0 border-r border-[#0D2233] flex overflow-hidden"
        animate={{ width: sidebarCollapsed ? 0 : sidebarWidth }}
        variants={contentReflowVariants}
      >
        <motion.div
          className="h-full flex flex-col flex-1"
          initial={false}
          animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
          variants={getSidebarVariants()}
        >
          {/* Sidebar Header */}
          <div className="h-14 bg-[#30714C] flex items-center justify-between px-4 flex-shrink-0">
            <h1 className="text-white font-semibold text-lg">AgFin</h1>
            <div className="flex items-center gap-1">
              {/* Help Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                    aria-label="Help menu"
                  >
                    <HelpCircle size={20} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      const store = useOnboardingStore.getState();
                      store.resetTour();
                      store.startTour();
                    }}
                  >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Restart Feature Tour
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowKeyboardHelp(true)}>
                    <Keyboard className="w-4 h-4 mr-2" />
                    Keyboard Shortcuts
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={() => setSidebarCollapsed(true)}
                className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={20} />
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto bg-[#061623]">
            {sidebar || (
              <div className="p-4">
                <p className="text-white/60 text-sm">Sidebar content</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Resize handle */}
        {!sidebarCollapsed && (
          <PanelResizer
            direction="horizontal"
            onResize={(delta) => setSidebarWidth(sidebarWidth + delta)}
            onDoubleClick={resetSidebarWidth}
            minWidth={200}
            maxWidth={400}
          />
        )}
      </motion.aside>

      {/* Sidebar Collapse Toggle (when collapsed) with animation */}
      <AnimatePresence>
        {sidebarCollapsed && (
          <motion.button
            onClick={() => setSidebarCollapsed(false)}
            className="absolute top-4 left-4 z-10 bg-[#30714C] text-white p-2 rounded-lg hover:bg-[#3d8a5f] transition-colors shadow-lg"
            aria-label="Expand sidebar"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={toggleButtonVariants}
          >
            <ChevronRight size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Chat Center - flex-grow with min-width */}
      <main className="flex-1 min-w-0 flex flex-col bg-[#061623]">
        {/* Main Header */}
        <header className="h-14 bg-[#0D2233] border-b border-[#061623] flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-medium">Chat Center</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Placeholder for future header actions */}
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {children || (
            <div className="h-full flex items-center justify-center">
              <p className="text-white/60 text-lg">Main content area</p>
            </div>
          )}
        </div>
      </main>

      {/* Artifact Panel - resizable width, collapsible from right with animation */}
      <motion.aside
        className="flex-shrink-0 border-l border-[#0D2233] flex overflow-hidden"
        animate={{ width: !artifactPanelOpen ? 0 : artifactPanelWidth }}
        variants={contentReflowVariants}
      >
        {/* Resize handle */}
        {artifactPanelOpen && (
          <PanelResizer
            direction="horizontal"
            onResize={(delta) => setArtifactPanelWidth(artifactPanelWidth - delta)}
            onDoubleClick={resetArtifactPanelWidth}
            minWidth={300}
            maxWidth={600}
          />
        )}

        <motion.div
          className="h-full flex flex-col flex-1"
          initial={false}
          animate={artifactPanelOpen ? 'open' : 'closed'}
          variants={getArtifactPanelVariants()}
        >
          {/* Artifact Panel Content - self-contained component */}
          {artifactPanel || (
            <>
              <div className="h-14 bg-[#0D2233] border-b border-[#061623] flex items-center justify-between px-4 flex-shrink-0">
                <h3 className="text-white font-medium">Artifacts</h3>
                <button
                  onClick={() => setArtifactPanelOpen(false)}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                  aria-label="Collapse artifact panel"
                >
                  <PanelRightClose size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto bg-[#061623] p-4">
                <p className="text-white/60 text-sm">Artifact panel content</p>
              </div>
            </>
          )}
        </motion.div>
      </motion.aside>

      {/* Artifact Panel Toggle (when collapsed) with animation */}
      <AnimatePresence>
        {!artifactPanelOpen && (
          <motion.button
            onClick={() => setArtifactPanelOpen(true)}
            className="absolute top-4 right-4 z-10 bg-[#0D2233] text-white p-2 rounded-lg hover:bg-[#142d40] transition-colors shadow-lg"
            aria-label="Expand artifact panel"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={toggleButtonVariants}
          >
            <ChevronLeft size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        open={showKeyboardHelp}
        onOpenChange={setShowKeyboardHelp}
      />
    </div>
  );
}

/**
 * AppLayout Component
 *
 * Main three-column layout with global keyboard shortcut support.
 * Wraps the layout in FormSaveProvider to enable Cmd/Ctrl+S save shortcut.
 */
export function AppLayout(props: AppLayoutProps) {
  return (
    <FormSaveProvider>
      <AppLayoutInner {...props} />
    </FormSaveProvider>
  );
}
