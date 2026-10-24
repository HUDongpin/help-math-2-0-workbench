import {NextResponse} from 'next/server';
import {Resend} from 'resend';
import {contactRequestSchema} from '@/lib/contact-schema';
import {
  buildContactEmail,
  verifyTurnstile,
} from '@/lib/contact-route-support.server';

type ErrorCode =
  | 'CONTACT_DISABLED'
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'TURNSTILE_NOT_CONFIGURED'
  | 'TURNSTILE_FAILED'
  | 'EMAIL_NOT_CONFIGURED'
  | 'DELIVERY_FAILED';

interface ErrorBody {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

interface SuccessBody {
  ok: true;
}

const CONTACT_CONFIGURATION_KEYS = [
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
  'RESEND_API_KEY',
  'SUPPORT_TO_EMAIL',
  'SUPPORT_FROM_EMAIL',
] as const;

function contactFormIsEnabled() {
  return process.env.CONTACT_FORM_ENABLED === 'true' &&
    CONTACT_CONFIGURATION_KEYS.every((key) => Boolean(process.env[key]?.trim()));
}

function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>,
) {
  const body: ErrorBody = {
    ok: false,
    error: {
      code,
      message,
      ...(fieldErrors ? {fieldErrors} : {}),
    },
  };

  return NextResponse.json(body, {status});
}

function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || undefined;
}

export async function POST(request: Request) {
  // Keep the dormant contact integration closed unless its independent owner
  // authorization and every runtime dependency are explicitly present. This
  // check must remain before body parsing, bot handling, and all provider calls.
  if (!contactFormIsEnabled()) {
    return errorResponse(
      503,
      'CONTACT_DISABLED',
      'Contact submission is not available.',
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'BAD_REQUEST', 'The request body must be valid JSON.');
  }

  const parsed = contactRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(parsed.error.flatten().fieldErrors).filter(
        (entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].length > 0,
      ),
    );
    return errorResponse(
      422,
      'VALIDATION_ERROR',
      'One or more fields are invalid.',
      fieldErrors,
    );
  }

  // Do not reveal the trap to bots and do not verify or deliver their content.
  if (parsed.data.website) {
    const body: SuccessBody = {ok: true};
    return NextResponse.json(body);
  }

  const turnstile = await verifyTurnstile(parsed.data.turnstileToken, clientIp(request));
  if (turnstile === 'not-configured') {
    return errorResponse(
      503,
      'TURNSTILE_NOT_CONFIGURED',
      'Spam protection is not configured.',
    );
  }
  if (turnstile === 'failed') {
    return errorResponse(422, 'TURNSTILE_FAILED', 'Spam-protection verification failed.');
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.SUPPORT_TO_EMAIL?.trim();
  const from = process.env.SUPPORT_FROM_EMAIL?.trim();
  if (!apiKey || !to || !from) {
    return errorResponse(503, 'EMAIL_NOT_CONFIGURED', 'Message delivery is not configured.');
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send(buildContactEmail(parsed.data, from, to));

    if (result.error) {
      return errorResponse(502, 'DELIVERY_FAILED', 'The message could not be delivered.');
    }
  } catch {
    return errorResponse(502, 'DELIVERY_FAILED', 'The message could not be delivered.');
  }

  const success: SuccessBody = {ok: true};
  return NextResponse.json(success);
}
