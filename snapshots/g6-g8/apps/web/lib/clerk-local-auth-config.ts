import {
  isDevelopmentFromPublishableKey,
  isDevelopmentFromSecretKey,
} from '@clerk/shared/keys';

export type ClerkLocalAuthEnvironment = Readonly<{
  CLERK_LOCAL_AUTH_ENABLED?: string;
  CLERK_LOCAL_AUTH_ORIGIN?: string;
  CLERK_SECRET_KEY?: string;
  NEXT_PUBLIC_CLERK_KEYLESS_DISABLED?: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
  NODE_ENV?: string;
}>;

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

export function isValidClerkLocalAuthOrigin(value: string | undefined) {
  let origin: URL;
  try {
    origin = new URL(value ?? '');
  } catch {
    return false;
  }

  return origin.protocol === 'http:'
    && LOOPBACK_HOSTS.has(origin.hostname)
    && !origin.username
    && !origin.password
    && origin.pathname === '/'
    && !origin.search
    && !origin.hash;
}

/** Validates key form only; provider-backed proof is required for pairing. */
export function hasClerkDevelopmentKeyForms(
  environment: ClerkLocalAuthEnvironment,
) {
  const publishableKey = environment.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const secretKey = environment.CLERK_SECRET_KEY?.trim();
  return Boolean(
    publishableKey
    && secretKey
    && isDevelopmentFromPublishableKey(publishableKey)
    && isDevelopmentFromSecretKey(secretKey),
  );
}

export function isClerkLocalAuthConfigurationReady(
  environment: ClerkLocalAuthEnvironment,
) {
  return environment.NODE_ENV !== 'production'
    && environment.CLERK_LOCAL_AUTH_ENABLED === 'true'
    && environment.NEXT_PUBLIC_CLERK_KEYLESS_DISABLED === 'true'
    && isValidClerkLocalAuthOrigin(environment.CLERK_LOCAL_AUTH_ORIGIN)
    && hasClerkDevelopmentKeyForms(environment);
}
