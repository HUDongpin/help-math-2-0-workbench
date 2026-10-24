import React from 'react';
import {P051_ITEMS,type P051State,type P051Event} from './nms-l02-p051-practice-v1';
import {P051_TEXT,type P051Language} from './nms-l02-p051-text-v1';

/** Semantic native fraction; spoken slash notation avoids reading numerator/denominator as one number. */
export function P051Fraction({numerator,denominator}:{numerator:number;denominator:number}){
 return <span className="p051-fraction" role="math" aria-label={`${numerator}/${denominator}`}><span aria-hidden="true">{numerator}</span><span aria-hidden="true">{denominator}</span></span>;
}
export function P051PracticeView({state,language='en',interactive=true,modalSuspended=false,onEvent,wrongGlossary}:{state:P051State;language?:P051Language;interactive?:boolean;modalSuspended?:boolean;onEvent:(event:P051Event)=>void;wrongGlossary?:React.ReactNode}){
 const text=P051_TEXT[language],id=React.useId(),root=React.useRef<HTMLElement>(null),wrong=React.useRef<HTMLDialogElement>(null);
 const [selection,setSelection]=React.useState<number|null>(null),[ghost,setGhost]=React.useState<{item:number;x:number;y:number}|null>(null);
 const drag=React.useRef<{item:number;pointer:number;x:number;y:number;moved:boolean}|null>(null);
 const suppressedPointerClick=React.useRef(false),returnItem=React.useRef<number|null>(null);
 const enabled=interactive&&!modalSuspended&&state.phase==='ready',wrongOpen=state.phase==='wrong-feedback';
 const selected=state.phase==='ready'?P051_ITEMS.find(item=>item.id===selection&&!state.solved.includes(item.id)):undefined;
 React.useEffect(()=>{setSelection(null);setGhost(null);drag.current=null;suppressedPointerClick.current=false;},[state.token,interactive]);
 React.useEffect(()=>{
  const dialog=wrong.current;if(!dialog)return;
  if(wrongOpen&&interactive&&!dialog.open){returnItem.current=state.activeItem;dialog.showModal();dialog.querySelector<HTMLElement>('h3')?.focus();}
  else if(!wrongOpen&&dialog.open){dialog.close();if(state.phase==='ready')root.current?.querySelector<HTMLButtonElement>(`[data-p051-item="${returnItem.current}"]`)?.focus();}
 },[wrongOpen,interactive,state.phase,state.activeItem]);
 React.useEffect(()=>{const dialog=wrong.current;return ()=>{dialog?.close();};},[]);
 function cancel(){drag.current=null;setGhost(null);setSelection(null);}
 function submit(item:number|null,target:number|null){if(!enabled||item===null||state.solved.includes(item)||!P051_ITEMS.some(value=>value.id===item))return;cancel();returnItem.current=item;onEvent({type:'drop',item,target});}
 return <section ref={root} className="p051-practice" lang={language} data-p051-phase={state.phase} onKeyDown={event=>{if(event.key==='Escape'&&enabled){event.preventDefault();cancel();}}}>
  <h2>{text.question}</h2><p id={`${id}-instruction`}>{text.instruction}</p><p id={`${id}-keyboard`}>{text.keyboard}</p>
  <div className="p051-match-layout">
   <table className="p051-matches"><thead><tr><th scope="col">{text.fraction}</th><th scope="col">{text.equivalentDecimal}</th></tr></thead><tbody>
    {P051_ITEMS.map(item=>{if(!item.fraction)return null;const solved=state.solved.includes(item.id),fraction=`${item.fraction[0]}/${item.fraction[1]}`;
     return <tr key={item.id}><th scope="row"><P051Fraction numerator={item.fraction[0]} denominator={item.fraction[1]}/></th><td><button type="button" data-p051-target={item.id} disabled={!enabled||solved} aria-label={solved?`${text.matched}: ${fraction} = ${item.decimal}`:`${text.choose} ${fraction}`} onClick={()=>submit(selection,item.id)}>{solved?item.decimal:<span aria-hidden="true">□</span>}</button></td></tr>;
    })}
   </tbody></table>
   <div className="p051-choices" role="group" aria-label={text.decimals} aria-describedby={`${id}-instruction ${id}-keyboard`}>
    {P051_ITEMS.map(item=>state.solved.includes(item.id)?null:<button type="button" key={item.id} data-p051-item={item.id} disabled={!enabled} aria-pressed={selected?.id===item.id}
     onClick={event=>{const suppress=suppressedPointerClick.current&&event.detail>0;suppressedPointerClick.current=false;if(!suppress)setSelection(selection===item.id?null:item.id);}}
     onPointerDown={event=>{if(!enabled||event.button!==0)return;suppressedPointerClick.current=false;drag.current={item:item.id,pointer:event.pointerId,x:event.clientX,y:event.clientY,moved:false};event.currentTarget.setPointerCapture(event.pointerId);}}
     onPointerMove={event=>{const current=drag.current;if(!current||current.pointer!==event.pointerId)return;if(Math.hypot(event.clientX-current.x,event.clientY-current.y)>6)current.moved=true;if(current.moved)setGhost({item:current.item,x:event.clientX,y:event.clientY});}}
     onPointerUp={event=>{const current=drag.current;if(!current||current.pointer!==event.pointerId)return;drag.current=null;setGhost(null);if(!current.moved)return;suppressedPointerClick.current=true;const target=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLButtonElement>('[data-p051-target]');submit(current.item,target&&root.current?.contains(target)&&!target.disabled?Number(target.dataset.p051Target):null);}}
     onPointerCancel={cancel} onLostPointerCapture={()=>{drag.current=null;setGhost(null);}}>{item.decimal}</button>)}
   </div>
  </div>
  <p role="status">{selected?`${text.selected}: ${selected.decimal}`:state.phase==='correct-feedback'||state.phase==='completion-feedback'?text.correct:''}</p>
  {ghost&&<span className="p051-drag-ghost" aria-hidden="true" style={{left:ghost.x,top:ghost.y}}>{P051_ITEMS.find(item=>item.id===ghost.item)?.decimal}</span>}
  <dialog ref={wrong} className="p051-wrong" open={wrongOpen&&!interactive} aria-labelledby={`${id}-wrong-title`} onCancel={event=>{event.preventDefault();if(interactive)onEvent({type:'close-wrong'});}}>
   <h3 id={`${id}-wrong-title`} tabIndex={-1}>{text.wrong}</h3><p>{text.coach}</p><ol>{text.steps.map(step=><li key={step}>{step}</li>)}</ol>
   {wrongGlossary}<button type="button" disabled={!interactive} onClick={()=>onEvent({type:'close-wrong'})}>{text.close}</button>
  </dialog>
 </section>;
}
