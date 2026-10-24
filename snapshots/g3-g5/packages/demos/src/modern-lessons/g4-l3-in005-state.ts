import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextBinding,LessonTextFrameTransition,TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {COURSE_G04_L03_IN_005_ORDERING_CARDS as CARDS,COURSE_G04_L03_IN_005_SORTED_TARGET_IDS as TARGETS,
 createCourseG04L03In005OrderingState,reduceCourseG04L03In005OrderingInteraction as reduce,
 getCourseG04L03In005OrderingPlacementCount as placedCount,
 type CourseG04L03In005OrderingState as OrderingState,type CourseG04L03In005OrderingAction as OrderingAction} from '../timelines/course-g04-l03-in-005-ordering-interaction';
import {G4_L3_IN005_SOURCE_DATA as SOURCE} from './g4-l3-in005-source.generated';
export {CARDS,TARGETS,createCourseG04L03In005OrderingState,reduce as reduceG4L3In005Ordering,placedCount};
export type {OrderingState,OrderingAction};
export const G4_L3_IN005_ID='course-g04-l03-in-005';
export const G4_L3_IN005_DOMAIN='sprite-80';
export const G4_L3_IN005_VERSION='g04-l03-placement-016-modern-text-v1';
export const G4_L3_IN005_TRANSITION=Object.freeze({fromFrame:SOURCE.decisions.parentTransition.fromFrame,toFrame:SOURCE.decisions.parentTransition.toFrame,stopFrame:SOURCE.decisions.parentTransition.stopFrame}) satisfies LessonTextFrameTransition;
export const G4_L3_IN005_KEY_TERMS=Object.freeze({indexLanguage:'en' as const,sourceAssetId:SOURCE.glossary.sourceAssetId,
 sourceSha256:SOURCE.glossary.sourceSha256,entryIds:SOURCE.glossary.terms.map(t=>t.entryId)});
export const G4_L3_IN005_ACTIVITIES:readonly LessonTextActivityDefinition[]=Object.freeze([
 {id:'in005-correct-coach',sourceInstanceId:'root/animation_mc/animation/Coach_audio_2a',frameDomain:'sprite-47',startFrame:2,endFrame:20,fps:12,parentFrames:[144],parentLifetime:{firstFrame:144,lastFrameExclusive:145},audio:SOURCE.decisions.activityAudio.correctCoach},
 {id:'in005-complete-feedback',sourceInstanceId:'root/animation_mc/animation/Right_Feed',frameDomain:'sprite-67',startFrame:2,endFrame:25,fps:12,parentFrames:[144],parentLifetime:{firstFrame:144,lastFrameExclusive:145}},
 {id:'in005-wrong-popup',sourceInstanceId:'root/animation_mc/animation/Pop1_mc',frameDomain:'sprite-79',startFrame:2,endFrame:15,fps:12,parentFrames:[144],parentLifetime:{firstFrame:144,lastFrameExclusive:145},audio:SOURCE.decisions.activityAudio.wrongPopup},
 {id:'in005-close-down',sourceInstanceId:`root/animation_mc/animation/Pop1_mc/BtnClose/${SOURCE.decisions.closeDownSourceRecord.instanceId}`,frameDomain:'sprite-75',startFrame:1,endFrame:5,fps:12,parentFrames:[144],parentLifetime:{firstFrame:144,lastFrameExclusive:145},buttonPress:{sourceButtonId:76},audio:SOURCE.decisions.activityAudio.closeDown},
]);
const textId=(id:number,run=0)=>`character-${id}/run-${run}`;
export const G4_L3_IN005_TEXT_BINDING=Object.freeze({schemaVersion:1,version:G4_L3_IN005_VERSION,placementId:'g04-l03-placement-016',animationId:G4_L3_IN005_ID,
 sourceSwfSha256:SOURCE.sourceSwfSha256,template:'exercise',blocks:[
 {id:'instruction',sourceTextIds:Array.from({length:7},(_,run)=>textId(19,run)),role:'question',language:'en',readingOrder:0,valueSource:'maintained-page-state'},
 {id:'least',sourceTextIds:[textId(7),textId(23)],role:'label',language:'en',readingOrder:1,valueSource:'maintained-page-state'},
 {id:'greatest',sourceTextIds:[textId(8),textId(45)],role:'label',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 ...CARDS.map((card,index)=>({id:`card-${card.id}`,sourceTextIds:[textId([10,16,11,13,14,15,14][index]!)],...(card.numericValue<0?{sourceShapeIds:[12]}:{}),role:'answer' as const,language:'en' as const,readingOrder:10+index,valueSource:'maintained-page-state' as const})),
 {id:'wrong',sourceTextIds:[textId(78),textId(78,1)],role:'feedback',language:'en',readingOrder:20,valueSource:'maintained-page-state'},
 {id:'complete',sourceTextIds:[textId(66)],role:'feedback',language:'en',readingOrder:21,valueSource:'maintained-page-state'},
 {id:'close',sourceTextIds:[textId(69)],role:'answer',language:'en',readingOrder:22,valueSource:'maintained-page-state'},
 ]} satisfies LessonTextBinding);
export function getG4L3In005TeachingState(frame:number){
 if(!Number.isInteger(frame)||frame<1||frame>186)throw new RangeError('IN005 source frame must be an integer from 1 to 186');
 const row=SOURCE.frameRows[frame-1]!,emphasis=SOURCE.emphasisSymbols.find(s=>s.characterId===row[2]);
 return {frame,instruction:SOURCE.instruction.wordRows.filter(r=>r[3]<=frame).map(r=>r[0]).join(' '),
  maskStateId:row[1],sourceMaskState:SOURCE.instruction.maskRows[row[1]],emphasisCharacterId:row[2],
  emphasizedEndpoint:emphasis?.endpoint??null,emphasizedSlot:emphasis?.slot??null,
  staticCardsVisible:frame<144,interactive:frame===144,sourceTail:frame>=145,
  glossary:SOURCE.glossary.terms.filter(t=>t.firstFrame<=frame)};
}
export function getG4L3In005TextSnapshot(state:SourceStaticCanvasFrameState,context:RuntimeContext,interaction:OrderingState=createCourseG04L03In005OrderingState(),
 activities:readonly LessonTextActivitySnapshot[]=[]):TextPresentationSnapshot{
 const blockers:string[]=[];
 if(state.animationId!==G4_L3_IN005_ID||state.sourceSwfSha256!==SOURCE.sourceSwfSha256)blockers.push('source-identity-mismatch');
 if(state.status!=='ready')blockers.push(state.blocker??'source-state-not-ready');
 if(state.frameDomain!==G4_L3_IN005_DOMAIN||(context.frameDomain??G4_L3_IN005_DOMAIN)!==G4_L3_IN005_DOMAIN)blockers.push('unsupported-frame-domain');
 if(state.scenario!=='source-static-frame'||context.scenario!==state.scenario)blockers.push('unsupported-scenario');
 if(state.language!=='en'||context.lang!=='en')blockers.push('spanish-text-not-source-verified');
 if(!Number.isInteger(context.frame)||context.frame<1||context.frame>186||state.frame!==context.frame||state.rootFrame!==6||(context.rootFrame!==undefined&&context.rootFrame!==6)
  ||!Number.isInteger(context.seed)||context.seed<0||context.seed>0xffffffff||state.seed!==context.seed)blockers.push('teaching-state-identity-mismatch');
 const validFrame=Number.isInteger(state.frame)&&state.frame>=1&&state.frame<=186;
 if(!validFrame)blockers.push('invalid-source-frame');
 const teaching=getG4L3In005TeachingState(validFrame?state.frame:1),interactive=teaching.interactive&&!context.entryStateSha256;
 const final=activities.find(a=>a.id==='in005-complete-feedback'&&a.frameDomain==='sprite-67');
 const finalVisible=interactive&&interaction.outcome==='complete'&&final?.status==='playing'&&final.frame>=2&&final.frame<25;
 const values:Record<string,{text:string;visible:boolean}>={instruction:{text:teaching.instruction,visible:Boolean(teaching.instruction)},least:{text:'Least',visible:true},greatest:{text:'Greatest',visible:true},
  wrong:{text:SOURCE.wrongFeedback,visible:interactive&&interaction.outcome==='wrong'},complete:{text:SOURCE.completeFeedback,visible:Boolean(finalVisible)},close:{text:'Close',visible:interactive&&interaction.outcome==='wrong'}};
 for(const card of CARDS)values[`card-${card.id}`]={text:card.numericValue<0?`−${-card.numericValue}`:String(card.numericValue),visible:teaching.staticCardsVisible||interactive||Boolean(interaction.placements[card.id])};
 return {schemaVersion:1,animationId:G4_L3_IN005_ID,bindingVersion:G4_L3_IN005_VERSION,sourceSwfSha256:SOURCE.sourceSwfSha256,status:blockers.length?'blocked':'ready',blockers,
  identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},suppressedInstances:[],
  blocks:blockers.length?[]:G4_L3_IN005_TEXT_BINDING.blocks.map(b=>({id:b.id,...values[b.id]!,role:b.role,language:b.language,readingOrder:b.readingOrder}))};
}
export const g4L3In005SessionIdentity=(props:Pick<AnimationRendererProps,'seed'|'replay'|'lang'|'uiLanguage'|'scenario'|'frameDomain'|'entryStateSha256'>)=>
 JSON.stringify([props.seed,props.replay??0,props.lang,props.uiLanguage??props.lang,props.scenario,props.frameDomain??G4_L3_IN005_DOMAIN,props.entryStateSha256??null]);
export function canInteractG4L3In005(props:AnimationRendererProps,snapshot:TextPresentationSnapshot){return snapshot.status==='ready'&&props.frame===144&&!props.entryStateSha256&&!props.paused
 &&typeof props.onLessonActivityRequest==='function'&&typeof props.onLessonFrameRequest==='function'&&typeof props.onLessonButtonActivityRequest==='function';}
export type In005Effect={kind:'activity';id:string}|{kind:'frame';transition:LessonTextFrameTransition};
export interface In005ActionPlan{readonly before:OrderingState;readonly next:OrderingState;readonly effect:In005Effect|null;readonly waitForCoach:boolean;readonly finalTransition:boolean;}
/** This helper only composes the unchanged answer reducer. Host admission happens
 * before the returned state is committed; it never duplicates the answer model. */
export function planG4L3In005Action(state:OrderingState,action:OrderingAction,options:{interactive:boolean;reducedMotion:boolean}):In005ActionPlan|null{
 if(!options.interactive||!['select-card','drop-card','close-wrong'].includes(action.type))return null;
 const next=reduce(state,action);if(next===state)return null;
 if(action.type!=='drop-card')return {before:state,next,effect:null,waitForCoach:false,finalTransition:false};
 if(next.outcome==='wrong')return {before:state,next,effect:{kind:'activity',id:'in005-wrong-popup'},waitForCoach:false,finalTransition:false};
 if(next.outcome!=='correct-feedback')return null;
 if(options.reducedMotion){const committed=reduce(next,{type:'feedback-complete'}),last=placedCount(next)===7;
  return {before:state,next:committed,effect:last?{kind:'frame',transition:G4_L3_IN005_TRANSITION}:{kind:'activity',id:'in005-correct-coach'},waitForCoach:false,finalTransition:last};}
 return {before:state,next,effect:{kind:'activity',id:'in005-correct-coach'},waitForCoach:true,finalTransition:false};
}
export function admitG4L3In005Plan(plan:In005ActionPlan,host:Pick<AnimationRendererProps,'onLessonActivityRequest'|'onLessonFrameRequest'>):OrderingState|null{
 const accepted=plan.effect===null||(plan.effect.kind==='activity'?host.onLessonActivityRequest?.({id:plan.effect.id,parentFrame:144})===true:host.onLessonFrameRequest?.(plan.effect.transition)===true);
 return accepted?plan.next:null;
}
export interface In005ActivityTicket{readonly revisionFloor:number;readonly revision:number|null;readonly handled:boolean;}
export function newG4L3In005ActivityTicket(activities:readonly LessonTextActivitySnapshot[]):In005ActivityTicket{
 return {revisionFloor:Math.max(0,...activities.map(a=>a.revision)),revision:null,handled:false};
}
export function observeG4L3In005Activity(ticket:In005ActivityTicket,activity:LessonTextActivitySnapshot|undefined,id:'in005-correct-coach'|'in005-complete-feedback'){
 const def=G4_L3_IN005_ACTIVITIES.find(a=>a.id===id)!;
 if(ticket.handled||!activity||activity.id!==id||activity.sourceInstanceId!==def.sourceInstanceId||activity.frameDomain!==def.frameDomain||!Number.isInteger(activity.revision)||activity.revision<=ticket.revisionFloor
  ||(ticket.revision!==null&&ticket.revision!==activity.revision)||activity.frame<def.startFrame||activity.frame>def.endFrame)return {ticket,completed:false};
 const bound={...ticket,revision:activity.revision};
 return {ticket:bound,completed:activity.status==='completed'&&activity.frame===def.endFrame};
}
export function planG4L3In005CoachCompletion(state:OrderingState):In005ActionPlan|null{
 if(state.outcome!=='correct-feedback')return null;
 const last=placedCount(state)===7;
 return {before:state,next:reduce(state,{type:'feedback-complete'}),effect:last?{kind:'activity',id:'in005-complete-feedback'}:null,waitForCoach:false,finalTransition:false};
}
export const isG4L3In005Complete=(state:OrderingState,frame:number)=>frame===186&&state.outcome==='complete'&&placedCount(state)===7;
