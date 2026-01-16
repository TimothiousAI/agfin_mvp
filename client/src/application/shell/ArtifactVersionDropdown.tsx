import { useState } from 'react';
import { History, ChevronDown, RotateCcw } from 'lucide-react';
import type { ArtifactVersion } from './useArtifactStore';

interface ArtifactVersionDropdownProps {
  versions: ArtifactVersion[];
  currentVersion: number;
  onSelectVersion: (versionId: string) => void;
  onRestoreVersion: (versionId: string) => void;
  onCompareVersions?: (versionIdA: string, versionIdB: string) => void;
}

export function ArtifactVersionDropdown({
  versions,
  currentVersion,
  onSelectVersion,
  onRestoreVersion,
  onCompareVersions,
}: ArtifactVersionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSourceLabel = (source: ArtifactVersion['source']) => {
    switch (source) {
      case 'ai_extracted':
        return 'AI Extracted';
      case 'proxy_entered':
        return 'Manual Entry';
      case 'proxy_edited':
        return 'Edited';
      case 'ai_reprompt':
        return 'AI Re-prompt';
      default:
        return source;
    }
  };

  const handleVersionClick = (version: ArtifactVersion) => {
    if (compareMode && compareVersionId) {
      onCompareVersions?.(compareVersionId, version.versionId);
      setCompareMode(false);
      setCompareVersionId(null);
    } else if (compareMode) {
      setCompareVersionId(version.versionId);
    } else {
      onSelectVersion(version.versionId);
    }
    setIsOpen(false);
  };

  if (versions.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
        aria-label="Version history"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <History size={18} />
        <span className="text-sm">v{currentVersion}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setCompareMode(false);
              setCompareVersionId(null);
            }}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-72 bg-[#0D2233] border border-[#061623] rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-2 border-b border-[#061623] flex items-center justify-between">
              <span className="text-white/60 text-xs font-medium uppercase">Version History</span>
              {onCompareVersions && versions.length > 1 && (
                <button
                  onClick={() => {
                    setCompareMode(!compareMode);
                    setCompareVersionId(null);
                  }}
                  className={`text-xs px-2 py-1 rounded ${
                    compareMode
                      ? 'bg-[#30714C] text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {compareMode ? 'Cancel Compare' : 'Compare'}
                </button>
              )}
            </div>

            {compareMode && (
              <div className="px-4 py-2 bg-[#30714C]/20 text-white/80 text-xs">
                {compareVersionId
                  ? 'Select second version to compare'
                  : 'Select first version to compare'}
              </div>
            )}

            {/* Version list */}
            <div className="py-1">
              {versions
                .slice()
                .reverse()
                .map((version) => (
                  <div
                    key={version.versionId}
                    className={`px-4 py-2 hover:bg-white/5 cursor-pointer ${
                      version.versionNumber === currentVersion ? 'bg-white/5' : ''
                    } ${compareVersionId === version.versionId ? 'ring-1 ring-[#30714C]' : ''}`}
                    onClick={() => handleVersionClick(version)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium text-sm">
                        Version {version.versionNumber}
                        {version.versionNumber === currentVersion && (
                          <span className="ml-2 text-[#30714C] text-xs">(current)</span>
                        )}
                      </span>
                      {version.versionNumber !== currentVersion && !compareMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreVersion(version.versionId);
                            setIsOpen(false);
                          }}
                          className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded"
                          title="Restore this version"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/40 text-xs">{formatDate(version.createdAt)}</span>
                      <span className="text-white/40 text-xs">-</span>
                      <span className="text-white/60 text-xs">{getSourceLabel(version.source)}</span>
                    </div>
                    {version.changeDescription && (
                      <p className="text-white/50 text-xs mt-1 truncate">{version.changeDescription}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ArtifactVersionDropdown;
