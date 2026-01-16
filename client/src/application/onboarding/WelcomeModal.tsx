import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { MessageSquare, Upload, BarChart3, CheckCircle2, Play, X } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTour: () => void;
  onSkip: () => void;
}

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Chat Interface',
    description: 'Conversational AI assistant for all tasks',
  },
  {
    icon: Upload,
    title: 'Smart Documents',
    description: 'AI-powered OCR extracts data automatically',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Real-time visibility into application status',
  },
  {
    icon: CheckCircle2,
    title: 'Audit Trail',
    description: 'Complete traceability for compliance',
  },
];

export function WelcomeModal({
  open,
  onOpenChange,
  onStartTour,
  onSkip,
}: WelcomeModalProps) {
  const handleStartTour = () => {
    onOpenChange(false);
    onStartTour();
  };

  const handleSkip = () => {
    onOpenChange(false);
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          {/* Logo */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-[#30714C] flex items-center justify-center">
            <span className="text-2xl font-bold text-white">Ag</span>
          </div>

          <DialogTitle className="text-2xl">Welcome to AgFin</DialogTitle>
          <DialogDescription className="text-base">
            Your AI-powered crop loan application platform
          </DialogDescription>
        </DialogHeader>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-3 py-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
            >
              <feature.icon className="w-5 h-5 text-[#30714C] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-[#061623]">
                  {feature.title}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Time estimate */}
        <p className="text-center text-sm text-gray-500 mb-4">
          Take a quick 30-second tour to get started
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleStartTour}
            className="w-full bg-[#30714C] hover:bg-[#25563A] flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start Tour
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full text-gray-500 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Skip for Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
