import { useCallback } from 'react';
import { useChatStore } from '../conversation/useChatStore';
import { useArtifactStore } from './useArtifactStore';
import type { Artifact } from './ArtifactContent';

/**
 * Generate a context-aware prompt for editing an artifact
 */
function generateRepromptContext(artifact: Artifact): string {
  const typeLabel = getArtifactTypeLabel(artifact.type);

  let context = `I'd like to modify the ${typeLabel} "${artifact.title}".\n\n`;
  context += `Current data:\n`;
  context += '```json\n';
  context += JSON.stringify(artifact.data, null, 2);
  context += '\n```\n\n';
  context += 'Please help me update: ';

  return context;
}

function getArtifactTypeLabel(type: string): string {
  switch (type) {
    case 'document':
      return 'document';
    case 'extraction':
      return 'extracted data';
    case 'module_m1':
      return 'Identity & KYC module';
    case 'module_m2':
      return 'Lands & Collateral module';
    case 'module_m3':
      return 'Financial module';
    case 'module_m4':
      return 'Operations module';
    case 'module_m5':
      return 'Summary module';
    default:
      return 'artifact';
  }
}

interface UseArtifactRepromptReturn {
  /** Start a re-prompt session for an artifact */
  startReprompt: (artifactId: string, userInstruction?: string) => void;
  /** Generate context string for an artifact */
  getRepromptContext: (artifactId: string) => string | null;
  /** Check if re-prompt is supported for artifact type */
  canReprompt: (artifactId: string) => boolean;
}

export function useArtifactReprompt(): UseArtifactRepromptReturn {
  const { sendMessage } = useChatStore();
  const { getArtifact, createVersion } = useArtifactStore();

  const canReprompt = useCallback((artifactId: string): boolean => {
    const artifact = getArtifact(artifactId);
    if (!artifact) return false;

    // Document type artifacts cannot be re-prompted (they are source files)
    if (artifact.type === 'document') return false;

    return true;
  }, [getArtifact]);

  const getRepromptContext = useCallback((artifactId: string): string | null => {
    const artifact = getArtifact(artifactId);
    if (!artifact || !canReprompt(artifactId)) return null;

    return generateRepromptContext(artifact);
  }, [getArtifact, canReprompt]);

  const startReprompt = useCallback((artifactId: string, userInstruction?: string) => {
    const artifact = getArtifact(artifactId);
    if (!artifact || !canReprompt(artifactId)) {
      console.warn(`Cannot re-prompt artifact ${artifactId}`);
      return;
    }

    // Create a version snapshot before re-prompting
    createVersion(artifactId, 'Pre-reprompt snapshot', 'proxy_edited');

    // Generate the re-prompt message
    const context = generateRepromptContext(artifact);
    const message = userInstruction
      ? `${context}${userInstruction}`
      : context;

    // Send the message to the chat
    sendMessage(message, 'user');
  }, [getArtifact, canReprompt, createVersion, sendMessage]);

  return {
    startReprompt,
    getRepromptContext,
    canReprompt,
  };
}

export default useArtifactReprompt;
