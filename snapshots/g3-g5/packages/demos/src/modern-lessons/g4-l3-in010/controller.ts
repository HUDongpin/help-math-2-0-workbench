import type{AnimationRendererProps}from'../../contract';
import type{LessonTextActivitySnapshot}from'../../lesson-text-contract';
import{reduceCourseG04L03In010TemperatureDrag as reduce,type CourseG04L03In010TemperatureDragState as State,type CourseG04L03In010TemperatureDragAction as Action}from'../../timelines/course-g04-l03-in-010-temperature-drag-interaction';
import{completionAction}from'./activity-adapter';
import{IN010_AUDIO_HOST}from'./audio-host';
export type Runtime=AnimationRendererProps;
type Phase='correct'|'final';type Pending={identity:string;phase:Phase;activityId:string;floor:number;revision:number|null};
const definition=(id:string)=>{const d=IN010_AUDIO_HOST.activityTimelines.find(x=>x.id===id);if(!d)throw Error('Unknown IN010 source activity');return d;};
const exact=(a:LessonTextActivitySnapshot,id:string)=>{const d=definition(id);return a.id===d.id&&a.sourceInstanceId===d.sourceInstanceId&&a.frameDomain===d.frameDomain&&Number.isSafeInteger(a.revision)&&a.revision>=0;};
const floor=(r:Runtime,id:string)=>Math.max(0,...(r.lessonActivities??[]).filter(a=>exact(a,id)).map(a=>a.revision));
/** Pending host state only. Existing reducer remains the single quiz-state owner. */
export function createIn010SessionController(identity:string,session:Readonly<{seed:number;replay:number}>){
 let disposed=false,pending:Pending|null=null,status='ready',completionSent=false,finalCompleted=false,lastAdmittedState:State|null=null;const presses=new Map<string,NonNullable<Runtime['onLessonButtonActivityRequest']>>();
 const permitted=(r:Runtime,ready:boolean)=>!disposed&&r.seed===session.seed&&(r.replay??0)===session.replay&&ready&&!r.paused&&!r.entryStateSha256&&r.frame===264&&(r.frameDomain??'sprite-90')==='sprite-90';
 const request=(phase:Phase,r:Runtime)=>{const id=phase==='correct'?'in010-correct-coach':'in010-final-feedback';const candidate:Pending={identity,phase,activityId:id,floor:floor(r,id),revision:null};if(!r.onLessonActivityRequest?.({id,parentFrame:264}))return false;pending=candidate;status='awaiting-'+phase+'-revision';return true;};
 return{
 get status(){return status;},get pending(){return pending?{...pending}:null;},
 admitDrop(state:State,next:State,action:Extract<Action,{type:'drop-card'|'drop-outside'}>,r:Runtime,ready:boolean){if(!permitted(r,ready)||pending||state.locked||state===lastAdmittedState)return false;const expected=reduce(state,action);if(expected===state||JSON.stringify(expected)!==JSON.stringify(next))return false;if(next.outcome==='correct-feedback'){if(!request('correct',r)){status='drop-refused';return false;}lastAdmittedState=state;return true;}if(next.outcome==='wrong'){if(!r.onLessonActivityRequest?.({id:'in010-wrong-popup',parentFrame:264})){status='drop-refused';return false;}lastAdmittedState=state;status='wrong-admitted';return true;}return false;},
 observe(state:State,r:Runtime,ready:boolean):readonly Action[]{if(!permitted(r,ready)||!pending)return[];const p=pending;if(p.identity!==identity)return[];const matches=(r.lessonActivities??[]).filter(a=>exact(a,p.activityId));if(p.revision===null){const fresh=matches.filter(a=>a.revision>p.floor);if(fresh.length!==1)return[];p.revision=fresh[0].revision;status='observing-'+p.phase;}
 const action=completionAction({...p,revision:p.revision},identity,r.lessonActivities??[]);if(!action)return[];
 // Consume the exact host completion before any request or dispatch can rerender.
 pending=null;
 if(action==='feedback-complete'){const next=reduce(state,{type:action});if(next===state){status='completion-state-mismatch';return[];}if(next.outcome==='final-correct-feedback'){if(!request('final',r)){status='final-refused';return[];}}else status='ready';return[{type:action}];}
 if(state.outcome!=='final-correct-feedback'){status='completion-state-mismatch';return[];}finalCompleted=true;status='complete';return[{type:'final-feedback-complete'}];
 },
 reportCompletion(state:State,r:Runtime,ready:boolean){if(!permitted(r,ready)||state.outcome!=='complete'||!finalCompleted||completionSent)return false;completionSent=true;const accepted=r.onLessonCompletionRequest?.({id:'in010-six-card-complete',frameDomain:'sprite-90',frame:264,seed:r.seed,replay:r.replay??0})??false;status=accepted?'complete':'completion-refused';return accepted;},
 closePress(token:string,state:State,r:Runtime,ready:boolean){if(!token||presses.has(token)||state.outcome!=='wrong'||!permitted(r,ready)||!r.onLessonButtonActivityRequest)return false;if(!r.onLessonButtonActivityRequest({id:'in010-close-down',parentFrame:264,phase:'press',token}))return false;presses.set(token,r.onLessonButtonActivityRequest);return true;},
 closeRelease(token:string){const callback=presses.get(token);if(!callback)return false;presses.delete(token);return callback({id:'in010-close-down',parentFrame:264,phase:'release',token});},
 dispose(){if(disposed)return;disposed=true;pending=null;for(const[token,callback]of presses)callback({id:'in010-close-down',parentFrame:264,phase:'release',token});presses.clear();status='disposed';},
 };
}
