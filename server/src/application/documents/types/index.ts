import { z } from 'zod';

/**
 * Document Type Field Schemas
 * Defines expected fields for each agricultural financing document type
 */

// ============================================================================
// Base Types
// ============================================================================

export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  county: z.string().optional(),
});

export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional();

export const CurrencySchema = z.number().optional();

// ============================================================================
// Document Type: Drivers License
// ============================================================================

export const DriversLicenseSchema = z.object({
  document_type: z.literal('drivers_license'),
  fields: z.object({
    license_number: z.string().optional(),
    full_name: z.string().optional(),
    first_name: z.string().optional(),
    middle_name: z.string().optional(),
    last_name: z.string().optional(),
    date_of_birth: DateSchema,
    gender: z.enum(['M', 'F', 'X']).optional(),
    height: z.string().optional(),
    weight: z.string().optional(),
    eye_color: z.string().optional(),
    address: AddressSchema.optional(),
    issue_date: DateSchema,
    expiration_date: DateSchema,
    issuing_state: z.string().optional(),
    class: z.string().optional(),
    restrictions: z.string().optional(),
    endorsements: z.string().optional(),
  }),
});

// ============================================================================
// Document Type: Schedule F (Farm Income and Expenses)
// ============================================================================

export const ScheduleFSchema = z.object({
  document_type: z.literal('schedule_f'),
  fields: z.object({
    tax_year: z.number().optional(),
    taxpayer_name: z.string().optional(),
    ssn_ein: z.string().optional(),
    principal_product: z.string().optional(),
    accounting_method: z.enum(['cash', 'accrual']).optional(),

    // Part I - Farm Income
    income: z.object({
      sales_livestock_purchased: CurrencySchema,
      sales_livestock_raised: CurrencySchema,
      sales_produce: CurrencySchema,
      cooperative_distributions: CurrencySchema,
      agricultural_payments: CurrencySchema,
      ccc_loans: CurrencySchema,
      crop_insurance: CurrencySchema,
      custom_hire: CurrencySchema,
      other_income: CurrencySchema,
      gross_income: CurrencySchema,
    }).optional(),

    // Part II - Farm Expenses
    expenses: z.object({
      car_truck: CurrencySchema,
      chemicals: CurrencySchema,
      conservation: CurrencySchema,
      custom_hire: CurrencySchema,
      depreciation: CurrencySchema,
      employee_benefit: CurrencySchema,
      feed: CurrencySchema,
      fertilizers: CurrencySchema,
      freight_trucking: CurrencySchema,
      gasoline_fuel: CurrencySchema,
      insurance: CurrencySchema,
      interest_mortgage: CurrencySchema,
      interest_other: CurrencySchema,
      labor_hired: CurrencySchema,
      pension_profit_sharing: CurrencySchema,
      rent_machinery: CurrencySchema,
      rent_land_animals: CurrencySchema,
      repairs_maintenance: CurrencySchema,
      seeds_plants: CurrencySchema,
      storage_warehousing: CurrencySchema,
      supplies: CurrencySchema,
      taxes: CurrencySchema,
      utilities: CurrencySchema,
      veterinary_breeding: CurrencySchema,
      other_expenses: CurrencySchema,
      total_expenses: CurrencySchema,
    }).optional(),

    // Net farm profit/loss
    net_profit_loss: CurrencySchema,
  }),
});

// ============================================================================
// Document Type: Balance Sheet
// ============================================================================

export const BalanceSheetSchema = z.object({
  document_type: z.literal('balance_sheet'),
  fields: z.object({
    statement_date: DateSchema,
    entity_name: z.string().optional(),

    // Assets
    assets: z.object({
      current_assets: z.object({
        cash: CurrencySchema,
        accounts_receivable: CurrencySchema,
        inventory: CurrencySchema,
        crops_growing: CurrencySchema,
        prepaid_expenses: CurrencySchema,
        other_current: CurrencySchema,
        total_current_assets: CurrencySchema,
      }).optional(),

      intermediate_assets: z.object({
        machinery_equipment: CurrencySchema,
        vehicles: CurrencySchema,
        breeding_livestock: CurrencySchema,
        other_intermediate: CurrencySchema,
        total_intermediate_assets: CurrencySchema,
      }).optional(),

      long_term_assets: z.object({
        real_estate_land: CurrencySchema,
        real_estate_buildings: CurrencySchema,
        investment_securities: CurrencySchema,
        other_long_term: CurrencySchema,
        total_long_term_assets: CurrencySchema,
      }).optional(),

      total_assets: CurrencySchema,
    }).optional(),

    // Liabilities
    liabilities: z.object({
      current_liabilities: z.object({
        accounts_payable: CurrencySchema,
        notes_payable_current: CurrencySchema,
        current_portion_term_debt: CurrencySchema,
        accrued_interest: CurrencySchema,
        other_current: CurrencySchema,
        total_current_liabilities: CurrencySchema,
      }).optional(),

      intermediate_liabilities: z.object({
        notes_payable_intermediate: CurrencySchema,
        equipment_loans: CurrencySchema,
        other_intermediate: CurrencySchema,
        total_intermediate_liabilities: CurrencySchema,
      }).optional(),

      long_term_liabilities: z.object({
        real_estate_mortgages: CurrencySchema,
        term_loans: CurrencySchema,
        other_long_term: CurrencySchema,
        total_long_term_liabilities: CurrencySchema,
      }).optional(),

      total_liabilities: CurrencySchema,
    }).optional(),

    // Net Worth
    net_worth: CurrencySchema,
    total_liabilities_and_net_worth: CurrencySchema,
  }),
});

// ============================================================================
// Document Type: FSA-578 (Report of Acreage)
// ============================================================================

export const FSA578Schema = z.object({
  document_type: z.literal('fsa_578'),
  fields: z.object({
    program_year: z.number().optional(),
    farm_number: z.string().optional(),
    tract_number: z.string().optional(),
    producer_name: z.string().optional(),
    county: z.string().optional(),
    state: z.string().optional(),

    // Crop/Land Use Information
    crops: z.array(z.object({
      crop_code: z.string().optional(),
      crop_name: z.string().optional(),
      intended_use: z.string().optional(),
      planted_acres: z.number().optional(),
      prevented_planted_acres: z.number().optional(),
      practice_code: z.string().optional(),
      planting_date: DateSchema,
      share_percentage: z.number().optional(),
    })).optional(),

    total_acres: z.number().optional(),
    organic_acres: z.number().optional(),
    irrigated_acres: z.number().optional(),
    conservation_acres: z.number().optional(),
  }),
});

// ============================================================================
// Document Type: Crop Insurance (Current Year)
// ============================================================================

export const CropInsuranceCurrentSchema = z.object({
  document_type: z.literal('crop_insurance_current'),
  fields: z.object({
    policy_number: z.string().optional(),
    crop_year: z.number().optional(),
    insurance_provider: z.string().optional(),
    agent_name: z.string().optional(),

    insured_info: z.object({
      insured_name: z.string().optional(),
      ssn_ein: z.string().optional(),
      address: AddressSchema.optional(),
    }).optional(),

    coverage: z.array(z.object({
      crop_type: z.string().optional(),
      county: z.string().optional(),
      acres: z.number().optional(),
      coverage_level: z.number().optional(), // e.g., 70, 75, 80
      insurance_plan: z.string().optional(), // e.g., RP, YP, MPCI
      price_election: CurrencySchema,
      projected_price: CurrencySchema,
      liability: CurrencySchema,
      premium: CurrencySchema,
      subsidy: CurrencySchema,
      producer_premium: CurrencySchema,
    })).optional(),

    total_liability: CurrencySchema,
    total_premium: CurrencySchema,
    total_subsidy: CurrencySchema,
    total_producer_premium: CurrencySchema,
  }),
});

// ============================================================================
// Document Type: Crop Insurance (Prior Year)
// ============================================================================

export const CropInsurancePriorSchema = z.object({
  document_type: z.literal('crop_insurance_prior'),
  fields: z.object({
    policy_number: z.string().optional(),
    crop_year: z.number().optional(),
    insurance_provider: z.string().optional(),

    coverage: z.array(z.object({
      crop_type: z.string().optional(),
      county: z.string().optional(),
      acres: z.number().optional(),
      coverage_level: z.number().optional(),
      liability: CurrencySchema,
      premium: CurrencySchema,
    })).optional(),

    // Claims information (if applicable)
    claims: z.array(z.object({
      crop_type: z.string().optional(),
      loss_date: DateSchema,
      loss_cause: z.string().optional(),
      indemnity_payment: CurrencySchema,
    })).optional(),

    total_liability: CurrencySchema,
    total_premium: CurrencySchema,
    total_indemnity: CurrencySchema,
  }),
});

// ============================================================================
// Document Type: Lease Agreement
// ============================================================================

export const LeaseAgreementSchema = z.object({
  document_type: z.literal('lease_agreement'),
  fields: z.object({
    lease_type: z.enum(['cash', 'crop_share', 'flexible', 'custom_farming']).optional(),
    effective_date: DateSchema,
    termination_date: DateSchema,
    term_years: z.number().optional(),

    lessor: z.object({
      name: z.string().optional(),
      address: AddressSchema.optional(),
      contact: z.string().optional(),
    }).optional(),

    lessee: z.object({
      name: z.string().optional(),
      address: AddressSchema.optional(),
      contact: z.string().optional(),
    }).optional(),

    property: z.object({
      legal_description: z.string().optional(),
      county: z.string().optional(),
      state: z.string().optional(),
      total_acres: z.number().optional(),
      tillable_acres: z.number().optional(),
      parcel_numbers: z.array(z.string()).optional(),
    }).optional(),

    rental_terms: z.object({
      cash_rent_per_acre: CurrencySchema,
      total_annual_rent: CurrencySchema,
      payment_schedule: z.string().optional(),
      crop_share_percentage_landlord: z.number().optional(),
      crop_share_percentage_tenant: z.number().optional(),
      expense_sharing: z.string().optional(),
    }).optional(),

    permitted_uses: z.array(z.string()).optional(),
    restrictions: z.array(z.string()).optional(),
  }),
});

// ============================================================================
// Document Type: Equipment List
// ============================================================================

export const EquipmentListSchema = z.object({
  document_type: z.literal('equipment_list'),
  fields: z.object({
    valuation_date: DateSchema,
    owner_name: z.string().optional(),

    equipment: z.array(z.object({
      category: z.enum(['tractor', 'combine', 'planter', 'tillage', 'sprayer', 'truck', 'trailer', 'other']).optional(),
      make: z.string().optional(),
      model: z.string().optional(),
      year: z.number().optional(),
      serial_number: z.string().optional(),
      hours_miles: z.number().optional(),
      condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
      original_cost: CurrencySchema,
      current_market_value: CurrencySchema,
      outstanding_loan_balance: CurrencySchema,
      equity: CurrencySchema,
    })).optional(),

    total_original_cost: CurrencySchema,
    total_current_value: CurrencySchema,
    total_outstanding_loans: CurrencySchema,
    total_equity: CurrencySchema,
  }),
});

// ============================================================================
// Document Type: Organization Documents (LLC, Corp, Partnership)
// ============================================================================

export const OrganizationDocsSchema = z.object({
  document_type: z.literal('organization_docs'),
  fields: z.object({
    document_subtype: z.enum(['articles_of_incorporation', 'operating_agreement', 'partnership_agreement', 'bylaws', 'certificate_of_formation']).optional(),
    entity_name: z.string().optional(),
    entity_type: z.enum(['llc', 'corporation', 'partnership', 's_corp', 'c_corp']).optional(),
    state_of_formation: z.string().optional(),
    formation_date: DateSchema,
    ein: z.string().optional(),

    registered_agent: z.object({
      name: z.string().optional(),
      address: AddressSchema.optional(),
    }).optional(),

    principal_office: AddressSchema.optional(),

    members_partners: z.array(z.object({
      name: z.string().optional(),
      ownership_percentage: z.number().optional(),
      capital_contribution: CurrencySchema,
      role: z.string().optional(),
    })).optional(),

    officers: z.array(z.object({
      name: z.string().optional(),
      title: z.string().optional(),
      appointment_date: DateSchema,
    })).optional(),

    purpose: z.string().optional(),
    duration: z.string().optional(),
  }),
});

// ============================================================================
// Union Type and Type Guards
// ============================================================================

export type DocumentTypeSchema =
  | z.infer<typeof DriversLicenseSchema>
  | z.infer<typeof ScheduleFSchema>
  | z.infer<typeof BalanceSheetSchema>
  | z.infer<typeof FSA578Schema>
  | z.infer<typeof CropInsuranceCurrentSchema>
  | z.infer<typeof CropInsurancePriorSchema>
  | z.infer<typeof LeaseAgreementSchema>
  | z.infer<typeof EquipmentListSchema>
  | z.infer<typeof OrganizationDocsSchema>;

// Schema map for validation
export const DocumentSchemaMap = {
  drivers_license: DriversLicenseSchema,
  schedule_f: ScheduleFSchema,
  balance_sheet: BalanceSheetSchema,
  fsa_578: FSA578Schema,
  crop_insurance_current: CropInsuranceCurrentSchema,
  crop_insurance_prior: CropInsurancePriorSchema,
  lease_agreement: LeaseAgreementSchema,
  equipment_list: EquipmentListSchema,
  organization_docs: OrganizationDocsSchema,
} as const;

export type DocumentTypeName = keyof typeof DocumentSchemaMap;

/**
 * Validate extracted document data against schema
 */
export function validateDocumentData(
  documentType: DocumentTypeName,
  data: unknown
): { success: boolean; data?: DocumentTypeSchema; errors?: string[] } {
  const schema = DocumentSchemaMap[documentType];

  if (!schema) {
    return {
      success: false,
      errors: [`Unknown document type: ${documentType}`],
    };
  }

  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data as DocumentTypeSchema,
    };
  }

  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  };
}

/**
 * Get expected fields for a document type
 */
export function getExpectedFields(documentType: DocumentTypeName): string[] {
  const schema = DocumentSchemaMap[documentType];

  if (!schema) {
    return [];
  }

  // Extract field names from schema shape
  const shape = schema.shape.fields;
  if (!shape) {
    return [];
  }

  return Object.keys(shape.shape || {});
}
