---
name: docling-extraction
description: Document extraction workflow using Docling OCR service. Use when implementing document processing, field extraction, or confidence scoring features.
---

# Docling Extraction Skill

Comprehensive guide for working with the Docling OCR service in AgFin.

## Overview

Docling provides OCR and document extraction capabilities for the 9 document types used in AgFin loan applications. This skill covers the full extraction pipeline from upload to module mapping.

## Instructions

### Prerequisites

- Docling service running on port 5001
- Document uploaded to Supabase Storage
- Document record created in `documents` table

### Workflow

1. **Prepare Document for Extraction**
   ```typescript
   // Fetch document from storage
   const { data, error } = await supabase.storage
     .from('documents')
     .download(storagePath);
   ```

2. **Send to Docling Service**
   ```typescript
   const formData = new FormData();
   formData.append('file', documentBlob);
   formData.append('options', JSON.stringify({
     extract_tables: true,
     ocr_enabled: true
   }));

   const response = await fetch(`${DOCLING_URL}/convert`, {
     method: 'POST',
     body: formData,
     signal: AbortSignal.timeout(120000)
   });
   ```

3. **Parse Extraction Results**
   ```typescript
   interface ExtractionResult {
     fields: Array<{
       field_id: string;
       value: string | number;
       confidence: number;
       bounding_box?: BoundingBox;
     }>;
     tables: ExtractedTable[];
     raw_text: string;
   }
   ```

4. **Apply Confidence Thresholds**
   ```typescript
   const AUTO_ACCEPT = 0.90;
   const NEEDS_REVIEW = 0.70;

   fields.forEach(field => {
     if (field.confidence >= AUTO_ACCEPT) {
       // Auto-apply to module
     } else if (field.confidence >= NEEDS_REVIEW) {
       // Flag for review (yellow badge)
     } else {
       // Low confidence (red badge)
     }
   });
   ```

5. **Map to Modules**
   ```typescript
   const MAPPINGS = {
     'dl_full_name': { module: 1, field: 'applicant_name' },
     'sf_gross_income': { module: 3, field: 'farm_income' },
     'fsa_tract_number': { module: 2, field: 'tract_id' },
   };
   ```

6. **Store with Provenance**
   ```typescript
   await supabase.from('module_data').upsert({
     application_id,
     module_number: mapping.module,
     field_id: mapping.field,
     value: field.value,
     source: 'ai_extracted',
     source_document_id: documentId,
     confidence_score: field.confidence
   });
   ```

### Document Type Mappings

| Document | Target Module | Key Fields |
|----------|---------------|------------|
| Driver's License | M1 | name, DOB, address |
| Schedule F | M3 | income, expenses, net profit |
| Organization Docs | M1 | entity name, EIN, partners |
| Balance Sheet | M3 | assets, liabilities, net worth |
| FSA-578 | M2 | tracts, acres, counties |
| Crop Insurance | M4 | coverage, premiums, yields |
| Lease Agreement | M2 | landlord, terms, rent |
| Equipment List | M3 | equipment, values, liens |

### Error Handling

```typescript
async function extractWithRetry(documentId: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await processDocument(documentId);
      await updateStatus(documentId, 'processed');
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        await updateStatus(documentId, 'error', {
          error_message: error.message,
          retry_count: attempt
        });
        throw error;
      }
      await sleep(1000 * attempt); // Exponential backoff
    }
  }
}
```

## Tips

- Always set appropriate timeout (120s for complex documents)
- Store raw extraction results for audit purposes
- Use confidence badges consistently: green (≥90%), yellow (70-89%), red (<70%)
- Log extraction metrics for monitoring
- Handle table extraction separately from field extraction
