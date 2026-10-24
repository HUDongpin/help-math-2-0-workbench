import {inspectClerkLocalAuthPreflight} from './clerk-local-auth-preflight';
import {
  proveClerkDevelopmentKeyBinding,
  type ClerkSyntheticDomainPage,
} from './clerk-synthetic-key-binding';
import {
  CLERK_SYNTHETIC_ORIGIN,
  CLERK_SYNTHETIC_PROVIDER_PREFLIGHT_AUTHORIZATION,
} from './clerk-synthetic-execution';

export const CLERK_SYNTHETIC_PROVIDER_PREFLIGHT_STATUSES = Object.freeze([
  'READY',
  'NOT_AUTHORIZED',
  'ORIGIN_OR_KEY_MISMATCH',
  'PROVIDER_UNAVAILABLE',
] as const);

export type ClerkSyntheticProviderPreflightStatus =
  typeof CLERK_SYNTHETIC_PROVIDER_PREFLIGHT_STATUSES[number];

const rejectedAmbientOverrides = Object.freeze([
  'ALL_PROXY',
  'CLERK_API_URL',
  'CLERK_FAPI',
  'CLERK_FAPI_URL',
  'CLERK_TESTING_TOKEN',
  'DEBUG',
  'HTTPS_PROXY',
  'HTTP_PROXY',
  'NODE_EXTRA_CA_CERTS',
  'NODE_TLS_REJECT_UNAUTHORIZED',
  'NODE_USE_ENV_PROXY',
  'PWDEBUG',
  'SSL_CERT_DIR',
  'SSL_CERT_FILE',
  'all_proxy',
  'https_proxy',
  'http_proxy',
] as const);

type ProviderPreflightEnvironment = NodeJS.ProcessEnv & Readonly<{
  CLERK_SYNTHETIC_PROVIDER_PREFLIGHT?: string;
}>;

export async function runClerkSyntheticProviderPreflight({
  environment,
  listDomains,
}: Readonly<{
  environment: ProviderPreflightEnvironment;
  listDomains: () => Promise<ClerkSyntheticDomainPage>;
}>): Promise<ClerkSyntheticProviderPreflightStatus> {
  if (
    environment.NODE_ENV === 'production'
    || environment.CLERK_SYNTHETIC_PROVIDER_PREFLIGHT
      !== CLERK_SYNTHETIC_PROVIDER_PREFLIGHT_AUTHORIZATION
    || rejectedAmbientOverrides.some(
      (name) => (environment[name] ?? '').length > 0,
    )
  ) return 'NOT_AUTHORIZED';

  const localReadiness = inspectClerkLocalAuthPreflight({
    CLERK_LOCAL_AUTH_ENABLED: environment.CLERK_LOCAL_AUTH_ENABLED,
    CLERK_LOCAL_AUTH_ORIGIN: CLERK_SYNTHETIC_ORIGIN,
    CLERK_SECRET_KEY: environment.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_KEYLESS_DISABLED:
      environment.NEXT_PUBLIC_CLERK_KEYLESS_DISABLED,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      environment.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NODE_ENV: 'development',
  });
  if (!localReadiness.ready) return 'NOT_AUTHORIZED';

  let domains: ClerkSyntheticDomainPage;
  try {
    domains = await listDomains();
  } catch {
    return 'PROVIDER_UNAVAILABLE';
  }

  try {
    await proveClerkDevelopmentKeyBinding({
      environment,
      listDomains: async () => domains,
    });
    return 'READY';
  } catch {
    return 'ORIGIN_OR_KEY_MISMATCH';
  }
}
