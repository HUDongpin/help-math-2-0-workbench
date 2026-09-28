import {createHmac, randomBytes} from 'node:crypto';

export const ANONYMOUS_LEARNING_ACTOR_COOKIE = 'hm_lrs_anon_v1';
export const ANONYMOUS_LEARNING_ACTOR_HOME_PAGE = 'https://www.helpmath.ai';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
const SEED_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export interface AnonymousLearningActor {
  readonly objectType: 'Agent';
  readonly account: {
    readonly homePage: typeof ANONYMOUS_LEARNING_ACTOR_HOME_PAGE;
    readonly name: string;
  };
}

export interface ResolvedAnonymousLearningActor {
  readonly actor: AnonymousLearningActor;
  readonly setCookieHeader: string | null;
}

function readCookie(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    if (name !== cookieName) continue;
    const value = part.slice(separator + 1).trim();
    return SEED_PATTERN.test(value) ? value : null;
  }
  return null;
}

export function buildAnonymousLearningActor(
  seed: string,
  hmacSecret: string,
): AnonymousLearningActor {
  if (!SEED_PATTERN.test(seed)) {
    throw new Error('Anonymous actor seed is invalid.');
  }
  if (Buffer.byteLength(hmacSecret, 'utf8') < 32) {
    throw new Error('Anonymous actor HMAC secret is too short.');
  }

  const digest = createHmac('sha256', hmacSecret)
    .update(`help-math-learning-actor-v1\0${seed}`, 'utf8')
    .digest('base64url');

  return Object.freeze({
    objectType: 'Agent' as const,
    account: Object.freeze({
      homePage: ANONYMOUS_LEARNING_ACTOR_HOME_PAGE,
      name: `anonymous-${digest}`,
    }),
  });
}

export function resolveAnonymousLearningActor(options: {
  cookieHeader: string | null;
  hmacSecret: string;
  secureCookie: boolean;
  createSeed?: () => string;
}): ResolvedAnonymousLearningActor {
  const existingSeed = readCookie(
    options.cookieHeader,
    ANONYMOUS_LEARNING_ACTOR_COOKIE,
  );
  const seed = existingSeed ?? (
    options.createSeed?.() ?? randomBytes(32).toString('base64url')
  );
  if (!SEED_PATTERN.test(seed)) {
    throw new Error('Generated anonymous actor seed is invalid.');
  }

  const setCookieHeader = existingSeed
    ? null
    : [
        `${ANONYMOUS_LEARNING_ACTOR_COOKIE}=${seed}`,
        'Path=/',
        `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
        'HttpOnly',
        'SameSite=Strict',
        ...(options.secureCookie ? ['Secure'] : []),
      ].join('; ');

  return {
    actor: buildAnonymousLearningActor(seed, options.hmacSecret),
    setCookieHeader,
  };
}
