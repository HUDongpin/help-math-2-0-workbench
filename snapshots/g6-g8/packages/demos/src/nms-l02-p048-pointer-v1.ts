import {p048Intro} from './nms-l02-p048-intro-v1';
export interface P048Point{x:number;y:number;}
export interface P048PointerAnchors{slider:P048Point;sliderEnd:P048Point;grid:P048Point;check:P048Point;exit:P048Point;}
function source(frame:number){const o=p048Intro(Math.min(frame,329)).objects.find(o=>o.characterId===180);return o?{x:o.matrix[4],y:o.matrix[5],alpha:o.alpha}:null;}
function progress(frame:number,start:number,end:number){const p=source(frame)!,a=source(start)!,b=source(end)!;const dx=b.x-a.x,dy=b.y-a.y;return Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));}
function mix(a:P048Point,b:P048Point,t:number):P048Point{return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
/** Semantic responsive mapping, not Flash coordinates: retains source motion progress
 * and alpha while adapting destination points to the actual native layout. */
export function p048Pointer(frame:number,anchors:P048PointerAnchors,reducedMotion=false){
 const p=source(frame);if(!p||reducedMotion||p.alpha===0)return null;
 let point:P048Point;
 if(frame<=83)point=mix({x:anchors.slider.x-16,y:anchors.slider.y-24},anchors.slider,progress(frame,75,83));
 else if(frame<=158)point=anchors.slider;
 else if(frame<165)point=mix(anchors.sliderEnd,anchors.grid,progress(frame,158,165));
 else if(frame<=288)point=anchors.grid;
 else if(frame<299)point=mix(anchors.grid,anchors.check,progress(frame,288,299));
 else if(frame<=309)point=anchors.check;
 else point=mix(anchors.check,anchors.exit,progress(frame,309,319));
 return {...point,alpha:p.alpha};
}
