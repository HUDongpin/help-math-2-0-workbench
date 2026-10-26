'use client';
import React,{useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {P029SourceTerm} from './nms-l02-p029-term-host-v1';

function Definition({text}:{text:string}) {
  return <>{text.split(/(\d+\/\d+|4³)/u).map((part,index)=>{
    const fraction=/^(\d+)\/(\d+)$/u.exec(part);
    if(fraction)return React.createElement('math',{key:index,xmlns:'http://www.w3.org/3838/Math/MathML',display:'inline','aria-label':part},React.createElement('mfrac',null,React.createElement('mn',null,fraction[1]),React.createElement('mn',null,fraction[2])));
    if(part==='4³')return React.createElement('math',{key:index,xmlns:'http://www.w3.org/3838/Math/MathML',display:'inline','aria-label':'4³'},React.createElement('msup',null,React.createElement('mn',null,'4'),React.createElement('mn',null,'3')));
    return <React.Fragment key={index}>{part}</React.Fragment>;
  })}</>;
}

/** The modal keeps its single action in the keyboard cycle. Closing never resumes the
 * source clock; the surrounding lesson's explicit Resume remains in control. */
export function NmsL2P029TermDialog({term,language,trigger,onClose}:{term:P029SourceTerm;language:'en'|'es';trigger:HTMLElement|null;onClose:()=>void}) {
  const [portal,setPortal]=useState<HTMLElement|null>(null);
  const dialog=useRef<HTMLDialogElement|null>(null),close=useRef<HTMLButtonElement|null>(null),title=useRef<HTMLHeadingElement|null>(null),id=useId();
  const latest=useRef(onClose);latest.current=onClose;
  useEffect(()=>{setPortal(document.body);},[]);
  useEffect(()=>{
    if(!portal||!dialog.current)return;
    const node=dialog.current;node.showModal();title.current?.focus({preventScroll:true});node.scrollTop=0;
    return()=>{node.close();if(trigger?.isConnected)trigger.focus({preventScroll:true});};
  },[portal,term.id,trigger]);
  if(!portal)return null;
  return createPortal(<dialog ref={dialog} className="nms-l02-p029__dialog lesson-text-presentation" aria-labelledby={id+'-title'} lang={language}
    data-p029-term-id={term.id} data-source-sha256={term.source[language].sha256}
    onKeyDown={event=>{if(event.key==='Tab'){event.preventDefault();close.current?.focus();}}}
    onCancel={event=>{event.preventDefault();latest.current();}}>
    <h2 ref={title} tabIndex={-1} id={id+'-title'}>{term.labels[language]}</h2>
    <p><Definition text={term.definitions[language]}/></p>
    <p className="nms-l02-p029__resume-hint">{language==='es'?'La animación seguirá en pausa al cerrar. Usa Reanudar para continuar.':'The animation will stay paused when you close. Use Resume to continue.'}</p>
    <button ref={close} type="button" onClick={()=>latest.current()}>{language==='es'?'Cerrar':'Close'}</button>
  </dialog>,portal);
}
