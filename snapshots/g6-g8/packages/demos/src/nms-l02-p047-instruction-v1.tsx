import * as React from 'react';
import {P047_GLOSSARY} from './nms-l02-p047-glossary-v1';
type Term=typeof P047_GLOSSARY[number]['id'];
export function p047InstructionParts(text:string,language:'en'|'es',context:'main'|'definition'='main'){
 const terms:Record<string,Term>=language==='en'?{fractions:'fraction',fraction:'fraction','number line':'number-line',position:'position',whole:'whole',parts:'part',part:'part'}:{fracciones:'fraction','fracción':'fraction','recta numérica':'number-line','posición':'position',entero:'whole',partes:'part',parte:'part'};
 const allowed=context==='main'?['fraction','number-line','position']:['fraction','number-line','whole','part'];
 const words=Object.keys(terms).filter(word=>allowed.includes(terms[word])).sort((a,b)=>b.length-a.length);
 const regex=new RegExp(`(?<![\\p{L}])(?:${words.join('|')})(?![\\p{L}])`,'giu');
 const parts:{text:string;id?:Term}[]=[];let cursor=0;
 for(const match of text.matchAll(regex)){if(match.index>cursor)parts.push({text:text.slice(cursor,match.index)});parts.push({text:match[0],id:terms[match[0].toLowerCase()]});cursor=match.index+match[0].length;}
 if(cursor<text.length)parts.push({text:text.slice(cursor)});return parts;
}
export function P047Instruction({text,language,context='main',enabled=true,onModalChange}:{text:string;language:'en'|'es';context?:'main'|'definition';enabled?:boolean;onModalChange?:(open:boolean)=>void}){
 const [term,setTerm]=React.useState<Term|null>(null),dialog=React.useRef<HTMLDialogElement>(null),trigger=React.useRef<HTMLElement|null>(null),id=React.useId();
 const entry=P047_GLOSSARY.find(e=>e.id===term);
 React.useEffect(()=>{const node=dialog.current;if(entry&&node&&!node.open){node.showModal();node.querySelector<HTMLElement>('[data-p047-glossary-heading]')?.focus();}if(!entry&&node?.open){node.close();if(trigger.current?.isConnected)trigger.current.focus();}onModalChange?.(Boolean(entry));},[entry,onModalChange]);
 React.useEffect(()=>()=>onModalChange?.(false),[onModalChange]);
 return <><p>{p047InstructionParts(text,language,context).map((part,index)=>part.id?<button type="button" className="p047-term-link" key={index} data-source-term={part.id} disabled={!enabled} aria-haspopup="dialog" onClick={()=>{trigger.current=document.activeElement as HTMLElement;setTerm(part.id!);}}>{part.text}</button>:<React.Fragment key={index}>{part.text}</React.Fragment>)}</p>
 <dialog ref={dialog} aria-labelledby={id} onCancel={e=>{e.preventDefault();e.stopPropagation();setTerm(null);}}><h3 id={id} tabIndex={-1} data-p047-glossary-heading>{entry?.labels[language]}</h3><p>{entry?.definitions[language]}</p><button type="button" onClick={()=>setTerm(null)}>{language==='es'?'Cerrar':'Close'}</button></dialog></>;
}
