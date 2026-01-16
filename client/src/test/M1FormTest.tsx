import { useState } from 'react';
import M1IdentityForm from '../application/modules/M1IdentityForm';
import type { M1FormData, FieldMetadata } from '../application/modules/M1IdentityForm';

/**
 * Test page for M1 Identity & Entity Form
 */
export function M1FormTest() {
  const [formData, setFormData] = useState<Partial<M1FormData>>({});
  const [submitted, setSubmitted] = useState(false);

  // Mock field metadata (as if extracted from driver's license and tax documents)
  const mockMetadata: Record<string, FieldMetadata> = {
    'applicant_first_name': {
      source: 'ai_extracted',
      confidence: 0.97,
      source_document_name: 'drivers-license.pdf',
    },
    'applicant_last_name': {
      source: 'ai_extracted',
      confidence: 0.98,
      source_document_name: 'drivers-license.pdf',
    },
    'applicant_dob': {
      source: 'ai_extracted',
      confidence: 0.95,
      source_document_name: 'drivers-license.pdf',
    },
    'applicant_address_street': {
      source: 'ai_extracted',
      confidence: 0.92,
      source_document_name: 'drivers-license.pdf',
    },
    'applicant_address_city': {
      source: 'ai_extracted',
      confidence: 0.94,
      source_document_name: 'drivers-license.pdf',
    },
    'applicant_address_state': {
      source: 'ai_extracted',
      confidence: 0.99,
      source_document_name: 'drivers-license.pdf',
    },
    'applicant_address_zip': {
      source: 'ai_extracted',
      confidence: 0.96,
      source_document_name: 'drivers-license.pdf',
    },
    'entity_type': {
      source: 'proxy_entered',
    },
    'organization_legal_name': {
      source: 'ai_extracted',
      confidence: 0.85,
      source_document_name: 'IRS-Form-1040.pdf',
    },
    'organization_ein': {
      source: 'ai_extracted',
      confidence: 0.78,
      source_document_name: 'IRS-Form-1040.pdf',
    },
  };

  const handleChange = (data: Partial<M1FormData>) => {
    setFormData(data);
    setSubmitted(false);
  };

  const handleSubmit = (data: M1FormData) => {
    console.log('Form submitted:', data);
    setSubmitted(true);
    alert(`Form submitted! Applicant: ${data.applicant_first_name} ${data.applicant_last_name}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Module 1: Identity & Entity Form Test
          </h1>
          <p className="text-gray-600">
            Test applicant information, address fields, SSN masking, and business entity selection.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <M1IdentityForm
            initialData={formData}
            fieldMetadata={mockMetadata}
            onChange={handleChange}
            onSubmit={handleSubmit}
            showConfidence={true}
          />
        </div>

        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-green-800 font-semibold mb-2">Form Submitted Successfully!</h3>
            <pre className="text-xs bg-green-100 p-3 rounded overflow-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold mb-2">Current Form Data</h3>
          <pre className="text-xs bg-blue-100 p-3 rounded overflow-auto max-h-96">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
