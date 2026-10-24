import React,{useLayoutEffect,useRef} from 'react';
import {In006Teaching as FrozenTeaching} from './teaching-view';
import {teachingState} from './teaching-state';
/** Source shape arrow-tip coordinates, before their exact source placement matrix. */
const tips:Record<number,readonly[number,number]>={91:[1158,760],92:[714,760],93:[270,760],94:[-174,760],95:[-618,760],100:[1952,516],102:[109,421],116:[510,411]};
export function In006Teaching({frame}:{frame:number}){
 const root=useRef<HTMLDivElement>(null),state=teachingState(frame);
 const phase=JSON.stringify([state.prompt,state.arrows]);
 useLayoutEffect(()=>{
  const viewport=root.current?.querySelector<HTMLElement>('.in006-teaching__scroll');if(!viewport)return;
  let active=true;
  const position=()=>{
   if(!active||!viewport.clientWidth)return;
   const paths=[...viewport.querySelectorAll<SVGGraphicsElement>('[data-source-shape]')];
   const last=state.arrows.at(-1),tip=last?tips[last.id]:undefined;
   const tipX=last&&tip?last.matrix[0]*tip[0]+last.matrix[2]*tip[1]+last.matrix[4]:state.prompt?.startsWith('−1')?-606:1614;
   const nearest=state.axis.reduce((best,point)=>Math.abs(point.tickXTwips-tipX)<Math.abs(best.tickXTwips-tipX)?point:best,state.axis[0]!);
   const label=viewport.querySelector<HTMLElement>(`[data-number-label="${nearest.value}"]`);if(!label)return;
   const vr=viewport.getBoundingClientRect(),scale=vr.width/viewport.offsetWidth;
   const lr=label.getBoundingClientRect();let center=(lr.left-vr.left+lr.width/2)/scale+viewport.scrollLeft;
   const rects=paths.map(path=>path.getBoundingClientRect());
   if(rects.length){const left=Math.min(...rects.map(r=>r.left)),right=Math.max(...rects.map(r=>r.right));if((right-left)/scale+48<=viewport.clientWidth)center=((left+right)/2-vr.left)/scale+viewport.scrollLeft;}
   viewport.scrollLeft=Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,center-viewport.clientWidth/2));
   viewport.dataset.teachingAnchor=String(nearest.value);
  };
  position();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(position);observer?.observe(viewport);void document.fonts?.ready.then(position);
  return()=>{active=false;observer?.disconnect();};
 },[phase]);
 return <div ref={root} style={{minInlineSize:0,maxInlineSize:'100%'}}><p style={{font:'1.125rem/1.6 var(--lesson-font-body,"Nunito Sans",sans-serif)',margin:'0 1rem'}}>Scroll the number line sideways to see more numbers.</p><FrozenTeaching frame={frame}/></div>;
}
