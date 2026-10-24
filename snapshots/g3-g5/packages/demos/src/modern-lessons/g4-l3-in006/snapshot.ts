import type {RuntimeContext} from '../../contract';
import type {TextPresentationSnapshot} from '../../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../../source-static-canvas-candidate';
import {create,DOMAIN,QUIZ_FRAME} from './interaction';
import {teachingState} from './teaching-state';
import {IN006_BINDING} from './binding.generated';
export function getIn006Snapshot(state:SourceStaticCanvasFrameState,context:RuntimeContext,interaction=create(context.seed)):TextPresentationSnapshot {
 const blockers:string[]=[];
 if(state.animationId!==IN006_BINDING.animationId||state.sourceSwfSha256!==IN006_BINDING.sourceSwfSha256)blockers.push('source-identity-mismatch');
 if(state.status!=='ready'||state.blocker)blockers.push('source-state-not-ready');
 if(state.frameDomain!==DOMAIN||(context.frameDomain??DOMAIN)!==DOMAIN)blockers.push('unsupported-frame-domain');
 if(state.scenario!=='source-static-frame'||context.scenario!=='source-static-frame')blockers.push('unsupported-scenario');
 if(interaction.seed!==context.seed)blockers.push('interaction-seed-mismatch');
 if(state.language!=='en'||context.lang!=='en')blockers.push('spanish-text-not-source-verified');
 if(!Number.isSafeInteger(context.frame)||context.frame<1||context.frame>QUIZ_FRAME||state.frame!==context.frame||state.rootFrame!==6||(context.rootFrame!==undefined&&context.rootFrame!==6)
  ||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||state.seed!==context.seed)blockers.push('teaching-state-identity-mismatch');
 const quiz=context.frame===QUIZ_FRAME,teaching=teachingState(context.frame),initial=interaction,format=(n:number)=>n<0?`−${-n}`:String(n);
 const values:Record<string,{text:string;visible:boolean}>={instruction:{text:teaching.words.join(' '),visible:teaching.words.length>0},
  prompt:{text:quiz?`${format(initial.start)} to ${format(initial.target)}`:teaching.prompt??'',visible:quiz||Boolean(teaching.prompt)},
  equation:{text:quiz?interaction.equation??'':teaching.equation??'',visible:quiz?Boolean(interaction.equation):Boolean(teaching.equation)},correct:{text:'Correct!!!',visible:quiz&&['correct-feedback','complete'].includes(interaction.outcome)},
  clear:{text:'Clear',visible:true},'new-number':{text:'New Number',visible:true},'number-line-geometry':{text:'Number line and directed jumps',visible:true}};
 for(let value=-15;value<=15;value++)values[`tick-${value}`]={text:format(value),visible:true};
 for(const value of [1,2,4,5])values[`jump-${value}`]={text:format(value),visible:true};
 return {schemaVersion:1,animationId:IN006_BINDING.animationId,bindingVersion:IN006_BINDING.version,sourceSwfSha256:IN006_BINDING.sourceSwfSha256,
 status:blockers.length?'blocked':'ready',blockers,identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},
 suppressedInstances:[],blocks:blockers.length?[]:IN006_BINDING.blocks.map(block=>({...values[block.id]!,id:block.id,role:block.role,language:block.language,readingOrder:block.readingOrder}))};
}
