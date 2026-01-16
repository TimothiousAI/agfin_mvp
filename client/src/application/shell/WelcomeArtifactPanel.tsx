import { motion } from 'framer-motion';
import { Sprout, FileText, CheckCircle, Shield, ArrowRight } from 'lucide-react';
import { PanelRightClose } from 'lucide-react';
import { usePanelStore } from './usePanelStore';

/**
 * WelcomeArtifactPanel
 *
 * Refined agricultural welcome state for the artifact panel.
 * Shows when no application is active - warm, inviting empty state
 * with clear call-to-action and feature highlights.
 */

interface WelcomeArtifactPanelProps {
  onCreateApplication?: () => void;
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}

function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + delay, duration: 0.4 }}
      className="
        group relative
        bg-gradient-to-br from-[#0D2233]/80 to-[#061623]
        border border-[#30714C]/20 hover:border-[#30714C]/40
        rounded-xl p-4
        transition-all duration-300
        hover:shadow-lg hover:shadow-[#30714C]/5
      "
    >
      <div className="flex items-start gap-3">
        <div className="
          w-10 h-10 rounded-lg
          bg-gradient-to-br from-[#30714C]/30 to-[#30714C]/10
          flex items-center justify-center
          group-hover:from-[#30714C]/40 group-hover:to-[#30714C]/20
          transition-all duration-300
        ">
          <Icon className="w-5 h-5 text-[#30714C]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white mb-1">{title}</h4>
          <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function WelcomeArtifactPanel({ onCreateApplication }: WelcomeArtifactPanelProps) {
  const setArtifactPanelOpen = usePanelStore((state) => state.setArtifactPanelOpen);

  return (
    <div className="h-full flex flex-col bg-[#061623]">
      {/* Header */}
      <div className="h-14 bg-[#0D2233] border-b border-[#061623] flex items-center justify-between px-4 flex-shrink-0">
        <h3 className="text-white font-medium">Getting Started</h3>
        <button
          onClick={() => setArtifactPanelOpen(false)}
          className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          aria-label="Close panel"
        >
          <PanelRightClose size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Background with subtle grain texture effect */}
        <div
          className="h-full p-6 relative"
          style={{
            background: `
              linear-gradient(180deg, #0D2233 0%, #061623 100%)
            `,
          }}
        >
          {/* Decorative wheat pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5C30 5 25 15 25 25C25 35 30 40 30 40C30 40 35 35 35 25C35 15 30 5 30 5Z' fill='%23DDC66F' fill-opacity='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px',
            }}
          />

          <div className="relative z-10 space-y-8">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4"
            >
              {/* Animated Sprout Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4, type: 'spring' }}
                className="
                  w-20 h-20 mx-auto
                  bg-gradient-to-br from-[#30714C]/30 to-[#30714C]/10
                  rounded-2xl
                  flex items-center justify-center
                  shadow-lg shadow-[#30714C]/10
                  border border-[#30714C]/20
                "
              >
                <Sprout className="w-10 h-10 text-[#30714C]" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <h2 className="text-xl font-semibold text-white mb-2">
                  Ready to Grow
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                  Start a new loan application or ask the assistant for guidance on crop financing.
                </p>
              </motion.div>
            </motion.div>

            {/* Feature Cards */}
            <div className="space-y-3">
              <FeatureCard
                icon={FileText}
                title="Document Upload"
                description="9 document types supported with smart extraction"
                delay={0}
              />
              <FeatureCard
                icon={CheckCircle}
                title="Progress Tracking"
                description="Real-time completion status across all modules"
                delay={0.1}
              />
              <FeatureCard
                icon={Shield}
                title="Audit Ready"
                description="Full compliance trail with field provenance"
                delay={0.2}
              />
            </div>

            {/* CTA Button */}
            {onCreateApplication && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <button
                  onClick={onCreateApplication}
                  className="
                    w-full group
                    bg-gradient-to-r from-[#30714C] to-[#3d8a5f]
                    hover:from-[#3d8a5f] hover:to-[#4a9d6c]
                    text-white font-medium
                    py-3 px-4 rounded-xl
                    flex items-center justify-center gap-2
                    transition-all duration-300
                    shadow-lg shadow-[#30714C]/20
                    hover:shadow-xl hover:shadow-[#30714C]/30
                  "
                >
                  <span>Create Application</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            )}

            {/* Tip Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="
                bg-[#DDC66F]/5 border border-[#DDC66F]/20
                rounded-lg p-4
              "
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#DDC66F]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#DDC66F] text-xs font-bold">?</span>
                </div>
                <div>
                  <p className="text-xs text-[#DDC66F]/90 font-medium mb-1">Quick Tip</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Ask the assistant "What documents do I need?" to see the full checklist for crop loan applications.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeArtifactPanel;
