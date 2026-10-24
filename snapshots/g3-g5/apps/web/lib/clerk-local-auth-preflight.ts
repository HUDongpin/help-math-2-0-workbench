import {
  isClerkLocalAuthConfigurationReady,
  isValidClerkLocalAuthOrigin,
  type ClerkLocalAuthEnvironment,
} from './clerk-local-auth-config';

export {isValidClerkLocalAuthOrigin};

export const CLERK_LOCAL_AUTH_PREFLIGHT_STATUSES = Object.freeze([
  'feature-off',
  'provider-not-authorized',
  'explicit-keys-ready',
  'production-disabled',
  'invalid-origin',
] as const);

export type ClerkLocalAuthPreflightStatus =
  (typeof CLERK_LOCAL_AUTH_PREFLIGHT_STATUSES)[number];

export type ClerkLocalAuthPreflightEnvironment = ClerkLocalAuthEnvironment;

export type ClerkLocalAuthPreflightResult = Readonly<{
  status: ClerkLocalAuthPreflightStatus;
  ready: boolean;
}>;

const RESULTS = Object.freeze({
  'feature-off': Object.freeze({status: 'feature-off', ready: false}),
  'provider-not-authorized': Object.freeze({
    status: 'provider-not-authorized',
    ready: false,
  }),
  'explicit-keys-ready': Object.freeze({
    status: 'explicit-keys-ready',
    ready: true,
  }),
  'production-disabled': Object.freeze({
    status: 'production-disabled',
    ready: false,
  }),
  'invalid-origin': Object.freeze({status: 'invalid-origin', ready: false}),
} satisfies Record<ClerkLocalAuthPreflightStatus, ClerkLocalAuthPreflightResult>);

/**
 * Performs a deterministic, zero-I/O Clerk configuration preflight.
 *
 * The returned object contains no environment values or derived metadata such
 * as key lengths, prefixes, suffixes, cookies, origins, or URL tokens. A route
 * or script may therefore serialize the result without disclosing credentials.
 * Callers must pass an environment explicitly so this function has no ambient
 * process state and remains straightforward to reuse and test.
 */
export function inspectClerkLocalAuthPreflight(
  environment: ClerkLocalAuthPreflightEnvironment,
): ClerkLocalAuthPreflightResult {
  if (environment.NODE_ENV === 'production') {
    return RESULTS['production-disabled'];
  }
  if (environment.CLERK_LOCAL_AUTH_ENABLED !== 'true') {
    return RESULTS['feature-off'];
  }
  if (!isValidClerkLocalAuthOrigin(environment.CLERK_LOCAL_AUTH_ORIGIN)) {
    return RESULTS['invalid-origin'];
  }

  if (isClerkLocalAuthConfigurationReady(environment)) {
    return RESULTS['explicit-keys-ready'];
  }

  return RESULTS['provider-not-authorized'];
}
