import {createHash} from 'node:crypto';

import {parsePublishableKey} from '@clerk/shared/keys';

import {
  hasClerkDevelopmentKeyForms,
  type ClerkLocalAuthEnvironment,
} from './clerk-local-auth-config';
import {CLERK_SYNTHETIC_ORIGIN} from './clerk-synthetic-execution';

export type ClerkSyntheticDomainRecord = Readonly<{
  developmentOrigin?: string | null;
  frontendApiUrl: string;
  id: string;
  isSatellite: boolean;
}>;

export type ClerkSyntheticDomainPage = Readonly<{
  data: readonly ClerkSyntheticDomainRecord[];
  totalCount: number;
}>;

type ClerkSyntheticKeyBindingOptions = Readonly<{
  environment: ClerkLocalAuthEnvironment;
  listDomains: () => Promise<ClerkSyntheticDomainPage>;
}>;

export function canonicalClerkDevelopmentFrontendHost(value: string) {
  const candidate = value.includes('://') ? value : `https://${value}`;
  const url = new URL(candidate);
  const hostname = url.hostname.toLowerCase().replace(/\.$/u, '');
  const authority = candidate.replace(/^https:\/\//u, '').split(/[/?#]/u)[0] ?? '';
  const hasExplicitPort = /:\d+$/u.test(authority);
  const valid = url.protocol === 'https:'
    && !url.username
    && !url.password
    && !url.port
    && !hasExplicitPort
    && url.pathname === '/'
    && !url.search
    && !url.hash
    && /^[a-z0-9-]+(?:-[a-z0-9-]+)+\.clerk\.accounts\.dev$/u.test(
      hostname,
    );
  if (!valid) throw new Error('Clerk frontend host failed closed.');
  return hostname;
}

/**
 * Binds the publishable-key Frontend API to the primary domain returned by a
 * secret-authenticated, read-only Clerk Backend API request. The same record
 * may additionally bind the exact synthetic origin when Clerk returns that
 * optional field. Clerk currently omits it for the development primary
 * domain, so the loopback origin remains independently guarded by the local
 * auth/runtime configuration. This function is provider-agnostic for tests:
 * callers inject the bounded domain-list request.
 */
export async function proveClerkDevelopmentKeyBinding({
  environment,
  listDomains,
}: ClerkSyntheticKeyBindingOptions) {
  const publishableKey = environment.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!publishableKey || !hasClerkDevelopmentKeyForms(environment)) {
    throw new Error('Clerk development-key form check failed closed.');
  }

  try {
    const parsed = parsePublishableKey(publishableKey, {fatal: true});
    if (parsed.instanceType !== 'development') {
      throw new Error('Clerk instance type failed closed.');
    }
    const expectedHost = canonicalClerkDevelopmentFrontendHost(
      parsed.frontendApi,
    );
    const domains = await listDomains();
    const completePage = Number.isSafeInteger(domains.totalCount)
      && domains.totalCount >= 0
      && domains.totalCount === domains.data.length;
    if (!completePage) throw new Error('Clerk domain proof was incomplete.');

    const matches = domains.data.filter((domain) =>
      typeof domain.id === 'string'
      && domain.id.length > 0
      && domain.isSatellite === false
      && (
        domain.developmentOrigin == null
        || domain.developmentOrigin === ''
        || domain.developmentOrigin === CLERK_SYNTHETIC_ORIGIN
      )
      && canonicalClerkDevelopmentFrontendHost(domain.frontendApiUrl)
        === expectedHost);
    if (matches.length !== 1) {
      throw new Error('Clerk key binding failed closed.');
    }

    return createHash('sha256')
      .update(matches[0]!.id)
      .update('\0')
      .update(expectedHost)
      .digest('hex');
  } catch {
    throw new Error('Clerk key binding failed closed; details redacted.');
  }
}
