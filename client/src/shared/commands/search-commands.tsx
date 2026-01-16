/**
 * search-commands.tsx
 *
 * Commands for search functionality.
 */

import { Search, FileSearch, Users } from 'lucide-react';
import type { Command } from '@/shared/ui/CommandPalette';

interface GetSearchCommandsOptions {
  onSearchApplications: () => void;
  onSearchDocuments: () => void;
  onFindInCurrentApplication: () => void;
  hasActiveApplication?: boolean;
}

export function getSearchCommands({
  onSearchApplications,
  onSearchDocuments,
  onFindInCurrentApplication,
  hasActiveApplication = false,
}: GetSearchCommandsOptions): Command[] {
  const commands: Command[] = [
    {
      id: 'search.applications',
      label: 'Search Applications',
      description: 'Find loan applications by farmer name or status',
      group: 'actions' as const,
      keywords: ['search', 'find', 'applications', 'lookup', 'farmer'],
      icon: <Users className="h-4 w-4" />,
      onSelect: onSearchApplications,
    },
    {
      id: 'search.documents',
      label: 'Search Documents',
      description: 'Find uploaded documents across all applications',
      group: 'actions' as const,
      keywords: ['search', 'find', 'documents', 'files', 'uploaded'],
      icon: <FileSearch className="h-4 w-4" />,
      onSelect: onSearchDocuments,
    },
  ];

  if (hasActiveApplication) {
    commands.push({
      id: 'search.current',
      label: 'Find in Current Application',
      description: 'Search within the current application data',
      group: 'actions' as const,
      keywords: ['find', 'search', 'current', 'application', 'data'],
      icon: <Search className="h-4 w-4" />,
      onSelect: onFindInCurrentApplication,
    });
  }

  return commands;
}
