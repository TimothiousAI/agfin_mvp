/**
 * WelcomeScreen Component
 *
 * Displays an empty chat state with:
 * - Agrellus logo centered
 * - Welcome message
 * - Suggested prompts as clickable cards
 * - Fade in animation
 */

export interface WelcomeScreenProps {
  /** Callback when a suggested prompt is clicked */
  onPromptClick?: (prompt: string) => void;
  /** Optional className for additional styling */
  className?: string;
}

const SUGGESTED_PROMPTS = [
  {
    id: 'new-application',
    text: 'Start a new loan application',
    icon: '📝',
    description: 'Begin the certification application process',
  },
  {
    id: 'upload-document',
    text: 'Upload a document',
    icon: '📄',
    description: 'Upload supporting documents for review',
  },
  {
    id: 'check-status',
    text: 'Check application status',
    icon: '📊',
    description: 'View the status of your current applications',
  },
];

export function WelcomeScreen({ onPromptClick, className = '' }: WelcomeScreenProps) {
  const handlePromptClick = (prompt: string) => {
    onPromptClick?.(prompt);
  };

  return (
    <div
      className={`
        flex flex-col items-center justify-center h-full px-8 py-12
        animate-fade-in
        ${className}
      `}
    >
      {/* Logo */}
      <div className="mb-8">
        <div className="text-5xl font-bold text-[#30714C] mb-2">
          Agrellus
        </div>
        <div className="text-lg text-[#DDC66F] text-center">
          AgFin Assistant
        </div>
      </div>

      {/* Welcome Message */}
      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-3xl font-semibold text-white mb-4">
          Welcome to AgFin Assistant
        </h1>
        <p className="text-gray-400 text-lg">
          Your AI-powered companion for agricultural finance certification.
          Ask me anything or choose a suggestion below to get started.
        </p>
      </div>

      {/* Suggested Prompts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
        {SUGGESTED_PROMPTS.map((prompt, index) => (
          <button
            key={prompt.id}
            onClick={() => handlePromptClick(prompt.text)}
            className="
              group relative
              bg-[#0D2233] hover:bg-[#152D44]
              border border-gray-700 hover:border-[#30714C]
              rounded-lg p-6
              transition-all duration-200
              text-left
              focus:outline-none focus:ring-2 focus:ring-[#30714C] focus:ring-offset-2 focus:ring-offset-[#061623]
              animate-slide-up
            "
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'backwards',
            }}
          >
            {/* Icon */}
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
              {prompt.icon}
            </div>

            {/* Text */}
            <div className="text-white font-medium mb-2 group-hover:text-[#30714C] transition-colors">
              {prompt.text}
            </div>

            {/* Description */}
            <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
              {prompt.description}
            </div>

            {/* Arrow indicator */}
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg
                className="w-5 h-5 text-[#30714C]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Tip: You can start typing at any time to begin a conversation
        </p>
      </div>
    </div>
  );
}

export default WelcomeScreen;
