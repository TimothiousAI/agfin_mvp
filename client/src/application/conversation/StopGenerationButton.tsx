import { Square } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

/**
 * StopGenerationButton Component
 *
 * Displays a stop button during AI response streaming.
 * Shows tooltip with Escape keyboard shortcut hint.
 */

export interface StopGenerationButtonProps {
  /** Callback to stop generation */
  onStop: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
}

export function StopGenerationButton({ onStop, disabled = false }: StopGenerationButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          onClick={onStop}
          disabled={disabled}
          className="gap-2"
          aria-label="Stop generation (Escape)"
        >
          <Square size={14} className="fill-current" />
          <span>Stop</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Stop generation</p>
        <p className="text-white/60 text-xs">Press Escape</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default StopGenerationButton;
