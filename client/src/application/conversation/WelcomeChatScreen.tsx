import { motion } from 'framer-motion';
import { Plus, Upload, Search, Wheat, Sun, Moon } from 'lucide-react';

/**
 * WelcomeChatScreen
 *
 * Enhanced welcome state for new chat sessions.
 * Features time-of-day awareness, refined agricultural aesthetics,
 * and clickable suggestion cards.
 */

export interface WelcomeChatScreenProps {
  onPromptClick?: (prompt: string) => void;
  className?: string;
}

// Get greeting based on time of day
function getTimeGreeting(): { greeting: string; icon: React.ElementType } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { greeting: 'Good morning', icon: Sun };
  } else if (hour >= 12 && hour < 17) {
    return { greeting: 'Good afternoon', icon: Sun };
  } else if (hour >= 17 && hour < 21) {
    return { greeting: 'Good evening', icon: Moon };
  } else {
    return { greeting: 'Welcome back', icon: Moon };
  }
}

interface SuggestionCardProps {
  icon: React.ElementType;
  text: string;
  prompt: string;
  description: string;
  onClick: (prompt: string) => void;
  delay: number;
}

function SuggestionCard({ icon: Icon, text, prompt, description, onClick, delay }: SuggestionCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      onClick={() => onClick(prompt)}
      className="
        group relative w-full text-left
        bg-gradient-to-br from-[#0D2233] to-[#0a1a29]
        hover:from-[#122d44] hover:to-[#0D2233]
        border border-[#1a3a52] hover:border-[#30714C]/50
        rounded-xl p-5
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-[#30714C]/50 focus:ring-offset-2 focus:ring-offset-[#061623]
      "
    >
      {/* Icon container with gradient background */}
      <div className="
        w-12 h-12 mb-4 rounded-lg
        bg-gradient-to-br from-[#30714C]/20 to-[#30714C]/5
        group-hover:from-[#30714C]/30 group-hover:to-[#30714C]/10
        flex items-center justify-center
        transition-all duration-300
      ">
        <Icon className="w-6 h-6 text-[#30714C] group-hover:scale-110 transition-transform duration-300" />
      </div>

      {/* Text */}
      <h3 className="text-white font-medium mb-1.5 group-hover:text-[#30714C] transition-colors duration-300">
        {text}
      </h3>
      <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">
        {description}
      </p>

      {/* Arrow indicator */}
      <div className="
        absolute top-5 right-5
        opacity-0 group-hover:opacity-100
        translate-x-2 group-hover:translate-x-0
        transition-all duration-300
      ">
        <svg className="w-5 h-5 text-[#30714C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>

      {/* Subtle hover glow */}
      <div className="
        absolute inset-0 rounded-xl
        bg-gradient-to-br from-[#30714C]/0 to-[#30714C]/0
        group-hover:from-[#30714C]/5 group-hover:to-transparent
        transition-all duration-500
        pointer-events-none
      " />
    </motion.button>
  );
}

const SUGGESTIONS = [
  {
    icon: Plus,
    text: 'Start a new application',
    prompt: 'I want to start a new crop loan application',
    description: 'Begin the certification application process for crop financing',
  },
  {
    icon: Upload,
    text: 'Upload documents',
    prompt: 'I need to upload a document',
    description: 'Add supporting documents like tax returns or financial statements',
  },
  {
    icon: Search,
    text: 'Check application status',
    prompt: "What's the status of my applications?",
    description: 'View progress and completion status of your loan applications',
  },
];

export function WelcomeChatScreen({ onPromptClick, className = '' }: WelcomeChatScreenProps) {
  const { greeting, icon: TimeIcon } = getTimeGreeting();

  const handlePromptClick = (prompt: string) => {
    onPromptClick?.(prompt);
  };

  return (
    <div className={`flex flex-col items-center justify-center h-full px-6 py-12 ${className}`}>
      <div className="w-full max-w-2xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          {/* Animated Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, type: 'spring', stiffness: 200 }}
            className="mb-6"
          >
            <div className="
              inline-flex items-center justify-center
              w-20 h-20 rounded-2xl
              bg-gradient-to-br from-[#30714C] to-[#245a3b]
              shadow-xl shadow-[#30714C]/30
            ">
              <Wheat className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          {/* Greeting with time awareness */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center justify-center gap-2 mb-3"
          >
            <TimeIcon className="w-5 h-5 text-[#DDC66F]" />
            <span className="text-[#DDC66F] text-sm font-medium">{greeting}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-3xl font-bold text-white mb-4"
          >
            AgFin Assistant
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed"
          >
            Your AI-powered companion for agricultural finance.
            Ask me anything or choose a suggestion below.
          </motion.p>
        </motion.div>

        {/* Suggestion Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SUGGESTIONS.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.text}
              {...suggestion}
              onClick={handlePromptClick}
              delay={0.5 + index * 0.1}
            />
          ))}
        </div>

        {/* Footer Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-10 text-center"
        >
          <p className="text-gray-500 text-sm">
            <span className="text-gray-600">Tip:</span> Press{' '}
            <kbd className="px-2 py-0.5 bg-[#0D2233] rounded text-gray-400 text-xs font-mono">
              Cmd+K
            </kbd>{' '}
            to open the command palette
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default WelcomeChatScreen;
