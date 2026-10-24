import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import type {LessonTextBinding,LessonTextRole} from './lesson-text-contract';
import {p051ModuleFrame,P051_SOURCE_SHA256} from './nms-l02-p051-frame-v1';
import {p051IntroScene} from './nms-l02-p051-intro-scene-v1';
import {P051_TEXT} from './nms-l02-p051-text-v1';
import {P051_ITEMS} from './nms-l02-p051-practice-v1';
import {P051_GLOSSARY} from './generated/nms-l02-p051-glossary-v1';
import {P051_DECIMAL_NOTATION_NOTE,type P051GlossaryId} from './nms-l02-p051-glossary-v1';
const decimalIds=[74,76,78,80,82,89,84,86,87];
const fractions=[67,69,70,71,72];
const specs:[string,number[],LessonTextRole][]=[
 ['title',[53],'title'],['question',[60],'question'],['instruction',[57],'body'],['keyboard',[57],'body'],
 ['fraction-heading',[65],'heading'],['decimal-heading',[66],'heading'],['decimals-heading',[57],'label'],
 ['selection',decimalIds,'label'],['feedback',[255],'feedback'],['wrong-heading',[240,244],'feedback'],
 ['wrong-coach',[240],'body'],['wrong-close',[244],'label'],['glossary-close',[57,244],'label'],['glossary-notation',[57],'body'],
 ...[0,1,2,3].map(i=>[`wrong-step-${i}`,[241+i],'body'] as [string,number[],LessonTextRole]),
 ...P051_ITEMS.map(item=>[`item-${item.id}`,[decimalIds[item.id]!],'answer'] as [string,number[],LessonTextRole]),
 ...P051_ITEMS.filter(item=>item.fraction).flatMap((item,i)=>[
  [`fraction-${item.id}`,[fractions[i]!],'answer'],[`target-${item.id}`,[decimalIds[item.id]!],'answer'],[`target-label-${item.id}`,[fractions[i]!,66],'label'],
 ] as [string,number[],LessonTextRole][]),
 ...P051_GLOSSARY.flatMap(entry=>{
  const ids=entry.id==='column'||entry.id==='equivalent-decimal'?[57]:[240];
  return [[`term-${entry.id}`,ids,'label'],[`glossary-${entry.id}-title`,ids,'heading'],[`glossary-${entry.id}-definition`,ids,'body']] as [string,number[],LessonTextRole][];
 }),
];
/** Native control labels anchor to teaching instructions; glossary records are independently hash-bound. */
export const P051_TEXT_BINDING:LessonTextBinding={schemaVersion:1,version:'p051-native-text-v1',animationId:'shared-nms002-l02-p051',placementId:'shared-nms002-l02-p051',sourceSwfSha256:P051_SOURCE_SHA256,template:'exercise',blocks:specs.map(([id,ids,role],readingOrder)=>({id,sourceTextIds:ids.map(n=>`character-${n}`),...(id==='title'?{sourceShapeIds:[54]}:{}),role,readingOrder,language:'en',valueSource:'maintained-page-state'}))};
export function p051TextSnapshot(s:ReturnType<typeof p051ModuleFrame>,options:{selection?:number|null;glossary?:P051GlossaryId|null}={}){
 const lang=s.language,text=P051_TEXT[lang],visible=s.mainFrame!==null,intro=s.state.phase==='intro',outro=s.state.phase==='outro'||s.state.phase==='complete';
 const practice=visible&&!intro&&!outro,wrong=practice&&s.state.phase==='wrong-feedback';
 const scene=p051IntroScene(Math.min(484,s.mainFrame??1)),alpha=(id:number)=>scene.find(o=>o.characterId===id)?.alpha??0;
 const termVisible=(id:P051GlossaryId)=>id==='column'||id==='equivalent-decimal'?visible&&(!intro||alpha(id==='column'?63:62)>0):wrong;
 const glossary=options.glossary??null;
 if(glossary!==null&&(!P051_GLOSSARY.some(e=>e.id===glossary)||!termVisible(glossary)||wrong&&(glossary==='column'||glossary==='equivalent-decimal')))throw Error('P051_TEXT_GLOSSARY_STATE');
 const values:Record<string,{text:string;visible:boolean}>={};const add=(id:string,value:string,show:boolean)=>{values[id]={text:value,visible:show};};
 add('title',text.title,visible);add('question',text.question,visible&&(!intro||alpha(60)>0));add('instruction',text.instruction,visible&&(!intro||alpha(57)>0));
 add('keyboard',text.keyboard,practice);add('fraction-heading',text.fraction,visible&&(!intro||alpha(65)>0));add('decimal-heading',text.equivalentDecimal,visible&&(!intro||alpha(66)>0));
 add('decimals-heading',text.decimals,visible&&!outro);
 const selected=s.state.phase==='ready'?P051_ITEMS.find(item=>item.id===options.selection&&!s.state.solved.includes(item.id)):undefined;
 add('selection',selected?`${text.selected}: ${selected.decimal}`:'',practice&&!!selected);
 add('feedback',text.correct,practice&&['correct-feedback','completion-feedback'].includes(s.state.phase));
 add('wrong-heading',text.wrong,wrong);add('wrong-coach',text.coach,wrong);add('wrong-close',text.close,wrong);
 text.steps.forEach((value,i)=>add(`wrong-step-${i}`,value,wrong));
 for(const item of P051_ITEMS){add(`item-${item.id}`,item.decimal,visible&&(intro?alpha(decimalIds[item.id]!)>0:practice&&!s.state.solved.includes(item.id)));}
 P051_ITEMS.filter(item=>item.fraction).forEach((item,i)=>{
  const f=item.fraction!,fraction=`${f[0]}/${f[1]}`,solved=s.state.solved.includes(item.id);
  add(`fraction-${item.id}`,fraction,visible&&(!intro||alpha(fractions[i]!)>0));
  add(`target-${item.id}`,item.decimal,visible&&!intro&&solved);
  add(`target-label-${item.id}`,solved?`${text.matched}: ${fraction} = ${item.decimal}`:`${text.choose} ${fraction}`,practice);
 });
 for(const entry of P051_GLOSSARY){add(`term-${entry.id}`,entry.labels[lang],termVisible(entry.id));add(`glossary-${entry.id}-title`,entry.labels[lang],glossary===entry.id);add(`glossary-${entry.id}-definition`,entry.definitions[lang],glossary===entry.id);}
 add('glossary-close',text.close,glossary!==null);add('glossary-notation',P051_DECIMAL_NOTATION_NOTE,lang==='es'&&glossary==='equivalent-decimal');
 return buildLessonTextSnapshot({...P051_TEXT_BINDING,blocks:P051_TEXT_BINDING.blocks.map(block=>({...block,language:lang}))},{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang,seed:s.seed,replay:s.replay},values);
}
