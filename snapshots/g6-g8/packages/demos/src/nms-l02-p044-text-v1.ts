import type {LessonTextBinding,LessonTextBlockBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {P044_SOURCE_SHA256,p044ModuleFrame} from './nms-l02-p044-frame-v1';
import {p044IntroFrame} from './nms-l02-p044-intro-v1';
import {p044IntroGuidance} from './nms-l02-p044-intro-view-v1';
import {P044_COPY} from './nms-l02-p044-practice-view-v1';
import {p044PartsLabel} from './nms-l02-p044-partition-v1';
import {p044Question} from './nms-l02-p044-practice-v1';
import {P044_GLOSSARY} from './generated/nms-l02-p044-glossary-v1';
const blocks:LessonTextBlockBinding[]=[];
function block(id:string,ids:number[],role:LessonTextBlockBinding['role']='label'){
  blocks.push(Object.freeze({id,sourceTextIds:ids.map(n=>`character-${n}`),role,readingOrder:blocks.length,language:'en',valueSource:'maintained-page-state'}));
}
block('course-title',[31],'heading');block('activity-title',[34,39],'title');block('instruction',[34,39,42,43],'body');
block('target',[51,52,15,73,74,220,221,222],'question');block('question-progress',[220],'label');
block('watch',[34,39],'body');block('guidance',[34,39,42,43,67,75],'body');
block('parts',[223]);block('decrease',[34]);block('increase',[34]);block('selection-summary',[221,222,223]);block('selection-fraction',[221,222]);
for(let i=1;i<=20;i++)block(`part-${i}`,[223]);
block('check',[50,70]);block('new-whole',[47]);block('help',[4,5]);block('close',[24,225]);
block('wrong',[233],'feedback');block('correct',[237],'feedback');block('reveal',[233],'feedback');block('complete',[220],'feedback');
block('help-body',[11,13,14,18,19],'body');block('help-fraction',[15,16,17]);
block('whole-description',[223],'body');block('help-description',[11],'body');
for(const entry of P044_GLOSSARY){block(`glossary-${entry.id}`,[entry.id==='numerator'?67:75]);block(`glossary-definition-${entry.id}`,[entry.id==='numerator'?67:75],'body');}
export const P044_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p044-native-source-v1',animationId:'shared-nms002-l02-p044',placementId:'shared-nms002-l02-p044',sourceSwfSha256:P044_SOURCE_SHA256,template:'exercise',blocks:Object.freeze(blocks)});
export function p044TextSnapshot(state:ReturnType<typeof p044ModuleFrame>,glossary:typeof P044_GLOSSARY[number]['id']|null=null){
  const lang=state.language,c=P044_COPY[lang],visible=state.mainFrame!==null,intro=state.state.phase==='intro';
  const demo=p044IntroFrame(Math.min(361,state.mainFrame??1)),content=visible&&(!intro||demo.visible);
  if(glossary&&(!content||state.state.helpOpen||['wrong-feedback','correct-feedback'].includes(state.state.phase)||!P044_GLOSSARY.some(e=>e.id===glossary)))throw Error('P044_TEXT_GLOSSARY_STATE');
  const parts=intro?demo.parts:state.state.parts,selected=intro?demo.selected:state.state.selected,target=intro?demo.target:p044Question(state.state);
  const values:Record<string,{text:string;visible:boolean}>={};const add=(id:string,text:string,show=content)=>{values[id]={text,visible:show};};
  add('course-title','Fractions, Decimals, and Percent Concepts: Try It!',visible);add('activity-title',c.title);add('instruction',c.instruction);
  add('target',target?`${target.numerator}/${target.denominator}`:'',content&&target!==null);
  add('question-progress',`${c.question} ${state.state.questionIndex+1} / 4`,content&&!intro);
  add('watch',lang==='es'?'Observa la demostración.':'Watch the demonstration.',content&&intro);
  add('guidance',demo.emphasis?p044IntroGuidance(lang)[demo.emphasis]:'',content&&intro&&demo.emphasis!==null);
  add('parts',p044PartsLabel(parts,lang));add('decrease',c.down);add('increase',c.up);
  add('selection-summary',lang==='es'?`${selected.length} de ${parts} ${parts===1?'parte seleccionada':'partes seleccionadas'}`:`${selected.length} of ${parts} ${parts===1?'part':'parts'} selected`);
  add('selection-fraction',`${selected.length}/${parts}`);
  for(let i=1;i<=20;i++)add(`part-${i}`,lang==='es'?`Parte ${i} de ${parts}`:`Part ${i} of ${parts}`,content&&i<=parts);
  add('check',c.check);add('new-whole',c.next);add('help',c.help,content&&!intro);
  const wrong=state.state.phase==='wrong-feedback',correct=state.state.phase==='correct-feedback',help=state.state.helpOpen;
  add('close',c.close,content&&(wrong||correct||help||glossary!==null));add('wrong',c.wrong,content&&wrong);add('correct',c.correct,content&&correct);
  add('reveal',c.reveal,content&&state.state.phase==='answer-reveal');add('complete',c.complete,content&&state.state.phase==='complete');
  add('help-body',c.helpText,content&&help);add('help-fraction',`${lang==='es'?'4 de 6 partes seleccionadas':'4 of 6 parts selected'} — 4/6`,content&&help);
  add('whole-description',lang==='es'?`Un todo dividido en ${p044PartsLabel(parts,lang)}`:`One whole divided into ${p044PartsLabel(parts,lang)}`);
  add('help-description',lang==='es'?'Cuatro de seis partes iguales del círculo están seleccionadas.':'Four of six equal parts of the circle are selected.',content&&help);
  for(const entry of P044_GLOSSARY){add(`glossary-${entry.id}`,entry.labels[lang],content&&glossary===entry.id);add(`glossary-definition-${entry.id}`,entry.definitions[lang],content&&glossary===entry.id);}
  const binding={...P044_TEXT_BINDING,blocks:blocks.map(b=>({...b,language:b.id==='course-title'?'en' as const:lang}))};
  return buildLessonTextSnapshot(binding,{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,lang,seed:state.seed,replay:state.replay},values);
}
