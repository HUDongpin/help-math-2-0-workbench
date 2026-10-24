import {P054_FEEDBACK_AUDIO, p054FeedbackAudioUrl,
  type P054FeedbackKind} from './nms-l02-p054-feedback-audio-v1';

/** Bounded same-origin fetch and whole-file hash check before browser playback. */
export async function loadP054FeedbackAudio(kind: P054FeedbackKind, signal: AbortSignal): Promise<Blob> {
  signal.throwIfAborted();
  const source = P054_FEEDBACK_AUDIO[kind];
  const url = new URL(p054FeedbackAudioUrl(kind), location.origin);
  const response = await fetch(url, {signal, cache: 'no-store', credentials: 'same-origin',
    redirect: 'error'});
  signal.throwIfAborted();
  if (response.status !== 200 || response.url !== url.href || response.redirected ||
      response.headers.get('content-type') !== 'audio/mpeg' ||
      response.headers.get('content-length') !== String(source.bytes)) {
    throw new Error('P054 feedback audio response mismatch');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('P054 feedback audio body missing');
  const bytes = new Uint8Array(source.bytes);
  let offset = 0;
  try {
    for (;;) {
      signal.throwIfAborted();
      const {done, value} = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      if (offset + value.length > bytes.length) throw new Error('P054 feedback audio too large');
      bytes.set(value, offset);
      offset += value.length;
    }
    if (offset !== bytes.length) throw new Error('P054 feedback audio too short');
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    const hash = [...digest].map(value => value.toString(16).padStart(2, '0')).join('');
    signal.throwIfAborted();
    if (hash !== source.sha256) throw new Error('P054 feedback audio hash mismatch');
    return new Blob([bytes], {type: 'audio/mpeg'});
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
