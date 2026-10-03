import {NextResponse} from 'next/server';

import {issueLearningIdentityBinding, resolveAnonymousLearningActor, verifyLearningIdentityBinding} from '@/lib/anonymous-learning-actor.server';
import {
  MAX_LEARNING_EVENT_REQUEST_BYTES,
  findProhibitedLearningEventField,
  learningEventBatchSchema,
} from '@/lib/learning-event-schema';
import {deliverXapiStatement, type LrsDeliveryResult} from '@/lib/lrs-client.server';
import {loadLrsConfig} from '@/lib/lrs-config.server';
import {consumeRequestBudget} from '@/lib/request-budget.server';
import {isSameOriginLearningEventRequest} from '@/lib/learning-event-route-support.server';
import {buildXapiStatement} from '@/lib/xapi-statement';

import {LEARNING_IDENTITY_HEADER} from '@/lib/learning-event-identity';

export const dynamic = 'force-dynamic';
const DELIVERY_CONCURRENCY = 4;

type PublicDeliveryStatus = 'stored' | 'already-stored' | 'retryable' | 'rejected';

function jsonResponse(
  body: unknown,
  status: number,
  setCookieHeader?: string | null,
  additionalHeaders?: HeadersInit,
) {
  const headers = new Headers({'Cache-Control': 'no-store'});
  if (setCookieHeader) headers.set('Set-Cookie', setCookieHeader);
  if (additionalHeaders) {
    new Headers(additionalHeaders).forEach((value, name) => headers.set(name, value));
  }
  return NextResponse.json(body, {status, headers});
}

async function readBoundedJson(request: Request): Promise<
  | {ok: true; value: unknown}
  | {ok: false; code: 'PAYLOAD_TOO_LARGE' | 'INVALID_JSON'}
> {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_LEARNING_EVENT_REQUEST_BYTES) {
    return {ok: false, code: 'PAYLOAD_TOO_LARGE'};
  }

  try {
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_LEARNING_EVENT_REQUEST_BYTES) {
      return {ok: false, code: 'PAYLOAD_TOO_LARGE'};
    }
    const text = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
    return {ok: true, value: JSON.parse(text) as unknown};
  } catch {
    return {ok: false, code: 'INVALID_JSON'};
  }
}

function publicStatus(result: LrsDeliveryResult): PublicDeliveryStatus {
  if (result.ok) return result.disposition;
  return result.kind === 'retryable' ? 'retryable' : 'rejected';
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(Array.from({length: Math.min(concurrency, items.length)}, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]!);
    }
  }));
  return results;
}

export async function POST(request: Request) {
  if (!isSameOriginLearningEventRequest(request)) {
    return jsonResponse({ok: false, error: {code: 'ORIGIN_FORBIDDEN'}}, 403);
  }

  const budget = consumeRequestBudget({request, scope: 'lrs'});
  if (!budget.allowed) {
    return jsonResponse(
      {ok: false, error: {code: 'RATE_LIMITED'}},
      429,
      null,
      {'Retry-After': String(budget.retryAfterSeconds)},
    );
  }

  const body = await readBoundedJson(request);
  if (!body.ok) {
    return jsonResponse({ok: false, error: {code: body.code}}, body.code === 'PAYLOAD_TOO_LARGE' ? 413 : 400);
  }

  if (findProhibitedLearningEventField(body.value)) {
    return jsonResponse({ok: false, error: {code: 'PRIVACY_FIELD_FORBIDDEN'}}, 422);
  }

  const parsed = learningEventBatchSchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonResponse({ok: false, error: {code: 'VALIDATION_ERROR'}}, 422);
  }

  const loadedConfig = loadLrsConfig();
  if (!loadedConfig.ok) {
    return jsonResponse({ok: false, error: {code: 'LRS_NOT_CONFIGURED'}}, 503);
  }

  const token = request.headers.get(LEARNING_IDENTITY_HEADER);
  if (!token) {
    const identity = resolveAnonymousLearningActor({
      cookieHeader: request.headers.get('cookie'),
      hmacSecret: loadedConfig.config.actorHmacSecret,
      secureCookie: new URL(request.headers.get('origin')!).protocol === 'https:',
    });
    // Never write an event before the browser has durably selected a binding.
    // Lost or concurrent bootstrap responses therefore cannot commit actors.
    return jsonResponse({ok: false, identity: issueLearningIdentityBinding(
      identity.actor, loadedConfig.config.actorHmacSecret,
    )}, 202, identity.setCookieHeader);
  }
  const actor = verifyLearningIdentityBinding(
    token, loadedConfig.config.actorHmacSecret,
    parsed.data.events.map(event => event.occurredAt),
  );
  if (!actor) {
    // Keep pending events intact rather than silently rebinding their actor.
    return jsonResponse({ok: false, error: {code: 'IDENTITY_INVALID'}}, 503);
  }

  const results = await mapWithConcurrency(
    parsed.data.events,
    DELIVERY_CONCURRENCY,
    async (event) => deliverXapiStatement(
      loadedConfig.config,
      buildXapiStatement(event, actor),
    ),
  );
  const publicResults = results.map((result) => ({
    eventId: result.statementId,
    status: publicStatus(result),
    ...(!result.ok && result.kind === 'retryable' && result.retryAfterMs !== undefined
      ? {retryAfterMs: result.retryAfterMs}
      : {}),
  }));
  const allStored = results.every((result) => result.ok);
  const allRetryable = results.every((result) => !result.ok && result.kind === 'retryable');
  const status = allStored ? 200 : allRetryable ? 503 : 207;

  return jsonResponse(
    {ok: allStored, results: publicResults},
    status,
  );
}
