'use client';

import React, {useEffect, useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import type {RuntimeContext} from './contract';
import type {TextPresentationSnapshot} from './lesson-text-contract';
import {allocateLessonCanvasSurface, selectLessonCanvasResolution,
  type LessonCanvasDimensions, type LessonCanvasResolution, type LessonCanvasResolutionMetadata,
  type LessonCanvasSurface} from './lesson-canvas-resolution';
import {observeLessonCanvasResolution} from './use-lesson-canvas-resolution';

export interface LessonCanvasPlaneAdapter {
  readonly metadata: {
    readonly animationId: string;
    readonly sourceSwfSha256: string;
    readonly resolution: LessonCanvasResolutionMetadata;
  };
  ready(): Promise<void>;
  render(canvas: HTMLCanvasElement, request: Record<string, unknown>): unknown;
  renderWithText?(canvas: HTMLCanvasElement, request: Record<string, unknown>): {
    readonly state: unknown;
    readonly diagnostics: readonly unknown[];
    readonly suppressedInstanceIds: readonly string[];
    readonly unfulfilledSuppressionIds: readonly string[];
  };
}

export interface LessonCanvasPlaneResult {
  readonly status: 'ready' | 'legacy-fallback' | 'error';
  readonly frame: number;
  readonly resolution: LessonCanvasResolution;
  readonly drawMs: number;
  readonly blockers: readonly string[];
  readonly suppressedInstanceIds: readonly string[];
}

function snapshotMatches(snapshot: TextPresentationSnapshot, request: RuntimeContext, adapter: LessonCanvasPlaneAdapter) {
  const identity=snapshot.identity;
  return snapshot.animationId===adapter.metadata.animationId && snapshot.sourceSwfSha256===adapter.metadata.sourceSwfSha256
    && identity.frame===request.frame && identity.frameDomain===request.frameDomain
    && identity.rootFrame===(request.rootFrame??identity.rootFrame) && identity.language===request.lang
    && identity.scenario===request.scenario && identity.seed===request.seed && identity.replay===(request.replay??0);
}
function stateMatches(state: unknown, snapshot: TextPresentationSnapshot) {
  if(!state || typeof state!=='object')return false;
  const value=state as Record<string,unknown>;
  return (value.localFrame??value.frame)===snapshot.identity.frame && value.frameDomain===snapshot.identity.frameDomain
    && value.rootFrame===snapshot.identity.rootFrame && (value.language??value.lang)===snapshot.identity.language
    && value.scenario===snapshot.identity.scenario && value.seed===snapshot.identity.seed;
}

/** A single committed result owns both the visible Canvas and native text.
 * Draws happen on a reusable detached buffer. A failed/partial suppression is
 * redrawn without suppression before the old complete plane can be displayed.
 * This component never owns a teaching clock, random state or audio. */
export function LessonCanvasPlane({adapter, nativeStage, request, snapshot, renderKey,
  figureLabel, sourceBitmapBound=false, children, onResult}: {
  readonly adapter: LessonCanvasPlaneAdapter;
  readonly nativeStage: LessonCanvasDimensions;
  readonly request: RuntimeContext;
  readonly snapshot: TextPresentationSnapshot;
  /** Include all graphic interaction values as well as the host frame identity. */
  readonly renderKey: string;
  readonly figureLabel: string;
  readonly sourceBitmapBound?: boolean;
  readonly children?: (committedSnapshot: TextPresentationSnapshot, figure: ReactNode) => ReactNode;
  readonly onResult?: (result: LessonCanvasPlaneResult) => void;
}) {
  const [graphicElement,setGraphicElement]=useState<HTMLDivElement|null>(null);
  const visible=useRef<HTMLCanvasElement|null>(null);
  const staging=useRef<LessonCanvasSurface|null>(null);
  const failedAllocationKey=useRef<string|null>(null);
  const [ready,setReady]=useState<LessonCanvasPlaneAdapter|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [resolution,setResolution]=useState(()=>selectLessonCanvasResolution({nativeStage,enabled:true,metadata:adapter.metadata.resolution,sourceBitmapBound}));
  const [committed,setCommitted]=useState<{snapshot:TextPresentationSnapshot;result:LessonCanvasPlaneResult}|null>(null);
  const callback=useRef(onResult);
  useEffect(()=>{callback.current=onResult;},[onResult]);
  useEffect(()=>{
    let cancelled=false;setReady(null);setError(null);
    void adapter.ready().then(()=>{if(!cancelled)setReady(adapter);}).catch(()=>{if(!cancelled)setError('The lesson figure could not load.');});
    return()=>{cancelled=true;};
  },[adapter]);
  useLayoutEffect(()=>{
    const options={nativeStage,enabled:true,metadata:adapter.metadata.resolution,sourceBitmapBound};
    if(!graphicElement){setResolution(selectLessonCanvasResolution(options));return;}
    return observeLessonCanvasResolution(graphicElement,options,setResolution);
  },[graphicElement,nativeStage.width,nativeStage.height,adapter,sourceBitmapBound]);
  useEffect(()=>()=>{staging.current?.dispose();staging.current=null;},[]);

  const identityKey=JSON.stringify(snapshot.identity);
  const suppressionKey=snapshot.suppressedInstances.map(instance=>instance.id).join('\n');
  useLayoutEffect(()=>{
    if(ready!==adapter)return;
    const start=performance.now(),blockers=[...snapshot.blockers];
    try{
      if(!staging.current || (staging.current.resolution.renderKey!==resolution.renderKey
        && failedAllocationKey.current!==resolution.renderKey)) {
        const next=allocateLessonCanvasSurface(resolution);
        staging.current?.dispose();staging.current=next;
        failedAllocationKey.current=next.resolution.renderScale!==resolution.renderScale?resolution.renderKey:null;
      }
      const surface=staging.current;
      if(!snapshotMatches(snapshot,request,adapter))blockers.push('text-graphic-runtime-identity-mismatch');
      const requested=snapshot.status==='ready'&&!blockers.length?snapshot.suppressedInstances.map(instance=>instance.id):[];
      const sourceRequest={...request,renderScale:surface.resolution.renderScale};
      let state:unknown, suppressed:readonly string[]=[];
      if(adapter.renderWithText){
        const result=adapter.renderWithText(surface.canvas,{...sourceRequest,text:{suppressInstanceIds:requested}});
        state=result.state;suppressed=result.suppressedInstanceIds;
        if(result.unfulfilledSuppressionIds.length || requested.length!==suppressed.length
          || requested.some(id=>!suppressed.includes(id)))blockers.push('exact-source-suppression-incomplete');
      }else{
        state=adapter.render(surface.canvas,sourceRequest);
        if(requested.length)blockers.push('adapter-has-no-instance-suppression');
      }
      if(!stateMatches(state,snapshot))blockers.push('draw-state-does-not-match-text-snapshot');
      if(blockers.length){
        // Restore every old word before removing the modern layer. Never show
        // a partially suppressed old plane with an incomplete replacement.
        adapter.render(surface.canvas,sourceRequest);suppressed=[];
      }
      const status=blockers.length?'legacy-fallback':'ready';
      const nextSnapshot=status==='ready'?snapshot:{...snapshot,status:'blocked' as const,blocks:[],suppressedInstances:[],blockers};
      const result:LessonCanvasPlaneResult={status,frame:snapshot.identity.frame,resolution:surface.resolution,
        drawMs:performance.now()-start,blockers,suppressedInstanceIds:suppressed};
      setCommitted({snapshot:nextSnapshot,result});setError(null);callback.current?.(result);
    }catch{
      const result:LessonCanvasPlaneResult={status:'error',frame:snapshot.identity.frame,resolution,drawMs:performance.now()-start,
        blockers:['canvas-draw-or-allocation-failed'],suppressedInstanceIds:[]};
      setError('The lesson figure could not load.');callback.current?.(result);
    }
  },[adapter,ready,renderKey,identityKey,snapshot.bindingVersion,snapshot.status,suppressionKey,resolution.renderKey]);

  // React commits the matching native text before this layout effect copies the
  // finished buffer. Both become visible in the same paint, including resize.
  useLayoutEffect(()=>{
    const canvas=visible.current,surface=staging.current;
    if(!canvas||!surface||!committed)return;
    const {width,height}=surface.resolution.backingStage;
    if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;
    const context=canvas.getContext('2d');
    if(!context){setError('The lesson figure could not load.');return;}
    context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,width,height);context.drawImage(surface.canvas,0,0);
  },[committed,graphicElement]);

  const figure=<div ref={setGraphicElement} className="lesson-canvas-plane__figure" data-canvas-frame={committed?.result.frame}
    style={{width:'100%',aspectRatio:`${nativeStage.width} / ${nativeStage.height}`,position:'relative',minWidth:0}}>
    <canvas ref={visible} role="img" aria-label={figureLabel} style={{display:'block',width:'100%',height:'100%'}}/>
  </div>;
  return <div className="lesson-canvas-plane" data-canvas-plane-status={error?'error':committed?.result.status??'loading'}
    data-canvas-render-scale={committed?.result.resolution.renderScale} data-canvas-resolution-status={resolution.status}
    data-canvas-allocation-status={committed?.result.resolution.status} data-canvas-source-bitmap-bound={sourceBitmapBound?'true':'false'}>
    {error?<p role="status">{error}</p>:committed
      ?committed.snapshot.status==='ready'&&children?children(committed.snapshot,figure):figure
      :<p role="status">Loading lesson figure…</p>}
  </div>;
}
