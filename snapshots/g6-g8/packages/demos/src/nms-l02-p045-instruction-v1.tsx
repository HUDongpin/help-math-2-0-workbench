import * as React from 'react';
import {P045_GLOSSARY} from './generated/nms-l02-p045-glossary-v1';
type Term=typeof P045_GLOSSARY[number]['id'];
export function p045InstructionParts(text:string,language:'en'|'es'){
 const terms:readonly [string,Term][]=language==='en'?[['fraction','fraction'],['shown','show'],['pie chart','pie-chart'],['numerator','numerator'],['denominator','denominator'],['values','value']]:[['fracción','fraction'],['muestra','show'],['gráfico circular','pie-chart'],['numerador','numerator'],['denominador','denominator'],['valores','value']];
 const matches=terms.map(([word,id])=>{const start=text.toLowerCase().indexOf(word);if(start<0)throw Error('P045_GLOSSARY_WORD:'+id);return{start,end:start+word.length,id};}).sort((a,b)=>a.start-b.start);
 const parts:{text:string;id?:Term}[]=[];let cursor=0;
 for(const match of matches){if(match.start<cursor)throw Error('P045_GLOSSARY_OVERLAP');if(match.start>cursor)parts.push({text:text.slice(cursor,match.start)});parts.push({text:text.slice(match.start,match.end),id:match.id});cursor=match.end;}
 if(cursor<text.length)parts.push({text:text.slice(cursor)});return parts;
}
/** Source buttons41–46; recovered-index definitions do not prove the old host lookup. */
export function P045Instruction({text,language,enabled=true,onModalChange}:{text:string;language:'en'|'es';enabled?:boolean;onModalChange?:(open:boolean)=>void}){
 const [term,setTerm]=React.useState<Term|null>(null),dialog=React.useRef<HTMLDialogElement>(null),trigger=React.useRef<HTMLElement|null>(null),id=React.useId();
 const entry=P045_GLOSSARY.find(e=>e.id===term);
 React.useEffect(()=>{const node=dialog.current;if(entry&&node&&!node.open){node.showModal();node.querySelector<HTMLElement>('[data-glossary-heading]')?.focus();}if(!entry&&node?.open){node.close();if(trigger.current?.isConnected)trigger.current.focus();}onModalChange?.(Boolean(entry));},[entry,onModalChange]);
 React.useEffect(()=>()=>onModalChange?.(false),[onModalChange]);
 return <><p>{p045InstructionParts(text,language).map((part,i)=>part.id?<button key={i} type="button" className="p045-term-link" disabled={!enabled} data-source-term={part.id} aria-haspopup="dialog" onClick={()=>{trigger.current=document.activeElement as HTMLElement;setTerm(part.id!);}}>{part.text}</button>:<React.Fragment key={i}>{part.text}</React.Fragment>)}</p>
  <dialog ref={dialog} aria-labelledby={id} onCancel={e=>{e.preventDefault();setTerm(null);}}><h3 id={id} data-glossary-heading tabIndex={-1}>{entry?.labels[language]}</h3><p>{entry?.definitions[language]}</p><button type="button" onClick={()=>setTerm(null)}>{language==='es'?'Cerrar':'Close'}</button></dialog>
 </>;
}
