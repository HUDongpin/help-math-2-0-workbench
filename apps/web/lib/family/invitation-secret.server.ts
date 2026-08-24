import 'server-only';

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

const CURRENT_ENCRYPTION_VERSION = 'v2';
const LEGACY_ENCRYPTION_VERSION = 'v1';
const KEY_ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/u;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/u;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const EMAIL_DIGEST_PATTERN = /^[0-9a-f]{64}$/u;
const MAX_KEYRING_KEYS = 8;

type FamilySecretPurpose =
  | 'family_email_destination'
  | 'guardian_invitation_token';

interface EncryptionContext {
  purpose: FamilySecretPurpose;
  recordId: string;
  recordType: 'invitation' | 'recipient_email_digest';
  tenantId: string;
}

export interface FamilyEmailEncryptionContext {
  recipientEmailDigest: string;
  tenantId: string;
}

export interface InvitationTokenEncryptionContext {
  invitationId?: string;
  tenantId: string;
}

class FamilySecretConfigurationError extends Error {
  constructor() {
    super('Family invitation encryption is not configured.');
    this.name = 'FamilySecretConfigurationError';
  }
}

function decodeKey(encoded: string) {
  if (!BASE64URL_PATTERN.test(encoded)) {
    throw new FamilySecretConfigurationError();
  }
  const key = Buffer.from(encoded, 'base64url');
  if (key.length !== 32 || key.toString('base64url') !== encoded) {
    throw new FamilySecretConfigurationError();
  }
  return key;
}

function invitationEncryptionKeyring() {
  const serialized = process.env.FAMILY_OUTBOX_ENCRYPTION_KEYRING?.trim();
  const activeKeyId = process.env.FAMILY_OUTBOX_ENCRYPTION_ACTIVE_KEY_ID?.trim();
  if (
    !serialized
    || serialized.length > 16_384
    || !activeKeyId
    || !KEY_ID_PATTERN.test(activeKeyId)
  ) throw new FamilySecretConfigurationError();

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new FamilySecretConfigurationError();
  }
  if (
    !parsed
    || typeof parsed !== 'object'
    || Array.isArray(parsed)
    || Object.getPrototypeOf(parsed) !== Object.prototype
  ) throw new FamilySecretConfigurationError();

  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.length < 1 || entries.length > MAX_KEYRING_KEYS) {
    throw new FamilySecretConfigurationError();
  }
  const keys = new Map<string, Buffer>();
  for (const [keyId, encoded] of entries) {
    if (
      !KEY_ID_PATTERN.test(keyId)
      || typeof encoded !== 'string'
      || keys.has(keyId)
    ) throw new FamilySecretConfigurationError();
    keys.set(keyId, decodeKey(encoded));
  }
  if (!keys.has(activeKeyId)) throw new FamilySecretConfigurationError();
  return {activeKeyId, keys};
}

function familyEmailDigestKey() {
  const encoded = process.env.FAMILY_EMAIL_DIGEST_KEY?.trim();
  if (!encoded) throw new Error('Family email digest is not configured.');
  return decodeKey(encoded);
}

function normalizeTenantId(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new Error('Invalid family encryption context.');
  }
  return normalized;
}

function normalizedContext(context: EncryptionContext) {
  const tenantId = normalizeTenantId(context.tenantId);
  const recordId = context.recordId.trim().toLowerCase();
  const recordIsValid = context.recordType === 'invitation'
    ? UUID_PATTERN.test(recordId)
    : EMAIL_DIGEST_PATTERN.test(recordId);
  if (!recordIsValid) throw new Error('Invalid family encryption context.');
  return {...context, recordId, tenantId};
}

function purposeKey(masterKey: Buffer, purpose: FamilySecretPurpose) {
  return Buffer.from(hkdfSync(
    'sha256',
    masterKey,
    Buffer.from('help-math-family-outbox-v2', 'utf8'),
    Buffer.from(`purpose:${purpose}`, 'utf8'),
    32,
  ));
}

function additionalAuthenticatedData(
  keyId: string,
  context: EncryptionContext,
) {
  const normalized = normalizedContext(context);
  return Buffer.from([
    'help-math-family-secret',
    CURRENT_ENCRYPTION_VERSION,
    keyId,
    normalized.purpose,
    normalized.tenantId,
    normalized.recordType,
    normalized.recordId,
  ].join('\u0000'), 'utf8');
}

function encryptFamilySecret(value: string, context: EncryptionContext) {
  if (!value) throw new Error('Invalid family secret.');
  const {activeKeyId, keys} = invitationEncryptionKeyring();
  const masterKey = keys.get(activeKeyId);
  if (!masterKey) throw new FamilySecretConfigurationError();
  const iv = randomBytes(12);
  const plaintext = Buffer.from(value, 'utf8');
  const cipher = createCipheriv(
    'aes-256-gcm',
    purposeKey(masterKey, context.purpose),
    iv,
  );
  cipher.setAAD(additionalAuthenticatedData(activeKeyId, context), {
    plaintextLength: plaintext.length,
  });
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    CURRENT_ENCRYPTION_VERSION,
    activeKeyId,
    iv.toString('base64url'),
    encrypted.toString('base64url'),
    tag.toString('base64url'),
  ].join('.');
}

function decryptCurrentFamilySecret(
  ciphertext: string,
  context: EncryptionContext,
) {
  const [version, keyId, encodedIv, encodedCiphertext, encodedTag, extra] =
    ciphertext.split('.');
  if (
    version !== CURRENT_ENCRYPTION_VERSION
    || !keyId
    || !KEY_ID_PATTERN.test(keyId)
    || !encodedIv
    || !encodedCiphertext
    || !encodedTag
    || extra !== undefined
  ) throw new Error('Invalid encrypted family secret.');

  const {keys} = invitationEncryptionKeyring();
  const masterKey = keys.get(keyId);
  if (!masterKey) throw new Error('Invalid encrypted family secret.');
  const iv = Buffer.from(encodedIv, 'base64url');
  const encrypted = Buffer.from(encodedCiphertext, 'base64url');
  const tag = Buffer.from(encodedTag, 'base64url');
  if (
    iv.length !== 12
    || tag.length !== 16
    || encrypted.length === 0
    || iv.toString('base64url') !== encodedIv
    || encrypted.toString('base64url') !== encodedCiphertext
    || tag.toString('base64url') !== encodedTag
  ) throw new Error('Invalid encrypted family secret.');

  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      purposeKey(masterKey, context.purpose),
      iv,
    );
    decipher.setAAD(additionalAuthenticatedData(keyId, context), {
      plaintextLength: encrypted.length,
    });
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new Error('Invalid encrypted family secret.');
  }
}

function decryptLegacyFamilySecret(ciphertext: string) {
  if (process.env.FAMILY_OUTBOX_LEGACY_V1_READ_ENABLED !== 'true') {
    throw new Error('Legacy family ciphertext is disabled.');
  }
  const encodedKey = process.env.FAMILY_OUTBOX_LEGACY_V1_READ_KEY?.trim();
  if (!encodedKey) throw new FamilySecretConfigurationError();
  const [version, encodedIv, encodedCiphertext, encodedTag, extra] =
    ciphertext.split('.');
  if (
    version !== LEGACY_ENCRYPTION_VERSION
    || !encodedIv
    || !encodedCiphertext
    || !encodedTag
    || extra !== undefined
  ) throw new Error('Invalid encrypted family secret.');
  const iv = Buffer.from(encodedIv, 'base64url');
  const encrypted = Buffer.from(encodedCiphertext, 'base64url');
  const tag = Buffer.from(encodedTag, 'base64url');
  if (iv.length !== 12 || tag.length !== 16 || encrypted.length === 0) {
    throw new Error('Invalid encrypted family secret.');
  }
  try {
    const decipher = createDecipheriv('aes-256-gcm', decodeKey(encodedKey), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new Error('Invalid encrypted family secret.');
  }
}

function decryptFamilySecret(
  ciphertext: string,
  context: EncryptionContext | null,
) {
  if (ciphertext.startsWith(`${CURRENT_ENCRYPTION_VERSION}.`)) {
    if (!context) throw new Error('Invalid family encryption context.');
    return decryptCurrentFamilySecret(ciphertext, context);
  }
  if (ciphertext.startsWith(`${LEGACY_ENCRYPTION_VERSION}.`)) {
    return decryptLegacyFamilySecret(ciphertext);
  }
  throw new Error('Invalid encrypted family secret.');
}

function emailContext(context: FamilyEmailEncryptionContext): EncryptionContext {
  return {
    purpose: 'family_email_destination',
    recordId: context.recipientEmailDigest,
    recordType: 'recipient_email_digest',
    tenantId: context.tenantId,
  };
}

function tokenContext(
  context: InvitationTokenEncryptionContext,
): EncryptionContext | null {
  if (!context.invitationId) return null;
  return {
    purpose: 'guardian_invitation_token',
    recordId: context.invitationId,
    recordType: 'invitation',
    tenantId: context.tenantId,
  };
}

export function createGuardianInvitationToken() {
  return randomBytes(32).toString('base64url');
}

export function digestGuardianInvitationToken(token: string) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function digestGuardianInvitationEmail(email: string) {
  return createHmac('sha256', familyEmailDigestKey())
    .update(email.trim().toLowerCase(), 'utf8')
    .digest('hex');
}

export function encryptInvitationTokenForOutbox(
  token: string,
  context: Required<InvitationTokenEncryptionContext>,
) {
  const boundContext = tokenContext(context);
  if (!boundContext) throw new Error('Invalid family encryption context.');
  return encryptFamilySecret(token, boundContext);
}

export function decryptInvitationTokenFromOutbox(
  ciphertext: string,
  context: InvitationTokenEncryptionContext,
) {
  return decryptFamilySecret(ciphertext, tokenContext(context));
}

export function encryptFamilyEmailForStorage(
  email: string,
  context: FamilyEmailEncryptionContext,
) {
  return encryptFamilySecret(email.trim().toLowerCase(), emailContext(context));
}

export function decryptFamilyEmailFromStorage(
  ciphertext: string,
  context: FamilyEmailEncryptionContext,
) {
  return decryptFamilySecret(ciphertext, emailContext(context));
}
