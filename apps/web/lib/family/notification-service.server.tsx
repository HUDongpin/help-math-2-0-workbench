import 'server-only';

import {render} from '@react-email/components';
import nodemailer from 'nodemailer';
import {Resend} from 'resend';
import {z} from 'zod';

import {
  FamilyAccountSecurityEmail,
  FamilyMessageNotificationEmail,
  GuardianInvitationEmail,
  WeeklyFamilyDigestEmail,
} from '@/emails/family-email-templates';
import type {AppLocale} from '@/i18n/routing';

import {readFamilyFeatureFlags} from './feature-flags';
import {
  isSyntheticMailpitRecipient,
  resolveFamilyEmailTransport,
} from './family-email-transport';
import {
  decryptFamilyEmailFromStorage,
  decryptInvitationTokenFromOutbox,
} from './invitation-secret.server';
import {createFamilyServiceClient} from './supabase-service.server';
import {NOTIFICATION_KINDS} from './types';

const outboxPayloadSchema = z.discriminatedUnion('kind', [
  z.object({
    encryptedInvitationToken: z.string().min(1),
    // Required for v2 token AAD. It remains optional only so a deliberately
    // enabled, time-bounded v1 drain can read pre-migration outbox rows.
    invitationId: z.uuid().optional(),
    kind: z.literal('guardian_invitation'),
  }).strict(),
  z.object({kind: z.literal('family_message')}).strict(),
  z.object({
    activityCount: z.number().int().min(0).max(10_000),
    kind: z.literal('weekly_family_digest'),
    openAssignmentCount: z.number().int().min(0).max(10_000),
    unreadThreadCount: z.number().int().min(0).max(10_000),
  }).strict(),
  z.object({kind: z.literal('account_security')}).strict(),
]);

const notificationOutboxRowSchema = z.object({
  attempts: z.number().int().min(1).max(100),
  claim_expires_at: z.iso.datetime({offset: true}),
  claim_token: z.uuid(),
  id: z.uuid(),
  idempotency_key: z.string().min(8).max(160),
  kind: z.enum(NOTIFICATION_KINDS),
  locale: z.enum(['en', 'es']),
  payload: z.unknown(),
  recipient_email_ciphertext: z.string().min(16).max(8_192),
  recipient_email_digest: z.string().regex(/^[0-9a-f]{64}$/u),
  tenant_id: z.uuid(),
}).strict();

type NotificationOutboxRow = z.infer<typeof notificationOutboxRowSchema>;

type FamilyNotificationEmail = ReturnType<typeof buildFamilyNotificationEmail>;

type FamilyDeliveryTransport = Readonly<{
  kind: 'mailpit-local';
  mailer: ReturnType<typeof nodemailer.createTransport>;
}> | Readonly<{
  kind: 'resend';
  resend: Resend;
}>;

const outboxCompletionStatusSchema = z.enum(['pending', 'sent', 'failed']);
const retentionResultSchema = z.object({
  runs: z.array(z.object({
    status: z.literal('succeeded'),
  }).passthrough()),
}).strict();

function requirePortalBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) throw new Error('Family email delivery is not configured.');
  const url = new URL(configured);
  if (
    process.env.NODE_ENV === 'production'
    && url.protocol !== 'https:'
  ) throw new Error('Family email delivery is not configured.');
  return url;
}

function requireFamilyFromEmail() {
  const value = process.env.FAMILY_FROM_EMAIL?.trim();
  if (!value) throw new Error('Family email delivery is not configured.');
  return value;
}

function createFamilyDeliveryTransport(): FamilyDeliveryTransport {
  const kind = resolveFamilyEmailTransport(process.env);
  if (kind === 'resend') {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) throw new Error('Family email delivery is not configured.');
    return {kind, resend: new Resend(apiKey)};
  }

  return {
    kind,
    mailer: nodemailer.createTransport({
      disableFileAccess: true,
      disableUrlAccess: true,
      host: '127.0.0.1',
      ignoreTLS: true,
      port: 1_025,
      secure: false,
    }),
  };
}

async function deliverFamilyEmail({
  email,
  idempotencyKey,
  outboxId,
  recipient,
  transport,
}: Readonly<{
  email: FamilyNotificationEmail;
  idempotencyKey: string;
  outboxId: string;
  recipient: string;
  transport: FamilyDeliveryTransport;
}>) {
  if (transport.kind === 'resend') {
    const result = await transport.resend.emails.send({
      from: requireFamilyFromEmail(),
      to: recipient,
      ...email,
    }, {idempotencyKey});
    if (result.error || !result.data?.id) throw new Error('Delivery failed.');
    return result.data.id;
  }

  if (!isSyntheticMailpitRecipient(recipient)) {
    throw new Error('Synthetic email recipient is not allowed.');
  }
  const [html, text] = await Promise.all([
    render(email.react),
    render(email.react, {plainText: true}),
  ]);
  const messageId = `<family-${outboxId}@helpmath.invalid>`;
  const result = await transport.mailer.sendMail({
    disableFileAccess: true,
    disableUrlAccess: true,
    from: 'HELP Math Family Test <family@helpmath.invalid>',
    html,
    messageId,
    subject: email.subject,
    text,
    to: recipient,
  });
  if (result.messageId !== messageId) throw new Error('Delivery failed.');
  return `mailpit:${outboxId}`;
}

function localizedPortalPath(locale: AppLocale, path: string) {
  return locale === 'es' ? `/es${path}` : path;
}

export function buildFamilyNotificationEmail(row: NotificationOutboxRow) {
  if (!NOTIFICATION_KINDS.includes(row.kind)) {
    throw new Error('Unsupported notification kind.');
  }
  const payload = outboxPayloadSchema.parse(row.payload);
  if (payload.kind !== row.kind) throw new Error('Notification kind mismatch.');
  const baseUrl = requirePortalBaseUrl();
  const familyUrl = new URL(localizedPortalPath(row.locale, '/family'), baseUrl);
  const spanish = row.locale === 'es';

  switch (payload.kind) {
    case 'guardian_invitation': {
      const token = decryptInvitationTokenFromOutbox(
        payload.encryptedInvitationToken,
        {
          invitationId: payload.invitationId,
          tenantId: row.tenant_id,
        },
      );
      const link = new URL(
        localizedPortalPath(row.locale, '/family/invitations/accept'),
        baseUrl,
      );
      // Fragments are not transmitted in HTTP requests, so the one-use token
      // stays out of Vercel request URLs and analytics. The accept client moves
      // it to sessionStorage and clears the fragment before authentication.
      link.hash = `token=${encodeURIComponent(token)}`;
      return {
        subject: spanish
          ? 'Una escuela te invitó a HELP Math'
          : 'A school invited you to HELP Math',
        react: <GuardianInvitationEmail
          locale={row.locale}
          secureLink={link.toString()}
        />,
      };
    }
    case 'family_message':
      return {
        subject: spanish
          ? 'Tienes un mensaje nuevo en HELP Math'
          : 'You have a new HELP Math message',
        react: <FamilyMessageNotificationEmail
          locale={row.locale}
          portalLink={familyUrl.toString()}
        />,
      };
    case 'weekly_family_digest':
      return {
        subject: spanish
          ? 'Tu resumen semanal de HELP Math'
          : 'Your weekly HELP Math summary',
        react: <WeeklyFamilyDigestEmail
          activityCount={payload.activityCount}
          locale={row.locale}
          openAssignmentCount={payload.openAssignmentCount}
          portalLink={familyUrl.toString()}
          unreadThreadCount={payload.unreadThreadCount}
        />,
      };
    case 'account_security':
      return {
        subject: spanish
          ? 'Cambió tu acceso a HELP Math'
          : 'Your HELP Math access changed',
        react: <FamilyAccountSecurityEmail
          locale={row.locale}
          portalLink={familyUrl.toString()}
        />,
      };
  }
}

async function validateOutboxClaim(
  database: ReturnType<typeof createFamilyServiceClient>,
  row: NotificationOutboxRow,
) {
  const result = await database.rpc('validate_family_notification_claim_v1', {
    p_claim_token: row.claim_token,
    p_id: row.id,
  });
  if (result.error || typeof result.data !== 'boolean') {
    throw new Error('Could not validate notification claim.');
  }
  return result.data;
}

async function completeOutboxClaim({
  claimToken,
  database,
  errorCode,
  id,
  providerEmailId,
}: Readonly<{
  claimToken: string;
  database: ReturnType<typeof createFamilyServiceClient>;
  errorCode?: 'delivery_failed';
  id: string;
  providerEmailId?: string;
}>) {
  const succeeded = providerEmailId !== undefined;
  const result = await database.rpc('complete_family_notification_outbox_v1', {
    p_claim_token: claimToken,
    p_error_code: succeeded ? null : errorCode ?? 'delivery_failed',
    p_id: id,
    p_provider_email_id: providerEmailId ?? null,
    p_succeeded: succeeded,
  });
  if (result.error || !outboxCompletionStatusSchema.safeParse(result.data).success) {
    throw new Error('Could not complete notification claim.');
  }
}

export async function processFamilyNotificationBatch(limit = 25) {
  const flags = readFamilyFeatureFlags();
  // Retention and expired-lease cleanup are lifecycle obligations, not product
  // features. An incident kill switch must stop new Family egress without
  // preventing already-stored data from reaching its approved terminal state.
  const database = createFamilyServiceClient();
  const retention = await database.rpc('run_family_retention_v1', {
    p_batch_size: 1_000,
  });
  if (retention.error || !retentionResultSchema.safeParse(retention.data).success) {
    throw new Error('Could not run family retention.');
  }
  const attestationCleanup = await database.rpc(
    'cleanup_family_invitation_issuance_attestations_v1',
    {p_limit: 1_000},
  );
  if (
    attestationCleanup.error
    || !z.number().int().min(0).safeParse(attestationCleanup.data).success
  ) throw new Error('Could not clean up invitation issuance attestations.');
  if (!flags.portalEnabled || !flags.emailNotificationsEnabled) {
    return {
      claimed: 0,
      failed: 0,
      maintenanceCompleted: true,
      sent: 0,
      skipped: true,
    };
  }
  const transport = createFamilyDeliveryTransport();
  const digestEnqueue = await database.rpc('enqueue_weekly_family_digests_v1', {
    p_limit: 1_000,
  });
  if (digestEnqueue.error) {
    throw new Error('Could not enqueue weekly family digests.');
  }
  const claim = await database.rpc('claim_family_notification_outbox_v1', {
    p_limit: Math.max(1, Math.min(100, limit)),
  });
  if (claim.error) throw new Error('Could not claim family notifications.');
  const rows = z.array(notificationOutboxRowSchema).parse(claim.data ?? []);
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    let email: ReturnType<typeof buildFamilyNotificationEmail>;
    let recipient: string;
    try {
      email = buildFamilyNotificationEmail(row);
      recipient = z.string().email().max(320).parse(
        decryptFamilyEmailFromStorage(row.recipient_email_ciphertext, {
          recipientEmailDigest: row.recipient_email_digest,
          tenantId: row.tenant_id,
        }),
      );
    } catch {
      await completeOutboxClaim({
        claimToken: row.claim_token,
        database,
        errorCode: 'delivery_failed',
        id: row.id,
      });
      failed += 1;
      continue;
    }

    // This is deliberately the last database decision before the external
    // send. Revocation, expiry, suppression, or a stale worker invalidates the
    // opaque lease and prevents egress.
    if (!await validateOutboxClaim(database, row)) {
      failed += 1;
      continue;
    }

    let providerEmailId: string;
    try {
      providerEmailId = await deliverFamilyEmail({
        email,
        idempotencyKey: row.idempotency_key,
        outboxId: row.id,
        recipient,
        transport,
      });
    } catch {
      await completeOutboxClaim({
        claimToken: row.claim_token,
        database,
        errorCode: 'delivery_failed',
        id: row.id,
      });
      failed += 1;
      continue;
    }

    // Never turn an ambiguous post-send database failure into a negative
    // completion: leaving the lease to expire causes an idempotent Resend
    // retry instead of allowing a stale worker to overwrite newer state.
    await completeOutboxClaim({
      claimToken: row.claim_token,
      database,
      id: row.id,
      providerEmailId,
    });
    sent += 1;
  }

  return {
    claimed: rows.length,
    failed,
    maintenanceCompleted: true,
    sent,
    skipped: false,
  };
}
