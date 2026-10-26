import type {P053StartIntent} from './nms-l02-p053-controller-candidate';
import type {LessonHostRequest,LessonHostNavigationHandoff} from './lesson-host-contract';
const PAGE='shared-nms002-l02-p053',GAME='shared-nms002-l02-p054';
/** Minimal adapter for the audited NMS002 L2 GS list. The early L7GS03
 * basename has no match, so the source host retains/reloads the current page.
 * The later L2GS03 basename selects the next GS page. This reproduces that
 * source-static branch under this exact modern context, not observed Flash. */
export function p053StartHostRequest(intent:P053StartIntent,
 currentAnimationId:string):Extract<LessonHostRequest,{type:'navigate'}>{
 if(currentAnimationId!==PAGE||intent.framePlay!==1||
   ![1,2].includes(intent.selectedLevel)||intent.hostExecution!=='not-observed')
  throw Error('P053_START_CONTEXT');
 if(intent.startSite==='early-frame-1'&&intent.requestedBasename==='L7GS03'&&
  intent.tempSection===undefined)return {type:'navigate',targetAnimationId:PAGE};
 if(intent.startSite==='select-level-frame-693'&&intent.requestedBasename==='L2GS03'&&
  intent.tempSection===6)return {type:'navigate',targetAnimationId:GAME,handoff:{
   kind:'game-level',sourceAnimationId:PAGE,targetAnimationId:GAME,level:intent.selectedLevel}};
 throw Error('P053_START_SOURCE_BRANCH');
}
/** Consume a scoped memory-only source level only at the exact P054 target. */
export function p053HandoffLevel(handoff:LessonHostNavigationHandoff|null|undefined,
 targetAnimationId:string):1|2|null{
 if(handoff==null)return null;
 if(targetAnimationId!==GAME||handoff.kind!=='game-level'||
   handoff.sourceAnimationId!==PAGE||handoff.targetAnimationId!==GAME||
   ![1,2].includes(handoff.level))throw Error('P053_GAME_LEVEL_HANDOFF');
 return handoff.level;
}
