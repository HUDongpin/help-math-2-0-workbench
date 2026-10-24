import * as React from 'react';
import {P044_GLOSSARY} from './generated/nms-l02-p044-glossary-v1';
export function p044InstructionParts(text:string,language:'en'|'es'){
  const words=language==='en'?['numerator','fraction']:['numerador','fracción'];
  const matches=words.map((word,i)=>{const start=text.toLowerCase().indexOf(word);if(start<0)throw Error('P044_GLOSSARY_BINDING');return{start,end:start+word.length,id:i===0?'numerator':'fraction'};}).sort((a,b)=>a.start-b.start);
  const parts:{text:string;id?:string}[]=[];let cursor=0;
  for(const m of matches){if(m.start<cursor)throw Error('P044_GLOSSARY_OVERLAP');if(m.start>cursor)parts.push({text:text.slice(cursor,m.start)});parts.push({text:text.slice(m.start,m.end),id:m.id});cursor=m.end;}
  if(cursor<text.length)parts.push({text:text.slice(cursor)});return parts;
}
/** Page buttons41/44 link to Numerator/Fraction; technical-index definitions are separately sourced. */
export function P044Instruction({text,language,enabled=true,onModalChange}:{text:string;language:'en'|'es';enabled?:boolean;onModalChange?:(open:boolean)=>void}){
  const [term,setTerm]=React.useState<string|null>(null),dialog=React.useRef<HTMLDialogElement>(null),trigger=React.useRef<HTMLElement|null>(null),title=React.useId();
  const entry=P044_GLOSSARY.find(t=>t.id===term);
  React.useEffect(()=>{const node=dialog.current;if(entry&&node&&!node.open){node.showModal();node.querySelector<HTMLElement>('[data-dialog-heading]')?.focus();}if(!entry&&node?.open){node.close();trigger.current?.focus();}onModalChange?.(Boolean(entry));},[entry,onModalChange]);
  React.useEffect(()=>()=>onModalChange?.(false),[onModalChange]);
  return <><p>{p044InstructionParts(text,language).map((p,i)=>p.id?<button key={i} className="p044-term-link" type="button" disabled={!enabled} data-source-term={p.id} onClick={()=>{trigger.current=document.activeElement as HTMLElement;setTerm(p.id!);}}>{p.text}</button>:<React.Fragment key={i}>{p.text}</React.Fragment>)}</p>
    <dialog ref={dialog} aria-labelledby={title} onCancel={e=>{e.preventDefault();setTerm(null);}}><h3 id={title} data-dialog-heading tabIndex={-1}>{entry?.labels[language]}</h3><p>{entry?.definitions[language]}</p><button type="button" onClick={()=>setTerm(null)}>{language==='es'?'Cerrar':'Close'}</button></dialog></>;
}
