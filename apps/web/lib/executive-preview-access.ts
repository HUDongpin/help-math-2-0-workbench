import executivePreviewWindow from '../config/executive-preview-window.json';

export const EXECUTIVE_PREVIEW_COOKIE_NAME = 'helpmath_executive_preview';
export const EXECUTIVE_PREVIEW_SESSION_TTL_SECONDS = 12 * 60 * 60;
export const EXECUTIVE_PREVIEW_SESSION_TTL_MS =
  EXECUTIVE_PREVIEW_SESSION_TTL_SECONDS * 1_000;
export const EXECUTIVE_PREVIEW_PRODUCTION_EXPIRY_CEILING =
  executivePreviewWindow.maximumExpiresAt;

const EXECUTIVE_PREVIEW_PRODUCTION_EXPIRY_CEILING_MS = Date.parse(
  EXECUTIVE_PREVIEW_PRODUCTION_EXPIRY_CEILING,
);
const SESSION_VERSION = 'v1';
const MIN_CREDENTIAL_LENGTH = 32;
const MAX_CREDENTIAL_LENGTH = 128;
const MIN_UNIQUE_CREDENTIAL_CHARACTERS = 12;
const BASE64URL_CREDENTIAL = /^[A-Za-z0-9_-]+$/u;
const ISO_TIMESTAMP_WITH_TIMEZONE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/u;

const englishReviewPaths = executivePreviewWindow.reviewItems.map(
  (item) => item.path,
);
const localizedReviewPaths = englishReviewPaths.flatMap((route) => [
  route,
  `/en${route}`,
  `/es${route}`,
]);
const reviewPathSet = new Set(localizedReviewPaths);
const additionalProtectedPathSet = new Set([
  '/executive-preview/g5-l4',
  '/en/executive-preview/g5-l4',
  '/es/executive-preview/g5-l4',
]);

export interface ExecutivePreviewConfig {
  readonly accessKey: string;
  readonly sessionSecret: string;
  readonly expiresAt: number;
}

type ExecutivePreviewEnvironment = Readonly<Record<string, string | undefined>>;

const textEncoder = new TextEncoder();

function isStrongBase64UrlCredential(value: string, minimumLength: number) {
  return value.length >= minimumLength
    && value.length <= MAX_CREDENTIAL_LENGTH
    && value.trim() === value
    && BASE64URL_CREDENTIAL.test(value)
    && new Set(value).size >= MIN_UNIQUE_CREDENTIAL_CHARACTERS;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function equalBytes(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index]! ^ right[index]!;
  }
  return difference === 0;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(value));
  return new Uint8Array(digest);
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(value));
  return new Uint8Array(signature);
}

export function getExecutivePreviewConfig(
  env: ExecutivePreviewEnvironment = process.env,
  now = Date.now(),
): ExecutivePreviewConfig | undefined {
  if (env.EXECUTIVE_PREVIEW_ENABLED !== 'true' || !Number.isFinite(now)) {
    return undefined;
  }

  const accessKey = env.EXECUTIVE_PREVIEW_ACCESS_KEY;
  const sessionSecret = env.EXECUTIVE_PREVIEW_SESSION_SECRET;
  const expiresAtValue = env.EXECUTIVE_PREVIEW_EXPIRES_AT;
  if (!accessKey || !isStrongBase64UrlCredential(accessKey, MIN_CREDENTIAL_LENGTH)) {
    return undefined;
  }
  if (
    !sessionSecret
    || !isStrongBase64UrlCredential(sessionSecret, MIN_CREDENTIAL_LENGTH)
    || sessionSecret === accessKey
  ) {
    return undefined;
  }
  if (!expiresAtValue || !ISO_TIMESTAMP_WITH_TIMEZONE.test(expiresAtValue)) {
    return undefined;
  }

  const expiresAt = Date.parse(expiresAtValue);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return undefined;
  if (
    env.VERCEL_ENV !== 'development'
    && (
      !Number.isFinite(EXECUTIVE_PREVIEW_PRODUCTION_EXPIRY_CEILING_MS)
      || expiresAt > EXECUTIVE_PREVIEW_PRODUCTION_EXPIRY_CEILING_MS
    )
  ) {
    return undefined;
  }
  return {accessKey, sessionSecret, expiresAt};
}

export function isExecutivePreviewEnabled(
  env: ExecutivePreviewEnvironment = process.env,
  now = Date.now(),
) {
  return getExecutivePreviewConfig(env, now) !== undefined;
}

export async function verifyExecutivePreviewAccessKey(
  candidate: string,
  config: ExecutivePreviewConfig,
) {
  const [candidateDigest, expectedDigest] = await Promise.all([
    sha256(candidate),
    sha256(config.accessKey),
  ]);
  return equalBytes(candidateDigest, expectedDigest);
}

export async function createExecutivePreviewSession(
  config: ExecutivePreviewConfig,
  now = Date.now(),
) {
  if (!Number.isFinite(now) || now >= config.expiresAt) {
    throw new Error('Executive preview access is expired.');
  }
  const expiry = Math.floor(
    Math.min(now + EXECUTIVE_PREVIEW_SESSION_TTL_MS, config.expiresAt) / 1_000,
  );
  const payload = `${SESSION_VERSION}.${expiry}`;
  const signature = bytesToBase64Url(await sign(payload, config.sessionSecret));
  return `${payload}.${signature}`;
}

export async function verifyExecutivePreviewSession(
  token: string | null | undefined,
  config: ExecutivePreviewConfig,
  now = Date.now(),
) {
  if (!token || !Number.isFinite(now) || now >= config.expiresAt) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== SESSION_VERSION) return false;

  const expiryText = parts[1]!;
  const suppliedSignature = parts[2]!;
  if (!/^\d+$/u.test(expiryText) || !/^[A-Za-z0-9_-]{43}$/u.test(suppliedSignature)) {
    return false;
  }
  const expiry = Number(expiryText);
  const globalExpiry = Math.floor(config.expiresAt / 1_000);
  const currentTime = Math.floor(now / 1_000);
  if (
    !Number.isSafeInteger(expiry)
    || String(expiry) !== expiryText
    || expiry <= currentTime
    || expiry > globalExpiry
  ) {
    return false;
  }

  const expectedSignature = bytesToBase64Url(
    await sign(`${SESSION_VERSION}.${expiryText}`, config.sessionSecret),
  );
  return equalBytes(
    textEncoder.encode(suppliedSignature),
    textEncoder.encode(expectedSignature),
  );
}

export function isExecutivePreviewReviewPath(pathname: string) {
  return reviewPathSet.has(pathname) || additionalProtectedPathSet.has(pathname);
}

export function isExecutivePreviewAssetPath(pathname: string) {
  return pathname.startsWith('/flash-assets/')
    && pathname.length > '/flash-assets/'.length;
}

export function isExecutivePreviewProtectedPath(pathname: string) {
  return isExecutivePreviewReviewPath(pathname)
    || isExecutivePreviewAssetPath(pathname);
}

export function isAllowedExecutiveReturnTo(value: string | null | undefined) {
  return typeof value === 'string' && isExecutivePreviewReviewPath(value);
}

export function getExecutivePreviewReturnTo(
  value: string | null | undefined,
  locale: 'en' | 'es' = 'en',
) {
  if (typeof value === 'string' && isAllowedExecutiveReturnTo(value)) {
    const englishPath = value.replace(/^\/(?:en|es)(?=\/)/u, '');
    return locale === 'es' ? `/es${englishPath}` : englishPath;
  }
  return locale === 'es' ? '/es/executive-preview' : '/executive-preview';
}

export const executivePreviewReviewItems = executivePreviewWindow.reviewItems;
