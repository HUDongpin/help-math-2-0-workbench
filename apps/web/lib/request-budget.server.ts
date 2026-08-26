import {createHash} from 'node:crypto';
import {isIP} from 'node:net';

export const REQUEST_BUDGET_WINDOW_MS = 60_000;
export const DEFAULT_NOVA_REQUESTS_PER_MINUTE = 12;
export const DEFAULT_LRS_REQUESTS_PER_MINUTE = 120;
export const NOVA_RATE_LIMIT_ENV = 'NOVA_TUTOR_RATE_LIMIT_PER_MINUTE';
export const LRS_RATE_LIMIT_ENV = 'LRS_RATE_LIMIT_PER_MINUTE';

type RequestBudgetScope = 'nova' | 'lrs';

interface RequestBudgetBucket {
  readonly window: number;
  count: number;
}

export type RequestBudgetDecision = Readonly<
  | {allowed: true}
  | {allowed: false; retryAfterSeconds: number}
>;

const MAX_DISTINCT_BUCKETS = 4_096;
const buckets = new Map<string, RequestBudgetBucket>();
let lastPrunedWindow = -1;

function canonicalIp(value: string): string | null {
  const version = isIP(value);
  if (version === 4) return value;
  if (version !== 6) return null;
  try {
    // URL canonicalization collapses equivalent IPv6 spellings so they cannot
    // receive separate budgets merely by changing textual representation.
    const hostname = new URL(`http://[${value}]/`).hostname;
    return hostname.slice(1, -1).toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Returns only the first address supplied by the first available trusted
 * forwarding header. An invalid first address becomes the shared unknown
 * bucket; it never falls through to a later, attacker-selected address.
 */
export function requestClientIp(request: Request): string | null {
  for (const name of [
    'x-vercel-forwarded-for',
    'x-forwarded-for',
    'x-real-ip',
  ] as const) {
    const header = request.headers.get(name);
    if (header === null) continue;
    const first = header.split(',')[0]?.trim();
    return first ? canonicalIp(first) : null;
  }
  return null;
}

function opaqueClientKey(request: Request): string {
  const ip = requestClientIp(request);
  if (!ip) return 'unknown';
  // Do not retain a raw IP address in module memory. No budget path logs this
  // digest or the underlying address.
  return createHash('sha256')
    .update(`help-math-request-budget-v1\0${ip}`, 'utf8')
    .digest('base64url');
}

function configuredLimit(
  scope: RequestBudgetScope,
  environment: NodeJS.ProcessEnv,
): number {
  const fallback = scope === 'nova'
    ? DEFAULT_NOVA_REQUESTS_PER_MINUTE
    : DEFAULT_LRS_REQUESTS_PER_MINUTE;
  const maximum = scope === 'nova' ? 120 : 1_200;
  const name = scope === 'nova' ? NOVA_RATE_LIMIT_ENV : LRS_RATE_LIMIT_ENV;
  const value = environment[name];
  if (value === undefined || !/^\d+$/u.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= maximum
    ? parsed
    : fallback;
}

function prunePreviousWindows(currentWindow: number) {
  if (lastPrunedWindow === currentWindow) return;
  for (const [key, bucket] of buckets) {
    if (bucket.window !== currentWindow) buckets.delete(key);
  }
  lastPrunedWindow = currentWindow;
}

/**
 * Per-instance, best-effort fixed-window protection for provider-bound routes.
 * It deliberately supplements rather than claims to replace Vercel Firewall or
 * a distributed rate-limit store: cold starts and parallel instances each own
 * a bounded map.
 */
export function consumeRequestBudget(options: {
  request: Request;
  scope: RequestBudgetScope;
  environment?: NodeJS.ProcessEnv;
  now?: number;
}): RequestBudgetDecision {
  const now = options.now ?? Date.now();
  const currentWindow = Math.floor(now / REQUEST_BUDGET_WINDOW_MS);
  prunePreviousWindows(currentWindow);

  const clientKey = opaqueClientKey(options.request);
  const scopedKey = `${options.scope}:${clientKey}`;
  const overflowKey = `${options.scope}:overflow`;
  const key = buckets.has(scopedKey) || buckets.size < MAX_DISTINCT_BUCKETS
    ? scopedKey
    : overflowKey;
  const limit = configuredLimit(options.scope, options.environment ?? process.env);
  const existing = buckets.get(key);
  const bucket = existing?.window === currentWindow
    ? existing
    : {window: currentWindow, count: 0};

  if (bucket.count >= limit) {
    const windowEnd = (currentWindow + 1) * REQUEST_BUDGET_WINDOW_MS;
    return Object.freeze({
      allowed: false as const,
      retryAfterSeconds: Math.max(1, Math.ceil((windowEnd - now) / 1_000)),
    });
  }

  bucket.count += 1;
  buckets.set(key, bucket);
  return Object.freeze({allowed: true as const});
}

/** Test isolation only; production code never calls this. */
export function resetRequestBudgetsForTests() {
  buckets.clear();
  lastPrunedWindow = -1;
}
