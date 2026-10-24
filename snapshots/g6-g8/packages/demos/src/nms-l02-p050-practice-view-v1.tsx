import React from 'react';
import {P050_ITEMS, type P050State, type P050Event} from './nms-l02-p050-practice-v1';
import {p050CanSelect, p050ChoiceDrop} from './nms-l02-p050-choice-v1';
import {P050_TEXT, type P050Language} from './nms-l02-p050-text-v1';
import {p050TargetLabel,p050SelectionText} from './nms-l02-p050-interaction-text-v1';
import {P050Feedback} from './nms-l02-p050-feedback-v1';
import './nms-l02-p050-view-v1.css';
// Source shape 56 has whole-number ticks at -298.75, -107.75, 83.25, 274.25;
// 191 source pixels per unit. Native spacing regularizes minor authored jitter.
const x = (tenths:number) => 8 + tenths * 2.7;
export function P050NumberLine({children, example=false, language='en',tickColor='currentColor',axisOpacity=1,focusable=true}:{children?:React.ReactNode;example?:boolean;language?:P050Language;tickColor?:string;axisOpacity?:number;focusable?:boolean}) {
 const axis=<><svg viewBox="0 0 1000 110" preserveAspectRatio="none" aria-hidden="true" style={{opacity:axisOpacity}}>
  <path d="M20 45 H965 M20 45 L33 37 M20 45 L33 53 M965 45 L952 37 M965 45 L952 53" fill="none" stroke="currentColor" strokeWidth="2"/>
  {Array.from({length:33},(_,index)=>index-1).map(tenth=><line key={tenth} x1={x(tenth)*10} x2={x(tenth)*10} y1="30" y2={tenth%10===0?70:58} stroke={tickColor} strokeWidth="2"/>)}
 </svg>
 {[0,1,2,3].map(value=><span className="p050-whole" key={value} style={{left:`${x(value*10)}%`,opacity:axisOpacity}} aria-hidden={axisOpacity===0}>{value}</span>)}</>;
 return <div className="p050-line-scroll" tabIndex={focusable?0:-1} role="region" aria-label={language==='es'?'Recta numérica':'Number line'} aria-hidden={!focusable}>
  <div className="p050-line">
   {axis}
   {example&&<span className="p050-example" style={{left:`${x(5)}%`}}>0.5</span>}
   {children}
  </div>
 </div>;
}
export function P050PracticeView({state,language='en',interactive=true,onEvent}:{state:P050State;language?:P050Language;interactive?:boolean;onEvent:(event:P050Event)=>void}) {
 const text=P050_TEXT[language],id=React.useId(),root=React.useRef<HTMLElement>(null);
 const [selection,setSelection]=React.useState<number|null>(null);
 const [ghost,setGhost]=React.useState<{item:number;x:number;y:number}|null>(null);
 const drag=React.useRef<{item:number;pointer:number;x:number;y:number;moved:boolean}|null>(null);
 const suppressClick=React.useRef(false);
 const enabled=interactive&&state.phase==='ready'&&!state.helpOpen;
 React.useEffect(()=>{setSelection(null);setGhost(null);drag.current=null;},[state.token,interactive]);
 function submit(item:number|null,target:number|null){if(!enabled)return;const event=p050ChoiceDrop(state,item,target);setSelection(null);if(event)onEvent(event);}
 function cancel(){drag.current=null;setGhost(null);setSelection(null);}
 return <section ref={root} className="p050-practice" lang={language} data-p050-phase={state.phase} onKeyDown={event=>{if(event.key==='Escape'&&!state.helpOpen&&state.phase==='ready'){event.preventDefault();cancel();}}}>
  <h2>{text.question}</h2><p>{text.helpInstruction}</p>
  <p id={`${id}-instruction`}>{text.instruction}</p><p id={`${id}-keyboard`}>{text.keyboard}</p>
  <P050NumberLine language={language}>
   {[...P050_ITEMS].sort((a,b)=>a.tenths-b.tenths).map(item=>{
    const solved=state.solved.includes(item.id);
    return <button key={item.id} type="button" className="p050-target" data-p050-target={item.id} style={{left:`${x(item.tenths)}%`}}
     disabled={!enabled||solved} aria-label={p050TargetLabel(state,item.id,language)}
     onClick={()=>submit(selection,item.id)}>{solved?item.decimal:<span aria-hidden="true">○</span>}</button>;
   })}
  </P050NumberLine>
  <div className="p050-items" role="group" aria-describedby={`${id}-instruction ${id}-keyboard`} aria-label={language==='es'?'Decimales':'Decimals'}>
   {P050_ITEMS.map(item=>state.solved.includes(item.id)?null:<button key={item.id} type="button" data-p050-item={item.id} aria-pressed={selection===item.id}
    disabled={!interactive||!p050CanSelect(state,item.id)} onClick={event=>{const suppress=suppressClick.current&&event.detail>0;suppressClick.current=false;if(suppress)return;setSelection(selection===item.id?null:item.id);}}
    onPointerDown={event=>{if(!enabled||event.button!==0)return;suppressClick.current=false;drag.current={item:item.id,pointer:event.pointerId,x:event.clientX,y:event.clientY,moved:false};event.currentTarget.setPointerCapture(event.pointerId);}}
    onPointerMove={event=>{const current=drag.current;if(!current||current.pointer!==event.pointerId)return;if(Math.hypot(event.clientX-current.x,event.clientY-current.y)>6)current.moved=true;if(current.moved)setGhost({item:current.item,x:event.clientX,y:event.clientY});}}
    onPointerUp={event=>{const current=drag.current;if(!current||current.pointer!==event.pointerId)return;drag.current=null;setGhost(null);if(!current.moved)return;suppressClick.current=true;const target=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLButtonElement>('[data-p050-target]');submit(current.item,target&&root.current?.contains(target)?Number(target.dataset.p050Target):null);}}
    onPointerCancel={cancel} onLostPointerCapture={()=>{drag.current=null;setGhost(null);}}>{item.decimal}</button>)}
  </div>
  <p role="status">{p050SelectionText(state,selection,language)}</p>
  {ghost&&<span aria-hidden="true" className="p050-drag-ghost" style={{left:ghost.x,top:ghost.y}}>{P050_ITEMS.find(item=>item.id===ghost.item)?.decimal}</span>}
  <P050Feedback {...{state,language,interactive,onEvent}}><P050NumberLine language={language} example/></P050Feedback>
 </section>;
}
