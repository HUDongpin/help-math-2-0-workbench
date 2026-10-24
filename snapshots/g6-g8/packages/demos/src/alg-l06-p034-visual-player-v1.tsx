'use client';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal,flushSync} from 'react-dom';
import canvasMeta from '../../../migrations/shared-alg001-l06-p034/canvas-v1/canvas-metadata-v1.json';
import nativeGeometry from '../../../migrations/shared-alg001-l06-p034/native-v1/geometry-v1.json';
import {P034NativeTextV1,p034NativeTextState} from './native-text/alg-l06-p034-native';
import {p034CanOpenGlossary,p034GlossaryState,type P034GlossaryKey}
 from './alg-l06-p034-glossary-v1';
import {P034_ENGINEERING_INPUT,P034_GRAPH,p034ClientToStage,p034InitialDrag,
  p034Keyboard,p034PointerCancel,p034PointerDown,p034PointerEnd,p034PointerMove,
  p034SyncDrag,type P034DragState} from './alg-l06-p034-drag-v1';

export interface P034CanvasAssetV1 {
 readonly metadata:{readonly animationId:string;readonly sourceSwfSha256:string;
  readonly stage:{readonly width:number;readonly height:number};readonly fps:number;
  readonly generatorInput:{readonly framesHtmlSha256:string};
  readonly sourceRootTimeline:{readonly frameCount:number;readonly beginFrame:number};
  readonly deterministicContentTimeline:{readonly timelineId:string;readonly frameCount:number};
  readonly audioRendering:string;};
 ready():Promise<unknown>;
 resolveFrameState(request:P034CanvasRequestV1):P034CanvasResultV1;
 render(canvas:HTMLCanvasElement,request:P034CanvasRequestV1):P034CanvasResultV1;
}
export interface P034CanvasRequestV1 {
 frame:number;scenario:'source-static-frame';lang:'en';seed:0;
 line:{visible:boolean;xGraphLocalPixels:number};
}
export interface P034CanvasResultV1 {
 localFrame:number;frameDomain:string;rootFrame:number;
 scenario:string;lang:string;seed:number;audioRendered:boolean;
 line:{visible:boolean;xGraphLocalPixels:number};
}
export interface P034VisualPlayerProps {
 asset:P034CanvasAssetV1;
 /** Explicit one-indexed sprite-40 frame. This component owns no clock. */
 frame:number;
 /** Increment for Replay even if the host presents the same frame. */
 replayToken?:number;
 language?:'en'|'es';
 onError?:(error:Error)=>void;
 onOpenGlossary?:(key:P034GlossaryKey,trigger:HTMLButtonElement)=>boolean|void;
 nativeTextTarget?:HTMLElement|null;
 connectFrameCommit?:(commit:(nextFrame:number,replayToken?:number)=>boolean)=>void|(()=>void);
 onCommittedFrame?:(frame:number,replayToken:number)=>void;
}
export type P034VisualCommit={asset:P034CanvasAssetV1;frame:number;replayToken:number;
 visible:boolean;xGraphLocalPixels:number};

/** Runtime identity and Canvas result are checked before companion text is shown. */
export function p034PaintVerifiedFrame(asset:P034CanvasAssetV1,
 canvas:HTMLCanvasElement,frame:number,line:{visible:boolean;xGraphLocalPixels:number}) {
 const m=asset.metadata;
 if(m.animationId!==nativeGeometry.animationId||
  m.animationId!==canvasMeta.animationId||
  m.sourceSwfSha256!==nativeGeometry.source.sha256||
  m.sourceSwfSha256!==canvasMeta.sourceSwfSha256||
  m.stage.width!==800||m.stage.height!==600||m.fps!==12||
  m.generatorInput.framesHtmlSha256!==
   'e8dd54605b1170b2ca6e920384863e9f609576b086ee18bd21a4e1a715c07630'||
  m.sourceRootTimeline.frameCount!==canvasMeta.rootFrameCount||
  m.sourceRootTimeline.beginFrame!==nativeGeometry.rootFrame||
  m.deterministicContentTimeline.timelineId!==nativeGeometry.frameDomain||
  m.deterministicContentTimeline.frameCount!==nativeGeometry.mainFrameCount||
  m.audioRendering!=='not-included'||
  canvasMeta.sourceGlyphRendering.mode!=='preserve-all'||
  nativeGeometry.canvasSourceGlyphsPreserved!==true)
  throw Error('P034_CANVAS_ASSET_IDENTITY_MISMATCH');
 if(!Number.isSafeInteger(frame)||frame<1||frame>434||
  (line.visible&&frame<P034_GRAPH.firstFrame)||
  !Number.isFinite(line.xGraphLocalPixels)||
  (line.visible&&(line.xGraphLocalPixels<P034_ENGINEERING_INPUT.lineLocal.left||
    line.xGraphLocalPixels>P034_ENGINEERING_INPUT.lineLocal.right)))
  throw Error('P034_INVALID_FRAME_LINE');
 if(canvas.width!==800||canvas.height!==600)throw Error('P034_CANVAS_STAGE_MISMATCH');
 const request:P034CanvasRequestV1={frame,scenario:'source-static-frame',lang:'en',seed:0,
  line:{visible:line.visible,xGraphLocalPixels:line.xGraphLocalPixels}};
 const resolved=asset.resolveFrameState(request);
 if(resolved.localFrame!==frame||resolved.frameDomain!=='sprite-40'||
  resolved.line.visible!==line.visible||
  resolved.line.xGraphLocalPixels!==line.xGraphLocalPixels)
  throw Error('P034_CANVAS_RESOLUTION_MISMATCH');
 const result=asset.render(canvas,request);
 if(result.localFrame!==frame||result.frameDomain!=='sprite-40'||
  result.rootFrame!==6||result.scenario!=='source-static-frame'||
  result.lang!=='en'||result.seed!==0||result.audioRendered!==false||
  result.line.visible!==line.visible||
  result.line.xGraphLocalPixels!==line.xGraphLocalPixels||
  canvas.getAttribute('data-flash-frame')!==String(frame)||
  canvas.getAttribute('data-flash-frame-domain')!=='sprite-40'||
  canvas.getAttribute('data-flash-root-frame')!=='6'||
  canvas.getAttribute('data-runtime-scenario')!=='source-static-frame'||
  canvas.getAttribute('data-runtime-seed')!=='0')
  throw Error('P034_CANVAS_COMMIT_MISMATCH');
 canvas.setAttribute('data-p034-line-visible',String(line.visible));
 canvas.setAttribute('data-p034-line-x',String(line.xGraphLocalPixels));
 return result;
}

export function p034CommitMatches(commit:P034VisualCommit|null,asset:P034CanvasAssetV1,
 canvas:HTMLCanvasElement|null,state:P034DragState):boolean {
 return !!commit&&!!canvas&&commit.asset===asset&&commit.frame===state.frame&&
  commit.replayToken===state.replayToken&&commit.visible===state.visible&&
  commit.xGraphLocalPixels===state.xGraphLocalPixels&&
  canvas.getAttribute('data-flash-frame')===String(state.frame)&&
  canvas.getAttribute('data-flash-frame-domain')==='sprite-40'&&
  canvas.getAttribute('data-p034-line-visible')===String(state.visible)&&
  canvas.getAttribute('data-p034-line-x')===String(state.xGraphLocalPixels);
}

/** A click may publish only the frame already painted by this replay's clock. */
export function p034LiveClickCommit(commit:P034VisualCommit|null,
 asset:P034CanvasAssetV1,canvas:HTMLCanvasElement|null,drag:P034DragState,
 renderedFrame:number,renderedReplayToken:number):P034VisualCommit|null {
 return commit&&commit.asset===asset&&
  commit.replayToken===renderedReplayToken&&commit.frame>=renderedFrame&&
  p034CommitMatches(commit,asset,canvas,drag)?commit:null;
}

/** Clock ACK is only the synchronous, source-checked Canvas draw/readback.
 * A new Replay token may regress; an old token or late frame may not. */
export function p034PaintRequestedClockFrame(asset:P034CanvasAssetV1,
 canvas:HTMLCanvasElement|null,ready:boolean,frame:number,replayToken:number,
 previous:P034VisualCommit|null,drag:P034DragState):
 {commit:P034VisualCommit;drag:P034DragState}|null {
 if(!ready||!canvas||!Number.isSafeInteger(frame)||frame<1||frame>433||
  !Number.isSafeInteger(replayToken)||replayToken<0||
  (previous&&previous.asset!==asset)||
  (previous&&(replayToken<previous.replayToken||
   (replayToken===previous.replayToken&&frame<previous.frame))))return null;
 const nextDrag=p034SyncDrag(drag,frame,replayToken);
 try{p034PaintVerifiedFrame(asset,canvas,frame,
   {visible:nextDrag.visible,xGraphLocalPixels:nextDrag.xGraphLocalPixels});}
 catch{return null;}
 return {commit:{asset,frame,replayToken,visible:nextDrag.visible,
  xGraphLocalPixels:nextDrag.xGraphLocalPixels},drag:nextDrag};
}

export function p034CanOpenCommittedGlossary(key:P034GlossaryKey,frame:number,
 committedFrame:number|null,context?:{trigger:HTMLButtonElement;
  scope:HTMLElement|null;canvas:HTMLCanvasElement|null}):boolean {
 if(committedFrame!==frame||!Number.isSafeInteger(frame)||frame<1||frame>434)return false;
 const native=p034NativeTextState(frame);
 if(!p034GlossaryState(frame,native).some(control=>control.key===key&&control.available))
  return false;
 if(!context)return true;
 const {trigger,scope,canvas}=context;
 return !!canvas&&canvas.getAttribute('data-flash-frame')===String(frame)&&
  canvas.getAttribute('data-flash-frame-domain')==='sprite-40'&&
  canvas.getAttribute('data-flash-root-frame')==='6'&&
  p034CanOpenGlossary(key,trigger,frame,scope,native);
}

const hit=P034_ENGINEERING_INPUT.hitLocal;
const graphBox={left:P034_GRAPH.stageX+hit.left*P034_GRAPH.scale,
 top:P034_GRAPH.stageY+hit.top*P034_GRAPH.scale,
 width:(hit.right-hit.left)*P034_GRAPH.scale,
 height:(hit.bottom-hit.top)*P034_GRAPH.scale};
const pct=(value:number,total:number)=>`${value*100/total}%`;

/** Explicit-frame visual owner. Audio, host controls and registration live elsewhere. */
export function P034VisualPlayerV1({asset,frame,replayToken=0,
 language='en',onError,onOpenGlossary,nativeTextTarget,
 connectFrameCommit,onCommittedFrame}:P034VisualPlayerProps) {
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const nativeRootRef=useRef<HTMLElement>(null);
 const captureRef=useRef<number|null>(null);
 const captureElementRef=useRef<HTMLDivElement|null>(null);
 const errorRef=useRef(onError);errorRef.current=onError;
 const committedRef=useRef<P034VisualCommit|null>(null);
 const dragRef=useRef<P034DragState>(p034InitialDrag(frame,replayToken));
 const assetRef=useRef(asset);assetRef.current=asset;
 const readyRef=useRef<P034CanvasAssetV1|null>(null);
 const onCommittedRef=useRef(onCommittedFrame);onCommittedRef.current=onCommittedFrame;
 const lastPropRef=useRef({frame,replayToken});
 const [readyAsset,setReadyAsset]=useState<P034CanvasAssetV1|null>(null);
 const [display,setDisplay]=useState({frame,replayToken});
 const [drag,setDrag]=useState(()=>p034InitialDrag(frame,replayToken));
 const [commit,setCommit]=useState<P034VisualCommit|null>(null);
 const [failure,setFailure]=useState('');
 const visualFrame=display.frame,visualReplayToken=display.replayToken;
 const current=p034SyncDrag(drag,visualFrame,visualReplayToken);
 const committed=p034CommitMatches(commit,asset,canvasRef.current,current);
 useLayoutEffect(()=>{
  if(lastPropRef.current.frame===frame&&lastPropRef.current.replayToken===replayToken)return;
  lastPropRef.current={frame,replayToken};
  setDisplay(old=>old.frame===frame&&old.replayToken===replayToken?old:{frame,replayToken});
 },[frame,replayToken]);
 useLayoutEffect(()=>{if(current!==drag){dragRef.current=current;setDrag(current);}},[current,drag]);
 useEffect(()=>{
  let active=true;
  readyRef.current=null;committedRef.current=null;
  setReadyAsset(null);setCommit(null);setFailure('');
  void Promise.resolve().then(()=>asset.ready()).then(()=>{
   if(active){readyRef.current=asset;setReadyAsset(asset);}
  },error=>{if(active){const value=error instanceof Error?error:new Error(String(error));
   setFailure(value.message);errorRef.current?.(value);}});
  return()=>{active=false;readyRef.current=null;committedRef.current=null;};
 },[asset]);
 useEffect(()=>()=>{
  const pointerId=captureRef.current,element=captureElementRef.current;
  if(pointerId!==null&&element?.hasPointerCapture(pointerId))
   element.releasePointerCapture(pointerId);
  captureRef.current=null;captureElementRef.current=null;
 },[]);
 useLayoutEffect(()=>{
  if(current.pointerId===null&&captureRef.current!==null){
   const id=captureRef.current,element=captureElementRef.current;
   if(element?.hasPointerCapture(id))element.releasePointerCapture(id);
   captureRef.current=null;captureElementRef.current=null;
  }
 },[current.pointerId,visualFrame,visualReplayToken]);
 useLayoutEffect(()=>{
  const canvas=canvasRef.current;
  if(readyAsset!==asset||!canvas)return;
  try{
   p034PaintVerifiedFrame(asset,canvas,visualFrame,
    {visible:current.visible,xGraphLocalPixels:current.xGraphLocalPixels});
   const next={asset,frame:visualFrame,replayToken:visualReplayToken,
    visible:current.visible,xGraphLocalPixels:current.xGraphLocalPixels};
   committedRef.current=next;dragRef.current=current;
   setCommit(next);
   setFailure('');
  }catch(error){
   const value=error instanceof Error?error:new Error(String(error));
   committedRef.current=null;setCommit(null);setFailure(value.message);errorRef.current?.(value);
  }
 },[asset,readyAsset,visualFrame,visualReplayToken,current.visible,current.xGraphLocalPixels]);
 useEffect(()=>{
  if(readyAsset!==asset||!canvasRef.current||!connectFrameCommit)return;
  let active=true;
  const commitFrame=(nextFrame:number,nextToken=committedRef.current?.replayToken??visualReplayToken)=>{
   if(!active||assetRef.current!==asset||readyRef.current!==asset)return false;
   const next=p034PaintRequestedClockFrame(asset,canvasRef.current,true,
    nextFrame,nextToken,committedRef.current,dragRef.current);
   if(!next)return false;
   if(next.drag.pointerId===null&&captureRef.current!==null){
    const id=captureRef.current,element=captureElementRef.current;
    if(element?.hasPointerCapture(id))element.releasePointerCapture(id);
    captureRef.current=null;captureElementRef.current=null;
   }
   dragRef.current=next.drag;committedRef.current=next.commit;
   setDrag(next.drag);setDisplay({frame:nextFrame,replayToken:nextToken});
   setCommit(next.commit);setFailure('');
   onCommittedRef.current?.(nextFrame,nextToken);
   return true;
  };
  const disconnect=connectFrameCommit(commitFrame);
  return()=>{active=false;if(typeof disconnect==='function')disconnect();};
 },[asset,readyAsset,connectFrameCommit]);
 const stageFromPointer=(event:React.PointerEvent<HTMLDivElement>)=>{
  const rect=canvasRef.current?.getBoundingClientRect();
  if(!rect)return null;
  try{return p034ClientToStage(event.clientX,event.clientY,rect);}
  catch{return null;}
 };
 const releaseCapture=(id:number,element:HTMLDivElement)=>{
  if(captureRef.current===id){
   if(element.hasPointerCapture(id))element.releasePointerCapture(id);
   captureRef.current=null;captureElementRef.current=null;
  }
 };
 const showGraph=visualFrame>=P034_GRAPH.firstFrame&&visualFrame<=P034_GRAPH.lastFrame;
 const handleGlossary=(key:P034GlossaryKey,trigger:HTMLButtonElement)=>{
  const canvas=canvasRef.current;
  if(!onOpenGlossary||!committed||readyRef.current!==asset)return false;
  const painted=p034LiveClickCommit(committedRef.current,asset,canvas,
   dragRef.current,visualFrame,visualReplayToken);
  if(!painted||!canvas)return false;
  if(painted.frame!==visualFrame){
   // Canvas is already at this frame. Publish its companion before checking
   // the original physical trigger; a replaced button must remain rejected.
   flushSync(()=>{
    setDrag(dragRef.current);
    setDisplay({frame:painted.frame,replayToken:painted.replayToken});
    setCommit(painted);
   });
  }
  const sourceRoot=nativeRootRef.current,live=committedRef.current;
  if(!live||live.frame!==painted.frame||live.replayToken!==painted.replayToken||
   !p034CommitMatches(live,asset,canvas,dragRef.current)||
   !p034CanOpenCommittedGlossary(key,painted.frame,live.frame,
    {trigger,scope:sourceRoot,canvas}))return false;
  return onOpenGlossary(key,trigger);
 };
 const companion=committed?<P034NativeTextV1 frame={visualFrame} language={language}
  rootRef={nativeRootRef} onOpenGlossary={onOpenGlossary?handleGlossary:undefined}/>:null;
 return <div data-p034-visual-player="true" data-p034-frame={visualFrame}
   data-p034-replay-token={visualReplayToken} data-p034-canvas-committed={committed}
   data-p034-source-sha256={nativeGeometry.source.sha256}
   data-p034-input-policy={P034_ENGINEERING_INPUT.provenance}
   style={{width:'100%',maxWidth:'100%',minWidth:0,fontFamily:'var(--font-lesson-sans, Arial), sans-serif'}}>
   <style>{`.p034-graph-input:focus-visible{outline:3px solid #14578d;outline-offset:-3px;background:rgba(20,87,141,.10)}`}</style>
   <div style={{position:'relative',width:'100%',aspectRatio:'4 / 3',overflow:'hidden'}}>
    <canvas ref={canvasRef} width={800} height={600} aria-hidden="true"
     style={{display:'block',width:'100%',height:'100%',opacity:committed?1:0}} />
    {showGraph&&<div className="p034-graph-input"
      role="slider" tabIndex={committed?0:-1}
      aria-label="Vertical line on the graph"
      aria-valuemin={P034_ENGINEERING_INPUT.lineLocal.left}
      aria-valuemax={P034_ENGINEERING_INPUT.lineLocal.right}
      aria-valuenow={Math.round(current.xGraphLocalPixels)}
      aria-valuetext={current.visible?`Line position ${Math.round(current.xGraphLocalPixels)}`:
        'Line hidden; press Enter or an arrow key to show it'}
      data-p034-source-graph-frame={visualFrame}
      data-p034-hit-policy={P034_ENGINEERING_INPUT.provenance}
      style={{position:'absolute',left:pct(graphBox.left,800),top:pct(graphBox.top,600),
       width:pct(graphBox.width,800),height:pct(graphBox.height,600),
       touchAction:'none',cursor:'ew-resize',boxSizing:'border-box',
       pointerEvents:committed?'auto':'none'}}
      onPointerDown={event=>{
       if(!committed)return;
       const stage=stageFromPointer(event);if(!stage)return;
       const next=p034PointerDown(current,event.pointerId,stage.x,stage.y);
       if(next===current)return;
       event.currentTarget.setPointerCapture(event.pointerId);
       captureRef.current=event.pointerId;captureElementRef.current=event.currentTarget;
       dragRef.current=next;setDrag(next);
      }}
      onPointerMove={event=>{
       const stage=stageFromPointer(event);if(!stage)return;
       const next=p034PointerMove(p034SyncDrag(dragRef.current,visualFrame,visualReplayToken),
         event.pointerId,stage.x);
       dragRef.current=next;setDrag(next);
      }}
      onPointerUp={event=>{
       releaseCapture(event.pointerId,event.currentTarget);
       const next=p034PointerEnd(p034SyncDrag(dragRef.current,visualFrame,visualReplayToken),event.pointerId);
       dragRef.current=next;setDrag(next);
      }}
      onPointerCancel={event=>{
       releaseCapture(event.pointerId,event.currentTarget);
       const next=p034PointerCancel(p034SyncDrag(dragRef.current,visualFrame,visualReplayToken),event.pointerId);
       dragRef.current=next;setDrag(next);
      }}
      onLostPointerCapture={event=>{
       if(captureRef.current===event.pointerId){
        captureRef.current=null;captureElementRef.current=null;
       }
       const next=p034PointerCancel(p034SyncDrag(dragRef.current,visualFrame,visualReplayToken),event.pointerId);
       dragRef.current=next;setDrag(next);
      }}
      onKeyDown={event=>{
       if(!committed)return;
       const next=p034Keyboard(current,event.key);
       if(next!==current){event.preventDefault();dragRef.current=next;setDrag(next);}
      }} />}
   </div>
   {failure?<p role="alert">{failure}</p>:committed?
    nativeTextTarget?createPortal(companion,nativeTextTarget):companion:
    <p role="status">{language==='es'?'Cargando visual de la lección…':'Loading lesson visual…'}</p>}
  </div>;
}
