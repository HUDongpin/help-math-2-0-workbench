import {P029_AUDIO_SOURCE} from './nms-l02-p029-audio-source-v1';

export const P029_AUDIO_URL = '/flash-assets/g678-local/shared-nms002-l02-p029/source-audio'
  + '?sha256=' + P029_AUDIO_SOURCE.sourceSha256;

/** Same-origin bounded read; the playback engine independently verifies SHA-256. */
export async function readP029SourceAudio(signal: AbortSignal): Promise<ArrayBuffer> {
  const expected = new URL(P029_AUDIO_URL, location.origin);
  const response = await fetch(expected, {signal, cache: 'no-store', credentials: 'same-origin', redirect: 'error'});
  if (!response.ok || response.url !== expected.href || response.redirected
    || response.headers.get('content-type') !== 'audio/mpeg'
    || response.headers.get('content-length') !== String(P029_AUDIO_SOURCE.sourceBytes)) {
    throw Error('P029_AUDIO_RESPONSE');
  }
  const reader = response.body?.getReader();
  if (!reader) throw Error('P029_AUDIO_BODY');
  const bytes = new Uint8Array(P029_AUDIO_SOURCE.sourceBytes);
  let offset = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      if (offset + value.length > bytes.length) throw Error('P029_AUDIO_SIZE');
      bytes.set(value, offset); offset += value.length;
    }
    if (offset !== bytes.length) throw Error('P029_AUDIO_SIZE');
    return bytes.buffer;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
