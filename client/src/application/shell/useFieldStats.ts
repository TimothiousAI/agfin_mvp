import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { FieldStats, FieldSourceStats, FieldConfidenceStats } from './types/fieldStats';
import { calculateFieldStats } from './types/fieldStats';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Field statistics response from API
 */
interface ModuleFieldsResponse {
  module: {
    module_number: number;
    fields: Record<string, {
      field_id: string;
      value: unknown;
      source: 'ai_extracted' | 'proxy_entered' | 'proxy_edited' | 'auditor_verified';
      confidence_score?: number;
      source_document_id?: string;
    }>;
  };
}

/**
 * Aggregated statistics for entire application
 */
export interface ApplicationFieldStats {
  /** Per-module statistics */
  byModule: Record<number, FieldStats>;
  /** Aggregated source stats */
  totalSource: FieldSourceStats;
  /** Aggregated confidence stats */
  totalConfidence: FieldConfidenceStats;
  /** Total edited count across all modules */
  totalEdited: number;
  /** Total low confidence count */
  totalLowConfidence: number;
}

/**
 * Fetch field data for a single module
 */
async function fetchModuleFields(
  applicationId: string,
  moduleNumber: number
): Promise<ModuleFieldsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/modules/${applicationId}/${moduleNumber}`,
    {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch module ${moduleNumber} fields`);
  }

  return response.json();
}

/**
 * Hook to get field statistics for a single module
 */
export function useModuleFieldStats(
  applicationId: string | undefined,
  moduleNumber: number
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['module-fields', applicationId, moduleNumber],
    queryFn: () => fetchModuleFields(applicationId!, moduleNumber),
    enabled: !!applicationId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const stats = useMemo(() => {
    if (!data?.module?.fields) return null;
    return calculateFieldStats(data.module.fields);
  }, [data]);

  return {
    stats,
    isLoading,
    error,
    rawData: data,
  };
}

/**
 * Hook to get aggregated field statistics across all modules
 */
export function useApplicationFieldStats(applicationId: string | undefined) {
  // Fetch all 5 modules in parallel
  const module1 = useModuleFieldStats(applicationId, 1);
  const module2 = useModuleFieldStats(applicationId, 2);
  const module3 = useModuleFieldStats(applicationId, 3);
  const module4 = useModuleFieldStats(applicationId, 4);
  const module5 = useModuleFieldStats(applicationId, 5);

  const isLoading = module1.isLoading || module2.isLoading || module3.isLoading ||
                    module4.isLoading || module5.isLoading;

  const aggregatedStats = useMemo((): ApplicationFieldStats | null => {
    const moduleStats = [module1, module2, module3, module4, module5];

    // Check if we have any data
    if (moduleStats.every(m => !m.stats)) return null;

    const byModule: Record<number, FieldStats> = {};
    const totalSource: FieldSourceStats = {
      ai_extracted: 0,
      proxy_entered: 0,
      proxy_edited: 0,
      auditor_verified: 0,
      total: 0,
    };
    const totalConfidence: FieldConfidenceStats = {
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
    };

    moduleStats.forEach((module, index) => {
      const moduleNumber = index + 1;
      if (module.stats) {
        byModule[moduleNumber] = module.stats;

        // Aggregate source stats
        totalSource.ai_extracted += module.stats.source.ai_extracted;
        totalSource.proxy_entered += module.stats.source.proxy_entered;
        totalSource.proxy_edited += module.stats.source.proxy_edited;
        totalSource.auditor_verified += module.stats.source.auditor_verified;
        totalSource.total += module.stats.source.total;

        // Aggregate confidence stats
        totalConfidence.high += module.stats.confidence.high;
        totalConfidence.medium += module.stats.confidence.medium;
        totalConfidence.low += module.stats.confidence.low;
        totalConfidence.total += module.stats.confidence.total;
      }
    });

    return {
      byModule,
      totalSource,
      totalConfidence,
      totalEdited: totalSource.proxy_edited,
      totalLowConfidence: totalConfidence.low + totalConfidence.medium,
    };
  }, [module1.stats, module2.stats, module3.stats, module4.stats, module5.stats]);

  return {
    stats: aggregatedStats,
    isLoading,
    moduleStats: {
      1: module1.stats,
      2: module2.stats,
      3: module3.stats,
      4: module4.stats,
      5: module5.stats,
    },
  };
}

export default useApplicationFieldStats;
