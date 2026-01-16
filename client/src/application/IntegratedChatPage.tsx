import { useEffect, useCallback, useMemo } from 'react';
import { AppLayout } from './shell/AppLayout';
import { ConversationSidebar } from './shell/ConversationSidebar';
import { ChatCenter } from './shell/ChatCenter';
import { ProgressPanel } from './shell/ProgressPanel';
import { WelcomeArtifactPanel } from './shell/WelcomeArtifactPanel';
import { WelcomeChatScreen } from './conversation/WelcomeChatScreen';
import { usePanelStore } from './shell/usePanelStore';
import { useSessions, useCreateSession } from './conversation/useSessionsApi';
import { useChatHistory, useSendMessage, useStreamMessage } from './conversation/useChatApi';
import { useChatStore } from './conversation/useChatStore';
import { useSessionStore } from './conversation/useSessionStore';
import { useApplicationState, useActiveArtifact } from './useApplicationState';
import { useApplications, useApplication } from './hooks/useApplications';
import { useCommandRegistration } from '@/shared/commands/useCommandRegistration';
import { useAppCommands } from './shell/useAppCommands';
import type { DocumentProgress, ModuleProgress, Blocker } from './shell/ProgressPanel';

/**
 * IntegratedChatPage
 *
 * Main chat interface with real API connections:
 * - Real sessions from Supabase
 * - Real chat messages with SSE streaming
 * - Real application data and progress tracking
 * - Smart artifact panel (welcome/progress/document/module)
 */

export function IntegratedChatPage() {
  // Panel store for artifact panel state
  const setArtifactPanelOpen = usePanelStore((state) => state.setArtifactPanelOpen);

  // Application state management
  const {
    currentSessionId,
    currentApplicationId,
    setCurrentSession,
    setCurrentApplication,
    showDocument,
    showModule,
    showProgress,
  } = useApplicationState();

  const activeArtifact = useActiveArtifact();

  // Session store for local state
  const sessionStoreCurrentId = useSessionStore((state) => state.currentSessionId);
  const setSessionStoreCurrent = useSessionStore((state) => state.setCurrentSession);

  // Chat store for messages
  const messages = useChatStore((state) => state.messages);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const clearMessages = useChatStore((state) => state.clearMessages);
  const setIsTyping = useChatStore((state) => state.setIsTyping);

  // API Hooks - Sessions
  const { data: sessionsData } = useSessions();
  const createSession = useCreateSession();

  // API Hooks - Applications
  const { data: applicationsData } = useApplications();
  const { data: applicationDetails, isLoading: appDetailsLoading } = useApplication(
    currentApplicationId || undefined
  );

  // API Hooks - Chat
  const sendMessage = useSendMessage();

  // Load chat history when session changes
  const { isLoading: historyLoading } = useChatHistory(currentSessionId || '', {
    enabled: !!currentSessionId,
  });

  // SSE streaming
  const { startStream, stopStream, isStreaming: streamActive } = useStreamMessage(
    currentSessionId || ''
  );

  // Sync session ID with session store
  useEffect(() => {
    if (currentSessionId !== sessionStoreCurrentId) {
      setSessionStoreCurrent(currentSessionId);
    }
  }, [currentSessionId, sessionStoreCurrentId, setSessionStoreCurrent]);

  // Transform sessions data for sidebar
  const sessions = useMemo(() => {
    if (!sessionsData) return [];
    return sessionsData.map((s) => ({
      id: s.id,
      title: s.title || 'New Conversation',
      lastMessage: s.first_message || undefined,
      timestamp: new Date(s.updated_at || s.created_at),
    }));
  }, [sessionsData]);

  // Transform messages for ChatCenter
  const chatMessages = useMemo(() => {
    return messages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: new Date(m.created_at),
      isStreaming: m.isStreaming,
    }));
  }, [messages]);

  // Transform application details for ProgressPanel
  const { documents, modules, overallPercentage, blockers } = useMemo(() => {
    if (!applicationDetails) {
      return { documents: [], modules: [], overallPercentage: 0, blockers: [] };
    }

    interface DocData {
      id: string;
      document_type?: string;
      extraction_status?: string;
      uploaded_at?: string;
    }
    interface ModData {
      module_number: number;
      completion_percentage?: number;
      has_data?: boolean;
      field_count?: number;
    }

    const docs: DocumentProgress[] = (applicationDetails.documents || []).map((d: DocData) => ({
      id: d.id,
      type: d.document_type || '',
      name: d.document_type?.replace(/_/g, ' ') || 'Document',
      status: (d.extraction_status || 'empty') as DocumentProgress['status'],
      uploadedAt: d.uploaded_at,
    }));

    const mods: ModuleProgress[] = (applicationDetails.module_completion || []).map((m: ModData) => ({
      moduleNumber: m.module_number,
      name: `Module ${m.module_number}`,
      completionPercentage: m.completion_percentage || 0,
      hasData: m.has_data || false,
      fieldCount: m.field_count || 0,
    }));

    const pct = applicationDetails.completion_stats?.completion_percentage || 0;

    const blockerList: Blocker[] = [];
    if (docs.length === 0) {
      blockerList.push({
        type: 'document',
        message: 'No documents uploaded yet. Upload required documents to proceed.',
      });
    }

    return { documents: docs, modules: mods, overallPercentage: pct, blockers: blockerList };
  }, [applicationDetails]);

  // Handle new conversation
  const handleNewConversation = useCallback(async () => {
    try {
      const result = await createSession.mutateAsync({
        title: 'New Conversation',
      });
      setCurrentSession(result.id);
      clearMessages();
      setArtifactPanelOpen(true);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }, [createSession, setCurrentSession, clearMessages, setArtifactPanelOpen]);

  // Handle session selection
  const handleSelectSession = useCallback(
    (sessionId: string) => {
      setCurrentSession(sessionId);
      setArtifactPanelOpen(true);
    },
    [setCurrentSession, setArtifactPanelOpen]
  );

  // Handle send message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!currentSessionId) {
        // Create a new session first
        try {
          const result = await createSession.mutateAsync({
            title: 'New Conversation',
          });
          setCurrentSession(result.id);

          // Then send message
          await sendMessage.mutateAsync({
            sessionId: result.id,
            content,
          });

          setIsTyping(true);
          startStream(content);
        } catch (error) {
          console.error('Failed to create session and send message:', error);
        }
      } else {
        try {
          await sendMessage.mutateAsync({
            sessionId: currentSessionId,
            content,
          });

          setIsTyping(true);
          startStream(content);
        } catch (error) {
          console.error('Failed to send message:', error);
        }
      }
    },
    [currentSessionId, createSession, setCurrentSession, sendMessage, setIsTyping, startStream]
  );

  // Handle stop generation
  const handleStopGeneration = useCallback(() => {
    stopStream();
  }, [stopStream]);

  // Handle create application (from welcome panel or chat)
  const handleCreateApplication = useCallback(() => {
    // Send a message to the AI to create an application
    handleSendMessage('I want to start a new crop loan application');
  }, [handleSendMessage]);

  // Handle document click
  const handleDocumentClick = useCallback(
    (documentId: string) => {
      showDocument(documentId);
    },
    [showDocument]
  );

  // Handle module click
  const handleModuleClick = useCallback(
    (moduleNumber: number) => {
      showModule(moduleNumber);
    },
    [showModule]
  );

  // Handle prompt click from welcome screen
  const handlePromptClick = useCallback(
    (prompt: string) => {
      handleSendMessage(prompt);
    },
    [handleSendMessage]
  );

  // Register app commands
  const commands = useAppCommands({
    applicationId: currentApplicationId || undefined,
    applications: (applicationsData?.applications || []).map((a) => ({
      id: a.id,
      farmerName: a.farmer_name,
      status: a.status,
      updatedAt: new Date(a.updated_at),
    })),
    activeModule: 1,
    onUploadDocument: (type) => {
      handleSendMessage(`I need to upload a ${type} document`);
    },
    onNavigateToModule: (moduleNumber) => {
      showModule(moduleNumber);
    },
    onSelectApplication: (id) => {
      setCurrentApplication(id);
      showProgress();
    },
    onCreateApplication: handleCreateApplication,
  });

  useCommandRegistration(commands, [commands]);

  // Determine artifact panel content
  const artifactPanel = useMemo(() => {
    if (!activeArtifact || activeArtifact.type === 'welcome') {
      return <WelcomeArtifactPanel onCreateApplication={handleCreateApplication} />;
    }

    if (activeArtifact.type === 'progress' && currentApplicationId) {
      return (
        <ProgressPanel
          applicationId={currentApplicationId}
          farmerName={applicationDetails?.farmer_name}
          documents={documents}
          modules={modules}
          overallPercentage={overallPercentage}
          blockers={blockers}
          onDocumentClick={handleDocumentClick}
          onModuleClick={handleModuleClick}
          isLoading={appDetailsLoading}
        />
      );
    }

    // Default to welcome panel
    return <WelcomeArtifactPanel onCreateApplication={handleCreateApplication} />;
  }, [
    activeArtifact,
    currentApplicationId,
    applicationDetails,
    documents,
    modules,
    overallPercentage,
    blockers,
    appDetailsLoading,
    handleCreateApplication,
    handleDocumentClick,
    handleModuleClick,
  ]);

  // Sidebar content
  const sidebar = (
    <nav id="navigation" aria-label="Conversation navigation">
      <ConversationSidebar
        sessions={sessions}
        activeSessionId={currentSessionId || undefined}
        onNewConversation={handleNewConversation}
        onSelectSession={handleSelectSession}
      />
    </nav>
  );

  // Main content - either welcome screen or chat
  const mainContent = (
    <main id="main-content" tabIndex={-1} className="h-full">
      {!currentSessionId && chatMessages.length === 0 ? (
        <WelcomeChatScreen onPromptClick={handlePromptClick} />
      ) : (
        <ChatCenter
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          applicationContext={applicationDetails?.farmer_name || 'AgFin Assistant'}
          isLoading={historyLoading || sendMessage.isPending}
          isStreaming={isStreaming || streamActive}
          sessionId={currentSessionId}
        />
      )}
    </main>
  );

  return (
    <AppLayout
      sidebar={sidebar}
      artifactPanel={artifactPanel}
      applicationId={currentApplicationId || undefined}
    >
      {mainContent}
    </AppLayout>
  );
}

export default IntegratedChatPage;
