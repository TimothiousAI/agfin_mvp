import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

/**
 * Validation schema for tract entry
 */
const tractSchema = z.object({
  tract_number: z.string().min(1, 'Tract number is required'),
  county: z.string().min(1, 'County is required'),
  acres_dry: z.number().min(0, 'Dry acres must be non-negative').default(0),
  acres_irrigated: z.number().min(0, 'Irrigated acres must be non-negative').default(0),
  farm_number: z.string().optional(),
  field_number: z.string().optional(),
});

export type Tract = z.infer<typeof tractSchema>;

const m2FormSchema = z.object({
  tracts: z.array(tractSchema).min(1, 'At least one tract is required'),
  total_acres_dry: z.number().min(0),
  total_acres_irrigated: z.number().min(0),
  total_acres: z.number().min(0),
});

export type M2FormData = z.infer<typeof m2FormSchema>;

/**
 * Field metadata for tracking data provenance
 */
export interface FieldMetadata {
  source: 'ai_extracted' | 'proxy_entered' | 'proxy_edited' | 'auditor_verified';
  confidence?: number;
  source_document_id?: string;
  source_document_name?: string;
}

export interface M2LandsFormProps {
  /** Initial form data (e.g., from FSA-578 extraction) */
  initialData?: Partial<M2FormData>;
  /** Field metadata (source, confidence) */
  fieldMetadata?: Record<string, FieldMetadata>;
  /** Callback when form data changes */
  onChange?: (data: Partial<M2FormData>) => void;
  /** Callback when form is submitted */
  onSubmit?: (data: M2FormData) => void;
  /** Read-only mode */
  readOnly?: boolean;
  /** Show confidence indicators */
  showConfidence?: boolean;
}

/**
 * M2 Lands Farmed Form Component
 *
 * Certification Module 2: Land tract information with acres dry/irrigated
 * Auto-populated from FSA-578 documents
 */
export default function M2LandsForm({
  initialData = {},
  fieldMetadata = {},
  onChange,
  onSubmit,
  readOnly = false,
  showConfidence = true,
}: M2LandsFormProps) {
  const [tracts, setTracts] = useState<Tract[]>(
    initialData.tracts || [
      {
        tract_number: '',
        county: '',
        acres_dry: 0,
        acres_irrigated: 0,
        farm_number: '',
        field_number: '',
      },
    ]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Calculate totals whenever tracts change
  const totals = React.useMemo(() => {
    const totalDry = tracts.reduce((sum, tract) => sum + (tract.acres_dry || 0), 0);
    const totalIrrigated = tracts.reduce((sum, tract) => sum + (tract.acres_irrigated || 0), 0);
    return {
      total_acres_dry: totalDry,
      total_acres_irrigated: totalIrrigated,
      total_acres: totalDry + totalIrrigated,
    };
  }, [tracts]);

  useEffect(() => {
    if (initialData.tracts && initialData.tracts.length > 0) {
      setTracts(initialData.tracts);
    }
  }, [initialData]);

  useEffect(() => {
    // Notify parent of changes
    if (onChange) {
      onChange({
        tracts,
        ...totals,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracts, totals]);

  const handleTractChange = (index: number, field: keyof Tract, value: any) => {
    const newTracts = [...tracts];
    newTracts[index] = {
      ...newTracts[index],
      [field]: field === 'acres_dry' || field === 'acres_irrigated'
        ? parseFloat(value) || 0
        : value,
    };
    setTracts(newTracts);

    // Clear error for this tract
    const errorKey = `tract_${index}_${field}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const handleAddTract = () => {
    if (readOnly) return;

    setTracts([
      ...tracts,
      {
        tract_number: '',
        county: '',
        acres_dry: 0,
        acres_irrigated: 0,
        farm_number: '',
        field_number: '',
      },
    ]);
  };

  const handleRemoveTract = (index: number) => {
    if (readOnly || tracts.length <= 1) return;

    const newTracts = tracts.filter((_, i) => i !== index);
    setTracts(newTracts);

    // Clear errors for this tract
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(`tract_${index}_`)) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  const handleBlur = (index: number, field: keyof Tract) => {
    const fieldKey = `tract_${index}_${field}`;
    setTouchedFields(prev => new Set(prev).add(fieldKey));

    // Validate single field on blur
    try {
      const fieldSchema = (tractSchema.shape as any)[field];
      if (fieldSchema) {
        fieldSchema.parse(tracts[index][field]);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [fieldKey]: error.errors[0].message,
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = m2FormSchema.parse({
        tracts,
        ...totals,
      });

      if (onSubmit) {
        onSubmit(validatedData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path.join('_')] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const getConfidenceBadge = (fieldName: string) => {
    if (!showConfidence) return null;

    const metadata = fieldMetadata[fieldName];
    if (!metadata) return null;

    const confidence = metadata.confidence ?? 0;
    let badgeColor = 'bg-gray-100 text-gray-700';
    let badgeText = 'Manual';

    if (metadata.source === 'ai_extracted' && confidence !== undefined) {
      if (confidence >= 0.9) {
        badgeColor = 'bg-green-100 text-green-800';
        badgeText = `${Math.round(confidence * 100)}% AI`;
      } else if (confidence >= 0.7) {
        badgeColor = 'bg-yellow-100 text-yellow-800';
        badgeText = `${Math.round(confidence * 100)}% AI`;
      } else {
        badgeColor = 'bg-red-100 text-red-800';
        badgeText = `${Math.round(confidence * 100)}% AI`;
      }
    } else if (metadata.source === 'auditor_verified') {
      badgeColor = 'bg-blue-100 text-blue-800';
      badgeText = 'Verified';
    }

    return (
      <span className={`ml-2 px-2 py-0.5 text-xs rounded ${badgeColor}`}>
        {badgeText}
        {metadata.source_document_name && (
          <span className="ml-1 opacity-75">({metadata.source_document_name})</span>
        )}
      </span>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tracts Section */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Land Tracts
            {getConfidenceBadge('tracts')}
          </h3>

          {!readOnly && (
            <Button
              type="button"
              onClick={handleAddTract}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Tract
            </Button>
          )}
        </div>

        {tracts.map((tract, index) => (
          <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Tract {index + 1}
              </h4>

              {!readOnly && tracts.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTract(index)}
                  className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tract Number */}
              <div>
                <Label htmlFor={`tract_${index}_tract_number`} className="flex items-center">
                  Tract Number
                  <span className="text-red-600 ml-1">*</span>
                </Label>
                <Input
                  id={`tract_${index}_tract_number`}
                  type="text"
                  value={tract.tract_number}
                  onChange={(e) => handleTractChange(index, 'tract_number', e.target.value)}
                  onBlur={() => handleBlur(index, 'tract_number')}
                  placeholder="e.g., 1234"
                  disabled={readOnly}
                  className={touchedFields.has(`tract_${index}_tract_number`) && errors[`tract_${index}_tract_number`] ? 'border-red-500' : ''}
                />
                {touchedFields.has(`tract_${index}_tract_number`) && errors[`tract_${index}_tract_number`] && (
                  <p className="text-xs text-red-600 mt-1">{errors[`tract_${index}_tract_number`]}</p>
                )}
              </div>

              {/* County */}
              <div>
                <Label htmlFor={`tract_${index}_county`} className="flex items-center">
                  County
                  <span className="text-red-600 ml-1">*</span>
                </Label>
                <Input
                  id={`tract_${index}_county`}
                  type="text"
                  value={tract.county}
                  onChange={(e) => handleTractChange(index, 'county', e.target.value)}
                  onBlur={() => handleBlur(index, 'county')}
                  placeholder="e.g., McLean"
                  disabled={readOnly}
                  className={touchedFields.has(`tract_${index}_county`) && errors[`tract_${index}_county`] ? 'border-red-500' : ''}
                />
                {touchedFields.has(`tract_${index}_county`) && errors[`tract_${index}_county`] && (
                  <p className="text-xs text-red-600 mt-1">{errors[`tract_${index}_county`]}</p>
                )}
              </div>

              {/* Farm Number (optional) */}
              <div>
                <Label htmlFor={`tract_${index}_farm_number`}>
                  Farm Number
                </Label>
                <Input
                  id={`tract_${index}_farm_number`}
                  type="text"
                  value={tract.farm_number || ''}
                  onChange={(e) => handleTractChange(index, 'farm_number', e.target.value)}
                  placeholder="Optional"
                  disabled={readOnly}
                />
              </div>

              {/* Field Number (optional) */}
              <div>
                <Label htmlFor={`tract_${index}_field_number`}>
                  Field Number
                </Label>
                <Input
                  id={`tract_${index}_field_number`}
                  type="text"
                  value={tract.field_number || ''}
                  onChange={(e) => handleTractChange(index, 'field_number', e.target.value)}
                  placeholder="Optional"
                  disabled={readOnly}
                />
              </div>

              {/* Dry Acres */}
              <div>
                <Label htmlFor={`tract_${index}_acres_dry`} className="flex items-center">
                  Dry Acres
                  <span className="text-red-600 ml-1">*</span>
                </Label>
                <Input
                  id={`tract_${index}_acres_dry`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={tract.acres_dry}
                  onChange={(e) => handleTractChange(index, 'acres_dry', e.target.value)}
                  onBlur={() => handleBlur(index, 'acres_dry')}
                  placeholder="0.00"
                  disabled={readOnly}
                  className={touchedFields.has(`tract_${index}_acres_dry`) && errors[`tract_${index}_acres_dry`] ? 'border-red-500' : ''}
                />
                {touchedFields.has(`tract_${index}_acres_dry`) && errors[`tract_${index}_acres_dry`] && (
                  <p className="text-xs text-red-600 mt-1">{errors[`tract_${index}_acres_dry`]}</p>
                )}
              </div>

              {/* Irrigated Acres */}
              <div>
                <Label htmlFor={`tract_${index}_acres_irrigated`} className="flex items-center">
                  Irrigated Acres
                  <span className="text-red-600 ml-1">*</span>
                </Label>
                <Input
                  id={`tract_${index}_acres_irrigated`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={tract.acres_irrigated}
                  onChange={(e) => handleTractChange(index, 'acres_irrigated', e.target.value)}
                  onBlur={() => handleBlur(index, 'acres_irrigated')}
                  placeholder="0.00"
                  disabled={readOnly}
                  className={touchedFields.has(`tract_${index}_acres_irrigated`) && errors[`tract_${index}_acres_irrigated`] ? 'border-red-500' : ''}
                />
                {touchedFields.has(`tract_${index}_acres_irrigated`) && errors[`tract_${index}_acres_irrigated`] && (
                  <p className="text-xs text-red-600 mt-1">{errors[`tract_${index}_acres_irrigated`]}</p>
                )}
              </div>
            </div>

            {/* Tract total */}
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Tract Total:</span> {(tract.acres_dry + tract.acres_irrigated).toFixed(2)} acres
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals Section */}
      <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Summary Totals
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-gray-600 mb-1">Total Dry Acres</div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_acres_dry.toFixed(2)}</div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-gray-600 mb-1">Total Irrigated Acres</div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_acres_irrigated.toFixed(2)}</div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-gray-600 mb-1">Total Acres</div>
            <div className="text-2xl font-bold text-blue-600">{totals.total_acres.toFixed(2)}</div>
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-3">
          ℹ️ Totals are calculated automatically from tract entries. Data can be auto-populated from FSA-578 documents.
        </p>
      </div>

      {/* Submit button */}
      {!readOnly && (
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save & Continue
          </button>
        </div>
      )}
    </form>
  );
}
