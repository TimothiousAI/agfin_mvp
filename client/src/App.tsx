import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, useState, useMemo, memo, useEffect } from 'react';
import { useAuth } from './auth/index';
import { ProtectedRoute, LoadingScreen } from './auth/ProtectedRoute';
import { SkipLinks, AnnouncerProvider } from './shared/accessibility';
import { lazyWithRetry, PerformanceMonitor, prefetchRoute } from './shared/performance';
import { CommandPaletteProvider } from './shared/commands/CommandPaletteProvider';
import { useCommandRegistration } from './shared/commands/useCommandRegistration';
import { useAppCommands } from './application/shell/useAppCommands';
import { TourProvider } from './application/onboarding';

// Lazy load components for better code splitting
// Main pages
const SignInPage = lazyWithRetry(() => import('./auth/sign-in/SignInPage').then(m => ({ default: m.SignInPage })), 'SignInPage');

// Test pages (low priority, only load when needed)
const FormComponentsTest = lazyWithRetry(() => import('./test/FormComponentsTest').then(m => ({ default: m.FormComponentsTest })), 'FormComponentsTest');
const AlertToastTest = lazyWithRetry(() => import('./test/AlertToastTest').then(m => ({ default: m.AlertToastTest })), 'AlertToastTest');
const BadgeTest = lazyWithRetry(() => import('./test/BadgeTest').then(m => ({ default: m.BadgeTest })), 'BadgeTest');
const DialogTest = lazyWithRetry(() => import('./test/DialogTest').then(m => ({ default: m.DialogTest })), 'DialogTest');
const DropdownMenuTest = lazyWithRetry(() => import('./test/DropdownMenuTest').then(m => ({ default: m.DropdownMenuTest })), 'DropdownMenuTest');
const MotionTest = lazyWithRetry(() => import('./test/MotionTest').then(m => ({ default: m.MotionTest })), 'MotionTest');
const M2FormTest = lazyWithRetry(() => import('./test/M2FormTest').then(m => ({ default: m.M2FormTest })), 'M2FormTest');
const M3FormTest = lazyWithRetry(() => import('./test/M3FormTest').then(m => ({ default: m.M3FormTest })), 'M3FormTest');
const M1FormTest = lazyWithRetry(() => import('./test/M1FormTest').then(m => ({ default: m.M1FormTest })), 'M1FormTest');
const CommandPaletteTest = lazyWithRetry(() => import('./test/CommandPaletteTest').then(m => ({ default: m.CommandPaletteTest })), 'CommandPaletteTest');
const CommandRegistryTest = lazyWithRetry(() => import('./test/CommandRegistryTest').then(m => ({ default: m.CommandRegistryTest })), 'CommandRegistryTest');
const AutoSaveTest = lazyWithRetry(() => import('./test/AutoSaveTest').then(m => ({ default: m.AutoSaveTest })), 'AutoSaveTest');
const PersistenceTest = lazyWithRetry(() => import('./test/PersistenceTest').then(m => ({ default: m.PersistenceTest })), 'PersistenceTest');
const SkeletonTest = lazyWithRetry(() => import('./test/SkeletonTest').then(m => ({ default: m.SkeletonTest })), 'SkeletonTest');
const FieldIndicatorsTest = lazyWithRetry(() => import('./test/FieldIndicatorsTest').then(m => ({ default: m.FieldIndicatorsTest })), 'FieldIndicatorsTest');

// Chat page components (loaded eagerly for shell, defer heavy components)
import { AppLayout } from './application/shell/AppLayout';
import { ConversationSidebar } from './application/shell/ConversationSidebar';
import { ChatCenter } from './application/shell/ChatCenter';
import { ArtifactPanel, ArtifactContent } from './application/shell/ArtifactPanel';
import { usePanelStore } from './application/shell/usePanelStore';

function App() {
  // Prefetch likely next views on idle
  useEffect(() => {
    const timer = setTimeout(() => {
      // Prefetch sign-in page for unauthenticated users
      prefetchRoute(() => import('./auth/sign-in/SignInPage'));
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnnouncerProvider>
      <BrowserRouter>
        <CommandPaletteProvider>
          <SkipLinks />
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/chat" element={<ProtectedRoute><TourProvider><ChatPage /></TourProvider></ProtectedRoute>} />
              <Route path="/app" element={<ProtectedRoute><TourProvider><ChatPage /></TourProvider></ProtectedRoute>} />
              <Route path="/test/forms" element={<FormComponentsTest />} />
              <Route path="/test/alerts" element={<AlertToastTest />} />
              <Route path="/test/badges" element={<BadgeTest />} />
              <Route path="/test/dialog" element={<DialogTest />} />
              <Route path="/test/dropdown" element={<DropdownMenuTest />} />
              <Route path="/test/motion" element={<MotionTest />} />
              <Route path="/test/m2-form" element={<M2FormTest />} />
              <Route path="/test/m3-form" element={<M3FormTest />} />
              <Route path="/test/m1-form" element={<M1FormTest />} />
              <Route path="/test/command-palette" element={<CommandPaletteTest />} />
              <Route path="/test/command-registry" element={<CommandRegistryTest />} />
              <Route path="/test/auto-save" element={<AutoSaveTest />} />
              <Route path="/test/persistence" element={<PersistenceTest />} />
              <Route path="/test/skeleton" element={<SkeletonTest />} />
              <Route path="/test/field-indicators" element={<FieldIndicatorsTest />} />
              <Route path="/" element={<RootRedirect />} />
            </Routes>
          </Suspense>
        </CommandPaletteProvider>
      </BrowserRouter>
    </AnnouncerProvider>
  );
}

function RootRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <LoadingScreen />;
  return <Navigate to={isSignedIn ? '/chat' : '/sign-in'} replace />;
}

// Memoize ChatPage to prevent unnecessary re-renders
const ChatPage = memo(function ChatPage() {
  const { user: _user, signOut: _signOut } = useAuth();
  const setArtifactPanelOpen = usePanelStore((state) => state.setArtifactPanelOpen);

  // Track page mount performance
  useEffect(() => {
    PerformanceMonitor.markStart('chat-page-mount');
    return () => {
      PerformanceMonitor.markEnd('chat-page-mount');
    };
  }, []);

  // Mock conversation sessions for demo (memoized to avoid Date.now() in render)
  const mockSessions = useMemo(() => {
    const now = Date.now();
    return [
      {
        id: '1',
        title: 'Farm Loan Application',
        lastMessage: 'What documents do I need?',
        timestamp: new Date(now - 3600000), // 1 hour ago
      },
      {
        id: '2',
        title: 'Equipment Financing',
        lastMessage: 'Tell me about interest rates',
        timestamp: new Date(now - 86400000), // 1 day ago
      },
      {
        id: '3',
        title: 'Crop Insurance Questions',
        lastMessage: 'How does coverage work?',
        timestamp: new Date(now - 172800000), // 2 days ago
      },
    ];
  }, []);

  // Get application-specific commands
  const commands = useAppCommands({
    applicationId: '1', // Would come from actual app state
    applications: mockSessions.map(s => ({
      id: s.id,
      farmerName: s.title,
      status: 'draft' as const,
      updatedAt: s.timestamp,
    })),
    activeModule: 1,
    onUploadDocument: (type) => {
      console.log('Upload document:', type);
      // Trigger document upload UI
    },
    onNavigateToModule: (moduleNumber) => {
      console.log('Navigate to module:', moduleNumber);
      // Update artifact panel to show module form
    },
    onSelectApplication: (id) => {
      console.log('Select application:', id);
      // Switch to selected application
    },
    onCreateApplication: () => {
      console.log('Create new application');
      // Open new application flow
    },
  });

  // Register commands
  useCommandRegistration(commands, [commands]);

  // Mock chat messages (memoized initial state)
  const initialMessages = useMemo(() => {
    const now = Date.now();
    return [
      {
        id: '1',
        role: 'user' as const,
        content: 'What documents do I need for a farm loan?',
        timestamp: new Date(now - 600000),
      },
      {
        id: '2',
        role: 'assistant' as const,
        content: 'For a farm loan application, you\'ll typically need:\n\n1. Financial statements (last 3 years)\n2. Tax returns (personal and business)\n3. Current balance sheet\n4. Farm operation plan\n5. Collateral documentation\n\nWould you like more details on any of these?',
        timestamp: new Date(now - 580000),
      },
    ];
  }, []);

  const [messages, setMessages] = useState(initialMessages);

  const handleSendMessage = (content: string) => {
    PerformanceMonitor.markStart('send-message');
    const newMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: new Date(),
    };
    setMessages([...messages, newMessage]);
    PerformanceMonitor.markEnd('send-message');
  };

  // Sidebar content - use ConversationSidebar component
  const sidebar = (
    <nav id="navigation" aria-label="Conversation navigation">
      <ConversationSidebar
        sessions={mockSessions}
        activeSessionId="1"
        onNewConversation={() => console.log('New conversation clicked')}
        onSelectSession={(id) => console.log('Selected session:', id)}
      />
    </nav>
  );

  // Main content - use ChatCenter
  const mainContent = (
    <main id="main-content" tabIndex={-1}>
      <ChatCenter
        messages={messages}
        onSendMessage={handleSendMessage}
        applicationContext="Farm Loan Application"
      />
    </main>
  );

  // Mock artifacts for demo
  const mockArtifacts = [
    {
      id: '1',
      title: 'Loan Requirements',
      type: 'document' as const,
      content: (
        <ArtifactContent>
          <h3 className="text-white font-semibold mb-3">Farm Loan Requirements</h3>
          <ul className="space-y-2 text-sm">
            <li>• Financial statements (last 3 years)</li>
            <li>• Tax returns (personal and business)</li>
            <li>• Current balance sheet</li>
            <li>• Farm operation plan</li>
            <li>• Collateral documentation</li>
            <li>• Credit history report</li>
          </ul>
        </ArtifactContent>
      ),
    },
    {
      id: '2',
      title: 'Interest Rates',
      type: 'chart' as const,
      content: (
        <ArtifactContent>
          <h3 className="text-white font-semibold mb-3">Current Interest Rates</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-[#061623] rounded">
              <span>Farm Loan (5 year)</span>
              <span className="text-[#30714C] font-semibold">5.25%</span>
            </div>
            <div className="flex justify-between p-2 bg-[#061623] rounded">
              <span>Equipment Financing</span>
              <span className="text-[#30714C] font-semibold">6.50%</span>
            </div>
            <div className="flex justify-between p-2 bg-[#061623] rounded">
              <span>Land Purchase</span>
              <span className="text-[#30714C] font-semibold">5.75%</span>
            </div>
          </div>
        </ArtifactContent>
      ),
    },
  ];

  // Artifact panel content - use ArtifactPanel component
  const artifactPanel = (
    <ArtifactPanel
      artifacts={mockArtifacts}
      activeArtifactId="1"
      onSelectArtifact={(id) => console.log('Selected artifact:', id)}
      onCloseArtifact={(id) => console.log('Closed artifact:', id)}
      onReorderArtifacts={(ids) => console.log('Reordered artifacts:', ids)}
      onClose={() => setArtifactPanelOpen(false)}
    />
  );

  return (
    <AppLayout sidebar={sidebar} artifactPanel={artifactPanel}>
      {mainContent}
    </AppLayout>
  );
});

export default App
