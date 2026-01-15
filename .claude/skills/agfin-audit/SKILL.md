---
name: agfin-audit
description: Audit workflow skill for AgFin compliance features. Use when implementing audit trail, field overrides, justification capture, or certification gates.
---

# AgFin Audit Skill

Comprehensive guide for implementing audit and compliance features in AgFin.

## Overview

AgFin requires immutable audit trails, mandatory justifications for field overrides, and certification gates before loan applications can be finalized. This skill covers the complete audit workflow.

## Instructions

### Audit Trail Structure

```sql
-- Immutable audit log
audit_trail (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES applications(id),
  user_id UUID REFERENCES auth.users(id),
  field_id TEXT,
  old_value TEXT,
  new_value TEXT,
  justification TEXT,  -- REQUIRED for overrides
  action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Justification Options

When an analyst modifies an AI-extracted field, they MUST select one of:

1. **AI Extraction Error** (`ai_extraction_error`)
   - OCR misread the document
   - Wrong field extracted

2. **Document Ambiguity** (`document_ambiguity`)
   - Document unclear or damaged
   - Multiple possible interpretations

3. **Farmer-Provided Correction** (`farmer_provided_correction`)
   - Farmer verbally corrected the value
   - Updated information provided

4. **Data Missing/Illegible** (`data_missing_illegible`)
   - Field not present in document
   - Text unreadable

### Field Override Workflow

```typescript
// 1. Analyst edits a field
const handleFieldChange = async (fieldId: string, newValue: any) => {
  const existingField = await getModuleField(applicationId, fieldId);

  if (existingField?.source === 'ai_extracted') {
    // 2. Show justification modal
    const justification = await showJustificationModal();

    if (!justification) {
      return; // Cannot save without justification
    }

    // 3. Log to audit trail
    await logAuditEntry({
      application_id: applicationId,
      field_id: fieldId,
      old_value: existingField.value,
      new_value: newValue,
      justification: justification,
      action: 'field_override'
    });

    // 4. Update field with new source
    await updateModuleField(applicationId, fieldId, {
      value: newValue,
      source: 'proxy_edited'
    });
  }
};
```

### Dual-Pane Audit Review

```typescript
// DualPaneReview component structure
interface DualPaneReviewProps {
  documentId: string;
  applicationId: string;
}

// Left pane: PDF viewer
// Right pane: Extracted fields with confidence badges

// Fields < 90% confidence MUST be interacted with
const requiresInteraction = (field: ExtractedField) => {
  return field.confidence < 0.90 && !field.reviewed;
};

// "Mark Audited" button enabled only when all flags resolved
const canMarkAudited = (fields: ExtractedField[]) => {
  return fields.every(f => !requiresInteraction(f));
};
```

### Document Audit Status Flow

```
pending → processing → processed → audited
                          ↓
                        error
```

### Certification Gates

Before an application can be certified:

1. **All documents must be `audited`**
   ```typescript
   const allDocumentsAudited = documents.every(
     d => d.extraction_status === 'audited'
   );
   ```

2. **All required module fields must be populated**
   ```typescript
   const requiredFields = getRequiredFields();
   const allFieldsPopulated = requiredFields.every(
     f => moduleData[f.module]?.[f.field] != null
   );
   ```

3. **Analyst must check certification statement**
   ```typescript
   const certificationChecked = formState.certificationAgreement === true;
   ```

### Certification Lock

```typescript
// After certification, application becomes immutable
const certifyApplication = async (applicationId: string) => {
  // 1. Verify all gates pass
  if (!canCertify(applicationId)) {
    throw new Error('Certification requirements not met');
  }

  // 2. Log certification action
  await logAuditEntry({
    application_id: applicationId,
    action: 'application_certified',
    justification: null
  });

  // 3. Lock application
  await supabase
    .from('applications')
    .update({ status: 'locked' })
    .eq('id', applicationId);

  // 4. Trigger PDF generation
  await generateCertificationPDF(applicationId);
};
```

### Audit Trail Export

```typescript
// CSV export format
const exportAuditTrail = async (applicationId: string) => {
  const entries = await getAuditTrail(applicationId);

  const csv = [
    'timestamp,user,field,old_value,new_value,justification,action',
    ...entries.map(e =>
      `${e.created_at},${e.user_id},${e.field_id},${e.old_value},${e.new_value},${e.justification},${e.action}`
    )
  ].join('\n');

  return csv;
};
```

## Tips

- Audit trail is append-only - never update or delete entries
- Always require justification for AI-extracted field changes
- Use database triggers to prevent edits after certification
- Include before/after values for full traceability
- Export audit trail as part of certification package
