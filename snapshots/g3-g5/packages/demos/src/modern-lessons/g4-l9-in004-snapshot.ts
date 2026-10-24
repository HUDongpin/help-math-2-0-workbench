import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextBinding,TextPresentationSnapshot,LessonTextActivitySnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {createIn004BalanceSession,in004BalanceOwnedActivities,in004BalanceScaleFrame,type In004BalanceSession} from './g4-l9-in004-host-state';
import {finishIn004TerminalFeedback,in004FeedbackFrame,syncIn004Terminal} from './g4-l9-in004-terminal-control';
import DATA from './g4-l9-in004-intro/source-config.json';
import COPY from './g4-l9-in004-terminal/copy.json';
import BINDING from './g4-l9-in004/source-binding.json';
export const IN004_TEXT_BINDING=validateLessonTextBinding(BINDING as unknown as LessonTextBinding);
const ID='course-g04-l09-in-004',SHA='0b850b5a0c8ab48d1af46d6ba009a975ab3026237cca266f422b17a77ba771b9',DOMAIN='sprite-405';
type NativeRun={sourceTextId:string;text:string;colorRgba:readonly number[]};
type NativeNode={kind:string;characterId:number;sourceInstanceId:string;colorTransform:{multiply?:readonly number[];add?:readonly number[]}};
type NativeState={nodes:readonly NativeNode[]};
const frames=DATA.frames as unknown as readonly(readonly[number,NativeState])[],texts=new Map(DATA.texts.map(t=>[t.characterId,t]));
const blockId=(n:NativeNode)=>'intro-'+n.characterId+'-'+n.sourceInstanceId.replace(/[^A-Za-z0-9_-]/g,'-');
function intro(frame:number){let value:NativeState|undefined;for(const[at,state]of frames){if(at>frame)break;value=state;}if(!value)throw new Error('Missing source state');return value;}
const alpha=(r:NativeRun,n:NativeNode)=>Math.max(0,Math.min(255,r.colorRgba[3]!*(n.colorTransform.multiply?.[3]??256)/256+(n.colorTransform.add?.[3]??0)))/255;
export interface In004SemanticSnapshot {
 readonly basis:'source-frame-projection'|'initial-source-terminal-state'|'live-owned-terminal-session';
 readonly sessionRevision:number|null;readonly scaleFrame:number|null;readonly feedbackFrame:number;
 readonly pendingActivityIds:readonly string[];readonly ownedActivities:readonly LessonTextActivitySnapshot[];
 readonly leftExpression:string;readonly rightExpression:string;readonly equationHistory:string;
 readonly count:number|null;readonly comparisonType:'undefined'|'string'|'number';readonly comparison:string|number|null;
 readonly feedbackCompletionApplied:boolean;readonly completedFeedbackToRetire:Readonly<{id:string;revision:number;cancellationToken:string}>|null;
 readonly sourceVisibilityBasis:'exact-present-source-nodes-and-positive-source-alpha-with-paint-order-preserved';
 readonly originalAVM1CoercionEstablished:false;readonly DOMReadUsed:false;
}
export interface In004TextSnapshot extends TextPresentationSnapshot {readonly semanticState:In004SemanticSnapshot|null}
/** The ordinary two-argument capability call describes initial source state.
 * The live renderer supplies its actual React reducer session and host-owned
 * activity snapshots. No DOM reconstruction or global mutable state is used. */
export function getIn004TextSnapshot(state:SourceStaticCanvasFrameState|undefined,r:RuntimeContext,stored?:In004BalanceSession,activities:readonly LessonTextActivitySnapshot[]=[]):In004TextSnapshot {
 const blockers:string[]=[];
 if(!state||state.status!=='ready'||state.blocker||state.animationId!==ID||state.sourceSwfSha256!==SHA||state.sourceStaticVisualReady!==true)blockers.push('exact-source-state-unavailable');
 if(r.lang!=='en'||state?.language!=='en')blockers.push('source-English-visual-context-required');
 if(r.scenario!=='source-static-frame'||state?.scenario!==r.scenario||r.entryStateSha256||state?.entryStateSha256)blockers.push('original-capture-renderer-required');
 if(!Number.isSafeInteger(r.frame)||r.frame<1||r.frame>695||state?.frame!==r.frame||state?.exportFrame!==r.frame-1||(r.frameDomain??DOMAIN)!==DOMAIN||state?.frameDomain!==DOMAIN||(r.rootFrame??6)!==6||state?.rootFrame!==6||!Number.isSafeInteger(r.seed)||r.seed<0||r.seed>0xffffffff||state?.seed!==r.seed||!Number.isSafeInteger(r.replay??0)||(r.replay??0)<0||(state?.traceId??'')!==(r.traceId??'')||(state?.requirementId??'')!==(r.requirementId??''))blockers.push('source-runtime-identity-mismatch');
 if(stored&&(stored.seed!==r.seed||stored.replay!==(r.replay??0)||!Number.isSafeInteger(stored.revision)||stored.revision<0))blockers.push('semantic-session-identity-mismatch');
 const identity={frame:r.frame,frameDomain:r.frameDomain??DOMAIN,rootFrame:r.rootFrame??6,scenario:r.scenario,language:r.lang,seed:r.seed,replay:r.replay??0};
 if(blockers.length)return{schemaVersion:1,animationId:ID,bindingVersion:IN004_TEXT_BINDING.version,sourceSwfSha256:SHA,status:'blocked',blockers,identity,blocks:[],suppressedInstances:[],semanticState:null};
 const values:Record<string,{text:string;visible:boolean}>={};for(const b of IN004_TEXT_BINDING.blocks)values[b.id]={text:'',visible:false};values['root-title']={text:texts.get(293)!.runs.map(x=>x.text).join(''),visible:true};
 let semantic:In004SemanticSnapshot;
 if(r.frame<695){const projected=intro(r.frame);for(const n of projected.nodes){if(n.kind!=='text')continue;const t=texts.get(n.characterId);if(!t)throw new Error('Unbound source native text');const id=blockId(n);if(!values[id])continue;const runs=t.runs.filter(run=>alpha(run,n)>0);values[id]={text:runs.map(x=>x.text).join(''),visible:runs.some(x=>x.text.trim())};}semantic={basis:'source-frame-projection',sessionRevision:null,scaleFrame:null,feedbackFrame:1,pendingActivityIds:[],ownedActivities:[],leftExpression:'',rightExpression:'',equationHistory:'',count:null,comparisonType:'undefined',comparison:null,feedbackCompletionApplied:false,completedFeedbackToRetire:null,sourceVisibilityBasis:'exact-present-source-nodes-and-positive-source-alpha-with-paint-order-preserved',originalAVM1CoercionEstablished:false,DOMReadUsed:false};}
 else{const runtime:AnimationRendererProps={...r,lessonActivities:activities},session=syncIn004Terminal(stored??createIn004BalanceSession(r.seed,r.replay??0),runtime),finished=finishIn004TerminalFeedback(session,runtime),effective=finished.session,owned=in004BalanceOwnedActivities(effective,activities),feedbackFrame=in004FeedbackFrame(effective,runtime);
  values.title={text:COPY.title.text,visible:true};values.instructions={text:COPY.instructions.runs.map(x=>x.text).join(''),visible:true};values['new-expression']={text:COPY.newExpression.text,visible:true};for(const op of COPY.operators)values['operator-'+op.sourceTextId]={text:op.text,visible:true};values['left-expression']={text:effective.state.leftText,visible:!!effective.state.leftText.trim()};values['right-expression']={text:effective.state.rightText,visible:!!effective.state.rightText.trim()};values.history={text:effective.state.history,visible:!!effective.state.history.trim()};values.feedback={text:'Correct!!!',visible:feedbackFrame>=2&&feedbackFrame<25};
  semantic={basis:stored?'live-owned-terminal-session':'initial-source-terminal-state',sessionRevision:effective.revision,scaleFrame:in004BalanceScaleFrame(effective,activities),feedbackFrame,pendingActivityIds:effective.children.filter(c=>c.revision===null).map(c=>c.id),ownedActivities:owned.map(a=>({id:a.id,sourceInstanceId:a.sourceInstanceId,frameDomain:a.frameDomain,frame:a.frame,revision:a.revision,status:a.status,cancellationToken:a.cancellationToken})),leftExpression:effective.state.leftText,rightExpression:effective.state.rightText,equationHistory:effective.state.history,count:effective.state.count??null,comparisonType:effective.state.comparison===undefined?'undefined':typeof effective.state.comparison as 'string'|'number',comparison:effective.state.comparison??null,feedbackCompletionApplied:finished.session!==session,completedFeedbackToRetire:finished.retire?{id:finished.retire.id,revision:finished.retire.revision,cancellationToken:finished.retire.cancellationToken}:null,sourceVisibilityBasis:'exact-present-source-nodes-and-positive-source-alpha-with-paint-order-preserved',originalAVM1CoercionEstablished:false,DOMReadUsed:false};
 }
 return{schemaVersion:1,animationId:ID,bindingVersion:IN004_TEXT_BINDING.version,sourceSwfSha256:SHA,status:'ready',blockers:[],identity,blocks:IN004_TEXT_BINDING.blocks.map(b=>({id:b.id,text:values[b.id]!.text,visible:values[b.id]!.visible,role:b.role,language:b.language,readingOrder:b.readingOrder})),suppressedInstances:[],semanticState:semantic};
}
