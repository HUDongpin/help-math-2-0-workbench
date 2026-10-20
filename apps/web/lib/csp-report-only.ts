/**
 * Issue #35 step 1: a nonce-based Content-Security-Policy that runs in
 * Report-Only mode beside the enforced policy in next.config.ts. Nothing here
 * changes what the browser enforces; it only reports what a strict policy
 * would have blocked, so the enforced CSP can be tightened from evidence.
 */

export const CSP_REPORT_PATH = '/api/csp-report';
export const CSP_REPORT_GROUP = 'csp-report-only';
export const CSP_REPORTING_ENDPOINTS_HEADER = `${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"`;

/** 128 random bits, base64. Generated per document request in the proxy. */
export function createCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

const reportDirectives = [`report-uri ${CSP_REPORT_PATH}`, `report-to ${CSP_REPORT_GROUP}`];

/**
 * Page policy: same sources as the enforced securityHeaders policy, except
 * scripts must carry the per-request nonce ('strict-dynamic' lets those
 * scripts load their own chunks) instead of relying on 'unsafe-inline'.
 */
export function pageReportOnlyCsp(nonce: string, production = process.env.NODE_ENV === 'production'): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self' https://challenges.cloudflare.com",
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self' https://challenges.cloudflare.com",
    "img-src 'self' data: blob:",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${production ? '' : " 'unsafe-eval' 'wasm-unsafe-eval'"} https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self' blob:",
    ...reportDirectives,
  ].join('; ');
}

/**
 * Embedded course adapter policy: these are static files, so no per-request
 * nonce is possible. The probe mirrors the enforced adapter policy minus
 * script 'unsafe-inline', to measure how much inline script the adapters use.
 */
export const EMBEDDED_COURSE_ADAPTER_REPORT_ONLY_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'none'",
  "font-src 'none'",
  "form-action 'none'",
  "frame-ancestors 'self'",
  "img-src 'self' data:",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  ...reportDirectives,
].join('; ');
