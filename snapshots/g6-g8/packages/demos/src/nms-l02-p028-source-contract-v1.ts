export interface P028Run {
  readonly sourceTextId: string;
  readonly text: string;
  readonly termId: string | null;
}
export interface P028Line {
  readonly characterId: number;
  readonly runs: readonly P028Run[];
}
export interface P028TeachingData {
  readonly animationId: string;
  readonly sourceSha256: string;
  readonly rootFrames: number;
  readonly mainFrames: number;
  readonly fps: number;
  readonly rootEntry: number;
  readonly title: string;
  readonly lines: readonly P028Line[];
  /** Flattened source-character reveal fractions for each line, in run order.
   * Fractions are horizontal glyph-bound intersections, not ink-area metrics. */
  readonly states: readonly (readonly (readonly number[])[])[];
  readonly frames: readonly number[];
  readonly gridAlpha: readonly number[];
}
