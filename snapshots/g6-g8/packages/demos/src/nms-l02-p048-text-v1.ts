import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {P048_TEXT_BINDING} from './nms-l02-p048-text-binding-v1';
import {p048ModuleFrame} from './nms-l02-p048-frame-v1';
import {p048Intro} from './nms-l02-p048-intro-v1';
import {P048_COPY} from './nms-l02-p048-copy-v1';
import {p048Decimal} from './nms-l02-p048-practice-v1';
import {P048_GLOSSARY} from './generated/nms-l02-p048-glossary-v1';
export {P048_TEXT_BINDING};
export function p048TextSnapshot(s:ReturnType<typeof p048ModuleFrame>,options:{glossary?:typeof P048_GLOSSARY[number]['id']|null}={}){
 const lang=s.language,es=lang==='es',visible=s.mainFrame!==null,intro=s.state.phase==='intro',practice=visible&&!intro,help=practice&&s.state.helpOpen,glossary=options.glossary??null;
 const demo=p048Intro(Math.min(329,s.mainFrame??1)),alpha=(id:number)=>demo.objects.find(o=>o.characterId===id)?.alpha??0;
 const allowed=help?['decimal','place-value','tenth','hundredth']:intro&&visible&&alpha(159)>0?['decimal','square']:[];
 if(glossary!==null&&!allowed.includes(glossary))throw Error('P048_TEXT_GLOSSARY_STATE');
 const values:Record<string,{text:string;visible:boolean}>={};const add=(id:string,text:string,show:boolean)=>{values[id]={text,visible:show};};
 const copy=P048_COPY[lang],value=intro?(demo.hundredths??0):s.state.value,decimal=p048Decimal(value),grid=visible&&(practice||alpha(168)>0);
 add('course-title',copy.title,visible);add('question',es?'Pregunta 6':'Question 6',visible);
 copy.instructionLines.forEach((line,i)=>add(`instruction-${i+1}`,line,visible&&intro&&alpha([159,163,165][i]!)>0));add('practice-instruction',copy.instructionLines.join(' '),practice);
 add('target',`${es?'Crea el decimal':'Create the decimal'} ${intro?'0.75':s.state.target===null?'':p048Decimal(s.state.target)}.`,visible&&(practice||Math.max(alpha(169),alpha(177))>0));
 add('decimal-value',decimal,grid);add('grid-description',es?`${decimal}: ${value} de 100 cuadrados coloreados`:`${decimal}: ${value} of 100 squares shaded`,grid);
 add('input-label',es?'Arrastra el control para colorear los cuadrados.':'Drag the slider to shade the squares.',practice);add('decimal-label','Decimal',practice);add('range-zero','0.00',practice);add('range-one','1.00',practice);
 add('check',es?'Comprobar respuesta':'Check Answer',visible&&(practice||Math.max(alpha(174),alpha(175),alpha(412))>0));add('reset',es?'Restablecer':'Reset',visible&&(practice||alpha(178)>0));
 const feedback=s.state.phase==='correct-feedback'?(es?'¡Correcto!':'Correct!'):s.state.phase==='reveal'?`${es?'La respuesta es':'The answer is'} ${decimal}.`:s.state.phase==='complete'?(es?'Has terminado las tres preguntas.':'All three questions are finished.'):'';
 add('feedback',feedback,practice&&feedback!=='');add('help-trigger',es?'Más ayuda':'More Help',practice);add('help-heading',es?'Usa el Valor posicional para nombrar un Decimal:':'Use Place Value to name a Decimal:',help);
 add('help-whole-group',es?'Posiciones enteras':'Whole-number places',help);add('help-decimal-group',es?'Posiciones decimales':'Decimal places',help);
 add('help-point',`${es?'Punto decimal':'Decimal point'}: 0 . 2 3`,help);add('help-grid',es?'0.23: 23 de 100 cuadrados coloreados':'0.23: 23 of 100 squares shaded',help);
 add('help-tenths',es?'Cuenta las décimas = 2':'Count the tenths = 2',help);add('help-hundredths',es?'Cuenta las centésimas = 3':'Count the hundredths = 3',help);add('help-close',es?'Cerrar':'Close',help);
 add('wrong-feedback',s.state.attempts<2?(es?'Inténtalo de nuevo.':'Try Again.'):(es?'Lo siento.':'Sorry.'),practice&&s.state.phase==='wrong-feedback');add('wrong-close',es?'Cerrar':'Close',practice&&s.state.phase==='wrong-feedback');add('glossary-close',es?'Cerrar':'Close',glossary!==null);
 add('glossary-notation','En esta actividad usamos el punto decimal: 0.23.',es&&(glossary==='decimal'||glossary==='tenth'));
 const labels=es?['Centenas','Decenas','Unidades','Décimas','Centésimas','Milésimas']:['Hundreds','Tens','Ones','Tenths','Hundredths','Thousandths'];['hundreds','tens','ones','tenths','hundredths','thousandths'].forEach((id,i)=>add('place-'+id,labels[i]!,help));
 add('help-digit-ones','0',help);add('help-digit-tenths','2',help);add('help-digit-hundredths','3',help);
 for(const entry of P048_GLOSSARY){add(`glossary-${entry.id}-title`,entry.labels[lang],glossary===entry.id);add(`glossary-${entry.id}-definition`,entry.definitions[lang],glossary===entry.id);}
 return buildLessonTextSnapshot({...P048_TEXT_BINDING,blocks:P048_TEXT_BINDING.blocks.map(b=>({...b,language:lang}))},{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang,seed:s.seed,replay:s.replay},values);
}
