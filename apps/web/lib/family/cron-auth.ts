import {timingSafeEqual} from 'node:crypto';

/** Compare a Vercel Cron bearer credential without an early-exit byte scan. */
export function matchesFamilyCronBearer(
  authorizationHeader: string | null,
  configuredSecret: string | undefined,
) {
  const secret = configuredSecret?.trim();
  if (!secret || !authorizationHeader?.startsWith('Bearer ')) return false;
  const supplied = authorizationHeader.slice('Bearer '.length);
  const expectedBytes = Buffer.from(secret, 'utf8');
  const suppliedBytes = Buffer.from(supplied, 'utf8');
  return expectedBytes.length === suppliedBytes.length
    && timingSafeEqual(expectedBytes, suppliedBytes);
}
