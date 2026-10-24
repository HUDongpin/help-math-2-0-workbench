import {P006_HIT_SPEC} from './generated/alg-l12-p006-hit-spec';

export interface P006CandidateHitRegion {
  readonly characterId: number;
  readonly rect: readonly [number, number, number, number];
}

/** Source-derived rectangular intersections, not original-host hit-test acceptance.
 * Coordinates are native 800x600 pixels; the host must map responsive pointer coordinates.
 */
export function p006CandidateHitRegions(frame: number): readonly P006CandidateHitRegion[] {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 342) return [];
  return P006_HIT_SPEC.frames[frame - 1].map(hit => ({
    characterId: hit.characterId,
    rect: [...hit.rect] as [number, number, number, number],
  }));
}

export function hitTestP006Candidate(frame: number, x: number, y: number): number | null {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  // Interior only: avoid claiming exact Flash edge/antialias behavior.
  return p006CandidateHitRegions(frame).find(({rect: [left, top, right, bottom]}) =>
    x > left && x < right && y > top && y < bottom)?.characterId ?? null;
}
