import React from 'react';
import {createPortal} from 'react-dom';
import {P050_MAIN_GLOSSARY} from './generated/nms-l02-p050-main-glossary-v1';
import {p050Intro} from './nms-l02-p050-intro-v1';
import type {P050Language} from './nms-l02-p050-text-v1';
export function P050MainGlossary({frame,language,disabled=false,onOpen,onClose}:{frame:number;language:P050Language;disabled?:boolean;onOpen:()=>void;onClose:()=>void}){
 const [selected,setSelected]=React.useState<string|null>(null),id=React.useId();
 const trigger=React.useRef<HTMLButtonElement|null>(null),dialog=React.useRef<HTMLDialogElement>(null);
 const callbacks=React.useRef({onOpen,onClose});callbacks.current={onOpen,onClose};
 const entry=P050_MAIN_GLOSSARY.find(term=>term.id===selected);
 React.useEffect(()=>{if(!entry)return;const node=dialog.current;if(!node)return;node.showModal();node.querySelector<HTMLElement>('h3')?.focus();return()=>{node.close();callbacks.current.onClose();if(trigger.current?.isConnected)trigger.current.focus({preventScroll:true});};},[entry]);
 const source=p050Intro(Math.min(frame,208));
 return <div className="p050-main-terms">
  {P050_MAIN_GLOSSARY.map(term=>{const characterId=term.id==='decimal'?52:term.id==='position'?51:53;const alpha=source.objects.find(object=>object.characterId===characterId)?.alpha??0;
   return <button key={term.id} type="button" data-p050-main-term={term.id} disabled={disabled||alpha===0} aria-hidden={alpha===0} style={{opacity:alpha}} aria-haspopup="dialog" onClick={event=>{trigger.current=event.currentTarget;callbacks.current.onOpen();setSelected(term.id);}}>{term.labels[language]}</button>;
  })}
  {entry&&typeof document!=='undefined'&&createPortal(<dialog ref={dialog} className="p050-glossary" data-p050-main-glossary={entry.id} lang={language} aria-labelledby={id} onCancel={event=>{event.preventDefault();setSelected(null);}}>
   <h3 id={id} tabIndex={-1}>{entry.labels[language]}</h3><p>{entry.definitions[language]}</p>
   {language==='es'&&entry.id==='decimal'&&<p>En esta actividad usamos el punto decimal: 0.2.</p>}
   <button type="button" onClick={()=>setSelected(null)}>{language==='es'?'Cerrar':'Close'}</button>
  </dialog>,document.body)}
 </div>;
}
