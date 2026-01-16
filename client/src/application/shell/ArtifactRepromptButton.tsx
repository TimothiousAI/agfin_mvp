import { useState } from 'react';
import { Pencil, X, Send, Loader2 } from 'lucide-react';
import { useArtifactReprompt } from './useArtifactReprompt';

interface ArtifactRepromptButtonProps {
  artifactId: string;
  onRepromptStart?: () => void;
}

export function ArtifactRepromptButton({
  artifactId,
  onRepromptStart,
}: ArtifactRepromptButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { startReprompt, canReprompt } = useArtifactReprompt();

  if (!canReprompt(artifactId)) {
    return null;
  }

  const handleSubmit = async () => {
    if (!instruction.trim()) return;

    setIsSubmitting(true);
    try {
      startReprompt(artifactId, instruction.trim());
      onRepromptStart?.();
      setIsOpen(false);
      setInstruction('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      setInstruction('');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
        aria-label="Edit with AI"
        title="Edit with AI"
      >
        <Pencil size={18} />
        <span className="text-sm hidden sm:inline">Edit</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setInstruction('');
            }}
          />

          {/* Edit dialog */}
          <div className="absolute right-0 mt-2 w-80 bg-[#0D2233] border border-[#061623] rounded-lg shadow-lg z-20">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#061623] flex items-center justify-between">
              <span className="text-white font-medium text-sm">Edit with AI</span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setInstruction('');
                }}
                className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-white/60 text-xs mb-3">
                Describe what changes you would like the AI to make to this artifact.
              </p>

              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Update the loan amount to $150,000 and change the term to 5 years..."
                className="w-full px-3 py-2 bg-[#061623] border border-[#0D2233] rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#30714C] resize-none"
                rows={3}
                autoFocus
                disabled={isSubmitting}
              />

              <div className="flex items-center justify-between mt-3">
                <span className="text-white/40 text-xs">
                  Press Enter to send
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!instruction.trim() || isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-[#30714C] text-white rounded-lg text-sm font-medium hover:bg-[#265a3d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Send to AI
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ArtifactRepromptButton;
