/** Source-bound frame domain; static reveal evidence is not original-runtime acceptance. */
export const P016_TIMELINE={
 animationId:'shared-alg001-l06-p016',
 sourceSwfSha256:'2fdeba5b4dcfcfe7d1b575ab30d76a98fca802d6be670a679a54378f32aa4ae9',
 stage:{width:800,height:600},fps:12,rootEntryFrame:6,
 frameDomain:'sprite-139',mainFrameCount:815,
 glossary:{Function:{buttonId:10,firstAvailableFrame:72,firstFullHitFrame:null,
  sourceActionSha256:'549555e0e21a60e887e614e7ff3b03592d8a7f577c5ec25e6601f039050f49c8',
  hitEvidence:'visible-glyph-and-partially-exposed-source-hit-rectangle'}},
} as const;
export function p016TimelineState(frame:number){
 if(!Number.isInteger(frame)||frame<1||frame>P016_TIMELINE.mainFrameCount)
  throw new RangeError('P016_FRAME_OUT_OF_RANGE');
 return {frame,frameDomain:P016_TIMELINE.frameDomain,
  elapsedSeconds:(frame-1)/P016_TIMELINE.fps,
  glossary:{Function:frame>=P016_TIMELINE.glossary.Function.firstAvailableFrame}};
}
