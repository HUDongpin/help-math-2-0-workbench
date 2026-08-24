import type {AppLocale} from '@/i18n/routing';

export type FamilyAuthActionCode =
  | 'CHECK_EMAIL'
  | 'INVALID_CREDENTIALS'
  | 'PASSWORD_UPDATED'
  | 'REQUEST_ACCEPTED'
  | 'RETRY_LATER';

export interface FamilyAuthActionState {
  code?: FamilyAuthActionCode;
  status: 'idle' | 'error' | 'success';
}

export const INITIAL_FAMILY_AUTH_ACTION_STATE: FamilyAuthActionState = {
  status: 'idle',
};

const ALLOWED_AUTH_RETURN_PATHS = [
  '/account',
  '/admin/family-access',
  '/admin/family-operations',
  '/family',
  '/family/invitations/accept',
  '/family/requests',
  '/teacher/family-access',
  '/teacher/messages',
  '/update-password',
  '/es/account',
  '/es/admin/family-access',
  '/es/admin/family-operations',
  '/es/family',
  '/es/family/invitations/accept',
  '/es/family/requests',
  '/es/teacher/family-access',
  '/es/teacher/messages',
  '/es/update-password',
] as const;

export function safeFamilyAuthReturnPath(value: unknown, fallback = '/family') {
  if (typeof value !== 'string' || value.length > 300) return fallback;
  let url: URL;
  try {
    url = new URL(value, 'https://auth-return.invalid');
  } catch {
    return fallback;
  }
  if (
    url.origin !== 'https://auth-return.invalid'
    || url.username
    || url.password
    || url.hash
  ) return fallback;
  const allowed = ALLOWED_AUTH_RETURN_PATHS.some((path) => (
    url.pathname === path || url.pathname.startsWith(`${path}/`)
  ));
  return allowed ? `${url.pathname}${url.search}` : fallback;
}

export function familyAuthLocale(value: unknown): AppLocale {
  return value === 'es' ? 'es' : 'en';
}

export function localizedFamilyAuthPath(
  locale: AppLocale,
  path: '/account' | '/family' | '/recover' | '/sign-in' | '/sign-up' | '/update-password',
) {
  return locale === 'es' ? `/es${path}` : path;
}
