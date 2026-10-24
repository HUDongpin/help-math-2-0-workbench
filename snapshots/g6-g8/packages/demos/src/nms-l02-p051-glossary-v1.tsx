import React from 'react';
import {createPortal} from 'react-dom';
import {P051_GLOSSARY} from './generated/nms-l02-p051-glossary-v1';
export type P051GlossaryId = typeof P051_GLOSSARY[number]['id'];
export type P051GlossaryLanguage = 'en'|'es';
export const P051_GLOSSARY_SCOPES = {
 main:['equivalent-decimal','column'], wrong:['equivalent','fraction'],
} as const;
export const P051_DECIMAL_NOTATION_NOTE = 'En esta actividad usamos el punto decimal: 0.5.';
/** Caller controls source visibility and pauses playback on open. Closing does not resume it. */
export function P051Glossary({language,scope,disabled=false,visibleIds,onOpen,onClose}:{
 language:P051GlossaryLanguage;scope:'main'|'wrong';disabled?:boolean;
 visibleIds?:readonly P051GlossaryId[];onOpen:()=>void;onClose:()=>void;
}){
 const [selected,setSelected]=React.useState<P051GlossaryId|null>(null);
 const trigger=React.useRef<HTMLButtonElement|null>(null),dialog=React.useRef<HTMLDialogElement>(null);
 const id=React.useId(),callbacks=React.useRef({onOpen,onClose});callbacks.current={onOpen,onClose};
 const ids:readonly P051GlossaryId[]=P051_GLOSSARY_SCOPES[scope];
 const entries=ids.filter(key=>!visibleIds||visibleIds.includes(key)).map(key=>P051_GLOSSARY.find(e=>e.id===key)!);
 const entry=entries.find(e=>e.id===selected);
 React.useEffect(()=>{if(selected&&!entry)setSelected(null);},[selected,entry]);
 React.useEffect(()=>{
  if(!entry)return;const node=dialog.current;if(!node)return;
  node.showModal();node.querySelector<HTMLElement>('h3')?.focus();
  return()=>{node.close();callbacks.current.onClose();if(trigger.current?.isConnected)trigger.current.focus({preventScroll:true});};
 },[entry]);
 return <div className="p051-glossary-triggers" data-p051-glossary-scope={scope}>
  {entries.map(term=><button type="button" key={term.id} data-p051-term={term.id} disabled={disabled} aria-haspopup="dialog" onClick={event=>{trigger.current=event.currentTarget;callbacks.current.onOpen();setSelected(term.id);}}>{term.labels[language]}</button>)}
  {entry&&typeof document!=='undefined'&&createPortal(<dialog ref={dialog} className="p051-glossary-dialog" data-p051-glossary={entry.id} lang={language} aria-labelledby={id} style={{boxSizing:'border-box',maxWidth:'min(36rem, calc(100vw - 2rem))',maxHeight:'calc(100dvh - 2rem)',overflow:'auto',overflowWrap:'anywhere'}} onCancel={event=>{event.preventDefault();event.stopPropagation();setSelected(null);}} onKeyDown={event=>{if(event.key==='Escape')event.stopPropagation();}}>
   <h3 id={id} tabIndex={-1}>{entry.labels[language]}</h3>
   <p>{entry.definitions[language]}</p>
   {language==='es'&&entry.id==='equivalent-decimal'&&<p data-p051-notation-note>{P051_DECIMAL_NOTATION_NOTE}</p>}
   <button type="button" onClick={()=>setSelected(null)}>{language==='es'?'Cerrar':'Close'}</button>
  </dialog>,document.body)}
 </div>;
}
