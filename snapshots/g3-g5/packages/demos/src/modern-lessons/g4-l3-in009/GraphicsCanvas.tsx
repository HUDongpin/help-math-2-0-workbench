import React,{useLayoutEffect,useMemo,useRef} from 'react';
import {createPainter,type Geometry,type Bitmap,type MapBitmapProvider,type PaintStats} from './painter';
import type {Matrix,SceneNode} from './scene';
export function GraphicsCanvas({geometry,bitmaps,mapProvider,scene,width=800,height=600,dpr=1,onPaint}: {
 geometry:Geometry;bitmaps:ReadonlyMap<number,Bitmap>;mapProvider:MapBitmapProvider;
 scene:{frame:number;nodes:readonly SceneNode[]};width?:number;height?:number;dpr?:number;onPaint?:(stats:PaintStats)=>void;
}){
 const canvas=useRef<HTMLCanvasElement>(null);const painter=useMemo(()=>createPainter(geometry,bitmaps,mapProvider),[geometry,bitmaps,mapProvider]);
 useLayoutEffect(()=>()=>painter.dispose(),[painter]);
 useLayoutEffect(()=>{const c=canvas.current!;c.dataset.paintStatus='pending';if(!(width>0&&height>0&&dpr>0&&Number.isFinite(width+height+dpr)))throw Error('Invalid graphics viewport');const pixelWidth=Math.ceil(width*dpr),pixelHeight=Math.ceil(height*dpr);if(c.width!==pixelWidth)c.width=pixelWidth;if(c.height!==pixelHeight)c.height=pixelHeight;const context=c.getContext('2d');if(!context)throw Error('Canvas2D unavailable');
  const view:Matrix=[width*dpr/16000,0,0,height*dpr/12000,0,0];const result=painter.draw(context,scene,view);c.dataset.paintStatus='drawn';c.dataset.sourceFrame=String(scene.frame);onPaint?.(result);
 },[painter,scene,width,height,dpr,onPaint]);
 return <canvas ref={canvas} style={{display:'block',width,height,maxWidth:'100%'}} aria-hidden="true" data-source-graphics="in009" data-paint-status="pending"/>;
}
