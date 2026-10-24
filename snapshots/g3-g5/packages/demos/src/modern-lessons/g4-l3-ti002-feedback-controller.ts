import type{AnimationRendererProps}from'../contract';
import{reduceCourseG04L03Ti002KeyTermDrag as reduce,type CourseG04L03Ti002KeyTermDragState as State,type CourseG04L03Ti002KeyTermDragAction as Action}from'../timelines/course-g04-l03-ti-002-key-term-drag-interaction';
import{TI002_FEEDBACK_ACTIVITIES as definitions}from'./g4-l3-ti002-feedback-host';
type Pending={id:string;floor:number;revision:number|null};
/** Modern reproducible choice across the source's four alternatives. Seed/draws
 * are not Flash RNG parity. A refused request never consumes a draw. */
export function createTi002FeedbackController(session:Readonly<{seed:number;replay:number}>){
 let draw=0,disposed=false,pending:Pending|null=null,lastState:State|null=null,terminal=false,status='ready';
 const allowed=(r:AnimationRendererProps,ready:boolean)=>!disposed&&ready&&!r.paused&&!r.entryStateSha256&&r.seed===session.seed&&(r.replay??0)===session.replay&&r.frame===238&&(r.frameDomain??'sprite-272')==='sprite-272'&&r.scenario==='source-static-frame';
 const choice=()=>{let x=(session.seed^Math.imul(draw+1,0x9e3779b9))>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)%4+1;};
 return{
  get status(){return status;},get drawCount(){return draw;},get pending(){return pending?{...pending}:null;},
  admitDrop(state:State,action:Extract<Action,{type:'drop-card'}>,r:AnimationRendererProps,ready:boolean){
   if(!allowed(r,ready)||pending||state.locked||lastState===state)return false;
   const next=reduce(state,action);if(next===state)return false;
   const branch=choice();
   if(next.outcome==='correct-feedback'){
    const id=`ti002-correct-${branch}`,definition=definitions.find(d=>d.id===id)!;
    const floor=Math.max(0,...(r.lessonActivities??[]).filter(a=>a.id===id&&a.sourceInstanceId===definition.sourceInstanceId).map(a=>a.revision));
    if(!r.onLessonActivityRequest?.({id,parentFrame:238})){status='correct-refused';return false;}
    pending={id,floor,revision:null};status='awaiting-correct';
   }else if(next.outcome==='wrong'){
    if(!r.onLessonActivitiesRequest?.([{id:'ti002-wrong-popup',parentFrame:238},{id:`ti002-wrong-coach-s${branch}`,parentFrame:238}])){status='wrong-refused';return false;}
    status='wrong-playing';
   }else return false;
   draw++;lastState=state;return true;
  },
  observe(state:State,r:AnimationRendererProps,ready:boolean):readonly Action[]{
   if(!allowed(r,ready))return[];
   if(state.outcome==='complete'&&!terminal){terminal=r.onLessonFrameRequest?.({fromFrame:238,toFrame:239,stopFrame:254})===true;status=terminal?'terminal-playing':'terminal-refused';return[];}
   if(!pending)return[];
   const definition=definitions.find(d=>d.id===pending!.id)!;
   const matches=(r.lessonActivities??[]).filter(a=>a.id===definition.id&&a.sourceInstanceId===definition.sourceInstanceId&&a.frameDomain===definition.frameDomain&&Number.isSafeInteger(a.revision)&&a.revision>pending!.floor);
   if(pending.revision===null){if(matches.length!==1)return[];pending.revision=matches[0].revision;}
   const completed=matches.find(a=>a.revision===pending!.revision&&a.status==='completed'&&a.frame===definition.endFrame);
   if(!completed||state.outcome!=='correct-feedback')return[];
   pending=null;status='ready';return[{type:'feedback-complete'}];
  },
  dispose(){disposed=true;pending=null;status='disposed';},
 };
}
