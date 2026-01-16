/**
 * module-commands.tsx
 *
 * Commands for navigating to data modules M1-M5.
 */

import * as React from 'react';
import { User, Map, DollarSign, TrendingUp, Calculator } from 'lucide-react';
import type { Command } from '@/shared/ui/CommandPalette';

interface ModuleConfig {
  number: number;
  name: string;
  shortName: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
}

const MODULE_CONFIGS: ModuleConfig[] = [
  {
    number: 1,
    name: 'Identity & Entity',
    shortName: 'M1',
    description: 'Applicant identification and entity information',
    icon: <User className="h-4 w-4" />,
    keywords: ['identity', 'entity', 'applicant', 'name', 'ssn', 'address', 'm1'],
  },
  {
    number: 2,
    name: 'Lands Farmed',
    shortName: 'M2',
    description: 'Land tracts, acreage, and ownership details',
    icon: <Map className="h-4 w-4" />,
    keywords: ['lands', 'farm', 'acres', 'tract', 'property', 'ownership', 'm2'],
  },
  {
    number: 3,
    name: 'Financial Statement',
    shortName: 'M3',
    description: 'Assets, liabilities, and financial position',
    icon: <DollarSign className="h-4 w-4" />,
    keywords: ['financial', 'assets', 'liabilities', 'balance', 'statement', 'm3'],
  },
  {
    number: 4,
    name: 'Projected Operations',
    shortName: 'M4',
    description: 'Crop plans, expenses, and loan request',
    icon: <TrendingUp className="h-4 w-4" />,
    keywords: ['operations', 'crop', 'expenses', 'loan', 'projected', 'm4'],
  },
  {
    number: 5,
    name: 'Summary & Ratios',
    shortName: 'M5',
    description: 'Financial ratios and loan decision summary',
    icon: <Calculator className="h-4 w-4" />,
    keywords: ['summary', 'ratios', 'dscr', 'decision', 'final', 'm5'],
  },
];

interface ModuleCompletionInfo {
  moduleNumber: number;
  completionPercentage: number;
  isComplete: boolean;
}

interface GetModuleCommandsOptions {
  onNavigateToModule: (moduleNumber: number) => void;
  /** Module completion status from application */
  moduleCompletion?: ModuleCompletionInfo[];
  /** Whether an application is currently selected */
  hasActiveApplication?: boolean;
  /** Currently active module number */
  activeModule?: number;
}

export function getModuleCommands({
  onNavigateToModule,
  moduleCompletion = [],
  hasActiveApplication = false,
  activeModule,
}: GetModuleCommandsOptions): Command[] {
  return MODULE_CONFIGS.map(config => {
    const completion = moduleCompletion.find(m => m.moduleNumber === config.number);
    const isActive = activeModule === config.number;

    let description = config.description;
    if (completion) {
      const status = completion.isComplete
        ? 'Complete'
        : `${Math.round(completion.completionPercentage)}% complete`;
      description = `${description} (${status})`;
    }
    if (isActive) {
      description = `${description} - Currently viewing`;
    }

    return {
      id: `nav.module.${config.number}`,
      label: `Go to ${config.shortName}: ${config.name}`,
      description,
      group: 'navigation' as const,
      keywords: ['go', 'navigate', 'module', ...config.keywords],
      icon: config.icon,
      onSelect: () => {
        if (!hasActiveApplication) {
          console.warn('No active application selected');
          return;
        }
        onNavigateToModule(config.number);
      },
    };
  });
}

export { MODULE_CONFIGS };
