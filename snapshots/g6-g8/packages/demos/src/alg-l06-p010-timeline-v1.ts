/** Source-bound main instance. The historical indexMI host conditionally holds
 * this non-FQ page at frame 303; the standalone SWF has no final-frame Stop. */
export const P010_TIMELINE = Object.freeze({
  animationId: 'shared-alg001-l06-p010',
  sourceSwfSha256: '96552f567037f39868d01b1ba77311858caf2efcdb141ef64ed0878a6c48ce14',
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  rootFrameCount: 10,
  rootEntryFrame: 6,
  mainFrameCount: 303,
  frameDomain: 'sprite-52',
  glossaryKey: 'Function',
  glossaryFirstFrame: 268,
  questionFullyRevealedFrame: 297,
  terminalPolicy: 'conditional-indexMI-host-hold' as const,
});

export function p010FrameState(frame: number) {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > P010_TIMELINE.mainFrameCount)
    throw new Error('P010_INVALID_MAIN_FRAME');
  return Object.freeze({
    animationId: P010_TIMELINE.animationId,
    frameDomain: P010_TIMELINE.frameDomain,
    rootFrame: P010_TIMELINE.rootEntryFrame,
    frame,
    glossaryAvailable: frame >= P010_TIMELINE.glossaryFirstFrame,
    questionFullyRevealed: frame >= P010_TIMELINE.questionFullyRevealedFrame,
    hostHeldTerminal: frame === P010_TIMELINE.mainFrameCount,
    originalRuntimeAccepted: false,
  });
}
