/**
 * document-commands.tsx
 *
 * Commands for document upload slots.
 * Each document type gets its own upload command.
 */

import * as React from 'react';
import { Upload, FileText, CreditCard, Landmark, Calculator, Shield, FileCheck } from 'lucide-react';
import type { Command } from '@/shared/ui/CommandPalette';

export type DocumentType =
  | 'drivers_license'
  | 'schedule_f'
  | 'organization_docs'
  | 'balance_sheet'
  | 'fsa_578'
  | 'current_crop_insurance'
  | 'prior_crop_insurance'
  | 'lease_agreement'
  | 'equipment_list';

interface DocumentCommandConfig {
  type: DocumentType;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  required: boolean;
}

const DOCUMENT_CONFIGS: DocumentCommandConfig[] = [
  {
    type: 'drivers_license',
    label: "Upload Driver's License",
    description: 'Government-issued photo identification',
    icon: <CreditCard className="h-4 w-4" />,
    keywords: ['id', 'identification', 'photo', 'license', 'dl'],
    required: true,
  },
  {
    type: 'schedule_f',
    label: 'Upload Schedule F',
    description: 'IRS Schedule F - Profit or Loss from Farming',
    icon: <FileText className="h-4 w-4" />,
    keywords: ['tax', 'irs', 'profit', 'loss', 'farming', 'schedule'],
    required: true,
  },
  {
    type: 'organization_docs',
    label: 'Upload Organization Documents',
    description: 'LLC, corporation, or partnership documents',
    icon: <Landmark className="h-4 w-4" />,
    keywords: ['llc', 'corp', 'partnership', 'articles', 'incorporation', 'entity'],
    required: true,
  },
  {
    type: 'balance_sheet',
    label: 'Upload Balance Sheet',
    description: 'Current financial statement of assets and liabilities',
    icon: <Calculator className="h-4 w-4" />,
    keywords: ['financial', 'assets', 'liabilities', 'statement', 'balance'],
    required: true,
  },
  {
    type: 'fsa_578',
    label: 'Upload FSA-578 Form',
    description: 'USDA Farm Service Agency application form',
    icon: <FileCheck className="h-4 w-4" />,
    keywords: ['usda', 'fsa', 'farm', 'service', 'agency', '578'],
    required: true,
  },
  {
    type: 'current_crop_insurance',
    label: 'Upload Current Crop Insurance',
    description: 'Active crop insurance policy documentation',
    icon: <Shield className="h-4 w-4" />,
    keywords: ['insurance', 'crop', 'policy', 'current', 'coverage'],
    required: true,
  },
  {
    type: 'prior_crop_insurance',
    label: 'Upload Prior Year Crop Insurance',
    description: 'Previous year crop insurance records',
    icon: <Shield className="h-4 w-4" />,
    keywords: ['insurance', 'crop', 'prior', 'previous', 'last year'],
    required: false,
  },
  {
    type: 'lease_agreement',
    label: 'Upload Lease Agreement',
    description: 'Land or equipment lease contracts',
    icon: <FileText className="h-4 w-4" />,
    keywords: ['lease', 'rent', 'agreement', 'contract', 'land'],
    required: false,
  },
  {
    type: 'equipment_list',
    label: 'Upload Equipment List',
    description: 'Inventory of farm machinery and equipment',
    icon: <Upload className="h-4 w-4" />,
    keywords: ['equipment', 'machinery', 'inventory', 'tractor', 'farm'],
    required: false,
  },
];

interface GetDocumentCommandsOptions {
  onUploadDocument: (documentType: DocumentType) => void;
  /** Document types that have already been uploaded */
  uploadedDocuments?: DocumentType[];
  /** Whether an application is currently selected */
  hasActiveApplication?: boolean;
}

export function getDocumentCommands({
  onUploadDocument,
  uploadedDocuments = [],
  hasActiveApplication = false,
}: GetDocumentCommandsOptions): Command[] {
  return DOCUMENT_CONFIGS.map(config => ({
    id: `doc.upload.${config.type}`,
    label: config.label,
    description: uploadedDocuments.includes(config.type)
      ? `${config.description} (Already uploaded)`
      : config.description + (config.required ? ' (Required)' : ''),
    group: 'actions' as const,
    keywords: ['upload', 'document', ...config.keywords],
    icon: config.icon,
    onSelect: () => {
      if (!hasActiveApplication) {
        console.warn('No active application selected');
        return;
      }
      onUploadDocument(config.type);
    },
  }));
}

export { DOCUMENT_CONFIGS };
