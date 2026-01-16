import { motion, AnimatePresence } from 'framer-motion';
import {
  PanelRightClose,
  CheckCircle2,
  Circle,
  AlertCircle,
  FileText,
  User,
  Map,
  DollarSign,
  BarChart3,
  Calculator,
  Loader2,
} from 'lucide-react';
import { usePanelStore } from './usePanelStore';

/**
 * ProgressPanel
 *
 * Shows real-time application progress with:
 * - Overall completion percentage with organic animation
 * - Document upload status grid
 * - Module completion checklist
 * - Blocker indicators
 */

export interface DocumentProgress {
  id: string;
  type: string;
  name: string;
  status: 'empty' | 'uploaded' | 'processing' | 'processed' | 'audited';
  uploadedAt?: string;
}

export interface ModuleProgress {
  moduleNumber: number;
  name: string;
  completionPercentage: number;
  hasData: boolean;
  fieldCount: number;
}

export interface Blocker {
  type: 'document' | 'module' | 'audit';
  message: string;
  actionLabel?: string;
}

export interface ProgressPanelProps {
  applicationId: string;
  farmerName?: string;
  documents?: DocumentProgress[];
  modules?: ModuleProgress[];
  overallPercentage?: number;
  blockers?: Blocker[];
  onDocumentClick?: (documentId: string) => void;
  onModuleClick?: (moduleNumber: number) => void;
  isLoading?: boolean;
}

// Module icons and metadata
const MODULE_CONFIG = [
  { number: 1, name: 'Identity', shortName: 'M1', icon: User },
  { number: 2, name: 'Lands', shortName: 'M2', icon: Map },
  { number: 3, name: 'Financial', shortName: 'M3', icon: DollarSign },
  { number: 4, name: 'Operations', shortName: 'M4', icon: BarChart3 },
  { number: 5, name: 'Summary', shortName: 'M5', icon: Calculator },
];

function CircularProgress({ percentage, size = 120 }: { percentage: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1a3a52"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#30714C" />
            <stop offset="100%" stopColor="#4a9d6c" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {Math.round(percentage)}%
        </motion.span>
        <span className="text-xs text-gray-400">Complete</span>
      </div>
    </div>
  );
}

function DocumentStatusIcon({ status }: { status: DocumentProgress['status'] }) {
  switch (status) {
    case 'audited':
      return <CheckCircle2 className="w-4 h-4 text-purple-400" />;
    case 'processed':
      return <CheckCircle2 className="w-4 h-4 text-[#30714C]" />;
    case 'processing':
      return <Loader2 className="w-4 h-4 text-[#DDC66F] animate-spin" />;
    case 'uploaded':
      return <Circle className="w-4 h-4 text-blue-400 fill-blue-400/20" />;
    default:
      return <Circle className="w-4 h-4 text-gray-500" />;
  }
}

function ModuleStatusIcon({ percentage }: { percentage: number }) {
  if (percentage >= 100) {
    return <CheckCircle2 className="w-4 h-4 text-[#30714C]" />;
  } else if (percentage > 0) {
    return <Circle className="w-4 h-4 text-[#DDC66F] fill-[#DDC66F]/20" />;
  }
  return <Circle className="w-4 h-4 text-gray-500" />;
}

export function ProgressPanel({
  applicationId,
  farmerName,
  documents = [],
  modules = [],
  overallPercentage = 0,
  blockers = [],
  onDocumentClick,
  onModuleClick,
  isLoading = false,
}: ProgressPanelProps) {
  // applicationId is available for future data-fetching or linking features
  void applicationId;
  const setArtifactPanelOpen = usePanelStore((state) => state.setArtifactPanelOpen);

  // Calculate document stats
  const uploadedDocs = documents.filter((d) => d.status !== 'empty').length;
  const totalDocs = documents.length || 9; // Default 9 document types

  // Calculate module stats
  const completedModules = modules.filter((m) => m.completionPercentage >= 100).length;
  const totalModules = 5;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-[#061623]">
        <div className="h-14 bg-[#0D2233] border-b border-[#061623] flex items-center justify-between px-4 flex-shrink-0">
          <h3 className="text-white font-medium">Progress</h3>
          <button
            onClick={() => setArtifactPanelOpen(false)}
            className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          >
            <PanelRightClose size={20} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#30714C] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#061623]">
      {/* Header */}
      <div className="h-14 bg-[#0D2233] border-b border-[#061623] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-medium">Progress</h3>
          {farmerName && (
            <span className="text-gray-400 text-sm truncate max-w-[150px]">
              - {farmerName}
            </span>
          )}
        </div>
        <button
          onClick={() => setArtifactPanelOpen(false)}
          className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          aria-label="Close panel"
        >
          <PanelRightClose size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Overall Progress Circle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center py-4"
        >
          <CircularProgress percentage={overallPercentage} />
          <p className="mt-3 text-sm text-gray-400">Application Progress</p>
        </motion.div>

        {/* Blockers */}
        <AnimatePresence>
          {blockers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {blockers.map((blocker, index) => (
                <div
                  key={index}
                  className="
                    flex items-start gap-2 p-3
                    bg-red-500/10 border border-red-500/20 rounded-lg
                  "
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{blocker.message}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Documents Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Documents
            </h4>
            <span className="text-xs text-gray-400">
              {uploadedDocs}/{totalDocs}
            </span>
          </div>

          {/* Document Progress Bar */}
          <div className="h-2 bg-[#0D2233] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#30714C] to-[#4a9d6c]"
              initial={{ width: 0 }}
              animate={{ width: `${(uploadedDocs / totalDocs) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>

          {/* Document List */}
          <div className="space-y-1">
            {documents.slice(0, 6).map((doc, index) => (
              <motion.button
                key={doc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onDocumentClick?.(doc.id)}
                className="
                  w-full flex items-center justify-between
                  p-2 rounded-lg
                  hover:bg-[#0D2233] transition-colors
                  text-left group
                "
              >
                <div className="flex items-center gap-2 min-w-0">
                  <DocumentStatusIcon status={doc.status} />
                  <span className="text-sm text-gray-300 truncate group-hover:text-white transition-colors">
                    {doc.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500 capitalize">{doc.status}</span>
              </motion.button>
            ))}
            {documents.length > 6 && (
              <button className="w-full text-xs text-gray-400 hover:text-white py-2 transition-colors">
                View all {documents.length} documents
              </button>
            )}
          </div>
        </div>

        {/* Modules Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              Modules
            </h4>
            <span className="text-xs text-gray-400">
              {completedModules}/{totalModules}
            </span>
          </div>

          {/* Module List */}
          <div className="space-y-1">
            {MODULE_CONFIG.map((moduleConfig, index) => {
              const moduleData = modules.find((m) => m.moduleNumber === moduleConfig.number);
              const percentage = moduleData?.completionPercentage || 0;
              const Icon = moduleConfig.icon;

              return (
                <motion.button
                  key={moduleConfig.number}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  onClick={() => onModuleClick?.(moduleConfig.number)}
                  className="
                    w-full flex items-center justify-between
                    p-3 rounded-lg
                    bg-[#0D2233]/50 hover:bg-[#0D2233] transition-colors
                    text-left group
                  "
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ModuleStatusIcon percentage={percentage} />
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        {moduleConfig.shortName}: {moduleConfig.name}
                      </span>
                    </div>
                  </div>

                  {/* Mini progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-[#061623] rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${percentage >= 100 ? 'bg-[#30714C]' : 'bg-[#DDC66F]'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                        transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-[#0D2233]">
          <p className="text-xs text-gray-500 text-center">
            Click any item to view details
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProgressPanel;
