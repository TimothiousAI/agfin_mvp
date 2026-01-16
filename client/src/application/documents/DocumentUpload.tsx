import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface DocumentUploadProps {
  documentType: string;
  applicationId: string;
  onUploadComplete?: (documentId: string) => void;
  onUploadError?: (error: string) => void;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

export default function DocumentUpload({
  documentType,
  applicationId,
  onUploadComplete,
  onUploadError,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    }

    // Check file type
    const acceptedTypes = Object.keys(ACCEPTED_FILE_TYPES);
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Please upload PDF, PNG, or JPEG files only.`;
    }

    return null;
  };

  const generatePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // PDF icon/placeholder
      setPreview('pdf');
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      setProgress({ loaded: 0, total: file.size, percentage: 0 });

      // Step 1: Get presigned upload URL from backend
      const urlResponse = await fetch('/api/documents/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_type: documentType,
          application_id: applicationId,
          filename: file.name,
          content_type: file.type,
        }),
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { upload_url, document_id, token } = await urlResponse.json();

      // Step 2: Upload file directly to Supabase Storage with progress tracking
      const controller = new AbortController();
      setAbortController(controller);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          setProgress({
            loaded: e.loaded,
            total: e.total,
            percentage,
          });
        }
      });

      // Handle completion
      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        // Handle abort controller
        controller.signal.addEventListener('abort', () => {
          xhr.abort();
        });

        xhr.open('PUT', upload_url);
        xhr.setRequestHeader('Content-Type', file.type);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(file);
      });

      // Step 3: Upload complete
      setProgress({ loaded: file.size, total: file.size, percentage: 100 });

      if (onUploadComplete) {
        onUploadComplete(document_id);
      }

      // Reset after success
      setTimeout(() => {
        setUploading(false);
        setProgress(null);
        setPreview(null);
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setUploading(false);
      setProgress(null);

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setAbortController(null);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors?.[0]?.code === 'file-too-large') {
          setError(`File is too large. Maximum size is 50MB.`);
        } else if (rejection.errors?.[0]?.code === 'file-invalid-type') {
          setError('Invalid file type. Only PDF, PNG, and JPEG files are allowed.');
        } else {
          setError('File rejected. Please try again.');
        }
        return;
      }

      // Handle accepted files
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        // Additional validation
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }

        // Generate preview
        generatePreview(file);

        // Start upload
        uploadFile(file);
      }
    },
    [documentType, applicationId, onUploadComplete, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    disabled: uploading,
  });

  const cancelUpload = () => {
    if (abortController) {
      abortController.abort();
      setUploading(false);
      setProgress(null);
      setError('Upload cancelled');
    }
  };

  return (
    <div className="document-upload" data-tour="document-upload">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-red-500 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />

        {!uploading && !preview && (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop file here...</p>
            ) : (
              <>
                <p className="text-gray-600">
                  <span className="font-medium text-blue-600 hover:text-blue-500">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, PNG, or JPEG (max 50MB)
                </p>
              </>
            )}
          </div>
        )}

        {/* Preview */}
        {preview && !uploading && (
          <div className="space-y-2">
            {preview === 'pdf' ? (
              <div className="mx-auto w-16 h-16 flex items-center justify-center bg-red-100 rounded-lg">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
            ) : (
              <img
                src={preview}
                alt="Preview"
                className="mx-auto max-h-32 rounded-lg"
              />
            )}
            <p className="text-sm text-gray-600">Ready to upload</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {uploading && progress && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Uploading...</span>
            <span className="font-medium text-gray-900">{progress.percentage}%</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {(progress.loaded / 1024 / 1024).toFixed(2)} MB / {(progress.total / 1024 / 1024).toFixed(2)} MB
            </span>
            <button
              onClick={cancelUpload}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success message */}
      {!uploading && progress?.percentage === 100 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">✓ Upload complete!</p>
        </div>
      )}
    </div>
  );
}
