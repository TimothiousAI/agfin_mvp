import { logger } from '../../core/logging';
import {
  DocumentTypeName,
  DocumentTypeSchema,
  validateDocumentData,
} from './types';

/**
 * Docling OCR Response Structure
 * Based on Docling's output format
 */
interface DoclingOCRResult {
  text?: string;
  tables?: DoclingTable[];
  images?: DoclingImage[];
  metadata?: {
    page_count?: number;
    confidence?: number;
    processing_time?: number;
  };
  structured_data?: Record<string, any>;
}

interface DoclingTable {
  table_index: number;
  headers?: string[];
  rows?: string[][];
  location?: {
    page: number;
    bbox?: [number, number, number, number];
  };
}

interface DoclingImage {
  image_index: number;
  location?: {
    page: number;
    bbox?: [number, number, number, number];
  };
  description?: string;
}

/**
 * Field Extraction Result
 */
export interface FieldExtractionResult {
  document_type: DocumentTypeName;
  fields: Record<string, any>;
  tables: ExtractedTable[];
  confidence_scores: Record<string, number>;
  overall_confidence: number;
  extraction_metadata: {
    extracted_at: string;
    page_count?: number;
    processing_time?: number;
    docling_version?: string;
  };
  validation_errors?: string[];
}

export interface ExtractedTable {
  table_index: number;
  headers: string[];
  rows: Record<string, any>[];
  location?: {
    page: number;
  };
}

/**
 * Extraction Failure Tracking
 */
export interface ExtractionFailure {
  document_id: string;
  attempt_count: number;
  last_attempt_at: string;
  error_messages: string[];
  can_bypass: boolean;
}

/**
 * ExtractionService
 *
 * Parses Docling OCR results and maps them to typed document field schemas.
 * Handles field extraction, table parsing, confidence scoring, and validation.
 */
export class ExtractionService {
  private failureTracking: Map<string, ExtractionFailure> = new Map();
  /**
   * Extract fields from Docling OCR result
   */
  async extractFields(
    documentType: DocumentTypeName,
    doclingResult: DoclingOCRResult
  ): Promise<FieldExtractionResult> {
    logger.info('Starting field extraction', {
      document_type: documentType,
      has_text: !!doclingResult.text,
      table_count: doclingResult.tables?.length || 0,
    });

    try {
      // Extract fields based on document type
      const fields = this.extractFieldsByType(documentType, doclingResult);

      // Extract and structure tables
      const tables = this.extractTables(doclingResult.tables || []);

      // Calculate confidence scores per field
      const confidence_scores = this.calculateFieldConfidences(
        fields,
        doclingResult
      );

      // Calculate overall confidence
      const overall_confidence = this.calculateOverallConfidence(
        confidence_scores,
        doclingResult.metadata?.confidence
      );

      // Prepare result
      const result: FieldExtractionResult = {
        document_type: documentType,
        fields,
        tables,
        confidence_scores,
        overall_confidence,
        extraction_metadata: {
          extracted_at: new Date().toISOString(),
          page_count: doclingResult.metadata?.page_count,
          processing_time: doclingResult.metadata?.processing_time,
        },
      };

      // Validate against schema
      const validation = validateDocumentData(documentType, {
        document_type: documentType,
        fields,
      });

      if (!validation.success) {
        result.validation_errors = validation.errors;
        logger.warn('Field extraction validation failed', {
          document_type: documentType,
          errors: validation.errors,
        });
      }

      logger.info('Field extraction completed', {
        document_type: documentType,
        field_count: Object.keys(fields).length,
        table_count: tables.length,
        overall_confidence,
        has_validation_errors: !!result.validation_errors,
      });

      return result;
    } catch (error) {
      logger.error('Field extraction failed', {
        document_type: documentType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Extract fields based on document type
   */
  private extractFieldsByType(
    documentType: DocumentTypeName,
    doclingResult: DoclingOCRResult
  ): Record<string, any> {
    // If Docling provides structured data, use it
    if (doclingResult.structured_data) {
      return this.normalizeStructuredData(
        documentType,
        doclingResult.structured_data
      );
    }

    // Otherwise, extract from text using pattern matching
    const text = doclingResult.text || '';

    switch (documentType) {
      case 'drivers_license':
        return this.extractDriversLicenseFields(text);
      case 'schedule_f':
        return this.extractScheduleFFields(text, doclingResult.tables);
      case 'balance_sheet':
        return this.extractBalanceSheetFields(text, doclingResult.tables);
      case 'fsa_578':
        return this.extractFSA578Fields(text);
      case 'crop_insurance_current':
      case 'crop_insurance_prior':
        return this.extractCropInsuranceFields(text);
      case 'lease_agreement':
        return this.extractLeaseAgreementFields(text);
      case 'equipment_list':
        return this.extractEquipmentListFields(text, doclingResult.tables);
      case 'organization_docs':
        return this.extractOrganizationDocsFields(text);
      default:
        logger.warn('Unknown document type for extraction', { documentType });
        return {};
    }
  }

  /**
   * Normalize structured data from Docling
   */
  private normalizeStructuredData(
    documentType: DocumentTypeName,
    structuredData: Record<string, any>
  ): Record<string, any> {
    // Docling may provide fields in different formats
    // Normalize keys and values to match our schema
    const normalized: Record<string, any> = {};

    for (const [key, value] of Object.entries(structuredData)) {
      // Convert keys to snake_case
      const normalizedKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();

      // Handle nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        normalized[normalizedKey] = this.normalizeStructuredData(
          documentType,
          value
        );
      } else {
        normalized[normalizedKey] = value;
      }
    }

    return normalized;
  }

  /**
   * Extract Drivers License fields from text
   */
  private extractDriversLicenseFields(text: string): Record<string, any> {
    const fields: Record<string, any> = {};

    // License number patterns
    const licenseMatch = text.match(/(?:DL|LIC(?:ENSE)?)\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    if (licenseMatch) fields.license_number = licenseMatch[1];

    // Name patterns
    const nameMatch = text.match(/(?:NAME|FN|LN)\s*:?\s*([A-Z\s]+)/i);
    if (nameMatch) fields.full_name = nameMatch[1].trim();

    // DOB patterns
    const dobMatch = text.match(/(?:DOB|DATE OF BIRTH)\s*:?\s*(\d{2}[-/]\d{2}[-/]\d{4})/i);
    if (dobMatch) {
      fields.date_of_birth = this.normalizeDate(dobMatch[1]);
    }

    // Address patterns
    const addressMatch = text.match(/(?:ADDRESS|ADDR)\s*:?\s*([^\n]+)/i);
    if (addressMatch) {
      fields.address = this.parseAddress(addressMatch[1]);
    }

    // Expiration date
    const expMatch = text.match(/(?:EXP|EXPIRES?)\s*:?\s*(\d{2}[-/]\d{2}[-/]\d{4})/i);
    if (expMatch) {
      fields.expiration_date = this.normalizeDate(expMatch[1]);
    }

    return fields;
  }

  /**
   * Extract Schedule F fields from text and tables
   */
  private extractScheduleFFields(
    text: string,
    tables?: DoclingTable[]
  ): Record<string, any> {
    const fields: Record<string, any> = {
      income: {},
      expenses: {},
    };

    // Tax year
    const yearMatch = text.match(/(?:TAX YEAR|YEAR)\s*:?\s*(\d{4})/i);
    if (yearMatch) fields.tax_year = parseInt(yearMatch[1], 10);

    // Extract income and expense values from tables if available
    if (tables && tables.length > 0) {
      for (const table of tables) {
        this.extractFinancialDataFromTable(table, fields);
      }
    }

    return fields;
  }

  /**
   * Extract Balance Sheet fields from text and tables
   */
  private extractBalanceSheetFields(
    text: string,
    tables?: DoclingTable[]
  ): Record<string, any> {
    const fields: Record<string, any> = {
      assets: { current: {}, fixed: {} },
      liabilities: { current: {}, long_term: {} },
    };

    // Extract statement date
    const dateMatch = text.match(/(?:AS OF|DATE)\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i);
    if (dateMatch) {
      fields.statement_date = this.normalizeDate(dateMatch[1]);
    }

    // Extract financial data from tables
    if (tables && tables.length > 0) {
      for (const table of tables) {
        this.extractFinancialDataFromTable(table, fields);
      }
    }

    return fields;
  }

  /**
   * Extract FSA-578 fields
   */
  private extractFSA578Fields(text: string): Record<string, any> {
    const fields: Record<string, any> = {};

    // Farm number
    const farmMatch = text.match(/(?:FARM|FSA)\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    if (farmMatch) fields.farm_number = farmMatch[1];

    // Producer name
    const producerMatch = text.match(/(?:PRODUCER|NAME)\s*:?\s*([A-Z\s]+)/i);
    if (producerMatch) fields.producer_name = producerMatch[1].trim();

    return fields;
  }

  /**
   * Extract Crop Insurance fields
   */
  private extractCropInsuranceFields(text: string): Record<string, any> {
    const fields: Record<string, any> = {};

    // Policy number
    const policyMatch = text.match(/(?:POLICY|POL)\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    if (policyMatch) fields.policy_number = policyMatch[1];

    // Insured name
    const insuredMatch = text.match(/(?:INSURED|NAME)\s*:?\s*([A-Z\s]+)/i);
    if (insuredMatch) fields.insured_name = insuredMatch[1].trim();

    // Crop year
    const yearMatch = text.match(/(?:CROP YEAR|YEAR)\s*:?\s*(\d{4})/i);
    if (yearMatch) fields.crop_year = parseInt(yearMatch[1], 10);

    return fields;
  }

  /**
   * Extract Lease Agreement fields
   */
  private extractLeaseAgreementFields(text: string): Record<string, any> {
    const fields: Record<string, any> = {};

    // Lessor/Lessee
    const lessorMatch = text.match(/(?:LESSOR|LANDLORD)\s*:?\s*([A-Z\s]+)/i);
    if (lessorMatch) fields.lessor_name = lessorMatch[1].trim();

    const lesseeMatch = text.match(/(?:LESSEE|TENANT)\s*:?\s*([A-Z\s]+)/i);
    if (lesseeMatch) fields.lessee_name = lesseeMatch[1].trim();

    // Dates
    const startMatch = text.match(/(?:START|BEGIN|EFFECTIVE)\s*DATE\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i);
    if (startMatch) fields.start_date = this.normalizeDate(startMatch[1]);

    const endMatch = text.match(/(?:END|EXPIRATION|TERMINATION)\s*DATE\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i);
    if (endMatch) fields.end_date = this.normalizeDate(endMatch[1]);

    return fields;
  }

  /**
   * Extract Equipment List fields from text and tables
   */
  private extractEquipmentListFields(
    text: string,
    tables?: DoclingTable[]
  ): Record<string, any> {
    const fields: Record<string, any> = {
      equipment: [],
    };

    // Extract equipment from tables if available
    if (tables && tables.length > 0) {
      for (const table of tables) {
        const equipment = this.extractEquipmentFromTable(table);
        if (equipment.length > 0) {
          fields.equipment.push(...equipment);
        }
      }
    }

    return fields;
  }

  /**
   * Extract Organization Documents fields
   */
  private extractOrganizationDocsFields(text: string): Record<string, any> {
    const fields: Record<string, any> = {};

    // Organization name
    const orgMatch = text.match(/(?:ORGANIZATION|COMPANY|CORPORATION)\s*NAME\s*:?\s*([A-Z\s]+)/i);
    if (orgMatch) fields.organization_name = orgMatch[1].trim();

    // EIN
    const einMatch = text.match(/(?:EIN|TAX ID)\s*#?\s*:?\s*(\d{2}-\d{7})/i);
    if (einMatch) fields.ein = einMatch[1];

    // Formation date
    const formationMatch = text.match(/(?:FORMED|INCORPORATED|DATE OF FORMATION)\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i);
    if (formationMatch) fields.formation_date = this.normalizeDate(formationMatch[1]);

    return fields;
  }

  /**
   * Extract structured tables
   */
  private extractTables(tables: DoclingTable[]): ExtractedTable[] {
    return tables.map((table, index) => {
      const headers = table.headers || [];
      const rows = (table.rows || []).map((row) => {
        const rowObj: Record<string, any> = {};
        headers.forEach((header, i) => {
          rowObj[header] = row[i] || null;
        });
        return rowObj;
      });

      return {
        table_index: table.table_index || index,
        headers,
        rows,
        location: table.location
          ? { page: table.location.page }
          : undefined,
      };
    });
  }

  /**
   * Extract financial data from a table
   */
  private extractFinancialDataFromTable(
    table: DoclingTable,
    fields: Record<string, any>
  ): void {
    if (!table.rows) return;

    for (const row of table.rows) {
      if (row.length < 2) continue;

      const label = row[0]?.toLowerCase() || '';
      const value = this.parseCurrency(row[1]);

      // Map common financial terms
      if (label.includes('sales') || label.includes('revenue')) {
        if (!fields.income) fields.income = {};
        fields.income.sales = value;
      } else if (label.includes('expense') || label.includes('cost')) {
        if (!fields.expenses) fields.expenses = {};
        fields.expenses.total = value;
      } else if (label.includes('asset')) {
        if (!fields.assets) fields.assets = {};
        fields.assets.total = value;
      } else if (label.includes('liabilit')) {
        if (!fields.liabilities) fields.liabilities = {};
        fields.liabilities.total = value;
      }
    }
  }

  /**
   * Extract equipment from a table
   */
  private extractEquipmentFromTable(table: DoclingTable): any[] {
    if (!table.rows || !table.headers) return [];

    const equipment: any[] = [];
    for (const row of table.rows) {
      const item: Record<string, any> = {};
      table.headers.forEach((header, i) => {
        const key = header.toLowerCase().replace(/\s+/g, '_');
        item[key] = row[i] || null;
      });
      equipment.push(item);
    }

    return equipment;
  }

  /**
   * Calculate confidence scores for each extracted field
   */
  private calculateFieldConfidences(
    fields: Record<string, any>,
    doclingResult: DoclingOCRResult
  ): Record<string, number> {
    const scores: Record<string, number> = {};
    const baseConfidence = doclingResult.metadata?.confidence || 0.7;

    for (const [key, value] of Object.entries(fields)) {
      if (value === null || value === undefined || value === '') {
        scores[key] = 0;
      } else if (typeof value === 'object') {
        // For nested objects, calculate average confidence
        const nestedScores = this.calculateFieldConfidences(value, doclingResult);
        const values = Object.values(nestedScores);
        scores[key] = values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : baseConfidence;
      } else {
        // For primitive values, use base confidence
        scores[key] = baseConfidence;
      }
    }

    return scores;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    fieldScores: Record<string, number>,
    doclingConfidence?: number
  ): number {
    const scores = Object.values(fieldScores);

    if (scores.length === 0) {
      return doclingConfidence || 0;
    }

    const avgFieldConfidence = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Weight: 60% field confidence, 40% Docling confidence
    return doclingConfidence
      ? avgFieldConfidence * 0.6 + doclingConfidence * 0.4
      : avgFieldConfidence;
  }

  /**
   * Utility: Parse address string
   */
  private parseAddress(addressStr: string): Record<string, string> {
    const parts = addressStr.split(',').map(s => s.trim());
    return {
      street: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
      zip_code: parts[3] || '',
    };
  }

  /**
   * Utility: Normalize date format to YYYY-MM-DD
   */
  private normalizeDate(dateStr: string): string {
    const match = dateStr.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (!match) return dateStr;

    const [, month, day, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  /**
   * Utility: Parse currency string to number
   */
  private parseCurrency(value: string): number | undefined {
    if (!value) return undefined;

    const cleaned = value.replace(/[$,\s]/g, '');
    const num = parseFloat(cleaned);

    return isNaN(num) ? undefined : num;
  }

  // ============================================================================
  // Failure Tracking & Recovery
  // ============================================================================

  /**
   * Record an extraction failure
   */
  recordFailure(documentId: string, errorMessage: string): ExtractionFailure {
    const existing = this.failureTracking.get(documentId);

    const failure: ExtractionFailure = {
      document_id: documentId,
      attempt_count: (existing?.attempt_count || 0) + 1,
      last_attempt_at: new Date().toISOString(),
      error_messages: [
        ...(existing?.error_messages || []),
        errorMessage
      ],
      can_bypass: false,
    };

    // Allow bypass after 3 failed attempts
    if (failure.attempt_count >= 3) {
      failure.can_bypass = true;
    }

    this.failureTracking.set(documentId, failure);

    logger.warn('Extraction failure recorded', {
      document_id: documentId,
      attempt_count: failure.attempt_count,
      can_bypass: failure.can_bypass,
      error: errorMessage,
    });

    return failure;
  }

  /**
   * Get failure information for a document
   */
  getFailureInfo(documentId: string): ExtractionFailure | null {
    return this.failureTracking.get(documentId) || null;
  }

  /**
   * Check if document can bypass extraction
   */
  canBypass(documentId: string): boolean {
    const failure = this.failureTracking.get(documentId);
    return failure?.can_bypass || false;
  }

  /**
   * Reset failure tracking for a document
   */
  resetFailureTracking(documentId: string): void {
    this.failureTracking.delete(documentId);
    logger.info('Failure tracking reset', { document_id: documentId });
  }

  /**
   * Get all documents with failures
   */
  getAllFailures(): ExtractionFailure[] {
    return Array.from(this.failureTracking.values());
  }

  /**
   * Extract fields with retry logic
   */
  async extractFieldsWithRetry(
    documentId: string,
    documentType: DocumentTypeName,
    doclingResult: DoclingOCRResult,
    maxRetries: number = 3
  ): Promise<FieldExtractionResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info('Attempting field extraction', {
          document_id: documentId,
          attempt,
          max_retries: maxRetries,
        });

        const result = await this.extractFields(documentType, doclingResult);

        // Success - reset failure tracking
        this.resetFailureTracking(documentId);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        logger.warn('Extraction attempt failed', {
          document_id: documentId,
          attempt,
          error: lastError.message,
        });

        // Record failure
        this.recordFailure(documentId, lastError.message);

        // If this was the last attempt, throw
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retry with exponential backoff
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError || new Error('Extraction failed after all retries');
  }
}

// Singleton instance
let extractionServiceInstance: ExtractionService | null = null;

export function getExtractionService(): ExtractionService {
  if (!extractionServiceInstance) {
    extractionServiceInstance = new ExtractionService();
  }
  return extractionServiceInstance;
}
