import type {ContactRequest} from './contact-schema';

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export const DEVELOPMENT_TURNSTILE_TOKEN = 'development-bypass';

interface TurnstileResult {
  success?: boolean;
  action?: string;
  'error-codes'?: string[];
}

export async function verifyTurnstile(
  token: string,
  remoteIp: string | undefined,
): Promise<'verified' | 'not-configured' | 'failed'> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    if (
      process.env.NODE_ENV !== 'production'
      && token === DEVELOPMENT_TURNSTILE_TOKEN
    ) return 'verified';
    return 'not-configured';
  }

  try {
    const body = new URLSearchParams({secret, response: token});
    if (remoteIp) body.set('remoteip', remoteIp);
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body,
      headers: {'content-type': 'application/x-www-form-urlencoded'},
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return 'failed';
    const result = (await response.json()) as TurnstileResult;
    return result.success === true && result.action === 'contact'
      ? 'verified'
      : 'failed';
  } catch {
    return 'failed';
  }
}

function emailText(payload: ContactRequest) {
  return [
    'HELP Math website contact request',
    '',
    `Locale: ${payload.locale}`,
    `Role: ${payload.role}`,
    `Topic: ${payload.topic}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Organization: ${payload.organization || 'Not provided'}`,
    '',
    'Message:',
    payload.message,
    '',
    'The sender affirmed the contact-form privacy statement.',
  ].join('\n');
}

export function buildContactEmail(
  payload: ContactRequest,
  from: string,
  to: string,
) {
  return {
    from,
    to: [to],
    replyTo: payload.email,
    subject: `HELP Math: ${payload.topic}`,
    text: emailText(payload),
  };
}
