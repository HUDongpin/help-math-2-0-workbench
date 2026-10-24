/** Source sprite frame domain plus maintained quiz branch stop semantics. */
export const P014_TIMELINE=Object.freeze({
  animationId:'shared-alg001-l06-p014',
  sourceSwfSha256:'aed0f7755d4f691cefcc28c815acc6b9d083fdfaae88ff385f22d3b32ba07603',
  stage:Object.freeze({width:800,height:600}),fps:12,
  rootFrameCount:10,rootEntryFrame:6,mainFrameCount:449,frameDomain:'sprite-227',
  quizHoldFrame:120,
  glossary:Object.freeze({Input:Object.freeze({characterId:32,sourceFirstFrame:2,firstFullHitFrame:7}),
    Output:Object.freeze({characterId:33,sourceFirstFrame:2,firstFullHitFrame:7})}),
  oldHostPolicy:'conditional-indexMI-feedback-selector' as const,
  originalRuntimeAccepted:false as const,
});
export type P014GlossaryKey=keyof typeof P014_TIMELINE.glossary;
export function p014FrameState(frame:number){
  if(!Number.isSafeInteger(frame)||frame<1||frame>P014_TIMELINE.mainFrameCount)
    throw Error('P014_INVALID_MAIN_FRAME');
  return Object.freeze({animationId:P014_TIMELINE.animationId,
    frameDomain:P014_TIMELINE.frameDomain,rootFrame:P014_TIMELINE.rootEntryFrame,frame,
    availableGlossaryKeys:Object.freeze((['Input','Output'] as const).filter(key=>
      frame>=P014_TIMELINE.glossary[key].firstFullHitFrame)),
    quizHold:frame===P014_TIMELINE.quizHoldFrame,
    originalRuntimeAccepted:false as const});
}
