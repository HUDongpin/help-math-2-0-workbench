/** P013 source sprite and old-host conditional terminal, not an original-runtime trace. */
export const P013_TIMELINE=Object.freeze({
 animationId:'shared-alg001-l06-p013',
 sourceSwfSha256:'1be47750557385ef91c648fb87fdcde642d342caadc35da7a1f7a2d1fdb11d35',
 stage:Object.freeze({width:800,height:600}),fps:12,
 rootFrameCount:10,rootEntryFrame:6,mainFrameCount:372,frameDomain:'sprite-140',
 glossary:Object.freeze({Input:Object.freeze({characterId:131,sourceFirstFrame:258,firstFullHitFrame:296}),
  Output:Object.freeze({characterId:137,sourceFirstFrame:297,firstFullHitFrame:365})}),
 terminalPolicy:'conditional-indexMI-host-hold' as const,
});

export type P013GlossaryKey=keyof typeof P013_TIMELINE.glossary;
export function p013FrameState(frame:number){
 if(!Number.isSafeInteger(frame)||frame<1||frame>P013_TIMELINE.mainFrameCount)
  throw Error('P013_INVALID_MAIN_FRAME');
 return Object.freeze({animationId:P013_TIMELINE.animationId,
  frameDomain:P013_TIMELINE.frameDomain,rootFrame:P013_TIMELINE.rootEntryFrame,frame,
  availableGlossaryKeys:Object.freeze((['Input','Output'] as const).filter(key=>
   frame>=P013_TIMELINE.glossary[key].firstFullHitFrame)),
  hostHeldTerminal:frame===P013_TIMELINE.mainFrameCount,
  originalRuntimeAccepted:false});
}
