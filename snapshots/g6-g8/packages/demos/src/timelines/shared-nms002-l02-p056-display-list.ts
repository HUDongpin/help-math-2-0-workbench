import {P056_DISPLAY_EVENTS, P056_DISPLAY_SOURCE} from '../generated/nms-l02-p056-display-list-v1';

export type P056StaticLayer = Readonly<{
  depth: number;
  characterId: number;
  sourceKind: string;
  transform: Readonly<{scaleX: number; scaleY: number; transX: number; transY: number}>;
  alpha256: number;
  morph?: number;
}>;

/** Source-static sprite-24 display list, after all tags for a one-indexed frame. */
export function p056SourceSpriteFrame(frame: number): readonly P056StaticLayer[] {
  if (!Number.isInteger(frame) || frame < 1 || frame > P056_DISPLAY_SOURCE.frameCount) {
    throw new RangeError('P056 frame is outside sprite-24');
  }
  const active = new Map<number, P056StaticLayer>();
  for (const event of P056_DISPLAY_EVENTS) {
    if (event.frame > frame) break;
    if (event.kind === 'remove') {
      if (!active.delete(event.depth)) throw new Error('P056 removal has no active layer');
      continue;
    }
    if (event.kind === 'place') {
      if (active.has(event.depth) || event.characterId === undefined ||
          !event.sourceKind || !event.transform || event.alpha256 === undefined) {
        throw new Error('P056 placement is incomplete or overlaps a depth');
      }
      active.set(event.depth, Object.freeze({
        depth: event.depth, characterId: event.characterId, sourceKind: event.sourceKind,
        transform: Object.freeze({...event.transform}), alpha256: event.alpha256,
        ...(event.morph === undefined ? {} : {morph: event.morph}),
      }));
      continue;
    }
    const prior = active.get(event.depth);
    if (!prior) throw new Error('P056 update has no active layer');
    active.set(event.depth, Object.freeze({
      ...prior,
      transform: event.transform ? Object.freeze({...event.transform}) : prior.transform,
      alpha256: event.alpha256 ?? prior.alpha256,
    }));
  }
  return Object.freeze([...active.values()].sort((a, b) => a.depth - b.depth));
}
