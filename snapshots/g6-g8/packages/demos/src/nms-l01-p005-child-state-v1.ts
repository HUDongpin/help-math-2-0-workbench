/** Source148 placement lifetimes. The modern host holds every layer on Pause/end. */
export function nmsL1P005ChildState(frame: number) {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 219) throw Error('NMS_L1_P005_FRAME_OUT_OF_RANGE');
  const child = (characterId: number, parentCharacterId: number, depth: number, first: number, count: number) =>
    Object.freeze({characterId, parentCharacterId, depth, frame: (frame - first) % count + 1});
  return Object.freeze([
    child(14, 148, 3, 1, 17), child(26, 148, 423, 1, 22),
    ...(frame >= 35 && frame <= 75 ? [child(104, 148, 97, 35, 17)] : []),
    ...(frame >= 76 ? [child(129, 148, 97, 76, 14), child(104, 129, 1, 76, 17)] : []),
  ]);
}
