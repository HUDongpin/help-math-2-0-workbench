import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition, LessonTextActivitySnapshot} from '../lesson-text-contract';

// Own shipped VB014: sprite67 holds at139. Card38 sets big; card34 requires it.
// Coach60 and Correct66 are siblings, not successive feedback phases.
export const VB014_SOURCE_SHA256='0d528b8128853665ab131e9c6c3d860a7ed45c6d4a3f54df34a349a9ed9c2153';
export type Vb014Card='plus4'|'minus4'|'plus6'|'minus6'|'minus10'|'plus10';
export type Vb014Target='Mc_NumLine'|'Mc_NumLine1';
export const VB014_CARDS:readonly Vb014Card[]=['plus4','minus4','plus6','minus6','minus10','plus10'];
const activity=(id:string,depth:number,sprite:number,startFrame:number,endFrame:number):LessonTextActivityDefinition=>({
  id,sourceInstanceId:`sprite-67/depth-${depth}/generation-1`,frameDomain:`sprite-${sprite}`,
  parentLifetime:{firstFrame:139,lastFrameExclusive:140},parentFrames:[139],startFrame,endFrame,fps:12,
});
// Source timing/identity only. The native presentation must add source-bound audio.
export const VB014_FEEDBACK_TIMELINES:readonly LessonTextActivityDefinition[]=[
  activity('vb014-coach',55,60,2,20),activity('vb014-final',59,66,2,25),
  activity('vb014-wrong-1',57,62,3,16),activity('vb014-wrong-2',57,62,18,27),
  activity('vb014-wrong-3',57,62,31,36),activity('vb014-wrong-4',57,62,40,54),
];
export const VB014_FRAME_CONTROL={frameDomain:'sprite-67',completionFrame:171,
  transitions:[{fromFrame:139,toFrame:140,stopFrame:171}]} as const;
type OwnedChild=Readonly<{id:string;floor:number;revision:number|null;token:string|null}>;
export interface Vb014Session {
  readonly seed:number;readonly replay:number;readonly random:number;
  readonly placed:readonly Vb014Card[];readonly selected:Vb014Card|null;
  readonly wrongOpen:boolean;readonly children:readonly OwnedChild[];readonly continued:boolean;
}
export function createVb014Session(seed=0,replay=0):Vb014Session {
  return {seed:seed>>>0,replay,random:seed>>>0,placed:[],selected:null,wrongOpen:false,children:[],continued:false};
}
const definition=(id:string)=>VB014_FEEDBACK_TIMELINES.find(d=>d.id===id);
const activities=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
const exact=(a:LessonTextActivitySnapshot,id:string)=>{
  const d=definition(id);
  return Boolean(d&&a.id===id&&a.sourceInstanceId===d.sourceInstanceId&&a.frameDomain===d.frameDomain
    &&Number.isSafeInteger(a.revision)&&a.revision>=0&&Number.isInteger(a.frame)
    &&a.frame>=d.startFrame&&a.frame<=d.endFrame&&a.cancellationToken);
};
function observed(child:OwnedChild,all:readonly LessonTextActivitySnapshot[]) {
  const matches=all.filter(a=>exact(a,child.id)&&a.revision>child.floor
    &&(child.revision===null||a.revision===child.revision)&&(child.token===null||a.cancellationToken===child.token));
  return matches.length===1?matches[0]:undefined;
}
export function synchronizeVb014Session(s:Vb014Session,r:RuntimeContext,all:readonly LessonTextActivitySnapshot[]=[]):Vb014Session {
  const reset=()=>createVb014Session(r.seed,r.replay??0);
  if(s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||(r.frameDomain??'sprite-67')!=='sprite-67'||r.frame<139)return reset();
  if(r.frame>139)return s.continued?s:reset();
  // Completed snapshots remain at the hold. Seek/Replay invalidates their tokens.
  // An accepted asynchronous request may await its first host snapshot.
  if(s.children.some(c=>c.revision!==null&&!observed(c,all)))return reset();
  return s;
}
export function bindVb014Children(s:Vb014Session,all:readonly LessonTextActivitySnapshot[]):Vb014Session {
  let changed=false;
  const children=s.children.map(c=>{
    if(c.revision!==null)return c;
    const a=observed(c,all);if(!a)return c;
    changed=true;return {...c,revision:a.revision,token:a.cancellationToken!};
  });
  return changed?{...s,children}:s;
}
function requestedChildren(s:Vb014Session,ids:readonly string[],all:readonly LessonTextActivitySnapshot[]) {
  let children=[...s.children];
  for(const id of ids){
    const d=definition(id)!;
    const floor=Math.max(-1,...all.filter(a=>a.sourceInstanceId===d.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision),
      ...children.filter(c=>definition(c.id)?.sourceInstanceId===d.sourceInstanceId).map(c=>c.revision??c.floor));
    children=children.filter(c=>definition(c.id)?.sourceInstanceId!==d.sourceInstanceId);
    children.push({id,floor,revision:null,token:null});
  }
  return children;
}
const permitted=(s:Vb014Session,r:AnimationRendererProps)=>r.lang==='en'&&r.scenario==='source-static-frame'
  &&!r.entryStateSha256&&(r.frameDomain??'sprite-67')==='sprite-67'&&(r.rootFrame??6)===6
  &&r.frame===139&&!r.paused&&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay&&!s.continued;
const enabled=(s:Vb014Session,card:Vb014Card)=>VB014_CARDS.includes(card)&&!s.placed.includes(card);
export type Vb014Action=
  |{type:'press';card:Vb014Card}
  |{type:'drop';card?:Vb014Card;target:Vb014Target|null}
  |{type:'close-wrong'}|{type:'finish'};
export function reduceVb014(s:Vb014Session,action:Vb014Action,all:readonly LessonTextActivitySnapshot[]=[]) {
  const same={state:s,activities:[] as readonly string[],frameRequest:null as {fromFrame:number;toFrame:number;stopFrame:number}|null};
  if(s.continued)return same;
  if(action.type==='press')return enabled(s,action.card)?{...same,state:{...s,selected:action.card,wrongOpen:false}}:same;
  // The source Close hides the panel. It does not stop the sibling wrong coach.
  // Its undefined Enable_btn helper remains an original-runtime evidence gap.
  if(action.type==='close-wrong')return s.wrongOpen?{...same,state:{...s,wrongOpen:false}}:same;
  if(action.type==='finish'){
    const child=s.children.find(c=>c.id==='vb014-final'),a=child&&observed(child,all);
    if(s.placed.length!==2||!child||child.revision===null||!a||a.status!=='completed'||a.frame!==25)return same;
    return {...same,state:{...s,continued:true,selected:null,wrongOpen:false},frameRequest:VB014_FRAME_CONTROL.transitions[0]};
  }
  const card=action.card??s.selected;if(!card||!enabled(s,card))return same;
  const correct=card==='plus6'&&action.target==='Mc_NumLine'
    ||card==='plus4'&&action.target==='Mc_NumLine1'&&s.placed.includes('plus6');
  if(correct){
    const placed=[...s.placed,card],ids=placed.length===2?['vb014-coach','vb014-final']:['vb014-coach'];
    return {...same,state:{...s,placed,selected:null,wrongOpen:false,children:requestedChildren(s,ids,all)},activities:ids};
  }
  // Same deterministic LCG used by existing native lessons; not Flash RNG parity.
  const random=(Math.imul(s.random,1664525)+1013904223)>>>0;
  const ids=['vb014-wrong-'+(1+Math.floor(random/4294967296*4))];
  return {...same,state:{...s,random,selected:null,wrongOpen:true,children:requestedChildren(s,ids,all)},activities:ids};
}
/** Commit only after the exact host effect is accepted. A second correct drop
 * is one atomic sibling request; never substitute two serial requests. */
export function dispatchVb014(s:Vb014Session,action:Vb014Action,r:AnimationRendererProps):Vb014Session {
  if(!permitted(s,r))return s;
  const result=reduceVb014(s,action,activities(r));if(result.state===s)return s;
  if(result.frameRequest&&r.onLessonFrameRequest?.(result.frameRequest)!==true)return s;
  if(result.activities.length){
    const requests=result.activities.map(id=>({id,parentFrame:139}));
    const accepted=requests.length>1?r.onLessonActivitiesRequest?.(requests):r.onLessonActivityRequest?.(requests[0]!);
    if(accepted!==true)return s;
  }
  return result.state;
}
