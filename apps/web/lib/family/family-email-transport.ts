export type FamilyEmailTransportKind = 'mailpit-local' | 'resend';

type FamilyEmailTransportEnvironment = Readonly<{
  FAMILY_EMAIL_TRANSPORT?: string;
  FAMILY_INVITATION_RECIPIENT_POLICY?: string;
  NODE_ENV?: string;
}>;

const syntheticMailpitRecipientPattern =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@helpmath\.invalid$/u;

/**
 * Delivery requires an explicit transport selection. The loopback integration
 * profile cannot fall through to Resend, even when a send credential exists.
 */
export function resolveFamilyEmailTransport(
  environment: FamilyEmailTransportEnvironment,
): FamilyEmailTransportKind {
  const configured = environment.FAMILY_EMAIL_TRANSPORT?.trim();
  if (
    configured === 'resend'
    && environment.FAMILY_INVITATION_RECIPIENT_POLICY !== 'synthetic-invalid-only'
  ) return 'resend';
  if (
    configured === 'mailpit-local'
    && environment.NODE_ENV !== 'production'
    && environment.FAMILY_INVITATION_RECIPIENT_POLICY === 'synthetic-invalid-only'
  ) {
    return 'mailpit-local';
  }
  throw new Error('Family email delivery is not configured.');
}

/**
 * Mailpit is synthetic test infrastructure, not a general SMTP fallback.
 * Accept one already-normalized dot-atom address at the exact reserved domain.
 */
export function isSyntheticMailpitRecipient(value: string) {
  return value.length <= 320 && syntheticMailpitRecipientPattern.test(value);
}
