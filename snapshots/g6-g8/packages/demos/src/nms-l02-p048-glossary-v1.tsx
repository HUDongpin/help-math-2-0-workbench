import React from 'react';
import {createPortal} from 'react-dom';
import {P048_GLOSSARY} from './generated/nms-l02-p048-glossary-v1';
export type P048Term=typeof P048_GLOSSARY[number]['id'];
export function P048GlossaryTerm({term,language='en',children,onModalChange,disabled=false}:{term:P048Term;language?:'en'|'es';children?:React.ReactNode;onModalChange?:(open:boolean)=>void;disabled?:boolean}){
 const entry=P048_GLOSSARY.find(e=>e.id===term)!,id=React.useId(),dialog=React.useRef<HTMLDialogElement>(null),trigger=React.useRef<HTMLButtonElement>(null);const [open,setOpen]=React.useState(false);
 const wasOpen=React.useRef(false);
 const latest=React.useRef(onModalChange);latest.current=onModalChange;
 React.useEffect(()=>{if(open){dialog.current?.showModal();dialog.current?.querySelector<HTMLElement>('h3')?.focus();}else if(wasOpen.current){trigger.current?.focus();}wasOpen.current=open;latest.current?.(open);},[open]);
 React.useEffect(()=>()=>{latest.current?.(false);},[]);
 return <><button ref={trigger} type="button" className="p048-term" disabled={disabled} aria-haspopup="dialog" onClick={()=>setOpen(true)}>{children??entry.labels[language]}</button>
 {open&&createPortal(<dialog ref={dialog} className="p048-glossary" aria-labelledby={id} lang={language} onCancel={event=>{event.preventDefault();event.stopPropagation();setOpen(false);}}>
  <h3 id={id} tabIndex={-1}>{entry.labels[language]}</h3><p>{entry.definitions[language]}</p>
  {language==='es'&&(term==='decimal'||term==='tenth')&&<p>En esta actividad usamos el punto decimal: <strong>0.23</strong>.</p>}
  <button type="button" onClick={()=>setOpen(false)}>{language==='es'?'Cerrar':'Close'}</button>
 </dialog>,document.body)}</>;
}
