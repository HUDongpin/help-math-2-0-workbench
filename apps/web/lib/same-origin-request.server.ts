/**
 * Validates the browser Origin against the public authority seen by the
 * deployment proxy. The browser-facing Host/Proto headers take precedence over
 * an internal Request URL, which is how Vercel invokes a Node function.
 */
export function isSameOriginServerRequest(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') {
    return false;
  }

  const originValue = request.headers.get('origin');
  if (!originValue) return false;

  let origin: URL;
  let requestUrl: URL;
  try {
    origin = new URL(originValue);
    requestUrl = new URL(request.url);
  } catch {
    return false;
  }
  // A browser Origin is an origin, not a general URL with credentials, a path,
  // query, or fragment. Reject hand-authored variants instead of normalizing
  // them into an apparently trusted value.
  if (
    originValue !== origin.origin ||
    origin.username ||
    origin.password ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash
  ) {
    return false;
  }

  const forwardedHostHeader = request.headers.get('x-forwarded-host');
  const forwardedHost = forwardedHostHeader === null
    ? null
    : forwardedHostHeader.split(',')[0]?.trim() ?? '';
  if (forwardedHostHeader !== null && !forwardedHost) return false;

  const hostHeader = request.headers.get('host')?.trim();
  const effectiveHost = forwardedHost ?? hostHeader ?? requestUrl.host;
  if (
    !effectiveHost ||
    /[\s/@?#]/u.test(effectiveHost) ||
    (forwardedHostHeader === null && effectiveHost.includes(','))
  ) {
    return false;
  }

  const forwardedProtocolHeader = request.headers.get('x-forwarded-proto');
  const forwardedProtocol = forwardedProtocolHeader === null
    ? null
    : forwardedProtocolHeader.split(',')[0]?.trim().toLowerCase() ?? '';
  if (forwardedProtocolHeader !== null && !forwardedProtocol) return false;
  const effectiveProtocol = forwardedProtocol
    ? `${forwardedProtocol}:`
    : requestUrl.protocol;
  if (effectiveProtocol !== 'http:' && effectiveProtocol !== 'https:') {
    return false;
  }

  let effectiveOrigin: URL;
  try {
    effectiveOrigin = new URL(`${effectiveProtocol}//${effectiveHost}`);
  } catch {
    return false;
  }
  if (
    effectiveOrigin.username ||
    effectiveOrigin.password ||
    effectiveOrigin.pathname !== '/' ||
    effectiveOrigin.search ||
    effectiveOrigin.hash ||
    origin.origin !== effectiveOrigin.origin
  ) {
    return false;
  }

  if (origin.protocol === 'https:') return true;
  return origin.protocol === 'http:' && (
    origin.hostname === '127.0.0.1' ||
    origin.hostname === 'localhost' ||
    origin.hostname === '[::1]'
  );
}
