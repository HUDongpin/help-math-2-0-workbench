import type {LessonTextBinding,LessonTextBlockBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {P045_SOURCE_SHA256,p045ModuleFrame} from './nms-l02-p045-frame-v1';
import {p045IntroFrame} from './nms-l02-p045-intro-v1';
import {P045_COPY} from './nms-l02-p045-copy-v1';
import {p045Question} from './nms-l02-p045-practice-v1';
import {P045_GLOSSARY} from './generated/nms-l02-p045-glossary-v1';
const blocks:LessonTextBlockBinding[]=[];
function block(id:string,ids:number[],role:LessonTextBlockBinding['role']='label'){
  blocks.push(Object.freeze({id,sourceTextIds:ids.map(n=>`character-${n}`),role,readingOrder:blocks.length,language:'en',valueSource:'maintained-page-state'}));
}
block('course-title',[32],'heading');block('activity-title',[48,128],'title');block('instruction',[36],'body');
block('question-progress',[129,130]);block('watch',[36]);block('numerator-label',[124]);block('denominator-label',[125]);
block('numerator',[129,39,96,99],'answer');block('denominator',[130,101],'answer');
block('chart-description',[56],'body');block('chart-caption',[56,58]);
block('check',[51,110]);block('new-whole',[53,138]);block('help',[4,5]);block('close',[15,179]);
block('wrong',[187],'feedback');block('correct',[192],'feedback');block('reveal',[129,130],'feedback');block('complete',[129,130],'feedback');
block('help-body',[21],'body');block('help-fraction',[25,26,28,29]);block('help-description',[21],'body');
const termIds={fraction:54,show:55,'pie-chart':56,numerator:124,denominator:125,value:126};
for(const entry of P045_GLOSSARY){block(`glossary-${entry.id}`,[termIds[entry.id]]);block(`glossary-definition-${entry.id}`,[termIds[entry.id]],'body');}
/** Text IDs identify source roles. Progress, descriptions, translations and external
 * glossary definitions are maintained presentation, not literal SWF text claims. */
export const P045_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p045-native-source-v1',animationId:'shared-nms002-l02-p045',placementId:'shared-nms002-l02-p045',sourceSwfSha256:P045_SOURCE_SHA256,template:'exercise',blocks:Object.freeze(blocks)});
export function p045TextSnapshot(state:ReturnType<typeof p045ModuleFrame>,glossary:typeof P045_GLOSSARY[number]['id']|null=null){
  const lang=state.language,c=P045_COPY[lang],visible=state.mainFrame!==null,intro=state.state.phase==='intro';
  const demo=p045IntroFrame(Math.min(449,state.mainFrame??1)),content=visible&&(!intro||(state.mainFrame??1)>=5);
  const wrong=state.state.phase==='wrong-feedback',correct=state.state.phase==='correct-feedback',help=state.state.helpOpen;
  if(glossary&&(!content||help||wrong||correct||!P045_GLOSSARY.some(e=>e.id===glossary)))throw Error('P045_TEXT_GLOSSARY_STATE');
  const values:Record<string,{text:string;visible:boolean}>={};const add=(id:string,text:string,show=content)=>{values[id]={text,visible:show};};
  add('course-title','Fractions, Decimals, and Percent Concepts: Try It!',visible);add('activity-title',c.title);add('instruction',c.instruction);
  add('question-progress',`${c.question} ${state.state.questionIndex+1} / 3`,content&&!intro);add('watch',c.watch,content&&intro);
  add('numerator-label',c.numerator);add('denominator-label',c.denominator);
  const numerator=intro?demo.numerator:state.state.numerator,denominator=intro?demo.denominator:state.state.denominator;
  // Empty input controls stay visible in the renderer; they contain no text run.
  add('numerator',numerator,content&&numerator.length>0);add('denominator',denominator,content&&denominator.length>0);
  const chart=content&&(!intro||(demo.shapeId!==null&&demo.alpha>0)),q=p045Question(state.state);
  add('chart-description',intro?(lang==='es'?'Gráfico circular de la demostración; cada parte representa un décimo.':'Demonstration pie chart; each part represents one tenth.'):(lang==='es'?`Gráfico circular dividido en 10 partes iguales; ${q.numerator} están coloreadas de azul.`:`Pie chart divided into 10 equal parts; ${q.numerator} are shaded blue.`),chart);
  add('chart-caption',intro?(demo.unitLabel??''):(lang==='es'?'Gráfico circular':'Pie chart'),chart&&(!intro||Boolean(demo.unitLabel)));
  add('check',c.check);add('new-whole',c.next);add('help',c.help,content&&!intro);
  add('close',c.close,content&&(wrong||correct||help||glossary!==null));add('wrong',state.state.attempts<2?c.wrongFirst:c.wrongFinal,content&&wrong);add('correct',c.correct,content&&correct);
  add('reveal',lang==='es'?'Esta es la fracción indicada.':'Here is the requested fraction.',content&&state.state.phase==='answer-reveal');
  add('complete',lang==='es'?'Has terminado las tres fracciones.':'All three fractions finished.',content&&state.state.phase==='complete');
  add('help-body',c.helpText,content&&help);add('help-fraction',`${lang==='es'?'4 partes seleccionadas de 6':'4 selected parts out of 6'} — 4/6`,content&&help);
  add('help-description',lang==='es'?'Cuatro de seis partes iguales del círculo están coloreadas.':'Four of six equal parts of the circle are shaded.',content&&help);
  for(const entry of P045_GLOSSARY){add(`glossary-${entry.id}`,entry.labels[lang],content&&glossary===entry.id);add(`glossary-definition-${entry.id}`,entry.definitions[lang],content&&glossary===entry.id);}
  const binding={...P045_TEXT_BINDING,blocks:blocks.map(b=>({...b,language:b.id==='course-title'?'en' as const:lang}))};
  return buildLessonTextSnapshot(binding,{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,lang,seed:state.seed,replay:state.replay},values);
}
