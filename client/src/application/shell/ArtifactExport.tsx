import { useState } from 'react';
import { Download, FileDown, FileJson, FileText, Loader2 } from 'lucide-react';
import type { Artifact } from './ArtifactContent';

/**
 * Export format options
 */
export type ExportFormat = 'pdf' | 'json' | 'csv' | 'txt';

/**
 * Export options for different artifact types
 */
export interface ExportOptions {
  /** File name (without extension) */
  filename?: string;
  /** Export format */
  format: ExportFormat;
  /** Include metadata in export */
  includeMetadata?: boolean;
  /** Pretty print JSON */
  prettyPrint?: boolean;
}

export interface ArtifactExportProps {
  /** The artifact to export */
  artifact: Artifact;
  /** Available export formats for this artifact */
  availableFormats?: ExportFormat[];
  /** Custom export handler */
  onExport?: (artifact: Artifact, options: ExportOptions) => Promise<void>;
  /** Callback when export starts */
  onExportStart?: () => void;
  /** Callback when export completes */
  onExportComplete?: () => void;
  /** Callback when export fails */
  onExportError?: (error: Error) => void;
}

/**
 * Get default formats for artifact type
 */
function getDefaultFormats(artifactType: string): ExportFormat[] {
  switch (artifactType) {
    case 'document':
      return ['pdf'];
    case 'extraction':
      return ['json', 'csv'];
    case 'module_m1':
    case 'module_m2':
    case 'module_m3':
    case 'module_m4':
    case 'module_m5':
      return ['json', 'csv'];
    default:
      return ['json'];
  }
}

/**
 * Get icon for export format
 */
function getFormatIcon(format: ExportFormat) {
  switch (format) {
    case 'pdf':
      return FileDown;
    case 'json':
      return FileJson;
    case 'csv':
      return FileText;
    case 'txt':
      return FileText;
    default:
      return Download;
  }
}

/**
 * Export artifact data to file
 */
async function exportArtifact(artifact: Artifact, options: ExportOptions): Promise<void> {
  const filename = options.filename || artifact.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fullFilename = `${filename}.${options.format}`;

  switch (options.format) {
    case 'json':
      await exportAsJSON(artifact, fullFilename, options);
      break;
    case 'csv':
      await exportAsCSV(artifact, fullFilename, options);
      break;
    case 'pdf':
      await exportAsPDF(artifact, fullFilename, options);
      break;
    case 'txt':
      await exportAsText(artifact, fullFilename, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Export as JSON
 */
async function exportAsJSON(artifact: Artifact, filename: string, options: ExportOptions) {
  const data = {
    ...(options.includeMetadata && {
      metadata: {
        id: artifact.id,
        type: artifact.type,
        title: artifact.title,
        exportedAt: new Date().toISOString(),
      },
    }),
    data: artifact.data,
  };

  const json = options.prettyPrint
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);

  downloadFile(json, filename, 'application/json');
}

/**
 * Export as CSV
 */
async function exportAsCSV(artifact: Artifact, filename: string, _options: ExportOptions) {
  let csv = '';

  // For extraction artifacts, export fields
  if (artifact.type === 'extraction') {
    const fields = artifact.data.fields || [];

    // Headers
    csv += 'Field Name,Value,Confidence,Target Module,Target Field\n';

    // Rows
    fields.forEach((field: any) => {
      const row = [
        escapeCsvValue(field.fieldName),
        escapeCsvValue(field.value),
        field.confidence?.toFixed(2) || '',
        escapeCsvValue(field.targetModule),
        escapeCsvValue(field.targetField),
      ];
      csv += row.join(',') + '\n';
    });
  }
  // For module artifacts, export form data
  else if (artifact.type.startsWith('module_')) {
    const data = ('initialData' in artifact.data && (artifact.data as any).initialData) || {};

    // Headers
    csv += 'Field,Value\n';

    // Rows
    Object.entries(data).forEach(([key, value]) => {
      csv += `${escapeCsvValue(key)},${escapeCsvValue(value)}\n`;
    });
  }
  // Generic object to CSV
  else {
    csv += 'Key,Value\n';
    Object.entries(artifact.data).forEach(([key, value]) => {
      csv += `${escapeCsvValue(key)},${escapeCsvValue(value)}\n`;
    });
  }

  downloadFile(csv, filename, 'text/csv');
}

/**
 * Escape CSV value
 */
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) return '';

  const str = String(value);

  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Export as PDF (placeholder - requires proper PDF library)
 */
async function exportAsPDF(artifact: Artifact, filename: string, _options: ExportOptions) {
  // For documents, try to download the original document
  if (artifact.type === 'document' && artifact.data.documentUrl) {
    try {
      const response = await fetch(artifact.data.documentUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  }

  // Fallback: Generate simple text-based PDF content
  // In production, use a library like jsPDF or pdfmake
  const content = `
${artifact.title}
${'='.repeat(artifact.title.length)}

Type: ${artifact.type}
ID: ${artifact.id}

Data:
${JSON.stringify(artifact.data, null, 2)}

Exported: ${new Date().toLocaleString()}
  `.trim();

  // For now, export as text (in production, generate actual PDF)
  downloadFile(content, filename.replace('.pdf', '.txt'), 'text/plain');

  console.warn('PDF export is not fully implemented. Exported as text instead.');
}

/**
 * Export as plain text
 */
async function exportAsText(artifact: Artifact, filename: string, _options: ExportOptions) {
  const content = `
${artifact.title}
${'='.repeat(artifact.title.length)}

${JSON.stringify(artifact.data, null, 2)}
  `.trim();

  downloadFile(content, filename, 'text/plain');
}

/**
 * Download file to browser
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * ArtifactExport Component
 *
 * Provides download/export functionality for artifacts.
 * Supports multiple formats based on artifact type.
 */
export default function ArtifactExport({
  artifact,
  availableFormats,
  onExport,
  onExportStart,
  onExportComplete,
  onExportError,
}: ArtifactExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  const formats = availableFormats || getDefaultFormats(artifact.type);
  const singleFormat = formats.length === 1;

  /**
   * Handle export
   */
  const handleExport = async (format: ExportFormat) => {
    setShowFormatMenu(false);
    setIsExporting(true);

    if (onExportStart) {
      onExportStart();
    }

    try {
      const options: ExportOptions = {
        format,
        includeMetadata: true,
        prettyPrint: true,
      };

      if (onExport) {
        await onExport(artifact, options);
      } else {
        await exportArtifact(artifact, options);
      }

      if (onExportComplete) {
        onExportComplete();
      }
    } catch (error) {
      console.error('Export failed:', error);
      if (onExportError) {
        onExportError(error as Error);
      }
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Single format button
   */
  if (singleFormat) {
    const format = formats[0];
    const Icon = getFormatIcon(format);

    return (
      <button
        onClick={() => handleExport(format)}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Download as ${format.toUpperCase()}`}
        title={`Download as ${format.toUpperCase()}`}
      >
        {isExporting ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Icon size={18} />
        )}
        <span className="text-sm hidden sm:inline">
          {isExporting ? 'Exporting...' : 'Download'}
        </span>
      </button>
    );
  }

  /**
   * Multiple format dropdown
   */
  return (
    <div className="relative">
      <button
        onClick={() => setShowFormatMenu(!showFormatMenu)}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Export options"
        aria-expanded={showFormatMenu}
        aria-haspopup="true"
      >
        {isExporting ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Download size={18} />
        )}
        <span className="text-sm hidden sm:inline">
          {isExporting ? 'Exporting...' : 'Export'}
        </span>
        {!isExporting && (
          <svg
            className={`w-4 h-4 transition-transform ${showFormatMenu ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Format dropdown menu */}
      {showFormatMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowFormatMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-[#0D2233] border border-[#061623] rounded-lg shadow-lg z-20">
            <div className="py-1">
              {formats.map((format) => {
                const Icon = getFormatIcon(format);
                return (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-white/80 hover:text-white hover:bg-white/5 transition-colors text-left"
                  >
                    <Icon size={16} />
                    <span className="text-sm">
                      Export as {format.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Hook to use export functionality programmatically
 */
export function useArtifactExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportArtifactData = async (artifact: Artifact, format: ExportFormat) => {
    setIsExporting(true);
    setError(null);

    try {
      await exportArtifact(artifact, {
        format,
        includeMetadata: true,
        prettyPrint: true,
      });
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportArtifact: exportArtifactData,
    isExporting,
    error,
  };
}
