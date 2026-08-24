import 'server-only';

import {z} from 'zod';

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

const deliveryEventInputSchema = z.object({
  eventId: z.string().min(1).max(255),
  eventType: z.enum(['delivered', 'bounced', 'complained', 'suppressed']),
  occurredAt: z.iso.datetime({offset: true}),
  providerEmailId: z.string().min(1).max(255),
}).strict();

const writerClaimsSchema = z.object({
  aud: z.string().min(1).max(255),
  exp: z.number().int().positive(),
  iss: z.string().url().max(2_048),
  role: z.literal('family_webhook_writer'),
}).passthrough();

class FamilyWebhookWriterConfigurationError extends Error {
  constructor() {
    super('Family delivery-event recording is not configured.');
    this.name = 'FamilyWebhookWriterConfigurationError';
  }
}

function requiredEnvironmentValue(name: string, maximumLength: number) {
  const value = process.env[name]?.trim();
  if (!value || value.length > maximumLength) {
    throw new FamilyWebhookWriterConfigurationError();
  }
  return value;
}

function writerEndpoint() {
  const configured = requiredEnvironmentValue('NEXT_PUBLIC_SUPABASE_URL', 2_048);
  let baseUrl: URL;
  try {
    baseUrl = new URL(configured);
  } catch {
    throw new FamilyWebhookWriterConfigurationError();
  }
  if (
    baseUrl.username
    || baseUrl.password
    || baseUrl.pathname !== '/'
    || baseUrl.search
    || baseUrl.hash
    || !(
      baseUrl.protocol === 'https:'
      || (
        process.env.NODE_ENV !== 'production'
        && baseUrl.protocol === 'http:'
        && LOOPBACK_HOSTS.has(baseUrl.hostname)
      )
    )
  ) throw new FamilyWebhookWriterConfigurationError();
  return new URL(
    '/rest/v1/rpc/record_family_email_delivery_event_v1',
    baseUrl,
  );
}

function decodeWriterClaims(token: string) {
  const segments = token.split('.');
  if (segments.length !== 3 || segments.some((segment) => !segment)) {
    throw new FamilyWebhookWriterConfigurationError();
  }
  try {
    return writerClaimsSchema.parse(JSON.parse(
      Buffer.from(segments[1], 'base64url').toString('utf8'),
    ));
  } catch {
    throw new FamilyWebhookWriterConfigurationError();
  }
}

function writerCredential() {
  const token = requiredEnvironmentValue('FAMILY_WEBHOOK_WRITER_JWT', 8_192);
  const expectedIssuer = requiredEnvironmentValue(
    'FAMILY_WEBHOOK_WRITER_JWT_ISSUER',
    2_048,
  );
  const expectedAudience = requiredEnvironmentValue(
    'FAMILY_WEBHOOK_WRITER_JWT_AUDIENCE',
    255,
  );
  const claims = decodeWriterClaims(token);
  if (
    claims.iss !== expectedIssuer
    || claims.aud !== expectedAudience
    || claims.exp <= Math.floor(Date.now() / 1_000)
  ) throw new FamilyWebhookWriterConfigurationError();
  return token;
}

/**
 * Uses a dedicated, short-lived PostgREST role token whose database role has
 * no table privileges and can execute only the delivery-event RPC. The
 * Supabase service-role credential is intentionally absent from this public
 * webhook request path.
 */
export async function recordResendDeliveryEvent(input: Readonly<{
  eventId: string;
  eventType: 'delivered' | 'bounced' | 'complained' | 'suppressed';
  occurredAt: string;
  providerEmailId: string;
}>) {
  const parsed = deliveryEventInputSchema.parse(input);
  const response = await fetch(writerEndpoint(), {
    body: JSON.stringify({
      p_event_type: parsed.eventType,
      p_occurred_at: parsed.occurredAt,
      p_provider_email_id: parsed.providerEmailId,
      p_provider_event_id: parsed.eventId,
    }),
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      apikey: requiredEnvironmentValue(
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
        8_192,
      ),
      Authorization: `Bearer ${writerCredential()}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
      'X-Client-Info': 'help-math-family-webhook-writer/v1',
    },
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(7_000),
  });
  if (response.status !== 204) {
    throw new Error('Could not record email delivery event.');
  }
}
