import { useState } from 'react';
import { useArtifactStore, type VersionedArtifact } from './useArtifactStore';
import ArtifactExport from './ArtifactExport';
import ArtifactVersionDropdown from './ArtifactVersionDropdown';
import ArtifactVersionDiff from './ArtifactVersionDiff';
import ArtifactRepromptButton from './ArtifactRepromptButton';
import type { Artifact } from './ArtifactContent';

interface ArtifactToolbarProps {
  artifact: Artifact;
  onRepromptStart?: () => void;
}

export function ArtifactToolbar({ artifact, onRepromptStart }: ArtifactToolbarProps) {
  const { restoreVersion, compareVersions } = useArtifactStore();
  const [diffData, setDiffData] = useState<{
    diff: ReturnType<typeof compareVersions>;
    versionA: number;
    versionB: number;
  } | null>(null);

  const versionedArtifact = artifact as unknown as VersionedArtifact;
  const versions = versionedArtifact.versionHistory || [];
  const currentVersion = versionedArtifact.currentVersion || 1;

  const handleSelectVersion = (versionId: string) => {
    // Could implement version preview here
    console.log('Selected version:', versionId);
  };

  const handleRestoreVersion = (versionId: string) => {
    restoreVersion(artifact.id, versionId);
  };

  const handleCompareVersions = (versionIdA: string, versionIdB: string) => {
    const diff = compareVersions(artifact.id, versionIdA, versionIdB);
    if (diff) {
      const versionA = versions.find((v) => v.versionId === versionIdA)?.versionNumber || 0;
      const versionB = versions.find((v) => v.versionId === versionIdB)?.versionNumber || 0;
      setDiffData({ diff, versionA, versionB });
    }
  };

  return (
    <div className="space-y-2">
      {/* Toolbar buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Edit/Re-prompt button */}
        <ArtifactRepromptButton
          artifactId={artifact.id}
          onRepromptStart={onRepromptStart}
        />

        {/* Version history dropdown */}
        {versions.length > 0 && (
          <ArtifactVersionDropdown
            versions={versions}
            currentVersion={currentVersion}
            onSelectVersion={handleSelectVersion}
            onRestoreVersion={handleRestoreVersion}
            onCompareVersions={handleCompareVersions}
          />
        )}

        {/* Export button */}
        <ArtifactExport artifact={artifact} />
      </div>

      {/* Version diff display */}
      {diffData && diffData.diff && (
        <ArtifactVersionDiff
          diff={diffData.diff}
          versionA={diffData.versionA}
          versionB={diffData.versionB}
          onClose={() => setDiffData(null)}
        />
      )}
    </div>
  );
}

export default ArtifactToolbar;
