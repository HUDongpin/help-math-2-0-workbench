/** Hash-bound facts from audio-source-v1/raw-index.json. Both domains are
 * independent MP3 streams in VB/L12VB07.swf, not the separate SA sidecar. */
export const P012_AUDIO_SOURCE = Object.freeze({
  swfSha256: 'b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa',
  sampleRate: 22_050,
  channels: 1,
  fps: 12,
  main: Object.freeze({sha256: '6aaddb1bfc319127e85b94dcfce407765eeb3f0275f42830bdeaff4aaa4cb21a',
    bytes: 37_180, decodedSamples: 164_736, firstFrame: 30, lastFrame: 119,
    headLatencySeekSamples: 1_673, emptyPayloadFrames: [31] as const}),
  coach: Object.freeze({sha256: 'e551e71005de2df6e95d44ca10fba65b6ae0131032336e67b2609c71b798e8cf',
    bytes: 21_840, decodedSamples: 96_768, firstFrame: 3, lastFrame: 55,
    headLatencySeekSamples: 1_673, emptyPayloadFrames: [4] as const}),
} as const);

export const P012_SAMPLES_PER_FRAME = P012_AUDIO_SOURCE.sampleRate / P012_AUDIO_SOURCE.fps;
export const P012_MAIN_AUDIO_SCHEDULE = Object.freeze({
  status: 'source-bound-full-buffer-modern-candidate',
  firstAudioFrame: 30,
  interactiveFrame: 119,
  timelineStartSample: 53_287.5,
  interactiveEntrySample: 216_825,
  audioEndTimelineSample: 218_023.5,
  terminalTimelineSample: 218_662.5,
  sourceStartSample: 0,
  sourceEndSample: P012_AUDIO_SOURCE.main.decodedSamples,
  initialLatencyTrimApplied: false,
  perBlockSeekReclockingApplied: false,
  emptyBlockSilenceInserted: false,
  sourceStopAtInteractiveFrame: true,
  /** Preserve all decoded samples even though 1,198.5 extend past entry119. */
  modernTailPolicy: 'hold-interactive-frame-through-buffer-eof-and-frame-end',
  originalRuntime: false,
  synchronizationAccepted: false,
  listeningAccepted: false,
} as const);

/** The return frames execute gotoAndStop(1); _parent.enableButton(). Their own
 * SoundStreamBlocks are included in this candidate sample window: with the
 * spec's seek/latency rule, their inclusion matches the branch frame clock
 * within 76-217 samples, whereas excluding them leaves ~1800-2200 missing.
 * This is a source-supported inference, not executed tag/action ordering.
 * Full MP3 decoding precedes sample-window seeking to retain decoder history.
 * SWF v19, Streaming sound / Frame subdivision, pp. 182-186. */
export const P012_COACH_AUDIO_BRANCHES = Object.freeze({
  S1: Object.freeze({label: 'S1', firstFrame: 3, returnFrame: 16,
    sourceStartSample: 0, sourceReturnSample: 23_616, sourceReturnBlockEndSample: 25_344,
    firstSeekSamples: 1_673, returnSeekSamples: 101}),
  S2: Object.freeze({label: 'S2', firstFrame: 18, returnFrame: 27,
    sourceStartSample: 27_072, sourceReturnSample: 43_776, sourceReturnBlockEndSample: 45_504,
    firstSeekSamples: 319, returnSeekSamples: 148}),
  S3: Object.freeze({label: 'S3', firstFrame: 31, returnFrame: 36,
    sourceStartSample: 51_264, sourceReturnSample: 59_904, sourceReturnBlockEndSample: 62_208,
    firstSeekSamples: 8, returnSeekSamples: 553}),
  S4: Object.freeze({label: 'S4', firstFrame: 40, returnFrame: 54,
    sourceStartSample: 67_392, sourceReturnSample: 93_312, sourceReturnBlockEndSample: 95_040,
    firstSeekSamples: 413, returnSeekSamples: 211}),
} as const);

export type P012CoachAudioLabel = keyof typeof P012_COACH_AUDIO_BRANCHES;

export function frameToP012TimelineSample(frame: number): number {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 119) throw Error('P012_AUDIO_FRAME');
  return (frame - 1) * P012_SAMPLES_PER_FRAME;
}

export function p012TimelineSampleToFrame(sample: number): number {
  if (!Number.isFinite(sample) || sample < 0 || sample > P012_MAIN_AUDIO_SCHEDULE.terminalTimelineSample)
    throw Error('P012_AUDIO_TIMELINE_SAMPLE');
  return Math.min(119, 1 + Math.floor(sample / P012_SAMPLES_PER_FRAME + 1e-9));
}

export function resolveP012MainAudio(sample: number):
  {kind: 'preroll' | 'active' | 'postroll' | 'terminal'; sourceSample?: number} {
  p012TimelineSampleToFrame(sample);
  if (sample === P012_MAIN_AUDIO_SCHEDULE.terminalTimelineSample) return {kind: 'terminal'};
  if (sample < P012_MAIN_AUDIO_SCHEDULE.timelineStartSample) return {kind: 'preroll'};
  if (sample >= P012_MAIN_AUDIO_SCHEDULE.audioEndTimelineSample) return {kind: 'postroll'};
  return {kind: 'active', sourceSample: sample - P012_MAIN_AUDIO_SCHEDULE.timelineStartSample};
}

export function resolveP012CoachBranch(label: P012CoachAudioLabel) {
  const branch = P012_COACH_AUDIO_BRANCHES[label];
  if (!branch) throw Error('P012_AUDIO_COACH_LABEL');
  const clockDurationSamples = (branch.returnFrame - branch.firstFrame) * P012_SAMPLES_PER_FRAME;
  // First block's SeekSamples is the latency; later goto targets add latency.
  const effectiveSeekSamples = branch.firstFrame === P012_AUDIO_SOURCE.coach.firstFrame ?
    branch.firstSeekSamples : branch.firstSeekSamples + P012_AUDIO_SOURCE.coach.headLatencySeekSamples;
  const playbackStartSample = branch.sourceStartSample + effectiveSeekSamples;
  const sourceDurationSamples = branch.sourceReturnBlockEndSample - playbackStartSample;
  return Object.freeze({...branch, effectiveSeekSamples, playbackStartSample,
    playbackEndSample: branch.sourceReturnBlockEndSample,
    clockDurationSamples, sourceDurationSamples,
    scheduledDurationSamples: Math.min(clockDurationSamples, sourceDurationSamples),
    sourceOverhangSamples: Math.max(0, sourceDurationSamples - clockDurationSamples),
    sourceUnderrunSamples: Math.max(0, clockDurationSamples - sourceDurationSamples)});
}

export function p012CoachElapsedToFrame(label: P012CoachAudioLabel, elapsedSamples: number): number {
  const branch = resolveP012CoachBranch(label);
  if (!Number.isFinite(elapsedSamples) || elapsedSamples < 0) throw Error('P012_AUDIO_COACH_ELAPSED');
  if (elapsedSamples >= branch.clockDurationSamples) return 1;
  return Math.min(branch.returnFrame - 1,
    branch.firstFrame + Math.floor(elapsedSamples / P012_SAMPLES_PER_FRAME + 1e-9));
}
