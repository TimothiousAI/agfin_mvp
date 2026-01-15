import React, { useState } from 'react';
import M2LandsForm from '../application/modules/M2LandsForm';

interface FieldMetadata {
  source: 'ai_extracted' | 'proxy_entered' | 'proxy_edited' | 'auditor_verified';
  confidence?: number;
  source_document_id?: string;
  source_document_name?: string;
}

interface Tract {
  tract_number: string;
  county: string;
  acres_dry: number;
  acres_irrigated: number;
  farm_number?: string;
  field_number?: string;
}

interface M2FormData {
  tracts: Tract[];
  total_acres_dry: number;
  total_acres_irrigated: number;
  total_acres: number;
}

/**
 * Test page for M2 Lands Farmed Form
 */
export function M2FormTest() {
  const [formData, setFormData] = useState<Partial<M2FormData>>({});
  const [submitted, setSubmitted] = useState(false);

  // Mock field metadata (as if extracted from FSA-578)
  const mockMetadata: Record<string, FieldMetadata> = {
    'tracts': {
      source: 'ai_extracted',
      confidence: 0.95,
      source_document_name: 'FSA-578.pdf',
    },
  };

  const handleChange = (data: Partial<M2FormData>) => {
    setFormData(data);
    setSubmitted(false);
  };

  const handleSubmit = (data: M2FormData) => {
    console.log('Form submitted:', data);
    setSubmitted(true);
    alert(`Form submitted! Total Acres: ${data.total_acres}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Module 2: Lands Farmed Form Test
          </h1>
          <p className="text-gray-600">
            Test the repeating tract functionality, add/remove, and automatic totals calculation.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <M2LandsForm
            initialData={formData}
            fieldMetadata={mockMetadata}
            onChange={handleChange}
            onSubmit={handleSubmit}
            showConfidence={true}
          />
        </div>

        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-800 font-semibold mb-2">✅ Form Submitted Successfully!</h3>
            <pre className="text-xs bg-green-100 p-3 rounded overflow-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold mb-2">📊 Current Form Data</h3>
          <pre className="text-xs bg-blue-100 p-3 rounded overflow-auto max-h-96">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
