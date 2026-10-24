import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot} from '../lesson-text-contract';
import {createTi003BalanceState,reduceTi003Balance,G4L9_TI003_SCALE,type Ti003BalanceState,type Ti003BalanceAction,type Ti003BalanceEffect} from './g4-l9-ti003-state';
const scaleInstance='sprite-502/depth-126/generation-1',feedbackInstance='sprite-502/depth-123/generation-18';
/** Exact cached placement generations; audio binding is a separate required
 * candidate input before this clock-only preparation can become a capability. */
export const G4L9_TI003_CLOCKS:readonly LessonTextActivityDefinition[]=[
 ...Object.entries(G4L9_TI003_SCALE).map(([label,[startFrame,endFrame]])=>({id:'g4l9-ti003-'+label,sourceInstanceId:scaleInstance,frameDomain:'sprite-269',parentLifetime:{firstFrame:658,lastFrameExclusive:659},parentFrames:[658],startFrame,endFrame,fps:12})),
 {id:'g4l9-ti003-feedback',sourceInstanceId:feedbackInstance,frameDomain:'sprite-258',parentLifetime:{firstFrame:658,lastFrameExclusive:659},parentFrames:[658],startFrame:2,endFrame:25,fps:12},
];
export const G4L9_TI003_FRAME_CONTROL={frameDomain:'sprite-502',completionFrame:658,transitions:[]} as const;
interface OwnedChild {readonly id:string;readonly floor:number;readonly revision:number|null;readonly token:string|null;readonly feedbackSerial:number|null}
export interface Ti003BalanceSession {readonly seed:number;readonly replay:number;readonly revision:number;readonly state:Ti003BalanceState;readonly children:readonly OwnedChild[]}
export const createTi003BalanceSession=(seed=0,replay=0):Ti003BalanceSession=>({seed:seed>>>0,replay,revision:0,state:createTi003BalanceState(),children:[]});
const definition=(id:string)=>G4L9_TI003_CLOCKS.find(d=>d.id===id)!;
const all=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
function observed(c:OwnedChild,activities:readonly LessonTextActivitySnapshot[]){const d=definition(c.id),matches=activities.filter(a=>a.id===c.id&&a.sourceInstanceId===d.sourceInstanceId&&a.frameDomain===d.frameDomain&&Number.isSafeInteger(a.revision)&&a.revision>c.floor&&a.cancellationToken&&(c.revision===null||c.revision===a.revision)&&(c.token===null||c.token===a.cancellationToken)&&Number.isInteger(a.frame)&&a.frame>=d.startFrame&&a.frame<=d.endFrame);return matches.length===1?matches[0]:undefined;}
export function synchronizeTi003Balance(s:Ti003BalanceSession,r:RuntimeContext,activities:readonly LessonTextActivitySnapshot[]=[]):Ti003BalanceSession {
 const reset=()=>s.revision||s.children.length||s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)?createTi003BalanceSession(r.seed,r.replay??0):s;
 if(s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||(r.frameDomain??'sprite-502')!=='sprite-502'||(r.rootFrame??6)!==6||r.frame!==658)return reset();
 if(s.children.some(c=>c.revision!==null&&!observed(c,activities)))return reset();return s;
}
export function bindTi003BalanceChildren(s:Ti003BalanceSession,activities:readonly LessonTextActivitySnapshot[]):Ti003BalanceSession {let changed=false;const children=s.children.map(c=>{if(c.revision!==null)return c;const a=observed(c,activities);if(!a)return c;changed=true;return{...c,revision:a.revision,token:a.cancellationToken!};});return changed?{...s,children}:s;}
export function ti003BalanceScaleFrame(s:Ti003BalanceSession,activities:readonly LessonTextActivitySnapshot[]):number|null {const child=s.children.find(c=>definition(c.id).sourceInstanceId===scaleInstance);return child?observed(child,activities)?.frame??null:1;}
function childrenAfter(s:Ti003BalanceSession,effects:readonly Ti003BalanceEffect[],activities:readonly LessonTextActivitySnapshot[]){let children=[...s.children];for(const e of effects){const id=e.kind==='scale'?'g4l9-ti003-'+e.label:'g4l9-ti003-feedback',d=definition(id),floor=Math.max(-1,...activities.filter(a=>a.sourceInstanceId===d.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision),...children.filter(c=>definition(c.id).sourceInstanceId===d.sourceInstanceId).map(c=>c.revision??c.floor));children=children.filter(c=>definition(c.id).sourceInstanceId!==d.sourceInstanceId);children.push({id,floor,revision:null,token:null,feedbackSerial:e.kind==='feedback'?e.serial:null});}return children;}
export type Ti003BalanceHostAction=Exclude<Ti003BalanceAction,{type:'right-changed'}|{type:'feedback-complete'}>|{readonly type:'right-changed';readonly text:string}|{readonly type:'finish-feedback'};
function permitted(s:Ti003BalanceSession,r:AnimationRendererProps){return r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.frameDomain??'sprite-502')==='sprite-502'&&(r.rootFrame??6)===6&&r.frame===658&&!r.paused&&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay;}
/** Commit scale and feedback together only after real host acceptance. No
 * local elapsed-time fallback, synthetic completion, or parent continuation. */
export function dispatchTi003Balance(s:Ti003BalanceSession,a:Ti003BalanceHostAction,r:AnimationRendererProps):Ti003BalanceSession {
 if(!permitted(s,r))return s;if((a.type==='new-expression'||a.type==='right-changed')&&s.children.some(c=>c.revision===null&&!observed(c,all(r))))return s;let action:Ti003BalanceAction;
 if(a.type==='right-changed'){const frame=ti003BalanceScaleFrame(s,all(r));if(frame===null)return s;action={...a,scaleFrame:frame};}
 else if(a.type==='finish-feedback'){const child=s.children.find(c=>c.id==='g4l9-ti003-feedback'),clock=child&&observed(child,all(r));if(!child||child.revision===null||!clock||clock.status!=='completed'||clock.frame!==25||child.feedbackSerial!==s.state.activeFeedback)return s;action={type:'feedback-complete',serial:child.feedbackSerial!,frame:25};}
 else action=a;
 const result=reduceTi003Balance(s.state,action);if(result.state===s.state)return s;
 if(result.effects.length){const requests=result.effects.map(e=>({id:e.kind==='scale'?'g4l9-ti003-'+e.label:'g4l9-ti003-feedback',parentFrame:658})),accepted=requests.length===1?r.onLessonActivityRequest?.(requests[0]!):r.onLessonActivitiesRequest?.(requests);if(accepted!==true)return s;}
 return{...s,revision:s.revision+1,state:result.state,children:result.effects.length?childrenAfter(s,result.effects,all(r)):s.children};
}
export function ti003BalanceOwnedActivities(s:Ti003BalanceSession,activities:readonly LessonTextActivitySnapshot[]){return s.children.flatMap(c=>{const a=observed(c,activities);return a?[a]:[];});}
