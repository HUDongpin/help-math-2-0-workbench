import 'server-only';

import {z} from 'zod';

import type {FamilyInvitationReceipt} from './types';

const ISSUER_ROLE = 'family_invitation_issuer';
const ISSUER_PURPOSE = 'family_invitation_issue_v1';
const MAX_JWT_LIFETIME_SECONDS = 300;
const MIN_REMAINING_JWT_LIFETIME_SECONDS = 10;
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

const jwtHeaderSchema = z.object({
  alg: z.literal('ES256'),
  kid: z.string().min(1).max(128),
  typ: z.literal('JWT'),
}).passthrough();

const issuerClaimsSchema = z.object({
  aud: z.string().min(1).max(255),
  exp: z.number().int().positive(),
  family_purpose: z.literal(ISSUER_PURPOSE),
  iat: z.number().int().positive(),
  iss: z.string().min(3).max(2_048).refine(
    (value) => !/\s/u.test(value),
    'Issuer cannot contain whitespace.',
  ),
  jti: z.uuid(),
  nbf: z.number().int().positive(),
  role: z.literal(ISSUER_ROLE),
  sub: z.literal(ISSUER_ROLE),
}).passthrough();

const idempotencyKey = z.string().min(8).max(128)
  .regex(/^[A-Za-z0-9._:-]+$/u);
const digest = z.string().regex(/^[0-9a-f]{64}$/u);
const ciphertext = z.string().min(32).max(8_192).startsWith('v2.');

const createInputSchema = z.object({
  attestationId: z.uuid(),
  emailCiphertext: ciphertext,
  emailDigest: digest,
  encryptedOutboxToken: ciphertext,
  expiresAt: z.iso.datetime({offset: true}),
  idempotencyKey,
  invitationId: z.uuid(),
  studentId: z.uuid(),
  tokenDigest: digest,
}).strict();

const resendInputSchema = z.object({
  attestationId: z.uuid(),
  encryptedOutboxToken: ciphertext,
  expiresAt: z.iso.datetime({offset: true}),
  idempotencyKey,
  invitationId: z.uuid(),
  tokenDigest: digest,
}).strict();

const receiptSchema = z.object({
  expires_at: z.iso.datetime({offset: true}),
  invitation_id: z.uuid(),
}).strict();

class FamilyInvitationIssuerConfigurationError extends Error {
  constructor() {
    super('Family invitation issuance is not configured.');
    this.name = 'FamilyInvitationIssuerConfigurationError';
  }
}

function requiredEnvironmentValue(name: string, maximumLength: number) {
  const value = process.env[name]?.trim();
  if (!value || value.length > maximumLength) {
    throw new FamilyInvitationIssuerConfigurationError();
  }
  return value;
}

function decodeJwtSegment(segment: string) {
  if (!/^[A-Za-z0-9_-]+$/u.test(segment)) {
    throw new FamilyInvitationIssuerConfigurationError();
  }
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  } catch {
    throw new FamilyInvitationIssuerConfigurationError();
  }
}

function invitationIssuerCredential() {
  const token = requiredEnvironmentValue(
    'FAMILY_INVITATION_ISSUER_JWT',
    8_192,
  );
  const segments = token.split('.');
  if (segments.length !== 3 || segments.some((segment) => !segment)) {
    throw new FamilyInvitationIssuerConfigurationError();
  }
  const header = jwtHeaderSchema.safeParse(decodeJwtSegment(segments[0]));
  const claims = issuerClaimsSchema.safeParse(decodeJwtSegment(segments[1]));
  if (!header.success || !claims.success) {
    throw new FamilyInvitationIssuerConfigurationError();
  }

  const expectedIssuer = requiredEnvironmentValue(
    'FAMILY_INVITATION_ISSUER_JWT_ISSUER',
    2_048,
  );
  const expectedAudience = requiredEnvironmentValue(
    'FAMILY_INVITATION_ISSUER_JWT_AUDIENCE',
    255,
  );
  const now = Math.floor(Date.now() / 1_000);
  if (
    claims.data.iss !== expectedIssuer
    || claims.data.aud !== expectedAudience
    || claims.data.iat > now + 5
    || claims.data.nbf > now + 5
    || claims.data.nbf < claims.data.iat - 30
    || claims.data.exp - claims.data.iat > MAX_JWT_LIFETIME_SECONDS
    || claims.data.exp <= now + MIN_REMAINING_JWT_LIFETIME_SECONDS
  ) throw new FamilyInvitationIssuerConfigurationError();
  return token;
}

function issuerEndpoint(functionName: string) {
  const configured = requiredEnvironmentValue('NEXT_PUBLIC_SUPABASE_URL', 2_048);
  let baseUrl: URL;
  try {
    baseUrl = new URL(configured);
  } catch {
    throw new FamilyInvitationIssuerConfigurationError();
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
  ) throw new FamilyInvitationIssuerConfigurationError();
  return new URL(`/rest/v1/rpc/${functionName}`, baseUrl);
}

/**
 * Server-only, non-secret readiness probe for rendering invitation controls.
 * It deliberately applies the same URL, publishable-key, and short-lived JWT
 * preflight as the mutation path; a token near expiry is therefore not ready.
 */
export function isFamilyInvitationIssuerConfigurationReady() {
  try {
    issuerEndpoint('create_guardian_invitation_v1');
    requiredEnvironmentValue('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 8_192);
    invitationIssuerCredential();
    return true;
  } catch {
    return false;
  }
}

async function callInvitationIssuer(
  functionName: 'create_guardian_invitation_v1'
    | 'resend_guardian_invitation_v1',
  body: Readonly<Record<string, unknown>>,
): Promise<FamilyInvitationReceipt> {
  const response = await fetch(issuerEndpoint(functionName), {
    body: JSON.stringify(body),
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      apikey: requiredEnvironmentValue(
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
        8_192,
      ),
      Authorization: `Bearer ${invitationIssuerCredential()}`,
      'Content-Type': 'application/json',
      'X-Client-Info': 'help-math-family-invitation-issuer/v1',
    },
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(7_000),
  });
  if (response.status !== 200) {
    throw new Error('Could not issue guardian invitation.');
  }
  const serialized = await response.text();
  if (!serialized || serialized.length > 4_096) {
    throw new Error('Could not issue guardian invitation.');
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(serialized);
  } catch {
    throw new Error('Could not issue guardian invitation.');
  }
  const receipt = receiptSchema.safeParse(decoded);
  if (!receipt.success) throw new Error('Could not issue guardian invitation.');
  return {
    expiresAt: receipt.data.expires_at,
    invitationId: receipt.data.invitation_id,
  };
}

/**
 * Consumes a one-use database attestation through a custom PostgREST role.
 * The token is externally provisioned and short-lived; this module has no
 * service-role credential and no project signing private key.
 */
export async function issueGuardianInvitation(input: Readonly<{
  attestationId: string;
  emailCiphertext: string;
  emailDigest: string;
  encryptedOutboxToken: string;
  expiresAt: string;
  idempotencyKey: string;
  invitationId: string;
  studentId: string;
  tokenDigest: string;
}>) {
  const parsed = createInputSchema.parse(input);
  return callInvitationIssuer('create_guardian_invitation_v1', {
    p_attestation_id: parsed.attestationId,
    p_email_ciphertext: parsed.emailCiphertext,
    p_email_digest: parsed.emailDigest,
    p_encrypted_outbox_token: parsed.encryptedOutboxToken,
    p_expires_at: parsed.expiresAt,
    p_idempotency_key: parsed.idempotencyKey,
    p_invitation_id: parsed.invitationId,
    p_student_id: parsed.studentId,
    p_token_digest: parsed.tokenDigest,
  });
}

export async function reissueGuardianInvitation(input: Readonly<{
  attestationId: string;
  encryptedOutboxToken: string;
  expiresAt: string;
  idempotencyKey: string;
  invitationId: string;
  tokenDigest: string;
}>) {
  const parsed = resendInputSchema.parse(input);
  return callInvitationIssuer('resend_guardian_invitation_v1', {
    p_attestation_id: parsed.attestationId,
    p_encrypted_outbox_token: parsed.encryptedOutboxToken,
    p_expires_at: parsed.expiresAt,
    p_idempotency_key: parsed.idempotencyKey,
    p_invitation_id: parsed.invitationId,
    p_token_digest: parsed.tokenDigest,
  });
}
