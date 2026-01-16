import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../shared/types/database';

/**
 * Client-side Supabase client
 *
 * In development with mock auth: uses service role key to bypass RLS
 * In production: uses anon key and respects RLS policies
 */

// Get config from environment variables (injected by Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use service role key in dev mode with mock auth to bypass RLS
const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
const isDev = import.meta.env.MODE === 'development';
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// In dev mode with mock auth, use service role key to bypass RLS
const supabaseKey = (isDev && useMockAuth && serviceRoleKey)
  ? serviceRoleKey
  : supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

if (isDev && useMockAuth && serviceRoleKey) {
  console.log('[Database] Using service role key for dev mode (bypassing RLS)');
}

/**
 * Browser Supabase client singleton
 * Automatically handles authentication state
 *
 * In dev mode with service role key: Disable auth features since we're bypassing RLS
 * In production: Full auth with session persistence
 */
const useServiceRole = isDev && useMockAuth && serviceRoleKey;

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: useServiceRole ? {
      // Service role bypasses RLS - disable session management to avoid JWT issues
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    } : {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'agfin-client',
      },
    },
  }
);

/**
 * Auth helpers
 */

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

export async function getCurrentUser() {
  // In dev mode with mock auth, return a mock user
  if (isDev && useMockAuth) {
    // Check if user is "signed in" via mock auth
    const isSignedIn = sessionStorage.getItem('mock_clerk_signed_in') === 'true';
    if (isSignedIn) {
      return {
        id: 'dev-user-00000000-0000-0000-0000-000000000001',
        email: import.meta.env.VITE_DEV_USER_EMAIL || 'dev@agrellus.local',
        app_metadata: {},
        user_metadata: { is_dev_user: true },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as any;
    }
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) throw error;

  return user;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) throw error;

  return session;
}

/**
 * Query helpers for client-side operations
 */

export async function getMyApplications(options?: {
  status?: Database['public']['Tables']['applications']['Row']['status'];
  limit?: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('applications')
    .select('*')
    .eq('analyst_id', user.id)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data;
}

export async function getApplication(applicationId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (error) throw error;

  return data;
}

export async function createApplication(
  application: Database['public']['Tables']['applications']['Insert']
) {
  const { data, error } = await supabase
    .from('applications')
    // @ts-ignore - Supabase type inference limitation
    .insert(application)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateApplication(
  applicationId: string,
  updates: Database['public']['Tables']['applications']['Update']
) {
  const { data, error } = await supabase
    .from('applications')
    // @ts-ignore - Supabase type inference limitation
    .update(updates)
    .eq('id', applicationId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getDocuments(applicationId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data;
}

export async function getModuleDataByApplication(
  applicationId: string,
  moduleNumber?: number
) {
  let query = supabase
    .from('module_data')
    .select('*')
    .eq('application_id', applicationId);

  if (moduleNumber) {
    query = query.eq('module_number', moduleNumber);
  }

  query = query.order('module_number', { ascending: true });

  const { data, error } = await query;

  if (error) throw error;

  return data;
}

export async function upsertModuleData(
  moduleData: Database['public']['Tables']['module_data']['Insert']
) {
  const { data, error } = await supabase
    .from('module_data')
    // @ts-ignore - Supabase type inference limitation
    .upsert(moduleData, {
      onConflict: 'application_id,module_number,field_id',
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getAuditTrailForApplication(applicationId: string) {
  const { data, error } = await supabase
    .from('audit_trail')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data;
}

/**
 * AI Bot helpers
 */

export async function getMySessions(limit = 10) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('agfin_ai_bot_session_summary')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data;
}

export async function createSession(
  title: string,
  applicationId?: string,
  workflowMode?: Database['public']['Tables']['agfin_ai_bot_sessions']['Row']['workflow_mode']
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('agfin_ai_bot_sessions')
    // @ts-ignore - Supabase type inference limitation
    .insert({
      user_id: user.id,
      title,
      application_id: applicationId,
      workflow_mode: workflowMode,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getSessionMessages(sessionId: string) {
  const { data, error } = await supabase
    .from('agfin_ai_bot_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data;
}

export async function addMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
) {
  const { data, error } = await supabase
    .from('agfin_ai_bot_messages')
    // @ts-ignore - Supabase type inference limitation
    .insert({
      session_id: sessionId,
      role,
      content,
    })
    .select()
    .single();

  if (error) throw error;

  // Update session timestamp
  await supabase
    .from('agfin_ai_bot_sessions')
    // @ts-ignore - Supabase type inference limitation
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  return data;
}
