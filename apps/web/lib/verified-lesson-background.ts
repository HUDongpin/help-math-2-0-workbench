export class LessonBackgroundError extends Error {
  constructor(readonly kind: 'load' | 'integrity') {
    super(`Lesson background ${kind} verification failed.`);
  }
}

/** Verify the bytes we display, independently of a browser's SVG sizing. */
export async function loadVerifiedLessonBackground(
  source: string,
  expectedSha256: string,
  signal: AbortSignal,
): Promise<Blob> {
  if (!/^[a-f0-9]{64}$/.test(expectedSha256)) {
    throw new LessonBackgroundError('integrity');
  }
  for (let attempt = 0; attempt < 2; attempt += 1) {
    signal.throwIfAborted();
    const request = new AbortController();
    const abort = () => request.abort();
    signal.addEventListener('abort', abort, {once: true});
    const timeout = setTimeout(abort, 15_000);
    try {
      const response = await fetch(source, {
        cache: attempt === 0 ? 'default' : 'reload',
        credentials: 'same-origin',
        redirect: 'error',
        signal: request.signal,
      });
      if (!response.ok) throw new LessonBackgroundError('load');
      const bytes = await response.arrayBuffer();
      signal.throwIfAborted();
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      signal.throwIfAborted();
      const actual = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, '0')).join('');
      if (actual !== expectedSha256) {
        throw new LessonBackgroundError('integrity');
      }
      return new Blob([bytes], {type: 'image/svg+xml'});
    } catch (error) {
      signal.throwIfAborted();
      // Never retry or render mismatched bytes. A temporary transport failure
      // gets one fresh request, with the same source URL and expected digest.
      if (error instanceof LessonBackgroundError && error.kind === 'integrity') {
        throw error;
      }
      if (attempt === 1) throw new LessonBackgroundError('load');
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
    }
  }
  throw new LessonBackgroundError('load');
}
