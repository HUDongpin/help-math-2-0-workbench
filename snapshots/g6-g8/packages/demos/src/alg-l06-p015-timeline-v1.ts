/** Static source frame-domain contract. The maintained player owns audio and playback. */
export const P015_TIMELINE={
  animationId:'shared-alg001-l06-p015',
  sourceSwfSha256:'d0f395f5410353733b42ae29198caa86fae6b6eebd0e2a71830a203d969868b1',
  stage:{width:800,height:600},fps:12,rootEntryFrame:6,
  frameDomain:'sprite-270',mainFrameCount:914,
  glossary:{
    Function:{buttonId:36,firstFullHitFrame:172},
    Relation:{buttonId:38,firstFullHitFrame:191},
    Value:{buttonId:37,firstFullHitFrame:215},
    Rule:{buttonId:45,firstFullHitFrame:302},
    Input:{buttonId:46,firstFullHitFrame:317},
    Output:{buttonId:47,firstFullHitFrame:332},
  },
  phaseBoundaries:{machineLabel:135,definition:164,rule:271,uniqueOutput:350,numberExample:732},
} as const;

export function p015TimelineState(frame:number){
  if(!Number.isInteger(frame)||frame<1||frame>P015_TIMELINE.mainFrameCount)
    throw new RangeError('P015_FRAME_OUT_OF_RANGE');
  const b=P015_TIMELINE.phaseBoundaries;
  const phase=frame>=b.numberExample?'number-example':
    frame>=b.uniqueOutput?'unique-output':frame>=b.rule?'rule':
    frame>=b.definition?'definition':frame>=b.machineLabel?'machine-label':'intro';
  return {frame,frameDomain:P015_TIMELINE.frameDomain,phase,
    elapsedSeconds:(frame-1)/P015_TIMELINE.fps,
    glossary:Object.fromEntries(Object.entries(P015_TIMELINE.glossary)
      .map(([key,source])=>[key,frame>=source.firstFullHitFrame])) as
        Record<keyof typeof P015_TIMELINE.glossary,boolean>};
}
