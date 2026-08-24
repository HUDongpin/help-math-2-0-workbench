import {randomUUID} from 'node:crypto';
import {NextResponse} from 'next/server';
import {
  NOVA_MAX_REQUEST_BYTES,
  novaTransportValidationIsTooLarge,
  novaTutorRequestSchema,
} from '@/lib/nova-request-schema';
import {
  NovaBoundedBodyReadError,
  readNovaBoundedUtf8Body,
} from '@/lib/nova-bounded-body.server';
import {
  NOVA_OPENROUTER_MODEL,
  NovaProviderError,
  requestNovaTutor,
} from '@/lib/nova-openrouter.server';
import {
  NovaFakeTransportConfigurationError,
  resolveNovaFullStackFakeFetch,
} from '@/lib/nova-full-stack-fake-transport.server';
import {
  NovaTutorRequestResolutionError,
  resolveNovaTutorRequest,
} from '@/lib/nova-request-resolver.server';
import {
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
  | 'NOVA_COURSE_NOT_AVAILABLE'
  | 'NOVA_FRAME_NOT_AVAILABLE'
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

function providerErrorDetails(error: NovaProviderError): Readonly<{
  status: number;
  code: NovaErrorCode;
  message: string;
}> {
  switch (error.failure) {
    case 'not-configured':
      return {
        status: 503,
        code: 'NOVA_NOT_CONFIGURED',
        message: 'Nova Tutor is not configured right now.',
      };
    case 'timeout':
      return {
        status: 504,
        code: 'NOVA_TIMEOUT',
        message: 'Nova Tutor took too long to respond. Please try again.',
      };
    case 'rate-limit':
      return {
        status: 429,
        code: 'NOVA_BUSY',
        message: 'Nova Tutor is busy right now. Please try again shortly.',
      };
    case 'unavailable':
    case 'invalid-response':
      return {
        status: 502,
        code: 'NOVA_UNAVAILABLE',
        message: 'Nova Tutor could not respond right now. Please try again.',
      };
  }
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const requestStartedAt = Date.now();
  const declaredLengthHeader = request.headers.get('content-length');
  let requestBytes = declaredLengthHeader && /^\d+$/.test(declaredLengthHeader)
    ? Number(declaredLengthHeader)
    : null;
  let requestMetadata: Readonly<{
    assessment: boolean | null;
    capability: 'text' | 'image' | 'voice' | null;
    framePresent: boolean | null;
    grade: number | null;
    lesson: number | null;
    locale: string | null;
    releaseId: string | null;
  }> = Object.freeze({
    assessment: null,
    capability: null,
    framePresent: null,
    grade: null,
    lesson: null,
    locale: null,
    releaseId: null,
  });
  const writeCompletionLog = ({
    attempts = null,
    failure = null,
    outcome,
    stage = null,
    status,
    upstreamStatus = null,
  }: {
    attempts?: number | null;
    failure?: string | null;
    outcome: 'success' | 'failure';
    stage?: string | null;
    status: number;
    upstreamStatus?: number | null;
  }) => {
    const fields = {
      event: outcome === 'success'
        ? 'nova_request_completed'
        : 'nova_request_failed',
      requestId,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null,
      releaseId: requestMetadata.releaseId,
      grade: requestMetadata.grade,
      lesson: requestMetadata.lesson,
      locale: requestMetadata.locale,
      assessment: requestMetadata.assessment,
      capability: requestMetadata.capability,
      framePresent: requestMetadata.framePresent,
      status,
      durationMs: Date.now() - requestStartedAt,
      attempts,
      failure,
      stage,
      upstreamStatus,
      model: NOVA_OPENROUTER_MODEL,
      requestBytes: Number.isSafeInteger(requestBytes) ? requestBytes : null,
    };
    if (outcome === 'success') {
      console.info('Nova Tutor request completed', fields);
    } else {
      console.warn('Nova Tutor request failed', fields);
    }
  };
  const fail = (
    status: number,
    code: NovaErrorCode,
    message: string,
    options: Readonly<{
      attempts?: number | null;
      failure?: string | null;
      headers?: HeadersInit;
      stage?: string | null;
      upstreamStatus?: number | null;
    }> = {},
  ) => {
    writeCompletionLog({
      attempts: options.attempts ?? null,
      failure: options.failure ?? code,
      outcome: 'failure',
      stage: options.stage ?? null,
      status,
      upstreamStatus: options.upstreamStatus ?? null,
    });
    return errorResponse(status, code, message, requestId, options.headers);
  };

  if (!isNovaTutorEnabled()) {
    return fail(
      503,
      'NOVA_NOT_CONFIGURED',
      'Nova Tutor is not configured right now.',
    );
  }

  if (!isSameOriginNovaRequest(request)) {
    return fail(403, 'ORIGIN_DENIED', 'This request is not allowed.');
  }

  const budget = consumeRequestBudget({request, scope: 'nova'});
  if (!budget.allowed) {
    return fail(
      429,
      'NOVA_BUSY',
      'Nova Tutor is busy right now. Please try again shortly.',
      {headers: {'Retry-After': String(budget.retryAfterSeconds)}},
    );
  }

  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim();
  if (contentType !== 'application/json') {
    return fail(
      400,
      'BAD_REQUEST',
      'The request body must be JSON.',
    );
  }

  const declaredLength = declaredLengthHeader;
  if (declaredLength) {
    if (!/^\d+$/.test(declaredLength)) {
      return fail(400, 'BAD_REQUEST', 'The request body is invalid.');
    }
    const size = Number(declaredLength);
    if (!Number.isSafeInteger(size) || size > NOVA_MAX_REQUEST_BYTES) {
      void request.body?.cancel().catch(() => undefined);
      return fail(
        413,
        'REQUEST_TOO_LARGE',
        'The Nova Tutor request is too large.',
      );
    }
  }

  let text: string;
  try {
    const boundedBody = await readNovaBoundedUtf8Body(
      request.body,
      NOVA_MAX_REQUEST_BYTES,
    );
    text = boundedBody.text;
    requestBytes = boundedBody.bytesRead;
  } catch (error) {
    if (
      error instanceof NovaBoundedBodyReadError &&
      error.failure === 'too-large'
    ) {
      requestBytes = error.bytesRead;
      return fail(
        413,
        'REQUEST_TOO_LARGE',
        'The Nova Tutor request is too large.',
      );
    }
    return fail(400, 'BAD_REQUEST', 'The request body is invalid.');
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return fail(400, 'BAD_REQUEST', 'The request body must be valid JSON.');
  }

  const parsed = novaTutorRequestSchema.safeParse(body);
  if (!parsed.success) {
    if (novaTransportValidationIsTooLarge(parsed.error)) {
      return fail(
        413,
        'REQUEST_TOO_LARGE',
        'The Nova Tutor request is too large.',
      );
    }
    return fail(
      422,
      'VALIDATION_ERROR',
      'The Nova Tutor request contains invalid lesson data.',
    );
  }
  requestMetadata = Object.freeze({
    assessment: parsed.data.context.assessment,
    // `speech-to-draft` is an untrusted, privacy-safe observability marker,
    // never an authorization input. The request still contains only confirmed
    // text; HELP Math never receives raw audio. `framePresent` independently
    // records a current-frame attachment when both capabilities are combined.
    capability: parsed.data.inputMethod === 'speech-to-draft'
      ? 'voice'
      : parsed.data.frame === undefined
        ? 'text'
        : 'image',
    framePresent: parsed.data.frame !== undefined,
    grade: parsed.data.context.grade,
    lesson: parsed.data.context.lesson,
    locale: parsed.data.locale,
    releaseId: parsed.data.context.releaseId,
  });

  try {
    const resolved = await resolveNovaTutorRequest(parsed.data);
    const fakeFetch = resolveNovaFullStackFakeFetch({
      request,
      requestId,
    });
    const result = await requestNovaTutor(
      resolved,
      fakeFetch ? {fetchImpl: fakeFetch} : undefined,
    );
    writeCompletionLog({
      attempts: result.attempts,
      failure: null,
      outcome: 'success',
      status: 200,
    });
    return json({
      ok: true,
      reply: result.reply,
      model: result.model,
      requestId,
    });
  } catch (error) {
    if (error instanceof NovaTutorRequestResolutionError) {
      switch (error.failure) {
        case 'not-configured':
          return fail(
            503,
            'NOVA_NOT_CONFIGURED',
            'Nova Tutor is not configured right now.',
            {failure: error.failure},
          );
        case 'course-not-available':
          return fail(
            409,
            'NOVA_COURSE_NOT_AVAILABLE',
            'Nova Tutor is not available for this course right now.',
            {failure: error.failure},
          );
        case 'frame-not-available':
          return fail(
            409,
            'NOVA_FRAME_NOT_AVAILABLE',
            'Current-page sharing is not available for this course right now.',
            {failure: error.failure},
          );
        case 'canonical-mismatch':
        case 'invalid-frame':
          return fail(
            422,
            'VALIDATION_ERROR',
            'The Nova Tutor request contains invalid lesson data.',
            {failure: error.failure},
          );
        case 'registry-unavailable':
          return fail(
            502,
            'NOVA_UNAVAILABLE',
            'Nova Tutor could not respond right now. Please try again.',
            {failure: error.failure},
          );
      }
    }
    if (error instanceof NovaProviderError) {
      const details = providerErrorDetails(error);
      return fail(
        details.status,
        details.code,
        details.message,
        {
          attempts: error.attempts,
          failure: error.failure,
          stage: error.stage,
          upstreamStatus: error.upstreamStatus ?? null,
        },
      );
    }
    if (error instanceof NovaFakeTransportConfigurationError) {
      return fail(
        503,
        'NOVA_NOT_CONFIGURED',
        'Nova Tutor is not configured right now.',
        {
          failure: `fake-transport-${error.reason}`,
          stage: 'configuration',
        },
      );
    }
    return fail(
      502,
      'NOVA_UNAVAILABLE',
      'Nova Tutor could not respond right now. Please try again.',
    );
  }
}
