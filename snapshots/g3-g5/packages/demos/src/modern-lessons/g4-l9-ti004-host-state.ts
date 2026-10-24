import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot} from '../lesson-text-contract';
import {createTi004State,proposeTi004,type Ti004State,type Ti004Action,type Ti004Child,type Ti004Effect} from './g4-l9-ti004-state';

/** Own source placement generations and stop edges. Audio is bound separately. */
export const TI004_CLOCKS:readonly LessonTextActivityDefinition[]=[
 {id:'g4l9-ti004-wrong',sourceInstanceId:'sprite-134/depth-58/generation-1',frameDomain:'sprite-116',parentLifetime:{firstFrame:118,lastFrameExclusive:120},parentFrames:[118],startFrame:2,endFrame:15,fps:12},
 {id:'g4l9-ti004-highlight',sourceInstanceId:'sprite-134/depth-56/generation-1',frameDomain:'sprite-112',parentLifetime:{firstFrame:118,lastFrameExclusive:119},parentFrames:[118],startFrame:2,endFrame:7,fps:12},
 {id:'g4l9-ti004-coach',sourceInstanceId:'sprite-134/depth-74/generation-1',frameDomain:'sprite-124',parentLifetime:{firstFrame:118,lastFrameExclusive:120},parentFrames:[118],startFrame:2,endFrame:20,fps:12},
 {id:'g4l9-ti004-final',sourceInstanceId:'sprite-134/depth-69/generation-1',frameDomain:'sprite-120',parentLifetime:{firstFrame:118,lastFrameExclusive:120},parentFrames:[118],startFrame:2,endFrame:25,fps:12},
];
export const TI004_FRAME_CONTROL={frameDomain:'sprite-134',completionFrame:119,transitions:[{fromFrame:118,toFrame:119,stopFrame:119}]} as const;
interface OwnedChild {readonly child:Ti004Child;readonly serial:number;readonly floor:number;readonly revision:number|null;readonly token:string|null}
export interface Ti004Session {readonly seed:number;readonly replay:number;readonly revision:number;readonly state:Ti004State;readonly children:readonly OwnedChild[]}
export const createTi004Session=(seed=0,replay=0):Ti004Session=>({seed:seed>>>0,replay,revision:0,state:createTi004State(),children:[]});
const definition=(child:Ti004Child)=>TI004_CLOCKS.find(d=>d.id==='g4l9-ti004-'+child)!;
const all=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
function observed(child:OwnedChild,activities:readonly LessonTextActivitySnapshot[]){
 const d=definition(child.child),matches=activities.filter(a=>a.id===d.id&&a.sourceInstanceId===d.sourceInstanceId&&a.frameDomain===d.frameDomain&&Number.isSafeInteger(a.revision)&&a.revision>child.floor&&Boolean(a.cancellationToken)&&(child.revision===null||child.revision===a.revision)&&(child.token===null||child.token===a.cancellationToken)&&Number.isInteger(a.frame)&&a.frame>=d.startFrame&&a.frame<=d.endFrame);
 return matches.length===1?matches[0]:undefined;
}
export function observeTi004Child(s:Ti004Session,child:Ti004Child,activities:readonly LessonTextActivitySnapshot[]){const owned=s.children.find(c=>c.child===child);return owned?observed(owned,activities):undefined;}
export function bindTi004Children(s:Ti004Session,activities:readonly LessonTextActivitySnapshot[]):Ti004Session {
 let changed=false;const children=s.children.map(c=>{if(c.revision!==null)return c;const a=observed(c,activities);if(!a)return c;changed=true;return{...c,revision:a.revision,token:a.cancellationToken!};});return changed?{...s,children}:s;
}
export function synchronizeTi004Session(s:Ti004Session,r:RuntimeContext,activities:readonly LessonTextActivitySnapshot[]=[]):Ti004Session {
 const reset=()=>s.revision||s.children.length||s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)?createTi004Session(r.seed,r.replay??0):s;
 if(s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||(r.frameDomain??'sprite-134')!=='sprite-134'||(r.rootFrame??6)!==6||r.frame<118||r.frame>119)return reset();
 if(r.frame===119){if(s.state.phase!=='continued')return reset();const wrong=s.children.find(c=>c.child==='wrong');return wrong&&wrong.revision!==null&&(s.state.wrongOpen||s.state.active.wrong!==undefined)&&!observed(wrong,activities)?reset():s;}
 if(s.children.some(c=>c.revision!==null&&!observed(c,activities)))return reset();return s;
}
function childrenAfter(s:Ti004Session,effects:readonly Ti004Effect[],activities:readonly LessonTextActivitySnapshot[]){
 let children=[...s.children];for(const effect of effects){if(effect.kind==='parent'){children=children.filter(c=>definition(c.child).parentLifetime!.lastFrameExclusive>effect.to);continue;}for(const request of effect.children){const d=definition(request.child),floor=Math.max(-1,...activities.filter(a=>a.sourceInstanceId===d.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision),...children.filter(c=>c.child===request.child).map(c=>c.revision??c.floor));children=children.filter(c=>c.child!==request.child);children.push({child:request.child,serial:effect.serial,floor,revision:null,token:null});}}return children;
}
export type Ti004HostAction=Exclude<Ti004Action,{type:'source-complete'}>|{type:'finish-child';child:Ti004Child};
const permitted=(s:Ti004Session,r:AnimationRendererProps,a:Ti004HostAction)=>r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.rootFrame??6)===6&&(r.frameDomain??'sprite-134')==='sprite-134'&&(r.frame===118||r.frame===119&&s.state.phase==='continued'&&(a.type==='close-wrong'||a.type==='finish-child'&&a.child==='wrong'))&&!r.paused&&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay;
/** Commit only after the host accepted the exact source effect. Wrong feedback
 * and highlight are one atomic sibling request. Close hides wrong feedback but
 * deliberately preserves its clock/audio until source frame15. */
export function dispatchTi004(s:Ti004Session,a:Ti004HostAction,r:AnimationRendererProps):Ti004Session {
 if(!permitted(s,r,a))return s;const activities=all(r);if(synchronizeTi004Session(s,r,activities)!==s)return s;
 if(s.children.some(c=>c.revision===null&&!observed(c,activities)))return s;
 let action:Ti004Action;
 if(a.type==='finish-child'){
  const child=s.children.find(c=>c.child===a.child),clock=child&&observed(child,activities),d=definition(a.child);
  if(!child||child.revision===null||!clock||clock.status!=='completed'||clock.frame!==d.endFrame||s.state.active[a.child]!==child.serial)return s;
  action={type:'source-complete',child:a.child,serial:child.serial,frame:clock.frame};
 }else action=a;
 const proposal=proposeTi004(s.state,action);if(proposal.state===s.state)return s;
 for(const effect of proposal.effects){
  if(effect.kind==='parent'){if(r.onLessonFrameRequest?.({fromFrame:effect.from,toFrame:effect.to,stopFrame:effect.stop})!==true)return s;}
  else {const requests=effect.children.map(c=>({id:definition(c.child).id,parentFrame:118}));const accepted=requests.length===1?r.onLessonActivityRequest?.(requests[0]!):r.onLessonActivitiesRequest?.(requests);if(accepted!==true)return s;}
 }
 return{...s,revision:s.revision+1,state:proposal.state,children:proposal.effects.length?childrenAfter(s,proposal.effects,activities):s.children};
}
export function ti004OwnedActivities(s:Ti004Session,activities:readonly LessonTextActivitySnapshot[]){return s.children.flatMap(c=>{const a=observed(c,activities);return a?[a]:[];});}
