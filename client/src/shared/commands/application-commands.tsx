/**
 * application-commands.tsx
 *
 * Commands for application management and switching.
 */

import * as React from 'react';
import { Plus, FileText, CheckCircle, Clock, AlertTriangle, Lock } from 'lucide-react';
import type { Command } from '@/shared/ui/CommandPalette';

interface ApplicationSummary {
  id: string;
  farmerName: string;
  status: 'draft' | 'awaiting_documents' | 'awaiting_audit' | 'certified' | 'locked';
  updatedAt: Date;
}

const STATUS_ICONS: Record<ApplicationSummary['status'], React.ReactNode> = {
  draft: <Clock className="h-4 w-4" />,
  awaiting_documents: <AlertTriangle className="h-4 w-4" />,
  awaiting_audit: <FileText className="h-4 w-4" />,
  certified: <CheckCircle className="h-4 w-4" />,
  locked: <Lock className="h-4 w-4" />,
};

const STATUS_LABELS: Record<ApplicationSummary['status'], string> = {
  draft: 'Draft',
  awaiting_documents: 'Awaiting Documents',
  awaiting_audit: 'Awaiting Audit',
  certified: 'Certified',
  locked: 'Locked',
};

interface GetApplicationCommandsOptions {
  applications: ApplicationSummary[];
  activeApplicationId?: string;
  onSelectApplication: (applicationId: string) => void;
  onCreateApplication: () => void;
}

export function getApplicationCommands({
  applications,
  activeApplicationId,
  onSelectApplication,
  onCreateApplication,
}: GetApplicationCommandsOptions): Command[] {
  const commands: Command[] = [
    {
      id: 'app.new',
      label: 'New Application',
      description: 'Create a new loan application',
      group: 'actions' as const,
      keywords: ['new', 'create', 'application', 'start', 'loan'],
      icon: <Plus className="h-4 w-4" />,
      onSelect: onCreateApplication,
    },
  ];

  // Add switch commands for each application
  applications.forEach(app => {
    const isActive = app.id === activeApplicationId;
    const timeAgo = formatTimeAgo(app.updatedAt);

    commands.push({
      id: `app.switch.${app.id}`,
      label: `Switch to: ${app.farmerName}`,
      description: `${STATUS_LABELS[app.status]} - Updated ${timeAgo}${isActive ? ' (Current)' : ''}`,
      group: 'navigation' as const,
      keywords: ['switch', 'application', app.farmerName.toLowerCase(), 'open'],
      icon: STATUS_ICONS[app.status],
      onSelect: () => {
        if (!isActive) {
          onSelectApplication(app.id);
        }
      },
    });
  });

  return commands;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
