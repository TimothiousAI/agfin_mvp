import { useEffect, useCallback, useRef } from 'react';
import { useArtifactStore } from './useArtifactStore';
import { useArtifactFactory } from './ArtifactContent';
import type { Artifact } from './ArtifactContent';

/**
 * AI artifact metadata from chat response
 */
export interface ArtifactMetadata {
  /** Unique identifier for the artifact */
  id: string;

  /** Type of artifact */
  type: 'document' | 'extraction' | 'module_m1' | 'module_m2' | 'module_m3' | 'module_m4' | 'module_m5';

  /** Human-readable title */
  title: string;

  /** Artifact-specific data */
  data: any;

  /** Whether to auto-open in full-screen */
  openFullScreen?: boolean;

  /** Whether to replace existing artifact with same ID */
  replace?: boolean;
}

/**
 * AI message with artifact metadata
 */
export interface AIMessageWithArtifact {
  /** Message content */
  content: string;

  /** Artifact metadata (if present) */
  artifact?: ArtifactMetadata;

  /** Message ID */
  messageId?: string;

  /** Timestamp */
  timestamp?: Date;
}

/**
 * Options for artifact from chat behavior
 */
export interface ArtifactFromChatOptions {
  /** Whether to auto-scroll artifact into view */
  autoScroll?: boolean;

  /** Whether to auto-focus artifact content */
  autoFocus?: boolean;

  /** Delay before scrolling (ms) */
  scrollDelay?: number;

  /** Callback when artifact is opened */
  onArtifactOpened?: (artifact: Artifact) => void;

  /** Callback when artifact opening fails */
  onError?: (error: Error) => void;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<ArtifactFromChatOptions> = {
  autoScroll: true,
  autoFocus: true,
  scrollDelay: 300,
  onArtifactOpened: () => {},
  onError: (error) => console.error('Artifact open error:', error),
};

/**
 * Parse artifact metadata from AI response
 * Supports multiple formats:
 * 1. JSON metadata in special marker: ```artifact-metadata {...} ```
 * 2. Inline metadata: [artifact:id=...,type=...,title=...]
 * 3. Structured object (already parsed)
 */
export function parseArtifactMetadata(
  message: string | AIMessageWithArtifact
): ArtifactMetadata | null {
  // If already a structured object with artifact
  if (typeof message === 'object' && message.artifact) {
    return message.artifact;
  }

  // Parse string message
  const messageText = typeof message === 'string' ? message : message.content;

  // Format 1: JSON metadata block
  const jsonBlockMatch = messageText.match(/```artifact-metadata\s*\n([\s\S]*?)\n```/);
  if (jsonBlockMatch) {
    try {
      const metadata = JSON.parse(jsonBlockMatch[1]);
      return metadata;
    } catch (error) {
      console.error('Failed to parse artifact metadata JSON:', error);
    }
  }

  // Format 2: Inline metadata
  const inlineMatch = messageText.match(/\[artifact:([^\]]+)\]/);
  if (inlineMatch) {
    try {
      const params = inlineMatch[1].split(',').reduce((acc, pair) => {
        const [key, value] = pair.split('=').map(s => s.trim());
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      if (params.id && params.type && params.title) {
        return {
          id: params.id,
          type: params.type as any,
          title: params.title,
          data: {},
        };
      }
    } catch (error) {
      console.error('Failed to parse inline artifact metadata:', error);
    }
  }

  return null;
}

/**
 * Hook to handle artifacts triggered from AI chat
 *
 * Features:
 * - Parses artifact metadata from AI responses
 * - Auto-opens artifact panel
 * - Creates or selects artifact tab
 * - Scrolls artifact into view
 * - Focuses artifact content
 *
 * @example
 * ```tsx
 * const { handleAIMessage } = useArtifactFromChat({
 *   autoScroll: true,
 *   autoFocus: true,
 * });
 *
 * // When receiving AI message
 * handleAIMessage(aiResponse);
 * ```
 */
export function useArtifactFromChat(options: ArtifactFromChatOptions = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // Artifact store actions
  const addArtifact = useArtifactStore((state) => state.addArtifact);
  const setActiveArtifact = useArtifactStore((state) => state.setActiveArtifact);
  const enterFullScreen = useArtifactStore((state) => state.enterFullScreen);
  const isArtifactOpen = useArtifactStore((state) => state.isArtifactOpen);

  // Artifact factory
  const { createDocumentArtifact, createExtractionArtifact, createModuleArtifact } =
    useArtifactFactory();

  // Track pending scroll operations
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Scroll artifact into view
   */
  const scrollToArtifact = useCallback(
    (artifactId: string) => {
      if (!mergedOptions.autoScroll) return;

      // Clear any pending scroll
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Delay to allow DOM to update
      scrollTimeoutRef.current = setTimeout(() => {
        const artifactElement = document.querySelector(`[data-artifact-id="${artifactId}"]`);
        if (artifactElement) {
          artifactElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, mergedOptions.scrollDelay);
    },
    [mergedOptions.autoScroll, mergedOptions.scrollDelay]
  );

  /**
   * Focus artifact content
   */
  const focusArtifact = useCallback(
    (artifactId: string) => {
      if (!mergedOptions.autoFocus) return;

      // Delay to allow scroll to complete
      setTimeout(() => {
        const artifactElement = document.querySelector(
          `[data-artifact-id="${artifactId}"]`
        ) as HTMLElement;
        if (artifactElement) {
          // Try to focus the first focusable element within the artifact
          const focusableElement =
            artifactElement.querySelector<HTMLElement>(
              'input, textarea, button, [tabindex]:not([tabindex="-1"])'
            ) || artifactElement;

          focusableElement.focus();
        }
      }, mergedOptions.scrollDelay + 100);
    },
    [mergedOptions.autoFocus, mergedOptions.scrollDelay]
  );

  /**
   * Create artifact from metadata
   */
  const createArtifactFromMetadata = useCallback(
    (metadata: ArtifactMetadata): Artifact | null => {
      try {
        switch (metadata.type) {
          case 'document':
            return createDocumentArtifact(
              metadata.id,
              metadata.title,
              metadata.data.documentUrl,
              metadata.data.documentType,
              metadata.data.filename
            );

          case 'extraction':
            return createExtractionArtifact(
              metadata.id,
              metadata.title,
              metadata.data.documentId,
              metadata.data.documentType,
              metadata.data.fields,
              metadata.data.overallConfidence
            );

          case 'module_m1':
          case 'module_m2':
          case 'module_m3':
          case 'module_m4':
          case 'module_m5':
            return createModuleArtifact(
              metadata.id,
              metadata.title,
              metadata.type,
              metadata.data.initialData,
              metadata.data.fieldMetadata,
              {
                readOnly: metadata.data.readOnly,
                showConfidence: metadata.data.showConfidence,
                applicationId: metadata.data.applicationId,
              }
            );

          default:
            throw new Error(`Unknown artifact type: ${metadata.type}`);
        }
      } catch (error) {
        mergedOptions.onError(error as Error);
        return null;
      }
    },
    [createDocumentArtifact, createExtractionArtifact, createModuleArtifact, mergedOptions]
  );

  /**
   * Handle AI message and open artifact if present
   */
  const handleAIMessage = useCallback(
    (message: string | AIMessageWithArtifact) => {
      // Parse artifact metadata
      const metadata = parseArtifactMetadata(message);

      if (!metadata) {
        // No artifact in this message
        return false;
      }

      // Create artifact
      const artifact = createArtifactFromMetadata(metadata);

      if (!artifact) {
        // Failed to create artifact
        return false;
      }

      // Check if artifact already exists
      const alreadyOpen = isArtifactOpen(artifact.id);

      if (alreadyOpen && !metadata.replace) {
        // Artifact already open - just switch to it
        setActiveArtifact(artifact.id);
      } else {
        // Add new artifact (or replace existing)
        addArtifact(artifact);
      }

      // Open in full-screen if requested
      if (metadata.openFullScreen) {
        enterFullScreen(artifact.id);
      }

      // Scroll and focus
      scrollToArtifact(artifact.id);
      focusArtifact(artifact.id);

      // Callback
      mergedOptions.onArtifactOpened(artifact);

      return true;
    },
    [
      createArtifactFromMetadata,
      isArtifactOpen,
      addArtifact,
      setActiveArtifact,
      enterFullScreen,
      scrollToArtifact,
      focusArtifact,
      mergedOptions,
    ]
  );

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    handleAIMessage,
    parseArtifactMetadata,
  };
}

/**
 * Hook to automatically handle artifacts from a stream of AI messages
 * Useful for chat components that receive a stream of messages
 */
export function useArtifactStreamHandler(
  messages: AIMessageWithArtifact[],
  options: ArtifactFromChatOptions = {}
) {
  const { handleAIMessage } = useArtifactFromChat(options);
  const processedMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Process only new messages
    messages.forEach((message) => {
      const messageId = message.messageId || message.content;

      if (!processedMessageIds.current.has(messageId)) {
        processedMessageIds.current.add(messageId);

        // Handle message if it has artifact
        if (message.artifact) {
          handleAIMessage(message);
        }
      }
    });
  }, [messages, handleAIMessage]);

  return {
    processedCount: processedMessageIds.current.size,
  };
}

/**
 * Utility to manually create and open an artifact
 * Useful for testing or manual artifact creation
 */
export function useManualArtifact() {
  const addArtifact = useArtifactStore((state) => state.addArtifact);
  const enterFullScreen = useArtifactStore((state) => state.enterFullScreen);

  const openArtifact = useCallback(
    (artifact: Artifact, fullScreen = false) => {
      addArtifact(artifact);
      if (fullScreen) {
        enterFullScreen(artifact.id);
      }
    },
    [addArtifact, enterFullScreen]
  );

  return { openArtifact };
}
