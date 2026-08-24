export const FAMILY_PRODUCTION_EXTERNAL_GATES = [
  'hosted_supabase_project_verified',
  'resend_domain_and_webhook_verified',
  'independent_security_accepted',
  'independent_accessibility_accepted',
  'privacy_legal_dpa_approved',
  'district_authorized',
  'owner_accepted',
  'deployment_authorized',
  'production_verified',
] as const;

export type FamilyProductionExternalGate =
  (typeof FAMILY_PRODUCTION_EXTERNAL_GATES)[number];

export type FamilyProductionConfigurationEnvironment = Readonly<
  Record<string, string | undefined>
>;

export interface FamilyProductionConfigurationCheck {
  id: string;
  passed: boolean;
  requirement: string;
}

export interface FamilyProductionConfigurationReport {
  checkedAt: string;
  checks: FamilyProductionConfigurationCheck[];
  configurationReady: boolean;
  disposition:
    | 'CONFIGURATION_NOT_READY'
    | 'CONFIGURATION_READY_NOT_RELEASE_APPROVED';
  externalGates: readonly FamilyProductionExternalGate[];
  productionReleaseBindingCount: number;
  releaseApproved: false;
  secretValuesIncluded: false;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const KEY_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/u;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/u;
const FROM_EMAIL_PATTERN =
  /^(?:[^<>\r\n]{1,80}\s+<)?([a-z0-9.!#$%&'*+/=?^_`{|}~-]+@([a-z0-9.-]+))>?$/iu;

function exactTrue(value: string | undefined) {
  return value === 'true';
}

function exactFalse(value: string | undefined) {
  return value === 'false';
}

function boundedValue(
  value: string | undefined,
  minimumLength: number,
  maximumLength: number,
) {
  const normalized = value?.trim();
  return Boolean(
    normalized
    && normalized.length >= minimumLength
    && normalized.length <= maximumLength,
  );
}

function safeJsonObject(value: string | undefined) {
  if (!value || value.length > 32_768) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function canonicalKeyBytes(value: unknown) {
  if (typeof value !== 'string' || !BASE64URL_PATTERN.test(value)) return null;
  try {
    const decoded = Buffer.from(value, 'base64url');
    return decoded.length === 32 && decoded.toString('base64url') === value
      ? decoded
      : null;
  } catch {
    return null;
  }
}

function exactHttpsOrigin(value: string | undefined) {
  try {
    const url = new URL(value ?? '');
    if (
      url.protocol !== 'https:'
      || url.pathname !== '/'
      || url.search
      || url.hash
      || url.username
      || url.password
    ) return null;
    return url;
  } catch {
    return null;
  }
}

function decodeJwtPart(value: string) {
  if (!BASE64URL_PATTERN.test(value)) return null;
  try {
    return safeJsonObject(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function productionRoleJwtIsReady(
  token: string | undefined,
  environment: FamilyProductionConfigurationEnvironment,
  nowEpochSeconds: number,
  kind: 'issuer' | 'writer',
) {
  if (!token || token.length > 8_192) return false;
  const parts = token.split('.');
  if (
    parts.length !== 3
    || parts.some((part) => !part || !BASE64URL_PATTERN.test(part))
  ) return false;
  const header = decodeJwtPart(parts[0]);
  const claims = decodeJwtPart(parts[1]);
  if (!header || !claims) return false;
  const expectedRole = kind === 'issuer'
    ? 'family_invitation_issuer'
    : 'family_webhook_writer';
  const expectedIssuer = environment[
    kind === 'issuer'
      ? 'FAMILY_INVITATION_ISSUER_JWT_ISSUER'
      : 'FAMILY_WEBHOOK_WRITER_JWT_ISSUER'
  ]?.trim();
  const expectedAudience = environment[
    kind === 'issuer'
      ? 'FAMILY_INVITATION_ISSUER_JWT_AUDIENCE'
      : 'FAMILY_WEBHOOK_WRITER_JWT_AUDIENCE'
  ]?.trim();
  const iat = claims.iat;
  const nbf = claims.nbf;
  const exp = claims.exp;
  return header.alg === 'ES256'
    && header.typ === 'JWT'
    && typeof header.kid === 'string'
    && header.kid.length >= 1
    && header.kid.length <= 128
    && claims.role === expectedRole
    && claims.sub === expectedRole
    && claims.iss === expectedIssuer
    && claims.iss === environment.FAMILY_SUPABASE_AUTH_ISSUER?.trim()
    && claims.aud === expectedAudience
    && expectedAudience === 'authenticated'
    && typeof iat === 'number'
    && Number.isInteger(iat)
    && typeof nbf === 'number'
    && Number.isInteger(nbf)
    && typeof exp === 'number'
    && Number.isInteger(exp)
    && iat <= nowEpochSeconds + 5
    && nbf <= nowEpochSeconds + 5
    && nbf >= iat - 30
    && exp - iat <= 300
    && exp > nowEpochSeconds + 10
    && (
      kind === 'writer'
      || (
        claims.family_purpose === 'family_invitation_issue_v1'
        && typeof claims.jti === 'string'
        && UUID_PATTERN.test(claims.jti)
      )
    );
}

function encryptionConfigurationIsReady(
  environment: FamilyProductionConfigurationEnvironment,
) {
  const keyring = safeJsonObject(
    environment.FAMILY_OUTBOX_ENCRYPTION_KEYRING,
  );
  const activeKeyId =
    environment.FAMILY_OUTBOX_ENCRYPTION_ACTIVE_KEY_ID?.trim();
  if (!keyring || !activeKeyId || !KEY_ID_PATTERN.test(activeKeyId)) {
    return false;
  }
  const entries = Object.entries(keyring);
  if (entries.length < 1 || entries.length > 8 || !(activeKeyId in keyring)) {
    return false;
  }
  const fingerprints = new Set<string>();
  for (const [keyId, encoded] of entries) {
    const bytes = canonicalKeyBytes(encoded);
    if (!KEY_ID_PATTERN.test(keyId) || !bytes) return false;
    const fingerprint = bytes.toString('hex');
    if (fingerprints.has(fingerprint)) return false;
    fingerprints.add(fingerprint);
  }
  const digestBytes = canonicalKeyBytes(environment.FAMILY_EMAIL_DIGEST_KEY);
  return Boolean(
    digestBytes
    && !fingerprints.has(digestBytes.toString('hex'))
    && exactFalse(environment.FAMILY_OUTBOX_LEGACY_V1_READ_ENABLED)
    && !environment.FAMILY_OUTBOX_LEGACY_V1_READ_KEY?.trim(),
  );
}

function purposeSeparatedSecretsAreReady(
  environment: FamilyProductionConfigurationEnvironment,
) {
  const keyring = safeJsonObject(
    environment.FAMILY_OUTBOX_ENCRYPTION_KEYRING,
  );
  if (!keyring) return false;
  const keyringValues = Object.values(keyring);
  if (keyringValues.some((value) => typeof value !== 'string')) return false;
  const rawValues = [
    environment.SUPABASE_SERVICE_ROLE_KEY,
    environment.RESEND_API_KEY,
    environment.RESEND_WEBHOOK_SECRET,
    environment.CRON_SECRET,
    environment.FAMILY_INVITATION_ISSUER_JWT,
    environment.FAMILY_WEBHOOK_WRITER_JWT,
    environment.FAMILY_EMAIL_DIGEST_KEY,
    ...(keyringValues as string[]),
  ];
  const values = rawValues.map((value) => value?.trim());
  return values.every((value): value is string => Boolean(value))
    && new Set(values).size === values.length;
}

function fromEmailMatchesSite(
  fromValue: string | undefined,
  siteUrl: URL | null,
) {
  const match = fromValue?.trim().match(FROM_EMAIL_PATTERN);
  if (!match || !siteUrl) return false;
  const fromDomain = match[2].toLowerCase();
  const siteHost = siteUrl.hostname.toLowerCase();
  return siteHost === fromDomain || siteHost.endsWith(`.${fromDomain}`);
}

function addCheck(
  checks: FamilyProductionConfigurationCheck[],
  id: string,
  passed: boolean,
  requirement: string,
) {
  checks.push({id, passed, requirement});
}

/**
 * Performs a redacted, network-free production-shape check. Passing this
 * function proves only that the supplied configuration has a safe shape. It
 * never verifies token signatures, managed-secret custody, a hosted database,
 * a provider domain, human approval, deployment or production behavior.
 */
export function inspectFamilyProductionConfiguration(
  environment: FamilyProductionConfigurationEnvironment,
  options: Readonly<{
    now?: Date;
    productionReleaseBindingCount: number;
  }>,
): FamilyProductionConfigurationReport {
  const checks: FamilyProductionConfigurationCheck[] = [];
  const now = options.now ?? new Date();
  const nowEpochSeconds = Math.floor(now.getTime() / 1_000);
  const siteUrl = exactHttpsOrigin(environment.NEXT_PUBLIC_SITE_URL);
  const supabaseUrl = exactHttpsOrigin(environment.NEXT_PUBLIC_SUPABASE_URL);
  const expectedIssuer = supabaseUrl
    ? `${supabaseUrl.origin}/auth/v1`
    : null;

  addCheck(checks, 'production-runtime', environment.NODE_ENV === 'production',
    'NODE_ENV must be production.');
  addCheck(checks, 'canonical-site-url', Boolean(
    siteUrl
    && (
      siteUrl.hostname === 'helpmath.ai'
      || siteUrl.hostname.endsWith('.helpmath.ai')
    )
  ), 'NEXT_PUBLIC_SITE_URL must be a canonical HTTPS HELP Math origin.');
  addCheck(checks, 'family-feature-envelope',
    exactTrue(environment.FAMILY_PORTAL_ENABLED)
      && exactTrue(environment.FAMILY_MESSAGING_ENABLED)
      && exactTrue(environment.FAMILY_EMAIL_NOTIFICATIONS_ENABLED)
      && exactFalse(environment.FAMILY_SYNTHETIC_DEMO_ENABLED),
    'Portal, Messaging and Email must be explicitly enabled while the synthetic demo remains off.');
  addCheck(checks, 'production-learning-event-boundary',
    options.productionReleaseBindingCount === 0
      ? exactFalse(environment.FAMILY_LEARNING_EVENTS_V2_ENABLED)
      : exactTrue(environment.FAMILY_LEARNING_EVENTS_V2_ENABLED),
    'The LearningEventV2 switch must match the independently declared production release-binding set.');
  addCheck(checks, 'supabase-auth-cutover',
    environment.FAMILY_AUTH_PROVIDER === 'supabase'
      && exactTrue(environment.FAMILY_SUPABASE_AUTH_CUTOVER_ENABLED)
      && environment.FAMILY_SUPABASE_AUTH_AUDIENCE === 'authenticated'
      && environment.FAMILY_SUPABASE_AUTH_ISSUER === expectedIssuer
      && Boolean(
        supabaseUrl
        && supabaseUrl.hostname.endsWith('.supabase.co')
        && boundedValue(
          environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
          16,
          8_192,
        )
      ),
    'Supabase Auth must be the exclusive production provider with an exact HTTPS issuer and authenticated audience.');
  addCheck(checks, 'service-worker-credential',
    boundedValue(environment.SUPABASE_SERVICE_ROLE_KEY, 20, 8_192)
      && environment.SUPABASE_SERVICE_ROLE_KEY?.trim()
        !== environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
    'The cron-only service credential must be present and distinct from the publishable key.');
  addCheck(checks, 'production-recipient-policy',
    environment.FAMILY_INVITATION_RECIPIENT_POLICY
      === 'school-verified-production'
      && exactTrue(environment.FAMILY_PRODUCTION_INVITATIONS_ENABLED),
    'Production invitations require the school-verified recipient policy and its explicit enablement.');
  addCheck(checks, 'resend-transport',
    environment.FAMILY_EMAIL_TRANSPORT === 'resend'
      && boundedValue(environment.RESEND_API_KEY, 20, 512)
      && environment.RESEND_API_KEY?.trim().startsWith('re_') === true
      && boundedValue(environment.RESEND_WEBHOOK_SECRET, 20, 512)
      && fromEmailMatchesSite(environment.FAMILY_FROM_EMAIL, siteUrl),
    'Production delivery requires explicit Resend credentials, a webhook secret and a HELP Math From domain.');
  addCheck(checks, 'cron-secret',
    boundedValue(environment.CRON_SECRET, 32, 512)
      && environment.CRON_SECRET?.trim()
        !== environment.RESEND_WEBHOOK_SECRET?.trim(),
    'CRON_SECRET must be a distinct bounded server-only secret.');
  addCheck(checks, 'invitation-issuer-jwt',
    productionRoleJwtIsReady(
      environment.FAMILY_INVITATION_ISSUER_JWT,
      environment,
      nowEpochSeconds,
      'issuer',
    ),
    'The invitation issuer must use a fresh externally signed ES256 role JWT with the exact issuer, audience and purpose.');
  addCheck(checks, 'webhook-writer-jwt',
    productionRoleJwtIsReady(
      environment.FAMILY_WEBHOOK_WRITER_JWT,
      environment,
      nowEpochSeconds,
      'writer',
    ),
    'The webhook writer must use a fresh externally signed ES256 role JWT with the exact issuer and audience.');
  addCheck(checks, 'separate-role-jwts',
    Boolean(
      environment.FAMILY_INVITATION_ISSUER_JWT
      && environment.FAMILY_WEBHOOK_WRITER_JWT
      && environment.FAMILY_INVITATION_ISSUER_JWT
        !== environment.FAMILY_WEBHOOK_WRITER_JWT,
    ), 'Invitation and webhook capabilities must use distinct bearer tokens.');
  addCheck(checks, 'encryption-keyring',
    encryptionConfigurationIsReady(environment),
    'The v2 encryption keyring, active key and separate digest key must be canonical and legacy reads must be off.');
  addCheck(checks, 'purpose-separated-secrets',
    purposeSeparatedSecretsAreReady(environment),
    'Service, provider, cron, capability, digest and encryption secrets must remain purpose-separated.');

  const configurationReady = checks.every((check) => check.passed);
  return {
    checkedAt: now.toISOString(),
    checks,
    configurationReady,
    disposition: configurationReady
      ? 'CONFIGURATION_READY_NOT_RELEASE_APPROVED'
      : 'CONFIGURATION_NOT_READY',
    externalGates: FAMILY_PRODUCTION_EXTERNAL_GATES,
    productionReleaseBindingCount: options.productionReleaseBindingCount,
    releaseApproved: false,
    secretValuesIncluded: false,
  };
}
