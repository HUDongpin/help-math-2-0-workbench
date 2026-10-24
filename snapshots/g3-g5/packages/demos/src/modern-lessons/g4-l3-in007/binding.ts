import type {LessonTextBinding,TextPresentationSnapshot,LessonTextKeyTermsCapability} from '../../lesson-text-contract';
import type {RuntimeContext} from '../../contract';
import type {SourceStaticCanvasFrameState} from '../../source-static-canvas-candidate';
import SOURCE from './source.generated.json';
import {getNativeState} from './state.mjs';
export const ID='course-g04-l03-in-007',DOMAIN='sprite-98',VERSION='g04-l03-placement-018-modern-text-proposal-v1';
const text=(id:number,run=0)=>`character-${id}/run-${run}`;
export const KEY_TERMS:LessonTextKeyTermsCapability={indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',sourceSha256:SOURCE.keyTerms.sourceSha256,entryIds:SOURCE.keyTerms.entries.map(e=>e.entryId)};
export const BINDING:LessonTextBinding={schemaVersion:1,version:VERSION,placementId:'g04-l03-placement-018',animationId:ID,sourceSwfSha256:SOURCE.sourceSha256,template:'complex-figure',blocks:[
 {id:'title',sourceTextIds:[text(4)],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 ...[8,14].map((id,i)=>({id:`instruction-${i}`,sourceTextIds:Array.from({length:id===8?7:3},(_,j)=>text(id,j)),role:'body' as const,language:'en' as const,readingOrder:i+1,valueSource:'maintained-page-state' as const})),
 {id:'pattern-prefix',sourceTextIds:[17,19,20,21,22].map(id=>text(id)),role:'label',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 ...[55,89,97].map((id,i)=>({id:`fill-${i}`,sourceTextIds:[text(id)],sourceShapeIds:[9],role:'answer' as const,language:'en' as const,readingOrder:4+i,valueSource:'maintained-page-state' as const})),
 ...SOURCE.axisDefinitions.map(a=>({id:`tick-${a.value}`,sourceTextIds:[text(a.sourceTextId),...(a.value===-3?[text(80)]:a.value===-6?[text(88)]:a.value===-9?[text(96)]:[])],...(a.value<0?{sourceShapeIds:[9,...([-3,-6,-9].includes(a.value)?[81]:[])]}:{}),role:'label' as const,language:'en' as const,readingOrder:20+a.value+12,valueSource:'maintained-page-state' as const})),
 {id:'moving-minus-three',sourceTextIds:[text(55)],sourceShapeIds:[9],role:'label',language:'en',readingOrder:50,valueSource:'maintained-page-state'},
]};
export function snapshot(state:SourceStaticCanvasFrameState,context:RuntimeContext):TextPresentationSnapshot{
 const blockers:string[]=[];
 if(state.animationId!==ID||state.sourceSwfSha256!==SOURCE.sourceSha256)blockers.push('source-identity-mismatch');
 if(state.status!=='ready'||state.blocker)blockers.push(state.blocker??'source-state-not-ready');
 if(state.frameDomain!==DOMAIN||(context.frameDomain??DOMAIN)!==DOMAIN)blockers.push('unsupported-frame-domain');
 if(state.scenario!=='source-static-frame'||context.scenario!==state.scenario)blockers.push('unsupported-scenario');
 if(state.language!=='en'||context.lang!=='en')blockers.push('spanish-text-not-source-verified');
 if(!Number.isInteger(context.frame)||context.frame<1||context.frame>555||state.frame!==context.frame||state.rootFrame!==6||(context.rootFrame!==undefined&&context.rootFrame!==6)||!Number.isInteger(context.seed)||context.seed<0||context.seed>0xffffffff||state.seed!==context.seed||!Number.isInteger(context.replay??0)||(context.replay??0)<0)blockers.push('teaching-state-identity-mismatch');
 const s=getNativeState(SOURCE,Number.isInteger(state.frame)&&state.frame>=1&&state.frame<=555?state.frame:1);
 const values:Record<string,{text:string;visible:boolean}>={title:{text:'Negative Numbers: Learn It',visible:true},'instruction-0':{text:s.paragraphs[0],visible:Boolean(s.paragraphs[0])},'instruction-1':{text:s.paragraphs[1],visible:Boolean(s.paragraphs[1])},'pattern-prefix':{text:s.patternPrefix??'',visible:Boolean(s.patternPrefix)},'moving-minus-three':{text:s.movingLabels[0]?.text??'',visible:s.movingLabels.length>0}};
 for(let i=0;i<3;i++)values[`fill-${i}`]={text:s.fillTexts[i]??'',visible:Boolean(s.fillTexts[i])};
 for(const a of SOURCE.axisDefinitions){const shown=s.axisLabels.find((t:{value:number})=>t.value===a.value);values[`tick-${a.value}`]={text:shown?.text??'',visible:Boolean(shown)};}
 return{schemaVersion:1,animationId:ID,bindingVersion:VERSION,sourceSwfSha256:SOURCE.sourceSha256,status:blockers.length?'blocked':'ready',blockers,identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},blocks:blockers.length?[]:BINDING.blocks.map(b=>({id:b.id,...values[b.id],role:b.role,language:b.language,readingOrder:b.readingOrder})),suppressedInstances:[]};
}
