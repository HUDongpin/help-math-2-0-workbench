import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot} from '../lesson-text-contract';
import {createIn004BalanceState,reduceIn004Balance,G4L9_IN004_SCALE,type In004BalanceState,type In004BalanceAction,type In004BalanceEffect} from './g4-l9-in004-state';
const scaleInstance='sprite-405/depth-119/generation-5',feedbackInstance='sprite-405/depth-142/generation-40';
/** Exact cached placement generations; audio binding is a separate required
 * candidate input before this clock-only preparation can become a capability. */
export const G4L9_IN004_CLOCKS:readonly LessonTextActivityDefinition[]=[
 ...Object.entries(G4L9_IN004_SCALE).map(([label,[startFrame,endFrame]])=>({id:'g4l9-in004-'+label,sourceInstanceId:scaleInstance,frameDomain:'sprite-397',parentLifetime:{firstFrame:695,lastFrameExclusive:696},parentFrames:[695],startFrame,endFrame,fps:12})),
 {id:'g4l9-in004-feedback',sourceInstanceId:feedbackInstance,frameDomain:'sprite-404',parentLifetime:{firstFrame:695,lastFrameExclusive:696},parentFrames:[695],startFrame:2,endFrame:25,fps:12},
];
export const G4L9_IN004_FRAME_CONTROL={frameDomain:'sprite-405',completionFrame:695,transitions:[]} as const;
interface OwnedChild {readonly id:string;readonly floor:number;readonly revision:number|null;readonly token:string|null;readonly feedbackSerial:number|null}
export interface In004BalanceSession {readonly seed:number;readonly replay:number;readonly revision:number;readonly state:In004BalanceState;readonly children:readonly OwnedChild[]}
export const createIn004BalanceSession=(seed=0,replay=0):In004BalanceSession=>({seed:seed>>>0,replay,revision:0,state:createIn004BalanceState(),children:[]});
const definition=(id:string)=>G4L9_IN004_CLOCKS.find(d=>d.id===id)!;
const all=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
function observed(c:OwnedChild,activities:readonly LessonTextActivitySnapshot[]){const d=definition(c.id),matches=activities.filter(a=>a.id===c.id&&a.sourceInstanceId===d.sourceInstanceId&&a.frameDomain===d.frameDomain&&Number.isSafeInteger(a.revision)&&a.revision>c.floor&&a.cancellationToken&&(c.revision===null||c.revision===a.revision)&&(c.token===null||c.token===a.cancellationToken)&&Number.isInteger(a.frame)&&a.frame>=d.startFrame&&a.frame<=d.endFrame);return matches.length===1?matches[0]:undefined;}
export function synchronizeIn004Balance(s:In004BalanceSession,r:RuntimeContext,activities:readonly LessonTextActivitySnapshot[]=[]):In004BalanceSession {
 const reset=()=>s.revision||s.children.length||s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)?createIn004BalanceSession(r.seed,r.replay??0):s;
 if(s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||(r.frameDomain??'sprite-405')!=='sprite-405'||(r.rootFrame??6)!==6||r.frame!==695)return reset();
 if(s.children.some(c=>c.revision!==null&&!observed(c,activities)))return reset();return s;
}
export function bindIn004BalanceChildren(s:In004BalanceSession,activities:readonly LessonTextActivitySnapshot[]):In004BalanceSession {let changed=false;const children=s.children.map(c=>{if(c.revision!==null)return c;const a=observed(c,activities);if(!a)return c;changed=true;return{...c,revision:a.revision,token:a.cancellationToken!};});return changed?{...s,children}:s;}
export function in004BalanceScaleFrame(s:In004BalanceSession,activities:readonly LessonTextActivitySnapshot[]):number|null {const child=s.children.find(c=>definition(c.id).sourceInstanceId===scaleInstance);return child?observed(child,activities)?.frame??null:1;}
function childrenAfter(s:In004BalanceSession,effects:readonly In004BalanceEffect[],activities:readonly LessonTextActivitySnapshot[]){let children=[...s.children];for(const e of effects){const id=e.kind==='scale'?'g4l9-in004-'+e.label:'g4l9-in004-feedback',d=definition(id),floor=Math.max(-1,...activities.filter(a=>a.sourceInstanceId===d.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision),...children.filter(c=>definition(c.id).sourceInstanceId===d.sourceInstanceId).map(c=>c.revision??c.floor));children=children.filter(c=>definition(c.id).sourceInstanceId!==d.sourceInstanceId);children.push({id,floor,revision:null,token:null,feedbackSerial:e.kind==='feedback'?e.serial:null});}return children;}
export type In004BalanceHostAction=Exclude<In004BalanceAction,{type:'right-changed'}|{type:'feedback-complete'}>|{readonly type:'right-changed';readonly text:string}|{readonly type:'finish-feedback'};
function permitted(s:In004BalanceSession,r:AnimationRendererProps){return r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.frameDomain??'sprite-405')==='sprite-405'&&(r.rootFrame??6)===6&&r.frame===695&&!r.paused&&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay;}
/** Commit scale and feedback together only after real host acceptance. No
 * local elapsed-time fallback, synthetic completion, or parent continuation. */
export function dispatchIn004Balance(s:In004BalanceSession,a:In004BalanceHostAction,r:AnimationRendererProps):In004BalanceSession {
 if(!permitted(s,r))return s;if((a.type==='new-expression'||a.type==='right-changed')&&s.children.some(c=>c.revision===null&&!observed(c,all(r))))return s;let action:In004BalanceAction;
 if(a.type==='right-changed'){const frame=in004BalanceScaleFrame(s,all(r));if(frame===null)return s;action={...a,scaleFrame:frame};}
 else if(a.type==='finish-feedback'){const child=s.children.find(c=>c.id==='g4l9-in004-feedback'),clock=child&&observed(child,all(r));if(!child||child.revision===null||!clock||clock.status!=='completed'||clock.frame!==25||child.feedbackSerial!==s.state.activeFeedback)return s;action={type:'feedback-complete',serial:child.feedbackSerial!,frame:25};}
 else action=a;
 const result=reduceIn004Balance(s.state,action);if(result.state===s.state)return s;
 if(result.effects.length){const requests=result.effects.map(e=>({id:e.kind==='scale'?'g4l9-in004-'+e.label:'g4l9-in004-feedback',parentFrame:695})),accepted=requests.length===1?r.onLessonActivityRequest?.(requests[0]!):r.onLessonActivitiesRequest?.(requests);if(accepted!==true)return s;}
 return{...s,revision:s.revision+1,state:result.state,children:result.effects.length?childrenAfter(s,result.effects,all(r)):s.children};
}
export function in004BalanceOwnedActivities(s:In004BalanceSession,activities:readonly LessonTextActivitySnapshot[]){return s.children.flatMap(c=>{const a=observed(c,activities);return a?[a]:[];});}
