import {useLayoutEffect,useRef,type RefObject} from 'react';
export interface InkRect {readonly left:number;readonly right:number;readonly top:number;readonly bottom:number}
export type InkAdmission='full'|'partial'|'outside';
/** All fragments of a token must fit. A1px guard keeps ink clear of a clipping edge. */
export function temperatureInkAdmission(rects:readonly InkRect[],clip:InkRect):InkAdmission {
 if(!rects.length||clip.right<=clip.left||clip.bottom<=clip.top||rects.every(r=>r.right<=clip.left||r.left>=clip.right||r.bottom<=clip.top||r.top>=clip.bottom))return'outside';
 return rects.every(r=>r.left>=clip.left+1&&r.right<=clip.right-1&&r.top>=clip.top+1&&r.bottom<=clip.bottom-1)?'full':'partial';
}
/** Local scrollport + browser viewport intersection; rounded corners use a conservative inset. */
export function temperatureViewportClip(host:HTMLDivElement):InkRect {
 const box=host.getBoundingClientRect(),sx=host.offsetWidth?box.width/host.offsetWidth:1,sy=host.offsetHeight?box.height/host.offsetHeight:1;
 const style=getComputedStyle(host),radius=Math.max(...[style.borderTopLeftRadius,style.borderTopRightRadius,style.borderBottomLeftRadius,style.borderBottomRightRadius].map(v=>parseFloat(v)||0));
 const left=box.left+host.clientLeft*sx,top=box.top+host.clientTop*sy;
 return{left:Math.max(0,left+radius*sx),right:Math.min(window.innerWidth,left+host.clientWidth*sx-radius*sx),top:Math.max(0,top+radius*sy),bottom:Math.min(window.innerHeight,top+host.clientHeight*sy-radius*sy)};
}
/** Viewport visibility is visual only: AX retains all source-admitted labels.
 * Source admission/clip remains caller-owned, and no label is removed/rekeyed by this hook. */
export function useWholeTemperatureInk(viewport:RefObject<HTMLDivElement|null>,enabled:boolean){
 const refresh=useRef<(()=>void)|null>(null);
 useLayoutEffect(()=>{
  const host=viewport.current;if(!host||!enabled)return;
  let active=true;const observed=new Set<HTMLElement>();let resize:ResizeObserver|null=null;
  const apply=()=>{
   if(!active)return;
   const clip=temperatureViewportClip(host),labels=[...host.querySelectorAll<HTMLElement>('[data-in009-temperature-tick]')];
   // Batch all reads before opacity/admission writes; opacity never changes token geometry.
   const rows=labels.map(node=>{const range=document.createRange();range.selectNodeContents(node);const rects=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom}));range.detach();return{node,admission:temperatureInkAdmission(rects,clip)};});
   const current=new Set(labels);for(const node of observed)if(!current.has(node)){resize?.unobserve(node);observed.delete(node);}for(const node of labels)if(!observed.has(node)){resize?.observe(node);observed.add(node);}
   for(const row of rows)if(row.node.dataset.temperatureViewportInk!==row.admission)row.node.dataset.temperatureViewportInk=row.admission;
  };
  const ancestorScroll=(event:Event)=>{if(event.target!==host)apply();};
  refresh.current=apply;host.addEventListener('scroll',apply,{passive:true});window.addEventListener('scroll',ancestorScroll,{passive:true,capture:true});window.addEventListener('resize',apply,{passive:true});
  resize=typeof ResizeObserver==='undefined'?null:new ResizeObserver(apply);resize?.observe(host);const extent=host.querySelector<HTMLElement>('.in009-native__thermometer-extent');if(extent)resize?.observe(extent);
  const fonts=document.fonts;fonts?.addEventListener('loading',apply);fonts?.addEventListener('loadingdone',apply);fonts?.addEventListener('loadingerror',apply);// Initial layout effect already reads loaded or fallback fonts; events cover later changes.
  return()=>{active=false;refresh.current=null;host.removeEventListener('scroll',apply);window.removeEventListener('scroll',ancestorScroll,true);window.removeEventListener('resize',apply);resize?.disconnect();observed.clear();fonts?.removeEventListener('loading',apply);fonts?.removeEventListener('loadingdone',apply);fonts?.removeEventListener('loadingerror',apply);};
 },[viewport,enabled]);
 // Initial source commit, changed label set, font size or dataset is re-read before paint.
 useLayoutEffect(()=>{refresh.current?.();});
}
