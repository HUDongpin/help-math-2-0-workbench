'use client';
import React,{useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {P016_ART as ART} from './generated/nms-l02-p016-art-ir-v1';
import {p016Teaching} from './nms-l02-p016-teaching-v1';
import {p016Enabled,P016_FEEDBACK,type P016State} from './nms-l02-p016-state-v1';
import './nms-l02-p016-v1.css';
interface Props{readonly state:P016State;readonly language:'en'|'es';readonly reducedMotion?:boolean;readonly disabled?:boolean;readonly capture?:boolean;readonly onShaded:(count:number)=>void;readonly onDigit:(index:0|1,value:string)=>void;readonly onDragStart:()=>boolean;readonly onDragEnd:(cancel:boolean)=>void;readonly onSubmit:()=>void;readonly onPress:(kind:'reset'|'close')=>void;readonly onRelease:(activate:boolean)=>void;readonly onClose:()=>void;readonly onTerm:(id:string,trigger:HTMLElement)=>void;}
export function P016Fraction({n,d}:{n:string;d:string}){return React.createElement('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline'},React.createElement('mfrac',null,React.createElement('mn',null,n),React.createElement('mn',null,d)));}
/** One press/release pair for pointer or keyboard; a synthetic click remains accessible. */
function PressButton({kind,props,children,buttonRef,disabled=false}:{kind:'reset'|'close';props:Props;children:React.ReactNode;buttonRef?:React.RefObject<HTMLButtonElement|null>;disabled?:boolean}){
 const held=useRef(false),latest=useRef(props);latest.current=props;
 const release=(activate:boolean)=>{if(!held.current)return;held.current=false;latest.current.onRelease(activate);};
 useEffect(()=>{const cancel=()=>release(false);window.addEventListener('blur',cancel);return()=>window.removeEventListener('blur',cancel);},[]);
 useEffect(()=>{if(!props.state.held)held.current=false;},[props.state.held]);
 return <button ref={buttonRef} type="button" disabled={disabled} data-p016-action={kind}
  onPointerDown={e=>{if(e.button!==0||held.current)return;held.current=true;e.currentTarget.setPointerCapture(e.pointerId);props.onPress(kind);}}
  onPointerUp={e=>{const r=e.currentTarget.getBoundingClientRect();release(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom);}}
  onPointerCancel={()=>release(false)} onLostPointerCapture={()=>release(false)} onBlur={()=>release(false)}
  onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();if(!held.current){held.current=true;props.onPress(kind);}}}}
  onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();release(true);}}}
  onClick={e=>{if(e.detail===0&&!held.current){if(kind==='close')props.onClose();else{props.onPress(kind);props.onRelease(true);}}}}>{children}</button>;
}
function FeedbackDialog({props,returnFocus}:{props:Props;returnFocus:()=>void}){
 const [portal,setPortal]=useState<HTMLElement|null>(null),dialog=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null),id=useId(),latest=useRef(returnFocus);latest.current=returnFocus;
 useEffect(()=>setPortal(document.body),[]);
 useEffect(()=>{if(!portal||!dialog.current)return;const node=dialog.current;node.showModal();close.current?.focus();return()=>{node.close();latest.current();};},[portal]);
 if(!portal)return null;
 const s=props.state,message=s.feedback==='correct'?P016_FEEDBACK.correct:P016_FEEDBACK[s.wrongKind??'neither'];
 return createPortal(<dialog ref={dialog} className="nms-l02-p016__dialog lesson-text-presentation" aria-labelledby={id} data-p016-feedback={s.feedback}
  onCancel={e=>{e.preventDefault();props.onClose();}} onKeyDown={e=>{if(e.key==='Tab'){e.preventDefault();close.current?.focus();}}}>
  <p id={id} lang="en">{message}</p><PressButton kind="close" props={props} buttonRef={close}>{props.language==='es'?'Cerrar':'Close'}</PressButton>
 </dialog>,portal);
}
export function NmsL2P016Presentation(props:Props){
 const {state:s,language:l}=props,t=p016Teaching(s),id=useId(),slider=useRef<HTMLInputElement>(null),first=useRef<HTMLInputElement>(null),done=useRef<HTMLButtonElement>(null),pointer=useRef<number|null>(null);
 const enabled=p016Enabled(s)&&!props.disabled&&!props.capture,shaded=t.final?25:s.shaded;
 const term=(text:string,key:string,complete:boolean)=>text?<button className="nms-l02-p016__term" type="button" data-p016-term={key} disabled={!complete||props.disabled||props.capture||s.feedback!=='none'} onClick={e=>props.onTerm(key,e.currentTarget)}>{text}</button>:null;
 const gridRun=t.run(125,1),decimalText=gridRun?gridRun.text.slice(0,7).split('').filter((_,i)=>gridRun.glyphVisible[i]).join(''):'',gridText=gridRun?gridRun.text.slice(8).split('').filter((_,i)=>gridRun.glyphVisible[i+8]).join(''):'';
 const cancel=()=>{if(pointer.current!==null){pointer.current=null;props.onDragEnd(true);}};
 useEffect(()=>{const f=()=>cancel();window.addEventListener('blur',f);return()=>window.removeEventListener('blur',f);},[props.onDragEnd]);
 useEffect(()=>{if(!s.dragging)pointer.current=null;},[s.dragging,s.replay]);
 const gridRows=Array.from({length:100},(_,i)=>i);
 return <section className="nms-l02-p016 lesson-text-presentation" data-source-native-typography="true" data-p016-phase={s.phase} data-p016-main-frame={s.mainFrame} data-p016-shaded={s.shaded} data-p016-feedback={s.feedback} data-p016-outcome={s.outcome} data-p016-replay={s.replay}
  onKeyDown={e=>{if(e.key==='Escape'&&s.dragging){e.preventDefault();cancel();slider.current?.focus();}}}>
  <header className="nms-l02-p016__header"><p lang="en">Fractions, Decimals, and Percents Concepts: Vocabulary</p><h2>{l==='es'?'Porcentaje':'Percent'}</h2></header>
  {l==='es'&&<p className="nms-l02-p016__fallback">Esta página conserva el texto y el audio originales en inglés. Las definiciones de los términos están disponibles en español.</p>}
  {!t.final&&<div className="nms-l02-p016__instructions" lang="en" data-p016-instructions="true">
   <p>{t.prompt1[0]}{term(decimalText,'decimal',t.decimalComplete)}{decimalText&&gridText?' ':''}{term(gridText,'grid',t.gridComplete)}{t.prompt1[2]}{term(t.prompt2[0],'represent',t.representComplete)}{(t.numerator||t.denominator)&&<P016Fraction n={t.numerator} d={t.denominator}/>}<span>{t.prompt2[1]}</span>{t.prompt2[1]&&t.prompt3?' ':''}{t.prompt3}</p>
  </div>}
  <div className="nms-l02-p016__exercise" data-final={t.final} style={{opacity:t.gridAlpha,visibility:t.gridAlpha?'visible':'hidden'}}>
   <figure className="nms-l02-p016__grid">
    <svg viewBox="0 0 200 200" role="img" aria-labelledby={id+'-grid'} data-p016-grid="true">
     <title id={id+'-grid'}>{t.demo?(l==='es'?'Demostración de una cuadrícula de cien casillas':'Demonstration of a hundred-square grid'):(l==='es'?`${shaded} de 100 casillas sombreadas`:`${shaded} of 100 squares shaded`)}</title>
     <rect width="200" height="200" fill="white"/>
     {t.demo?t.demoArt.map(p=><g key={p.depth} transform={'translate(305.4 63.3) matrix('+p.matrix.join(' ')+')'} opacity={p.color[3]} data-p016-source-fill={p.characterId} dangerouslySetInnerHTML={{__html:ART[String(p.characterId)]!.body}}/>):gridRows.slice(0,shaded).map(i=><rect key={i} x={(i%10)*20} y={Math.floor(i/10)*20} width="20" height="20" fill={t.final?'#ff0000':'#0000ff'} data-p016-cell={i+1}/>)}
     <path d={Array.from({length:11},(_,i)=>`M${i*20} 0V200M0 ${i*20}H200`).join(' ')} stroke="#1b3146" strokeWidth=".85" fill="none"/>
    </svg>
    {!t.demo&&<figcaption>{l==='es'?`${shaded} de 100 casillas sombreadas`:`${shaded} of 100 squares shaded`}</figcaption>}
   </figure>
   {!t.final&&<div className="nms-l02-p016__controls">
    <div className="nms-l02-p016__slider" data-demo-target={!props.reducedMotion&&t.demoTarget==='slider'}>
     {t.demo?<><p>{l==='es'?'Observa la demostración':'Watch the demonstration'}</p><div className="nms-l02-p016__demo-rail" aria-hidden="true"><span style={{left:100*t.demoThumb+'%'}}/></div></>:<><label htmlFor={id+'-slider'}>{l==='es'?'Casillas sombreadas':'Shaded squares'}</label><input ref={slider} id={id+'-slider'} type="range" min="0" max="100" step="1" value={s.shaded} disabled={!enabled} aria-valuetext={l==='es'?`${s.shaded} de 100 casillas`:`${s.shaded} of 100 squares`} onChange={e=>props.onShaded(Number(e.currentTarget.value))}
      onPointerDown={e=>{if(e.button!==0||pointer.current!==null)return;if(props.onDragStart())pointer.current=e.pointerId;}}
      onPointerUp={()=>{if(pointer.current!==null){pointer.current=null;props.onDragEnd(false);}}} onPointerCancel={cancel} onLostPointerCapture={()=>{if(pointer.current!==null){pointer.current=null;props.onDragEnd(false);}}}/><div className="nms-l02-p016__range-labels" aria-hidden="true"><span>0</span><span>100</span></div></>}
    </div>
    <fieldset className="nms-l02-p016__answer"><legend>{l==='es'?'Porcentaje':'Percent'}</legend>
     <div className="nms-l02-p016__digits">{([0,1]as const).map(index=><label key={index} data-demo-target={!props.reducedMotion&&t.demoTarget===(index===0?'tens':'ones')}><span>{index===0?(l==='es'?'Decenas':'Tens'):(l==='es'?'Unidades':'Ones')}</span><input ref={index===0?first:undefined} type="text" inputMode="numeric" autoComplete="off" maxLength={1} pattern="[0-9]" value={t.demo?t.demoDigits[index]:s.digits[index]} disabled={!enabled} data-p016-digit={index} onChange={e=>{if(/^\d?$/.test(e.currentTarget.value))props.onDigit(index,e.currentTarget.value);}}/></label>)}<span className="nms-l02-p016__percent" aria-hidden="true">%</span></div>
    </fieldset>
    <div className="nms-l02-p016__actions"><PressButton kind="reset" props={props} disabled={!enabled}>{l==='es'?'Restablecer':'Reset'}</PressButton><button ref={done} type="button" disabled={!enabled} data-p016-action="done" data-demo-target={!props.reducedMotion&&t.demoTarget==='done'} onClick={props.onSubmit}>{l==='es'?'Listo':'Done'}</button></div>
   </div>}
  </div>
  {s.feedback==='reveal'&&<p role="status" className="nms-l02-p016__assisted">{l==='es'?'Aquí está la respuesta: 25 de 100 casillas representan el 25%.':'Here is the answer: 25 of 100 squares represent 25%.'}</p>}
  {t.final&&<p className="nms-l02-p016__conclusion" lang="en">The {term('grid','grid',true)} is 25% shaded.</p>}
  {['wrong','correct'].includes(s.feedback)&&(props.capture?<div className="nms-l02-p016__feedback" lang="en">{s.feedback==='correct'?P016_FEEDBACK.correct:P016_FEEDBACK[s.wrongKind??'neither']}</div>:<FeedbackDialog props={props} returnFocus={()=>{if(s.feedback==='wrong')first.current?.focus({preventScroll:true});else done.current?.focus({preventScroll:true});}}/>)}
  {s.phase==='completed'&&<p role="status">{s.outcome==='assisted'?(l==='es'?'Ejemplo completado con ayuda. Puedes repetirlo o continuar.':'Example completed with help. You can replay or continue.'):(l==='es'?'Actividad completada. Puedes repetirla o continuar.':'Activity complete. You can replay or continue.')}</p>}
 </section>;
}
