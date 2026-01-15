import React, { useState } from 'react';
import M3FinancialForm from '../application/modules/M3FinancialForm';

interface FieldMetadata {
  source: 'ai_extracted' | 'proxy_entered' | 'proxy_edited' | 'auditor_verified';
  confidence?: number;
  source_document_id?: string;
  source_document_name?: string;
}

interface M3FormData {
  cash_and_checking: number;
  savings: number;
  accounts_receivable: number;
  inventory: number;
  prepaid_expenses: number;
  other_current_assets: number;
  total_current_assets: number;
  land: number;
  buildings: number;
  machinery_equipment: number;
  vehicles: number;
  livestock: number;
  other_fixed_assets: number;
  total_fixed_assets: number;
  investments: number;
  retirement_accounts: number;
  life_insurance_cash_value: number;
  other_assets: number;
  total_other_assets: number;
  total_assets: number;
  accounts_payable: number;
  short_term_loans: number;
  current_portion_long_term: number;
  accrued_expenses: number;
  other_current_liabilities: number;
  total_current_liabilities: number;
  mortgage_payable: number;
  long_term_loans: number;
  equipment_loans: number;
  other_long_term_liabilities: number;
  total_long_term_liabilities: number;
  total_liabilities: number;
  net_worth: number;
}

/**
 * Test page for M3 Financial Statement Form
 */
export function M3FormTest() {
  const [formData, setFormData] = useState<Partial<M3FormData>>({});
  const [submitted, setSubmitted] = useState(false);

  // Mock field metadata (as if extracted from balance sheet)
  const mockMetadata: Record<string, FieldMetadata> = {
    'cash_and_checking': {
      source: 'ai_extracted',
      confidence: 0.95,
      source_document_name: 'Balance Sheet.pdf',
    },
  };

  const handleChange = (data: Partial<M3FormData>) => {
    setFormData(data);
    setSubmitted(false);
  };

  const handleSubmit = (data: M3FormData) => {
    console.log('Form submitted:', data);
    setSubmitted(true);
    alert(`Form submitted! Net Worth: $${data.net_worth.toFixed(2)}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Module 3: Financial Statement Form Test
          </h1>
          <p className="text-gray-600">
            Test the financial form with assets, liabilities, and automatic net worth calculation.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <M3FinancialForm
            initialData={formData}
            fieldMetadata={mockMetadata}
            onChange={handleChange}
            onSubmit={handleSubmit}
            showConfidence={true}
          />
        </div>

        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-green-800 font-semibold mb-2">✅ Form Submitted Successfully!</h3>
            <pre className="text-xs bg-green-100 p-3 rounded overflow-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold mb-2">📊 Current Calculations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">Total Assets:</span>
              <span className="ml-2">${(formData.total_assets || 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="font-semibold">Total Liabilities:</span>
              <span className="ml-2">${(formData.total_liabilities || 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="font-semibold">Net Worth:</span>
              <span className={`ml-2 font-bold ${(formData.net_worth || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ${(formData.net_worth || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
