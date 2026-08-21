import {randomUUID} from 'node:crypto';
import {NextResponse} from 'next/server';
import {
  NOVA_MAX_REQUEST_BYTES,
  novaTutorRequestSchema,
} from '@/lib/nova-request-schema';
import {
  NOVA_OPENROUTER_MODEL,
  NovaProviderError,
  requestNovaTutor,
} from '@/lib/nova-openrouter.server';
import {
  isNovaFrameContextEnabled,
  isNovaTutorEnabled,
  isSameOriginNovaRequest,
} from '@/lib/nova-route-support.server';
import {consumeRequestBudget} from '@/lib/request-budget.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type NovaErrorCode =
  | 'BAD_REQUEST'
  | 'ORIGIN_DENIED'
  | 'REQUEST_TOO_LARGE'
  | 'VALIDATION_ERROR'
  | 'NOVA_NOT_CONFIGURED'
  | 'NOVA_TIMEOUT'
  | 'NOVA_BUSY'
  | 'NOVA_UNAVAILABLE';

const noStoreHeaders = Object.freeze({
  'cache-control': 'no-store, max-age=0',
});

function json(
  body: unknown,
  status = 200,
  additionalHeaders?: HeadersInit,
) {
  const headers = new Headers(noStoreHeaders);
  if (additionalHeaders) {
    new Headers(additionalHeaders).forEach((value, name) => headers.set(name, value));
  }
  return NextResponse.json(body, {status, headers});
}

function errorResponse(
  status: number,
  code: NovaErrorCode,
  message: string,
  requestId: string,
  headers?: HeadersInit,
) {
  return json({ok: false, error: {code, message}, requestId}, status, headers);
}

function providerErrorResponse(error: NovaProviderError, requestId: string) {
  switch (error.failure) {
    case 'not-configured':
      return errorResponse(
        503,
        'NOVA_NOT_CONFIGURED',
        'Nova Tutor is not configured right now.',
        requestId,
      );
    case 'timeout':
      return errorResponse(
        504,
        'NOVA_TIMEOUT',
        'Nova Tutor took too long to respond. Please try again.',
        requestId,
      );
    case 'rate-limit':
      return errorResponse(
        429,
        'NOVA_BUSY',
        'Nova Tutor is busy right now. Please try again shortly.',
        requestId,
      );
    case 'unavailable':
    case 'invalid-response':
      return errorResponse(
        502,
        'NOVA_UNAVAILABLE',
        'Nova Tutor could not respond right now. Please try again.',
        requestId,
      );
  }
}

export async function POST(request: Request) {
  const requestId = randomUUID();

  if (!isNovaTutorEnabled()) {
    return errorResponse(
      503,
      'NOVA_NOT_CONFIGURED',
      'Nova Tutor is not configured right now.',
      requestId,
    );
  }

  if (!isSameOriginNovaRequest(request)) {
    return errorResponse(403, 'ORIGIN_DENIED', 'This request is not allowed.', requestId);
  }

  const budget = consumeRequestBudget({request, scope: 'nova'});
  if (!budget.allowed) {
    return errorResponse(
      429,
      'NOVA_BUSY',
      'Nova Tutor is busy right now. Please try again shortly.',
      requestId,
      {'Retry-After': String(budget.retryAfterSeconds)},
    );
  }

  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim();
  if (contentType !== 'application/json') {
    return errorResponse(
      400,
      'BAD_REQUEST',
      'The request body must be JSON.',
      requestId,
    );
  }

  const declaredLength = request.headers.get('content-length');
  if (declaredLength) {
    const size = Number(declaredLength);
    if (!Number.isFinite(size) || size < 0 || size > NOVA_MAX_REQUEST_BYTES) {
      return errorResponse(
        413,
        'REQUEST_TOO_LARGE',
        'The Nova Tutor request is too large.',
        requestId,
      );
    }
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return errorResponse(400, 'BAD_REQUEST', 'The request body is invalid.', requestId);
  }
  if (new TextEncoder().encode(text).byteLength > NOVA_MAX_REQUEST_BYTES) {
    return errorResponse(
      413,
      'REQUEST_TOO_LARGE',
      'The Nova Tutor request is too large.',
      requestId,
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return errorResponse(400, 'BAD_REQUEST', 'The request body must be valid JSON.', requestId);
  }

  const parsed = novaTutorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      422,
      'VALIDATION_ERROR',
      'The Nova Tutor request contains invalid lesson data.',
      requestId,
    );
  }

  // A lesson frame is learner-derived image data. Its provider transfer needs
  // a separate, exact production opt-in from the text-only tutor feature.
  if (parsed.data.frame && !isNovaFrameContextEnabled()) {
    return errorResponse(
      503,
      'NOVA_NOT_CONFIGURED',
      'Nova Tutor is not configured right now.',
      requestId,
    );
  }

  const providerStartedAt = Date.now();
  try {
    const result = await requestNovaTutor(parsed.data);
    return json({ok: true, ...result, requestId});
  } catch (error) {
    if (error instanceof NovaProviderError) {
      console.warn('Nova Tutor provider request failed', {
        attempts: error.attempts,
        durationMs: Date.now() - providerStartedAt,
        failure: error.failure,
        model: NOVA_OPENROUTER_MODEL,
        requestId,
        stage: error.stage,
        upstreamStatus: error.upstreamStatus ?? null,
      });
      return providerErrorResponse(error, requestId);
    }
    return errorResponse(
      502,
      'NOVA_UNAVAILABLE',
      'Nova Tutor could not respond right now. Please try again.',
      requestId,
    );
  }
}
