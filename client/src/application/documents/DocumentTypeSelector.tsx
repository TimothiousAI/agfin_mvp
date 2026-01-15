import React from 'react';

export type DocumentType =
  | 'drivers_license'
  | 'schedule_f'
  | 'organization_docs'
  | 'balance_sheet'
  | 'fsa_578'
  | 'current_crop_insurance'
  | 'prior_crop_insurance'
  | 'lease_agreement'
  | 'equipment_list';

interface DocumentTypeInfo {
  id: DocumentType;
  label: string;
  description: string;
  icon: React.ReactNode;
  required?: boolean;
}

interface DocumentTypeSelectorProps {
  selectedType?: DocumentType;
  onSelectType: (type: DocumentType) => void;
  disabled?: boolean;
}

const DOCUMENT_TYPES: DocumentTypeInfo[] = [
  {
    id: 'drivers_license',
    label: "Driver's License",
    description: 'Government-issued photo identification',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
      </svg>
    ),
    required: true,
  },
  {
    id: 'schedule_f',
    label: 'Schedule F (Tax)',
    description: 'IRS Schedule F - Profit or Loss from Farming',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    required: true,
  },
  {
    id: 'organization_docs',
    label: 'Organization Documents',
    description: 'LLC, corporation, or partnership documents',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    required: true,
  },
  {
    id: 'balance_sheet',
    label: 'Balance Sheet',
    description: 'Current financial statement of assets and liabilities',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    required: true,
  },
  {
    id: 'fsa_578',
    label: 'FSA-578 Form',
    description: 'USDA Farm Service Agency application form',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    required: true,
  },
  {
    id: 'current_crop_insurance',
    label: 'Current Crop Insurance',
    description: 'Active crop insurance policy documentation',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    required: true,
  },
  {
    id: 'prior_crop_insurance',
    label: 'Prior Year Crop Insurance',
    description: 'Previous year crop insurance records',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: 'lease_agreement',
    label: 'Lease Agreement',
    description: 'Land or equipment lease contracts',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: 'equipment_list',
    label: 'Equipment List',
    description: 'Inventory of farm machinery and equipment',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

export default function DocumentTypeSelector({
  selectedType,
  onSelectType,
  disabled = false,
}: DocumentTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select Document Type
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DOCUMENT_TYPES.map((docType) => {
          const isSelected = selectedType === docType.id;

          return (
            <button
              key={docType.id}
              type="button"
              onClick={() => onSelectType(docType.id)}
              disabled={disabled}
              className={`
                relative flex items-start p-4 rounded-lg border-2 text-left
                transition-all duration-200
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
            >
              {/* Icon */}
              <div
                className={`
                  flex-shrink-0 mr-3 mt-1
                  ${isSelected ? 'text-blue-600' : 'text-gray-400'}
                `}
              >
                {docType.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span
                      className={`
                        block text-sm font-medium
                        ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                      `}
                    >
                      {docType.label}
                      {docType.required && (
                        <span className="ml-1 text-red-500" title="Required">
                          *
                        </span>
                      )}
                    </span>
                    <span
                      className={`
                        block text-xs mt-1
                        ${isSelected ? 'text-blue-700' : 'text-gray-500'}
                      `}
                    >
                      {docType.description}
                    </span>
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <svg
                      className="flex-shrink-0 h-5 w-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-500 mt-3">
        <span className="text-red-500">*</span> Required documents for application
      </p>
    </div>
  );
}

// Export document types for use in other components
export { DOCUMENT_TYPES };
