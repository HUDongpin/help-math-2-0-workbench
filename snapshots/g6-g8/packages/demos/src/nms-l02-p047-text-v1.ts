import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {P047_TEXT_BINDING} from './nms-l02-p047-text-binding-v1';
import {p047ModuleFrame} from './nms-l02-p047-frame-v1';
import {p047IntroState} from './nms-l02-p047-intro-v1';
import {P047_COPY} from './nms-l02-p047-copy-v1';
import {P047_CARDS} from './nms-l02-p047-practice-v1';
import {P047_SOURCE_TEXT} from './generated/nms-l02-p047-text-v1';
import {P047_GLOSSARY} from './nms-l02-p047-glossary-v1';
export {P047_TEXT_BINDING};
export interface P047TextOptions {reducedMotion?:boolean;glossary?:typeof P047_GLOSSARY[number]['id']|null;}
/** Snapshot describes rendered visibility, including the retained parent of a nested modal. */
export function p047TextSnapshot(s:ReturnType<typeof p047ModuleFrame>,options:P047TextOptions={}){
 const lang=s.language,es=lang==='es',c=P047_COPY[lang],visible=s.mainFrame!==null,intro=s.state.phase==='intro',frame=s.mainFrame??1,practice=visible&&!intro,help=practice&&s.state.helpOpen;
 const demo=p047IntroState(Math.min(140,frame)),glossary=options.glossary??null;
 const allowed=help?['fraction','number-line','part','whole']:visible&&(!intro||frame>=8)?['fraction','number-line','position']:[];
 if(glossary!==null&&!allowed.includes(glossary))throw Error('P047_TEXT_GLOSSARY_STATE');
 const values:Record<string,{text:string;visible:boolean}>={};
 const add=(id:string,text:string,show:boolean)=>{values[id]={text,visible:show};};
 add('course-title',c.title,visible);add('question',c.question,visible);add('instruction',c.instruction,visible&&(!intro||frame>=8));add('guidance',c.guidance,visible&&(!intro||frame>=8));add('watch',c.watch,visible&&intro);
 add('input-hint',es?'Arrastra una fracción a la recta. También puedes seleccionar una fracción y después una marca.':'Drag a fraction to the line. You can also select a fraction and then a mark.',practice);
 const selected=P047_CARDS.find(card=>card.id===s.state.selected);
 add('selection-status',selected?(es?`Seleccionado: ${selected.numerator}/${selected.denominator}`:`Selected: ${selected.numerator}/${selected.denominator}`):es?`${s.state.matched.length} de 4 colocadas`:`${s.state.matched.length} of 4 placed`,practice);
 const feedback=s.state.phase==='correct-feedback'||s.state.phase==='celebration'?c.correct:s.state.phase==='wrong-feedback'?c.wrong:s.state.phase==='complete'?c.complete:'';
 add('feedback',feedback,practice&&feedback.length>0);add('help-trigger',c.help,practice);add('help-heading',c.help,help);add('help-definition',c.helpDefinition,help);add('help-example',c.example,help);add('help-explanation',c.helpExplanation,help);
 for(const role of ['example','explanation','line'])add('help-fraction-'+role,'7/8',help);
 add('help-close',c.close,help);add('glossary-close',c.close,glossary!==null);add('cancel-selection',es?'Cancelar selección':'Cancel selection',practice);add('worked-fraction','3/4',practice);
 const line=demo.geometry.find(g=>[18,53].includes(g.characterId)&&g.alpha>0),lineVisible=visible&&(practice||Boolean(line));
 add('line-zero','0',lineVisible);add('line-one','1',lineVisible);add('help-zero','0',help);add('help-one','1',help);
 const cue=demo.texts.find(t=>[56,57,58].includes(t.characterId)&&t.alpha>0);
 const cueText=cue?(es?({56:'fracción',57:'posición',58:'recta numérica'}as Record<number,string>)[cue.characterId]:P047_SOURCE_TEXT[String(cue.characterId)as '56'|'57'|'58'].runs.map(r=>r.text).join('')):'';
 add('term-cue',cueText,visible&&intro&&!options.reducedMotion&&Boolean(cue));
 const placed=[es?'Marca F: 3/4':'Mark F: 3/4',...P047_CARDS.filter(card=>s.state.matched.includes(card.id)).map(card=>`${es?'Marca':'Mark'} ${String.fromCharCode(64+card.tick)}: ${card.numerator}/${card.denominator}`)].join('. ');
 add('line-description',intro?(es?'Demostración de fracciones en la recta numérica':'Demonstration of fractions on the number line'):(es?'De 0 a 1, dividido en ocho partes iguales. Marcas A a G de izquierda a derecha. ':'From 0 to 1, divided into eight equal parts. Marks A through G from left to right. ')+placed,visible);
 add('help-description',c.helpDiagram,help);
 const fractions=demo.texts.filter(t=>[40,41,42,43,55].includes(t.characterId)&&t.alpha>0);
 for(let i=0;i<5;i++){const t=fractions[i],v=t?P047_SOURCE_TEXT[String(t.characterId)as '40'|'41'|'42'|'43'|'55']:null;add(`intro-fraction-${i}`,v?v.runs.map(r=>r.text).join('/'):'',visible&&intro&&Boolean(t));}
 for(const card of P047_CARDS){const text=`${card.numerator}/${card.denominator}`,matched=s.state.matched.includes(card.id);add(`card-${card.id}`,text,practice&&!matched);add(`placed-${card.id}`,text,practice&&matched);add(`card-label-${card.id}`,`${es?'Seleccionar':'Select'} ${text}`,practice&&!matched);}
 for(let tick=1;tick<=7;tick++){const letter=String.fromCharCode(64+tick);add(`mark-${tick}`,letter,practice);add(`target-${tick}`,`${es?'Marca':'Mark'} ${letter}`,practice);}
 for(const entry of P047_GLOSSARY){add(`glossary-${entry.id}-title`,entry.labels[lang],glossary===entry.id);add(`glossary-${entry.id}-definition`,entry.definitions[lang],glossary===entry.id);}
 return buildLessonTextSnapshot({...P047_TEXT_BINDING,blocks:P047_TEXT_BINDING.blocks.map(b=>({...b,language:lang}))},{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang,seed:s.seed,replay:s.replay},values);
}
