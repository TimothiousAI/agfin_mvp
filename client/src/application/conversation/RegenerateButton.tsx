import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

/**
 * RegenerateButton Component
 *
 * Displays a button to regenerate the last AI response.
 * Shows on completed assistant messages to request a new response.
 */

export interface RegenerateButtonProps {
  /** Callback to regenerate the response */
  onRegenerate: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether regeneration is in progress */
  loading?: boolean;
}

export function RegenerateButton({
  onRegenerate,
  disabled = false,
  loading = false
}: RegenerateButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          disabled={disabled || loading}
          loading={loading}
          className="gap-2 text-white/60 hover:text-white"
          aria-label="Regenerate response"
        >
          <RefreshCw size={14} />
          <span>Regenerate</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Generate a new response</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default RegenerateButton;
