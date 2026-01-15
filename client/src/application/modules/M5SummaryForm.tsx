import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';

/**
 * Validation schema for M5 fields (all calculated/read-only)
 */
const m5FormSchema = z.object({
  // Income Summary
  total_projected_revenue: z.number().default(0),
  other_income: z.number().default(0),
  total_income: z.number().default(0),

  // Expense Summary
  total_operating_expenses: z.number().default(0),
  total_debt_payments: z.number().default(0),
  total_expenses: z.number().default(0),

  // Cash Flow
  net_cash_flow: z.number(), // Can be negative

  // Financial Ratios
  debt_service_coverage_ratio: z.number().nullable(),
  current_ratio: z.number().nullable(),
  debt_to_asset_ratio: z.number().nullable(),

  // Balance Sheet Summary
  total_assets: z.number().default(0),
  total_liabilities: z.number().default(0),
  net_worth: z.number(),

  // Notes
  financial_notes: z.string().optional(),
});

export type M5FormData = z.infer<typeof m5FormSchema>;

/**
 * Input data from other modules needed to calculate M5
 */
export interface M5InputData {
  // From M3 (Financial Statement)
  total_assets?: number;
  total_liabilities?: number;
  net_worth?: number;
  total_current_assets?: number;
  total_current_liabilities?: number;

  // From M4 (Operations)
  total_projected_revenue?: number;
  total_operating_expenses?: number;

  // Additional financial data
  other_income?: number;
  annual_debt_payments?: number; // Principal + Interest
}

export interface M5SummaryFormProps {
  /** Input data from other modules */
  inputData?: M5InputData;
  /** Callback when calculations are refreshed */
  onRefresh?: () => void;
  /** Callback when form is submitted */
  onSubmit?: (data: M5FormData) => void;
  /** Allow editing of notes field */
  allowNotes?: boolean;
}

/**
 * M5 Summary & Ratios Form Component
 *
 * Certification Module 5: Financial summary with calculated ratios
 * All fields are read-only and calculated from M3 and M4 data
 */
export default function M5SummaryForm({
  inputData = {},
  onRefresh,
  onSubmit,
  allowNotes = true,
}: M5SummaryFormProps) {
  const [financialNotes, setFinancialNotes] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Calculate all derived values
  const calculations = React.useMemo(() => {
    const totalProjectedRevenue = inputData.total_projected_revenue || 0;
    const otherIncome = inputData.other_income || 0;
    const totalIncome = totalProjectedRevenue + otherIncome;

    const totalOperatingExpenses = inputData.total_operating_expenses || 0;
    const totalDebtPayments = inputData.annual_debt_payments || 0;
    const totalExpenses = totalOperatingExpenses + totalDebtPayments;

    const netCashFlow = totalIncome - totalExpenses;

    // DSCR = Net Operating Income / Total Debt Service
    // A DSCR > 1.0 means the entity generates sufficient income to cover debt payments
    // DSCR < 1.0 means insufficient income to cover debt
    const dscr = totalDebtPayments > 0
      ? (totalProjectedRevenue - totalOperatingExpenses) / totalDebtPayments
      : null;

    // Current Ratio = Current Assets / Current Liabilities
    // Measures short-term liquidity. Ratio > 1.0 is generally healthy.
    const currentRatio = (inputData.total_current_liabilities || 0) > 0
      ? (inputData.total_current_assets || 0) / (inputData.total_current_liabilities || 0)
      : null;

    // Debt-to-Asset Ratio = Total Liabilities / Total Assets
    // Measures financial leverage. Lower is better. >0.5 indicates high leverage.
    const debtToAssetRatio = (inputData.total_assets || 0) > 0
      ? (inputData.total_liabilities || 0) / (inputData.total_assets || 0)
      : null;

    return {
      total_projected_revenue: totalProjectedRevenue,
      other_income: otherIncome,
      total_income: totalIncome,
      total_operating_expenses: totalOperatingExpenses,
      total_debt_payments: totalDebtPayments,
      total_expenses: totalExpenses,
      net_cash_flow: netCashFlow,
      debt_service_coverage_ratio: dscr,
      current_ratio: currentRatio,
      debt_to_asset_ratio: debtToAssetRatio,
      total_assets: inputData.total_assets || 0,
      total_liabilities: inputData.total_liabilities || 0,
      net_worth: inputData.net_worth || 0,
    };
  }, [inputData]);

  useEffect(() => {
    setLastUpdated(new Date());
  }, [calculations]);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    setLastUpdated(new Date());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = m5FormSchema.parse({
        ...calculations,
        financial_notes: financialNotes,
      });

      if (onSubmit) {
        onSubmit(validatedData);
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '0.00';
    return Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatRatio = (value: number | undefined | null, decimals: number = 2): string => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(decimals);
  };

  const getRatioStatus = (
    ratio: number | null,
    goodThreshold: number,
    comparison: 'greater' | 'less'
  ): { color: string; label: string } => {
    if (ratio === null) return { color: 'text-gray-500', label: 'N/A' };

    const isGood = comparison === 'greater' ? ratio >= goodThreshold : ratio <= goodThreshold;

    if (isGood) {
      return { color: 'text-green-700', label: 'Healthy' };
    } else if (comparison === 'greater' && ratio >= goodThreshold * 0.8) {
      return { color: 'text-yellow-700', label: 'Acceptable' };
    } else if (comparison === 'less' && ratio <= goodThreshold * 1.2) {
      return { color: 'text-yellow-700', label: 'Acceptable' };
    } else {
      return { color: 'text-red-700', label: 'Needs Attention' };
    }
  };

  const dscrStatus = getRatioStatus(calculations.debt_service_coverage_ratio, 1.25, 'greater');
  const currentRatioStatus = getRatioStatus(calculations.current_ratio, 1.5, 'greater');
  const debtRatioStatus = getRatioStatus(calculations.debt_to_asset_ratio, 0.5, 'less');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header with refresh */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Financial Summary & Ratios
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        <Button
          type="button"
          onClick={handleRefresh}
          variant="outline"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Calculations
        </Button>
      </div>

      {/* Income Summary Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Income Summary
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-700">Total Projected Revenue (from M4):</span>
            <span className="font-semibold text-green-700">
              ${formatCurrency(calculations.total_projected_revenue)}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-700">Other Income:</span>
            <span className="font-semibold text-green-700">
              ${formatCurrency(calculations.other_income)}
            </span>
          </div>

          <div className="flex justify-between items-center p-4 bg-green-100 rounded-lg border-2 border-green-300">
            <span className="text-lg font-bold text-gray-900">TOTAL INCOME:</span>
            <span className="text-xl font-bold text-green-700">
              ${formatCurrency(calculations.total_income)}
            </span>
          </div>
        </div>
      </div>

      {/* Expense Summary Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
          </svg>
          Expense Summary
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-700">Total Operating Expenses (from M4):</span>
            <span className="font-semibold text-red-700">
              ${formatCurrency(calculations.total_operating_expenses)}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-700">Total Debt Payments (Annual):</span>
            <span className="font-semibold text-red-700">
              ${formatCurrency(calculations.total_debt_payments)}
            </span>
          </div>

          <div className="flex justify-between items-center p-4 bg-red-100 rounded-lg border-2 border-red-300">
            <span className="text-lg font-bold text-gray-900">TOTAL EXPENSES:</span>
            <span className="text-xl font-bold text-red-700">
              ${formatCurrency(calculations.total_expenses)}
            </span>
          </div>
        </div>
      </div>

      {/* Net Cash Flow Section */}
      <div className="border-2 rounded-lg p-6 bg-blue-50 border-blue-300">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              NET CASH FLOW
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total Income - Total Expenses
            </p>
          </div>
          <div className={`text-3xl font-bold ${calculations.net_cash_flow >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            {calculations.net_cash_flow >= 0 ? '+' : '-'}${formatCurrency(calculations.net_cash_flow)}
          </div>
        </div>
      </div>

      {/* Financial Ratios Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Key Financial Ratios
        </h3>

        <div className="space-y-4">
          {/* Debt Service Coverage Ratio */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-gray-900">Debt Service Coverage Ratio (DSCR)</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Measures ability to cover debt payments. Target: ≥ 1.25
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {formatRatio(calculations.debt_service_coverage_ratio)}
                </div>
                <div className={`text-sm font-semibold ${dscrStatus.color}`}>
                  {dscrStatus.label}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Formula: Net Operating Income ÷ Total Debt Service
            </div>
          </div>

          {/* Current Ratio */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-gray-900">Current Ratio</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Measures short-term liquidity. Target: ≥ 1.5
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {formatRatio(calculations.current_ratio)}
                </div>
                <div className={`text-sm font-semibold ${currentRatioStatus.color}`}>
                  {currentRatioStatus.label}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Formula: Current Assets ÷ Current Liabilities
            </div>
          </div>

          {/* Debt-to-Asset Ratio */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-gray-900">Debt-to-Asset Ratio</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Measures financial leverage. Target: ≤ 0.50
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {formatRatio(calculations.debt_to_asset_ratio)}
                </div>
                <div className={`text-sm font-semibold ${debtRatioStatus.color}`}>
                  {debtRatioStatus.label}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Formula: Total Liabilities ÷ Total Assets
            </div>
          </div>
        </div>
      </div>

      {/* Balance Sheet Summary */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Balance Sheet Summary (from M3)
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-700">Total Assets:</span>
            <span className="font-semibold text-green-700">
              ${formatCurrency(calculations.total_assets)}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-700">Total Liabilities:</span>
            <span className="font-semibold text-red-700">
              ${formatCurrency(calculations.total_liabilities)}
            </span>
          </div>

          <div className="flex justify-between items-center p-4 bg-indigo-100 rounded-lg border-2 border-indigo-300">
            <span className="text-lg font-bold text-gray-900">NET WORTH:</span>
            <span className={`text-xl font-bold ${calculations.net_worth >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
              ${formatCurrency(calculations.net_worth)}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Notes */}
      {allowNotes && (
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Notes</h3>
          <textarea
            value={financialNotes}
            onChange={(e) => setFinancialNotes(e.target.value)}
            placeholder="Add any additional notes about the financial summary..."
            className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">About These Calculations</h4>
            <p className="text-sm text-blue-800">
              All values on this page are automatically calculated from your entries in Modules 3 and 4.
              To update these calculations, modify the source data and click "Refresh Calculations".
            </p>
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={handleRefresh}>
          Refresh
        </Button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Complete Review
        </button>
      </div>
    </form>
  );
}
