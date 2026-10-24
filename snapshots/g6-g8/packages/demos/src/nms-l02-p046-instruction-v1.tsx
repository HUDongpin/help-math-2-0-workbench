import * as React from 'react';
import {P046_GLOSSARY} from './generated/nms-l02-p046-glossary-v1';
type Term=typeof P046_GLOSSARY[number]['id'];
export type P046TermContext='main'|'definition';
export function p046InstructionParts(text:string,language:'en'|'es',context:P046TermContext='main'){
 const terms:readonly [string,Term][]=context==='main'?(language==='en'?[['equivalent fraction','equivalent-fraction'],['fraction','fraction'],['numerator','numerator'],['denominator','denominator']]:[['fracción equivalente','equivalent-fraction'],['fracción','fraction'],['numerador','numerator'],['denominador','denominator']]):(language==='en'?[['equivalent fraction','equivalent-fraction'],['fraction','fraction'],['quantity','quantity']]:[['fracciones equivalentes','equivalent-fraction'],['fracciones','fraction'],['cantidad','quantity']]);
 const matches:{start:number;end:number;id:Term}[]=[];
 for(const [word,id]of terms){let start=text.toLowerCase().indexOf(word);while(start>=0&&matches.some(m=>start<m.end&&start+word.length>m.start))start=text.toLowerCase().indexOf(word,start+1);if(start<0)throw Error('P046_GLOSSARY_WORD:'+id);matches.push({start,end:start+word.length,id});}
 matches.sort((a,b)=>a.start-b.start);const parts:{text:string;id?:Term}[]=[];let cursor=0;
 for(const match of matches){if(match.start>cursor)parts.push({text:text.slice(cursor,match.start)});parts.push({text:text.slice(match.start,match.end),id:match.id});cursor=match.end;}
 if(cursor<text.length)parts.push({text:text.slice(cursor)});return parts;
}
/** Source main40–43, help27–29 and wrong-feedback40/41/191; recovered-index definitions do not prove the old host lookup. */
export function P046Instruction({text,language,context='main',enabled=true,onModalChange}:{text:string;language:'en'|'es';context?:P046TermContext;enabled?:boolean;onModalChange?:(open:boolean)=>void}){
 const [term,setTerm]=React.useState<Term|null>(null),dialog=React.useRef<HTMLDialogElement>(null),trigger=React.useRef<HTMLElement|null>(null),id=React.useId();
 const entry=P046_GLOSSARY.find(e=>e.id===term);
 React.useEffect(()=>{const node=dialog.current;if(entry&&node&&!node.open){node.showModal();node.querySelector<HTMLElement>('[data-glossary-heading]')?.focus();}if(!entry&&node?.open){node.close();if(trigger.current?.isConnected)trigger.current.focus();}onModalChange?.(Boolean(entry));},[entry,onModalChange]);
 React.useEffect(()=>()=>onModalChange?.(false),[onModalChange]);
 return <><p>{p046InstructionParts(text,language,context).map((part,i)=>part.id?<button key={i} type="button" className="p046-term-link" disabled={!enabled} data-source-term={part.id} aria-haspopup="dialog" onClick={()=>{trigger.current=document.activeElement as HTMLElement;setTerm(part.id!);}}>{part.text}</button>:<React.Fragment key={i}>{part.text}</React.Fragment>)}</p>
  <dialog ref={dialog} aria-labelledby={id} onCancel={e=>{e.preventDefault();e.stopPropagation();setTerm(null);}}><h3 id={id} data-glossary-heading tabIndex={-1}>{entry?.labels[language]}</h3><p>{entry?.definitions[language]}</p><button type="button" onClick={()=>setTerm(null)}>{language==='es'?'Cerrar':'Close'}</button></dialog>
 </>;
}
