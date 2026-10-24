'use client';
import React, {useEffect, useState, type RefObject} from 'react';
import {POINTER_OUTLINE} from './pointer-shape';
export interface Point {readonly x: number; readonly y: number}
export type Triangle = readonly [Point, Point, Point];
export const SOURCE_ANCHORS: Triangle = [{x:396,y:216.5},{x:-2738,y:2414},{x:2462,y:2414}];
const area = ([a,b,c]: Triangle) => (b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
/** Source coordinates are twips. Result is measured CSS pixels, never stage-scaled text. */
export function mapIn008Pointer(point: Point, targets: Triangle): Point | null {
 if (![...SOURCE_ANCHORS,...targets,point].every(p => Number.isFinite(p.x)&&Number.isFinite(p.y)) || Math.abs(area(targets)) < 1) return null;
 const [a,b,c] = SOURCE_ANCHORS;
 const denominator = area(SOURCE_ANCHORS);
 const first=((b.y-c.y)*(point.x-c.x)+(c.x-b.x)*(point.y-c.y))/denominator;
 const second=((c.y-a.y)*(point.x-c.x)+(a.x-c.x)*(point.y-c.y))/denominator;
 const third=1-first-second;
 return {x:first*targets[0].x+second*targets[1].x+third*targets[2].x,y:first*targets[0].y+second*targets[1].y+third*targets[2].y};
}
export function In008NativePointer({surface, pointer}: {readonly surface:RefObject<HTMLElement|null>;readonly pointer:null | (Point & {readonly alpha:number})}) {
 const [targets,setTargets]=useState<Triangle|null>(null);
 useEffect(() => {
  const node=surface.current;
  if (!node) return;
  let disposed=false;
  const measure=()=>{
   if(disposed) return;
   const origin=node.getBoundingClientRect();
   const scale = origin.width / node.offsetWidth;
   const controls=['first','check','new'].map(name=>node.querySelector<HTMLElement>(`[data-in008-anchor="${name}"]`));
   if(controls.some(control=>!control)) {setTargets(null);return;}
   const points=controls.map(control=>{const box=control!.getBoundingClientRect();return{x:(box.left+box.width/2-origin.left)/scale,y:(box.top+box.height/2-origin.top)/scale};}) as unknown as Triangle;
   setTargets(Math.abs(area(points))<1 ? null : points);
  };
  measure();
  const observer=new ResizeObserver(measure);
  observer.observe(node);
  node.querySelectorAll<HTMLElement>('[data-in008-anchor]').forEach(control=>observer.observe(control));
  document.fonts?.addEventListener('loadingdone',measure);
  void document.fonts?.ready.then(measure);
  window.addEventListener('resize',measure);
  return ()=>{disposed=true;observer.disconnect();document.fonts?.removeEventListener('loadingdone',measure);window.removeEventListener('resize',measure);};
 },[surface]);
 if(!pointer) return null;
 const position=targets && mapIn008Pointer({x:pointer.x-151,y:pointer.y-201},targets);
 if(!position) return <span hidden data-in008-pointer-status="blocked-degenerate-or-unmeasured-anchors"/>;
 return <svg aria-hidden="true" className="in008-native-pointer" viewBox="-151 -201 240 406" width="24" height="40.6" data-in008-pointer-status="source-affine-modern-layout" style={{left:position.x,top:position.y,opacity:pointer.alpha}}><path d={POINTER_OUTLINE} fill="#122f4a"/></svg>;
}
