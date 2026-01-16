import { X, Plus, Minus, ArrowRight } from 'lucide-react';

interface VersionDiff {
  added: string[];
  removed: string[];
  changed: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
}

interface ArtifactVersionDiffProps {
  diff: VersionDiff;
  versionA: number;
  versionB: number;
  onClose: () => void;
}

export function ArtifactVersionDiff({
  diff,
  versionA,
  versionB,
  onClose,
}: ArtifactVersionDiffProps) {
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'empty';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const hasChanges = diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0;

  return (
    <div className="bg-[#0D2233] border border-[#061623] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-[#061623] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-sm">
            Version {versionA}
          </span>
          <ArrowRight size={16} className="text-white/40" />
          <span className="text-white font-medium text-sm">
            Version {versionB}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded"
          aria-label="Close diff view"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {!hasChanges ? (
          <p className="text-white/60 text-sm text-center py-4">No differences found</p>
        ) : (
          <div className="space-y-4">
            {/* Added fields */}
            {diff.added.length > 0 && (
              <div>
                <h4 className="text-green-400 text-xs font-medium uppercase mb-2 flex items-center gap-1">
                  <Plus size={14} />
                  Added Fields
                </h4>
                <div className="space-y-1">
                  {diff.added.map((field) => (
                    <div
                      key={field}
                      className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-sm"
                    >
                      + {field}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Removed fields */}
            {diff.removed.length > 0 && (
              <div>
                <h4 className="text-red-400 text-xs font-medium uppercase mb-2 flex items-center gap-1">
                  <Minus size={14} />
                  Removed Fields
                </h4>
                <div className="space-y-1">
                  {diff.removed.map((field) => (
                    <div
                      key={field}
                      className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm"
                    >
                      - {field}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Changed fields */}
            {diff.changed.length > 0 && (
              <div>
                <h4 className="text-yellow-400 text-xs font-medium uppercase mb-2">
                  Changed Fields
                </h4>
                <div className="space-y-2">
                  {diff.changed.map(({ field, oldValue, newValue }) => (
                    <div
                      key={field}
                      className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded"
                    >
                      <div className="text-white font-medium text-sm mb-1">{field}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-red-400">- </span>
                          <span className="text-white/60">{formatValue(oldValue)}</span>
                        </div>
                        <div>
                          <span className="text-green-400">+ </span>
                          <span className="text-white/60">{formatValue(newValue)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArtifactVersionDiff;
