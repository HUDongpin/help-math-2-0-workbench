'use client';
import React,{useEffect,useId,useRef,useState}from'react';
import{createPortal}from'react-dom';
import{p021Teaching,p021SectorPath}from'./nms-l02-p021-teaching-v1';
import{p021Editable,p021ButtonEnabled,p021NeedsReplay,P021_FEEDBACK,type P021State,type P021Button}from'./nms-l02-p021-state-v1';
import'./nms-l02-p021-v1.css';
export interface P021PresentationProps{readonly state:P021State;readonly language:'en'|'es';readonly reducedMotion?:boolean;readonly disabled?:boolean;readonly capture?:boolean;readonly onToggle:(index:number)=>void;readonly onPress:(kind:P021Button)=>void;readonly onRelease:(activate:boolean)=>void;readonly onClose:()=>void;}
function Fraction({n,d}:{n:number;d:number}){return React.createElement('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline','aria-label':`${n}/${d}`},React.createElement('mfrac',null,React.createElement('mn',null,String(n)),React.createElement('mn',null,String(d))));}
function PressButton({kind,props,children,buttonRef,disabled=false,highlight=false}:{kind:P021Button;props:P021PresentationProps;children:React.ReactNode;buttonRef?:React.RefObject<HTMLButtonElement|null>;disabled?:boolean;highlight?:boolean}){
 const held=useRef(false),latest=useRef(props);latest.current=props;
 const release=(activate:boolean)=>{if(!held.current)return;held.current=false;latest.current.onRelease(activate);};
 useEffect(()=>{const cancel=()=>release(false);window.addEventListener('blur',cancel);return()=>window.removeEventListener('blur',cancel);},[]);
 useEffect(()=>{if(!props.state.held)held.current=false;},[props.state.held]);
 return <button ref={buttonRef} type="button" disabled={disabled} data-p021-action={kind} data-demo-target={highlight}
 onPointerDown={e=>{if(e.button!==0||held.current)return;held.current=true;e.currentTarget.setPointerCapture(e.pointerId);props.onPress(kind);}}
 onPointerUp={e=>{const r=e.currentTarget.getBoundingClientRect();release(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom);}}
 onPointerCancel={()=>release(false)} onLostPointerCapture={()=>release(false)} onBlur={()=>release(false)}
 onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();if(!held.current){held.current=true;props.onPress(kind);}}}}
 onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();release(true);}}}
 onClick={e=>{if(e.detail===0&&!held.current){props.onPress(kind);props.onRelease(true);}}}>{children}</button>;
}
function FeedbackDialog({props,returnFocus}:{props:P021PresentationProps;returnFocus:()=>void}){
 const[portal,setPortal]=useState<HTMLElement|null>(null),ref=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null),id=useId(),latest=useRef(returnFocus);latest.current=returnFocus;
 useEffect(()=>setPortal(document.body),[]);useEffect(()=>{if(!portal||!ref.current)return;const n=ref.current;n.showModal();close.current?.focus();return()=>{n.close();latest.current();};},[portal]);
 if(!portal)return null;const s=props.state,message=s.feedback==='correct'?P021_FEEDBACK.correct:s.attempts===1?P021_FEEDBACK.first:P021_FEEDBACK.later;
 return createPortal(<dialog ref={ref} className="nms-l02-p021__dialog lesson-text-presentation" aria-labelledby={id} data-p021-feedback-dialog={s.feedback} onCancel={e=>{e.preventDefault();props.onClose();}} onKeyDown={e=>{if(e.key==='Tab'){e.preventDefault();close.current?.focus();}}}><p id={id} lang="en">{message}</p><PressButton kind="close" props={props} buttonRef={close}>{props.language==='es'?'Cerrar':'Close'}</PressButton></dialog>,portal);
}
export function NmsL2P021Presentation(props:P021PresentationProps){
 const{state:s,language:l}=props,t=p021Teaching(s),id=useId(),region=useRef<HTMLElement>(null),figure=useRef<SVGSVGElement>(null),check=useRef<HTMLButtonElement>(null),newWhole=useRef<HTMLButtonElement>(null),[focus,setFocus]=useState(0);
 const enabled=p021Editable(s)&&!props.disabled&&!props.capture;
 useEffect(()=>{setFocus(0)},[t.parts,s.round,s.replay]);
 const labels={up:l==='es'?'Aumentar partes':'Increase parts',down:l==='es'?'Reducir partes':'Decrease parts',check:l==='es'?'Comprobar respuesta':'Check Answer',new:l==='es'?'Nuevo entero':'New Whole'};
 const highlight=(kind:string)=>t.demo&&(t.row.pointerTarget===kind||(kind==='up'&&(props.reducedMotion?t.row.upReducedEmphasis:t.row.upEmphasis))||(kind==='down'&&(props.reducedMotion?t.row.downReducedEmphasis:t.row.downEmphasis)));
 const button=(kind:'up'|'down'|'check'|'new',buttonRef?:React.RefObject<HTMLButtonElement|null>)=><PressButton kind={kind} props={props} buttonRef={buttonRef} disabled={!p021ButtonEnabled(s,kind)||props.disabled||props.capture} highlight={highlight(kind)}>{kind==='up'?'▲ ':kind==='down'?'▼ ':''}{labels[kind]}</PressButton>;
 const emphasis=new Set(t.demo?(props.reducedMotion?t.row.promptReducedEmphasis:t.row.promptEmphasis):[]);
 // Reduced motion removes source blinking while retaining continuous emphasis
 // over each connected source highlight interval (derived in the IR generator).
 const prompt=t.prompt.split('').map((char,i)=><span key={i} className={emphasis.has(i)?'nms-l02-p021__emphasis':undefined}>{char}</span>);
 const feedback=s.feedback==='correct'?P021_FEEDBACK.correct:s.attempts===1?P021_FEEDBACK.first:P021_FEEDBACK.later;
 return <section ref={region} tabIndex={-1} className="nms-l02-p021 lesson-text-presentation" data-p021-phase={s.phase} data-p021-main-frame={s.mainFrame} data-p021-parts={t.parts} data-p021-selected={t.selected.join(',')} data-p021-round={s.round} data-p021-question={s.question??''} data-p021-feedback={s.feedback} data-p021-outcome={s.outcome} data-p021-correct={s.correctCount} data-p021-replay={s.replay}>
  <header className="nms-l02-p021__header"><p lang="en">Fractions, Decimals, and Percents Concepts:</p><h2 lang="en">Instruction</h2></header>
  {l==='es'&&<p className="nms-l02-p021__fallback" lang="es">Esta página conserva el texto y el audio originales en inglés.</p>}
  <p className="nms-l02-p021__instructions" lang="en" data-lesson-text-block="instructions">{prompt}</p>
  {t.demo&&<p className="nms-l02-p021__hint">{l==='es'?'Observa la demostración.':'Watch the demonstration.'}</p>}
  <div className="nms-l02-p021__exercise" data-demo-outline={t.demo&&t.row.frameOutline}>
   <div className="nms-l02-p021__diagram-column">
    <svg ref={figure} className="nms-l02-p021__diagram" viewBox="-120 -120 240 240" role={enabled?'group':'img'} aria-labelledby={id+'-circle'}>
     <title id={id+'-circle'}>{l==='es'?`${t.selected.length} de ${t.parts} partes iguales sombreadas`:`${t.selected.length} of ${t.parts} equal parts shaded`}</title>
     {Array.from({length:t.parts},(_,i)=><path key={i} data-p021-sector={i} d={p021SectorPath(t.parts,i,t.rotation)} fill={t.selected.includes(i)?t.demo?'#6699ff':'#ffdd88':'#fff'} stroke="#263c50" strokeWidth="1.6" role={enabled?'checkbox':undefined} aria-checked={enabled?t.selected.includes(i):undefined} aria-label={enabled?(l==='es'?`Parte ${i+1} de ${t.parts}`:`Part ${i+1} of ${t.parts}`):undefined} tabIndex={enabled?(i===focus?0:-1):undefined}
      onFocus={()=>setFocus(i)} onClick={()=>{if(enabled)props.onToggle(i)}} onKeyDown={e=>{if(!enabled)return;if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat)props.onToggle(i);}else if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?t.parts-1:(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+t.parts)%t.parts;setFocus(n);figure.current?.querySelector<SVGPathElement>(`[data-p021-sector="${n}"]`)?.focus();}}}/>) }
     {t.demo&&t.row.circlePointer&&!props.reducedMotion&&<path aria-hidden="true" transform={`translate(${t.row.circlePointer[0]!*100} ${t.row.circlePointer[1]!*100})`} d="M0 0 L-1 21 L6 15 L13 28 L17 26 L10 13 L20 11 Z" fill="#14283d" stroke="white" strokeWidth="1"/>}
    </svg>
    <p className="nms-l02-p021__part-count" data-lesson-text-block="parts">{t.parts} {l==='es'?(t.parts===1?'parte':'partes'):(t.parts===1?'Piece':'Pieces')}</p>
    <div className="nms-l02-p021__part-controls">{button('up')}{button('down')}</div>
   </div>
   <div className="nms-l02-p021__question-column">
    <p className={'nms-l02-p021__target'+(t.demo&&(props.reducedMotion?t.row.fractionReducedEmphasis:t.row.fractionEmphasis)?' nms-l02-p021__emphasis':'')} data-lesson-text-block="target"><span lang="en">{t.target[0]} {t.demo?'out of':'Out of'} {t.target[1]}</span><Fraction n={t.target[0]!} d={t.target[1]!}/></p>
    <div className="nms-l02-p021__actions">{button('check',check)}{button('new',newWhole)}</div>
    {s.outcome==='assisted'&&s.feedback==='none'&&<p role="status" className="nms-l02-p021__notice">{l==='es'?'Se muestra la respuesta.':'The answer is shown.'} <Fraction n={t.target[0]!} d={t.target[1]!}/></p>}
    {p021NeedsReplay(s)&&<p role="status" className="nms-l02-p021__notice">{l==='es'?'Repite la actividad para resolver correctamente las tres fracciones.':'Replay the activity to solve all three fractions correctly.'}</p>}
    {s.phase==='completed'&&<p role="status">{l==='es'?'Actividad completada. Puedes repetirla o continuar.':'Activity complete. You can replay or continue.'}</p>}
   </div>
  </div>
  {s.feedback!=='none'&&(props.capture?<p className="nms-l02-p021__notice" lang="en">{feedback}</p>:<FeedbackDialog props={props} returnFocus={()=>{if(s.feedback==='wrong'&&s.attempts<2)check.current?.focus({preventScroll:true});else if(newWhole.current&&!newWhole.current.disabled)newWhole.current.focus({preventScroll:true});else region.current?.focus({preventScroll:true});}}/>)}
 </section>;
}
