import {isClerkLocalAuthConfigurationReady} from '@/lib/clerk-local-auth-config';

export const FAMILY_AUTH_PROVIDER_MODES = [
  'disabled',
  'clerk-development',
  'supabase',
] as const;

export type FamilyAuthProviderMode =
  (typeof FAMILY_AUTH_PROVIDER_MODES)[number];

export interface FamilyAuthEnvironment {
  CLERK_LOCAL_AUTH_ENABLED?: string;
  CLERK_LOCAL_AUTH_ORIGIN?: string;
  CLERK_SECRET_KEY?: string;
  FAMILY_AUTH_PROVIDER?: string;
  FAMILY_SUPABASE_AUTH_AUDIENCE?: string;
  FAMILY_SUPABASE_AUTH_CUTOVER_ENABLED?: string;
  FAMILY_SUPABASE_AUTH_ISSUER?: string;
  NEXT_PUBLIC_CLERK_KEYLESS_DISABLED?: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NODE_ENV?: string;
}

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

function exactSupabaseOrigin(
  value: string | undefined,
  environment: FamilyAuthEnvironment,
) {
  try {
    const url = new URL(value ?? '');
    if (
      !(
        url.protocol === 'https:'
        || (
          environment.NODE_ENV !== 'production'
          && url.protocol === 'http:'
          && LOOPBACK_HOSTS.has(url.hostname)
        )
      )
      || url.pathname !== '/'
      || url.search
      || url.hash
      || url.username
      || url.password
    ) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function expectedFamilySupabaseIssuer(
  environment: FamilyAuthEnvironment = process.env,
) {
  const configured = environment.FAMILY_SUPABASE_AUTH_ISSUER?.trim();
  const origin = exactSupabaseOrigin(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment,
  );
  if (!configured || !origin) return null;
  try {
    const issuer = new URL(configured);
    if (
      issuer.origin !== origin
      || issuer.pathname !== '/auth/v1'
      || issuer.search
      || issuer.hash
      || issuer.username
      || issuer.password
    ) return null;
    return issuer.toString().replace(/\/$/u, '');
  } catch {
    return null;
  }
}

export function expectedFamilySupabaseAudience(
  environment: FamilyAuthEnvironment = process.env,
) {
  const audience = environment.FAMILY_SUPABASE_AUTH_AUDIENCE?.trim();
  return audience === 'authenticated' ? audience : null;
}

export function isFamilySupabaseAuthConfigurationReady(
  environment: FamilyAuthEnvironment = process.env,
) {
  const publishableKey =
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return environment.FAMILY_SUPABASE_AUTH_CUTOVER_ENABLED === 'true'
    && Boolean(publishableKey && publishableKey.length <= 8_192)
    && expectedFamilySupabaseIssuer(environment) !== null
    && expectedFamilySupabaseAudience(environment) !== null;
}

/**
 * Authentication providers are deliberately exclusive. A requested provider
 * with incomplete configuration becomes disabled; it never falls back to a
 * second provider and cannot create two application identities for one adult.
 */
export function readFamilyAuthProviderMode(
  environment: FamilyAuthEnvironment = process.env,
): FamilyAuthProviderMode {
  const requested = environment.FAMILY_AUTH_PROVIDER?.trim();
  if (requested === 'supabase') {
    return isFamilySupabaseAuthConfigurationReady(environment)
      ? 'supabase'
      : 'disabled';
  }
  if (requested === 'clerk-development') {
    return isClerkLocalAuthConfigurationReady(environment)
      ? 'clerk-development'
      : 'disabled';
  }
  if (requested === 'disabled') return 'disabled';
  return 'disabled';
}

export function isFamilyAuthEnabled(
  environment: FamilyAuthEnvironment = process.env,
) {
  return readFamilyAuthProviderMode(environment) !== 'disabled';
}
