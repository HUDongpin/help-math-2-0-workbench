/** Raw cumulative block-count + signed-seek arithmetic, not a playback schedule
 * or an accepted Flash seek implementation. The full decode is untrimmed.
 * Player latency/seek semantics require separate validation; empty is not silence. */
export function p006SourceAudioCoordinate(frame: number):
  | {kind: 'no-block'; frame: number}
  | {kind: 'empty-block' | 'positive-block'; frame: number; sourceSample: number} {
  if (!Number.isInteger(frame) || frame < 1 || frame > 342) throw Error('P006_AUDIO_FRAME');
  if (frame < 3) return {kind: 'no-block', frame};
  if (frame === 4) return {kind: 'empty-block', frame, sourceSample: 3456};
  return {kind: 'positive-block', frame, sourceSample: frame === 3 ? 1673 : 3510 + (frame - 5) * 1837};
}
