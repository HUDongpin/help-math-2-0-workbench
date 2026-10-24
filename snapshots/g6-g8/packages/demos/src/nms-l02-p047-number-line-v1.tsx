import * as React from 'react';
import {P047_CARDS,p047CanInteract,type P047Practice,type P047CardId} from './nms-l02-p047-practice-v1';
export interface P047LineBounds {left:number;top:number;width:number;height:number;}
/** Native hit area uses equal ninth-width columns, with ticks at their centers.
 * This touch/pointer adapter does not assert source Flash pixel hit-test parity.
 */
export function p047PointerTick(x:number,y:number,b:P047LineBounds):number|null {
 if(![x,y,b.left,b.top,b.width,b.height].every(Number.isFinite)||b.width<=0||b.height<=0)return null;
 if(x<b.left||x>b.left+b.width||y<b.top||y>b.top+b.height)return null;
 return Math.min(8,Math.floor((x-b.left)/b.width*9));
}
export function P047Fraction({numerator,denominator}:{numerator:number;denominator:number}){
 return <span className="p047-fraction" aria-label={`${numerator}/${denominator}`}><span aria-hidden="true">{numerator}</span><span aria-hidden="true">{denominator}</span></span>;
}
export interface P047NumberLineProps {state:P047Practice;language?:'en'|'es';interactive?:boolean;onSelect:(id:P047CardId)=>void;onDrop:(tick:number|null)=>void;onCancel:()=>void;}
export function P047NumberLine({state,language='en',interactive=true,onSelect,onDrop,onCancel}:P047NumberLineProps){
 const enabled=interactive&&p047CanInteract(state),es=language==='es',line=React.useRef<HTMLDivElement>(null),id=React.useId();
 const drag=React.useRef<{pointer:number;x:number;y:number;moved:boolean}|null>(null),suppressClick=React.useRef(false);
 const [point,setPoint]=React.useState<{x:number;y:number}|null>(null);
 const selected=P047_CARDS.find(c=>c.id===state.selected);
 const placedDescription=[...(es?['Marca F: 3/4']:['Mark F: 3/4']),...P047_CARDS.filter(c=>state.matched.includes(c.id)).map(c=>`${es?'Marca':'Mark'} ${String.fromCharCode(64+c.tick)}: ${c.numerator}/${c.denominator}`)].join('. ');
 React.useEffect(()=>{if(!enabled){drag.current=null;setPoint(null);}},[enabled,state.replay]);
 const release=(event:React.PointerEvent<HTMLButtonElement>)=>{
  const current=drag.current;if(!current||current.pointer!==event.pointerId)return;
  drag.current=null;setPoint(null);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  if(!current.moved)return;suppressClick.current=true;
  if(enabled){const rect=line.current?.getBoundingClientRect();onDrop(rect?p047PointerTick(event.clientX,event.clientY,rect):null);}
 };
 return <section className="p047-number-line" aria-label={es?'Fracciones en la recta numérica':'Fractions on the number line'} onKeyDown={e=>{if(e.key==='Escape'&&enabled){drag.current=null;setPoint(null);onCancel();}}}>
  <p id={id+'-hint'}>{es?'Arrastra una fracción a la recta. También puedes seleccionar una fracción y después una marca.':'Drag a fraction to the line. You can also select a fraction and then a mark.'}</p>
  <div ref={line} className="p047-line-grid" role="img" aria-label={(es?'De 0 a 1, dividido en ocho partes iguales. Marcas A a G de izquierda a derecha. ':'From 0 to 1, divided into eight equal parts. Marks A through G from left to right. ')+placedDescription}>
   {Array.from({length:9},(_,tick)=>{const card=P047_CARDS.find(c=>c.tick===tick&&state.matched.includes(c.id));return <div key={tick} className="p047-line-mark" data-p047-tick={tick}>
    <div className="p047-line-value">{tick===6?<P047Fraction numerator={3} denominator={4}/>:card?<P047Fraction numerator={card.numerator} denominator={card.denominator}/>:null}</div>
    <span className="p047-tick"/><span>{tick===0?'0':tick===8?'1':String.fromCharCode(64+tick)}</span>
   </div>;})}
  </div>
  <div className="p047-cards" aria-describedby={id+'-hint'}>
   {P047_CARDS.map(card=><button type="button" key={card.id} hidden={state.matched.includes(card.id)} disabled={!enabled} aria-pressed={state.selected===card.id} aria-label={`${es?'Seleccionar':'Select'} ${card.numerator}/${card.denominator}`} data-p047-card={card.id}
    onPointerDown={e=>{if(!enabled||e.button!==0||!e.isPrimary)return;suppressClick.current=false;drag.current={pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false};e.currentTarget.setPointerCapture(e.pointerId);onSelect(card.id);}}
    onPointerMove={e=>{const d=drag.current;if(!d||d.pointer!==e.pointerId)return;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>6)d.moved=true;if(d.moved)setPoint({x:e.clientX,y:e.clientY});}}
    onPointerUp={release} onPointerCancel={e=>{if(drag.current?.pointer!==e.pointerId)return;drag.current=null;setPoint(null);onCancel();}}
    onClick={()=>{if(suppressClick.current){suppressClick.current=false;return;}if(enabled)onSelect(card.id);}}><P047Fraction numerator={card.numerator} denominator={card.denominator}/></button>)}
  </div>
  <div className="p047-targets" role="group" aria-label={es?'Colocar en una marca':'Place at a mark'}>
   {Array.from({length:7},(_,index)=>index+1).map(tick=><button type="button" key={tick} disabled={!enabled||state.selected===null} data-p047-target={tick} onClick={()=>onDrop(tick)}>{es?'Marca':'Mark'} {String.fromCharCode(64+tick)}</button>)}
   <button type="button" disabled={!enabled||state.selected===null} onClick={onCancel}>{es?'Cancelar selección':'Cancel selection'}</button>
  </div>
  <p role="status">{selected?(es?`Seleccionado: ${selected.numerator}/${selected.denominator}`:`Selected: ${selected.numerator}/${selected.denominator}`):es?`${state.matched.length} de 4 colocadas`:`${state.matched.length} of 4 placed`}</p>
  {point&&selected&&<div aria-hidden="true" className="p047-drag-preview" style={{left:point.x,top:point.y}}><P047Fraction numerator={selected.numerator} denominator={selected.denominator}/></div>}
 </section>;
}
