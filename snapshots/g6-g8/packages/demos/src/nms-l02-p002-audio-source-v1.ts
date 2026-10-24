/** SWF SoundStreamHead2/Block data and two independent Chromium decodes.
 * No spoken-language or original-runtime listening acceptance is asserted. */
export const P002_AUDIO_SOURCE = Object.freeze({
  sourceSha256: '7ebbf9e4485ca278e38cca90125c95cc7a7a450031aab39be070d1d684ecf6d6',
  sourceBytes: 361010,
  sampleRate: 22050,
  channels: 1,
  decodedSamples: 1599552,
  latencySamples: 1673,
  firstBlockFrame: 30,
  // Nearest integer sample to the source's 29-frame lead-in (53287.5).
  startOffsetSamples: 53288,
  cycleSamples: 1672125,
  fps: 12,
  frames: 910,
  language: 'und',
} as const);
