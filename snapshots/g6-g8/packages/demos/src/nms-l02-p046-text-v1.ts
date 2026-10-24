import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {P046_TEXT_BINDING} from './nms-l02-p046-text-binding-v1';
import {p046ModuleFrame} from './nms-l02-p046-frame-v1';
import {p046IntroFrame} from './nms-l02-p046-intro-v1';
import {P046_COPY} from './nms-l02-p046-copy-v1';
import {p046Question} from './nms-l02-p046-practice-v1';
import {p046PartitionWindow} from './nms-l02-p046-partition-v1';
import {P046_GLOSSARY} from './generated/nms-l02-p046-glossary-v1';
export {P046_TEXT_BINDING};
export interface P046TextOptions {readonly reducedMotion?:boolean;readonly partitionRequested?:number;readonly partitionJump?:string;readonly glossary?:typeof P046_GLOSSARY[number]['id']|null;}
/** Explicit glossary state models the top modal without discarding its parent.
 * Partition state is bounded to the same twenty visible controls as the view. */
export function p046TextSnapshot(state:ReturnType<typeof p046ModuleFrame>,options:P046TextOptions={}){
 const lang=state.language,es=lang==='es',c=P046_COPY[lang],intro=state.state.phase==='intro',frame=state.mainFrame??1;
 const demo=p046IntroFrame(Math.min(653,frame)),visible=state.mainFrame!==null,content=visible&&(!intro||demo.visible);
 const fields=content&&(!intro||frame>=59),chart=content&&(!intro||demo.chartAlpha>0),q=p046Question(state.state);
 const help=content&&state.state.helpOpen,wrong=content&&state.state.phase==='wrong-feedback',firstWrong=wrong&&state.state.attempts===1,correct=content&&state.state.phase==='correct-feedback';
 const glossary=options.glossary??null;
 const terms=help||firstWrong?['equivalent-fraction','fraction','quantity']:wrong||correct?[]:['equivalent-fraction','fraction','numerator','denominator'];
 if(glossary!==null&&(!content||!terms.includes(glossary)))throw Error('P046_TEXT_GLOSSARY_STATE');
 const values:Record<string,{text:string;visible:boolean}>={};
 const add=(id:string,text:string,show=content)=>{values[id]={text,visible:show};};
 add('course-title','Fractions, Decimals, and Percent Concepts: Try It!',visible);add('activity-title',c.title);add('instruction',c.instruction);
 add('target',`${c.target} ${intro?'2/10':q.numerator+'/'+q.denominator}.`,fields);
 add('question-progress',`${c.question} ${state.state.questionIndex+1} / 3`,content&&!intro);add('watch',c.watch,content&&intro);
 add('numerator-label',c.numerator,fields);add('denominator-label',c.denominator,fields);
 const n=intro?demo.numerator:state.state.numerator,d=intro?demo.denominator:state.state.denominator;
 add('numerator',n,fields&&n.length>0);add('denominator',d,fields&&d.length>0);
 add('equivalence','2/10 = 1/5',content&&intro&&(options.reducedMotion?frame>=578&&frame<=592:demo.equivalenceEmphasis));
 const parts=intro?demo.parts:state.state.parts,selected=intro?demo.selected.length:state.state.selected.length;
 add('chart-description',intro?(es?`Un entero dividido en ${parts} partes iguales; ${selected} coloreadas de verde.`:`One whole divided into ${parts} equal parts; ${selected} shaded green.`):(es?`Un entero con ${parts} partes iguales; ${selected} seleccionadas.`:`One whole with ${parts} equal parts; ${selected} selected.`),chart);
 add('chart-caption',es?`${parts} ${parts===1?'parte':'partes'}`:`${parts} ${parts===1?'piece':'pieces'}`,chart&&intro);
 const requested=options.partitionRequested??1;
 if(!Number.isSafeInteger(requested)||requested<1)throw Error('P046_TEXT_PARTITION_REQUEST');
 const window=p046PartitionWindow(state.state.parts,Math.min(requested,state.state.parts)),navigation=content&&!intro&&state.state.parts>20;
 const jump=options.partitionJump??String(requested);
 if(typeof jump!=='string')throw Error('P046_TEXT_PARTITION_JUMP');
 add('partition-detail',es?`Detalle: partes ${window.start}–${window.end} de ${parts}`:`Detail: parts ${window.start}–${window.end} of ${parts}`,content&&!intro);
 for(let i=0;i<20;i++)add(`partition-part-${i+1}`,window.indices[i]===undefined?'':String(window.indices[i]),content&&!intro&&i<window.indices.length);
 add('partition-previous',es?'Partes anteriores':'Previous parts',navigation);add('partition-next',es?'Partes siguientes':'Next parts',navigation);
 add('partition-number-label',es?'Número de parte':'Part number',navigation);add('partition-number-input',jump,navigation&&jump.length>0);add('partition-show',es?'Mostrar parte':'Show part',navigation);
 add('partition-overview-note',es?'Las divisiones son muy pequeñas en la vista completa. Usa el detalle para seleccionar cada parte.':'The divisions are very small in the whole view. Use the detail to select each part.',content&&!intro&&state.state.parts>128);
 add('up','↑ '+c.up);add('down','↓ '+c.down);add('check',c.check);add('new-whole',c.next);add('help',c.help,content&&!intro);
 add('close',c.close,help||wrong||correct||glossary!==null);add('wrong',firstWrong?c.wrongFirst:c.wrongFinal,wrong);add('wrong-example','7/8 = 14/16',firstWrong);add('try-again',c.tryAgain,firstWrong);add('correct',c.correct,correct);
 add('reveal',es?'Esta es la fracción indicada.':'Here is the requested fraction.',content&&state.state.phase==='answer-reveal');
 add('done',c.done,content&&!intro);
 add('complete',state.state.finishReason==='done'?c.ended:es?'Has terminado las tres fracciones.':'All three fractions finished.',content&&state.state.phase==='complete');
 add('help-body',c.helpText,help);add('help-fraction','2/4 = 1/2',help);add('help-description',es?'Dos círculos iguales: dos de cuatro partes y una de dos partes están coloreadas de verde.':'Two equal circles: two of four parts and one of two parts are shaded green.',help);
 for(const entry of P046_GLOSSARY){add(`glossary-${entry.id}`,entry.labels[lang],glossary===entry.id);add(`glossary-definition-${entry.id}`,entry.definitions[lang],glossary===entry.id);}
 const binding={...P046_TEXT_BINDING,blocks:P046_TEXT_BINDING.blocks.map(b=>({...b,language:b.id==='course-title'?'en' as const:lang}))};
 return buildLessonTextSnapshot(binding,{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,lang,seed:state.seed,replay:state.replay},values);
}
