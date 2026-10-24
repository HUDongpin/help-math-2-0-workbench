import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextActivityCancellation} from '../lesson-text-contract';
import {createIn010Model,reduceIn010Model,type In010Model,type In010Action,type In010Effect} from './g4-l9-in010-state';
import data from './g4-l9-in010/source.generated.json';
export const IN010_ACTIVITIES=data.activities as unknown as readonly LessonTextActivityDefinition[];
export const in010Activities=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
interface Child{readonly id:string;readonly floor:number;readonly revision:number|null;readonly token:string|null}
export interface In010Session{readonly seed:number;readonly replay:number;readonly revision:number;readonly model:In010Model;readonly children:readonly Child[];readonly phase:'intro'|'terminal'|'restart-requested'|'restart-seen'}
export const createIn010Session=(seed=0,replay=0):In010Session=>({seed:seed>>>0,replay,revision:0,model:createIn010Model(seed),children:[],phase:'intro'});
const definition=(id:string)=>{const d=IN010_ACTIVITIES.find(d=>d.id===id);if(!d)throw Error('Unknown own IN010 child');return d;};
export function observeIn010Child(child:Child,activities:readonly LessonTextActivitySnapshot[]){const d=definition(child.id),matches=activities.filter(a=>a.id===child.id&&a.sourceInstanceId===d.sourceInstanceId&&a.frameDomain===d.frameDomain&&a.revision>child.floor&&Number.isSafeInteger(a.revision)&&a.cancellationToken&&(child.revision===null||child.revision===a.revision)&&(child.token===null||child.token===a.cancellationToken)&&Number.isInteger(a.frame)&&a.frame>=d.startFrame&&a.frame<=d.endFrame);return matches.length===1?matches[0]:undefined;}
export function bindIn010Children(s:In010Session,activities:readonly LessonTextActivitySnapshot[]){let changed=false;const children=s.children.map(c=>{if(c.revision!==null)return c;const a=observeIn010Child(c,activities);if(!a)return c;changed=true;return{...c,revision:a.revision,token:a.cancellationToken!};});return changed?{...s,children}:s;}
export const ownedIn010Children=(s:In010Session,activities:readonly LessonTextActivitySnapshot[])=>s.children.flatMap(c=>{const a=observeIn010Child(c,activities);return a?[a]:[];});
export function syncIn010Session(s:In010Session,r:RuntimeContext,activities:readonly LessonTextActivitySnapshot[]):In010Session{
 if((r.seed>>>0)!==s.seed||(r.replay??0)!==s.replay||(r.frameDomain??'sprite-156')!=='sprite-156'||(r.rootFrame??6)!==6)return createIn010Session(r.seed,r.replay??0);
 if(s.phase==='restart-requested'&&r.frame===270)return{...s,phase:'restart-seen',children:[]};
 if(s.phase==='restart-seen'&&r.frame===270)return s;
 if(s.phase==='restart-seen'&&r.frame===271)return{...s,revision:s.revision+1,model:createIn010Model(s.model.random,s.model.pool,s.model.round+1),children:[],phase:'terminal'};
 if(r.frame!==271)return s.phase==='intro'?s:createIn010Session(r.seed,r.replay??0);
 if(s.phase==='intro')return{...s,phase:'terminal'};
 if(s.children.some(c=>c.revision!==null&&!observeIn010Child(c,activities)))return{...createIn010Session(r.seed,r.replay??0),phase:'terminal'};
 return bindIn010Children(s,activities);
}
export const in010Terminal=(r:RuntimeContext)=>r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.frameDomain??'sprite-156')==='sprite-156'&&(r.rootFrame??6)===6&&r.frame===271;
export function in010Locked(s:In010Session,r:AnimationRendererProps){return!in010Terminal(r)||s.phase!=='terminal'||!!r.paused||!r.onLessonActivityRequest||!r.onLessonActivitiesRequest||!r.onLessonActivityCancel||!r.onLessonFrameRequest||s.children.some(c=>c.revision===null);}
export function in010ScaleFrame(s:In010Session,activities:readonly LessonTextActivitySnapshot[]){const c=s.children.find(c=>c.id.startsWith('in010-scale-'));return c?observeIn010Child(c,activities)?.frame??null:1;}
function appendChildren(s:In010Session,ids:readonly string[],activities:readonly LessonTextActivitySnapshot[]){let children=[...s.children];for(const id of ids){const d=definition(id),previous=children.filter(c=>definition(c.id).sourceInstanceId===d.sourceInstanceId),floor=Math.max(-1,...activities.filter(a=>a.sourceInstanceId===d.sourceInstanceId).map(a=>a.revision),...previous.map(c=>c.revision??c.floor));children=children.filter(c=>definition(c.id).sourceInstanceId!==d.sourceInstanceId);children.push({id,floor,revision:null,token:null});}return children;}
const effectId=(e:In010Effect)=>e.kind==='scale'?'in010-scale-'+e.start+'-'+e.end:'in010-coach-'+e.variant.toLowerCase();
/** Request exact source clocks before committing any dependent local change. */
export function dispatchIn010(s:In010Session,a:Exclude<In010Action,{type:'coach-completed'}|{type:'highlight-frame9'}>|{type:'new-problem'},r:AnimationRendererProps):In010Session{
 if(in010Locked(s,r)||(r.seed>>>0)!==s.seed||(r.replay??0)!==s.replay)return s;
 if(a.type==='new-problem'){if(!s.model.newEnabled||r.onLessonFrameRequest?.({fromFrame:271,toFrame:270,stopFrame:271})!==true)return s;return{...s,revision:s.revision+1,phase:'restart-requested',model:{...s.model,newEnabled:false,solveEnabled:true,answer:'',unboundCalls:[...s.model.unboundCalls,'NewProblem:_parent.callfun() absent-source-definition']}};}
 const action=a.type==='drop'?{...a,scaleFrame:in010ScaleFrame(s,in010Activities(r))}:a;if(action.type==='drop'&&action.scaleFrame===null)return s;const reduced=reduceIn010Model(s.model,action as In010Action);if(reduced.state===s.model)return s;
 const byInstance=new Map<string,string>();for(const effect of reduced.effects){const id=effectId(effect);byInstance.set(definition(id).sourceInstanceId!,id);}const ids=[...byInstance.values()];if(ids.length){const requests=ids.map(id=>({id,parentFrame:271}));const accepted=requests.length===1?r.onLessonActivityRequest?.(requests[0]!):r.onLessonActivitiesRequest?.(requests);if(accepted!==true)return s;}
 return{...s,revision:s.revision+1,model:reduced.state,children:ids.length?appendChildren(s,ids,in010Activities(r)):s.children};
}
export function startIn010Highlight(s:In010Session,r:AnimationRendererProps){if(!in010Terminal(r)||r.paused||s.phase!=='terminal'||s.children.some(c=>c.id==='in010-highlight'))return s;if(r.onLessonActivityRequest?.({id:'in010-highlight',parentFrame:271})!==true)return s;return{...s,children:appendChildren(s,['in010-highlight'],in010Activities(r))};}
/** Completed real children are consumed once, then retired with their exact token.
 * Hidden highlight130 loops on source clocks; visibility may be set mid-cycle by Coach134. */
export function finishIn010Children(s:In010Session,r:AnimationRendererProps):{session:In010Session;retire:readonly LessonTextActivityCancellation[]}{if(!in010Terminal(r)||r.paused)return{session:s,retire:[]};let model=s.model,children=[...s.children];const retire:LessonTextActivityCancellation[]=[];for(const child of s.children){if(!child.id.startsWith('in010-coach-')&&child.id!=='in010-highlight')continue;const d=definition(child.id),a=observeIn010Child(child,in010Activities(r));if(child.revision===null||!a||a.status!=='completed'||a.frame!==d.endFrame)continue;if(child.id==='in010-highlight')model=reduceIn010Model(model,{type:'highlight-frame9'}).state;else{const suffix=child.id.slice('in010-coach-'.length),variant=suffix==='correct'?'correct':suffix.toUpperCase()as'S1'|'S2'|'S3'|'S4';model=reduceIn010Model(model,{type:'coach-completed',variant,frame:a.frame}).state;}children=children.filter(c=>c!==child);retire.push({id:a.id,sourceInstanceId:a.sourceInstanceId,revision:a.revision,cancellationToken:a.cancellationToken!,parentFrame:271});}
 return retire.length?{session:{...s,revision:s.revision+1,model,children},retire}:{session:s,retire};}
