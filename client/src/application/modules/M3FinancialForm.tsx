import { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Validation schema for financial values (non-negative numbers)
 */
const currencySchema = z.number().min(0, 'Amount must be non-negative').default(0);

const m3FormSchema = z.object({
  // Current Assets
  cash_and_checking: currencySchema,
  savings: currencySchema,
  accounts_receivable: currencySchema,
  inventory: currencySchema,
  prepaid_expenses: currencySchema,
  other_current_assets: currencySchema,
  total_current_assets: currencySchema,

  // Fixed Assets
  land: currencySchema,
  buildings: currencySchema,
  machinery_equipment: currencySchema,
  vehicles: currencySchema,
  livestock: currencySchema,
  other_fixed_assets: currencySchema,
  total_fixed_assets: currencySchema,

  // Other Assets
  investments: currencySchema,
  retirement_accounts: currencySchema,
  life_insurance_cash_value: currencySchema,
  other_assets: currencySchema,
  total_other_assets: currencySchema,

  // Total Assets
  total_assets: currencySchema,

  // Current Liabilities
  accounts_payable: currencySchema,
  short_term_loans: currencySchema,
  current_portion_long_term: currencySchema,
  accrued_expenses: currencySchema,
  other_current_liabilities: currencySchema,
  total_current_liabilities: currencySchema,

  // Long-term Liabilities
  mortgage_payable: currencySchema,
  long_term_loans: currencySchema,
  equipment_loans: currencySchema,
  other_long_term_liabilities: currencySchema,
  total_long_term_liabilities: currencySchema,

  // Total Liabilities
  total_liabilities: currencySchema,

  // Net Worth
  net_worth: z.number(), // Can be negative
});

export type M3FormData = z.infer<typeof m3FormSchema>;

/**
 * Field metadata for tracking data provenance
 */
export interface FieldMetadata {
  source: 'ai_extracted' | 'proxy_entered' | 'proxy_edited' | 'auditor_verified';
  confidence?: number;
  source_document_id?: string;
  source_document_name?: string;
}

export interface M3FinancialFormProps {
  /** Initial form data (e.g., from balance sheet extraction) */
  initialData?: Partial<M3FormData>;
  /** Field metadata (source, confidence) */
  fieldMetadata?: Record<string, FieldMetadata>;
  /** Callback when form data changes */
  onChange?: (data: Partial<M3FormData>) => void;
  /** Callback when form is submitted */
  onSubmit?: (data: M3FormData) => void;
  /** Read-only mode */
  readOnly?: boolean;
  /** Show confidence indicators */
  showConfidence?: boolean;
}

/**
 * M3 Financial Statement Form Component
 *
 * Certification Module 3: Balance sheet with assets, liabilities, and net worth
 * Auto-populated from balance sheet documents
 */
export default function M3FinancialForm({
  initialData = {},
  fieldMetadata = {},
  onChange,
  onSubmit,
  readOnly = false,
  showConfidence = true,
}: M3FinancialFormProps) {
  const [formData, setFormData] = useState<Partial<M3FormData>>({
    cash_and_checking: 0,
    savings: 0,
    accounts_receivable: 0,
    inventory: 0,
    prepaid_expenses: 0,
    other_current_assets: 0,
    land: 0,
    buildings: 0,
    machinery_equipment: 0,
    vehicles: 0,
    livestock: 0,
    other_fixed_assets: 0,
    investments: 0,
    retirement_accounts: 0,
    life_insurance_cash_value: 0,
    other_assets: 0,
    accounts_payable: 0,
    short_term_loans: 0,
    current_portion_long_term: 0,
    accrued_expenses: 0,
    other_current_liabilities: 0,
    mortgage_payable: 0,
    long_term_loans: 0,
    equipment_loans: 0,
    other_long_term_liabilities: 0,
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Calculate totals whenever values change
  const totals = useMemo(() => {
    const currentAssets = (formData.cash_and_checking || 0) +
      (formData.savings || 0) +
      (formData.accounts_receivable || 0) +
      (formData.inventory || 0) +
      (formData.prepaid_expenses || 0) +
      (formData.other_current_assets || 0);

    const fixedAssets = (formData.land || 0) +
      (formData.buildings || 0) +
      (formData.machinery_equipment || 0) +
      (formData.vehicles || 0) +
      (formData.livestock || 0) +
      (formData.other_fixed_assets || 0);

    const otherAssets = (formData.investments || 0) +
      (formData.retirement_accounts || 0) +
      (formData.life_insurance_cash_value || 0) +
      (formData.other_assets || 0);

    const totalAssets = currentAssets + fixedAssets + otherAssets;

    const currentLiabilities = (formData.accounts_payable || 0) +
      (formData.short_term_loans || 0) +
      (formData.current_portion_long_term || 0) +
      (formData.accrued_expenses || 0) +
      (formData.other_current_liabilities || 0);

    const longTermLiabilities = (formData.mortgage_payable || 0) +
      (formData.long_term_loans || 0) +
      (formData.equipment_loans || 0) +
      (formData.other_long_term_liabilities || 0);

    const totalLiabilities = currentLiabilities + longTermLiabilities;

    const netWorth = totalAssets - totalLiabilities;

    return {
      total_current_assets: currentAssets,
      total_fixed_assets: fixedAssets,
      total_other_assets: otherAssets,
      total_assets: totalAssets,
      total_current_liabilities: currentLiabilities,
      total_long_term_liabilities: longTermLiabilities,
      total_liabilities: totalLiabilities,
      net_worth: netWorth,
    };
  }, [formData]);

  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setFormData({ ...formData, ...initialData });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  useEffect(() => {
    // Notify parent of changes (excluding onChange from deps to prevent infinite loop)
    if (onChange) {
      onChange({
        ...formData,
        ...totals,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, totals.net_worth]); // Only track net_worth to avoid recalc on every field

  const handleFieldChange = (fieldName: keyof M3FormData, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newData = { ...formData, [fieldName]: numValue };
    setFormData(newData);

    // Clear error for this field
    if (errors[fieldName]) {
      const newErrors = { ...errors };
      delete newErrors[fieldName];
      setErrors(newErrors);
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));

    // Validate single field on blur
    try {
      const fieldSchema = (m3FormSchema.shape as any)[fieldName];
      if (fieldSchema) {
        fieldSchema.parse(formData[fieldName as keyof M3FormData]);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: error.issues[0].message,
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = m3FormSchema.parse({
        ...formData,
        ...totals,
      });

      if (onSubmit) {
        onSubmit(validatedData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err: z.ZodIssue) => {
          if (err.path.length > 0) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.00';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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

  const renderCurrencyField = (
    fieldName: keyof M3FormData,
    label: string,
    placeholder?: string
  ) => {
    const hasError = touchedFields.has(fieldName) && errors[fieldName];

    return (
      <div>
        <Label htmlFor={fieldName} className="flex items-center">
          {label}
          {getConfidenceBadge(fieldName)}
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <Input
            id={fieldName}
            type="number"
            step="0.01"
            min="0"
            value={formData[fieldName] || 0}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            onBlur={() => handleBlur(fieldName)}
            placeholder={placeholder || '0.00'}
            disabled={readOnly}
            className={`pl-7 ${hasError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          />
        </div>
        {hasError && (
          <p className="text-xs text-red-600 mt-1">{errors[fieldName]}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Assets Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Assets
        </h3>

        {/* Current Assets */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-700 mb-3">Current Assets</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderCurrencyField('cash_and_checking', 'Cash & Checking')}
            {renderCurrencyField('savings', 'Savings')}
            {renderCurrencyField('accounts_receivable', 'Accounts Receivable')}
            {renderCurrencyField('inventory', 'Inventory')}
            {renderCurrencyField('prepaid_expenses', 'Prepaid Expenses')}
            {renderCurrencyField('other_current_assets', 'Other Current Assets')}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="flex justify-between items-center font-semibold text-gray-900">
              <span>Total Current Assets:</span>
              <span className="text-green-700">${formatCurrency(totals.total_current_assets)}</span>
            </div>
          </div>
        </div>

        {/* Fixed Assets */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-700 mb-3">Fixed Assets</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderCurrencyField('land', 'Land')}
            {renderCurrencyField('buildings', 'Buildings')}
            {renderCurrencyField('machinery_equipment', 'Machinery & Equipment')}
            {renderCurrencyField('vehicles', 'Vehicles')}
            {renderCurrencyField('livestock', 'Livestock')}
            {renderCurrencyField('other_fixed_assets', 'Other Fixed Assets')}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="flex justify-between items-center font-semibold text-gray-900">
              <span>Total Fixed Assets:</span>
              <span className="text-green-700">${formatCurrency(totals.total_fixed_assets)}</span>
            </div>
          </div>
        </div>

        {/* Other Assets */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-700 mb-3">Other Assets</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderCurrencyField('investments', 'Investments')}
            {renderCurrencyField('retirement_accounts', 'Retirement Accounts')}
            {renderCurrencyField('life_insurance_cash_value', 'Life Insurance Cash Value')}
            {renderCurrencyField('other_assets', 'Other Assets')}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="flex justify-between items-center font-semibold text-gray-900">
              <span>Total Other Assets:</span>
              <span className="text-green-700">${formatCurrency(totals.total_other_assets)}</span>
            </div>
          </div>
        </div>

        {/* Total Assets */}
        <div className="mt-6 pt-4 border-t-2 border-gray-400">
          <div className="flex justify-between items-center text-lg font-bold text-gray-900">
            <span>TOTAL ASSETS:</span>
            <span className="text-green-700">${formatCurrency(totals.total_assets)}</span>
          </div>
        </div>
      </div>

      {/* Liabilities Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
          </svg>
          Liabilities
        </h3>

        {/* Current Liabilities */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-700 mb-3">Current Liabilities</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderCurrencyField('accounts_payable', 'Accounts Payable')}
            {renderCurrencyField('short_term_loans', 'Short-term Loans')}
            {renderCurrencyField('current_portion_long_term', 'Current Portion of Long-term Debt')}
            {renderCurrencyField('accrued_expenses', 'Accrued Expenses')}
            {renderCurrencyField('other_current_liabilities', 'Other Current Liabilities')}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="flex justify-between items-center font-semibold text-gray-900">
              <span>Total Current Liabilities:</span>
              <span className="text-red-700">${formatCurrency(totals.total_current_liabilities)}</span>
            </div>
          </div>
        </div>

        {/* Long-term Liabilities */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-700 mb-3">Long-term Liabilities</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderCurrencyField('mortgage_payable', 'Mortgage Payable')}
            {renderCurrencyField('long_term_loans', 'Long-term Loans')}
            {renderCurrencyField('equipment_loans', 'Equipment Loans')}
            {renderCurrencyField('other_long_term_liabilities', 'Other Long-term Liabilities')}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="flex justify-between items-center font-semibold text-gray-900">
              <span>Total Long-term Liabilities:</span>
              <span className="text-red-700">${formatCurrency(totals.total_long_term_liabilities)}</span>
            </div>
          </div>
        </div>

        {/* Total Liabilities */}
        <div className="mt-6 pt-4 border-t-2 border-gray-400">
          <div className="flex justify-between items-center text-lg font-bold text-gray-900">
            <span>TOTAL LIABILITIES:</span>
            <span className="text-red-700">${formatCurrency(totals.total_liabilities)}</span>
          </div>
        </div>
      </div>

      {/* Net Worth Section */}
      <div className="border-2 rounded-lg p-6 bg-blue-50 border-blue-300">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              NET WORTH
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total Assets - Total Liabilities
            </p>
          </div>
          <div className={`text-3xl font-bold ${totals.net_worth >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            ${formatCurrency(Math.abs(totals.net_worth))}
            {totals.net_worth < 0 && <span className="text-sm ml-1">(deficit)</span>}
          </div>
        </div>
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
