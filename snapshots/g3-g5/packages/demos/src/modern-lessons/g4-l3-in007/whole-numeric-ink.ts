import {useLayoutEffect,useRef,type RefObject} from 'react';
type Fragment=Readonly<{left:number;right:number}>;
/** One CSS pixel keeps signed ink away from the local clipping boundary. */
export function numericInkAdmission(rects:readonly Fragment[],left:number,right:number):'full'|'partial'|'outside'{
 if(!rects.length||rects.every(r=>r.right<=left||r.left>=right))return 'outside';
 return rects.every(r=>r.left>=left+1&&r.right<=right-1)?'full':'partial';
}
/** Visual-only admission. Original text/ARIA/layout/source state and manual pan survive. */
export function useWholeNumericInk(viewport:RefObject<HTMLDivElement|null>,enabled:boolean){
 const refresh=useRef<(()=>void)|null>(null);
 useLayoutEffect(()=>{
  const host=viewport.current;if(!host||!enabled)return;
  let active=true;const observed=new Set<HTMLElement>();let observer:ResizeObserver|null=null;
  const apply=()=>{
   if(!active)return;const labels=Array.from(host.querySelectorAll<HTMLElement>('[data-number-label],[data-lesson-text-block="moving-minus-three"]'));const clip=host.getBoundingClientRect(),left=clip.left+host.clientLeft,right=left+host.clientWidth;
   // Finish every geometry read before any style-affecting admission write.
   const rows=labels.map(node=>{const range=document.createRange();range.selectNodeContents(node);const rects=Array.from(range.getClientRects()).filter(r=>r.width>0&&r.height>0).map(r=>({left:r.left,right:r.right}));range.detach();return{node,admission:numericInkAdmission(rects,left,right)};});
   const current=new Set(labels);for(const node of observed)if(!current.has(node)){observer?.unobserve(node);observed.delete(node);}for(const node of labels)if(!observed.has(node)){observer?.observe(node);observed.add(node);}
   for(const {node,admission}of rows)if(node.dataset.numericInk!==admission)node.dataset.numericInk=admission;
  };
  refresh.current=apply;host.addEventListener('scroll',apply,{passive:true});
  observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(apply);observer?.observe(host);const diagram=host.querySelector('.in007-modern__diagram');if(diagram)observer?.observe(diagram);
  document.fonts?.addEventListener('loadingdone',apply);void document.fonts?.ready.then(()=>{if(active)apply();});
  return()=>{active=false;refresh.current=null;host.removeEventListener('scroll',apply);observer?.disconnect();document.fonts?.removeEventListener('loadingdone',apply);};
 },[viewport,enabled]);
 // Initial mount and each source-render commit are checked before browser paint.
 useLayoutEffect(()=>{refresh.current?.();});
}
