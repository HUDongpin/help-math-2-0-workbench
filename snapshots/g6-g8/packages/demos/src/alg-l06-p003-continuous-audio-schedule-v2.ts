/** Natural continuous stream candidate, bound to the source v3 audit.
 * Packet-group boundaries are storage boundaries, not restart instructions. */
const sampleRate = 22050;
const decodedSamples = 1168128;
const initialSeekSamples = 1673;
const audioStartSeconds = 40 / 12;
export const ALG_L06_P003_CONTINUOUS_AUDIO = Object.freeze({
  version: 2,
  animationId: 'shared-alg001-l06-p003',
  sourceSwfSha256: 'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766',
  sourceSha256: '91ddead67e2e39640b4fe76493f9764959daba8dab40e0ac2036670103285111',
  sourceBytes: 263640,
  frameDomain: 'sprite-154', fps: 12, firstFrame: 1, lastFrame: 719,
  sampleRate, decodedSamples, initialSeekSamples, audioStartSeconds,
  audioEndSeconds: audioStartSeconds + (decodedSamples - initialSeekSamples) / sampleRate,
  measuredPcmSha256: 'd38495844b8b95c2c79bbd2f953bd12552924d7565c6c8c9cbd55eab0bfd131e',
  measuredDecoder: 'Chrome 153.0.8010.54; mono float32 little-endian; measured twice',
  measuredDecoderUserAgent: 'HeadlessChrome/153.0.0.0',
  measuredPcmReceiptSha256: '4b2c1419980d280204812b25b4547c46c220386db5f251e96a0dce42dd3da000',
  alignmentStatus: 'continuous-source-stream-candidate-not-original-runtime-accepted',
} as const);

/** Resume only from an owned elapsed position; arbitrary SWF frame seek is unsupported. */
export function algL06P003ContinuousAudioSliceFromSeconds(position: number) {
  const p = ALG_L06_P003_CONTINUOUS_AUDIO;
  if (!Number.isFinite(position) || position < 0 || position > (p.lastFrame - 1) / p.fps)
    throw Error('invalid-source-position');
  if (position >= p.audioEndSeconds) return null;
  const from = Math.max(position, p.audioStartSeconds);
  return Object.freeze({delaySeconds: Math.max(0, p.audioStartSeconds - position),
    firstDecodedSample: p.initialSeekSamples + (from - p.audioStartSeconds) * p.sampleRate,
    durationSeconds: p.audioEndSeconds - from});
}
