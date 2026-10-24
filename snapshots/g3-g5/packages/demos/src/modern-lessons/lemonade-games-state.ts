import type {RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextBinding,LessonTextFrameTransition,TextPresentationSnapshot} from '../lesson-text-contract';
import {buildLessonTextSnapshot} from '../lesson-text-snapshot';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import g3SourceModule from '../modules/course-g03-l06-gs-002';
import g4SourceModule from '../modules/course-g04-l01-gs-002';
import {LEMONADE_GAMES_SOURCE} from './generated/lemonade-games-source-v1';
import {LEMONADE_GAMES_BUTTONS} from './generated/lemonade-games-buttons-v1';
import {LEMONADE_GAMES_AUDIO} from './generated/lemonade-games-audio-v1';
export type LemonadeGameId='g3-l6-gs002'|'g4-l1-gs002';
export type LemonadeChoice='A'|'B'|'C'|'D';
export interface LemonadeTerm {readonly sourceButtonId:number;readonly sourceKey:string;readonly entryId:string}
export interface LemonadeInstance {readonly sourceInstanceId:string;readonly frameDomain:string;readonly parentLifetime:Readonly<{firstFrame:number;lastFrameExclusive:number}>}
export interface LemonadeQuestion {readonly label:string;readonly frame:number;readonly question:string;readonly sourceTextIds:readonly string[];readonly correct:string;readonly wrongMessage:string;
 readonly choices:readonly Readonly<{letter:string;text:string;fraction:readonly number[]|null;sourceTextIds:readonly string[]}>[];readonly terms:readonly LemonadeTerm[];readonly correctActivity:LemonadeInstance}
export interface LemonadeConfig {readonly id:LemonadeGameId;readonly animationId:string;readonly placementId:string;readonly sourceSwfSha256:string;readonly domain:string;
 readonly frameCount:number;readonly beginFrame:number;readonly finalFrame:number;readonly title:string;readonly titleSourceTextIds:readonly string[];
 readonly directions:readonly string[];readonly directionSourceTextIds:readonly string[];readonly questions:readonly LemonadeQuestion[];readonly terms:readonly LemonadeTerm[];readonly directionTerms:readonly LemonadeTerm[];
 readonly sourceControls:Readonly<Record<'start'|'repeat'|'skip'|'close',readonly string[]>>;
 readonly wrong:Readonly<{sprite:number;sourceTextIds:readonly string[];dynamicSourceTextIds:readonly string[];text:string;visibleFrames:readonly (readonly number[])[];popupFirst:number;holdFrame:number;outroStart:number;endFrame:number;instances:readonly (LemonadeInstance&{readonly variant:number})[]}>;
 readonly correct:readonly Readonly<{sprite:number;end:number;visibleFrames:readonly (readonly number[])[];text:string;sourceTextIds:readonly string[]}>[];
 readonly score:Readonly<{sourceTextIds:readonly string[];ordinary:Readonly<{start:number;end:number}>;hundred:Readonly<{start:number;end:number}>;instance:LemonadeInstance}>;
}
export const LEMONADE_CONFIGS=LEMONADE_GAMES_SOURCE as readonly LemonadeConfig[];
export function lemonadeConfig(id:LemonadeGameId){return LEMONADE_CONFIGS.find(c=>c.id===id)!;}
// Maintained native layout wording. Exact source strings stay in generated IR.
export function lemonadeReadableQuestion(text:string){return text.replace('theleast','the least').replace('thedecimal','the decimal');}
export function lemonadeDirections(c:LemonadeConfig){return c.directions.map(line=>c.id==='g4-l1-gs002'?line.replace('On the right you will select','Then select'):line);}
export function lemonadeModule(id:LemonadeGameId){return id==='g3-l6-gs002'?g3SourceModule:g4SourceModule;}
export function lemonadeAudio(config:LemonadeConfig,domain:string){const cue=LEMONADE_GAMES_AUDIO[config.id].find(a=>a.frameDomain===domain)!;return {...cue,language:'shared' as const,spokenLanguage:'undetermined' as const};}
export function lemonadeActivities(c:LemonadeConfig):readonly LessonTextActivityDefinition[]{
 const frames=c.questions.map(q=>q.frame),result:LessonTextActivityDefinition[]=[];
 for(const f of c.correct){const q=c.questions.find(q=>q.correctActivity.frameDomain===`sprite-${f.sprite}`)!;
  result.push({id:`correct-${f.sprite}`,...q.correctActivity,startFrame:2,endFrame:f.end,fps:12,parentFrames:c.questions.filter(q=>q.correctActivity.frameDomain===`sprite-${f.sprite}`).map(q=>q.frame),audio:lemonadeAudio(c,`sprite-${f.sprite}`)});}
 for(const f of c.wrong.instances){result.push({id:`wrong-${f.variant}`,...f,startFrame:2,endFrame:c.wrong.holdFrame,fps:12,parentFrames:frames,audio:lemonadeAudio(c,f.frameDomain)});
  result.push({id:`wrong-${f.variant}-outro`,...f,startFrame:c.wrong.outroStart,endFrame:c.wrong.endFrame,fps:12,parentFrames:frames,
   entryFromActivity:{id:`wrong-${f.variant}`,firstFrame:c.wrong.popupFirst,lastFrame:c.wrong.holdFrame},audio:lemonadeAudio(c,f.frameDomain)});}
 for(const kind of ['ordinary','hundred'] as const){const range=c.score[kind];result.push({id:`score-${kind}`,...c.score.instance,startFrame:range.start,endFrame:range.end,fps:12,parentFrames:frames});}
 for(const b of LEMONADE_GAMES_BUTTONS[c.id])result.push({id:b.id,sourceInstanceId:b.sourceInstanceId,parentLifetime:b.parentLifetime,parentFrames:b.parentFrames,buttonPress:{sourceButtonId:b.sourceButtonId},frameDomain:b.frameDomain,startFrame:1,endFrame:5,fps:12,audio:lemonadeAudio(c,b.frameDomain)});
 return Object.freeze(result);
}
export function lemonadeTransitions(c:LemonadeConfig):readonly LessonTextFrameTransition[]{
 const result:LessonTextFrameTransition[]=[];
 for(let from=1;from<=c.beginFrame;from++){if(from<c.beginFrame)result.push({fromFrame:from,toFrame:c.beginFrame,stopFrame:c.beginFrame});
  for(const q of c.questions)result.push({fromFrame:from,toFrame:q.frame,stopFrame:q.frame});}
 for(const from of c.questions)for(const to of [...c.questions.map(q=>q.frame),c.finalFrame])if(from.frame!==to)result.push({fromFrame:from.frame,toFrame:to,stopFrame:to});
 return Object.freeze(result);
}
export interface LemonadeInteraction {readonly seed:number;readonly replay:number;readonly order:readonly string[];readonly index:number;readonly started:boolean;readonly score:number;readonly directions:boolean;
 readonly answered:readonly Readonly<{question:string;choice:LemonadeChoice;correct:boolean}>[];readonly feedback:Readonly<{id:string;kind:'wrong'|'correct';revisionFloor:number;scoreActivityId:string|null;scoreRevisionFloor:number}>|null;
 readonly pendingFromFrame:number|null;readonly complete:boolean}
// Source selects questions without replacement. A seeded shuffle makes the
// Current-JS session replayable; it does not claim Flash RNG parity.
export function createLemonadeInteraction(c:LemonadeConfig,seed=0,replay=0):LemonadeInteraction{
 const normalized=Number.isSafeInteger(seed)?seed>>>0:0;let random=normalized||0x9e3779b9;const order=c.questions.map(q=>q.label);
 for(let i=order.length-1;i>0;i--){random^=random<<13;random^=random>>>17;random^=random<<5;const j=(random>>>0)%(i+1);[order[i],order[j]]=[order[j]!,order[i]!];}
 return Object.freeze({seed:normalized,replay,order:Object.freeze(order),index:0,started:false,score:0,directions:false,answered:[],feedback:null,pendingFromFrame:null,complete:false});
}
export function synchronizeLemonadeInteraction(c:LemonadeConfig,s:LemonadeInteraction,ctx:RuntimeContext){
 if(s.seed!==(ctx.seed>>>0)||s.replay!==(ctx.replay??0))return createLemonadeInteraction(c,ctx.seed,ctx.replay??0);
 return s.pendingFromFrame!==null&&s.pendingFromFrame!==ctx.frame?Object.freeze({...s,pendingFromFrame:null}):s;
}
export function lemonadeCurrentQuestion(c:LemonadeConfig,s:LemonadeInteraction){return c.questions.find(q=>q.label===s.order[s.index]);}
export type LemonadeAction=Readonly<{type:'start'|'skip'|'repeat'|'close-directions'|'feedback-complete'}>|
 Readonly<{type:'answer';choice:LemonadeChoice;revisionFloor?:number;scoreRevisionFloor?:number}>|Readonly<{type:'close-feedback';activity:LessonTextActivitySnapshot}>;
export function reduceLemonadeInteraction(c:LemonadeConfig,s:LemonadeInteraction,frame:number,a:LemonadeAction){
 const reject=(reason:string)=>({allowed:false as const,reason,nextState:s,frameRequest:null as LessonTextFrameTransition|null,activities:[] as string[],fromActivity:undefined as {id:string;revision:number}|undefined});
 const accept=(next:LemonadeInteraction,toFrame:number|null=null,activities:string[]=[],fromActivity?:{id:string;revision:number})=>({allowed:true as const,reason:null,nextState:Object.freeze(next),frameRequest:toFrame===null?null:{fromFrame:frame,toFrame,stopFrame:toFrame},activities,fromActivity});
 if(s.pendingFromFrame===frame)return reject('main-transition-pending');
 if(a.type==='skip')return !s.started&&frame<c.beginFrame&&!s.directions?accept({...s,pendingFromFrame:frame},c.beginFrame):reject('skip-not-available');
 if(a.type==='start')return !s.started&&frame>=1&&frame<=c.beginFrame&&!s.directions?accept({...s,started:true,pendingFromFrame:frame},lemonadeCurrentQuestion(c,s)!.frame):reject('start-not-available');
 if(a.type==='repeat')return frame>=(c.id==='g3-l6-gs002'?70:71)&&frame<c.finalFrame&&!s.feedback&&!s.directions?accept({...s,directions:true}):reject('repeat-not-available');
 if(a.type==='close-directions')return s.directions?accept({...s,directions:false}):reject('directions-not-open');
 const q=lemonadeCurrentQuestion(c,s);
 if(!s.started||!q||frame!==q.frame||s.complete||s.directions)return reject('question-not-active');
 if(a.type==='answer'){
  if(s.feedback||!q.choices.some(x=>x.letter===a.choice))return reject('answer-not-available');
  const correct=a.choice===q.correct,score=s.score+(correct?10:0),id=correct?`correct-${q.correctActivity.frameDomain.replace('sprite-','')}`:`wrong-${(s.seed+s.index)%3+1}`;
  const scoreActivityId=correct?`score-${score===100?'hundred':'ordinary'}`:null;
  return accept({...s,score,answered:[...s.answered,{question:q.label,choice:a.choice,correct}],feedback:{id,kind:correct?'correct':'wrong',revisionFloor:a.revisionFloor??-1,scoreActivityId,scoreRevisionFloor:a.scoreRevisionFloor??-1}},null,[id,...scoreActivityId?[scoreActivityId]:[]]);
 }
 if(a.type==='close-feedback'){
  if(!s.feedback||s.feedback.kind!=='wrong'||s.feedback.id.endsWith('-outro')||a.activity.id!==s.feedback.id||a.activity.revision<=s.feedback.revisionFloor||a.activity.frameDomain!==`sprite-${c.wrong.sprite}`||a.activity.frame<c.wrong.popupFirst||a.activity.frame>c.wrong.holdFrame)return reject('stale-or-hidden-wrong-close');
  const id=`${s.feedback.id}-outro`;return accept({...s,feedback:{...s.feedback,id,revisionFloor:a.activity.revision}},null,[id],{id:a.activity.id,revision:a.activity.revision});
 }
 if(a.type==='feedback-complete'){
  if(!s.feedback||s.feedback.kind==='wrong'&&!s.feedback.id.endsWith('-outro'))return reject('feedback-not-finished');
  const index=s.index+1,complete=index===c.questions.length,to=complete?c.finalFrame:c.questions.find(q=>q.label===s.order[index])!.frame;
  return accept({...s,index,complete,feedback:null,pendingFromFrame:frame},to);
 }
 return reject('unknown-action');
}
export function lemonadeFeedback(c:LemonadeConfig,s:LemonadeInteraction,activities:readonly LessonTextActivitySnapshot[]=[]){
 const f=s.feedback,definition=f?lemonadeActivities(c).find(a=>a.id===f.id):undefined;
 const activity=activities.find(a=>f&&a.id===f.id&&a.revision>f.revisionFloor&&a.frameDomain===definition?.frameDomain);
 const correct=c.correct.find(x=>`sprite-${x.sprite}`===activity?.frameDomain),ranges=f?.kind==='correct'?correct?.visibleFrames:c.wrong.visibleFrames;
 const score=activities.find(a=>f?.scoreActivityId===a.id&&a.revision>f.scoreRevisionFloor);
 // OH! NO becomes outlined shapes at frames 7 and 15: G3 254/271 in
 // sprite-274; G4 251/268 in sprite-271. Generated ranges cover text tags only.
 const outlinedWrongText=f?.kind==='wrong'&&(activity?.frame===7||activity?.frame===15);
 return {activity,visible:Boolean(activity&&(outlinedWrongText||ranges?.some(([first,last])=>activity.frame>=first!&&activity.frame<=last!))),
  popup:Boolean(f?.kind==='wrong'&&activity&&activity.frame>=c.wrong.popupFirst&&activity.frame<=c.wrong.holdFrame&&!f.id.endsWith('-outro')),
  complete:Boolean(activity&&definition&&activity.status==='completed'&&activity.frame===definition.endFrame&&(f?.kind==='correct'?!f.scoreActivityId||score?.status==='completed':f?.id.endsWith('-outro'))),
  text:f?.kind==='correct'?correct?.text??'':c.wrong.text};
}
export function lemonadeBinding(c:LemonadeConfig):LessonTextBinding{
 let order=0;const block=(id:string,sourceTextIds:readonly string[],role:'title'|'body'|'question'|'answer'|'label'|'feedback')=>({id,sourceTextIds,role,language:'en' as const,readingOrder:order++,valueSource:'maintained-page-state' as const});
 return Object.freeze({schemaVersion:1,version:`${c.id}-modern-text-v2`,placementId:c.placementId,animationId:c.animationId,sourceSwfSha256:c.sourceSwfSha256,template:'exercise',blocks:Object.freeze([
  block('root-title',c.titleSourceTextIds,'title'),block('directions',c.directionSourceTextIds,'body'),block('score',c.score.sourceTextIds,'label'),
  ...Object.entries(c.sourceControls).map(([id,refs])=>block(`control-${id}`,refs,'label')),
  ...c.questions.flatMap(q=>[block(q.label,q.sourceTextIds,'question'),...q.choices.map(a=>block(`${q.label}-${a.letter}`,a.sourceTextIds,'answer')),block(`${q.label}-wrong-message`,c.wrong.dynamicSourceTextIds,'feedback')]),
  block('feedback-wrong',c.wrong.sourceTextIds,'feedback'),...c.correct.map(f=>block(`feedback-${f.sprite}`,f.sourceTextIds,'feedback'))])});
}
export function lemonadeSnapshot(c:LemonadeConfig,state:SourceStaticCanvasFrameState,context:RuntimeContext,interaction?:LemonadeInteraction,activities:readonly LessonTextActivitySnapshot[]=[]):TextPresentationSnapshot{
 const expected=lemonadeModule(c.id).getFrameState(context.frame,context),s=interaction??createLemonadeInteraction(c,context.seed,context.replay??0),frame=expected.frame;
 const valid=Boolean(state&&state.status==='ready'&&expected.status==='ready'&&state.animationId===c.animationId&&state.sourceSwfSha256===c.sourceSwfSha256&&state.frame===frame&&state.frameDomain===c.domain&&(context.frameDomain??c.domain)===c.domain&&state.rootFrame===6&&(context.rootFrame===undefined||context.rootFrame===6)&&state.scenario==='source-static-frame'&&context.scenario===state.scenario&&state.language==='en'&&context.lang==='en'&&state.seed===expected.seed);
 const q=c.questions.find(q=>q.frame===frame),feedback=lemonadeFeedback(c,s,activities),content:Record<string,{text:string;visible:boolean}>={
  'root-title':{text:c.title,visible:true},directions:{text:lemonadeDirections(c).join('\n'),visible:frame<=c.beginFrame||s.directions},score:{text:`$${s.score}`,visible:frame>c.beginFrame},
  'control-start':{text:'Start',visible:frame<=c.beginFrame&&!s.started},'control-skip':{text:'Skip Directions',visible:frame<c.beginFrame&&!s.started},
  'control-repeat':{text:'Repeat Directions',visible:frame>=(c.id==='g3-l6-gs002'?70:71)&&frame<c.finalFrame},'control-close':{text:'Close',visible:s.directions||feedback.popup},
  'feedback-wrong':{text:c.wrong.text,visible:s.feedback?.kind==='wrong'&&feedback.visible}};
 for(const item of c.questions){content[item.label]={text:lemonadeReadableQuestion(item.question),visible:item===q};for(const choice of item.choices)content[`${item.label}-${choice.letter}`]={text:`${choice.letter}. ${choice.text}`,visible:item===q};content[`${item.label}-wrong-message`]={text:item.wrongMessage,visible:item===q&&feedback.popup};}
 for(const f of c.correct)content[`feedback-${f.sprite}`]={text:f.text,visible:s.feedback?.id===`correct-${f.sprite}`&&feedback.visible};
 const snapshot=buildLessonTextSnapshot(lemonadeBinding(c),{...context,frame,frameDomain:c.domain,rootFrame:6,scenario:'source-static-frame',lang:state?.language??context.lang,seed:expected.seed},content);
 return valid?snapshot:Object.freeze({...snapshot,status:'blocked',blockers:Object.freeze(['exact-source-runtime-identity-mismatch']),blocks:Object.freeze(snapshot.blocks.map(b=>({...b,visible:false})))});
}
