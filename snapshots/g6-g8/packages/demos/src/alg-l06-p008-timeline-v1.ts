/** P008 source-instance frame projection for the owned modern playhead.
 * Terminal hold freezes children too; original stopped-parent child behavior is unaccepted.
 */
export const P008_TIMELINE = Object.freeze({
  animationId: 'shared-alg001-l06-p008',
  sourceSwfSha256: '6ea847e4682f9581cd72ee4a2fd8a177c9584cbf7a53ab8a2421e1ee0f012350',
  sourceCompositionSha256: 'a738f4fa22abd482cbb4a5470a33c85f465f79ae1fd831b1c29466c4617016c7',
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootEntryFrame: 6, mainFrameCount: 938,
  children: Object.freeze([
    Object.freeze({characterId: 20, depth: 56, firstFrame: 1, lastFrameExclusive: 19}),
    Object.freeze({characterId: 20, depth: 73, firstFrame: 449, lastFrameExclusive: 464}),
    Object.freeze({characterId: 194, depth: 318, firstFrame: 636, lastFrameExclusive: 646}),
    Object.freeze({characterId: 20, depth: 73, firstFrame: 936, lastFrameExclusive: 939}),
  ]),
});

export function p008FrameState(frame: number) {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > P008_TIMELINE.mainFrameCount)
    throw new Error('P008_INVALID_MAIN_FRAME');
  return Object.freeze({
    animationId: P008_TIMELINE.animationId,
    frameDomain: 'sprite-507' as const,
    rootFrame: 6,
    frame,
    terminal: frame === 938,
    children: Object.freeze(P008_TIMELINE.children
      .filter(child => frame >= child.firstFrame && frame < child.lastFrameExclusive)
      .map(child => Object.freeze({...child, frame: (frame - child.firstFrame) % 22 + 1}))),
  });
}
