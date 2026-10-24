import React from 'react';
import {p049Intro} from './nms-l02-p049-intro-v1';
import {P049DecimalGrid} from './nms-l02-p049-grid-v1';
import './nms-l02-p049-view-v1.css';
/** Responsive semantic presentation of the source intro. Pointer anchors follow native controls;
 * source timing and opacity are retained, not legacy hit pixels or original-runtime parity.
 */
export function P049IntroView({frame,language='en',reducedMotion=false}:{frame:number;language?:'en'|'es';reducedMotion?:boolean}){
 const s=p049Intro(frame),es=language==='es',root=React.useRef<HTMLElement>(null),first=React.useRef<HTMLInputElement>(null),second=React.useRef<HTMLInputElement>(null),check=React.useRef<HTMLButtonElement>(null);
 const [point,setPoint]=React.useState<{x:number;y:number}|null>(null);
 const alpha=(id:number)=>s.objects.find(o=>o.characterId===id)?.alpha??0;
 const board=s.objects.find(o=>o.depth===6),pointer=s.objects.find(o=>o.characterId===58);
 React.useEffect(()=>{
  const container=root.current,a=first.current,b=second.current,c=check.current;if(!container||!a||!b||!c)return;
  if(reducedMotion||!pointer?.alpha){setPoint(null);return;}
  const update=()=>{
   const base=container.getBoundingClientRect();
   const anchor=(e:HTMLElement)=>{const r=e.getBoundingClientRect();return {x:r.left-base.left+r.width/2,y:r.bottom-base.top+8};};
   const A=anchor(a),B=anchor(b),C=anchor(c),lerp=(from:typeof A,to:typeof A,t:number)=>({x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t});
   let p=frame<=163?lerp({x:A.x,y:A.y+40},A,Math.min(1,(frame-147)/5)):frame<=173?lerp(A,B,Math.min(1,(frame-166)/6)):frame<=185?lerp(B,C,Math.min(1,(frame-175)/7)):lerp(C,{x:24,y:C.y+40},Math.min(1,(frame-185)/10));
   p={x:Math.max(12,Math.min(base.width-12,p.x)),y:p.y};setPoint(p);
  };
  update();const observer=new ResizeObserver(update);for(const e of [container,a,b,c])observer.observe(e);return()=>observer.disconnect();
 },[frame,pointer?.alpha,reducedMotion]);
 const names=es?['Décimas','Centésimas']:['Tenths','Hundredths'];
 return <section ref={root} className="p049-input p049-intro" lang={language} data-p049-intro-frame={frame}>
  <h2 aria-hidden={!alpha(28)} style={{opacity:alpha(28)}}>{es?'Pregunta 7':'Question 7'}</h2>
  <p aria-hidden={!alpha(25)} style={{opacity:alpha(25)}}>{es?'Nombra el decimal que se muestra. Haz clic en cada casilla y escribe el valor correcto. Después, haz clic en Comprobar respuesta.':'Name the decimal shown. Click each box and type the correct value. Then click Check Answer.'}</p>
  <div aria-hidden={!board?.alpha} style={{opacity:board?.alpha??0}}>
   <div className="p049-bar-wrap"><P049DecimalGrid parts={s.redTenths??0} total={10} language={language}/>
    {s.countLabel!==null&&<span className="p049-bar-count" style={{top:`${(s.countLabel-.5)*10}%`}}>{s.countLabel}</span>}
   </div>
   <div className="p049-entry p049-demo-entry" role="group" aria-label={es?'Demostración de respuesta decimal':'Decimal answer demonstration'}>
    <span className="p049-fixed-digit">0</span><span className="p049-fixed-digit">.</span>
    {names.map((name,i)=><label key={name}><span>{name}</span><input ref={i===0?first:second} type="text" disabled readOnly value={s.digits[i]??''} data-p049-demo-digit={i} className={alpha(i===0?59:60)?'p049-demo-caret':''}/></label>)}
   </div>
  </div>
  <button ref={check} type="button" disabled data-p049-demo-check={frame>=183&&frame<=184?'pressed':'idle'} aria-hidden={!s.objects.some(o=>[31,34].includes(o.characterId))} style={{opacity:s.objects.some(o=>[31,34].includes(o.characterId))?1:0}}>{es?'Comprobar respuesta':'Check Answer'}</button>
  {point&&!reducedMotion&&<svg className="p049-demo-pointer" aria-hidden="true" width="24" height="30" viewBox="0 0 24 30" style={{left:point.x,top:point.y,opacity:pointer?.alpha}}><path d="M12 0 23 15H16V29H8V15H1Z" fill="#111827" stroke="white" strokeWidth="1.5"/></svg>}
 </section>;
}
