import {P005_AUDIO_SOURCE} from './alg-l12-p005-audio-decode';

/** Deliberately unregistered hypothesis. See AUDIO_SCHEDULE_CANDIDATE_SPEC_2026-09-26.md.
 * Continuous sample windows are NOT the SWF per-block direct-seek coordinates.
 * No empirically fitted Ruffle delay, inferred silent asset, or host activation. */
export const P005_AUDIO_SCHEDULE = Object.freeze({
  status: 'source-derived-inferred-continuous-schedule',
  sourceSha256: 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe',
  audioSha256: P005_AUDIO_SOURCE.sha256,
  sampleRate: 44100,
  fps: 12,
  samplesPerFrame: 3675,
  terminalTimelineSample: 967 * 3675,
  originalRuntime: false,
  synchronizationAccepted: false,
  registered: false,
} as const);

export const P005_AUDIO_RUNS = Object.freeze([
  Object.freeze({group: 1, firstFrame: 23, timelineStartSample: 22 * 3675,
    sourceStartSample: 1695, sourceEndSample: 1158912}),
  Object.freeze({group: 2, firstFrame: 384, timelineStartSample: 383 * 3675,
    sourceStartSample: 1158912 + 1047, sourceEndSample: 3309696}),
] as const);

export type P005AudioPosition =
  | {kind: 'active'; timelineSample: number; group: 1 | 2; sourceSample: number; sourceEndSample: number}
  | {kind: 'preroll' | 'gap' | 'terminal'; timelineSample: number};

/** Integer timeline samples avoid fractional frame boundary rounding. A caller
 * seeking the modern inspector queries this model, not legacy seek semantics. */
export function resolveP005AudioSample(timelineSample: number): P005AudioPosition {
  const terminal = P005_AUDIO_SCHEDULE.terminalTimelineSample;
  if (!Number.isSafeInteger(timelineSample) || timelineSample < 0 || timelineSample > terminal)
    throw Error('P005_AUDIO_TIMELINE_SAMPLE');
  if (timelineSample === terminal) return {kind: 'terminal', timelineSample};
  for (const run of P005_AUDIO_RUNS) {
    const end = Math.min(run.sourceEndSample,
      run.sourceStartSample + terminal - run.timelineStartSample);
    const offset = timelineSample - run.timelineStartSample;
    if (offset >= 0 && run.sourceStartSample + offset < end)
      return {kind: 'active', timelineSample, group: run.group,
        sourceSample: run.sourceStartSample + offset, sourceEndSample: end};
  }
  return {kind: timelineSample < P005_AUDIO_RUNS[0].timelineStartSample ? 'preroll' : 'gap', timelineSample};
}

export function resolveP005AudioFrame(frame: number): P005AudioPosition {
  if (!Number.isInteger(frame) || frame < 1 || frame > 968) throw Error('P005_AUDIO_FRAME');
  return resolveP005AudioSample((frame - 1) * P005_AUDIO_SCHEDULE.samplesPerFrame);
}
