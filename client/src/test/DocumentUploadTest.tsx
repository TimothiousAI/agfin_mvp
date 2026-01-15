import { useState } from 'react';
import DocumentUpload from '../application/documents/DocumentUpload';

export function DocumentUploadTest() {
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Mock application ID for testing
  const TEST_APPLICATION_ID = '550e8400-e29b-41d4-a716-446655440000';

  const documentTypes = [
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'schedule_f', label: 'Schedule F (Tax)' },
    { value: 'organization_docs', label: 'Organization Documents' },
    { value: 'balance_sheet', label: 'Balance Sheet' },
    { value: 'fsa_578', label: 'FSA-578 Form' },
    { value: 'crop_insurance_current', label: 'Current Crop Insurance' },
    { value: 'crop_insurance_prior', label: 'Prior Year Crop Insurance' },
    { value: 'lease_agreement', label: 'Lease Agreement' },
    { value: 'equipment_list', label: 'Equipment List' },
  ];

  const [selectedType, setSelectedType] = useState(documentTypes[0].value);

  const handleUploadComplete = (documentId: string) => {
    setUploadedDocumentId(documentId);
    setUploadError(null);
    console.log('Upload complete:', documentId);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadedDocumentId(null);
    console.error('Upload error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Upload Test</h1>
            <p className="mt-2 text-sm text-gray-600">
              Test the DocumentUpload component with react-dropzone
            </p>
          </div>

          {/* Document type selector */}
          <div>
            <label htmlFor="doc-type" className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              id="doc-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Upload component */}
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-2">Upload Document</h2>
            <DocumentUpload
              documentType={selectedType}
              applicationId={TEST_APPLICATION_ID}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
          </div>

          {/* Status messages */}
          {uploadedDocumentId && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">Upload Successful!</h3>
              <p className="mt-1 text-sm text-green-700">
                Document ID: <code className="font-mono">{uploadedDocumentId}</code>
              </p>
            </div>
          )}

          {uploadError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
              <p className="mt-1 text-sm text-red-700">{uploadError}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Test Instructions</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="mr-2">1.</span>
                <span>Select a document type from the dropdown</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">2.</span>
                <span>Drag and drop a file or click to select (PDF, PNG, JPEG only)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">3.</span>
                <span>Watch the upload progress bar</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">4.</span>
                <span>You can cancel the upload while in progress</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">5.</span>
                <span>Try uploading an invalid file type (e.g., .txt) to test validation</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">6.</span>
                <span>Try a file larger than 50MB to test size validation</span>
              </li>
            </ul>
          </div>

          {/* Feature checklist */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Feature Checklist</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Drag-and-drop interface with react-dropzone</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Visual feedback on drag over</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">File type validation (PDF, PNG, JPEG)</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Size validation (max 50MB)</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Preview thumbnail (images and PDF icon)</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Upload progress bar with percentage</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Cancel upload button</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
