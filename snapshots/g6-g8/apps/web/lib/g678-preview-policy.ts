/**
 * Edge-safe policy helpers for the G6-G8 shared engineering-preview surface.
 * Keep this module free of `server-only` and filesystem imports because the
 * request proxy bundles it for middleware execution.
 */

export type G678PreviewEnvironment = Readonly<Record<string, string | undefined>>;

export const G678_MODULE_CODE_PATTERN = /^[A-Z]{3}\d{3}$/iu;
export const G678_MODULE_CODES = Object.freeze([
  'NMS002',
  'GEO001',
  'ALG001',
  'DAT001',
] as const);

export function isG678ModuleCode(value: string): boolean {
  return G678_MODULE_CODE_PATTERN.test(value) &&
    G678_MODULE_CODES.includes(value.toUpperCase() as (typeof G678_MODULE_CODES)[number]);
}

/** Direct references are locked by Next's DefinePlugin in compiled output.
 * Cloud/bind/opt-in values still come from the actual serving environment. */
function compiledPreviewEnvironment(): G678PreviewEnvironment {
  return {...process.env,
    NODE_ENV: process.env.NODE_ENV,
    HELP_MATH_G678_COMPILED_LOCAL_QA: process.env.HELP_MATH_G678_COMPILED_LOCAL_QA,
  };
}

/** Existing access wrappers pass their default raw process.env explicitly. */
function previewEnvironment(env: G678PreviewEnvironment): G678PreviewEnvironment {
  return env === process.env ? compiledPreviewEnvironment() : env;
}

/** Separate from a deployable production build: explicit compiled loopback QA. */
export function isG678CompiledLocalQaEnabled(
  env: G678PreviewEnvironment = compiledPreviewEnvironment(),
): boolean {
  env = previewEnvironment(env);
  return env.NODE_ENV === 'production' &&
    env.HELP_MATH_G678_COMPILED_LOCAL_QA === '1' &&
    !env.VERCEL && !env.VERCEL_ENV &&
    env.HELP_MATH_G678_LOCAL_PREVIEW_BIND === '127.0.0.1' &&
    (env.HELP_MATH_G678_LOCAL_PREVIEW === '1' || env.HELP_MATH_G678_LOCAL_PREVIEW === 'true');
}

/** Reject a requested but invalid build profile instead of silently building a stub. */
export function assertG678CompiledLocalQaConfiguration(
  env: G678PreviewEnvironment = compiledPreviewEnvironment(),
): void {
  env = previewEnvironment(env);
  if (env.HELP_MATH_G678_COMPILED_LOCAL_QA !== undefined &&
      env.HELP_MATH_G678_COMPILED_LOCAL_QA !== '0' &&
      !isG678CompiledLocalQaEnabled(env)) {
    throw new Error('G678_COMPILED_QA_REQUIRES_PRODUCTION_LOOPBACK_NON_CLOUD_OPT_IN');
  }
}

export function isG678LocalPreviewEnabled(
  env: G678PreviewEnvironment = compiledPreviewEnvironment(),
): boolean {
  env = previewEnvironment(env);
  const optIn = env.HELP_MATH_G678_LOCAL_PREVIEW;
  return (env.NODE_ENV !== 'production' || isG678CompiledLocalQaEnabled(env)) &&
    !env.VERCEL && !env.VERCEL_ENV &&
    env.HELP_MATH_G678_LOCAL_PREVIEW_BIND === '127.0.0.1' &&
    (optIn === 'true' || optIn === '1');
}

const G678_LOOPBACK_HOSTNAMES = new Set([
  '127.0.0.1',
  'localhost',
  '[::1]',
]);

export function isG678LoopbackHostname(value: string): boolean {
  return G678_LOOPBACK_HOSTNAMES.has(value.toLowerCase());
}

export function isG678LocalPreviewRequestUrl(
  url: Pick<URL, 'hostname'>,
  env: G678PreviewEnvironment = compiledPreviewEnvironment(),
): boolean {
  return isG678LocalPreviewEnabled(env) &&
    isG678LoopbackHostname(url.hostname);
}

export function isG678LocalPreviewRequestHeaders(
  headers: Pick<Headers, 'get'>,
  env: G678PreviewEnvironment = compiledPreviewEnvironment(),
): boolean {
  if (!isG678LocalPreviewEnabled(env)) return false;
  const forwardedHost = headers.get('x-forwarded-host');
  const host = headers.get('host');
  if (!host || host.includes(',') ||
      (forwardedHost !== null && forwardedHost.includes(','))) return false;
  try {
    return isG678LoopbackHostname(new URL(`http://${host}`).hostname) &&
      (forwardedHost === null || isG678LoopbackHostname(
        new URL(`http://${forwardedHost}`).hostname,
      ));
  } catch {
    return false;
  }
}

export function isG678SameOriginCanvasAssetRequest(
  headers: Pick<Headers, 'get'>,
  url: URL,
): boolean {
  if (!isG678LoopbackHostname(url.hostname) || url.protocol !== 'http:') {
    return false;
  }
  const fetchMode = headers.get('sec-fetch-mode');
  if (
    headers.get('sec-fetch-site') !== 'same-origin' ||
    (fetchMode !== 'cors' && fetchMode !== 'no-cors') ||
    headers.get('sec-fetch-dest') !== 'script'
  ) return false;
  const referer = headers.get('referer');
  if (!referer) return false;
  try {
    const sameLoopbackOrigin = (candidate: URL) =>
      candidate.protocol === 'http:' && url.protocol === 'http:' &&
      isG678LoopbackHostname(candidate.hostname) &&
      isG678LoopbackHostname(url.hostname) && candidate.port === url.port;
    if (!sameLoopbackOrigin(new URL(referer))) return false;
    const origin = headers.get('origin');
    if (fetchMode === 'cors' && origin === null) return false;
    return origin === null || sameLoopbackOrigin(new URL(origin));
  } catch {
    return false;
  }
}

export function isG678ModuleCoursePath(pathname: string): boolean {
  const match = pathname.match(/^\/courses\/[6-8]\/([a-z]{3}\d{3})\/\d{1,2}$/iu);
  return Boolean(match && isG678ModuleCode(match[1]!));
}

export function isG678CalibrationProductPath(pathname: string): boolean {
  if (pathname === '/migration-status/g678-calibration/shared-geo001-l06-p002/host') return true;
  if (pathname === '/migration-status/g678-calibration/shared-geo001-l07-p003-candidate') return true;
  if (pathname === '/migration-status/g678-calibration/shared-dat001-l02-p002-candidate') return true;
  const match = pathname.match(
    /^\/migration-status\/g678-calibration\/shared-([a-z]{3}\d{3})-l\d{2}-p\d{3}$/iu,
  );
  return Boolean(match && isG678ModuleCode(match[1]!));
}

export function isG678CalibrationAssetPath(pathname: string): boolean {
  const match = pathname.match(
    /^\/flash-assets\/g678-local\/shared-([a-z]{3}\d{3})-l\d{2}-p\d{3}\/canvas-renderer\.js$/iu,
  );
  return Boolean(match && isG678ModuleCode(match[1]!));
}
