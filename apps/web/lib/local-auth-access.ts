import type {AppLocale} from '@/i18n/routing';

import {
  isClerkLocalAuthConfigurationReady,
  isValidClerkLocalAuthOrigin,
  type ClerkLocalAuthEnvironment,
} from './clerk-local-auth-config';

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

export const LOCAL_AUTH_PATHS = Object.freeze([
  '/account',
  '/sign-in',
  '/sign-up',
] as const);
export const LOCAL_AUTH_SESSION_API_PATH = '/api/auth/session';

export {isValidClerkLocalAuthOrigin};

export function isLocalAuthEnabled(
  environment: ClerkLocalAuthEnvironment = process.env,
) {
  return isClerkLocalAuthConfigurationReady(environment);
}

export function isLocalAuthPath(pathname: string) {
  return LOCAL_AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isLocalAuthSessionApiPath(pathname: string) {
  return pathname === LOCAL_AUTH_SESSION_API_PATH;
}

export function canonicalLocalAuthRedirect({
  environment = process.env,
  localeFreePathname,
  requestHost,
  requestUrl,
}: Readonly<{
  environment?: ClerkLocalAuthEnvironment;
  localeFreePathname: string;
  requestHost?: string | null;
  requestUrl: URL;
}>) {
  if (
    !isLocalAuthEnabled(environment)
    || !isLocalAuthPath(localeFreePathname)
    || requestUrl.protocol !== 'http:'
    || !LOOPBACK_HOSTS.has(requestUrl.hostname)
  ) return null;

  let canonicalUrl: URL;
  try {
    canonicalUrl = new URL(environment.CLERK_LOCAL_AUTH_ORIGIN ?? '');
  } catch {
    return null;
  }
  let requestOrigin = requestUrl.origin;
  if (requestHost) {
    try {
      const headerUrl = new URL(`${requestUrl.protocol}//${requestHost}`);
      if (
        headerUrl.protocol !== 'http:'
        || !LOOPBACK_HOSTS.has(headerUrl.hostname)
        || headerUrl.username
        || headerUrl.password
        || headerUrl.pathname !== '/'
        || headerUrl.search
        || headerUrl.hash
      ) return null;
      requestOrigin = headerUrl.origin;
    } catch {
      return null;
    }
  }
  if (
    !isValidClerkLocalAuthOrigin(canonicalUrl.href)
    || canonicalUrl.origin === requestOrigin
  ) return null;

  return new URL(`${requestUrl.pathname}${requestUrl.search}`, canonicalUrl);
}

export function localizedAuthPath(
  locale: AppLocale,
  path: (typeof LOCAL_AUTH_PATHS)[number] | '/',
) {
  return locale === 'es' ? (path === '/' ? '/es' : `/es${path}`) : path;
}
