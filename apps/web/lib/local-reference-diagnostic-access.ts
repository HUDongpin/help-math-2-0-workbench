export const HELP_MATH_LOCAL_REFERENCE_DIAGNOSTIC_FLAG =
  'HELP_MATH_LOCAL_REFERENCE_DIAGNOSTIC';

export const LOCAL_REFERENCE_DIAGNOSTIC_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self' data:",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob:",
  "media-src 'self' data: blob:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
].join('; ');

type HeaderReader = Pick<Headers, 'get'>;

export interface LocalReferenceDiagnosticAccessInput {
  headers: HeaderReader;
  url?: string | URL;
  nodeEnv?: string;
  enabledFlag?: string;
  deploymentEnvironment?: string;
}

function portIsValid(value: string | undefined) {
  if (value === undefined) return true;
  if (!/^[1-9][0-9]{0,4}$/.test(value)) return false;
  const port = Number(value);
  return port >= 1 && port <= 65_535;
}

/** Exact HTTP Host/X-Forwarded-Host syntax accepted by the local gate. */
export function isExactLoopbackHostHeader(value: string | null | undefined) {
  if (!value) return false;
  const ipv4OrLocalhost = value.match(/^(?:127\.0\.0\.1|localhost)(?::([0-9]+))?$/i);
  if (ipv4OrLocalhost) return portIsValid(ipv4OrLocalhost[1]);
  const ipv6 = value.match(/^\[::1\](?::([0-9]+))?$/);
  return Boolean(ipv6 && portIsValid(ipv6[1]));
}

function isPlainHttpProtocol(value: string | null | undefined) {
  return value === 'http' || value === 'http:';
}

/**
 * Development retains the historical local-forensics behavior. Production is
 * fail-closed unless the exact flag is set and every available request-origin
 * signal is an unambiguous plain-HTTP loopback value. When a server-component
 * call has no URL/protocol signal, an exact loopback Host with no forwarded
 * protocol is treated as the trusted direct-local request; proxy admission has
 * already checked the actual URL for page requests.
 */
export function isLocalReferenceDiagnosticRequestAllowed({
  headers,
  url,
  nodeEnv = process.env.NODE_ENV,
  enabledFlag = process.env.HELP_MATH_LOCAL_REFERENCE_DIAGNOSTIC,
  deploymentEnvironment = process.env.VERCEL_ENV,
}: LocalReferenceDiagnosticAccessInput) {
  if (nodeEnv !== 'production') return true;
  if (enabledFlag !== '1' || Boolean(deploymentEnvironment)) return false;

  const host = headers.get('host');
  const forwardedHost = headers.get('x-forwarded-host');
  const forwardedProtocol = headers.get('x-forwarded-proto');
  if (!isExactLoopbackHostHeader(host)) return false;
  if (forwardedHost !== null && !isExactLoopbackHostHeader(forwardedHost)) return false;
  if (forwardedProtocol !== null && !isPlainHttpProtocol(forwardedProtocol)) return false;

  if (url !== undefined) {
    let parsed: URL;
    try {
      parsed = url instanceof URL ? url : new URL(url);
    } catch {
      return false;
    }
    if (!isPlainHttpProtocol(parsed.protocol)) return false;
    if (!isExactLoopbackHostHeader(parsed.host)) return false;
    if (parsed.username || parsed.password) return false;
  }
  return true;
}

export const LOCAL_REFERENCE_DIAGNOSTIC_BOUNDARY = Object.freeze({
  flag: `${HELP_MATH_LOCAL_REFERENCE_DIAGNOSTIC_FLAG}=1`,
  productionDefault: 'disabled-404',
  allowedHosts: ['127.0.0.1', 'localhost', '[::1]'],
  protocol: 'plain-http-only',
  deployment: 'local-process-only-not-vercel',
  authority: 'forensic-reference-only-acceptance-neutral',
});
