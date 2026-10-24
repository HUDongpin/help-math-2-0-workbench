/** Exact native decode facts from the hash-bound P010 stream and Chromium. */
export const P010_AUDIO_SOURCE = Object.freeze({
  sha256: '2ab17de87e12c5f83c97ee15f95af50e5a9aa434977bfea970e60c087624482f',
  bytes: 189_020,
  sampleRate: 22_050,
  numberOfChannels: 1,
  decodedSamples: 837_504,
} as const);

/** Explicit modern engineering policy: play the entire native stream once from
 * the first source audio-block frame. Empty block11 inserts no silence. Preserve
 * all decoded samples: the head's 1673 seek/latency value alone does not establish
 * an initial browser trim. Keep the exact 22050/12 clock (not rounded1837).
 * Hold the final picture through the last authored frame, then stop. The source
 * child has no terminal stop. Original phase/seek/loop and listening are pending.
 */
export const P010_AUDIO_SCHEDULE = Object.freeze({
  status: 'source-bound-full-buffer-modern-candidate',
  sourceSha256: 'a846950547f7c3ab7b0445dfc2118d534565ffd352b6e9687ba8211e5d4a3fcd',
  audioSha256: P010_AUDIO_SOURCE.sha256,
  fps: 12,
  frameCount: 465,
  samplesPerFrame: P010_AUDIO_SOURCE.sampleRate / 12,
  firstAudioFrame: 10,
  timelineStartSample: 16_537.5,
  sourceStartSample: 0,
  sourceEndSample: P010_AUDIO_SOURCE.decodedSamples,
  audioEndTimelineSample: 854_041.5,
  terminalTimelineSample: 854_437.5,
  sourceHeadLatencySeekSamples: 1_673,
  initialLatencyTrimApplied: false,
  perBlockSeekReclockingApplied: false,
  terminalPolicy: 'modern-hold-last-authored-frame-through-full-frame-span',
  sourceTerminalStop: false,
  originalRuntime: false,
  synchronizationAccepted: false,
  listeningAccepted: false,
  registered: false,
} as const);

export type P010AudioPosition =
  | {kind: 'active'; timelineSample: number; sourceSample: number; sourceEndSample: number}
  | {kind: 'preroll' | 'postroll' | 'terminal'; timelineSample: number};

export function frameToP010TimelineSample(frame: number): number {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > P010_AUDIO_SCHEDULE.frameCount)
    throw Error('P010_AUDIO_FRAME');
  return (frame - 1) * P010_AUDIO_SCHEDULE.samplesPerFrame;
}

export function resolveP010AudioSchedule(timelineSample: number): P010AudioPosition {
  if (!Number.isFinite(timelineSample) || timelineSample < 0 ||
    timelineSample > P010_AUDIO_SCHEDULE.terminalTimelineSample)
    throw Error('P010_AUDIO_TIMELINE_SAMPLE');
  if (timelineSample === P010_AUDIO_SCHEDULE.terminalTimelineSample)
    return {kind: 'terminal', timelineSample};
  if (timelineSample < P010_AUDIO_SCHEDULE.timelineStartSample)
    return {kind: 'preroll', timelineSample};
  if (timelineSample >= P010_AUDIO_SCHEDULE.audioEndTimelineSample)
    return {kind: 'postroll', timelineSample};
  return {kind: 'active', timelineSample,
    sourceSample: timelineSample - P010_AUDIO_SCHEDULE.timelineStartSample,
    sourceEndSample: P010_AUDIO_SCHEDULE.sourceEndSample};
}

export function p010TimelineSampleToFrame(timelineSample: number): number {
  resolveP010AudioSchedule(timelineSample);
  return Math.min(P010_AUDIO_SCHEDULE.frameCount,
    1 + Math.floor(timelineSample / P010_AUDIO_SCHEDULE.samplesPerFrame + 1e-9));
}
