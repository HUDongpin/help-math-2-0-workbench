/** Hash-bound P013/P015 embedded and independent SA MP3 facts. The embedded
 * streams are raw SoundStreamBlock payload concatenations, decoded to EOF.
 * Source seek fields are retained in the raw index, not applied here. */
const make = (source: {
  animationId: string; swfSha256: string; frameDomain: string; frameCount: number;
  firstAudioFrame: number; lastAudioBlockFrame: number; mainSha256: string;
  mainBytes: number; mainDecodedSamples: number; negativeSeekFrames: readonly number[];
  emptyPayloadFrames: readonly number[]; saSha256: string; saBytes: number;
  saDecodedSamples: number;
}) => Object.freeze({
  ...source,
  sampleRate: 22_050,
  channels: 1,
  fps: 12,
  samplesPerFrame: 22_050 / 12,
  timelineStartSample: (source.firstAudioFrame - 1) * (22_050 / 12),
  audioEndTimelineSample: (source.firstAudioFrame - 1) * (22_050 / 12) + source.mainDecodedSamples,
  terminalTimelineSample: source.frameCount * (22_050 / 12),
  sourceStartSample: 0,
  sourceEndSample: source.mainDecodedSamples,
  headLatencySeekSamples: 1_673,
  initialLatencyTrimApplied: false,
  perBlockSeekReclockingApplied: false,
  emptyBlockSilenceInserted: false,
  terminalPolicy: 'modern-hold-last-authored-frame-through-full-span',
  originalRuntime: false,
  synchronizationAccepted: false,
  listeningAccepted: false,
  registered: false,
  mainUrl: `/flash-assets/g678-local/${source.animationId}/main.mp3?sha256=${source.mainSha256}`,
  saUrl: `/flash-assets/g678-local/${source.animationId}/spanish-audio.mp3?sha256=${source.saSha256}`,
  saSampleRate: 48_000,
  saChannels: 1,
  saDurationSeconds: source.saDecodedSamples / 48_000,
  status: 'source-bound-full-buffer-modern-candidate',
} as const);

export const ALG_L12_GLOSSARY_PAIR_AUDIO = Object.freeze({
  p013: make({animationId: 'shared-alg001-l12-p013',
    swfSha256: '056fb04850a10cd8888112e4c4fe5730bf475e559f0904b7841545c099536424',
    frameDomain: 'sprite-63', frameCount: 372, firstAudioFrame: 2, lastAudioBlockFrame: 365,
    mainSha256: 'de89db3cb7d52ffad3ee3284746e923aa2a86e0f58178f7822105d02a77fe525',
    mainBytes: 150_410, mainDecodedSamples: 666_432,
    negativeSeekFrames: [365], emptyPayloadFrames: [3, 365],
    saSha256: '6a9c37d04b72b96753afba7e1f4f2583dafe9a35727faf9f350f034e1e093f76',
    saBytes: 248_640, saDecodedSamples: 852_480}),
  p015: make({animationId: 'shared-alg001-l12-p015',
    swfSha256: 'b14f5cec27090f38053e46ea7ef90beaeabab75a6aabe278955477e34bcc68c4',
    frameDomain: 'sprite-76', frameCount: 474, firstAudioFrame: 3, lastAudioBlockFrame: 474,
    mainSha256: 'a9732002266a2c0b97656775787bf83b6dddf9449a0f465889e05ee44a449b9c',
    mainBytes: 195_650, mainDecodedSamples: 866_880,
    negativeSeekFrames: [], emptyPayloadFrames: [4],
    saSha256: '38d5bc99348053895392ab922dfa10517e993c68479f964c9a938244245e9a30',
    saBytes: 109_200, saDecodedSamples: 374_400}),
});

export type AlgL12GlossaryPairAudioConfig =
  typeof ALG_L12_GLOSSARY_PAIR_AUDIO[keyof typeof ALG_L12_GLOSSARY_PAIR_AUDIO];

export function pairFrameToTimelineSample(config: AlgL12GlossaryPairAudioConfig, frame: number): number {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > config.frameCount) throw Error('PAIR_AUDIO_FRAME');
  return (frame - 1) * config.samplesPerFrame;
}

export function pairTimelineSampleToFrame(config: AlgL12GlossaryPairAudioConfig, sample: number): number {
  if (!Number.isFinite(sample) || sample < 0 || sample > config.terminalTimelineSample)
    throw Error('PAIR_AUDIO_TIMELINE_SAMPLE');
  return Math.min(config.frameCount, 1 + Math.floor(sample / config.samplesPerFrame + 1e-9));
}

export function resolvePairMainAudio(config: AlgL12GlossaryPairAudioConfig, timelineSample: number):
  {kind: 'preroll' | 'active' | 'postroll' | 'terminal'; sourceSample?: number} {
  pairTimelineSampleToFrame(config, timelineSample);
  if (timelineSample === config.terminalTimelineSample) return {kind: 'terminal'};
  if (timelineSample < config.timelineStartSample) return {kind: 'preroll'};
  if (timelineSample >= config.audioEndTimelineSample) return {kind: 'postroll'};
  return {kind: 'active', sourceSample: timelineSample - config.timelineStartSample};
}
