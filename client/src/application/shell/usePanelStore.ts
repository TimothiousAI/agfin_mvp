import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Artifact {
  id: string;
  type: 'code' | 'document' | 'image' | 'data';
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PanelState {
  // Sidebar state
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  resetSidebarWidth: () => void;

  // Artifact panel state
  artifactPanelOpen: boolean;
  artifactPanelWidth: number;
  toggleArtifactPanel: () => void;
  setArtifactPanelOpen: (open: boolean) => void;
  setArtifactPanelWidth: (width: number) => void;
  resetArtifactPanelWidth: () => void;

  // Active artifact tracking
  activeArtifactId: string | null;
  artifacts: Artifact[];
  setActiveArtifact: (artifactId: string | null) => void;
  addArtifact: (artifact: Artifact) => void;
  removeArtifact: (artifactId: string) => void;
  updateArtifact: (artifactId: string, updates: Partial<Artifact>) => void;
  reorderArtifacts: (artifactIds: string[]) => void;
  clearArtifacts: () => void;
}

// Load initial state from localStorage
const loadPersistedState = () => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('agfin-panel-storage');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Default widths
const DEFAULT_SIDEBAR_WIDTH = 280;
const DEFAULT_ARTIFACT_PANEL_WIDTH = 400;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 400;
const MIN_ARTIFACT_PANEL_WIDTH = 300;
const MAX_ARTIFACT_PANEL_WIDTH = 600;

// Save state to localStorage
const saveToLocalStorage = (state: Partial<PanelState>) => {
  if (typeof window === 'undefined') return;
  try {
    const toSave = {
      sidebarCollapsed: state.sidebarCollapsed,
      sidebarWidth: state.sidebarWidth,
      artifactPanelOpen: state.artifactPanelOpen,
      artifactPanelWidth: state.artifactPanelWidth,
    };
    localStorage.setItem('agfin-panel-storage', JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const persistedState = loadPersistedState();

export const usePanelStore = create<PanelState>((set, get) => ({
  // Initial state (load from localStorage if available)
  sidebarCollapsed: persistedState.sidebarCollapsed ?? false,
  sidebarWidth: persistedState.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH,
  artifactPanelOpen: persistedState.artifactPanelOpen ?? false,
  artifactPanelWidth: persistedState.artifactPanelWidth ?? DEFAULT_ARTIFACT_PANEL_WIDTH,
  activeArtifactId: null,
  artifacts: [],

  // Sidebar actions
  toggleSidebar: () => {
    const newCollapsed = !get().sidebarCollapsed;
    set({ sidebarCollapsed: newCollapsed });
    saveToLocalStorage({ ...get(), sidebarCollapsed: newCollapsed });
  },
  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
    saveToLocalStorage({ ...get(), sidebarCollapsed: collapsed });
  },
  setSidebarWidth: (width: number) => {
    const clampedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, width));
    set({ sidebarWidth: clampedWidth });
    saveToLocalStorage({ ...get(), sidebarWidth: clampedWidth });
  },
  resetSidebarWidth: () => {
    set({ sidebarWidth: DEFAULT_SIDEBAR_WIDTH });
    saveToLocalStorage({ ...get(), sidebarWidth: DEFAULT_SIDEBAR_WIDTH });
  },

  // Artifact panel actions
  toggleArtifactPanel: () => {
    const newOpen = !get().artifactPanelOpen;
    set({ artifactPanelOpen: newOpen });
    saveToLocalStorage({ ...get(), artifactPanelOpen: newOpen });
  },
  setArtifactPanelOpen: (open: boolean) => {
    set({ artifactPanelOpen: open });
    saveToLocalStorage({ ...get(), artifactPanelOpen: open });
  },
  setArtifactPanelWidth: (width: number) => {
    const clampedWidth = Math.max(MIN_ARTIFACT_PANEL_WIDTH, Math.min(MAX_ARTIFACT_PANEL_WIDTH, width));
    set({ artifactPanelWidth: clampedWidth });
    saveToLocalStorage({ ...get(), artifactPanelWidth: clampedWidth });
  },
  resetArtifactPanelWidth: () => {
    set({ artifactPanelWidth: DEFAULT_ARTIFACT_PANEL_WIDTH });
    saveToLocalStorage({ ...get(), artifactPanelWidth: DEFAULT_ARTIFACT_PANEL_WIDTH });
  },

  // Artifact management
  setActiveArtifact: (artifactId: string | null) => {
    set({ activeArtifactId: artifactId });
    // Auto-open artifact panel when an artifact is selected
    if (artifactId !== null) {
      const state = get();
      saveToLocalStorage({ ...state, artifactPanelOpen: true });
      set({ artifactPanelOpen: true });
    }
  },

  addArtifact: (artifact: Artifact) =>
    set((state) => ({
      artifacts: [...state.artifacts, artifact],
      activeArtifactId: artifact.id,
      artifactPanelOpen: true,
    })),

  removeArtifact: (artifactId: string) =>
    set((state) => {
      const newArtifacts = state.artifacts.filter((a) => a.id !== artifactId);
      return {
        artifacts: newArtifacts,
        activeArtifactId:
          state.activeArtifactId === artifactId
            ? newArtifacts[0]?.id || null
            : state.activeArtifactId,
      };
    }),

  updateArtifact: (artifactId: string, updates: Partial<Artifact>) =>
    set((state) => ({
      artifacts: state.artifacts.map((artifact) =>
        artifact.id === artifactId
          ? { ...artifact, ...updates, updatedAt: new Date() }
          : artifact
      ),
    })),

  reorderArtifacts: (artifactIds: string[]) =>
    set((state) => {
      const artifactMap = new Map(state.artifacts.map((a) => [a.id, a]));
      const reorderedArtifacts = artifactIds
        .map((id) => artifactMap.get(id))
        .filter((a): a is Artifact => a !== undefined);
      return { artifacts: reorderedArtifacts };
    }),

  clearArtifacts: () =>
    set({
      artifacts: [],
      activeArtifactId: null,
      artifactPanelOpen: false,
    }),
}));

// Keyboard shortcut hook - must be used in a useEffect
export function setupPanelKeyboardShortcuts() {
  const toggleSidebar = usePanelStore.getState().toggleSidebar;

  const handleKeyDown = (event: KeyboardEvent) => {
    // Cmd+\ or Ctrl+\ to toggle sidebar
    if ((event.metaKey || event.ctrlKey) && event.key === '\\') {
      event.preventDefault();
      toggleSidebar();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }

  return () => {};
}
