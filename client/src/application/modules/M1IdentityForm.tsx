import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

/**
 * Validation schemas for M1 fields
 */
const ssnSchema = z.string()
  .regex(/^\d{3}-?\d{2}-?\d{4}$/, 'Invalid SSN format. Use XXX-XX-XXXX')
  .transform(val => val.replace(/-/g, ''));

const einSchema = z.string()
  .regex(/^\d{2}-?\d{7}$/, 'Invalid EIN format. Use XX-XXXXXXX');

const dobSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
  .refine(val => {
    const date = new Date(val);
    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();
    return age >= 18 && age <= 120;
  }, 'Applicant must be 18-120 years old');

const m1FormSchema = z.object({
  // Personal Information
  applicant_first_name: z.string().min(1, 'First name is required').max(100),
  applicant_middle_name: z.string().max(100).optional(),
  applicant_last_name: z.string().min(1, 'Last name is required').max(100),
  applicant_dob: dobSchema,
  applicant_ssn: ssnSchema,

  // Address
  applicant_address_street: z.string().min(1, 'Street address is required'),
  applicant_address_city: z.string().min(1, 'City is required'),
  applicant_address_state: z.string().length(2, 'State must be 2-letter code'),
  applicant_address_zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  applicant_address_county: z.string().optional(),

  // Entity Information
  entity_type: z.enum(['individual', 'partnership', 'llc', 'corporation', 's_corp', 'trust', 'estate'], {
    errorMap: () => ({ message: 'Please select an entity type' })
  }),
  organization_legal_name: z.string().optional(),
  organization_ein: einSchema.optional(),
  organization_structure: z.string().optional(),

  // Partners/Members (for non-individual entities)
  organization_members: z.array(z.object({
    name: z.string(),
    ownership_percentage: z.number().min(0).max(100),
    role: z.string().optional(),
  })).optional(),
});

export type M1FormData = z.infer<typeof m1FormSchema>;

/**
 * Field metadata for tracking data provenance
 */
export interface FieldMetadata {
  source: 'ai_extracted' | 'proxy_entered' | 'proxy_edited' | 'auditor_verified';
  confidence?: number;
  source_document_id?: string;
  source_document_name?: string;
}

export interface M1IdentityFormProps {
  /** Initial form data (e.g., from document extraction) */
  initialData?: Partial<M1FormData>;
  /** Field metadata (source, confidence) */
  fieldMetadata?: Record<string, FieldMetadata>;
  /** Callback when form data changes */
  onChange?: (data: Partial<M1FormData>) => void;
  /** Callback when form is submitted */
  onSubmit?: (data: M1FormData) => void;
  /** Read-only mode */
  readOnly?: boolean;
  /** Show confidence indicators */
  showConfidence?: boolean;
}

/**
 * M1 Identity & Entity Form Component
 *
 * Certification Module 1: Applicant identity and business entity information
 */
export default function M1IdentityForm({
  initialData = {},
  fieldMetadata = {},
  onChange,
  onSubmit,
  readOnly = false,
  showConfidence = true,
}: M1IdentityFormProps) {
  const [formData, setFormData] = useState<Partial<M1FormData>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSsn, setShowSsn] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleFieldChange = (fieldName: keyof M1FormData, value: any) => {
    const newData = { ...formData, [fieldName]: value };
    setFormData(newData);

    // Clear error for this field
    if (errors[fieldName]) {
      const newErrors = { ...errors };
      delete newErrors[fieldName];
      setErrors(newErrors);
    }

    // Notify parent of change
    if (onChange) {
      onChange(newData);
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));

    // Validate single field on blur
    try {
      const fieldSchema = (m1FormSchema.shape as any)[fieldName];
      if (fieldSchema) {
        fieldSchema.parse(formData[fieldName as keyof M1FormData]);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: error.errors[0].message,
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = m1FormSchema.parse(formData);
      if (onSubmit) {
        onSubmit(validatedData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const maskSSN = (ssn: string | undefined): string => {
    if (!ssn) return '';
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length !== 9) return ssn;
    return `***-**-${cleaned.slice(-4)}`;
  };

  const formatSSN = (ssn: string | undefined): string => {
    if (!ssn) return '';
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length !== 9) return ssn;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
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

  const renderField = (
    fieldName: keyof M1FormData,
    label: string,
    type: string = 'text',
    required: boolean = false,
    placeholder?: string
  ) => {
    const hasError = touchedFields.has(fieldName) && errors[fieldName];

    return (
      <div>
        <Label htmlFor={fieldName} className="flex items-center">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
          {getConfidenceBadge(fieldName)}
        </Label>
        <Input
          id={fieldName}
          type={type}
          value={formData[fieldName] as string || ''}
          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          onBlur={() => handleBlur(fieldName)}
          placeholder={placeholder}
          disabled={readOnly}
          className={hasError ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
        {hasError && (
          <p className="text-xs text-red-600 mt-1">{errors[fieldName]}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Applicant Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('applicant_first_name', 'First Name', 'text', true, 'John')}
          {renderField('applicant_middle_name', 'Middle Name', 'text', false, 'Michael')}
          {renderField('applicant_last_name', 'Last Name', 'text', true, 'Doe')}

          <div>
            <Label htmlFor="applicant_dob" className="flex items-center">
              Date of Birth
              <span className="text-red-600 ml-1">*</span>
              {getConfidenceBadge('applicant_dob')}
            </Label>
            <Input
              id="applicant_dob"
              type="date"
              value={formData.applicant_dob || ''}
              onChange={(e) => handleFieldChange('applicant_dob', e.target.value)}
              onBlur={() => handleBlur('applicant_dob')}
              disabled={readOnly}
              className={touchedFields.has('applicant_dob') && errors.applicant_dob ? 'border-red-500' : ''}
            />
            {touchedFields.has('applicant_dob') && errors.applicant_dob && (
              <p className="text-xs text-red-600 mt-1">{errors.applicant_dob}</p>
            )}
          </div>

          <div>
            <Label htmlFor="applicant_ssn" className="flex items-center">
              Social Security Number
              <span className="text-red-600 ml-1">*</span>
              {getConfidenceBadge('applicant_ssn')}
              <button
                type="button"
                onClick={() => setShowSsn(!showSsn)}
                className="ml-auto text-xs text-blue-600 hover:text-blue-800"
              >
                {showSsn ? 'Hide' : 'Show'}
              </button>
            </Label>
            <Input
              id="applicant_ssn"
              type={showSsn ? 'text' : 'password'}
              value={showSsn ? formatSSN(formData.applicant_ssn) : maskSSN(formData.applicant_ssn)}
              onChange={(e) => handleFieldChange('applicant_ssn', e.target.value.replace(/\D/g, ''))}
              onBlur={() => handleBlur('applicant_ssn')}
              placeholder="XXX-XX-XXXX"
              disabled={readOnly}
              className={touchedFields.has('applicant_ssn') && errors.applicant_ssn ? 'border-red-500' : ''}
              maxLength={11}
            />
            {touchedFields.has('applicant_ssn') && errors.applicant_ssn && (
              <p className="text-xs text-red-600 mt-1">{errors.applicant_ssn}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              🔒 SSN is encrypted and masked for security
            </p>
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Address
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {renderField('applicant_address_street', 'Street Address', 'text', true, '123 Main Street')}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderField('applicant_address_city', 'City', 'text', true, 'Springfield')}
            {renderField('applicant_address_state', 'State', 'text', true, 'IL')}
            {renderField('applicant_address_zip', 'ZIP Code', 'text', true, '62701')}
          </div>

          {renderField('applicant_address_county', 'County', 'text', false, 'Sangamon')}
        </div>
      </div>

      {/* Entity Information Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Business Entity Type
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="entity_type" className="flex items-center">
              Entity Type
              <span className="text-red-600 ml-1">*</span>
              {getConfidenceBadge('entity_type')}
            </Label>
            <select
              id="entity_type"
              value={formData.entity_type || ''}
              onChange={(e) => handleFieldChange('entity_type', e.target.value)}
              onBlur={() => handleBlur('entity_type')}
              disabled={readOnly}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select entity type...</option>
              <option value="individual">Individual</option>
              <option value="partnership">Partnership</option>
              <option value="llc">LLC</option>
              <option value="corporation">Corporation</option>
              <option value="s_corp">S Corporation</option>
              <option value="trust">Trust</option>
              <option value="estate">Estate</option>
            </select>
            {touchedFields.has('entity_type') && errors.entity_type && (
              <p className="text-xs text-red-600 mt-1">{errors.entity_type}</p>
            )}
          </div>

          {formData.entity_type && formData.entity_type !== 'individual' && (
            <>
              {renderField('organization_legal_name', 'Legal Business Name', 'text', true, 'ABC Farms LLC')}
              {renderField('organization_ein', 'EIN', 'text', true, 'XX-XXXXXXX')}
              {renderField('organization_structure', 'Organization Structure', 'text', false, 'Member-managed LLC')}
            </>
          )}
        </div>

        {formData.entity_type && formData.entity_type !== 'individual' && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              For partnerships, LLCs, and corporations, you'll provide member/partner information in the next step.
            </p>
          </div>
        )}
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
