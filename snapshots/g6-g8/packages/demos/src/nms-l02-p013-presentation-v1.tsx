'use client';
import React,{useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {P013_ITEMS,P013_TARGET_ANGLES,P013_WRONG_TEXT,p013Teaching,type P013State} from './nms-l02-p013-timeline-v1';
import './nms-l02-p013-v1.css';
export function P013Fraction({n,d}:{n:number;d:number}) {return React.createElement('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline'},React.createElement('mfrac',null,React.createElement('mn',null,n),React.createElement('mn',null,d)));}
export function p013Sector(cx:number,cy:number,r:number,angle:number){const point=(degrees:number)=>{const a=degrees*Math.PI/180;return[cx+r*Math.cos(a),cy+r*Math.sin(a)];};const a=point(angle),b=point(angle+60);return `M${cx} ${cy}L${a[0]} ${a[1]}A${r} ${r} 0 0 1 ${b[0]} ${b[1]}Z`;}
interface Props {readonly state:P013State;readonly language:'en'|'es';readonly reducedMotion?:boolean;readonly disabled?:boolean;readonly capture?:boolean;readonly onPick:(id:number,input:'pointer'|'keyboard')=>boolean;readonly onDrop:(inside:boolean)=>void;readonly onCancel:()=>void;readonly onClosePress:()=>void;readonly onCloseRelease:(activate:boolean)=>void;readonly onTerm:(trigger:HTMLElement)=>void;}
function WrongDialog({props,returnFocus}:{props:Props;returnFocus:()=>void}) {
 const [portal,setPortal]=useState<HTMLElement|null>(null),dialog=useRef<HTMLDialogElement>(null),button=useRef<HTMLButtonElement>(null),id=useId();
 const latest=useRef(props);latest.current=props;
 useEffect(()=>setPortal(document.body),[]);
 useEffect(()=>{if(!portal||!dialog.current)return;const node=dialog.current;node.showModal();button.current?.focus();return()=>{node.close();returnFocus();};},[portal]);
 if(!portal)return null;
 return createPortal(<dialog ref={dialog} className="nms-l02-p013__dialog lesson-text-presentation" aria-labelledby={id} data-p013-wrong-dialog="true"
  onCancel={e=>{e.preventDefault();latest.current.onCloseRelease(true);}}
  onKeyDown={e=>{if(e.key==='Tab'){e.preventDefault();button.current?.focus();}}}>
  <p id={id} lang="en">{P013_WRONG_TEXT}</p>
  <button ref={button} type="button" onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);props.onClosePress();}}
   onPointerUp={e=>{const box=e.currentTarget.getBoundingClientRect();props.onCloseRelease(e.clientX>=box.left&&e.clientX<=box.right&&e.clientY>=box.top&&e.clientY<=box.bottom);}}
   onPointerCancel={()=>props.onCloseRelease(false)} onLostPointerCapture={()=>{if(props.state.closeHeld)props.onCloseRelease(false);}}
   onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();props.onClosePress();}}}
   onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();props.onCloseRelease(true);}}}
   onClick={event=>{if(event.detail===0)props.onCloseRelease(true);}}>{props.language==='es'?'Cerrar':'Close'}</button>
 </dialog>,portal);
}
export function NmsL2P013Presentation(props:Props) {
 const {state:s,language}=props,t=p013Teaching(s),id=useId(),svg=useRef<SVGSVGElement>(null),target=useRef<SVGCircleElement>(null),buttons=useRef<(HTMLButtonElement|null)[]>([]),dropButton=useRef<HTMLButtonElement>(null);
 const active=useRef<{id:number;pointer:number;startX:number;startY:number;moved:boolean}|null>(null),lastItem=useRef(1),[drag,setDrag]=useState<{x:number;y:number}|null>(null);
 const enabled=t.enabled&&!props.disabled&&!props.capture;
 const point=(x:number,y:number)=>{const matrix=svg.current?.getScreenCTM();if(!matrix)return null;const p=new DOMPoint(x,y).matrixTransform(matrix.inverse());return{x:p.x,y:p.y};};
 useEffect(()=>{if(s.picked===null){active.current=null;setDrag(null);}},[s.picked,s.replay]);
 useEffect(()=>{const cancel=()=>{if(active.current){active.current=null;setDrag(null);props.onCancel();}};window.addEventListener('blur',cancel);return()=>window.removeEventListener('blur',cancel);},[props.onCancel]);
 useEffect(()=>{if(s.used.length>0&&s.phase==='exercise'){const next=P013_ITEMS.find(p=>!s.used.includes(p.id));if(next)buttons.current[next.id]?.focus({preventScroll:true});}},[s.used.length]);
 useEffect(()=>{if(s.picked!==null&&s.input==='keyboard')dropButton.current?.focus();},[s.picked,s.input]);
 const pick=(item:number)=>{if(!enabled)return;lastItem.current=item;if(props.onPick(item,'keyboard'))dropButton.current?.focus();};
 const pointerDown=(e:React.PointerEvent<SVGPathElement>,item:number)=>{
  if(!enabled||e.button!==0||active.current)return;e.preventDefault();lastItem.current=item;
  if(!props.onPick(item,'pointer'))return;e.currentTarget.setPointerCapture(e.pointerId);active.current={id:item,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false};
 };
 const pointerMove=(e:React.PointerEvent<SVGPathElement>)=>{const a=active.current;if(!a||a.pointer!==e.pointerId)return;if(Math.hypot(e.clientX-a.startX,e.clientY-a.startY)>4)a.moved=true;if(a.moved)setDrag(point(e.clientX,e.clientY));};
 const pointerUp=(e:React.PointerEvent<SVGPathElement>)=>{const a=active.current;if(!a||a.pointer!==e.pointerId)return;active.current=null;setDrag(null);
  if(!a.moved){dropButton.current?.focus();return;}
  const p=point(e.clientX,e.clientY);props.onDrop(!!p&&Math.hypot(p.x-150,p.y-110)<=80);
 };
 const pointerCancel=(e:React.PointerEvent<SVGPathElement>)=>{if(active.current?.pointer===e.pointerId){active.current=null;setDrag(null);props.onCancel();}};
 const pointer=t.cursor,drawCursor=pointer&&pointer.opacity>0&&!props.reducedMotion;
 return <section className="nms-l02-p013 lesson-text-presentation" data-source-native-typography="true" data-p013-phase={s.phase} data-p013-main-frame={s.mainFrame} data-p013-used={s.used.join(',')} data-p013-picked={s.picked??''} data-p013-wrong-frame={s.wrongFrame??''} data-p013-correct-frame={s.correctFrame??''} data-p013-replay={s.replay}
  onKeyDown={e=>{if(e.key==='Escape'&&s.picked!==null){e.preventDefault();active.current=null;setDrag(null);props.onCancel();buttons.current[lastItem.current]?.focus();}}}>
  <header className="nms-l02-p013__header"><p lang="en">Fractions, Decimals, and Percents Concepts: Vocabulary</p><h2>{language==='es'?'Fracción equivalente':'Equivalent Fraction'}</h2></header>
  {language==='es'&&<p className="nms-l02-p013__fallback" lang="es">Esta página conserva el texto y el audio originales en inglés. La definición del término está disponible en español.</p>}
  <div className="nms-l02-p013__instructions" lang="en" style={{visibility:t.promptOpacity?'visible':'hidden',opacity:t.promptOpacity}}>
   <p>Find an <button type="button" className="nms-l02-p013__term" data-emphasis={t.termEmphasis&&!props.reducedMotion} disabled={!t.termEnabled||props.disabled||props.capture} onClick={e=>props.onTerm(e.currentTarget)}>equivalent fraction</button> for <P013Fraction n={1} d={2}/>.</p>
   <p>Drag and drop the sixths of the circle on the right to the circle on the left until you make a fraction that equals one-half.</p>
  </div>
  <figure className="nms-l02-p013__figure" style={{visibility:t.circlesOpacity?'visible':'hidden',opacity:t.circlesOpacity}}>
   <svg ref={svg} viewBox="0 0 520 220" role="img" aria-labelledby={id+'-diagram-title'} data-p013-diagram="true">
    <title id={id+'-diagram-title'}>{language==='es'?`Círculo objetivo a la izquierda; ${s.used.length} sextos colocados. Círculo de piezas a la derecha.`:`Target circle on the left; ${s.used.length} sixths placed. Circle of pieces on the right.`}</title>
    <circle cx="150" cy="110" r="80" fill="#fff" stroke="currentColor"/>
    {t.goalHalf&&<path d="M150 30A80 80 0 0 1 150 190Z" fill="#b8c2cf"/>}
    {P013_TARGET_ANGLES.map((angle,index)=><path key={angle} d={p013Sector(150,110,80,angle)} fill={t.targetColors[index]??(t.demoDeposited&&index===2?P013_ITEMS[3].color:'none')} stroke="currentColor" data-p013-target-slot={index+1} data-color={t.targetColors[index]??''}/>)}
    <circle ref={target} cx="150" cy="110" r="80" fill="transparent" stroke={s.picked!==null?'#154ba8':'none'} strokeWidth="4" data-p013-drop-target="true" pointerEvents="none"/>
    <circle cx="370" cy="110" r="80" fill="#fff" stroke="currentColor"/>
    {P013_ITEMS.map(item=>{
     const gone=s.used.includes(item.id)||(t.demoDeposited&&item.id===4);if(gone)return null;
     return <path key={item.id} d={p013Sector(370,110,80,item.angle)} fill={item.color} stroke="currentColor" strokeWidth={s.picked===item.id?3:1.4} className="nms-l02-p013__sector" data-p013-piece={item.id} data-source-piece={item.name} data-p013-draggable={enabled}
      style={{opacity:drag&&s.picked===item.id?0.5:1}} onPointerDown={e=>pointerDown(e,item.id)} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerCancel} onLostPointerCapture={pointerCancel}/>;
    })}
    {t.demoMoving&&t.demoMove&&<path d={p013Sector(370+t.demoMove.x*220,110+t.demoMove.y*160,80,30)} fill={P013_ITEMS[3].color} stroke="currentColor" pointerEvents="none"/>}
    {drawCursor&&<g transform={`translate(${150+pointer.x*220} ${110+pointer.y*160})`} opacity={pointer.opacity} pointerEvents="none" data-p013-demo-pointer="true"><path d={pointer.hand?'M0 0V-12Q4 -17 7 -12V-3L10 -7Q14 -9 16 -5L21 3L19 18H3L-5 7Q-6 2 -2 2Z':'M0 0L0 27L7 20L14 34L20 31L13 17L24 17Z'} fill="white" stroke="#182a3a" strokeWidth="1.5"/></g>}
    {drag&&s.picked!==null&&<path d={p013Sector(drag.x,drag.y,45,30)} fill={P013_ITEMS[s.picked-1].color} stroke="currentColor" opacity=".85" pointerEvents="none"/>}
   </svg>
   <figcaption className="nms-l02-p013__captions"><span>{language==='es'?'Objetivo':'Target'}: <P013Fraction n={1} d={2}/></span><span>{language==='es'?'Cada pieza':'Each piece'}: <P013Fraction n={1} d={6}/></span></figcaption>
  </figure>
  <div className="nms-l02-p013__pieces" role="group" aria-label={language==='es'?'Seleccionar un sexto':'Select one sixth'} style={{visibility:t.circlesOpacity?'visible':'hidden'}}>
   {P013_ITEMS.map(item=><button key={item.id} ref={node=>{buttons.current[item.id]=node;}} type="button" data-p013-pick={item.id} disabled={!enabled||s.used.includes(item.id)||s.picked!==null} onClick={()=>pick(item.id)} aria-label={`${language==='es'?'Seleccionar pieza':'Select piece'} ${item.id}, ${item.colorName}, ${language==='es'?'un sexto':'one sixth'}`}>
    <span className="nms-l02-p013__swatch" style={{background:item.color}} aria-hidden="true"/><span>{language==='es'?'Pieza':'Piece'} {item.id}</span><P013Fraction n={1} d={6}/>{s.used.includes(item.id)&&<span>{language==='es'?'Colocada':'Placed'}</span>}
   </button>)}
  </div>
  {s.phase==='exercise'&&!s.wrongOpen&&<div className="nms-l02-p013__actions">
   <p role="status">{s.picked!==null?(language==='es'?`Pieza ${s.picked} seleccionada. Colócala en el objetivo o cancela.`:`Piece ${s.picked} selected. Place it in the target or cancel.`):(language==='es'?'Arrastra una pieza, o selecciónala y pulsa Colocar.':'Drag a piece, or select one and choose Place.')}</p>
   <button ref={dropButton} type="button" data-p013-place="true" disabled={s.picked===null||props.disabled||props.capture} onClick={()=>props.onDrop(true)}>{language==='es'?'Colocar en el objetivo':'Place in target'}</button>
   <button type="button" disabled={s.picked===null||props.disabled||props.capture} onClick={()=>{props.onCancel();buttons.current[lastItem.current]?.focus();}}>{language==='es'?'Cancelar':'Cancel'}</button>
  </div>}
  {s.used.length>0&&<p className="nms-l02-p013__sum" aria-label={language==='es'?`${s.used.length} sextos colocados`:`${s.used.length} sixths placed`}>
   {s.used.map((piece,index)=><React.Fragment key={piece}>{index>0&&<span>+</span>}<span className="nms-l02-p013__placed-value" data-piece={piece}><span className="nms-l02-p013__swatch" style={{background:P013_ITEMS[piece-1].color}} aria-hidden="true"/><P013Fraction n={1} d={6}/></span></React.Fragment>)}
  </p>}
  {s.correctFrame!==null&&<p className="nms-l02-p013__correct" role="status" lang="en">correct!!!</p>}
  <div className="nms-l02-p013__equation" lang="en" aria-label={t.halfOpacity===1?'Three sixths equals one half':undefined}>
   <span style={{visibility:t.threeSixthsOpacity?'visible':'hidden',opacity:t.threeSixthsOpacity}} data-emphasis={t.threeSixthsEmphasis&&!props.reducedMotion}><P013Fraction n={3} d={6}/></span>
   <span style={{visibility:t.equalsOpacity?'visible':'hidden',opacity:t.equalsOpacity}}>=</span>
   <span style={{visibility:t.halfOpacity?'visible':'hidden',opacity:t.halfOpacity}} data-emphasis={t.halfEmphasis&&!props.reducedMotion}><P013Fraction n={1} d={2}/></span>
  </div>
  {s.wrongOpen&&(props.capture?<div className="nms-l02-p013__wrong"><p lang="en">{P013_WRONG_TEXT}</p><button disabled>Close</button></div>:<WrongDialog props={props} returnFocus={()=>buttons.current[lastItem.current]?.focus({preventScroll:true})}/>)}
  {s.phase==='completed'&&<p role="status">{language==='es'?'Actividad completada. Puedes repetirla o continuar.':'Activity complete. You can replay or continue.'}</p>}
 </section>;
}
