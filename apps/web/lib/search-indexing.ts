import {isPublic1751Production} from './current-js-1751-public-production';

type Environment = Readonly<Record<string, string | undefined>>;

/** The only host search engines may index. Every other host stays noindex. */
export const INDEXABLE_PRODUCTION_HOST = 'www.helpmath.ai';
export const NOINDEX_HEADER_VALUE = 'noindex, nofollow, noarchive, noimageindex';

/** Paths that stay out of crawlers even when production indexing is open. */
export const PRODUCTION_ROBOTS_DISALLOW = Object.freeze([
  '/api/',
  '/account',
  '/es/account',
  '/sign-in',
  '/es/sign-in',
  '/sign-up',
  '/es/sign-up',
  '/migration-status',
  '/es/migration-status',
  '/reference/',
  '/es/reference/',
  '/flash-assets/',
  '/current-js-preview-assets/',
  '/current-js-candidate-assets-internal/',
]);

/** Build/runtime gate: only the real Vercel production deployment of the public build. */
export function productionSearchIndexingEnabled(env: Environment = process.env) {
  return env.VERCEL_ENV === 'production' && isPublic1751Production(env);
}

/** Request gate: production deployment AND the canonical public host. */
export function searchIndexingAllowedForHost(hostHeader: string | null | undefined, env: Environment = process.env) {
  return productionSearchIndexingEnabled(env) && hostHeader?.toLowerCase() === INDEXABLE_PRODUCTION_HOST;
}

/** next.config `missing` condition: apply noindex unless the host is the canonical one. */
export const NON_INDEXABLE_HOST_CONDITION = Object.freeze([
  {type: 'host' as const, value: '^www\\.helpmath\\.ai$'},
]);

/**
 * Legal pages still titled "Draft" pending owner/legal approval. They stay
 * noindex and out of the sitemap until Dongpin approves the final text; remove
 * an entry here once its page is approved.
 */
export const LEGAL_PAGES_PENDING_APPROVAL: readonly string[] = Object.freeze(['/privacy', '/terms']);

export function routeIndexable(route: string) {
  return !LEGAL_PAGES_PENDING_APPROVAL.includes(route);
}
