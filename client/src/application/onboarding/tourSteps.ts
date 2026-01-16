export interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  highlightPadding?: number;
  interactivePrompt?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'chat-interface',
    targetSelector: '[data-tour="chat-input"]',
    title: 'Chat Interface',
    description: 'This is your primary workspace. Ask the AI assistant anything about loan applications, upload documents, or get help with certification tasks.',
    position: 'top',
    highlightPadding: 8,
    interactivePrompt: 'Try typing "Start a new loan application"',
  },
  {
    id: 'document-upload',
    targetSelector: '[data-tour="document-upload"]',
    title: 'Document Upload',
    description: 'Upload supporting documents here. Our AI-powered OCR will automatically extract relevant information and populate application fields.',
    position: 'left',
    highlightPadding: 12,
  },
  {
    id: 'progress-panel',
    targetSelector: '[data-tour="progress-panel"]',
    title: 'Progress Tracking',
    description: 'Track your application progress across all modules. See which sections are complete, pending review, or need attention.',
    position: 'left',
    highlightPadding: 8,
  },
  {
    id: 'audit-view',
    targetSelector: '[data-tour="audit-view"]',
    title: 'Audit & Review',
    description: 'Review extracted data, verify field values, and track the source of each piece of information for compliance.',
    position: 'bottom',
    highlightPadding: 8,
  },
];

export const TOTAL_STEPS = TOUR_STEPS.length;
