import React from 'react';
import {P050_TEXT, type P050Language} from './nms-l02-p050-text-v1';
import type {P050State, P050Event} from './nms-l02-p050-practice-v1';
import {P050GlossaryTerms} from './nms-l02-p050-glossary-v1';
/** Controlled source feedback. Audio end never closes a wrong-answer dialog. */
export function P050Feedback({state, language='en', interactive=true, onEvent, children}: {
 state:P050State; language?:P050Language; interactive?:boolean;
 onEvent:(event:P050Event)=>void; children?:React.ReactNode;
}) {
 const text=P050_TEXT[language], id=React.useId();
 const help=React.useRef<HTMLDialogElement>(null), wrong=React.useRef<HTMLDialogElement>(null);
 const helpTrigger=React.useRef<HTMLButtonElement>(null), previousFocus=React.useRef<HTMLElement|null>(null);
 const wrongOpen=state.phase==='wrong-feedback';
 React.useEffect(()=>{
  const dialog=help.current;if(!dialog)return;
  if(state.helpOpen&&!dialog.open){dialog.showModal();dialog.querySelector<HTMLElement>('h3')?.focus();}
  else if(!state.helpOpen&&dialog.open){dialog.close();helpTrigger.current?.focus();}
 },[state.helpOpen]);
 React.useEffect(()=>{
  const dialog=wrong.current;if(!dialog)return;
  if(wrongOpen&&!dialog.open){previousFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;dialog.showModal();dialog.querySelector<HTMLElement>('h3')?.focus();}
  else if(!wrongOpen&&dialog.open){dialog.close();if(previousFocus.current?.isConnected)previousFocus.current.focus();}
 },[wrongOpen]);
 return <div lang={language} className="p050-feedback">
  <p role="status">{state.phase==='correct-feedback'||state.phase==='completion-feedback'?text.correct:state.phase==='complete'?text.complete:''}</p>
  <button ref={helpTrigger} type="button" disabled={!interactive||state.phase!=='ready'||state.helpOpen} aria-haspopup="dialog" onClick={()=>onEvent({type:'help',open:true})}>{text.help}</button>
  <dialog ref={help} aria-labelledby={`${id}-help`} onCancel={event=>{event.preventDefault();onEvent({type:'help',open:false});}}>
   <h3 id={`${id}-help`} tabIndex={-1}>{text.help}</h3><p>{text.explanation}</p><p>{text.example}</p>{children}
   {state.helpOpen && <P050GlossaryTerms language={language}/>}
   <button type="button" onClick={()=>onEvent({type:'help',open:false})}>{text.close}</button>
  </dialog>
  <dialog ref={wrong} aria-labelledby={`${id}-wrong`} onCancel={event=>{event.preventDefault();onEvent({type:'close-wrong'});}}>
   <h3 id={`${id}-wrong`} tabIndex={-1}>{text.wrong}</h3>
   <button type="button" onClick={()=>onEvent({type:'close-wrong'})}>{text.close}</button>
  </dialog>
 </div>;
}
