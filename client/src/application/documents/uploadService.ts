/**
 * Document upload service for Supabase Storage
 * Handles presigned URL fetching, direct upload with progress tracking, and error handling
 */

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  documentType: string;
  applicationId: string;
  file: File;
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

export interface UploadResult {
  documentId: string;
  uploadUrl: string;
}

export interface PresignedUrlResponse {
  upload_url: string;
  document_id: string;
  token?: string;
}

/**
 * Fetch presigned upload URL from backend API
 */
async function getPresignedUrl(
  documentType: string,
  applicationId: string,
  filename: string,
  contentType: string
): Promise<PresignedUrlResponse> {
  const response = await fetch('/api/documents/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      document_type: documentType,
      application_id: applicationId,
      filename,
      content_type: contentType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to get upload URL: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Upload file directly to Supabase Storage using XMLHttpRequest
 * with progress tracking support
 */
function uploadFileWithProgress(
  file: File,
  uploadUrl: string,
  token: string | undefined,
  onProgress?: (progress: UploadProgress) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentage = Math.round((e.loaded / e.total) * 100);
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percentage,
        });
      }
    });

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }

    // Start upload
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(file);
  });
}

/**
 * Confirm upload completion to backend API
 * (Optional - can be used for additional processing like OCR triggers)
 */
async function confirmUploadCompletion(documentId: string): Promise<void> {
  const response = await fetch(`/api/documents/${documentId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    // Non-critical error - log but don't throw
    console.warn(`Failed to confirm upload for document ${documentId}`);
  }
}

/**
 * Main upload function - orchestrates the complete upload flow
 *
 * Flow:
 * 1. Request presigned URL from backend
 * 2. Upload file directly to Supabase Storage with progress tracking
 * 3. Confirm completion to backend (optional)
 * 4. Return document ID
 */
export async function uploadDocument(options: UploadOptions): Promise<UploadResult> {
  const { documentType, applicationId, file, onProgress, onError, signal } = options;

  try {
    // Step 1: Get presigned upload URL
    const { upload_url, document_id, token } = await getPresignedUrl(
      documentType,
      applicationId,
      file.name,
      file.type
    );

    // Step 2: Upload file with progress tracking
    await uploadFileWithProgress(file, upload_url, token, onProgress, signal);

    // Step 3: Confirm upload completion (fire and forget)
    confirmUploadCompletion(document_id).catch((err) => {
      console.warn('Upload confirmation failed:', err);
    });

    // Step 4: Return result
    return {
      documentId: document_id,
      uploadUrl: upload_url,
    };

  } catch (error) {
    const uploadError = error instanceof Error ? error : new Error('Upload failed');

    if (onError) {
      onError(uploadError);
    }

    throw uploadError;
  }
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  maxSizeBytes: number = 50 * 1024 * 1024, // 50MB default
  allowedTypes: string[] = ['application/pdf', 'image/png', 'image/jpeg']
): string | null {
  // Check file size
  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / 1024 / 1024).toFixed(0);
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    return `File size exceeds ${maxSizeMB}MB limit (${fileSizeMB}MB)`;
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = allowedTypes
      .map(type => {
        if (type === 'application/pdf') return 'PDF';
        if (type === 'image/png') return 'PNG';
        if (type === 'image/jpeg') return 'JPEG';
        return type;
      })
      .join(', ');
    return `Invalid file type. Allowed types: ${allowedExtensions}`;
  }

  return null;
}

/**
 * Create an AbortController for cancellable uploads
 */
export function createUploadCanceller(): {
  signal: AbortSignal;
  cancel: () => void;
} {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  };
}
