'use client';
import {useEffect,useLayoutEffect,useId,useRef,useState}from'react';
import {createPortal}from'react-dom';
import {P031HundredthsHelpModel,P031PlaceValueTable}from'./nms-l02-p031-figures-v1';
import {P031_SOURCE_TERMS}from'./generated/nms-l02-p031-terms-v1';
import './nms-l02-p031-help-v1.css';
export interface P031HelpProps{readonly language:'en'|'es';readonly trigger:HTMLElement|null;readonly onClose:()=>void;readonly onTermOpened?:(id:string)=>void;}
/** Local source help content. Definitions stay in the same modal, keeping the
 * question inert. Closing a definition restores the exact help term trigger. */
export function P031HelpDialog({language,trigger,onClose,onTermOpened}:P031HelpProps){
 const [portal,setPortal]=useState<HTMLElement|null>(null),[selected,setSelected]=useState<string|null>(null);
 const dialog=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null),definitionHeading=useRef<HTMLHeadingElement>(null),termTrigger=useRef<HTMLButtonElement|null>(null),restoreTerm=useRef(false),latest=useRef({onClose,onTermOpened});latest.current={onClose,onTermOpened};const id=useId();
 useEffect(()=>setPortal(document.body),[]);
 useEffect(()=>{if(!portal||!dialog.current)return;const d=dialog.current;d.showModal();heading.current?.focus({preventScroll:true});return()=>{d.close();if(trigger?.isConnected)trigger.focus({preventScroll:true});};},[portal,trigger]);
 useLayoutEffect(()=>{if(!portal)return;if(selected){definitionHeading.current?.focus({preventScroll:true});dialog.current?.scrollTo(0,0);}else if(restoreTerm.current){restoreTerm.current=false;termTrigger.current?.focus({preventScroll:true});}},[selected,portal]);
 const back=()=>{restoreTerm.current=true;setSelected(null);};
 const open=(key:string,node:HTMLButtonElement)=>{if(!P031_SOURCE_TERMS.some(t=>t.id===key))throw Error('P031_HELP_TERM');termTrigger.current=node;latest.current.onTermOpened?.(key);setSelected(key);};
 const definition=selected?P031_SOURCE_TERMS.find(t=>t.id===selected):undefined;
 if(!portal)return null;
 return createPortal(<dialog ref={dialog} className="p031-help lesson-text-presentation" aria-labelledby={selected?id+'-definition':id} lang={definition?language:'en'} data-p031-help="open" data-p031-help-definition={selected??''} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(selected)back();else latest.current.onClose();}}} onCancel={e=>{e.preventDefault();if(selected)back();else latest.current.onClose();}}>
  {definition&&<div key="definition"><h2 ref={definitionHeading} id={id+'-definition'} tabIndex={-1}>{definition.labels[language]}</h2><p data-p031-definition>{definition.definitions[language]}</p><button type="button" className="p031-help__close" onClick={back}>{language==='es'?'Volver a la ayuda':'Back to help'}</button></div>}<div key="help" hidden={selected!==null}>
   <h2 ref={heading} id={id} tabIndex={-1}>{language==='es'?'Necesito más ayuda':'Need More Help'}</h2>
   <P031HelpBody language={language} onTerm={open}/>
   <button type="button" className="p031-help__close" data-lesson-text-block="close" onClick={()=>latest.current.onClose()}>{language==='es'?'Cerrar':'Close'}</button>
  </div>
 </dialog>,portal);
}

/** Shared source-help content for live modal and explicit frame inspection. */
export function P031HelpBody({language,onTerm}:{language:'en'|'es';onTerm?:(id:string,node:HTMLButtonElement)=>void}){
 const term=(key:string,text:string)=>onTerm?<button type="button" className="p031-help__term" data-p031-help-term={key} onClick={e=>onTerm(key,e.currentTarget)}>{text}</button>:<span>{text}</span>;
 return <><p data-lesson-text-block="help-definition">Use {term('place-value','place value')} to name a {term('decimal','decimal')}:</p>
 <div className="p031-help__figures"><P031HundredthsHelpModel language={language}/><P031PlaceValueTable example="help" language={language} onTerm={onTerm}/></div>
 <div data-lesson-text-block="help-example"><p>Count the {term('tenth','tenths')} = 2</p><p>Count the {term('hundredth','hundredths')} = 3</p><p className="p031-help__number" aria-label="0.23">0 . 2 3</p></div></>;
}
