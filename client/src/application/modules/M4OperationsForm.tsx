import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

/**
 * Validation schemas for M4 fields
 */
const currencySchema = z.number().min(0, 'Amount must be non-negative').default(0);
const positiveNumberSchema = z.number().min(0, 'Value must be non-negative').default(0);

const cropEntrySchema = z.object({
  crop_name: z.string().min(1, 'Crop name is required'),
  acres: positiveNumberSchema,
  expected_yield: positiveNumberSchema,
  yield_unit: z.string().min(1, 'Yield unit is required'), // bushels, tons, cwt, etc.
  expected_price: currencySchema,
  price_unit: z.string().min(1, 'Price unit is required'), // per bushel, per ton, etc.
  total_revenue: currencySchema,
  crop_insurance_coverage: currencySchema.optional(),
});

const expenseEntrySchema = z.object({
  category: z.string().min(1, 'Expense category is required'),
  description: z.string().optional(),
  amount: currencySchema,
});

const m4FormSchema = z.object({
  // Crop Operations
  crops: z.array(cropEntrySchema).min(1, 'At least one crop entry is required'),
  total_acres: positiveNumberSchema,
  total_projected_revenue: currencySchema,

  // Operating Expenses
  expenses: z.array(expenseEntrySchema).min(1, 'At least one expense entry is required'),
  total_operating_expenses: currencySchema,

  // Loan Request
  loan_amount_requested: currencySchema,
  loan_purpose: z.string().min(1, 'Loan purpose is required'),
  repayment_source: z.string().optional(),

  // Net Operating Income
  net_operating_income: z.number(), // Can be negative
});

export type M4FormData = z.infer<typeof m4FormSchema>;
export type CropEntry = z.infer<typeof cropEntrySchema>;
export type ExpenseEntry = z.infer<typeof expenseEntrySchema>;

/**
 * Field metadata for tracking data provenance
 */
export interface FieldMetadata {
  source: 'ai_extracted' | 'proxy_entered' | 'proxy_edited' | 'auditor_verified';
  confidence?: number;
  source_document_id?: string;
  source_document_name?: string;
}

export interface M4OperationsFormProps {
  /** Initial form data (e.g., from Schedule F, crop insurance extraction) */
  initialData?: Partial<M4FormData>;
  /** Field metadata (source, confidence) */
  fieldMetadata?: Record<string, FieldMetadata>;
  /** Callback when form data changes */
  onChange?: (data: Partial<M4FormData>) => void;
  /** Callback when form is submitted */
  onSubmit?: (data: M4FormData) => void;
  /** Read-only mode */
  readOnly?: boolean;
  /** Show confidence indicators */
  showConfidence?: boolean;
}

/**
 * M4 Projected Operations Form Component
 *
 * Certification Module 4: Projected crop operations, expenses, and loan request
 * Auto-populated from Schedule F and crop insurance documents
 */
export default function M4OperationsForm({
  initialData = {},
  fieldMetadata = {},
  onChange,
  onSubmit,
  readOnly = false,
  showConfidence = true,
}: M4OperationsFormProps) {
  const [formData, setFormData] = useState<Partial<M4FormData>>({
    crops: [
      {
        crop_name: '',
        acres: 0,
        expected_yield: 0,
        yield_unit: 'bushels',
        expected_price: 0,
        price_unit: 'per bushel',
        total_revenue: 0,
        crop_insurance_coverage: 0,
      },
    ],
    expenses: [
      {
        category: '',
        description: '',
        amount: 0,
      },
    ],
    loan_amount_requested: 0,
    loan_purpose: '',
    repayment_source: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Common expense categories
  const expenseCategories = [
    'Seeds',
    'Fertilizer',
    'Pesticides/Herbicides',
    'Fuel',
    'Labor',
    'Equipment Rental',
    'Irrigation',
    'Storage',
    'Marketing',
    'Insurance',
    'Property Taxes',
    'Repairs & Maintenance',
    'Interest',
    'Other',
  ];

  // Calculate totals whenever values change
  const totals = React.useMemo(() => {
    const crops = formData.crops || [];
    const expenses = formData.expenses || [];

    const totalAcres = crops.reduce((sum, crop) => sum + (crop.acres || 0), 0);
    const totalProjectedRevenue = crops.reduce((sum, crop) => sum + (crop.total_revenue || 0), 0);
    const totalOperatingExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const netOperatingIncome = totalProjectedRevenue - totalOperatingExpenses;

    return {
      total_acres: totalAcres,
      total_projected_revenue: totalProjectedRevenue,
      total_operating_expenses: totalOperatingExpenses,
      net_operating_income: netOperatingIncome,
    };
  }, [formData.crops, formData.expenses]);

  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setFormData({ ...formData, ...initialData });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  useEffect(() => {
    // Notify parent of changes
    if (onChange) {
      onChange({
        ...formData,
        ...totals,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, totals.net_operating_income]);

  const handleCropChange = (index: number, field: keyof CropEntry, value: any) => {
    const newCrops = [...(formData.crops || [])];
    newCrops[index] = { ...newCrops[index], [field]: value };

    // Auto-calculate total revenue when yield or price changes
    if (field === 'expected_yield' || field === 'expected_price') {
      const crop = newCrops[index];
      const yield_val = parseFloat(String(crop.expected_yield)) || 0;
      const price_val = parseFloat(String(crop.expected_price)) || 0;
      newCrops[index].total_revenue = yield_val * price_val;
    }

    setFormData({ ...formData, crops: newCrops });
  };

  const addCropEntry = () => {
    const newCrops = [
      ...(formData.crops || []),
      {
        crop_name: '',
        acres: 0,
        expected_yield: 0,
        yield_unit: 'bushels',
        expected_price: 0,
        price_unit: 'per bushel',
        total_revenue: 0,
        crop_insurance_coverage: 0,
      },
    ];
    setFormData({ ...formData, crops: newCrops });
  };

  const removeCropEntry = (index: number) => {
    const newCrops = (formData.crops || []).filter((_, i) => i !== index);
    setFormData({ ...formData, crops: newCrops });
  };

  const handleExpenseChange = (index: number, field: keyof ExpenseEntry, value: any) => {
    const newExpenses = [...(formData.expenses || [])];
    newExpenses[index] = { ...newExpenses[index], [field]: value };
    setFormData({ ...formData, expenses: newExpenses });
  };

  const addExpenseEntry = () => {
    const newExpenses = [
      ...(formData.expenses || []),
      {
        category: '',
        description: '',
        amount: 0,
      },
    ];
    setFormData({ ...formData, expenses: newExpenses });
  };

  const removeExpenseEntry = (index: number) => {
    const newExpenses = (formData.expenses || []).filter((_, i) => i !== index);
    setFormData({ ...formData, expenses: newExpenses });
  };

  const handleFieldChange = (fieldName: keyof M4FormData, value: any) => {
    const newData = { ...formData, [fieldName]: value };
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = m4FormSchema.parse({
        ...formData,
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
            newErrors[err.path.join('.')] = err.message;
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Crop Operations Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          Projected Crop Operations
        </h3>

        {(formData.crops || []).map((crop, index) => (
          <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-semibold text-gray-700">Crop #{index + 1}</h4>
              {!readOnly && (formData.crops?.length || 0) > 1 && (
                <Button
                  type="button"
                  onClick={() => removeCropEntry(index)}
                  variant="destructive"
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`crop_name_${index}`}>
                  Crop/Commodity Name
                  <span className="text-red-600 ml-1">*</span>
                  {getConfidenceBadge(`crops.${index}.crop_name`)}
                </Label>
                <Input
                  id={`crop_name_${index}`}
                  value={crop.crop_name || ''}
                  onChange={(e) => handleCropChange(index, 'crop_name', e.target.value)}
                  placeholder="e.g., Corn, Soybeans, Wheat"
                  disabled={readOnly}
                />
              </div>

              <div>
                <Label htmlFor={`acres_${index}`}>
                  Acres
                  {getConfidenceBadge(`crops.${index}.acres`)}
                </Label>
                <Input
                  id={`acres_${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={crop.acres || 0}
                  onChange={(e) => handleCropChange(index, 'acres', parseFloat(e.target.value) || 0)}
                  disabled={readOnly}
                />
              </div>

              <div>
                <Label htmlFor={`expected_yield_${index}`}>
                  Expected Yield
                  {getConfidenceBadge(`crops.${index}.expected_yield`)}
                </Label>
                <Input
                  id={`expected_yield_${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={crop.expected_yield || 0}
                  onChange={(e) => handleCropChange(index, 'expected_yield', parseFloat(e.target.value) || 0)}
                  disabled={readOnly}
                />
              </div>

              <div>
                <Label htmlFor={`yield_unit_${index}`}>
                  Yield Unit
                </Label>
                <select
                  id={`yield_unit_${index}`}
                  value={crop.yield_unit || 'bushels'}
                  onChange={(e) => handleCropChange(index, 'yield_unit', e.target.value)}
                  disabled={readOnly}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bushels">Bushels</option>
                  <option value="tons">Tons</option>
                  <option value="cwt">CWT (Hundredweight)</option>
                  <option value="pounds">Pounds</option>
                  <option value="bales">Bales</option>
                  <option value="units">Units</option>
                </select>
              </div>

              <div>
                <Label htmlFor={`expected_price_${index}`}>
                  Expected Price
                  {getConfidenceBadge(`crops.${index}.expected_price`)}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id={`expected_price_${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={crop.expected_price || 0}
                    onChange={(e) => handleCropChange(index, 'expected_price', parseFloat(e.target.value) || 0)}
                    disabled={readOnly}
                    className="pl-7"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`price_unit_${index}`}>
                  Price Unit
                </Label>
                <select
                  id={`price_unit_${index}`}
                  value={crop.price_unit || 'per bushel'}
                  onChange={(e) => handleCropChange(index, 'price_unit', e.target.value)}
                  disabled={readOnly}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="per bushel">Per Bushel</option>
                  <option value="per ton">Per Ton</option>
                  <option value="per cwt">Per CWT</option>
                  <option value="per pound">Per Pound</option>
                  <option value="per bale">Per Bale</option>
                  <option value="per unit">Per Unit</option>
                </select>
              </div>

              <div>
                <Label htmlFor={`crop_insurance_coverage_${index}`}>
                  Crop Insurance Coverage (Optional)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id={`crop_insurance_coverage_${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={crop.crop_insurance_coverage || 0}
                    onChange={(e) => handleCropChange(index, 'crop_insurance_coverage', parseFloat(e.target.value) || 0)}
                    disabled={readOnly}
                    className="pl-7"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg">
                  <span className="font-semibold text-gray-700">Total Revenue for this crop:</span>
                  <span className="text-lg font-bold text-green-700">
                    ${formatCurrency(crop.total_revenue)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Calculated: Expected Yield × Expected Price
                </p>
              </div>
            </div>
          </div>
        ))}

        {!readOnly && (
          <Button
            type="button"
            onClick={addCropEntry}
            variant="outline"
            className="w-full"
          >
            + Add Another Crop
          </Button>
        )}

        <div className="mt-6 pt-4 border-t-2 border-gray-400">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Acres:</span>
              <span className="text-lg font-bold text-gray-900">{totals.total_acres.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Projected Revenue:</span>
              <span className="text-lg font-bold text-green-700">${formatCurrency(totals.total_projected_revenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operating Expenses Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Operating Expenses
        </h3>

        {(formData.expenses || []).map((expense, index) => (
          <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-semibold text-gray-700">Expense #{index + 1}</h4>
              {!readOnly && (formData.expenses?.length || 0) > 1 && (
                <Button
                  type="button"
                  onClick={() => removeExpenseEntry(index)}
                  variant="destructive"
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`expense_category_${index}`}>
                  Category
                  <span className="text-red-600 ml-1">*</span>
                </Label>
                <select
                  id={`expense_category_${index}`}
                  value={expense.category || ''}
                  onChange={(e) => handleExpenseChange(index, 'category', e.target.value)}
                  disabled={readOnly}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category...</option>
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor={`expense_description_${index}`}>
                  Description (Optional)
                </Label>
                <Input
                  id={`expense_description_${index}`}
                  value={expense.description || ''}
                  onChange={(e) => handleExpenseChange(index, 'description', e.target.value)}
                  placeholder="Additional details"
                  disabled={readOnly}
                />
              </div>

              <div>
                <Label htmlFor={`expense_amount_${index}`}>
                  Amount
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id={`expense_amount_${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={expense.amount || 0}
                    onChange={(e) => handleExpenseChange(index, 'amount', parseFloat(e.target.value) || 0)}
                    disabled={readOnly}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {!readOnly && (
          <Button
            type="button"
            onClick={addExpenseEntry}
            variant="outline"
            className="w-full"
          >
            + Add Another Expense
          </Button>
        )}

        <div className="mt-6 pt-4 border-t-2 border-gray-400">
          <div className="flex justify-between items-center text-lg font-bold text-gray-900">
            <span>TOTAL OPERATING EXPENSES:</span>
            <span className="text-red-700">${formatCurrency(totals.total_operating_expenses)}</span>
          </div>
        </div>
      </div>

      {/* Net Operating Income */}
      <div className="border-2 rounded-lg p-6 bg-blue-50 border-blue-300">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">NET OPERATING INCOME</h3>
            <p className="text-sm text-gray-600 mt-1">
              Total Projected Revenue - Total Operating Expenses
            </p>
          </div>
          <div className={`text-3xl font-bold ${totals.net_operating_income >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            ${formatCurrency(Math.abs(totals.net_operating_income))}
            {totals.net_operating_income < 0 && <span className="text-sm ml-1">(loss)</span>}
          </div>
        </div>
      </div>

      {/* Loan Request Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Loan Request
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="loan_amount_requested">
              Loan Amount Requested
              <span className="text-red-600 ml-1">*</span>
              {getConfidenceBadge('loan_amount_requested')}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="loan_amount_requested"
                type="number"
                step="0.01"
                min="0"
                value={formData.loan_amount_requested || 0}
                onChange={(e) => handleFieldChange('loan_amount_requested', parseFloat(e.target.value) || 0)}
                onBlur={() => handleBlur('loan_amount_requested')}
                disabled={readOnly}
                className="pl-7"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="loan_purpose">
              Loan Purpose
              <span className="text-red-600 ml-1">*</span>
            </Label>
            <Input
              id="loan_purpose"
              value={formData.loan_purpose || ''}
              onChange={(e) => handleFieldChange('loan_purpose', e.target.value)}
              onBlur={() => handleBlur('loan_purpose')}
              placeholder="e.g., Operating expenses, Equipment purchase"
              disabled={readOnly}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="repayment_source">
              Repayment Source (Optional)
            </Label>
            <Input
              id="repayment_source"
              value={formData.repayment_source || ''}
              onChange={(e) => handleFieldChange('repayment_source', e.target.value)}
              placeholder="e.g., Crop sales, livestock sales"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="border border-red-300 rounded-lg p-4 bg-red-50">
          <h4 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h4>
          <ul className="list-disc list-inside text-red-700 text-sm">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </div>
      )}

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
