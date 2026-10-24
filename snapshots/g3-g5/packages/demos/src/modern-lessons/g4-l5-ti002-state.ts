import type {RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextBinding,TextPresentationSnapshot} from '../lesson-text-contract';
import {buildLessonTextSnapshot} from '../lesson-text-snapshot';
import sourceModule from '../modules/course-g04-l05-ti-002';
import {findG4L5ProductCandidate} from '../g4-l5-product-candidates.generated';
import {G4_L5_TI002_SOURCE as SOURCE} from './generated/g4-l5-ti002-source-v1';
import {G4_L5_TI002_AUDIO as AUDIO} from './generated/g4-l5-ti002-audio-v1';
export {SOURCE as TI002_SOURCE};
export const TI002_MODULE=sourceModule;
export type Ti002SourceState=ReturnType<typeof sourceModule.getFrameState>;
export interface Ti002Term {readonly sourceButtonId:number;readonly sourceKey:string;readonly entryId:string}
export interface Ti002Row {readonly id:string;readonly index:number;readonly termNumber:number;readonly term:string;readonly definition:string;readonly figure:string;readonly sourceDefinitionTextIds:readonly string[];readonly sourceBankTextIds:readonly string[];readonly sourceTargetTextIds:readonly string[];readonly terms:readonly Ti002Term[]}
export const TI002_ROWS:readonly Ti002Row[]=SOURCE.rows;
export function ti002Audio(domain:string){const cue=AUDIO.find(a=>a.frameDomain===domain);if(!cue)throw new Error('Missing TI002 source audio '+domain);return{...cue,language:'shared' as const,spokenLanguage:'undetermined' as const};}
const activity=(id:string,s:{sourceInstanceId:string;frameDomain:string;parentLifetime:{firstFrame:number;lastFrameExclusive:number}},first:number,last:number,audio=false):LessonTextActivityDefinition=>({id,sourceInstanceId:s.sourceInstanceId,frameDomain:s.frameDomain,parentLifetime:s.parentLifetime,parentFrames:[261],startFrame:first,endFrame:last,fps:12,...audio?{audio:ti002Audio(s.frameDomain)}:{}});
export const TI002_ACTIVITIES:readonly LessonTextActivityDefinition[]=[activity(SOURCE.wrong.id,SOURCE.wrong,2,17,true),activity('ti002-wrong-reset',SOURCE.wrong,1,1),activity(SOURCE.correctCoach.id,SOURCE.correctCoach,2,20,true),...SOURCE.correct.map(c=>activity(c.id,c,c.startFrame,c.endFrame,true)),...SOURCE.popups.map(p=>({...activity(p.closeButton.id,p.closeButton,1,5,true),parentFrames:Array.from({length:26},(_,i)=>261+i),buttonPress:{sourceButtonId:148}})),{...activity(SOURCE.wrong.closeButton.id,SOURCE.wrong.closeButton,1,5,true),buttonPress:{sourceButtonId:168}}];
export interface Ti002MatchState {readonly seed:number;readonly matched:readonly number[];readonly selected:number|null;readonly popup:string|null;readonly phase:'intro'|'matching'|'wrong'|'awaiting-coach'|'correct-feedback'|'outro';readonly coachRevisionFloor:number;readonly wrongRevisionFloor:number;readonly feedback:Readonly<{id:string;revisionFloor:number}>|null;}
export function createTi002Match(seed:number):Ti002MatchState{return{seed:seed>>>0,matched:[],selected:null,popup:null,phase:'intro',coachRevisionFloor:-1,wrongRevisionFloor:-1,feedback:null};}
export type Ti002Action={type:'activate'}|{type:'select';term:number}|{type:'cancel-selection'}|{type:'match';term:number;target:number|null;revisionFloor:number}|{type:'close-wrong';activity:LessonTextActivitySnapshot}|{type:'open-picture';id:string}|{type:'close-picture'}|{type:'coach-complete';activity:LessonTextActivitySnapshot;revisionFloor:number}|{type:'feedback-complete';activity:LessonTextActivitySnapshot};
export function reduceTi002Match(s:Ti002MatchState,a:Ti002Action){
 const result=(state:Ti002MatchState,activities:string[]=[],frameRequest:{fromFrame:number;toFrame:number;stopFrame:number}|null=null)=>({state,activities,frameRequest}),same=result(s);
 if(a.type==='activate')return s.phase==='intro'?result({...s,phase:'matching'}):same;
 if(a.type==='close-picture')return s.popup?result({...s,popup:null}):same;
 if(a.type==='open-picture')return s.phase!=='intro'&&!s.popup&&SOURCE.popups.some(p=>p.id===a.id)?result({...s,popup:a.id}):same;
 if(s.popup&&!['coach-complete','feedback-complete'].includes(a.type))return same;
 if(a.type==='cancel-selection')return s.selected===null?same:result({...s,selected:null});
 if(a.type==='select')return s.phase==='matching'&&!s.matched.includes(a.term)&&TI002_ROWS.some(r=>r.termNumber===a.term)?result({...s,selected:a.term}):same;
 if(a.type==='match'){
  if(s.phase!=='matching'||s.matched.includes(a.term)||!TI002_ROWS.some(r=>r.termNumber===a.term))return same;
  const row=TI002_ROWS.find(r=>r.termNumber===a.target);
  if(row&&a.term===row.termNumber&&!s.matched.includes(a.target!)){const matched=[...s.matched,a.term];return result({...s,matched,selected:null,phase:matched.length===5?'awaiting-coach':'matching',coachRevisionFloor:a.revisionFloor},[SOURCE.correctCoach.id]);}
  return result({...s,selected:null,phase:'wrong',wrongRevisionFloor:a.revisionFloor},[SOURCE.wrong.id]);
 }
 if(a.type==='close-wrong'&&s.phase==='wrong'){
  const value=a.activity;if(value.id!==SOURCE.wrong.id||value.frameDomain!==SOURCE.wrong.frameDomain||value.revision<=s.wrongRevisionFloor||value.frame<2||value.frame>17)return same;
  // Source Close executes gotoAndStop(1), replacing the same placed instance;
  // its previous voice must stop rather than finish behind the closed popup.
  return result({...s,phase:'matching',selected:null},['ti002-wrong-reset']);
 }
 if(a.type==='coach-complete'&&s.phase==='awaiting-coach'&&s.matched.length===5){
  const value=a.activity;if(value.id!==SOURCE.correctCoach.id||value.frameDomain!==SOURCE.correctCoach.frameDomain||value.revision<=s.coachRevisionFloor||value.status!=='completed'||value.frame!==20)return same;
  const seed=(Math.imul(s.seed,1664525)+1013904223)>>>0,variant=Math.floor(seed/4294967296*4)+1,id='ti002-correct-'+variant;
  return result({...s,seed,phase:'correct-feedback',feedback:{id,revisionFloor:a.revisionFloor}},[id]);
 }
 if(a.type==='feedback-complete'&&s.phase==='correct-feedback'&&s.feedback){const d=SOURCE.correct.find(c=>c.id===s.feedback!.id),v=a.activity;if(d&&v.id===d.id&&v.frameDomain===d.frameDomain&&v.revision>s.feedback.revisionFloor&&v.status==='completed'&&v.frame===d.endFrame)return result({...s,phase:'outro',feedback:null},[],{fromFrame:261,toFrame:262,stopFrame:286});}
 return same;
}
export function ti002Feedback(s:Ti002MatchState,activities:readonly LessonTextActivitySnapshot[]){const definition=SOURCE.correct.find(c=>c.id===s.feedback?.id),activity=activities.find(a=>definition&&a.id===definition.id&&a.frameDomain===definition.frameDomain&&a.revision>s.feedback!.revisionFloor);return{definition,activity,visible:Boolean(activity&&definition?.visibleFrames.some(([first,last])=>activity.frame>=first&&activity.frame<=last))};}
let order=0;const block=(id:string,sourceTextIds:readonly string[],role:'title'|'body'|'question'|'answer'|'label'|'feedback',sourceShapeIds?:readonly number[])=>({id,sourceTextIds,role,language:'en' as const,readingOrder:order++,valueSource:'maintained-page-state' as const,...sourceShapeIds?{sourceShapeIds}:{}});
export const TI002_BINDING:LessonTextBinding={schemaVersion:1,version:'g4-l5-ti002-modern-text-v2',placementId:SOURCE.placementId,animationId:SOURCE.animationId,sourceSwfSha256:SOURCE.sourceSwfSha256,template:'complex-figure',blocks:[block('root-title',SOURCE.rootTitle.sourceTextIds,'title'),block('instruction',SOURCE.instruction.sourceTextIds,'body'),block('table-headings',SOURCE.table.headerSourceTextIds,'label'),block('enlarge',SOURCE.table.enlargeTextIds,'label'),...TI002_ROWS.flatMap(r=>[block('term-'+r.termNumber,r.sourceBankTextIds,'answer'),block('target-'+r.termNumber,r.sourceTargetTextIds,'answer'),block('definition-'+r.termNumber,r.sourceDefinitionTextIds,'body')]),block('figure-array',SOURCE.figures.array.sourceLabelTextIds,'label',SOURCE.figures.array.sourceShapeIds),block('figure-lattice',SOURCE.figures.lattice.sourceTextIds,'label',SOURCE.figures.lattice.sourceShapeIds),block('figure-factors',SOURCE.figures.factors.sourceTextIds,'label',SOURCE.figures.factors.sourceHighlightShapeIds),block('figure-multiples',SOURCE.figures.multiples.sourceTextIds,'label'),block('figure-product',SOURCE.figures.product.sourceTextIds,'label',SOURCE.figures.product.sourceHighlightShapeIds),block('close',SOURCE.closeSourceTextIds,'label'),block('feedback-wrong',SOURCE.wrong.sourceTextIds,'feedback'),...SOURCE.correct.map(c=>block(c.id,c.sourceTextIds,'feedback'))]};
const config=findG4L5ProductCandidate(SOURCE.animationId)!;
export function ti002Snapshot(state:Ti002SourceState,context:RuntimeContext,match=createTi002Match(context.seed),activities:readonly LessonTextActivitySnapshot[]=[]):TextPresentationSnapshot{
 const valid=Boolean(state&&config.source.swfSha256===SOURCE.sourceSwfSha256&&state.animationId===SOURCE.animationId&&state.acceptance==='engineering-only'&&state.frame===context.frame&&state.frameDomain===SOURCE.domain&&(context.frameDomain??SOURCE.domain)===SOURCE.domain&&state.rootFrame===SOURCE.hostRootFrame&&(context.rootFrame??SOURCE.hostRootFrame)===SOURCE.hostRootFrame&&state.scenario===SOURCE.hostScenario&&context.scenario===SOURCE.hostScenario&&state.language==='en'&&context.lang==='en'&&state.seed===context.seed&&state.replay===(context.replay??0)&&Number.isSafeInteger(context.frame)&&context.frame>=1&&context.frame<=286);
 const visible=context.frame>=SOURCE.table.firstVisibleFrame,feedback=ti002Feedback(match,activities),values:Record<string,{text:string;visible:boolean}>={'root-title':{text:SOURCE.rootTitle.text,visible:true},instruction:{text:SOURCE.instruction.text,visible:context.frame>=SOURCE.instruction.firstVisibleFrame},'table-headings':{text:'Key Term · Definition · Picture',visible},enlarge:{text:SOURCE.table.enlargeText,visible:context.frame>=261},close:{text:'Close',visible:Boolean(match.popup)||match.phase==='wrong'},'feedback-wrong':{text:SOURCE.wrong.text,visible:match.phase==='wrong'}};
 for(const r of TI002_ROWS){values['term-'+r.termNumber]={text:r.term,visible:visible&&!match.matched.includes(r.termNumber)};values['target-'+r.termNumber]={text:r.term,visible:visible&&match.matched.includes(r.termNumber)};values['definition-'+r.termNumber]={text:r.definition,visible};}
 for(const[id,text]of Object.entries({array:'5 columns · 3 rows',lattice:SOURCE.figures.lattice.equation,factors:'4 × 3 = 12',product:'4 × 3 = 12',multiples:'6 × 1 = 6; 6 × 2 = 12; 6 × 3 = 18; 6 × 4 = 24; 6 × 5 = 30; 6 × 6 = 36. Multiples of 6: 6, 12, 18, 24, 30, 36, …'}))values['figure-'+id]={text,visible};
 for(const c of SOURCE.correct)values[c.id]={text:c.text,visible:feedback.definition===c&&feedback.visible};
 const snapshot=buildLessonTextSnapshot(TI002_BINDING,{...context,rootFrame:SOURCE.hostRootFrame,frameDomain:SOURCE.domain},values);return valid?snapshot:{...snapshot,status:'blocked',blockers:['exact-source-product-module-identity-mismatch'],blocks:snapshot.blocks.map(b=>({...b,visible:false}))};
}
