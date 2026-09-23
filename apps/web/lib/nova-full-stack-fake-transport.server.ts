import 'server-only';

import {appendFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

import {NOVA_OPENROUTER_MODEL} from './nova-openrouter.server';

export const NOVA_FULL_STACK_FAKE_TRANSPORT_AUTHORIZATION =
  'full-stack-fake-upstream-v1' as const;
export const NOVA_FULL_STACK_FAKE_TRANSPORT_MODES = [
  'success',
  'provider-unavailable',
] as const;

type NovaFullStackFakeTransportMode =
  (typeof NOVA_FULL_STACK_FAKE_TRANSPORT_MODES)[number];

const ALLOWED_OPENROUTER_ORIGINS = new Set([
  'https://openrouter.ai',
  'https://eu.openrouter.ai',
]);
const RECEIPT_DIRECTORY = path.join(
  tmpdir(),
  'helpmath-nova-full-stack',
);

type NovaFakeTransportEnvironment = Readonly<
  Record<string, string | undefined>
>;

export class NovaFakeTransportConfigurationError extends Error {
  constructor(readonly reason: string) {
    super('Nova full-stack fake transport is not safely configured');
    this.name = 'NovaFakeTransportConfigurationError';
  }
}

function invalidConfiguration(reason: string): never {
  throw new NovaFakeTransportConfigurationError(reason);
}

function isLoopbackHostname(hostname: string) {
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';
}

function fakeTransportRequested(environment: NovaFakeTransportEnvironment) {
  return [
    environment.NOVA_TEST_FAKE_TRANSPORT_AUTHORIZATION,
    environment.NOVA_TEST_FAKE_TRANSPORT_MODE,
    environment.NOVA_TEST_FAKE_TRANSPORT_ORIGIN,
    environment.NOVA_TEST_FAKE_TRANSPORT_RECEIPT_PATH,
  ].some((value) => value !== undefined && value.trim() !== '');
}

function readResponseMode(
  value: string | undefined,
): NovaFullStackFakeTransportMode {
  if (
    value === 'success' ||
    value === 'provider-unavailable'
  ) return value;
  return invalidConfiguration('response-mode');
}

function readReceiptPath(value: string | undefined) {
  if (!value?.trim()) return invalidConfiguration('receipt-path');
  const resolved = path.resolve(value.trim());
  const expectedPrefix = `${RECEIPT_DIRECTORY}${path.sep}`;
  if (!resolved.startsWith(expectedPrefix) || !resolved.endsWith('.ndjson')) {
    return invalidConfiguration('receipt-path');
  }
  return resolved;
}

function readExpectedOrigin(value: string | undefined) {
  let origin: URL;
  try {
    origin = new URL(value?.trim() ?? '');
  } catch {
    return invalidConfiguration('expected-origin');
  }
  if (
    origin.protocol !== 'http:' ||
    !isLoopbackHostname(origin.hostname) ||
    origin.username !== '' ||
    origin.password !== '' ||
    origin.pathname !== '/' ||
    origin.search !== '' ||
    origin.hash !== '' ||
    origin.port === ''
  ) {
    return invalidConfiguration('expected-origin');
  }
  return origin.origin;
}

function bodyFromInit(init: RequestInit | undefined) {
  if (typeof init?.body !== 'string' || Buffer.byteLength(init.body, 'utf8') > 256_000) {
    return invalidConfiguration('payload');
  }
  let body: unknown;
  try {
    body = JSON.parse(init.body);
  } catch {
    return invalidConfiguration('payload');
  }
  if (!body || typeof body !== 'object') return invalidConfiguration('payload');
  return body as {
    readonly messages?: readonly Readonly<{
      readonly content?: unknown;
      readonly role?: unknown;
    }>[];
    readonly model?: unknown;
  };
}

function framePresent(body: ReturnType<typeof bodyFromInit>) {
  return body.messages?.some((message) =>
    Array.isArray(message.content) && message.content.some((part) =>
      part !== null &&
      typeof part === 'object' &&
      'type' in part &&
      part.type === 'image_url'
    )
  ) ?? false;
}

/**
 * Return a deterministic fake OpenRouter transport only for an explicitly
 * authorized, local full-stack browser run. A partial or invalid test setup
 * fails closed so a test can never fall through to the real provider.
 */
export function resolveNovaFullStackFakeFetch(input: Readonly<{
  environment?: NovaFakeTransportEnvironment;
  request: Request;
  requestId: string;
}>): typeof fetch | undefined {
  const environment = input.environment ?? process.env;
  if (!fakeTransportRequested(environment)) return undefined;
  if (
    environment.NODE_ENV === 'production' ||
    environment.VERCEL_ENV !== undefined ||
    environment.NOVA_TEST_FAKE_TRANSPORT_AUTHORIZATION !==
      NOVA_FULL_STACK_FAKE_TRANSPORT_AUTHORIZATION
  ) {
    return invalidConfiguration('runtime');
  }

  const expectedOrigin = readExpectedOrigin(
    environment.NOVA_TEST_FAKE_TRANSPORT_ORIGIN,
  );
  const expectedOriginUrl = new URL(expectedOrigin);
  const requestUrl = new URL(input.request.url);
  if (
    !isLoopbackHostname(requestUrl.hostname) ||
    requestUrl.protocol !== 'http:' ||
    requestUrl.port !== expectedOriginUrl.port ||
    input.request.headers.get('origin') !== expectedOrigin
  ) {
    return invalidConfiguration('request-origin');
  }
  const receiptPath = readReceiptPath(
    environment.NOVA_TEST_FAKE_TRANSPORT_RECEIPT_PATH,
  );
  const responseMode = readResponseMode(
    environment.NOVA_TEST_FAKE_TRANSPORT_MODE,
  );

  let attempt = 0;
  return (async (target: URL | RequestInfo, init?: RequestInit) => {
    attempt += 1;
    const targetUrl = new URL(
      target instanceof Request ? target.url : String(target),
    );
    if (
      !ALLOWED_OPENROUTER_ORIGINS.has(targetUrl.origin) ||
      targetUrl.pathname !== '/api/v1/chat/completions' ||
      targetUrl.search !== '' ||
      targetUrl.hash !== '' ||
      init?.method !== 'POST'
    ) {
      return invalidConfiguration('provider-target');
    }
    const body = bodyFromInit(init);
    if (body.model !== NOVA_OPENROUTER_MODEL) {
      return invalidConfiguration('model');
    }

    const receiptId = randomUUID();
    const responseStatus = responseMode === 'provider-unavailable' ? 503 : 200;
    const receipt = Object.freeze({
      schemaVersion: 1,
      evidenceKind: 'FULL_STACK_FAKE_UPSTREAM',
      receiptId,
      requestId: input.requestId,
      model: NOVA_OPENROUTER_MODEL,
      status: responseStatus,
      attempt,
      requestBytes: Buffer.byteLength(String(init.body), 'utf8'),
      framePresent: framePresent(body),
    });
    appendFileSync(receiptPath, `${JSON.stringify(receipt)}\n`, {
      encoding: 'utf8',
      flag: 'a',
      mode: 0o600,
    });

    if (responseMode === 'provider-unavailable') {
      return new Response(JSON.stringify({error: 'synthetic-provider-unavailable'}), {
        status: responseStatus,
        headers: {
          'content-type': 'application/json',
          'x-helpmath-fake-upstream-receipt-id': receiptId,
        },
      });
    }

    return new Response(JSON.stringify({
      model: NOVA_OPENROUTER_MODEL,
      choices: [{
        message: {
          role: 'assistant',
          content: 'Nova full-stack test reply. Explain one short math step, then check your idea.',
        },
        finish_reason: 'stop',
      }],
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'x-helpmath-fake-upstream-receipt-id': receiptId,
      },
    });
  }) as typeof fetch;
}
