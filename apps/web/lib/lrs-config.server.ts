export const DEFAULT_LRS_XAPI_VERSION = '1.0.3' as const;
export const DEFAULT_LRS_REQUEST_TIMEOUT_MS = 8_000;

export interface LrsConfig {
  readonly endpoint: string;
  readonly username: string;
  readonly password: string;
  readonly xapiVersion: typeof DEFAULT_LRS_XAPI_VERSION;
  readonly actorHmacSecret: string;
  readonly requestTimeoutMs: number;
}

export type LrsConfigResult =
  | Readonly<{ok: true; config: LrsConfig}>
  | Readonly<{
      ok: false;
      reason:
        | 'disabled'
        | 'missing-credentials'
        | 'invalid-endpoint'
        | 'invalid-version'
        | 'invalid-actor-secret'
        | 'invalid-timeout';
    }>;

function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}

function normalizeEndpoint(value: string): string | null {
  let endpoint: URL;
  try {
    endpoint = new URL(value);
  } catch {
    return null;
  }

  if (
    endpoint.protocol !== 'https:' ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash
  ) {
    return null;
  }

  if (!endpoint.pathname.endsWith('/')) endpoint.pathname += '/';
  return endpoint.toString();
}

/** Loads only the explicit server-side LRS variables. No aliases are accepted. */
export function loadLrsConfig(
  environment: NodeJS.ProcessEnv = process.env,
): LrsConfigResult {
  if (!isEnabled(environment.LRS_ENABLED)) {
    return {ok: false, reason: 'disabled'};
  }

  const endpointValue = environment.LRS_ENDPOINT?.trim();
  const username = environment.LRS_USERNAME?.trim();
  const password = environment.LRS_PASSWORD?.trim();
  if (!endpointValue || !username || !password) {
    return {ok: false, reason: 'missing-credentials'};
  }

  const endpoint = normalizeEndpoint(endpointValue);
  if (!endpoint) return {ok: false, reason: 'invalid-endpoint'};

  const xapiVersion = (
    environment.LRS_XAPI_VERSION?.trim() || DEFAULT_LRS_XAPI_VERSION
  );
  if (xapiVersion !== DEFAULT_LRS_XAPI_VERSION) {
    return {ok: false, reason: 'invalid-version'};
  }

  const actorHmacSecret = environment.LRS_ACTOR_HMAC_SECRET?.trim();
  if (!actorHmacSecret || Buffer.byteLength(actorHmacSecret, 'utf8') < 32) {
    return {ok: false, reason: 'invalid-actor-secret'};
  }

  const timeoutText = environment.LRS_REQUEST_TIMEOUT_MS?.trim();
  const requestTimeoutMs = timeoutText
    ? Number(timeoutText)
    : DEFAULT_LRS_REQUEST_TIMEOUT_MS;
  if (
    !Number.isInteger(requestTimeoutMs) ||
    requestTimeoutMs < 1_000 ||
    requestTimeoutMs > 20_000
  ) {
    return {ok: false, reason: 'invalid-timeout'};
  }

  return {
    ok: true,
    config: Object.freeze({
      endpoint,
      username,
      password,
      xapiVersion: DEFAULT_LRS_XAPI_VERSION,
      actorHmacSecret,
      requestTimeoutMs,
    }),
  };
}
