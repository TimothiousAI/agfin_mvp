/**
 * Document-to-Module Field Mapping Configuration
 *
 * Maps extracted document fields to AgFin certification module fields.
 * Each document type can populate one or more modules (M1-M4).
 *
 * Modules:
 * - M1: Identity & Organization
 * - M2: Lands & Water Rights
 * - M3: Financial Statements
 * - M4: Operations & Production
 */

export type ModuleId = 'M1' | 'M2' | 'M3' | 'M4';
export type DocumentTypeName =
  | 'drivers_license'
  | 'schedule_f'
  | 'balance_sheet'
  | 'fsa_578'
  | 'crop_insurance_current'
  | 'crop_insurance_prior'
  | 'lease_agreement'
  | 'equipment_list'
  | 'organization_docs';

/**
 * Field mapping from document field to module field
 */
export interface FieldMapping {
  /** Source field path in extracted document (dot notation for nested) */
  documentField: string;
  /** Target field name in module_data table */
  moduleField: string;
  /** Optional transformation function name */
  transform?: 'date' | 'currency' | 'percentage' | 'boolean' | 'address';
  /** Whether this field is required for module completion */
  required?: boolean;
}

/**
 * Module mapping configuration for a document type
 */
export interface ModuleMapping {
  /** Target module ID */
  moduleId: ModuleId;
  /** Module name for display */
  moduleName: string;
  /** Field mappings from document to module */
  fields: FieldMapping[];
}

/**
 * Document type mapping configuration
 */
export interface DocumentMapping {
  /** Document type identifier */
  documentType: DocumentTypeName;
  /** Display name */
  displayName: string;
  /** Target modules this document populates */
  modules: ModuleMapping[];
}

/**
 * Complete field mapping configuration
 */
export const FIELD_MAPPINGS: DocumentMapping[] = [
  // ========================================================================
  // Drivers License → M1 (Identity)
  // ========================================================================
  {
    documentType: 'drivers_license',
    displayName: "Driver's License",
    modules: [
      {
        moduleId: 'M1',
        moduleName: 'Identity & Organization',
        fields: [
          { documentField: 'full_name', moduleField: 'm1_applicant_full_name', required: true },
          { documentField: 'first_name', moduleField: 'm1_applicant_first_name', required: true },
          { documentField: 'middle_name', moduleField: 'm1_applicant_middle_name' },
          { documentField: 'last_name', moduleField: 'm1_applicant_last_name', required: true },
          { documentField: 'date_of_birth', moduleField: 'm1_applicant_dob', transform: 'date', required: true },
          { documentField: 'license_number', moduleField: 'm1_identity_document_number', required: true },
          { documentField: 'issuing_state', moduleField: 'm1_identity_document_state' },
          { documentField: 'expiration_date', moduleField: 'm1_identity_document_expiry', transform: 'date' },
          { documentField: 'address.street', moduleField: 'm1_applicant_address_street' },
          { documentField: 'address.city', moduleField: 'm1_applicant_address_city' },
          { documentField: 'address.state', moduleField: 'm1_applicant_address_state' },
          { documentField: 'address.zip_code', moduleField: 'm1_applicant_address_zip' },
          { documentField: 'address.county', moduleField: 'm1_applicant_address_county' },
        ],
      },
    ],
  },

  // ========================================================================
  // Schedule F → M3 (Financial) & M4 (Operations)
  // ========================================================================
  {
    documentType: 'schedule_f',
    displayName: 'IRS Schedule F (Farm Income)',
    modules: [
      {
        moduleId: 'M3',
        moduleName: 'Financial Statements',
        fields: [
          { documentField: 'tax_year', moduleField: 'm3_tax_year', required: true },
          { documentField: 'gross_income', moduleField: 'm3_gross_farm_income', transform: 'currency', required: true },
          { documentField: 'livestock_sales', moduleField: 'm3_income_livestock_sales', transform: 'currency' },
          { documentField: 'crop_sales', moduleField: 'm3_income_crop_sales', transform: 'currency' },
          { documentField: 'cooperative_distributions', moduleField: 'm3_income_coop_distributions', transform: 'currency' },
          { documentField: 'ag_program_payments', moduleField: 'm3_income_ag_program_payments', transform: 'currency' },
          { documentField: 'custom_hire_income', moduleField: 'm3_income_custom_hire', transform: 'currency' },
          { documentField: 'other_income', moduleField: 'm3_income_other', transform: 'currency' },
          { documentField: 'total_expenses', moduleField: 'm3_total_farm_expenses', transform: 'currency', required: true },
          { documentField: 'depreciation', moduleField: 'm3_expense_depreciation', transform: 'currency' },
          { documentField: 'chemicals', moduleField: 'm3_expense_chemicals', transform: 'currency' },
          { documentField: 'feed', moduleField: 'm3_expense_feed', transform: 'currency' },
          { documentField: 'fertilizers', moduleField: 'm3_expense_fertilizers', transform: 'currency' },
          { documentField: 'seed', moduleField: 'm3_expense_seed', transform: 'currency' },
          { documentField: 'labor', moduleField: 'm3_expense_labor', transform: 'currency' },
          { documentField: 'rent_lease_machinery', moduleField: 'm3_expense_machinery_rent', transform: 'currency' },
          { documentField: 'rent_lease_land', moduleField: 'm3_expense_land_rent', transform: 'currency' },
          { documentField: 'utilities', moduleField: 'm3_expense_utilities', transform: 'currency' },
          { documentField: 'veterinary', moduleField: 'm3_expense_veterinary', transform: 'currency' },
          { documentField: 'net_farm_profit', moduleField: 'm3_net_farm_income', transform: 'currency', required: true },
        ],
      },
      {
        moduleId: 'M4',
        moduleName: 'Operations & Production',
        fields: [
          { documentField: 'principal_product', moduleField: 'm4_primary_commodity', required: true },
          { documentField: 'accounting_method', moduleField: 'm4_accounting_method' },
          { documentField: 'livestock_sales', moduleField: 'm4_livestock_revenue', transform: 'currency' },
          { documentField: 'crop_sales', moduleField: 'm4_crop_revenue', transform: 'currency' },
        ],
      },
    ],
  },

  // ========================================================================
  // Balance Sheet → M3 (Financial)
  // ========================================================================
  {
    documentType: 'balance_sheet',
    displayName: 'Balance Sheet',
    modules: [
      {
        moduleId: 'M3',
        moduleName: 'Financial Statements',
        fields: [
          { documentField: 'statement_date', moduleField: 'm3_balance_sheet_date', transform: 'date', required: true },
          { documentField: 'cash', moduleField: 'm3_asset_cash', transform: 'currency' },
          { documentField: 'accounts_receivable', moduleField: 'm3_asset_accounts_receivable', transform: 'currency' },
          { documentField: 'inventory', moduleField: 'm3_asset_inventory', transform: 'currency' },
          { documentField: 'crops_feed', moduleField: 'm3_asset_crops_feed', transform: 'currency' },
          { documentField: 'livestock', moduleField: 'm3_asset_livestock', transform: 'currency' },
          { documentField: 'machinery_equipment', moduleField: 'm3_asset_machinery_equipment', transform: 'currency' },
          { documentField: 'land_buildings', moduleField: 'm3_asset_land_buildings', transform: 'currency' },
          { documentField: 'total_assets', moduleField: 'm3_total_assets', transform: 'currency', required: true },
          { documentField: 'accounts_payable', moduleField: 'm3_liability_accounts_payable', transform: 'currency' },
          { documentField: 'notes_payable_current', moduleField: 'm3_liability_notes_payable_current', transform: 'currency' },
          { documentField: 'notes_payable_long_term', moduleField: 'm3_liability_notes_payable_long_term', transform: 'currency' },
          { documentField: 'real_estate_debt', moduleField: 'm3_liability_real_estate_debt', transform: 'currency' },
          { documentField: 'total_liabilities', moduleField: 'm3_total_liabilities', transform: 'currency', required: true },
          { documentField: 'net_worth', moduleField: 'm3_net_worth', transform: 'currency', required: true },
          { documentField: 'working_capital', moduleField: 'm3_working_capital', transform: 'currency' },
          { documentField: 'current_ratio', moduleField: 'm3_current_ratio', transform: 'percentage' },
          { documentField: 'debt_to_asset_ratio', moduleField: 'm3_debt_to_asset_ratio', transform: 'percentage' },
        ],
      },
    ],
  },

  // ========================================================================
  // FSA-578 → M2 (Lands)
  // ========================================================================
  {
    documentType: 'fsa_578',
    displayName: 'FSA-578 (Report of Acreage)',
    modules: [
      {
        moduleId: 'M2',
        moduleName: 'Lands & Water Rights',
        fields: [
          { documentField: 'farm_number', moduleField: 'm2_fsa_farm_number', required: true },
          { documentField: 'tract_number', moduleField: 'm2_fsa_tract_number', required: true },
          { documentField: 'field_number', moduleField: 'm2_fsa_field_number', required: true },
          { documentField: 'state', moduleField: 'm2_land_state', required: true },
          { documentField: 'county', moduleField: 'm2_land_county', required: true },
          { documentField: 'total_acres', moduleField: 'm2_total_acres', transform: 'currency', required: true },
          { documentField: 'cropland_acres', moduleField: 'm2_cropland_acres', transform: 'currency' },
          { documentField: 'pasture_acres', moduleField: 'm2_pasture_acres', transform: 'currency' },
          { documentField: 'woodland_acres', moduleField: 'm2_woodland_acres', transform: 'currency' },
          { documentField: 'crop_year', moduleField: 'm2_crop_year', required: true },
          { documentField: 'intended_use', moduleField: 'm2_land_use' },
          { documentField: 'ownership_type', moduleField: 'm2_ownership_type' },
          { documentField: 'clus.fields', moduleField: 'm2_clus_parcels' },
        ],
      },
    ],
  },

  // ========================================================================
  // Crop Insurance (Current & Prior Year) → M4 (Operations)
  // ========================================================================
  {
    documentType: 'crop_insurance_current',
    displayName: 'Crop Insurance Schedule (Current Year)',
    modules: [
      {
        moduleId: 'M4',
        moduleName: 'Operations & Production',
        fields: [
          { documentField: 'crop_year', moduleField: 'm4_insurance_crop_year', required: true },
          { documentField: 'policy_number', moduleField: 'm4_insurance_policy_number', required: true },
          { documentField: 'insurance_company', moduleField: 'm4_insurance_company' },
          { documentField: 'coverage_level', moduleField: 'm4_insurance_coverage_level', transform: 'percentage' },
          { documentField: 'total_premium', moduleField: 'm4_insurance_premium', transform: 'currency' },
          { documentField: 'total_liability', moduleField: 'm4_insurance_liability', transform: 'currency' },
          { documentField: 'crops', moduleField: 'm4_insured_crops' },
        ],
      },
    ],
  },
  {
    documentType: 'crop_insurance_prior',
    displayName: 'Crop Insurance Schedule (Prior Year)',
    modules: [
      {
        moduleId: 'M4',
        moduleName: 'Operations & Production',
        fields: [
          { documentField: 'crop_year', moduleField: 'm4_insurance_prior_year', required: true },
          { documentField: 'policy_number', moduleField: 'm4_insurance_prior_policy_number' },
          { documentField: 'total_indemnity', moduleField: 'm4_insurance_prior_indemnity', transform: 'currency' },
          { documentField: 'total_premium', moduleField: 'm4_insurance_prior_premium', transform: 'currency' },
          { documentField: 'crops', moduleField: 'm4_insurance_prior_crops' },
        ],
      },
    ],
  },

  // ========================================================================
  // Lease Agreement → M2 (Lands)
  // ========================================================================
  {
    documentType: 'lease_agreement',
    displayName: 'Lease/Rental Agreement',
    modules: [
      {
        moduleId: 'M2',
        moduleName: 'Lands & Water Rights',
        fields: [
          { documentField: 'lessor_name', moduleField: 'm2_lease_lessor_name', required: true },
          { documentField: 'lessee_name', moduleField: 'm2_lease_lessee_name', required: true },
          { documentField: 'property_description', moduleField: 'm2_lease_property_description' },
          { documentField: 'property_address', moduleField: 'm2_lease_property_address', transform: 'address' },
          { documentField: 'total_acres', moduleField: 'm2_lease_acres', transform: 'currency' },
          { documentField: 'lease_start_date', moduleField: 'm2_lease_start_date', transform: 'date', required: true },
          { documentField: 'lease_end_date', moduleField: 'm2_lease_end_date', transform: 'date', required: true },
          { documentField: 'lease_type', moduleField: 'm2_lease_type' },
          { documentField: 'annual_rent', moduleField: 'm2_lease_annual_rent', transform: 'currency' },
          { documentField: 'rent_per_acre', moduleField: 'm2_lease_rent_per_acre', transform: 'currency' },
          { documentField: 'payment_terms', moduleField: 'm2_lease_payment_terms' },
        ],
      },
    ],
  },

  // ========================================================================
  // Equipment List → M4 (Operations)
  // ========================================================================
  {
    documentType: 'equipment_list',
    displayName: 'Equipment & Machinery List',
    modules: [
      {
        moduleId: 'M4',
        moduleName: 'Operations & Production',
        fields: [
          { documentField: 'equipment', moduleField: 'm4_equipment_inventory' },
          { documentField: 'total_value', moduleField: 'm4_equipment_total_value', transform: 'currency' },
        ],
      },
    ],
  },

  // ========================================================================
  // Organization Documents → M1 (Identity)
  // ========================================================================
  {
    documentType: 'organization_docs',
    displayName: 'Organization Documents',
    modules: [
      {
        moduleId: 'M1',
        moduleName: 'Identity & Organization',
        fields: [
          { documentField: 'legal_name', moduleField: 'm1_organization_legal_name', required: true },
          { documentField: 'business_structure', moduleField: 'm1_organization_structure', required: true },
          { documentField: 'ein', moduleField: 'm1_organization_ein', required: true },
          { documentField: 'state_of_formation', moduleField: 'm1_organization_state' },
          { documentField: 'formation_date', moduleField: 'm1_organization_formation_date', transform: 'date' },
          { documentField: 'principal_place_of_business', moduleField: 'm1_organization_principal_address', transform: 'address' },
          { documentField: 'registered_agent', moduleField: 'm1_organization_registered_agent' },
          { documentField: 'members', moduleField: 'm1_organization_members' },
          { documentField: 'ownership_percentages', moduleField: 'm1_organization_ownership' },
        ],
      },
    ],
  },
];

/**
 * Get mapping configuration for a document type
 */
export function getDocumentMapping(documentType: DocumentTypeName): DocumentMapping | undefined {
  return FIELD_MAPPINGS.find(mapping => mapping.documentType === documentType);
}

/**
 * Get all modules that a document type can populate
 */
export function getDocumentModules(documentType: DocumentTypeName): ModuleId[] {
  const mapping = getDocumentMapping(documentType);
  return mapping?.modules.map(m => m.moduleId) || [];
}

/**
 * Get field mappings for a specific document type and module
 */
export function getModuleFieldMappings(
  documentType: DocumentTypeName,
  moduleId: ModuleId
): FieldMapping[] | undefined {
  const mapping = getDocumentMapping(documentType);
  const moduleMapping = mapping?.modules.find(m => m.moduleId === moduleId);
  return moduleMapping?.fields;
}

/**
 * Check if a document type populates a specific module
 */
export function doesDocumentPopulateModule(
  documentType: DocumentTypeName,
  moduleId: ModuleId
): boolean {
  return getDocumentModules(documentType).includes(moduleId);
}

/**
 * Get all document types that populate a specific module
 */
export function getDocumentsForModule(moduleId: ModuleId): DocumentTypeName[] {
  return FIELD_MAPPINGS
    .filter(mapping => mapping.modules.some(m => m.moduleId === moduleId))
    .map(mapping => mapping.documentType);
}
