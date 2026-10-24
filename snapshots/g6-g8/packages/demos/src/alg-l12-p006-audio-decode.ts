export const P006_AUDIO_SOURCE = {
  sha256: '801d34dc684341a2644a7fcc3373bea98cbc14bdf91f4364db0e37c30e7c1803',
  bytes: 140920,
  sampleRate: 22050,
  decodedSamples: 624384,
} as const;

/** Decode only the pinned P006 source stream; the caller owns loading and playback. */
export async function decodeP006Audio(context: BaseAudioContext, encoded: ArrayBuffer): Promise<AudioBuffer> {
  if (context.sampleRate !== P006_AUDIO_SOURCE.sampleRate) throw Error('P006_AUDIO_CONTEXT_RATE');
  if (encoded.byteLength !== P006_AUDIO_SOURCE.bytes) throw Error('P006_AUDIO_BYTES');

  // Snapshot before awaiting the digest so caller mutations cannot change the verified input.
  const verified = encoded.slice(0);
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', verified))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
  if (hash !== P006_AUDIO_SOURCE.sha256) throw Error('P006_AUDIO_HASH');

  const decoded = await context.decodeAudioData(verified.slice(0));
  if (decoded?.numberOfChannels !== 1 ||
      decoded.sampleRate !== P006_AUDIO_SOURCE.sampleRate ||
      decoded.length !== P006_AUDIO_SOURCE.decodedSamples) {
    throw Error('P006_AUDIO_DECODE');
  }
  return decoded;
}
