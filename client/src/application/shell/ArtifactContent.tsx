import React, { Suspense, lazy } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

// Lazy load heavy components for better performance
const DocumentViewer = lazy(() => import('../documents/DocumentViewer'));
const ExtractionPreview = lazy(() => import('../documents/ExtractionPreview'));
const M1IdentityForm = lazy(() => import('../modules/M1IdentityForm'));
const M2LandsForm = lazy(() => import('../modules/M2LandsForm'));
const M3FinancialForm = lazy(() => import('../modules/M3FinancialForm'));
const M4OperationsForm = lazy(() => import('../modules/M4OperationsForm'));
const M5SummaryForm = lazy(() => import('../modules/M5SummaryForm'));

/**
 * Artifact types that can be rendered
 */
export type ArtifactType =
  | 'document'
  | 'extraction'
  | 'module_m1'
  | 'module_m2'
  | 'module_m3'
  | 'module_m4'
  | 'module_m5';

/**
 * Base artifact interface
 */
export interface BaseArtifact {
  id: string;
  type: ArtifactType;
  title: string;
}

/**
 * Document artifact
 */
export interface DocumentArtifact extends BaseArtifact {
  type: 'document';
  data: {
    documentUrl: string;
    documentType: string;
    filename?: string;
  };
}

/**
 * Extraction preview artifact
 */
export interface ExtractionArtifact extends BaseArtifact {
  type: 'extraction';
  data: {
    documentId: string;
    documentType: string;
    fields: any[];
    overallConfidence?: number;
  };
}

/**
 * Module form artifact
 */
export interface ModuleArtifact extends BaseArtifact {
  type: 'module_m1' | 'module_m2' | 'module_m3' | 'module_m4' | 'module_m5';
  data: {
    initialData?: any;
    fieldMetadata?: Record<string, any>;
    readOnly?: boolean;
    showConfidence?: boolean;
    applicationId?: string;
  };
}

/**
 * Union type for all artifacts
 */
export type Artifact = DocumentArtifact | ExtractionArtifact | ModuleArtifact;

export interface ArtifactContentProps {
  artifact: Artifact;
  onClose?: () => void;
  onChange?: (data: any) => void;
  onSubmit?: (data: any) => void;
}

/**
 * Loading fallback component
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#30714C] mx-auto mb-4" />
        <p className="text-white/60 text-sm">Loading artifact...</p>
      </div>
    </div>
  );
}

/**
 * Error boundary fallback component
 */
function ErrorFallback({ error, artifactType }: { error?: Error; artifactType: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="max-w-md p-6 bg-[#0D2233] border border-red-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-medium mb-2">Failed to load artifact</h3>
            <p className="text-white/60 text-sm mb-3">
              Unable to display {artifactType} artifact. Please try again or contact support if the problem persists.
            </p>
            {error && (
              <details className="text-xs text-white/40">
                <summary className="cursor-pointer hover:text-white/60">Technical details</summary>
                <pre className="mt-2 p-2 bg-[#061623] rounded overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ArtifactContent Component
 *
 * Renders different artifact types with appropriate components:
 * - Documents: PDF/image viewer
 * - Extractions: Field preview with confidence scores
 * - Modules: Certification form components (M1-M5)
 */
export default function ArtifactContent({
  artifact,
  onClose,
  onChange,
  onSubmit,
}: ArtifactContentProps) {
  // Handle loading and error states with Suspense and ErrorBoundary
  const renderContent = () => {
    try {
      switch (artifact.type) {
        case 'document': {
          const docArtifact = artifact as DocumentArtifact;
          return (
            <DocumentViewer
              documentUrl={docArtifact.data.documentUrl}
              documentType={docArtifact.data.documentType}
              filename={docArtifact.data.filename}
              onClose={onClose}
            />
          );
        }

        case 'extraction': {
          const extractionArtifact = artifact as ExtractionArtifact;
          return (
            <ExtractionPreview
              documentId={extractionArtifact.data.documentId}
              documentType={extractionArtifact.data.documentType}
              fields={extractionArtifact.data.fields}
              overallConfidence={extractionArtifact.data.overallConfidence}
              showActions={!extractionArtifact.data.readOnly}
              onAcceptField={(field) => {
                console.log('Field accepted:', field);
                // TODO: Call API to accept field
              }}
              onRejectField={(field) => {
                console.log('Field rejected:', field);
                // TODO: Call API to reject field
              }}
              onEditField={(field, newValue) => {
                console.log('Field edited:', field, newValue);
                // TODO: Call API to update field
              }}
            />
          );
        }

        case 'module_m1': {
          const moduleArtifact = artifact as ModuleArtifact;
          return (
            <M1IdentityForm
              initialData={moduleArtifact.data.initialData}
              fieldMetadata={moduleArtifact.data.fieldMetadata}
              readOnly={moduleArtifact.data.readOnly}
              showConfidence={moduleArtifact.data.showConfidence}
              onChange={onChange}
              onSubmit={onSubmit}
            />
          );
        }

        case 'module_m2': {
          const moduleArtifact = artifact as ModuleArtifact;
          return (
            <M2LandsForm
              initialData={moduleArtifact.data.initialData}
              fieldMetadata={moduleArtifact.data.fieldMetadata}
              readOnly={moduleArtifact.data.readOnly}
              showConfidence={moduleArtifact.data.showConfidence}
              onChange={onChange}
              onSubmit={onSubmit}
            />
          );
        }

        case 'module_m3': {
          const moduleArtifact = artifact as ModuleArtifact;
          return (
            <M3FinancialForm
              initialData={moduleArtifact.data.initialData}
              fieldMetadata={moduleArtifact.data.fieldMetadata}
              readOnly={moduleArtifact.data.readOnly}
              showConfidence={moduleArtifact.data.showConfidence}
              onChange={onChange}
              onSubmit={onSubmit}
            />
          );
        }

        case 'module_m4': {
          const moduleArtifact = artifact as ModuleArtifact;
          return (
            <M4OperationsForm
              initialData={moduleArtifact.data.initialData}
              fieldMetadata={moduleArtifact.data.fieldMetadata}
              readOnly={moduleArtifact.data.readOnly}
              showConfidence={moduleArtifact.data.showConfidence}
              onChange={onChange}
              onSubmit={onSubmit}
            />
          );
        }

        case 'module_m5': {
          const moduleArtifact = artifact as ModuleArtifact;
          return (
            <M5SummaryForm
              initialData={moduleArtifact.data.initialData}
              fieldMetadata={moduleArtifact.data.fieldMetadata}
              readOnly={moduleArtifact.data.readOnly}
              showConfidence={moduleArtifact.data.showConfidence}
              onChange={onChange}
              onSubmit={onSubmit}
            />
          );
        }

        default: {
          // Handle unknown artifact types
          const unknownType = (artifact as any).type;
          return (
            <ErrorFallback
              error={new Error(`Unknown artifact type: ${unknownType}`)}
              artifactType={unknownType}
            />
          );
        }
      }
    } catch (error) {
      return <ErrorFallback error={error as Error} artifactType={artifact.type} />;
    }
  };

  return (
    <div className="artifact-content h-full">
      <Suspense fallback={<LoadingFallback />}>
        {renderContent()}
      </Suspense>
    </div>
  );
}

/**
 * Hook to create artifact objects with proper typing
 */
export function useArtifactFactory() {
  const createDocumentArtifact = (
    id: string,
    title: string,
    documentUrl: string,
    documentType: string,
    filename?: string
  ): DocumentArtifact => ({
    id,
    type: 'document',
    title,
    data: { documentUrl, documentType, filename },
  });

  const createExtractionArtifact = (
    id: string,
    title: string,
    documentId: string,
    documentType: string,
    fields: any[],
    overallConfidence?: number
  ): ExtractionArtifact => ({
    id,
    type: 'extraction',
    title,
    data: { documentId, documentType, fields, overallConfidence },
  });

  const createModuleArtifact = (
    id: string,
    title: string,
    moduleType: 'module_m1' | 'module_m2' | 'module_m3' | 'module_m4' | 'module_m5',
    initialData?: any,
    fieldMetadata?: Record<string, any>,
    options?: {
      readOnly?: boolean;
      showConfidence?: boolean;
      applicationId?: string;
    }
  ): ModuleArtifact => ({
    id,
    type: moduleType,
    title,
    data: {
      initialData,
      fieldMetadata,
      ...options,
    },
  });

  return {
    createDocumentArtifact,
    createExtractionArtifact,
    createModuleArtifact,
  };
}
