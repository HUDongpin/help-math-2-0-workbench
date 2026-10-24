import React from 'react';
import {p050Intro} from './nms-l02-p050-intro-v1';
import {P050NumberLine} from './nms-l02-p050-practice-view-v1';
import {P050_TEXT, type P050Language} from './nms-l02-p050-text-v1';
/** Source timing/alpha and demo path, mapped to a readable semantic layout.
 * Source twips map to native tenths (382 twips each); this is not pixel parity.
 * Character 40 is a sibling of the axis, so its alpha is not multiplied by axis alpha.
 */
const HELD_X = 1787, HELD_Y = -672, TRAVEL_X = 6554, TRAVEL_Y = 2755;
const percent = (matrixX: number) => 8 + 2.7 * (21 + (matrixX - HELD_X) / 382);
export function P050IntroView({frame,language='en',reducedMotion=false}:{frame:number;language?:P050Language;reducedMotion?:boolean}) {
 const root=React.useRef<HTMLElement>(null);
 const source=p050Intro(frame),text=P050_TEXT[language];
 const object=(id:number)=>source.objects.find(item=>item.characterId===id);
 const alpha=(id:number)=>object(id)?.alpha??0;
 const shown=(id:number)=>alpha(id)>0;
 const demo=object(40),pointer=object(64),axis=object(56)??object(46);
 const axisAlpha=axis?.alpha??0;
 const moving=frame>=120&&frame<127;
 const placed=frame>=127;
 const demoMatrixX=demo?(reducedMotion&&moving?HELD_X-TRAVEL_X:demo.matrix[4]):HELD_X;
 const demoMatrixY=demo?(reducedMotion&&moving?HELD_Y+TRAVEL_Y:demo.matrix[5]):HELD_Y;
 const demoX=percent(demoMatrixX);
 const demoY=.5+9*Math.max(0,Math.min(1,(demoMatrixY-HELD_Y)/TRAVEL_Y));
 const red=source.objects.some(item=>item.characterId>=57&&item.characterId<=62&&item.alpha>0);
 React.useEffect(()=>{
  const container=root.current?.querySelector<HTMLElement>('.p050-line-scroll');
  const marker=root.current?.querySelector<HTMLElement>('[data-p050-demo]');
  if(!container||!marker||!demo?.alpha)return;
  const reveal=()=>{
   const viewport=container.getBoundingClientRect(),target=marker.getBoundingClientRect();
   if(target.left<viewport.left+24||target.right>viewport.right-24)
    container.scrollLeft+=target.left+target.width/2-viewport.left-viewport.width/2;
  };
  let pending:number|null=null;
  const schedule=()=>{if(pending!==null)cancelAnimationFrame(pending);pending=requestAnimationFrame(()=>{pending=null;reveal();});};
  reveal();schedule();const observer=new ResizeObserver(schedule);observer.observe(container);observer.observe(marker);
  const line=container.querySelector<HTMLElement>('.p050-line');if(line)observer.observe(line);
  window.addEventListener('resize',schedule);
  return()=>{observer.disconnect();window.removeEventListener('resize',schedule);if(pending!==null)cancelAnimationFrame(pending);};
 },[demoX,demo?.alpha]);
 return <section ref={root} className="p050-practice p050-intro" lang={language} data-p050-intro-frame={frame} data-p050-reduced-motion={reducedMotion?'true':'false'}>
  <h2 style={{opacity:alpha(50)}} aria-hidden={!shown(50)}>{text.question}</h2>
  <p style={{opacity:alpha(48)}} aria-hidden={!shown(48)}>{text.instruction}</p>
  <p style={{opacity:alpha(54)}} aria-hidden={!shown(54)}>{text.helpInstruction}</p>
  <div className="p050-intro-stage">
   <P050NumberLine language={language} tickColor={red?'#c02920':'currentColor'} axisOpacity={axisAlpha} focusable={axisAlpha>0}>
    {demo&&<span className="p050-demo-value" data-p050-demo="2.1" data-p050-demo-placed={placed?'true':'false'} style={{left:`${demoX}%`,top:`${demoY}rem`,opacity:demo.alpha}} aria-hidden={demo.alpha===0}>2.1</span>}
    {pointer&&pointer.alpha>0&&!reducedMotion&&<span aria-hidden="true" className="p050-demo-pointer" style={{left:`${percent(pointer.matrix[4]-168)}%`,top:`${1.8+9*Math.max(0,Math.min(1,(pointer.matrix[5]+534)/TRAVEL_Y))}rem`,opacity:pointer.alpha}}>↑</span>}
   </P050NumberLine>
  </div>
  <div className="p050-items p050-demo-items" aria-label={language==='es'?'Decimales de la demostración':'Demonstration decimals'}>
   {[41,42,43,44,45].map(id=><span key={id} style={{opacity:alpha(id)}} aria-hidden={!shown(id)}>{object(id)?.text??''}</span>)}
  </div>
 </section>;
}
