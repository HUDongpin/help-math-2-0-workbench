import {MovieClip,type Runtime} from './display';
import {P027} from './nms-l11-p027-source-binding';
import type {P027PracticeHost} from './nms-l11-p027-practice-host';
export const P027_REDUCED={kind:'source-readable-static-state-v1',sourceBehavior:'audited-source-drag-practice',animationId:P027.animationId,sourceSha256:P027.sourceSha256,dataSha256:P027.dataSha256,frameDomain:'sprite-142',frame:278,rootFrame:6,maximumInitializationTicks:278} as const;
function exact(rt:Runtime){if(rt.page.placement.animationId!==P027.animationId||rt.page.source.sha256!==P027.sourceSha256||rt.audio!==null||rt.errors.length||rt.notes.size||Object.values(rt.missing).some(m=>m.size))throw Error('P027_REDUCED_EXACT_SILENT_RUNTIME_REQUIRED');const m=rt.page_.children.get(P027.mainDepth);return m instanceof MovieClip&&m.charId===P027.mainId&&m.def===rt.page.dictionary[P027.mainId]&&m.parentClip===rt.page_?m:null;}
export function initializeP027ReducedMotion(rt:Runtime,state:unknown,dataSha256?:string){
 if(JSON.stringify(state)!==JSON.stringify(P027_REDUCED)||dataSha256!==P027.dataSha256)throw Error('P027_REDUCED_SOURCE_BINDING');
 for(let n=0;n<=P027_REDUCED.maximumInitializationTicks;n++){const m=exact(rt);if(m?.frame===P027.activityFrame){if(rt.page_.frame!==6||m.playing||rt.Global.get('quizDragCount')!==0||rt.Global.get('quizSection')!==true||!P027.pairs.every(p=>{const s=m.get(p.sourceName),t=m.get(p.targetName);return s instanceof MovieClip&&s.charId===p.sourceId&&s.visible&&s.get('enabled')!==false&&t instanceof MovieClip&&t.charId===p.targetId&&t.get('_alpha')===0;}))throw Error('P027_REDUCED_UNANSWERED_ENTRY_REQUIRED');return;}if(n<P027_REDUCED.maximumInitializationTicks)rt.tick();}throw Error('P027_REDUCED_ENTRY_UNREACHABLE');
}
/** Original coach20 resets itself1; Correct_FB25 resets1 and starts the original
 * main279..298 sequence. Source cards persist hidden while feedback is removed. */
export function settleP027ReducedMotion(rt:Runtime,adapter:P027PracticeHost){
 let coachEnd=false,rightEnd=false,coachWasAt19=false,rightWasAt24=false;
 for(let n=0;n<=P027.maximumFeedbackTicks;n++){
  const m=exact(rt),s=adapter.snapshot();if(adapter.runtime!==rt||!s.current||!m||m!==s.main||rt.drag||rt.pressed||m.frame<P027.activityFrame||m.frame>P027.terminalFrame)throw Error('P027_REDUCED_CURRENT_SOURCE_REQUIRED');if(s.complete)return;
  if(m.frame>P027.activityFrame){if(!coachEnd||!rightEnd||!m.playing||s.count!==4||s.quizSection!==false||!s.pairs.every(p=>p.source!==null&&!p.source.visible&&p.target?.get('_alpha')===100)||['Pop1_mc','Coach_audio_1','Coach_audio_2','Correct_FB'].some(name=>m.get(name) instanceof MovieClip))throw Error('P027_REDUCED_SOURCE_TRAILING_SEQUENCE_REQUIRED');}
  else{const popup=m.get(P027.popupName),coach=m.get(P027.coachName),right=m.get(P027.rightName);if(!(popup instanceof MovieClip)||popup.charId!==133||popup.def!==rt.page.dictionary[133]||!(coach instanceof MovieClip)||coach.charId!==141||coach.def!==rt.page.dictionary[141]||!(right instanceof MovieClip)||right.charId!==137||right.def!==rt.page.dictionary[137])throw Error('P027_REDUCED_SOURCE_FEEDBACK_BINDING');coachEnd ||= coachWasAt19&&coach.frame===1&&!coach.playing;rightEnd ||= rightWasAt24&&right.frame===1&&!right.playing&&s.quizSection===false&&m.playing;coachWasAt19=coach.frame===19&&coach.playing;rightWasAt24=right.frame===24&&right.playing;if(!m.playing&&popup.visible&&popup.frame===15&&!popup.playing)return;if(!m.playing&&!popup.visible&&Number.isInteger(s.count)&&Number(s.count)>=0&&Number(s.count)<4&&coach.frame===1&&!coach.playing&&right.frame===1&&!right.playing&&s.pairs.every(p=>p.source?.get('enabled')!==false))return;}
  if(n<P027.maximumFeedbackTicks)rt.tick();
 }throw Error('P027_REDUCED_SOURCE_SETTLE_UNREACHABLE');
}
