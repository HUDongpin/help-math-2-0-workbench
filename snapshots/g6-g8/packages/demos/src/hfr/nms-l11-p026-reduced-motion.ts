import {MovieClip,type Runtime} from './display';
import {P026} from './nms-l11-p026-source-binding';
import type {P026PracticeHost} from './nms-l11-p026-practice-host';
export const P026_REDUCED={kind:'source-readable-static-state-v1',sourceBehavior:'audited-source-drag-practice',animationId:P026.animationId,sourceSha256:P026.sourceSha256,dataSha256:P026.dataSha256,frameDomain:'sprite-114',frame:427,rootFrame:6,maximumInitializationTicks:427} as const;
function exact(rt:Runtime){
 if(rt.page.placement.animationId!==P026.animationId||rt.page.source.sha256!==P026.sourceSha256||rt.audio!==null||rt.errors.length||rt.notes.size||Object.values(rt.missing).some(m=>m.size))throw Error('P026_REDUCED_EXACT_SILENT_RUNTIME_REQUIRED');
 const main=rt.page_.children.get(P026.mainDepth);return main instanceof MovieClip&&main.charId===P026.mainId&&main.def===rt.page.dictionary[P026.mainId]&&main.parentClip===rt.page_?main:null;
}
/** Run the original initialization. The original frame427 initializes count0. */
export function initializeP026ReducedMotion(rt:Runtime,state:unknown,dataSha256?:string){
 if(JSON.stringify(state)!==JSON.stringify(P026_REDUCED)||dataSha256!==P026.dataSha256)throw Error('P026_REDUCED_SOURCE_BINDING');
 for(let n=0;n<=P026_REDUCED.maximumInitializationTicks;n++){
  const m=exact(rt);if(m?.frame===P026.activityFrame){
   if(rt.page_.frame!==P026.rootFrame||m.playing||rt.Global.get('quizDragCount')!==0||rt.Global.get('quizSection')!==true||!P026.pairs.every(p=>{const s=m.get(p.sourceName),t=m.get(p.targetName);return s instanceof MovieClip&&s.charId===p.sourceId&&s.visible&&s.get('enabled')!==false&&t instanceof MovieClip&&t.charId===p.targetId&&t.get('_alpha')===0;}))throw Error('P026_REDUCED_UNANSWERED_ENTRY_REQUIRED');return;
  }if(n<P026_REDUCED.maximumInitializationTicks)rt.tick();
 }throw Error('P026_REDUCED_ENTRY_UNREACHABLE');
}
/** Real source release/Close chooses the result. Source feedback advances to
 * popup15 or the next held427. After the fifth match, coach113 end20 and
 * Right_Feed109 end25 start the source's trailing428..474 sequence. Frame428
 * removes the cards and feedback objects; those removals are not missing stubs. */
export function settleP026ReducedMotion(rt:Runtime,adapter:P026PracticeHost){
 let coachEnd=false,rightEnd=false,rightWasAt24=false;
 for(let n=0;n<=92;n++){
  const m=exact(rt),s=adapter.snapshot();
  if(adapter.runtime!==rt||!s.current||!m||m!==s.main||rt.drag||rt.pressed||m.frame<P026.activityFrame||m.frame>P026.terminalFrame)throw Error('P026_REDUCED_CURRENT_SOURCE_REQUIRED');
  if(s.complete)return;
  if(m.frame>P026.activityFrame){
   if(!coachEnd||!rightEnd||!m.playing||s.count!==5||s.quizSection!==false||!s.pairs.every(p=>p.source===null&&p.target?.get('_alpha')===100)||['Pop1_mc','Coach_audio_1','Coach_audio_2','Right_Feed'].some(name=>m.get(name) instanceof MovieClip))throw Error('P026_REDUCED_SOURCE_TRAILING_SEQUENCE_REQUIRED');
  }else{
   const popup=m.get(P026.popupName),coach=m.get(P026.coachName),right=m.get(P026.rightName);
   if(!(popup instanceof MovieClip)||popup.charId!==P026.popupId||popup.def!==rt.page.dictionary[P026.popupId]||!(coach instanceof MovieClip)||coach.charId!==P026.coachId||coach.def!==rt.page.dictionary[P026.coachId]||!(right instanceof MovieClip)||right.charId!==P026.rightId||right.def!==rt.page.dictionary[P026.rightId])throw Error('P026_REDUCED_SOURCE_FEEDBACK_BINDING');
   coachEnd ||= coach.frame===P026.coachBoundary;
   // Frame25 stops, clears quizSection and jumps to1 within the same tick.
   rightEnd ||= rightWasAt24&&right.frame===1&&!right.playing&&s.quizSection===false&&m.playing;
   rightWasAt24=right.frame===P026.rightBoundary-1&&right.playing;
   if(!m.playing&&popup.visible&&popup.frame===P026.popupBoundary&&!popup.playing)return;
   if(!m.playing&&!popup.visible&&Number.isInteger(s.count)&&Number(s.count)>=0&&Number(s.count)<5&&coach.frame===1&&!coach.playing&&right.frame===1&&!right.playing&&s.pairs.every(p=>p.source?.get('enabled')!==false))return;
  }
  if(n<92)rt.tick();
 }throw Error('P026_REDUCED_SOURCE_SETTLE_UNREACHABLE');
}
