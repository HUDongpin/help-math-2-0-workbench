import 'server-only';

import {forbidden, notFound, redirect} from 'next/navigation';

import type {AppLocale} from '@/i18n/routing';
import {localizedAuthPath} from '@/lib/local-auth-access';

import {FamilyAccessError} from './authorization.server';
import {readFamilyFeatureFlags} from './feature-flags';

export class FamilyPortalUnavailableError extends Error {
  constructor() {
    super('The Family Portal is temporarily unavailable.');
    this.name = 'FamilyPortalUnavailableError';
  }
}

export function requireFamilyPageFeature(
  capability: 'portal' | 'messaging' = 'portal',
) {
  const flags = readFamilyFeatureFlags();
  const enabled = capability === 'messaging'
    ? flags.messagingEnabled
    : flags.portalEnabled;
  if (!enabled) notFound();
  return flags;
}

/**
 * Convert data-layer authorization outcomes into non-enumerating page
 * behavior. The return target is supplied by the route, never by the client.
 */
export function handleFamilyPageAccessError(
  error: unknown,
  locale: AppLocale,
  returnPath:
    | '/family'
    | '/family/requests'
    | '/teacher/messages'
    | '/teacher/family-access'
    | '/admin/family-access'
    | '/admin/family-operations',
): never {
  if (!(error instanceof FamilyAccessError)) {
    throw new FamilyPortalUnavailableError();
  }
  switch (error.code) {
    case 'AUTH_REQUIRED': {
      const localizedReturnPath = locale === 'es'
        ? `/es${returnPath}`
        : returnPath;
      const query = new URLSearchParams({redirect_url: localizedReturnPath});
      redirect(`${localizedAuthPath(locale, '/sign-in')}?${query.toString()}`);
    }
    case 'FORBIDDEN':
      forbidden();
    case 'FEATURE_DISABLED':
    case 'NOT_FOUND':
      notFound();
    case 'RETRY_LATER':
      throw new FamilyPortalUnavailableError();
  }
}
