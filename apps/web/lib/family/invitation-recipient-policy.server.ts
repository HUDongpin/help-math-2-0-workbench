import 'server-only';

export type FamilyInvitationRecipientPolicy =
  | 'disabled'
  | 'school-verified-production'
  | 'synthetic-invalid-only';

type FamilyInvitationRecipientEnvironment = Readonly<{
  FAMILY_INVITATION_RECIPIENT_POLICY?: string;
  FAMILY_PRODUCTION_INVITATIONS_ENABLED?: string;
  NODE_ENV?: string;
}>;

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/u;
const DOT_ATOM_LOCAL_PART_PATTERN =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/u;
const DNS_MAIL_DOMAIN_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/u;
const RESERVED_PRODUCTION_DOMAINS = new Set([
  'example.com',
  'example.net',
  'example.org',
  'localhost',
]);

export function readFamilyInvitationRecipientPolicy():
FamilyInvitationRecipientPolicy {
  const configured = process.env.FAMILY_INVITATION_RECIPIENT_POLICY;
  if (configured === 'synthetic-invalid-only') return configured;
  if (configured === 'school-verified-production') return configured;
  return 'disabled';
}

export function isFamilyInvitationRecipientPolicyEnabled(
  dataMode?: 'production' | 'synthetic',
  environment: FamilyInvitationRecipientEnvironment = process.env,
) {
  const configured = environment.FAMILY_INVITATION_RECIPIENT_POLICY;
  if (dataMode === 'production') {
    return environment.NODE_ENV === 'production'
      && environment.FAMILY_PRODUCTION_INVITATIONS_ENABLED === 'true'
      && configured === 'school-verified-production';
  }
  if (dataMode === 'synthetic') {
    return environment.NODE_ENV !== 'production'
      && configured === 'synthetic-invalid-only';
  }
  return (
    environment.NODE_ENV !== 'production'
      && configured === 'synthetic-invalid-only'
  ) || (
    environment.NODE_ENV === 'production'
      && environment.FAMILY_PRODUCTION_INVITATIONS_ENABLED === 'true'
      && configured === 'school-verified-production'
  );
}

/**
 * Synthetic integration accepts one exact reserved domain. Production accepts
 * only a conservative ASCII mailbox shape after the separate school
 * verification workflow and explicit production cutover gates are active.
 * The domain checks are input hardening, not evidence that a school verified
 * the adult; that authority remains with the school-admin workflow and DB.
 */
export function isAllowedFamilyInvitationRecipient(
  email: string,
  dataMode: 'production' | 'synthetic' = 'synthetic',
  environment: FamilyInvitationRecipientEnvironment = process.env,
) {
  if (
    !isFamilyInvitationRecipientPolicyEnabled(dataMode, environment)
    || CONTROL_CHARACTER_PATTERN.test(email)
  ) return false;
  const normalized = email.normalize('NFC').trim().toLowerCase();
  if (normalized.length > 254) return false;
  const separator = normalized.lastIndexOf('@');
  if (separator < 1) return false;
  const localPart = normalized.slice(0, separator);
  const domain = normalized.slice(separator + 1);
  if (
    localPart.length > 64
    || !DOT_ATOM_LOCAL_PART_PATTERN.test(localPart)
  ) return false;
  if (dataMode === 'synthetic') return domain === 'helpmath.invalid';
  return DNS_MAIL_DOMAIN_PATTERN.test(domain)
    && !RESERVED_PRODUCTION_DOMAINS.has(domain)
    && !domain.endsWith('.example')
    && !domain.endsWith('.invalid')
    && !domain.endsWith('.localhost')
    && !domain.endsWith('.test');
}
