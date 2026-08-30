import type {LrsConfig} from './lrs-config.server';
import type {XapiStatement} from './xapi-statement';

export type LrsFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export type LrsDeliveryResult =
  | Readonly<{
      ok: true;
      disposition: 'stored' | 'already-stored';
      statementId: string;
    }>
  | Readonly<{
      ok: false;
      kind: 'retryable' | 'permanent';
      code:
        | 'network-error'
        | 'rate-limited'
        | 'lrs-unavailable'
        | 'lrs-rejected'
        | 'conflict-readback-failed'
        | 'statement-conflict';
      statementId: string;
      retryAfterMs?: number;
    }>;

const MAX_READBACK_BYTES = 64 * 1024;
const LRS_ADDED_TOP_LEVEL_FIELDS = new Set(['stored', 'authority', 'version']);

function statementUrl(config: LrsConfig, statementId: string): URL {
  const url = new URL('statements', config.endpoint);
  url.searchParams.set('statementId', statementId);
  return url;
}

function requestHeaders(config: LrsConfig): Headers {
  return new Headers({
    Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`, 'utf8').toString('base64')}`,
    'Content-Type': 'application/json',
    'X-Experience-API-Version': config.xapiVersion,
  });
}

function retryAfterMs(response: Response): number | undefined {
  const value = response.headers.get('retry-after')?.trim();
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(Math.round(seconds * 1_000), 5 * 60_000);
  }
  const at = Date.parse(value);
  if (Number.isNaN(at)) return undefined;
  return Math.min(Math.max(0, at - Date.now()), 5 * 60_000);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalize(child)]),
  );
}

function removeLrsAddedFields(value: unknown): unknown {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !LRS_ADDED_TOP_LEVEL_FIELDS.has(key)),
  );
}

export function isCanonicalStatementMatch(
  expected: XapiStatement,
  stored: unknown,
): boolean {
  return JSON.stringify(canonicalize(removeLrsAddedFields(stored))) ===
    JSON.stringify(canonicalize(expected));
}

function failedResult(
  statementId: string,
  kind: 'retryable' | 'permanent',
  code: Extract<LrsDeliveryResult, {ok: false}>['code'],
  retryMs?: number,
): LrsDeliveryResult {
  return {
    ok: false,
    kind,
    code,
    statementId,
    ...(retryMs === undefined ? {} : {retryAfterMs: retryMs}),
  };
}

async function readConflictingStatement(
  config: LrsConfig,
  statement: XapiStatement,
  fetchImpl: LrsFetch,
): Promise<LrsDeliveryResult> {
  let response: Response;
  try {
    const headers = requestHeaders(config);
    headers.delete('Content-Type');
    headers.set('Accept', 'application/json');
    response = await fetchImpl(statementUrl(config, statement.id), {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(config.requestTimeoutMs),
    });
  } catch {
    return failedResult(statement.id, 'retryable', 'conflict-readback-failed');
  }

  if (response.status === 429 || response.status >= 500) {
    return failedResult(
      statement.id,
      'retryable',
      'conflict-readback-failed',
      retryAfterMs(response),
    );
  }
  if (response.status !== 200) {
    return failedResult(statement.id, 'permanent', 'statement-conflict');
  }

  try {
    const body = await response.text();
    if (Buffer.byteLength(body, 'utf8') > MAX_READBACK_BYTES) {
      return failedResult(statement.id, 'permanent', 'statement-conflict');
    }
    const stored = JSON.parse(body) as unknown;
    return isCanonicalStatementMatch(statement, stored)
      ? {ok: true, disposition: 'already-stored', statementId: statement.id}
      : failedResult(statement.id, 'permanent', 'statement-conflict');
  } catch {
    return failedResult(statement.id, 'permanent', 'statement-conflict');
  }
}

/**
 * Idempotently writes one xAPI statement. Error results contain only bounded
 * classifications and the caller-generated UUID; LRS bodies, URLs, and
 * credentials are never returned or logged.
 */
export async function deliverXapiStatement(
  config: LrsConfig,
  statement: XapiStatement,
  fetchImpl: LrsFetch = fetch,
): Promise<LrsDeliveryResult> {
  let response: Response;
  try {
    response = await fetchImpl(statementUrl(config, statement.id), {
      method: 'PUT',
      headers: requestHeaders(config),
      body: JSON.stringify(statement),
      cache: 'no-store',
      signal: AbortSignal.timeout(config.requestTimeoutMs),
    });
  } catch {
    return failedResult(statement.id, 'retryable', 'network-error');
  }

  if (response.status === 204) {
    return {ok: true, disposition: 'stored', statementId: statement.id};
  }
  if (response.status === 409) {
    return readConflictingStatement(config, statement, fetchImpl);
  }
  if (response.status === 429) {
    return failedResult(
      statement.id,
      'retryable',
      'rate-limited',
      retryAfterMs(response),
    );
  }
  if (response.status >= 500) {
    return failedResult(
      statement.id,
      'retryable',
      'lrs-unavailable',
      retryAfterMs(response),
    );
  }
  return failedResult(statement.id, 'permanent', 'lrs-rejected');
}
