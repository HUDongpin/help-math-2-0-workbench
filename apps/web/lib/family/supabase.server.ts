import 'server-only';

import {createClient, type SupabaseClient} from '@supabase/supabase-js';

import {readFamilyProviderAccessToken} from './provider-session.server';
import {
  FamilyDatabaseConfigurationError,
  requireFamilySupabasePublishableKey,
  requireFamilySupabaseUrl,
} from './supabase-config.server';

export {FamilyDatabaseConfigurationError} from './supabase-config.server';

export async function createFamilyRequestClient(): Promise<SupabaseClient> {
  const accessToken = await readFamilyProviderAccessToken();
  if (!accessToken) throw new FamilyDatabaseConfigurationError();

  return createClient(
    requireFamilySupabaseUrl(),
    requireFamilySupabasePublishableKey(),
    {
      accessToken: async () => accessToken,
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: {
        headers: {'X-Client-Info': 'help-math-family-portal/request-v1'},
      },
    },
  );
}
