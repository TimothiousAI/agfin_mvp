import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../../core/logging';

interface DoclingConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
}

interface DoclingProcessRequest {
  document_url: string;
  document_type?: string;
  options?: {
    extract_text?: boolean;
    extract_tables?: boolean;
    extract_images?: boolean;
  };
}

interface DoclingProcessResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    text?: string;
    tables?: any[];
    images?: any[];
    metadata?: Record<string, any>;
  };
  error?: string;
}

export class DoclingServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'DoclingServiceError';
  }
}

export class DoclingService {
  private client: AxiosInstance;
  private config: DoclingConfig;

  constructor(config?: Partial<DoclingConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || process.env.DOCLING_URL || 'http://localhost:5001',
      timeout: config?.timeout || 120000, // 120 seconds
      maxRetries: config?.maxRetries || 3,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logger.info('Docling service initialized', {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  /**
   * Submit a document for processing
   */
  async submitDocument(request: DoclingProcessRequest): Promise<string> {
    logger.info('Submitting document to Docling', {
      document_url: request.document_url,
      document_type: request.document_type,
    });

    try {
      const response = await this.client.post<{ job_id: string }>('/process', {
        url: request.document_url,
        type: request.document_type,
        ...request.options,
      });

      const jobId = response.data.job_id;
      logger.info('Document submitted successfully', { job_id: jobId });

      return jobId;
    } catch (error) {
      throw this.handleError(error, 'Failed to submit document');
    }
  }

  /**
   * Poll for job completion with retry logic
   */
  async pollJobStatus(
    jobId: string,
    pollInterval: number = 2000,
    maxWaitTime: number = 120000
  ): Promise<DoclingProcessResponse> {
    const startTime = Date.now();
    let attempts = 0;

    logger.info('Starting to poll job status', {
      job_id: jobId,
      poll_interval: pollInterval,
      max_wait_time: maxWaitTime,
    });

    while (Date.now() - startTime < maxWaitTime) {
      attempts++;

      try {
        const response = await this.client.get<DoclingProcessResponse>(
          `/status/${jobId}`
        );

        const status = response.data.status;
        logger.debug('Job status check', {
          job_id: jobId,
          status,
          attempt: attempts,
          elapsed: Date.now() - startTime,
        });

        if (status === 'completed') {
          logger.info('Job completed successfully', { job_id: jobId });
          return response.data;
        }

        if (status === 'failed') {
          const error = response.data.error || 'Processing failed';
          logger.error('Job failed', { job_id: jobId, error });
          throw new DoclingServiceError(
            `Job failed: ${error}`,
            'JOB_FAILED',
            undefined,
            false
          );
        }

        // Job still processing, wait before next poll
        await this.sleep(pollInterval);
      } catch (error) {
        if (error instanceof DoclingServiceError) {
          throw error;
        }

        // Handle network errors with retry
        if (this.isRetryableError(error)) {
          logger.warn('Retryable error while polling, will retry', {
            job_id: jobId,
            attempt: attempts,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          await this.sleep(pollInterval);
          continue;
        }

        throw this.handleError(error, 'Failed to poll job status');
      }
    }

    // Timeout reached
    logger.error('Job polling timeout', {
      job_id: jobId,
      max_wait_time: maxWaitTime,
      elapsed: Date.now() - startTime,
    });

    throw new DoclingServiceError(
      `Job polling timeout after ${maxWaitTime}ms`,
      'POLLING_TIMEOUT',
      undefined,
      true
    );
  }

  /**
   * Process document with automatic retry logic
   */
  async processDocument(
    request: DoclingProcessRequest
  ): Promise<DoclingProcessResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        logger.info('Processing document attempt', {
          attempt,
          max_retries: this.config.maxRetries,
          document_url: request.document_url,
        });

        // Submit document
        const jobId = await this.submitDocument(request);

        // Poll for completion
        const result = await this.pollJobStatus(jobId);

        logger.info('Document processed successfully', {
          job_id: jobId,
          attempt,
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error is retryable
        if (error instanceof DoclingServiceError && !error.retryable) {
          logger.error('Non-retryable error, aborting', {
            attempt,
            error: error.message,
            code: error.code,
          });
          throw error;
        }

        // Log retry attempt
        if (attempt < this.config.maxRetries) {
          const backoffDelay = this.calculateBackoff(attempt);
          logger.warn('Retrying after error', {
            attempt,
            max_retries: this.config.maxRetries,
            backoff_ms: backoffDelay,
            error: lastError.message,
          });
          await this.sleep(backoffDelay);
        }
      }
    }

    // All retries exhausted
    logger.error('All retry attempts exhausted', {
      max_retries: this.config.maxRetries,
      last_error: lastError?.message,
    });

    throw new DoclingServiceError(
      `Failed after ${this.config.maxRetries} attempts: ${lastError?.message}`,
      'MAX_RETRIES_EXCEEDED',
      undefined,
      false
    );
  }

  /**
   * Check service health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      logger.warn('Docling health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Handle errors and convert to DoclingServiceError
   */
  private handleError(error: unknown, context: string): DoclingServiceError {
    if (error instanceof DoclingServiceError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNABORTED') {
        return new DoclingServiceError(
          `${context}: Request timeout`,
          'TIMEOUT',
          undefined,
          true
        );
      }

      if (axiosError.code === 'ECONNREFUSED') {
        return new DoclingServiceError(
          `${context}: Connection refused`,
          'CONNECTION_REFUSED',
          undefined,
          true
        );
      }

      const statusCode = axiosError.response?.status;
      const retryable = statusCode ? statusCode >= 500 || statusCode === 429 : true;

      return new DoclingServiceError(
        `${context}: ${axiosError.message}`,
        'HTTP_ERROR',
        statusCode,
        retryable
      );
    }

    if (error instanceof Error) {
      return new DoclingServiceError(
        `${context}: ${error.message}`,
        'UNKNOWN_ERROR',
        undefined,
        true
      );
    }

    return new DoclingServiceError(
      `${context}: Unknown error`,
      'UNKNOWN_ERROR',
      undefined,
      true
    );
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof DoclingServiceError) {
      return error.retryable;
    }

    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      return (
        !statusCode ||
        statusCode >= 500 ||
        statusCode === 429 ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ECONNREFUSED'
      );
    }

    return true;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    // Add jitter (±25%)
    const jitter = delay * (0.75 + Math.random() * 0.5);
    return Math.floor(jitter);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let doclingServiceInstance: DoclingService | null = null;

export function getDoclingService(): DoclingService {
  if (!doclingServiceInstance) {
    doclingServiceInstance = new DoclingService();
  }
  return doclingServiceInstance;
}
