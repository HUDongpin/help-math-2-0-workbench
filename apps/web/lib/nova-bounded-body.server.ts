import 'server-only';

export type NovaBoundedBodyReadFailure =
  | 'too-large'
  | 'invalid-utf8'
  | 'stream';

/** Contains only a failure class and observed byte count, never body content. */
export class NovaBoundedBodyReadError extends Error {
  constructor(
    readonly failure: NovaBoundedBodyReadFailure,
    readonly bytesRead: number,
  ) {
    super(`Nova bounded body read failed: ${failure}`);
    this.name = 'NovaBoundedBodyReadError';
  }
}

export interface NovaBoundedUtf8Body {
  readonly bytesRead: number;
  readonly text: string;
}

/**
 * Read and decode a web body incrementally. The underlying stream is cancelled
 * as soon as the next chunk crosses the byte cap or contains invalid UTF-8.
 */
export async function readNovaBoundedUtf8Body(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<NovaBoundedUtf8Body> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
    throw new TypeError('Nova bounded body limit must be a non-negative integer');
  }
  if (!body) return Object.freeze({bytesRead: 0, text: ''});

  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8', {fatal: true});
  const textParts: string[] = [];
  let bytesRead = 0;
  try {
    while (true) {
      let result: ReadableStreamReadResult<Uint8Array>;
      try {
        result = await reader.read();
      } catch {
        throw new NovaBoundedBodyReadError('stream', bytesRead);
      }
      if (result.done) break;

      const chunk = result.value;
      const nextByteCount = bytesRead + chunk.byteLength;
      if (!Number.isSafeInteger(nextByteCount) || nextByteCount > maxBytes) {
        void reader.cancel().catch(() => undefined);
        throw new NovaBoundedBodyReadError('too-large', nextByteCount);
      }
      bytesRead = nextByteCount;
      try {
        textParts.push(decoder.decode(chunk, {stream: true}));
      } catch {
        void reader.cancel().catch(() => undefined);
        throw new NovaBoundedBodyReadError('invalid-utf8', bytesRead);
      }
    }
  } finally {
    reader.releaseLock();
  }

  try {
    textParts.push(decoder.decode());
  } catch {
    throw new NovaBoundedBodyReadError('invalid-utf8', bytesRead);
  }
  return Object.freeze({bytesRead, text: textParts.join('')});
}
