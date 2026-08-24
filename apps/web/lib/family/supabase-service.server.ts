import 'server-only';

import {createClient, type SupabaseClient} from '@supabase/supabase-js';

import {
  FamilyDatabaseConfigurationError,
  requireFamilySupabaseUrl,
} from './supabase-config.server';

/**
 * Reserved for the authorized notification/retention cron worker. This module
 * is intentionally separate from the request-scoped Supabase client so an
 * ordinary Family page, repository, action, or public webhook cannot import a
 * module that can read the service-role credential.
 */
export function createFamilyServiceClient(): SupabaseClient {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) throw new FamilyDatabaseConfigurationError();

  return createClient(requireFamilySupabaseUrl(), secret, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {'X-Client-Info': 'help-math-family-portal/service-v1'},
    },
  });
}
