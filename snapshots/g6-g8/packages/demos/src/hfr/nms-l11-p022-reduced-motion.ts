import {MovieClip,type Runtime} from './display';
import {P022} from './nms-l11-p022-source-binding';
import type {P022PracticeHost} from './nms-l11-p022-practice-host';
export const P022_REDUCED={kind:'source-readable-static-state-v1',sourceBehavior:'audited-source-drag-practice',animationId:P022.animationId,sourceSha256:P022.sourceSha256,dataSha256:P022.dataSha256,frameDomain:'sprite-65',frame:172,rootFrame:6,maximumInitializationTicks:172} as const;
function exact(rt:Runtime){if(rt.page.placement.animationId!==P022.animationId||rt.page.source.sha256!==P022.sourceSha256||rt.audio!==null||rt.errors.length||rt.notes.size||Object.values(rt.missing).some(m=>m.size))throw Error('P022_REDUCED_EXACT_SILENT_RUNTIME_REQUIRED');const main=rt.page_.children.get(2);return main instanceof MovieClip&&main.charId===65&&main.def===rt.page.dictionary[65]&&main.parentClip===rt.page_?main:null;}
/** Natural source initialization only; the source frame172 script initializes count0. */
export function initializeP022ReducedMotion(rt:Runtime,state:unknown,dataSha256?:string){
 if(JSON.stringify(state)!==JSON.stringify(P022_REDUCED)||dataSha256!==P022.dataSha256)throw Error('P022_REDUCED_SOURCE_BINDING');
 for(let n=0;n<=172;n++){const m=exact(rt);if(m?.frame===172){if(rt.page_.frame!==6||m.playing||rt.Global.get('quizDragCount')!==0||rt.Global.get('quizSection')!==true||!P022.pairs.every(p=>{const s=m.get(p.sourceName),t=m.get(p.targetName);return s instanceof MovieClip&&s.charId===p.sourceId&&s.visible&&s.get('enabled')!==false&&t instanceof MovieClip&&t.charId===p.targetId&&t.get('_alpha')===0;}))throw Error('P022_REDUCED_UNANSWERED_ENTRY_REQUIRED');return;}if(n<172)rt.tick();}
 throw Error('P022_REDUCED_ENTRY_UNREACHABLE');
}
/** Public source pointerUp/Close chooses the result. Run only its source feedback
 * to popup15, the next unanswered172 state, or the true terminal216 stop. */
export function settleP022ReducedMotion(rt:Runtime,adapter:P022PracticeHost){
 // coach2..20, right2..25 and main173..216 require at most89 source ticks.
 for(let n=0;n<=89;n++){
  const m=exact(rt),s=adapter.snapshot();if(adapter.runtime!==rt||!s.current||!m||m!==s.main||rt.drag||rt.pressed||m.frame<172||m.frame>216)throw Error('P022_REDUCED_CURRENT_SOURCE_REQUIRED');
  if(s.complete)return;
  const popup=m.get('Pop1_mc'),coach=m.get('Coach_audio_2'),right=m.get('Right_Feed');
  if(!(popup instanceof MovieClip)||popup.charId!==64||!(coach instanceof MovieClip)||coach.charId!==45||!(right instanceof MovieClip)||right.charId!==51)throw Error('P022_REDUCED_SOURCE_FEEDBACK_BINDING');
  if(m.frame===172&&!m.playing&&popup.visible&&popup.frame===15&&!popup.playing)return;
  if(m.frame===172&&!m.playing&&!popup.visible&&Number.isInteger(s.count)&&Number(s.count)>=0&&Number(s.count)<5&&coach.frame===1&&!coach.playing&&right.frame===1&&!right.playing&&s.pairs.every(p=>p.source?.get('enabled')!==false))return;
  if(n<89)rt.tick();
 }
 throw Error('P022_REDUCED_SOURCE_SETTLE_UNREACHABLE');
}
