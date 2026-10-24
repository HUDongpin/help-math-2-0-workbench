import React,{useLayoutEffect,useMemo,useRef} from 'react';
import {createPainter,type Geometry,type Bitmap,type MapBitmapProvider,type PaintStats} from './painter';
import type {Matrix,SceneNode} from './scene';
export function GraphicsCanvas({geometry,bitmaps,mapProvider,scene,width=800,height=600,dpr=1,onPaint,fitParent=false}: {
 geometry:Geometry;bitmaps:ReadonlyMap<number,Bitmap>;mapProvider?:MapBitmapProvider;
 scene:{frame:number;nodes:readonly SceneNode[]};width?:number;height?:number;dpr?:number;onPaint?:(stats:PaintStats)=>void;
 /** The caller provides a definite-size plane; CSS tracks it without stale pixel dimensions. */
 fitParent?:boolean;
}){
 const canvas=useRef<HTMLCanvasElement>(null),draw=useRef<(()=>void)|null>(null);
 const painter=useMemo(()=>createPainter(geometry,bitmaps,mapProvider),[geometry,bitmaps,mapProvider]);
 useLayoutEffect(()=>()=>painter.dispose(),[painter]);
 useLayoutEffect(()=>{
  const c=canvas.current!;
  const render=()=>{
   c.dataset.paintStatus='pending';
   if(!(width>0&&height>0&&dpr>0&&Number.isFinite(width+height+dpr)))throw Error('Invalid graphics viewport');
   const box=fitParent?c.getBoundingClientRect():{width,height};
   // A temporarily hidden plane is not a usable drawing viewport.
   if(!(box.width>0&&box.height>0))return;
   const pixelWidth=Math.ceil(box.width*dpr),pixelHeight=Math.ceil(box.height*dpr);
   if(c.width!==pixelWidth)c.width=pixelWidth;if(c.height!==pixelHeight)c.height=pixelHeight;
   const context=c.getContext('2d');if(!context)throw Error('Canvas2D unavailable');
   const view:Matrix=[box.width*dpr/16000,0,0,box.height*dpr/12000,0,0];
   const result=painter.draw(context,scene,view);
   c.dataset.paintWidth=String(box.width);c.dataset.paintHeight=String(box.height);
   c.dataset.paintStatus='drawn';c.dataset.sourceFrame=String(scene.frame);onPaint?.(result);
  };
  draw.current=render;render();
  return()=>{if(draw.current===render)draw.current=null;};
 },[painter,scene,width,height,dpr,onPaint,fitParent]);
 useLayoutEffect(()=>{
  if(!fitParent||typeof ResizeObserver==='undefined')return;
  const c=canvas.current!;let active=true;
  const observer=new ResizeObserver(()=>{
   if(!active)return;
   const box=c.getBoundingClientRect();
   if(c.dataset.paintStatus!=='drawn'||Number(c.dataset.paintWidth)!==box.width||Number(c.dataset.paintHeight)!==box.height)draw.current?.();
  });
  observer.observe(c);
  return()=>{active=false;observer.disconnect();};
 },[fitParent]);
 return <canvas ref={canvas} style={{display:'block',width:fitParent?'100%':width,height:fitParent?'100%':height,maxWidth:'100%'}} aria-hidden="true" data-source-graphics="in010" data-paint-status="pending"/>;
}
