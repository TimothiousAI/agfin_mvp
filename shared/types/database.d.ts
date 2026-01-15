export type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
export interface Database {
    public: {
        Tables: {
            applications: {
                Row: {
                    id: string;
                    analyst_id: string;
                    farmer_name: string;
                    farmer_email: string;
                    farmer_phone: string | null;
                    status: 'draft' | 'awaiting_documents' | 'awaiting_audit' | 'certified' | 'locked';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    analyst_id: string;
                    farmer_name: string;
                    farmer_email: string;
                    farmer_phone?: string | null;
                    status?: 'draft' | 'awaiting_documents' | 'awaiting_audit' | 'certified' | 'locked';
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    analyst_id?: string;
                    farmer_name?: string;
                    farmer_email?: string;
                    farmer_phone?: string | null;
                    status?: 'draft' | 'awaiting_documents' | 'awaiting_audit' | 'certified' | 'locked';
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "applications_analyst_id_fkey";
                        columns: ["analyst_id"];
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            documents: {
                Row: {
                    id: string;
                    application_id: string;
                    document_type: 'farm_map' | 'land_title' | 'previous_certification' | 'organic_plan' | 'field_history' | 'input_records' | 'sales_records' | 'other' | 'photo';
                    storage_path: string;
                    extraction_status: 'pending' | 'processing' | 'processed' | 'audited' | 'error';
                    confidence_score: number | null;
                    metadata: Json;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    application_id: string;
                    document_type: 'farm_map' | 'land_title' | 'previous_certification' | 'organic_plan' | 'field_history' | 'input_records' | 'sales_records' | 'other' | 'photo';
                    storage_path: string;
                    extraction_status?: 'pending' | 'processing' | 'processed' | 'audited' | 'error';
                    confidence_score?: number | null;
                    metadata?: Json;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    application_id?: string;
                    document_type?: 'farm_map' | 'land_title' | 'previous_certification' | 'organic_plan' | 'field_history' | 'input_records' | 'sales_records' | 'other' | 'photo';
                    storage_path?: string;
                    extraction_status?: 'pending' | 'processing' | 'processed' | 'audited' | 'error';
                    confidence_score?: number | null;
                    metadata?: Json;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "documents_application_id_fkey";
                        columns: ["application_id"];
                        referencedRelation: "applications";
                        referencedColumns: ["id"];
                    }
                ];
            };
            module_data: {
                Row: {
                    id: string;
                    application_id: string;
                    module_number: number;
                    field_id: string;
                    value: Json;
                    source: 'ai_extracted' | 'proxy_entered' | 'proxy_edited' | 'auditor_verified';
                    source_document_id: string | null;
                    confidence_score: number | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    application_id: string;
                    module_number: number;
                    field_id: string;
                    value: Json;
                    source: 'ai_extracted' | 'proxy_entered' | 'proxy_edited' | 'auditor_verified';
                    source_document_id?: string | null;
                    confidence_score?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    application_id?: string;
                    module_number?: number;
                    field_id?: string;
                    value?: Json;
                    source?: 'ai_extracted' | 'proxy_entered' | 'proxy_edited' | 'auditor_verified';
                    source_document_id?: string | null;
                    confidence_score?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "module_data_application_id_fkey";
                        columns: ["application_id"];
                        referencedRelation: "applications";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "module_data_source_document_id_fkey";
                        columns: ["source_document_id"];
                        referencedRelation: "documents";
                        referencedColumns: ["id"];
                    }
                ];
            };
            audit_trail: {
                Row: {
                    id: string;
                    application_id: string;
                    user_id: string;
                    field_id: string | null;
                    old_value: string | null;
                    new_value: string | null;
                    justification: 'data_quality_issue' | 'document_illegible' | 'farmer_provided_correction' | 'regulatory_requirement' | null;
                    action: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    application_id: string;
                    user_id: string;
                    field_id?: string | null;
                    old_value?: string | null;
                    new_value?: string | null;
                    justification?: 'data_quality_issue' | 'document_illegible' | 'farmer_provided_correction' | 'regulatory_requirement' | null;
                    action: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    application_id?: string;
                    user_id?: string;
                    field_id?: string | null;
                    old_value?: string | null;
                    new_value?: string | null;
                    justification?: 'data_quality_issue' | 'document_illegible' | 'farmer_provided_correction' | 'regulatory_requirement' | null;
                    action?: string;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "audit_trail_application_id_fkey";
                        columns: ["application_id"];
                        referencedRelation: "applications";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "audit_trail_user_id_fkey";
                        columns: ["user_id"];
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            agfin_ai_bot_sessions: {
                Row: {
                    id: string;
                    user_id: string;
                    application_id: string | null;
                    title: string;
                    workflow_mode: 'general_help' | 'document_review' | 'field_completion' | 'audit_preparation' | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    application_id?: string | null;
                    title?: string;
                    workflow_mode?: 'general_help' | 'document_review' | 'field_completion' | 'audit_preparation' | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    application_id?: string | null;
                    title?: string;
                    workflow_mode?: 'general_help' | 'document_review' | 'field_completion' | 'audit_preparation' | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "agfin_ai_bot_sessions_user_id_fkey";
                        columns: ["user_id"];
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "agfin_ai_bot_sessions_application_id_fkey";
                        columns: ["application_id"];
                        referencedRelation: "applications";
                        referencedColumns: ["id"];
                    }
                ];
            };
            agfin_ai_bot_messages: {
                Row: {
                    id: string;
                    session_id: string;
                    role: 'user' | 'assistant';
                    content: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    session_id: string;
                    role: 'user' | 'assistant';
                    content: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    session_id?: string;
                    role?: 'user' | 'assistant';
                    content?: string;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "agfin_ai_bot_messages_session_id_fkey";
                        columns: ["session_id"];
                        referencedRelation: "agfin_ai_bot_sessions";
                        referencedColumns: ["id"];
                    }
                ];
            };
            agfin_ai_bot_memories: {
                Row: {
                    id: string;
                    user_id: string;
                    content: string;
                    embedding: number[];
                    metadata: Json;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    content: string;
                    embedding: number[];
                    metadata?: Json;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    content?: string;
                    embedding?: number[];
                    metadata?: Json;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "agfin_ai_bot_memories_user_id_fkey";
                        columns: ["user_id"];
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: {
            agfin_ai_bot_session_summary: {
                Row: {
                    id: string;
                    user_id: string;
                    application_id: string | null;
                    title: string;
                    workflow_mode: 'general_help' | 'document_review' | 'field_completion' | 'audit_preparation' | null;
                    created_at: string;
                    updated_at: string;
                    message_count: number;
                    last_message_at: string | null;
                };
            };
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
}
//# sourceMappingURL=database.d.ts.map