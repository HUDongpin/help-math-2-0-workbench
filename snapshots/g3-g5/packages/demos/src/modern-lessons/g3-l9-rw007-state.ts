import type {RuntimeContext} from '../contract';
import type {LessonTextBinding, TextPresentationSnapshot} from '../lesson-text-contract';
import {buildLessonTextSnapshot} from '../lesson-text-snapshot';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {RW007} from './g3-l9-rw007-config';

export const RW007_BINDING: LessonTextBinding = Object.freeze({schemaVersion:1,version:RW007.version,
  animationId:RW007.animationId,placementId:RW007.placementId,sourceSwfSha256:RW007.sourceSwfSha256,template:'complex-figure',
  blocks:Object.freeze(RW007.segments.map((s,index)=>({id:s.id,sourceTextIds:s.sourceTextIds,
    role:index===0?'heading' as const:'question' as const,language:'en' as const,readingOrder:index,valueSource:'source-static' as const}))),
});

/** The host supplies the only clock. Semantic whole-word reveal deliberately
 * waits for the audited word to be complete; it does not imitate a mask scan. */
export function getRw007Snapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext): TextPresentationSnapshot {
  const frame=context.frame;
  const valid=Boolean(state && state.status==='ready' && state.animationId===RW007.animationId &&
    state.sourceSwfSha256===RW007.sourceSwfSha256 && Number.isInteger(frame) && frame>=1 && frame<=RW007.frameCount &&
    state.frame===frame && context.frameDomain===RW007.domain && state.frameDomain===RW007.domain &&
    context.rootFrame===RW007.rootFrame && state.rootFrame===RW007.rootFrame &&
    context.scenario==='source-static-frame' && state.scenario===context.scenario &&
    context.lang==='en' && state.language==='en' && Number.isSafeInteger(context.seed) && context.seed>=0 && context.seed<=0xffffffff &&
    state.seed===context.seed && Number.isSafeInteger(context.replay??0) && (context.replay??0)>=0);
  const values=Object.fromEntries(RW007.segments.map(s=>[s.id,{text:s.text,visible:valid && frame>=s.revealFrame}]));
  const snapshot=buildLessonTextSnapshot(RW007_BINDING,context,values);
  if(!valid || snapshot.status!=='ready') return Object.freeze({...snapshot,status:'blocked',blocks:Object.freeze([]),
    suppressedInstances:Object.freeze([]),blockers:Object.freeze([...snapshot.blockers,'rw007-source-frame-identity-mismatch'])});
  return Object.freeze({...snapshot,suppressedInstances:Object.freeze(RW007.exclusions
    .filter(i=>frame>=i.firstFrame && frame<i.lastFrameExclusive).map(({id,path})=>({id,path})))});
}

export function rw007TermRequest(id: string, snapshot: TextPresentationSnapshot) {
  if(snapshot.status!=='ready' || snapshot.animationId!==RW007.animationId || snapshot.sourceSwfSha256!==RW007.sourceSwfSha256 ||
    snapshot.identity.frameDomain!==RW007.domain || snapshot.identity.rootFrame!==6 || snapshot.identity.language!=='en') return null;
  const segment=RW007.segments.find(s=>s.id===id);
  if(!segment || !('term' in segment) || snapshot.identity.frame<segment.revealFrame ||
    !snapshot.blocks.some(b=>b.id===id && b.visible && b.text===segment.text)) return null;
  return {type:'open-keyterm' as const,entryId:segment.term.entryId,sourceAnimationId:RW007.animationId,
    playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume' as const};
}
