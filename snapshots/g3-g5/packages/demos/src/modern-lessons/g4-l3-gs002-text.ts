import type {RuntimeContext} from '../contract';
import type {LessonTextBinding,LessonTextBlockBinding,TextPresentationSnapshot} from '../lesson-text-contract';
import type {CourseG04L03Gs002InteractionState} from '../timelines/course-g04-l03-gs-002-interaction';
import copy from './generated/g4-l3-gs002-text.json';
import intro from './generated/g4-l3-gs002-introduction.json';
import controls from './generated/g4-l3-gs002-intro-controls.json';
import axis from './generated/g4-l3-gs002-axis.json';
import help from './generated/g4-l3-gs002-help.json';

type Definition=Omit<LessonTextBlockBinding,'language'|'readingOrder'> & {text:string};
const block=(id:string,text:string,sourceTextIds:string[],role:LessonTextBlockBinding['role']='label',dynamic=false):Definition=>
  ({id,text,sourceTextIds,role,valueSource:dynamic?'maintained-page-state':'source-static'});
const definitions:Definition[]=[
  block('title',copy.title.text,[copy.title.sourceTextId],'title'),
  block('intro-instruction',copy.introInstruction.text,[copy.introInstruction.sourceTextId],'body'),
  block('intro-help-label',copy.introHelpLabel.text,[copy.introHelpLabel.sourceTextId]),
  ...controls.frames[0].controls.map(c=>block(`intro-control-${c.role}`,c.text,[`character-${c.textId}`])),
  ...(['102','113','123'] as const).map(id=>block(`intro-symbol-${id}`,intro.texts[id].text,[`character-${id}`])),
  ...(['intro','game'] as const).flatMap(prefix=>axis.rows.map(row=>block(`${prefix}-tick-${row.value}`,row.label,[row.sourceTextId]))),
  block('time-label',`${copy.labels.time.text} (${copy.labels.hours.text}:${copy.labels.minutes.text}:${copy.labels.seconds.text})`,
    ['time','hours','minutes','seconds'].map(k=>copy.labels[k as keyof typeof copy.labels].sourceTextId)),
  block('score-label',copy.labels.score.text,[copy.labels.score.sourceTextId]),
  block('timer','',[`character-${copy.dynamicFields.timer}`],'label',true),
  block('game-score','',[`character-${copy.dynamicFields.score}`],'label',true),
  block('game-distance','',[`character-${copy.dynamicFields.distance}`],'answer',true),
  ...(['go','newGame','help'] as const).map(k=>block(`game-${k}`,copy.labels[k].text,[copy.labels[k].sourceTextId])),
  block('expired-newGame',copy.labels.newGame.text,[copy.labels.newGame.sourceTextId]),
  block('help-title',copy.labels.help.text,[copy.labels.help.sourceTextId],'heading'),
  ...copy.help.map(p=>block(`help-${p.characterId}`,p.text,[p.sourceTextId],'body')),
  ...help.labels.map(row=>block(`help-tick-${row.value}`,row.label,[row.sourceTextId])),
  ...(['help','feedback'] as const).map(k=>block(`${k}-close`,copy.labels.close.text,[copy.labels.close.sourceTextId])),
  block('source-feedback','',[`character-${copy.dynamicFields.feedback}`],'feedback',true),
];

/** Source-backed text only. Modern assistive labels and unresolved intro-score dash
 * are deliberately not assigned invented source text identities. */
export const GS002_BINDING:LessonTextBinding={schemaVersion:1,version:'g4-l3-gs002-native-v1',
  placementId:'g04-l03-placement-029',animationId:'course-g04-l03-gs-002',sourceSwfSha256:copy.sourceSwfSha256,
  template:'complex-figure',blocks:definitions.map(({text,...b},readingOrder)=>({...b,language:'en',readingOrder}))};

export function getGs002NativeContextBlockers(state:unknown,context:RuntimeContext):string[]{
  const s=state as Record<string,unknown>|null|undefined,blockers:string[]=[];
  const domain=context.frameDomain??'sprite-321',root=context.rootFrame??6;
  if(!s||s.animationId!==GS002_BINDING.animationId||s.sourceSwfSha256!==copy.sourceSwfSha256)blockers.push('source-identity-mismatch');
  if(!s||s.status!=='ready'||s.blocker)blockers.push('source-state-not-ready');
  if(!Number.isInteger(context.frame)||context.frame<1||context.frame>427||domain!=='sprite-321'||root!==6
    ||context.scenario!=='source-static-frame'||context.lang!=='en'||context.entryStateSha256)blockers.push('unsupported-native-context');
  if(s&&(s.frame!==context.frame||s.frameDomain!==domain||s.rootFrame!==root||s.scenario!==context.scenario
    ||s.language!==context.lang||s.seed!==context.seed))blockers.push('source-context-mismatch');
  return blockers;
}

/** Live game values must come from the existing reducer, never a fabricated initial snapshot. */
export function getGs002TextSnapshot(state:unknown,context:RuntimeContext,
  interaction?:CourseG04L03Gs002InteractionState):TextPresentationSnapshot{
  const blockers=getGs002NativeContextBlockers(state,context),game=context.frame===427;
  if(game&&!interaction)blockers.push('interaction-state-required');
  const opening=intro.frames[context.frame-1],demo=controls.frames[context.frame-1];
  const helpOpen=game&&interaction?.mode==='help',feedbackOpen=game&&interaction?.mode==='feedback';
  return {schemaVersion:1,animationId:GS002_BINDING.animationId,bindingVersion:GS002_BINDING.version,
    sourceSwfSha256:copy.sourceSwfSha256,status:blockers.length?'blocked':'ready',blockers,
    identity:{frame:context.frame,frameDomain:context.frameDomain??'sprite-321',rootFrame:context.rootFrame??6,
      scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0},suppressedInstances:[],
    blocks:blockers.length?[]:definitions.map((d,readingOrder)=>{
      let text=d.text,visible=true;
      if(d.id.startsWith('intro-'))visible=!game;
      if(d.id==='intro-instruction')visible=!game&&opening.instructionPresent&&opening.instructionAlpha>0;
      if(d.id.startsWith('intro-control-'))visible=!game&&demo.controls.some(c=>d.id===`intro-control-${c.role}`);
      if(d.id.startsWith('intro-symbol-'))visible=!game&&demo.symbols.some(n=>d.id===`intro-symbol-${n.characterId}`);
      if(d.id.startsWith('game-'))visible=game;
      if(d.id.startsWith('game-tick-'))visible=game&&interaction?.mode!=='expired';
      if(d.id==='timer')text=game?interaction!.timerDisplay:copy.introStatus.timerInitialText;
      if(d.id==='game-score')text=game?String(interaction!.score):'';
      if(d.id==='game-distance'){text=game?interaction!.distanceInput:'';visible=game&&Boolean(text);}
      if(d.id.startsWith('help-'))visible=helpOpen;
      if(d.id==='feedback-close')visible=feedbackOpen;
      if(d.id==='source-feedback'){text=interaction?.feedbackText??'';visible=feedbackOpen&&copy.feedback.includes(text);}
      if(d.id==='expired-newGame')visible=game&&interaction?.mode==='expired';
      return {id:d.id,text,visible,role:d.role,language:'en',readingOrder};
    })};
}
