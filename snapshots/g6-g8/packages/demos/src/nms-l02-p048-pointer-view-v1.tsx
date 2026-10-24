import React from 'react';
import {p048Pointer} from './nms-l02-p048-pointer-v1';
export function P048PointerView({frame,position,reducedMotion,root}:{frame:number;position:number;reducedMotion:boolean;root:React.RefObject<HTMLElement|null>}){
 const [layout,setLayout]=React.useState<{width:number;track:{left:number;top:number;width:number};grid:{right:number;bottom:number};check:{left:number;bottom:number;width:number}}|null>(null);
 React.useEffect(()=>{
  const element=root.current;if(!element)return;
  const measure=()=>{const base=element.getBoundingClientRect(),track=element.querySelector('.p048-demo-track')?.getBoundingClientRect(),grid=element.querySelector('.p048-grid')?.getBoundingClientRect(),check=element.querySelector('[data-p048-check]')?.getBoundingClientRect();if(!track||!grid||!check)return;setLayout({width:base.width,track:{left:track.left-base.left,top:track.top-base.top,width:track.width},grid:{right:grid.right-base.left,bottom:grid.bottom-base.top},check:{left:check.left-base.left,bottom:check.bottom-base.top,width:check.width}});};
  measure();const observer=new ResizeObserver(measure);observer.observe(element);for(const child of element.querySelectorAll('.p048-grid,.p048-demo-track,[data-p048-check]'))observer.observe(child);return ()=>observer.disconnect();
 },[root]);
 if(!layout)return null;
 const trackPoint=(percent:number)=>({x:layout.track.left+layout.track.width*percent/100,y:layout.track.top+34});
 const check={x:layout.check.left+layout.check.width*.65,y:layout.check.bottom+8};
 const p=p048Pointer(frame,{slider:trackPoint(position),sliderEnd:trackPoint(75),grid:{x:Math.min(layout.width-14,layout.grid.right+8),y:layout.grid.bottom+6},check,exit:{x:layout.width-14,y:check.y+24}},reducedMotion);
 return p?<svg className="p048-pointer" aria-hidden="true" viewBox="0 0 24 30" style={{left:Math.max(12,Math.min(layout.width-12,p.x)),top:p.y,opacity:p.alpha}}><path d="M12 1 2 22 9 18 9 29 15 29 15 18 22 22Z" fill="white" stroke="#111827" strokeWidth="2"/></svg>:null;
}
