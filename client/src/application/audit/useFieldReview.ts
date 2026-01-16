import { useState, useCallback, useMemo } from 'react';

/**
 * Field review tracking entry
 */
export interface FieldReviewStatus {
  fieldId: string;
  viewed: boolean;
  interacted: boolean; // confirmed or edited
  action?: 'confirmed' | 'edited';
  timestamp?: Date;
}

/**
 * Hook for tracking mandatory field review interactions
 */
export interface UseFieldReviewOptions {
  /** All field IDs that require review */
  flaggedFieldIds: string[];
  /** Confidence threshold for requiring review */
  confidenceThreshold?: number;
}

/**
 * Return type for useFieldReview hook
 */
export interface UseFieldReviewReturn {
  /** Track that a field was viewed */
  markFieldViewed: (fieldId: string) => void;
  /** Mark field as confirmed (user verified the value is correct) */
  confirmField: (fieldId: string) => void;
  /** Mark field as edited (user changed the value) */
  editField: (fieldId: string) => void;
  /** Check if a specific field has been reviewed */
  isFieldReviewed: (fieldId: string) => boolean;
  /** Check if a specific field has been viewed */
  isFieldViewed: (fieldId: string) => boolean;
  /** Get all review statuses */
  reviewStatuses: Map<string, FieldReviewStatus>;
  /** Check if all flagged fields have been addressed */
  allFieldsReviewed: boolean;
  /** Get count of unreviewed fields */
  unreviewedCount: number;
  /** Get next unreviewed field ID (for keyboard navigation) */
  getNextUnreviewedField: (currentFieldId?: string) => string | null;
  /** Get previous unreviewed field ID (for keyboard navigation) */
  getPreviousUnreviewedField: (currentFieldId?: string) => string | null;
  /** Reset all review tracking */
  resetReviews: () => void;
}

/**
 * useFieldReview Hook
 *
 * Manages mandatory interaction enforcement for low-confidence fields.
 * Tracks which fields have been viewed and interacted with (confirmed or edited).
 *
 * Features:
 * - Tracks field views and interactions
 * - Requires explicit confirm or edit action for each flagged field
 * - Provides keyboard navigation through unreviewed fields
 * - Blocks mark-as-audited until all flagged fields addressed
 *
 * @example
 * ```tsx
 * const {
 *   markFieldViewed,
 *   confirmField,
 *   allFieldsReviewed,
 *   unreviewedCount
 * } = useFieldReview({
 *   flaggedFieldIds: lowConfidenceFields.map(f => f.id)
 * });
 *
 * // When user views a field
 * useEffect(() => {
 *   if (selectedFieldId) {
 *     markFieldViewed(selectedFieldId);
 *   }
 * }, [selectedFieldId]);
 *
 * // When user confirms a field
 * const handleConfirm = (fieldId: string) => {
 *   confirmField(fieldId);
 * };
 *
 * // Check if can mark as audited
 * <button disabled={!allFieldsReviewed}>
 *   Mark as Audited
 * </button>
 * ```
 */
export function useFieldReview({
  flaggedFieldIds,
  confidenceThreshold: _confidenceThreshold = 0.90,
}: UseFieldReviewOptions): UseFieldReviewReturn {
  // Map of field ID to review status
  const [reviewStatuses, setReviewStatuses] = useState<Map<string, FieldReviewStatus>>(
    () => {
      const initial = new Map<string, FieldReviewStatus>();
      flaggedFieldIds.forEach((fieldId) => {
        initial.set(fieldId, {
          fieldId,
          viewed: false,
          interacted: false,
        });
      });
      return initial;
    }
  );

  /**
   * Mark a field as viewed
   */
  const markFieldViewed = useCallback((fieldId: string) => {
    setReviewStatuses((prev) => {
      const next = new Map(prev);
      const current = next.get(fieldId);
      if (current) {
        next.set(fieldId, {
          ...current,
          viewed: true,
        });
      } else {
        // Field wasn't flagged initially but is being tracked
        next.set(fieldId, {
          fieldId,
          viewed: true,
          interacted: false,
        });
      }
      return next;
    });
  }, []);

  /**
   * Mark field as confirmed (user verified value is correct)
   */
  const confirmField = useCallback((fieldId: string) => {
    setReviewStatuses((prev) => {
      const next = new Map(prev);
      const current = next.get(fieldId) || {
        fieldId,
        viewed: true,
        interacted: false,
      };
      next.set(fieldId, {
        ...current,
        viewed: true,
        interacted: true,
        action: 'confirmed',
        timestamp: new Date(),
      });
      return next;
    });
  }, []);

  /**
   * Mark field as edited (user changed the value)
   */
  const editField = useCallback((fieldId: string) => {
    setReviewStatuses((prev) => {
      const next = new Map(prev);
      const current = next.get(fieldId) || {
        fieldId,
        viewed: true,
        interacted: false,
      };
      next.set(fieldId, {
        ...current,
        viewed: true,
        interacted: true,
        action: 'edited',
        timestamp: new Date(),
      });
      return next;
    });
  }, []);

  /**
   * Check if a field has been reviewed (confirmed or edited)
   */
  const isFieldReviewed = useCallback(
    (fieldId: string): boolean => {
      const status = reviewStatuses.get(fieldId);
      return status?.interacted || false;
    },
    [reviewStatuses]
  );

  /**
   * Check if a field has been viewed
   */
  const isFieldViewed = useCallback(
    (fieldId: string): boolean => {
      const status = reviewStatuses.get(fieldId);
      return status?.viewed || false;
    },
    [reviewStatuses]
  );

  /**
   * Check if all flagged fields have been reviewed
   */
  const allFieldsReviewed = useMemo(() => {
    for (const fieldId of flaggedFieldIds) {
      const status = reviewStatuses.get(fieldId);
      if (!status?.interacted) {
        return false;
      }
    }
    return flaggedFieldIds.length > 0; // Must have at least one field to review
  }, [flaggedFieldIds, reviewStatuses]);

  /**
   * Count of unreviewed fields
   */
  const unreviewedCount = useMemo(() => {
    let count = 0;
    for (const fieldId of flaggedFieldIds) {
      const status = reviewStatuses.get(fieldId);
      if (!status?.interacted) {
        count++;
      }
    }
    return count;
  }, [flaggedFieldIds, reviewStatuses]);

  /**
   * Get next unreviewed field for keyboard navigation
   */
  const getNextUnreviewedField = useCallback(
    (currentFieldId?: string): string | null => {
      const unreviewedFields = flaggedFieldIds.filter((fieldId) => {
        const status = reviewStatuses.get(fieldId);
        return !status?.interacted;
      });

      if (unreviewedFields.length === 0) return null;

      if (!currentFieldId) {
        return unreviewedFields[0];
      }

      const currentIndex = unreviewedFields.indexOf(currentFieldId);
      if (currentIndex === -1) {
        return unreviewedFields[0];
      }

      // Wrap around to beginning if at end
      const nextIndex = (currentIndex + 1) % unreviewedFields.length;
      return unreviewedFields[nextIndex];
    },
    [flaggedFieldIds, reviewStatuses]
  );

  /**
   * Get previous unreviewed field for keyboard navigation
   */
  const getPreviousUnreviewedField = useCallback(
    (currentFieldId?: string): string | null => {
      const unreviewedFields = flaggedFieldIds.filter((fieldId) => {
        const status = reviewStatuses.get(fieldId);
        return !status?.interacted;
      });

      if (unreviewedFields.length === 0) return null;

      if (!currentFieldId) {
        return unreviewedFields[unreviewedFields.length - 1];
      }

      const currentIndex = unreviewedFields.indexOf(currentFieldId);
      if (currentIndex === -1) {
        return unreviewedFields[unreviewedFields.length - 1];
      }

      // Wrap around to end if at beginning
      const prevIndex =
        currentIndex === 0 ? unreviewedFields.length - 1 : currentIndex - 1;
      return unreviewedFields[prevIndex];
    },
    [flaggedFieldIds, reviewStatuses]
  );

  /**
   * Reset all review tracking
   */
  const resetReviews = useCallback(() => {
    const initial = new Map<string, FieldReviewStatus>();
    flaggedFieldIds.forEach((fieldId) => {
      initial.set(fieldId, {
        fieldId,
        viewed: false,
        interacted: false,
      });
    });
    setReviewStatuses(initial);
  }, [flaggedFieldIds]);

  return {
    markFieldViewed,
    confirmField,
    editField,
    isFieldReviewed,
    isFieldViewed,
    reviewStatuses,
    allFieldsReviewed,
    unreviewedCount,
    getNextUnreviewedField,
    getPreviousUnreviewedField,
    resetReviews,
  };
}

export default useFieldReview;
