import {MovieClip,type Runtime} from './display';
import {P014} from './nms-l11-p014-source-binding';
import type {P014PracticeHost} from './nms-l11-p014-practice-host';
export const P014_REDUCED={kind:'source-readable-static-state-v1',sourceBehavior:'audited-source-drag-practice',animationId:P014.animationId,sourceSha256:P014.sourceSha256,dataSha256:P014.dataSha256,frameDomain:'sprite-237',frame:228,rootFrame:6,maximumInitializationTicks:228} as const;
function exact(rt:Runtime){if(rt.page.placement.animationId!==P014.animationId||rt.page.source.sha256!==P014.sourceSha256||rt.audio!==null||rt.errors.length)throw Error('P014_REDUCED_EXACT_SILENT_RUNTIME_REQUIRED');return rt.page_.children.get(3);}
export function initializeP014ReducedMotion(rt:Runtime,state:unknown,dataSha256?:string){
 if(JSON.stringify(state)!==JSON.stringify(P014_REDUCED)||dataSha256!==P014.dataSha256)throw Error('P014_REDUCED_SOURCE_BINDING');
 for(let n=0;n<=228;n++){const m=exact(rt);if(m instanceof MovieClip&&m.charId===237&&m.frame===228){if(rt.page_.frame!==6||m.playing||rt.Global.get('quizDragCount')!==0||rt.Global.get('quizSection')!==true||!P014.pairs.every(p=>{const s=m.get(p.sourceName),t=m.get(p.targetName);return s instanceof MovieClip&&s.charId===p.sourceId&&s.visible&&s.get('enabled')===true&&t instanceof MovieClip&&t.charId===p.targetId&&t.get('_alpha')===0;}))throw Error('P014_REDUCED_UNANSWERED_ENTRY_REQUIRED');return;}if(n<228)rt.tick();}
 throw Error('P014_REDUCED_ENTRY_UNREACHABLE');
}
/** Only actual source feedback after an input is advanced. No answer or frame is assigned. */
export function settleP014ReducedMotion(rt:Runtime,adapter:P014PracticeHost){
 for(let n=0;n<=63;n++){
  const m=exact(rt),s=adapter.snapshot();if(adapter.runtime!==rt||!s.current||!(m instanceof MovieClip)||m!==s.main)throw Error('P014_REDUCED_LEASE_CHANGED');
  if(s.complete)return;
  const correct=m.get('Coach_audio_2'),wrong=m.get('Coach_audio_1');
  if(m.frame===228&&!m.playing&&typeof s.count==='number'&&s.count<7&&correct instanceof MovieClip&&wrong instanceof MovieClip&&correct.frame===1&&!correct.playing&&wrong.frame===1&&!wrong.playing&&s.pairs.every(p=>p.source?.get('enabled')===true))return;
  if(rt.drag||rt.pressed||m.frame<228||m.frame>273)throw Error('P014_REDUCED_FEEDBACK_STATE_REQUIRED');
  if(n<63)rt.tick();
 }
 throw Error('P014_REDUCED_SOURCE_SETTLE_UNREACHABLE');
}
