import type {SceneNode,Matrix,Color} from './scene';
import {concatenate} from './scene';
const SOURCE='766b6ab686bbaf8ab1dacc30a7ffb96f33735102a1dff7df6b7a97976e3ab25c';
const IDENTITY:Matrix=[1,0,0,1,0,0];
type RGBA=readonly number[];
type Style={kind:'solid';rgba:RGBA}|{kind:'radial-gradient';matrix:Matrix;stops:readonly (readonly [number,RGBA])[];gradientSpaceRadius:number;spreadMethod:string}|{kind:'bitmap';bitmapId:number;matrix:Matrix;repeat:boolean};
type Paint={kind:'fill'|'stroke';style:Style|{widthTwips:number;rgba:RGBA;cap:CanvasLineCap;join:CanvasLineJoin;hairline:boolean};d:string;fillRule?:CanvasFillRule};
type Shape={characterId:number;epochs:readonly {epoch:number;paintIndices:readonly number[]}[];boundsTwips:{left:number;top:number;right:number;bottom:number}};
type Morph={characterId:number;startEdges:{paths:number[][][]};endEdges:{paths:number[][][]}};
export interface Geometry {sourceSha256:string;packingVersion:number;paintPool:readonly Paint[];shapes:readonly Shape[];morphs:readonly Morph[];bitmapIds:readonly number[];}
export interface AssetSpec {id:number;url:string;sha256:string;width:number;height:number;}
const verified=Symbol('verified-IN009-bitmap');
export type Bitmap={spec:AssetSpec;image:CanvasImageSource;[verified]:true};
export interface AssetLoaders {fetch:typeof fetch;decode:(blob:Blob)=>Promise<ImageBitmap>;digest:(bytes:ArrayBuffer)=>Promise<string>;}
export async function loadBitmaps(specs:readonly AssetSpec[],signal?:AbortSignal,custom?:AssetLoaders):Promise<ReadonlyMap<number,Bitmap>> {
 const loaders=custom??{fetch:(input,init)=>globalThis.fetch(input,init),decode:(b:Blob)=>globalThis.createImageBitmap(b,{colorSpaceConversion:'none'}),digest:async(b:ArrayBuffer)=>Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('')};
 const ids=new Set<number>();const result=new Map<number,Bitmap>();
 try {for(const spec of specs){
  demand(Number.isSafeInteger(spec.id)&&!ids.has(spec.id),'Duplicate/invalid bitmap ID');ids.add(spec.id);
  demand(/^\/(?!\/)/.test(spec.url)&&!/[\r\n\\]/.test(spec.url)&&/^[a-f0-9]{64}$/.test(spec.sha256),'Unbound bitmap URL/hash');
  demand(Number.isSafeInteger(spec.width)&&spec.width>0&&Number.isSafeInteger(spec.height)&&spec.height>0,'Invalid bitmap dimensions');
  const response=await loaders.fetch(spec.url,{signal,redirect:'error',credentials:'same-origin'});demand(response.ok,'Bitmap HTTP failure');
  const bytes=await response.arrayBuffer();demand(bytes.byteLength>0&&bytes.byteLength<=16*1024*1024,'Bitmap size invalid');demand(await loaders.digest(bytes)===spec.sha256,'Bitmap hash mismatch');
  const image=await loaders.decode(new Blob([bytes],{type:'image/png'}));if(signal?.aborted){image.close();throw signal.reason??new DOMException('Bitmap load cancelled','AbortError');}if(image.width!==spec.width||image.height!==spec.height){image.close();throw Error('Bitmap decoded dimensions mismatch');}
  result.set(spec.id,{spec,image,[verified]:true});
 }return result;}catch(error){for(const item of result.values())(item.image as ImageBitmap).close?.();throw error;}
}
export function disposeBitmaps(bitmaps:ReadonlyMap<number,Bitmap>){for(const item of bitmaps.values())(item.image as ImageBitmap).close?.();}
export type MapFill = Readonly<{node:SceneNode;sourceShapeId:number;epoch:number;paintIndex:number;asset:Bitmap;repeat:boolean;bitmapMatrix:Matrix;bitmapWorldMatrix:Matrix}>;
/** Must return an actual 640x480 image surface. The painter performs the draw;
 * the callback cannot silently mark a missing map as successfully painted. */
export type MapBitmapProvider=(slot:MapFill)=>CanvasImageSource;
export interface CanvasFactory {canvas:(width:number,height:number)=>HTMLCanvasElement|OffscreenCanvas;path:(d:string)=>Path2D;matrix:(m:Matrix)=>DOMMatrix;}
const defaultFactory:CanvasFactory={canvas:(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;},path:d=>new Path2D(d),matrix:m=>new DOMMatrix([...m])};
function demand(value:unknown,message:string):asserts value {if(!value)throw Error(message);}
function rgba(source:RGBA,color:Color):string {return `rgba(${source.slice(0,3).map((v,i)=>Math.max(0,Math.min(255,v*color.multiply[i]/256+color.add[i]))).join(',')},${Math.max(0,Math.min(255,source[3]*color.multiply[3]/256+color.add[3]))/255})`;}
function size(image:CanvasImageSource):[number,number]{const q=image as any;return[q.naturalWidth??q.videoWidth??q.width,q.naturalHeight??q.videoHeight??q.height];}
function identityRgb(color:Color){return color.multiply.slice(0,3).every(v=>v===256)&&color.add.slice(0,3).every(v=>v===0);}
export function createPainter(geometry:Geometry,bitmaps:ReadonlyMap<number,Bitmap>,mapProvider:MapBitmapProvider,factory=defaultFactory){
 demand(geometry.sourceSha256===SOURCE&&geometry.packingVersion===1,'Foreign/unsupported packed geometry');demand(typeof mapProvider==='function','Instructional bitmap19 callback is required');
 const shapes=new Map(geometry.shapes.map(s=>[s.characterId,s]));const morphs=new Map(geometry.morphs.map(m=>[m.characterId,m]));
 for(const id of geometry.bitmapIds){const b=bitmaps.get(id);demand(b?.[verified]&&b.spec.id===id,'Missing/unverified bitmap '+id);}
 for(const p of geometry.paintPool){demand(typeof p.d==='string'&&p.d.length>0,'Missing source path');
  if(p.kind==='fill'){const s=p.style as Style;demand(['solid','radial-gradient','bitmap'].includes(s.kind),'Unknown source fill');if(s.kind==='radial-gradient')demand(s.gradientSpaceRadius===16384&&s.spreadMethod==='pad','Unsupported gradient');if(s.kind==='bitmap')demand(bitmaps.has(s.bitmapId),'Unknown bitmap fill');}
  else demand(p.kind==='stroke'&&Number.isFinite((p.style as any).widthTwips),'Unknown stroke');
 }
 const paths=new Map<string,Path2D>();const path=(d:string)=>{let p=paths.get(d);if(!p){p=factory.path(d);paths.set(d,p);}return p;};
 // No repeated JSON decoding; immutable pool and source paths are indexed once.
 const maskCache=new Map<string,Path2D>();const colorCache=new Map<string,CanvasImageSource>();const imageIds=new WeakMap<object,number>();let nextImageId=0;
 const setMatrix=(ctx:CanvasRenderingContext2D,m:Matrix)=>ctx.setTransform(...m);
 function maskPath(node:SceneNode):Path2D {
  const key=node.characterId+':'+node.ratio;const cached=maskCache.get(key);if(cached)return cached;let d='';
  if(node.kind==='morph'){
   const morph=morphs.get(node.characterId);demand(morph&&Number.isInteger(node.ratio)&&node.ratio>=0&&node.ratio<=65535,'Unknown morph/ratio');
   d=morph.startEdges.paths.map((ring,r)=>ring.map((p,i)=>{const end=morph.endEdges.paths[r][i];return(i?'L':'M')+p.map((v,j)=>v+(end[j]-v)*node.ratio/65535).join(' ');}).join(' ')+' Z').join(' ');
  }else{
   const shape=shapes.get(node.characterId);demand(shape,'Missing mask shape');const fills=shape.epochs.flatMap(e=>e.paintIndices.map(i=>geometry.paintPool[i])).filter(p=>p.kind==='fill');
   demand(fills.length===1,'Compound mask fill requires explicit union handling');d=fills[0].d;
  }
  const result=path(d);maskCache.set(key,result);return result;
 }
 function transformedBitmap(image:CanvasImageSource,color:Color):CanvasImageSource {
  // Alpha-only display fades are applied without creating pixel-copy caches.
  if(identityRgb(color)&&color.add[3]===0)return image;
  const object=image as object;if(!imageIds.has(object))imageIds.set(object,++nextImageId);const key=imageIds.get(object)+':'+JSON.stringify(color);const old=colorCache.get(key);if(old)return old;
  const [w,h]=size(image);const surface=factory.canvas(w,h),ctx=surface.getContext('2d') as CanvasRenderingContext2D;demand(ctx,'Missing bitmap transform context');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,w,h);
  for(let i=0;i<pixels.data.length;i+=4)for(let c=0;c<4;c++)pixels.data[i+c]=Math.max(0,Math.min(255,pixels.data[i+c]*color.multiply[c]/256+color.add[c]));
  ctx.putImageData(pixels,0,0);colorCache.set(key,surface);if(colorCache.size>16)colorCache.delete(colorCache.keys().next().value!);return surface;
 }
 function paintNode(ctx:CanvasRenderingContext2D,node:SceneNode,view:Matrix,lookup:ReadonlyMap<string,SceneNode>,stats:PaintStats){
  if(node.clipDepth!==undefined||!node.visible)return;
  if(['text','button','native-math'].includes(node.kind)){stats.delegated.push(node.id);return;}
  if(node.kind==='sprite'){for(const child of node.children??[])paintNode(ctx,child,view,lookup,stats);return;}
  // Non-mask morphs are not present in this source; never drop an unknown one.
  demand(node.kind==='shape','Non-mask morph requires explicit paint style');const shape=shapes.get(node.characterId);demand(shape,'Unknown shape');
  if(node.worldColor.multiply[3]===0&&node.worldColor.add[3]===0)return;
  ctx.save();try{
   ctx.globalAlpha=1;
   for(const id of new Set([...node.inheritedMaskIds,...node.maskIds])){const mask=lookup.get(id);demand(mask,'Missing source mask '+id);setMatrix(ctx,concatenate(view,mask.worldMatrix));ctx.clip(maskPath(mask),'evenodd');stats.maskApplications++;}
   const world=concatenate(view,node.worldMatrix);setMatrix(ctx,world);
   for(const epoch of shape.epochs)for(const paintIndex of epoch.paintIndices){const p=geometry.paintPool[paintIndex];demand(p,'Missing paint pool entry');const shapePath=path(p.d);ctx.globalAlpha=1;
    if(p.kind==='stroke'){
     const style=p.style as {widthTwips:number;rgba:RGBA;cap:CanvasLineCap;join:CanvasLineJoin;hairline:boolean};ctx.strokeStyle=rgba(style.rgba,node.worldColor);ctx.lineCap=style.cap;ctx.lineJoin=style.join;
     // Source has width1+ ordinary strokes. Width0 is explicitly one device pixel,
     // using geometric-mean scale; anisotropic hairline needs dedicated evidence.
     ctx.lineWidth=style.widthTwips||1/Math.sqrt(Math.abs(world[0]*world[3]-world[1]*world[2]));ctx.stroke(shapePath);
    }else {const s=p.style as Style;
     if(s.kind==='solid'){ctx.fillStyle=rgba(s.rgba,node.worldColor);ctx.fill(shapePath,p.fillRule??'evenodd');}
     else if(s.kind==='radial-gradient'){
      // No actual IN009 gradient has a nonidentity RGB transform. Reject that
      // future case rather than approximate post-interpolation channel clamps.
      demand(identityRgb(node.worldColor),'RGB-transformed gradient needs post-raster color pass');
      setMatrix(ctx,concatenate(world,s.matrix));const gradient=ctx.createRadialGradient(0,0,0,0,0,s.gradientSpaceRadius);for(const [position,c]of s.stops)gradient.addColorStop(position/255,rgba(c,node.worldColor));setMatrix(ctx,world);ctx.fillStyle=gradient;ctx.fill(shapePath,p.fillRule??'evenodd');
     }else if(s.kind==='bitmap'){
      const asset=bitmaps.get(s.bitmapId)!;let image:CanvasImageSource=asset.image;
      if(s.bitmapId===19){image=mapProvider({node,sourceShapeId:node.characterId,epoch:epoch.epoch,paintIndex,asset,repeat:s.repeat,bitmapMatrix:s.matrix,bitmapWorldMatrix:concatenate(node.worldMatrix,s.matrix)});demand(image&&size(image)[0]===asset.spec.width&&size(image)[1]===asset.spec.height,'Invalid/empty bitmap19 callback result');stats.mapCalls++;}
      image=transformedBitmap(image,node.worldColor);if(identityRgb(node.worldColor)&&node.worldColor.add[3]===0)ctx.globalAlpha=Math.max(0,Math.min(1,node.worldColor.multiply[3]/256));
      if(s.repeat){const pattern=ctx.createPattern(image,'repeat');demand(pattern,'Bitmap pattern unavailable');pattern.setTransform(factory.matrix(s.matrix));ctx.fillStyle=pattern;ctx.fill(shapePath,p.fillRule??'evenodd');}
      else{ctx.save();const imageAlpha=ctx.globalAlpha;ctx.globalAlpha=1;ctx.clip(shapePath,p.fillRule??'evenodd');ctx.globalAlpha=imageAlpha;setMatrix(ctx,concatenate(world,s.matrix));ctx.drawImage(image,0,0);ctx.restore();}
      stats.bitmapDraws.push(s.bitmapId);
     }else throw Error('Unknown source fill');
    }
    stats.paints++;stats.paintMembership.push([node.characterId,epoch.epoch,paintIndex]);
   }
  }finally{ctx.restore();}
 }
 function draw(ctx:CanvasRenderingContext2D,scene:{frame:number;nodes:readonly SceneNode[]},view:Matrix,clear=true):PaintStats {
  demand(Number.isInteger(scene.frame)&&scene.frame>=1&&scene.frame<=637,'Invalid main frame');demand(view.length===6&&view.every(Number.isFinite),'Invalid viewport transform');
  const lookup=new Map<string,SceneNode>();const collect=(nodes:readonly SceneNode[])=>{for(const n of nodes){demand(!lookup.has(n.id),'Duplicate source node');lookup.set(n.id,n);if(n.children)collect(n.children);}};collect(scene.nodes);
  if(clear){ctx.save();ctx.resetTransform();ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.restore();}
  const stats:PaintStats={paints:0,maskApplications:0,mapCalls:0,bitmapDraws:[],paintMembership:[],delegated:[]};for(const node of scene.nodes)paintNode(ctx,node,view,lookup,stats);return stats;
 }
 return {draw,cacheStats:()=>({paths:paths.size,masks:maskCache.size,transformedBitmaps:colorCache.size}),dispose:()=>{paths.clear();maskCache.clear();colorCache.clear();},
  drawStandaloneShape:(ctx:CanvasRenderingContext2D,node:SceneNode,view:Matrix)=>{demand(node.kind==='shape','Standalone shape required');return draw(ctx,{frame:1,nodes:[{...node,worldMatrix:IDENTITY,maskIds:[],inheritedMaskIds:[],clipDepth:undefined}]},view);}};
}
export interface PaintStats {paints:number;maskApplications:number;mapCalls:number;bitmapDraws:number[];paintMembership:number[][];delegated:string[];}
