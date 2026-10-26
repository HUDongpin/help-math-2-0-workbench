export const P005_AUDIO_SOURCE = {
  sha256: '988a60d21db50f1b70babf7cd9503311c4635be8e46654c8bc6b27fbb26f50af',
  bytes: 597584,
  sampleRate: 44100,
  decodedSamples: 3309696,
} as const;

/** Decode only the pinned P005 source stream; the caller owns loading and playback. */
export async function decodeP005Audio(context: BaseAudioContext, encoded: ArrayBuffer): Promise<AudioBuffer> {
  if (context.sampleRate !== P005_AUDIO_SOURCE.sampleRate) throw Error('P005_AUDIO_CONTEXT_RATE');
  if (encoded.byteLength !== P005_AUDIO_SOURCE.bytes) throw Error('P005_AUDIO_BYTES');

  // Hash a snapshot so later caller changes cannot alter the bytes sent to the decoder.
  const verified = encoded.slice(0);
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', verified))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
  if (hash !== P005_AUDIO_SOURCE.sha256) throw Error('P005_AUDIO_HASH');

  const decoded = await context.decodeAudioData(verified.slice(0));
  if (decoded?.numberOfChannels !== 1 ||
      decoded.sampleRate !== P005_AUDIO_SOURCE.sampleRate ||
      decoded.length !== P005_AUDIO_SOURCE.decodedSamples) {
    throw Error('P005_AUDIO_DECODE');
  }
  return decoded;
}
