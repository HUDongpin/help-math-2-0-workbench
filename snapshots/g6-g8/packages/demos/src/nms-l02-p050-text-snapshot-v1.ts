import {p050TargetLabel,p050SelectionText} from './nms-l02-p050-interaction-text-v1';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import type {LessonTextBinding,LessonTextRole} from './lesson-text-contract';
import {p050ModuleFrame,P050_SOURCE_SHA256} from './nms-l02-p050-frame-v1';
import {p050Intro} from './nms-l02-p050-intro-v1';
import {P050_TEXT} from './nms-l02-p050-text-v1';
import {P050_ITEMS} from './nms-l02-p050-practice-v1';
import {P050_GLOSSARY,P050_DECIMAL_NOTATION} from './generated/nms-l02-p050-glossary-v1';
import {P050_MAIN_GLOSSARY} from './generated/nms-l02-p050-main-glossary-v1';
const specs:[string,number[],LessonTextRole][]=[
 ['main-glossary-close',[29],'label'],['main-glossary-notation',[41],'body'],
 ...P050_MAIN_GLOSSARY.flatMap(entry=>[[`main-glossary-${entry.id}-title`,[entry.id==='decimal'?63:entry.id==='position'?65:66],'heading'],[`main-glossary-${entry.id}-definition`,[entry.id==='decimal'?63:entry.id==='position'?65:66],'body']] as [string,number[],LessonTextRole][]),
 ...P050_MAIN_GLOSSARY.map(entry=>[`main-term-${entry.id}`,[entry.id==='decimal'?63:entry.id==='position'?65:66],'label'] as [string,number[],LessonTextRole]),
 ['title',[37],'title'],['question',[50],'question'],['instruction',[48],'body'],['keyboard',[48],'body'],['help-instruction',[54],'body'],
 ['selection',[41,42,43,44,45],'label'],['demo',[40],'answer'],['help-trigger',[4,5],'label'],['feedback',[84],'feedback'],['complete',[84],'feedback'],
 ['help-heading',[4],'heading'],['help-explanation',[9],'body'],['help-example',[15],'body'],['help-half',[23],'answer'],['help-close',[29],'label'],
 ['wrong-heading',[87],'feedback'],['wrong-close',[29],'label'],['terms-heading',[9,15],'heading'],['glossary-close',[29],'label'],['glossary-notation',[23],'body'],
 ...[0,1,2,3].flatMap(n=>[[`axis-${n}`,[19+n],'label'],[`help-axis-${n}`,[19+n],'label']] as [string,number[],LessonTextRole][]),
 ...P050_ITEMS.flatMap(item=>[[`item-${item.id}`,[40+item.id],'answer'],[`target-${item.id}`,[40+item.id],'answer'],[`target-label-${item.id}`,[40+item.id],'label']] as [string,number[],LessonTextRole][]),
 ...P050_GLOSSARY.flatMap(entry=>[[`term-${entry.id}`,[9,15],'label'],[`glossary-${entry.id}-title`,[9,15],'heading'],[`glossary-${entry.id}-definition`,[9,15],'body']] as [string,number[],LessonTextRole][]),
];
/** Source roles anchor native additions; glossary bodies have separate exact-source audit bindings. */
export const P050_TEXT_BINDING:LessonTextBinding={schemaVersion:1,version:'p050-native-text-v1',animationId:'shared-nms002-l02-p050',placementId:'shared-nms002-l02-p050',sourceSwfSha256:P050_SOURCE_SHA256,template:'exercise',blocks:specs.map(([id,ids,role],readingOrder)=>({id,sourceTextIds:ids.map(n=>`character-${n}`),...(id==='title'?{sourceShapeIds:[38]}:{}),role,readingOrder,language:'en',valueSource:'maintained-page-state'}))};
export function p050TextSnapshot(s:ReturnType<typeof p050ModuleFrame>,options:{mainGlossary?:typeof P050_MAIN_GLOSSARY[number]['id']|null;selection?:number|null;glossary?:typeof P050_GLOSSARY[number]['id']|null}={}){
 const lang=s.language,text=P050_TEXT[lang],visible=s.mainFrame!==null,intro=s.state.phase==='intro',outro=s.state.phase==='outro'||s.state.phase==='complete';
 const practice=visible&&!intro&&!outro,help=practice&&s.state.helpOpen,wrong=practice&&s.state.phase==='wrong-feedback',glossary=options.glossary??null;
 if(glossary!==null&&(!help||!P050_GLOSSARY.some(entry=>entry.id===glossary)))throw Error('P050_TEXT_GLOSSARY_STATE');
 const mainGlossary=options.mainGlossary??null;
 if(mainGlossary!==null&&(!visible||help||wrong||glossary!==null||!P050_MAIN_GLOSSARY.some(entry=>entry.id===mainGlossary)))throw Error('P050_TEXT_MAIN_GLOSSARY_STATE');
 const source=p050Intro(Math.min(208,s.mainFrame??1)),alpha=(id:number)=>source.objects.find(value=>value.characterId===id)?.alpha??0;
 const values:Record<string,{text:string;visible:boolean}>={};const add=(id:string,value:string,show:boolean)=>{values[id]={text:value,visible:show};};
 const selected=p050SelectionText(s.state,options.selection??null,lang);add('selection',selected,practice&&selected!=='');
 for(const entry of P050_MAIN_GLOSSARY){const id=entry.id==='decimal'?52:entry.id==='position'?51:53;add(`main-term-${entry.id}`,entry.labels[lang],visible&&alpha(id)>0);}
 add('main-glossary-close',text.close,mainGlossary!==null);add('main-glossary-notation','En esta actividad usamos el punto decimal: 0.2.',lang==='es'&&mainGlossary==='decimal');
 for(const entry of P050_MAIN_GLOSSARY){const id=entry.id==='decimal'?52:entry.id==='position'?51:53;if(mainGlossary===entry.id&&alpha(id)===0)throw Error('P050_TEXT_MAIN_GLOSSARY_HIDDEN');add(`main-glossary-${entry.id}-title`,entry.labels[lang],mainGlossary===entry.id);add(`main-glossary-${entry.id}-definition`,entry.definitions[lang],mainGlossary===entry.id);}
 add('title',text.title,visible);add('question',text.question,visible&&(!intro||alpha(50)>0));
 add('instruction',text.instruction,visible&&(!intro||alpha(48)>0));add('keyboard',text.keyboard,practice);
 add('help-instruction',text.helpInstruction,visible&&(!intro||alpha(54)>0));add('demo','2.1',visible&&intro&&alpha(40)>0);
 add('help-trigger',text.help,practice);add('feedback',text.correct,practice&&['correct-feedback','completion-feedback'].includes(s.state.phase));
 // Static and live outro share the retained source text and native completion status.
 add('complete',text.complete,visible&&s.state.phase==='complete');
 add('help-heading',text.help,help);add('help-explanation',text.explanation,help);add('help-example',text.example,help);add('help-half','0.5',help);add('help-close',text.close,help);
 add('wrong-heading',text.wrong,wrong);add('wrong-close',text.close,wrong);add('terms-heading',lang==='es'?'Términos clave':'Key terms',help);
 add('glossary-close',text.close,glossary!==null);add('glossary-notation',P050_DECIMAL_NOTATION.es,lang==='es'&&glossary==='decimal');
 for(let n=0;n<=3;n++){add(`axis-${n}`,String(n),visible&&(!intro||(alpha(56)||alpha(46))>0));add(`help-axis-${n}`,String(n),help);}
 for(const item of P050_ITEMS){add(`target-label-${item.id}`,p050TargetLabel(s.state,item.id,lang),practice);add(`item-${item.id}`,item.decimal,visible&&(intro?alpha(40+item.id)>0:practice&&!s.state.solved.includes(item.id)));add(`target-${item.id}`,item.decimal,visible&&!intro&&s.state.solved.includes(item.id));}
 for(const entry of P050_GLOSSARY){add(`term-${entry.id}`,entry.labels[lang],help);add(`glossary-${entry.id}-title`,entry.labels[lang],glossary===entry.id);add(`glossary-${entry.id}-definition`,entry.definitions[lang],glossary===entry.id);}
 return buildLessonTextSnapshot({...P050_TEXT_BINDING,blocks:P050_TEXT_BINDING.blocks.map(block=>({...block,language:lang}))},{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang,seed:s.seed,replay:s.replay},values);
}
