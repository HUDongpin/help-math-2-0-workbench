import {P006_AUDIO_SOURCE} from './alg-l12-p006-audio-decode';

/** SWF19 continuous-stream policy; still unregistered, not original-runtime acceptance.
 * Empty MP3 blocks are packet allocation, not a command to insert silence.
 * See evidence/AUDIO_CONTINUOUS_CORRECTION_2026-09-27.md in the migration. */
export const P006_AUDIO_SCHEDULE = Object.freeze({
  status: 'source-derived-continuous-candidate',
  sourceSha256: '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6',
  audioSha256: P006_AUDIO_SOURCE.sha256,
  sampleRate: P006_AUDIO_SOURCE.sampleRate,
  fps: 12,
  samplesPerFrame: P006_AUDIO_SOURCE.sampleRate / 12,
  audioEndTimelineSample: 626_386,
  terminalTimelineSample: 626_587.5,
  originalRuntime: false,
  synchronizationAccepted: false,
  registered: false,
} as const);

export const P006_AUDIO_RUNS = Object.freeze([
  Object.freeze({group: 1, firstFrame: 3, timelineStartSample: 3_675,
    sourceStartSample: 1_673, sourceEndSample: P006_AUDIO_SOURCE.decodedSamples}),
] as const);

export type P006AudioPosition =
  | {kind: 'active'; timelineSample: number; group: 1; sourceSample: number; sourceEndSample: number}
  | {kind: 'preroll' | 'postroll' | 'terminal'; timelineSample: number};

/** Timeline coordinates may contain half samples (frame 342 is 626587.5). */
export function frameToTimelineSample(frame: number): number {
  if (!Number.isInteger(frame) || frame < 1 || frame > 342) throw Error('P006_AUDIO_FRAME');
  return (frame - 1) * P006_AUDIO_SCHEDULE.samplesPerFrame;
}

export function resolveSchedule(timelineSample: number): P006AudioPosition {
  if (!Number.isFinite(timelineSample) || timelineSample < 0 ||
      timelineSample > P006_AUDIO_SCHEDULE.terminalTimelineSample)
    throw Error('P006_AUDIO_TIMELINE_SAMPLE');
  if (timelineSample === P006_AUDIO_SCHEDULE.terminalTimelineSample)
    return {kind: 'terminal', timelineSample};
  for (const run of P006_AUDIO_RUNS) {
    const offset = timelineSample - run.timelineStartSample;
    if (offset >= 0 && offset < run.sourceEndSample - run.sourceStartSample)
      return {kind: 'active', timelineSample, group: run.group,
        sourceSample: run.sourceStartSample + offset, sourceEndSample: run.sourceEndSample};
  }
  return {kind: timelineSample < P006_AUDIO_RUNS[0].timelineStartSample ? 'preroll' : 'postroll', timelineSample};
}

/** The full decoded audio ends just before the last authored visual frame. */
export function timelineSampleToFrame(timelineSample: number): number {
  resolveSchedule(timelineSample);
  return Math.min(342, Math.floor(timelineSample * 12 / P006_AUDIO_SOURCE.sampleRate + 1e-9) + 1);
}
