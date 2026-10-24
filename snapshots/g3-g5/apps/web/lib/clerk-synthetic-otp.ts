import {canonicalClerkDevelopmentFrontendHost} from './clerk-synthetic-key-binding';

const CLERK_SYNTHETIC_OTP_LENGTH = 6;

const verificationAttemptPathSuffixes = Object.freeze([
  '/attempt_verification',
  '/attempt_first_factor',
  '/attempt_second_factor',
] as const);

export type ClerkSyntheticOtpKeyEvent = Readonly<{
  code: string;
  key: string;
  location: 0;
  modifiers: 0;
  text?: string;
  type: 'keyDown' | 'keyUp';
  unmodifiedText?: string;
  windowsVirtualKeyCode: number;
}>;

export type ClerkSyntheticOtpKeystroke = Readonly<{
  keyDown: ClerkSyntheticOtpKeyEvent;
  keyUp: ClerkSyntheticOtpKeyEvent;
}>;

type ClerkSyntheticInternalCdpSession = Readonly<{
  _wrapApiCall: <T>(
    operation: () => Promise<T>,
    options: Readonly<{internal: true}>,
  ) => Promise<T>;
  send: (
    method: 'Input.dispatchKeyEvent' | 'Input.insertText',
    parameters: Readonly<Record<string, unknown>>,
  ) => Promise<unknown>;
}>;

/**
 * Produces the same key-down/key-up shape Chromium receives for physical
 * number-row typing. The caller sends these through a CDP session so the OTP
 * never reaches Playwright's value-bearing fill/type action metadata.
 */
export function clerkSyntheticOtpKeystrokes(
  code: string,
): readonly ClerkSyntheticOtpKeystroke[] {
  if (!/^\d{6}$/u.test(code) || code.length !== CLERK_SYNTHETIC_OTP_LENGTH) {
    throw new Error('Synthetic OTP key-event construction failed closed.');
  }

  return Object.freeze(Array.from(code, (digit) => {
    const virtualKeyCode = digit.codePointAt(0);
    if (virtualKeyCode === undefined) {
      throw new Error('Synthetic OTP key-event construction failed closed.');
    }
    const common = Object.freeze({
      code: `Digit${digit}`,
      key: digit,
      location: 0 as const,
      modifiers: 0 as const,
      windowsVirtualKeyCode: virtualKeyCode,
    });
    return Object.freeze({
      keyDown: Object.freeze({
        ...common,
        text: digit,
        type: 'keyDown' as const,
        unmodifiedText: digit,
      }),
      keyUp: Object.freeze({
        ...common,
        type: 'keyUp' as const,
      }),
    });
  }));
}

/**
 * Runs a sensitive CDP command inside Playwright's internal API zone. In the
 * pinned Playwright implementation this keeps the CDP parameters out of the
 * TestStep channel metadata while still using the existing browser session.
 */
export async function sendClerkSyntheticSensitiveCdp(
  session: unknown,
  method: 'Input.dispatchKeyEvent' | 'Input.insertText',
  parameters: Readonly<Record<string, unknown>>,
) {
  const candidate = session as Partial<ClerkSyntheticInternalCdpSession>;
  if (
    typeof candidate._wrapApiCall !== 'function'
    || typeof candidate.send !== 'function'
  ) {
    throw new Error('Synthetic sensitive-input boundary failed closed.');
  }
  const send = candidate.send;
  await candidate._wrapApiCall(
    async () => {
      await send.call(candidate, method, parameters);
    },
    {internal: true},
  );
}

/** Matches the three verification-attempt transitions used by Clerk's helper. */
export function isClerkSyntheticVerificationAttempt(
  method: string,
  requestUrl: string,
  frontendApi: string,
) {
  if (method !== 'POST') return false;
  let expectedHost: string;
  let request: URL;
  try {
    expectedHost = canonicalClerkDevelopmentFrontendHost(frontendApi);
    request = new URL(requestUrl);
  } catch {
    return false;
  }
  if (
    request.protocol !== 'https:'
    || request.hostname.toLowerCase().replace(/\.$/u, '') !== expectedHost
    || request.port.length > 0
    || request.username.length > 0
    || request.password.length > 0
  ) return false;
  return verificationAttemptPathSuffixes.some((suffix) =>
    request.pathname.endsWith(suffix));
}
