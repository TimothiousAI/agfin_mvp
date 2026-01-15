import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

/**
 * InlineUploadZone Component
 *
 * Drag-and-drop file upload zone that appears inline in the chat:
 * - Triggered by AI agent request
 * - Drag-and-drop area with visual feedback
 * - File type restrictions (PDF, images, Office docs)
 * - Upload progress indicator
 * - Cancel upload button
 * - Integrates seamlessly with chat flow
 */

export interface InlineUploadZoneProps {
  /** Whether the upload zone is visible */
  isVisible?: boolean;
  /** Callback when files are dropped/selected */
  onUpload?: (files: File[]) => void;
  /** Callback to cancel upload */
  onCancel?: () => void;
  /** Upload progress (0-100) */
  uploadProgress?: number;
  /** Whether upload is in progress */
  isUploading?: boolean;
  /** Optional className for additional styling */
  className?: string;
}

// Accepted file types
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function InlineUploadZone({
  isVisible = true,
  onUpload,
  onCancel,
  uploadProgress = 0,
  isUploading = false,
  className = '',
}: InlineUploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setUploadedFiles(acceptedFiles);
      onUpload?.(acceptedFiles);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    disabled: isUploading,
  });

  const handleCancel = () => {
    setUploadedFiles([]);
    onCancel?.();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        my-4 p-6 rounded-lg border-2 border-dashed
        transition-all duration-200
        ${isDragActive && !isDragReject ? 'border-[#30714C] bg-[#30714C]/10' : ''}
        ${isDragReject ? 'border-red-500 bg-red-500/10' : ''}
        ${!isDragActive && !isDragReject ? 'border-gray-600 bg-[#0D2233]' : ''}
        ${isUploading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {isUploading ? (
        // Upload Progress View
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-[#30714C]" />
          </div>
          <div className="text-white font-medium mb-2">Uploading files...</div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <div
              className="bg-[#30714C] h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>

          <div className="text-sm text-gray-400 mb-4">{uploadProgress}% complete</div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="text-left mb-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="text-sm text-gray-300 flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-[#30714C]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{file.name}</span>
                  <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ))}
            </div>
          )}

          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            className="
              px-4 py-2 rounded-md
              bg-gray-700 hover:bg-gray-600
              text-white text-sm font-medium
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-[#30714C] focus:ring-offset-2 focus:ring-offset-[#0D2233]
            "
          >
            Cancel Upload
          </button>
        </div>
      ) : (
        // Drop Zone View
        <div {...getRootProps()}>
          <input {...getInputProps()} />

          <div className="text-center">
            {/* Upload Icon */}
            <div className="mb-4 flex justify-center">
              <svg
                className={`
                  w-16 h-16 transition-colors
                  ${isDragActive && !isDragReject ? 'text-[#30714C]' : ''}
                  ${isDragReject ? 'text-red-500' : ''}
                  ${!isDragActive && !isDragReject ? 'text-gray-500' : ''}
                `}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            {/* Text */}
            {isDragActive && !isDragReject ? (
              <p className="text-lg text-[#30714C] font-medium">Drop files here...</p>
            ) : isDragReject ? (
              <div>
                <p className="text-lg text-red-500 font-medium mb-2">Invalid file type or size</p>
                <p className="text-sm text-gray-400">Please upload PDF, images, or Office documents under 10MB</p>
              </div>
            ) : (
              <div>
                <p className="text-lg text-white font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-400 mb-2">
                  Supported formats: PDF, JPG, PNG, GIF, DOC, DOCX, XLS, XLSX
                </p>
                <p className="text-xs text-gray-500">Maximum file size: 10MB per file</p>
              </div>
            )}

            {/* Browse Button */}
            {!isDragActive && (
              <button
                type="button"
                className="
                  mt-4 px-6 py-2 rounded-md
                  bg-[#30714C] hover:bg-[#265A3D]
                  text-white font-medium
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-[#30714C] focus:ring-offset-2 focus:ring-offset-[#0D2233]
                "
              >
                Browse Files
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InlineUploadZone;
