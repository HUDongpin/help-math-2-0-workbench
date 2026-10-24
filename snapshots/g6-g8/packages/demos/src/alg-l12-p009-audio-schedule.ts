/** P009's full embedded MP3 stream. Separate SA audio is outside this schedule. */
export const P009_AUDIO_SOURCE = Object.freeze({
  sha256: '15e60f13aad0e2187db0b32f6bcfe65151001a1ded336abd4fb4eb59b3014f2e',
  bytes: 162_890,
  sampleRate: 22_050,
  numberOfChannels: 1,
  decodedSamples: 721_728,
} as const);

/** Continuous candidate derived from the source stream and the full decoded buffer.
 * Empty SWF MP3 blocks allocate packets; they do not insert silence. Latency is
 * skipped once. Original Flash seeking, listening and synchronization remain open.
 * The source has no terminal stop; holding frame 394 is an explicit modern policy.
 */
export const P009_AUDIO_SCHEDULE = Object.freeze({
  status: 'source-derived-continuous-candidate',
  sourceSha256: 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533',
  audioSha256: P009_AUDIO_SOURCE.sha256,
  fps: 12,
  frameCount: 394,
  samplesPerFrame: P009_AUDIO_SOURCE.sampleRate / 12,
  firstAudioFrame: 2,
  timelineStartSample: 1_837.5,
  sourceStartSample: 1_673,
  sourceEndSample: P009_AUDIO_SOURCE.decodedSamples,
  audioEndTimelineSample: 721_892.5,
  terminalTimelineSample: 722_137.5,
  terminalPolicy: 'modern-hold-last-authored-frame',
  sourceTerminalStop: false,
  originalRuntime: false,
  synchronizationAccepted: false,
  listeningAccepted: false,
  registered: false,
} as const);

export type P009AudioPosition =
  | {kind: 'active'; timelineSample: number; sourceSample: number; sourceEndSample: number}
  | {kind: 'preroll' | 'postroll' | 'terminal'; timelineSample: number};

export function frameToP009TimelineSample(frame: number): number {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > P009_AUDIO_SCHEDULE.frameCount)
    throw Error('P009_AUDIO_FRAME');
  return (frame - 1) * P009_AUDIO_SCHEDULE.samplesPerFrame;
}

export function resolveP009AudioSchedule(timelineSample: number): P009AudioPosition {
  if (!Number.isFinite(timelineSample) || timelineSample < 0 ||
    timelineSample > P009_AUDIO_SCHEDULE.terminalTimelineSample)
    throw Error('P009_AUDIO_TIMELINE_SAMPLE');
  if (timelineSample === P009_AUDIO_SCHEDULE.terminalTimelineSample)
    return {kind: 'terminal', timelineSample};
  if (timelineSample < P009_AUDIO_SCHEDULE.timelineStartSample)
    return {kind: 'preroll', timelineSample};
  if (timelineSample >= P009_AUDIO_SCHEDULE.audioEndTimelineSample)
    return {kind: 'postroll', timelineSample};
  return {kind: 'active', timelineSample,
    sourceSample: P009_AUDIO_SCHEDULE.sourceStartSample + timelineSample - P009_AUDIO_SCHEDULE.timelineStartSample,
    sourceEndSample: P009_AUDIO_SCHEDULE.sourceEndSample};
}

export function p009TimelineSampleToFrame(timelineSample: number): number {
  resolveP009AudioSchedule(timelineSample);
  return Math.min(P009_AUDIO_SCHEDULE.frameCount,
    1 + Math.floor(timelineSample / P009_AUDIO_SCHEDULE.samplesPerFrame + 1e-9));
}
