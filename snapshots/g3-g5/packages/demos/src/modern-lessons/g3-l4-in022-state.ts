import type {RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextBinding,TextPresentationSnapshot} from '../lesson-text-contract';
import {buildLessonTextSnapshot} from '../lesson-text-snapshot';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import sourceModule from '../modules/course-g03-l04-in-022';
import {G3_L4_IN022_SOURCE as SOURCE} from './generated/g3-l4-in022-source-v1';
import {G3_L4_IN022_AUDIO as AUDIO} from './generated/g3-l4-in022-audio-v1';
export {SOURCE as IN022_SOURCE};
export const IN022_HOLDS=SOURCE.questions.map(q=>q.frame);
export const IN022_MODULE=sourceModule;
export function in022Audio(domain:string){const cue=AUDIO.find(a=>a.frameDomain===domain);if(!cue)throw new Error(`Missing IN022 source audio ${domain}`);return{...cue,language:'shared' as const,spokenLanguage:'undetermined' as const};}
const activity=(id:string,source:{sourceInstanceId:string;frameDomain:string;parentLifetime:{firstFrame:number;lastFrameExclusive:number}},startFrame:number,endFrame:number,audio=false):LessonTextActivityDefinition=>({id,sourceInstanceId:source.sourceInstanceId,frameDomain:source.frameDomain,parentLifetime:source.parentLifetime,startFrame,endFrame,fps:12,parentFrames:IN022_HOLDS,...audio?{audio:in022Audio(source.frameDomain)}:{}});
export const IN022_ACTIVITIES:readonly LessonTextActivityDefinition[]=[
 activity('in022-inactivity-initial',SOURCE.inactivity,1,120),activity('in022-inactivity-reset',SOURCE.inactivity,2,120),
 activity('in022-reminder',SOURCE.reminder,2,66,true),activity('in022-skip-emphasis',SOURCE.skipEmphasis,2,11),
 ...SOURCE.correct.map(c=>activity(c.id,c,c.startFrame,c.endFrame,true)),
 ...SOURCE.wrong.coachSegments.map(c=>activity(c.id,c,c.startFrame,c.endFrame,true)),
 {...activity(SOURCE.wrong.closeButton.id,SOURCE.wrong.closeButton,1,5,true),buttonPress:{sourceButtonId:390}},
];
export interface In022Practice {
 readonly seed:number;readonly bag:readonly number[];readonly current:number|null;readonly draws:number;readonly quotient:number;
 readonly correctCount:number;readonly mode:'intro'|'answering'|'wrong'|'correct-feedback'|'ready-for-new';readonly timerPending:boolean;
 readonly feedback:Readonly<{id:string;revisionFloor:number}>|null;
}
export function createIn022Practice(seed:number):In022Practice{return{seed:seed>>>0,bag:[],current:null,draws:0,quotient:0,correctCount:0,mode:'intro',timerPending:false,feedback:null};}
function nextRandom(seed:number){return(Math.imul(seed,1664525)+1013904223)>>>0;}
export function currentIn022Question(s:In022Practice){return s.current===null?null:SOURCE.questions[s.current]!;}
/** Keeps the source's finite bag and indefinite refill. The seeded generator is
 * maintained determinism, not equivalence with the original Flash PRNG. */
export function drawIn022Question(s:In022Practice):In022Practice{
 if(s.mode!=='intro'&&s.mode!=='ready-for-new')return s;
 const bag=s.bag.length?[...s.bag]:SOURCE.questions.map((_,i)=>i),seed=nextRandom(s.seed),index=Math.floor(seed/4294967296*bag.length),[current]=bag.splice(index,1);
 return{...s,seed,bag,current:current!,draws:s.draws+1,quotient:0,mode:'answering',timerPending:true,feedback:null};
}
export type In022Action={type:'new'}|{type:'timer-started'}|{type:'skip'}|{type:'done';revisionFloor:number}|{type:'close-wrong'}|{type:'feedback-complete';activity:LessonTextActivitySnapshot};
export function reduceIn022Practice(s:In022Practice,a:In022Action):{state:In022Practice;activities:readonly string[]} {
 const same={state:s,activities:[]};
 if(a.type==='new')return{state:drawIn022Question(s),activities:[]};
 if(a.type==='timer-started')return s.timerPending?{state:{...s,timerPending:false},activities:[]}:same;
 const q=currentIn022Question(s);if(!q||s.timerPending)return same;
 if(a.type==='skip'&&s.mode==='answering'&&s.quotient<q.quotient)return{state:{...s,quotient:s.quotient+1},activities:['in022-inactivity-reset']};
 if(a.type==='done'&&s.mode==='answering'){
  const correct=s.quotient===q.quotient,seed=nextRandom(s.seed),variant=Math.floor(seed/4294967296*4)+1,id=correct?`correct-${variant}`:`wrong-coach-${variant}`;
  return{state:{...s,seed,mode:correct?'correct-feedback':'wrong',correctCount:s.correctCount+(correct?1:0),feedback:{id,revisionFloor:a.revisionFloor}},activities:['in022-inactivity-reset',id]};
 }
 if(a.type==='close-wrong'&&s.mode==='wrong')return{state:{...s,mode:'answering',feedback:null},activities:['in022-skip-emphasis']};
 if(a.type==='feedback-complete'&&s.mode==='correct-feedback'&&s.feedback){
  const definition=SOURCE.correct.find(c=>c.id===s.feedback!.id),value=a.activity;
  if(definition&&value.id===definition.id&&value.frameDomain===definition.frameDomain&&value.revision>s.feedback.revisionFloor&&value.status==='completed'&&value.frame===definition.endFrame)
   return{state:{...s,mode:'ready-for-new',feedback:null},activities:[]};
 }
 return same;
}
export function in022Feedback(s:In022Practice,activities:readonly LessonTextActivitySnapshot[]){
 const definition=SOURCE.correct.find(c=>c.id===s.feedback?.id),active=activities.find(a=>definition&&a.id===definition.id&&a.frameDomain===definition.frameDomain&&a.revision>s.feedback!.revisionFloor);
 return{definition,activity:active,visible:Boolean(s.mode==='correct-feedback'&&active&&definition?.visibleFrames.some(([first,last])=>active.frame>=first&&active.frame<=last))};
}
export function in022Prelude(frame:number){const step=SOURCE.intro.steps.find(step=>frame>=step.firstFrame&&frame<step.lastFrameExclusive);return{visible:frame>=2&&frame<271,quotient:step?.quotient??0,multiples:(step?.shadedMultiples??[]) as readonly number[],sourceQuotientTextIds:step?.sourceTextIds??[]};}
let order=0;const block=(id:string,sourceTextIds:readonly string[],role:'title'|'body'|'question'|'answer'|'label'|'feedback')=>({id,sourceTextIds,role,language:'en' as const,readingOrder:order++,valueSource:'maintained-page-state' as const});
export const IN022_BINDING:LessonTextBinding={schemaVersion:1,version:'g3-l4-in022-modern-text-v2',placementId:SOURCE.placementId,animationId:SOURCE.animationId,sourceSwfSha256:SOURCE.sourceSwfSha256,template:'complex-figure',blocks:[
 block('root-title',SOURCE.rootTitle.sourceTextIds,'title'),block('instruction',SOURCE.instruction.sourceTextIds,'body'),block('intro-formula',SOURCE.intro.sourceFormulaTextIds,'question'),
 block('quotient',[...new Set([...SOURCE.intro.steps.flatMap(step=>step.sourceTextIds),...SOURCE.questions.flatMap(q=>q.sourceFrames.flatMap(f=>f.sourceQuotientTextIds))])],'answer'),
 ...SOURCE.gridCells.map(cell=>block(`cell-${cell.value}`,cell.sourceTextIds,'label')),
 ...SOURCE.questions.map(q=>block(q.label,q.formulaTextIds,'question')),...Object.entries(SOURCE.controls).map(([id,value])=>block(`control-${id}`,value.sourceTextIds,'label')),
 block('feedback-wrong',SOURCE.wrong.sourceTextIds,'feedback'),...SOURCE.correct.map(c=>block(`feedback-${c.id}`,c.sourceTextIds,'feedback')),
]};
export function in022Snapshot(state:SourceStaticCanvasFrameState,context:RuntimeContext,practice=createIn022Practice(context.seed),activities:readonly LessonTextActivitySnapshot[]=[]):TextPresentationSnapshot{
 const expected=sourceModule.getFrameState(context.frame,context),frame=expected.frame,prelude=in022Prelude(frame),question=currentIn022Question(practice)??SOURCE.questions.find(q=>q.frame===frame),active=Boolean(question?.frame===frame&&frame>=271),feedback=in022Feedback(practice,activities);
 const valid=Boolean(state&&state.status==='ready'&&expected.status==='ready'&&state.animationId===SOURCE.animationId&&state.sourceSwfSha256===SOURCE.sourceSwfSha256&&state.frame===frame&&state.frameDomain===SOURCE.domain&&(context.frameDomain??SOURCE.domain)===SOURCE.domain&&state.rootFrame===6&&(context.rootFrame===undefined||context.rootFrame===6)&&state.scenario==='source-static-frame'&&context.scenario===state.scenario&&state.language==='en'&&context.lang==='en'&&state.seed===expected.seed);
 const content:Record<string,{text:string;visible:boolean}>={
 'root-title':{text:SOURCE.rootTitle.text,visible:true},instruction:{text:SOURCE.instruction.text,visible:prelude.visible||active},
 'intro-formula':{text:'49 ÷ 7 =',visible:prelude.visible},quotient:{text:String(active?practice.quotient:prelude.quotient),visible:active?practice.quotient>0:prelude.visible&&prelude.quotient>0},
 'feedback-wrong':{text:SOURCE.wrong.text,visible:active&&practice.mode==='wrong'},
 };
 for(const c of SOURCE.gridCells)content[`cell-${c.value}`]={text:String(c.value),visible:prelude.visible||active};
 for(const q of SOURCE.questions)content[q.label]={text:q.formula,visible:active&&question===q};
 for(const [id,value] of Object.entries(SOURCE.controls))content[`control-${id}`]={text:value.text,visible:id==='close'?active&&practice.mode==='wrong':prelude.visible||active};
 for(const c of SOURCE.correct)content[`feedback-${c.id}`]={text:c.text,visible:feedback.visible&&feedback.definition===c};
 const snapshot=buildLessonTextSnapshot(IN022_BINDING,{...context,frame,frameDomain:SOURCE.domain,rootFrame:6,scenario:'source-static-frame',lang:state?.language??context.lang,seed:expected.seed},content);
 return valid?snapshot:{...snapshot,status:'blocked',blockers:['exact-source-runtime-identity-mismatch'],blocks:snapshot.blocks.map(b=>({...b,visible:false}))};
}
