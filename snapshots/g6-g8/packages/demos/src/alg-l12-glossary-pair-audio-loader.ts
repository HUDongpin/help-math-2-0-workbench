export interface PairVerifiedAudioAsset {
  readonly path: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly sampleRate: number;
  readonly channels: number;
  readonly decodedSamples: number;
}

export function pairAudioOrigin(origin: string): string {
  const parsed = new URL(origin);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin ||
    parsed.username || parsed.password) throw Error('PAIR_AUDIO_ORIGIN');
  return parsed.origin;
}

/** Bounded same-origin input and native decode validation shared by the main
 * stream and the separate user-triggered SA track. */
export async function loadVerifiedPairAudio(asset: PairVerifiedAudioAsset, origin: string,
  context: BaseAudioContext, signal: AbortSignal, current: () => boolean,
  fetcher: typeof globalThis.fetch = globalThis.fetch): Promise<AudioBuffer | null> {
  if (context.sampleRate !== asset.sampleRate) throw Error('PAIR_AUDIO_CONTEXT_RATE');
  const url = new URL(asset.path, pairAudioOrigin(origin)).href;
  const response = await fetcher(url, {signal, mode: 'same-origin',
    credentials: 'same-origin', redirect: 'error', cache: 'no-store'});
  if (!current()) return null;
  if (response.status !== 200 || response.redirected || response.url !== url ||
    response.type === 'opaque' || response.type === 'opaqueredirect' ||
    response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'audio/mpeg' ||
    !response.body) throw Error('PAIR_AUDIO_RESPONSE');
  const length = response.headers.get('content-length');
  if (length !== null && length !== String(asset.bytes)) throw Error('PAIR_AUDIO_BYTES');
  const encoded = new Uint8Array(asset.bytes);
  const reader = response.body.getReader();
  let offset = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (!current()) { await reader.cancel(); return null; }
      if (done) break;
      if (value.byteLength > asset.bytes - offset) throw Error('PAIR_AUDIO_BYTES');
      encoded.set(value, offset);
      offset += value.byteLength;
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {reader.releaseLock();}
  if (offset !== asset.bytes) throw Error('PAIR_AUDIO_BYTES');
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  if (!current()) return null;
  const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  if (hash !== asset.sha256) throw Error('PAIR_AUDIO_HASH');
  const decoded = await context.decodeAudioData(encoded.buffer);
  if (!current()) return null;
  if (decoded.sampleRate !== asset.sampleRate || decoded.numberOfChannels !== asset.channels ||
    decoded.length !== asset.decodedSamples) throw Error('PAIR_AUDIO_DECODE');
  for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
    const samples = decoded.getChannelData(channel);
    if (samples.length !== asset.decodedSamples || !samples.every(Number.isFinite))
      throw Error('PAIR_AUDIO_DECODE');
  }
  return decoded;
}
