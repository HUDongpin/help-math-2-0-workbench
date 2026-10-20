/**
 * Parsing, redaction and rate limiting for CSP violation reports. Reports are
 * logged as one JSON line to the Vercel runtime logs. No IP, user agent,
 * cookie, query string, URL fragment or script sample is ever logged.
 */

export const MAX_CSP_REPORT_BYTES = 16 * 1024;
export const CSP_REPORTS_PER_MINUTE = 120;
export const MAX_REPORTS_PER_REQUEST = 10;

export interface RedactedCspReport {
  readonly directive: string;
  readonly blocked: string;
  readonly documentPath: string;
  readonly sourcePath: string | null;
  readonly line: number | null;
  readonly disposition: string;
}

const KEYWORD_BLOCKED = new Set(['inline', 'eval', 'wasm-eval', 'self', 'data', 'blob', 'trusted-types-policy', 'trusted-types-sink']);

function text(value: unknown, max = 120): string | null {
  return typeof value === 'string' && value.length ? value.slice(0, max) : null;
}

/** Keeps only the origin of a blocked URL, or a CSP keyword such as "inline". */
export function redactBlocked(value: unknown): string {
  const raw = text(value, 2048);
  if (!raw) return 'unknown';
  if (KEYWORD_BLOCKED.has(raw)) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.origin;
    return url.protocol.replace(/:$/u, '');
  } catch {
    return 'unparsed';
  }
}

/** Keeps only the path of a same-site URL (no query, no fragment, no host). */
export function redactPath(value: unknown): string | null {
  const raw = text(value, 2048);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return url.protocol.replace(/:$/u, '');
    return url.pathname.slice(0, 200);
  } catch {
    return null;
  }
}

function redactOne(body: Record<string, unknown>): RedactedCspReport | null {
  const directive = text(body['effective-directive'] ?? body.effectiveDirective ?? body['violated-directive'], 60);
  if (!directive) return null;
  const line = body['line-number'] ?? body.lineNumber;
  return {
    directive: directive.split(' ')[0]!,
    blocked: redactBlocked(body['blocked-uri'] ?? body.blockedURL),
    documentPath: redactPath(body['document-uri'] ?? body.documentURL) ?? 'unknown',
    sourcePath: redactPath(body['source-file'] ?? body.sourceFile),
    line: typeof line === 'number' && Number.isFinite(line) ? Math.trunc(line) : null,
    disposition: text(body.disposition, 20) ?? 'report',
  };
}

/** Accepts both the legacy report-uri shape and the Reporting API array. */
export function parseCspReports(payload: unknown): RedactedCspReport[] {
  const out: RedactedCspReport[] = [];
  if (Array.isArray(payload)) {
    for (const entry of payload.slice(0, MAX_REPORTS_PER_REQUEST)) {
      if (entry && typeof entry === 'object' && (entry as {type?: unknown}).type === 'csp-violation') {
        const body = (entry as {body?: unknown}).body;
        if (body && typeof body === 'object') {
          const report = redactOne(body as Record<string, unknown>);
          if (report) out.push(report);
        }
      }
    }
  } else if (payload && typeof payload === 'object') {
    const body = (payload as {'csp-report'?: unknown})['csp-report'];
    if (body && typeof body === 'object') {
      const report = redactOne(body as Record<string, unknown>);
      if (report) out.push(report);
    }
  }
  return out;
}

/**
 * One global fixed-window budget per server instance. It is keyed on nothing
 * about the client, so the limiter itself stores no personal data.
 */
export function createCspReportBudget(limit = CSP_REPORTS_PER_MINUTE, now: () => number = Date.now) {
  let window = -1;
  let count = 0;
  return (reports: number): number => {
    const current = Math.floor(now() / 60_000);
    if (current !== window) {
      window = current;
      count = 0;
    }
    const granted = Math.max(0, Math.min(reports, limit - count));
    count += granted;
    return granted;
  };
}
