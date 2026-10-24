import type {RuntimeContext} from '../contract';
import type {LessonTextBinding,TextPresentationSnapshot,LessonTextActivitySnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {createTi004Session,synchronizeTi004Session,bindTi004Children,ti004OwnedActivities,observeTi004Child,type Ti004Session} from './g4-l9-ti004-host-state';
import DATA from './g4-l9-ti004-intro/source-config.json';
import BOARD from './g4-l9-ti004-terminal/source-config.json';
import COPY from './g4-l9-ti004-terminal/copy.json';
import BINDING from './g4-l9-ti004/source-binding.json';
export const TI004_TEXT_BINDING=validateLessonTextBinding(BINDING as unknown as LessonTextBinding);
const ID='course-g04-l09-ti-004',SHA='aab74a30241e71013cee75fa7e6224fd3e09acc7ca097f713c681b2dd6bec8eb',DOMAIN='sprite-134';
type Bounds={left:number;right:number;top:number;bottom:number};
type Run={sourceTextId:string;text:string;colorRgba:readonly number[];inkBoundsTwips:Bounds|null};
type Node={kind:string;characterId:number;sourceInstanceId:string;matrix:readonly number[];clipRefs:readonly string[];colorTransform:{multiply?:readonly number[];add?:readonly number[]}};
type Intro={nodes:readonly Node[];masks:readonly {id:string;stageBoundsTwips:Bounds}[]};
const frames=DATA.frames as unknown as readonly(readonly[number,Intro])[],texts=new Map(DATA.texts.map(t=>[t.characterId,t]));
const blockId=(n:Node)=>'intro-'+n.characterId+'-'+n.sourceInstanceId.replace(/[^A-Za-z0-9_-]/g,'-');
function intro(frame:number){let value:Intro|undefined;for(const[at,state]of frames){if(at>frame)break;value=state;}if(!value)throw new Error('Missing own TI004 intro source state');return value;}
const point=(m:readonly number[],x:number,y:number)=>[m[0]!*x+m[2]!*y+m[4]!,m[1]!*x+m[3]!*y+m[5]!] as const;
function visibleRun(run:Run,node:Node,textMatrix:readonly number[],state:Intro){
 const alpha=Math.max(0,Math.min(255,run.colorRgba[3]!*(node.colorTransform.multiply?.[3]??256)/256+(node.colorTransform.add?.[3]??0)));if(alpha<=0||!run.inkBoundsTwips)return false;
 const b=run.inkBoundsTwips,p=[[b.left,b.top],[b.right,b.top],[b.left,b.bottom],[b.right,b.bottom]].map(([x,y])=>{const a=point(textMatrix,x!,y!);return point(node.matrix,...a);});let left=Math.min(...p.map(x=>x[0])),right=Math.max(...p.map(x=>x[0])),top=Math.min(...p.map(x=>x[1])),bottom=Math.max(...p.map(x=>x[1]));
 for(const id of node.clipRefs){const m=state.masks.find(m=>m.id===id);if(!m)throw Error('Missing TI004 snapshot clip scope');left=Math.max(left,m.stageBoundsTwips.left);right=Math.min(right,m.stageBoundsTwips.right);top=Math.max(top,m.stageBoundsTwips.top);bottom=Math.min(bottom,m.stageBoundsTwips.bottom);}return right>left&&bottom>top;
}
export interface Ti004SemanticSnapshot {readonly basis:'source-frame-projection'|'initial-source-terminal-state'|'live-owned-terminal-session';readonly sessionRevision:number|null;readonly phase:string;readonly quizSection:boolean;readonly quizDragCount:number;readonly placed:readonly string[];readonly selected:string|null;readonly wrongOpen:boolean;readonly helpOpen:boolean;readonly childFrames:Readonly<Record<string,number|null>>;readonly pendingActivityIds:readonly string[];readonly ownedActivities:readonly LessonTextActivitySnapshot[];readonly DOMReadUsed:false;readonly originalRuntime:false}
export interface Ti004TextSnapshot extends TextPresentationSnapshot {readonly semanticState:Ti004SemanticSnapshot|null}
/** Snapshot consumes real source identity and the actual maintained React state.
 * A normal two-argument call never invents an already-completed learner run. */
export function getTi004TextSnapshot(state:SourceStaticCanvasFrameState|undefined,r:RuntimeContext,stored?:Ti004Session,activities:readonly LessonTextActivitySnapshot[]=[]):Ti004TextSnapshot {
 const blockers:string[]=[];
 if(!state||state.status!=='ready'||state.blocker||state.animationId!==ID||state.sourceSwfSha256!==SHA||state.sourceStaticVisualReady!==true)blockers.push('exact-source-state-unavailable');
 if(r.lang!=='en'||state?.language!=='en')blockers.push('source-English-visual-context-required');
 if(r.scenario!=='source-static-frame'||state?.scenario!==r.scenario||r.entryStateSha256||state?.entryStateSha256)blockers.push('original-capture-renderer-required');
 if(!Number.isSafeInteger(r.frame)||r.frame<1||r.frame>119||state?.frame!==r.frame||state?.exportFrame!==r.frame-1||(r.frameDomain??DOMAIN)!==DOMAIN||state?.frameDomain!==DOMAIN||(r.rootFrame??6)!==6||state?.rootFrame!==6||!Number.isSafeInteger(r.seed)||r.seed<0||r.seed>0xffffffff||state?.seed!==r.seed||!Number.isSafeInteger(r.replay??0)||(r.replay??0)<0||(state?.traceId??'')!==(r.traceId??'')||(state?.requirementId??'')!==(r.requirementId??''))blockers.push('source-runtime-identity-mismatch');
 if(stored&&(stored.seed!==r.seed||stored.replay!==(r.replay??0)||!Number.isSafeInteger(stored.revision)||stored.revision<0))blockers.push('semantic-session-identity-mismatch');
 const identity={frame:r.frame,frameDomain:r.frameDomain??DOMAIN,rootFrame:r.rootFrame??6,scenario:r.scenario,language:r.lang,seed:r.seed,replay:r.replay??0};
 if(blockers.length)return{schemaVersion:1,animationId:ID,bindingVersion:TI004_TEXT_BINDING.version,sourceSwfSha256:SHA,status:'blocked',blockers,identity,blocks:[],suppressedInstances:[],semanticState:null};
 const values:Record<string,{text:string;visible:boolean}>={};for(const b of TI004_TEXT_BINDING.blocks)values[b.id]={text:'',visible:false};values['root-title']={text:COPY.rootTitle.text,visible:true};
 const session=bindTi004Children(synchronizeTi004Session(stored??createTi004Session(r.seed,r.replay??0),r,activities),activities),s=session.state,childFrames=Object.fromEntries((['wrong','highlight','coach','final']as const).map(c=>[c,observeTi004Child(session,c,activities)?.frame??(c==='wrong'?s.wrongStoppedAt:1)]));
 if(r.frame<118){const st=intro(r.frame);for(const n of st.nodes){if(n.kind!=='text')continue;const t=texts.get(n.characterId);if(!t)throw Error('Missing own TI004 native text');const id=blockId(n);if(!values[id])continue;const runs=t.runs.filter(run=>visibleRun(run,n,t.glyphTextMatrix,st));values[id]={text:runs.map(x=>x.text).join(''),visible:runs.some(x=>x.text.trim())};}}
 else {
  const shown=!s.helpOpen;values.instructions={text:COPY.instructions.runs.map(x=>x.text).join(''),visible:shown};values.exercise={text:COPY.exercise.text,visible:shown};values.note={text:COPY.note.text,visible:shown};
  for(const c of BOARD.cards)values['card-'+c.id]={text:c.text,visible:shown&&r.frame===118&&!s.placed.includes(c.id as never)};
  for(const t of BOARD.targets){values['equation-'+t.id]={text:t.equation,visible:shown};values['target-'+t.id]={text:t.text,visible:shown&&BOARD.cards.some(c=>c.target===t.id&&s.placed.includes(c.id as never))};}
  values.wrong={text:COPY.wrong.text,visible:s.wrongOpen};values['wrong-close']={text:COPY.help.close.text,visible:values.wrong.visible};values.final={text:COPY.final.text,visible:r.frame===118&&s.phase==='final'&&childFrames.final!>=2&&childFrames.final!<25};values['help-button']={text:COPY.help.button.text,visible:r.frame===118&&!s.helpOpen};values['help-close']={text:COPY.help.close.text,visible:r.frame===118&&s.helpOpen};values['help-definition']={text:COPY.help.body.runs.slice(0,12).map(x=>x.text).join(''),visible:r.frame===118&&s.helpOpen};for(let i=12;i<=16;i++)values['help-run-'+i]={text:COPY.help.body.runs[i]!.text,visible:r.frame===118&&s.helpOpen};
 }
 const semantic:Ti004SemanticSnapshot={basis:r.frame<118?'source-frame-projection':stored?'live-owned-terminal-session':'initial-source-terminal-state',sessionRevision:r.frame<118?null:session.revision,phase:s.phase,quizSection:s.quizSection,quizDragCount:s.quizDragCount,placed:s.placed,selected:s.selected,wrongOpen:s.wrongOpen,helpOpen:s.helpOpen,childFrames,pendingActivityIds:session.children.filter(c=>c.revision===null).map(c=>'g4l9-ti004-'+c.child),ownedActivities:ti004OwnedActivities(session,activities),DOMReadUsed:false,originalRuntime:false};
 return{schemaVersion:1,animationId:ID,bindingVersion:TI004_TEXT_BINDING.version,sourceSwfSha256:SHA,status:'ready',blockers:[],identity,blocks:TI004_TEXT_BINDING.blocks.map(b=>({id:b.id,text:values[b.id]!.text,visible:values[b.id]!.visible,role:b.role,language:b.language,readingOrder:b.readingOrder})),suppressedInstances:[],semanticState:semantic};
}
