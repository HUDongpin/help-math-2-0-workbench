"use client";

import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import type {AnimationRendererProps} from './contract';
import {prepareFrozenGlossaryCanvas} from './frozen-glossary-canvas-preparation';

export interface NmsL2HoverConfig {
  readonly animationId: string;
  readonly sourceSwfSha256: string;
  readonly assetSource: string;
  readonly assetSha256: string;
  readonly controls: readonly Readonly<{
    sourceCharacterId: number; fraction: string;
    hitBounds: Readonly<{x:number;y:number;width:number;height:number}>;
  }>[];
  readonly glossary: Readonly<{
    entryId: string; labels: Readonly<{en:string;es:string}>;
    ranges: readonly Readonly<{firstFrame:number;lastFrame:number}>[];
  }>;
}
export interface NmsL2HoverSurface {
  paint(frame:number):boolean;
  clearInteractions():void;
  readFrame():number;
}
type Selection={replay:number;pointer:number|null;focus:number|null;latched:number|null};
type HoverAsset={render(canvas:HTMLCanvasElement,request:{frame:number;lang:'en';scenario:string;seed:number;hoverCharacterIds:number[]}):unknown};
// These four parent sprites alone add source text29 ("RIGHT") in frame 2.
const rightSourceCharacters=new Set([30,42,54,68]);
const empty=(replay:number):Selection=>({replay,pointer:null,focus:null,latched:null});

/** Exact source hover behavior candidate. Product admission and audio are supplied
 * separately; this component never runs ActionScript or claims acceptance. */
export function NmsL2HoverCandidateRenderer({config,onSurfaceReady,externalClock=false,...props}:AnimationRendererProps&{config:NmsL2HoverConfig;externalClock?:boolean;onSurfaceReady?:(surface:NmsL2HoverSurface|null)=>void}) {
  if(config.animationId!=='shared-nms002-l02-p020'||config.sourceSwfSha256!=='5aaf739cf2ef1b093564d0f64d3799dcfca2ab5ffa7cc0375f4c0b43dc3364b5')
    throw new Error('NMS L2 hover requires the exact audited source');
  const canvas=useRef<HTMLCanvasElement>(null);
  const [ready,setReady]=useState(false),[failure,setFailure]=useState<string|null>(null);
  const [selection,setSelection]=useState<Selection>(()=>empty(props.replay??0));
  const pointerType=useRef('keyboard');
  const [companionTarget,setCompanionTarget]=useState<HTMLElement|null>(null);
  useEffect(()=>{const node=props.pageInteractionCompanionTargetId?document.getElementById(props.pageInteractionCompanionTargetId):null;setCompanionTarget(node?.dataset.pageInteractionCompanionHost==='true'?node:null);},[props.pageInteractionCompanionTargetId]);
  const replay=props.replay??0,language=props.uiLanguage??props.lang;
  const eligible=(props.frameDomain??'sprite-69')==='sprite-69'&&props.scenario==='source-static-frame'&&!props.entryStateSha256;
  const visible=eligible&&props.frame>=149&&props.frame<=151;
  const ids=visible&&selection.replay===replay?
    [...new Set([selection.pointer,selection.focus,selection.latched].filter((id):id is number=>id!==null))].sort((a,b)=>a-b):[];
  const idKey=ids.join(',');
  const paintState=useRef({ids,seed:props.seed,replay,frame:props.frame});
  paintState.current={...paintState.current,ids,seed:props.seed,replay};
  const currentFrame=()=>externalClock?paintState.current.frame:props.frame;
  const canInteract=()=>eligible&&currentFrame()>=149&&currentFrame()<=151;
  const surface=useCallback(():NmsL2HoverSurface=>({
    paint(frame){
      if(!ready||!canvas.current||!Number.isSafeInteger(frame)||frame<1||frame>151)return false;
      const asset=window.HELP_MATH_CANVAS_ASSETS?.[config.animationId] as unknown as HoverAsset;
      if(!asset?.render)return false;
      const activeIds=frame>=149?paintState.current.ids:[];
      asset.render(canvas.current,{frame,lang:'en',scenario:'source-static-frame',seed:paintState.current.seed,hoverCharacterIds:activeIds});
      paintState.current.frame=frame;
      return Number(canvas.current.dataset.flashFrame)===frame;
    },
    clearInteractions(){paintState.current.ids=[];setSelection(empty(paintState.current.replay));},
    readFrame(){return paintState.current.frame;},
  }),[ready,config]);
  const update=(field:'pointer'|'focus'|'latched',id:number|null)=>{if(id!==null&&!canInteract())return;setSelection(s=>({...(s.replay===replay?s:empty(replay)),[field]:id}));};
  const label=(index:number)=>`${language==='es'?'Fila':'Row'} ${Math.floor(index/3)+1}: ${config.controls[index].fraction}`;

  useEffect(()=>{
    const keyboard=()=>{pointerType.current='keyboard';};
    document.addEventListener('keydown',keyboard,true);
    return()=>document.removeEventListener('keydown',keyboard,true);
  },[]);
  useEffect(()=>{
    let active=true;setReady(false);setFailure(null);
    prepareFrozenGlossaryCanvas(config).then(()=>{if(active)setReady(true);},e=>{if(active)setFailure(e.message);});
    return()=>{active=false;};
  },[config]);
  useEffect(()=>{if(!visible)setSelection(empty(replay));},[visible,replay]);
  useLayoutEffect(()=>{
    if(!ready)return;
    try{
      if(!surface().paint(externalClock?paintState.current.frame:props.frame))throw new Error('Hover frame not committed');
      setFailure(null);
    }catch(e){setFailure(e instanceof Error?e.message:'Hover render failed');}
  },[ready,props.frame,props.seed,idKey,surface,externalClock]);
  useLayoutEffect(()=>{
    if(!ready)return;
    onSurfaceReady?.(surface());
    return()=>onSurfaceReady?.(null);
  },[ready,onSurfaceReady,surface]);

  const events=(id:number)=>({
    onPointerDown:(e:React.PointerEvent<HTMLButtonElement>)=>{
      pointerType.current=e.pointerType;
      // A touch gesture supersedes any mouse hover left at the same screen position.
      if(e.pointerType==='touch')setSelection(s=>({...s,pointer:null,focus:null}));
    },
    onPointerEnter:(e:React.PointerEvent<HTMLButtonElement>)=>{if(e.pointerType!=='touch')update('pointer',id);},
    onPointerLeave:(e:React.PointerEvent<HTMLButtonElement>)=>{if(e.pointerType!=='touch')update('pointer',null);},
    onFocus:()=>{if(pointerType.current!=='touch')update('focus',id);},
    onBlur:()=>update('focus',null),
    onClick:()=>{
      if(pointerType.current==='touch'&&canInteract())setSelection(s=>({...(s.replay===replay?s:empty(replay)),latched:s.latched===id?null:id,focus:null}));
    },
    onKeyDown:(e:React.KeyboardEvent<HTMLButtonElement>)=>{
      pointerType.current='keyboard';
      if(e.key==='Escape'){e.preventDefault();setSelection(empty(replay));}
      else if(e.key==='Enter'||e.key===' '){e.preventDefault();update('focus',id);}
    },
  });
  const glossaryVisible=eligible&&config.glossary.ranges.some(r=>props.frame>=r.firstFrame&&props.frame<=r.lastFrame);
  const companion=<>{visible?<section aria-label={language==='es'?'Explorar fracciones':'Explore fractions'} style={{padding:12}}>
      <p>{language==='es'?'Selecciona una fracción para ver la respuesta.':'Select a fraction to see the feedback.'}</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:8,maxWidth:480}}>
        {config.controls.map((c,index)=><button type="button" key={c.sourceCharacterId} {...events(c.sourceCharacterId)}
          disabled={!ready||Boolean(failure)} data-hover-choice={c.sourceCharacterId} aria-label={label(index)}
          aria-pressed={ids.includes(c.sourceCharacterId)} style={{minHeight:44,font:'600 1rem system-ui',padding:8}}>{c.fraction}</button>)}
      </div>
      <p aria-live="polite" aria-atomic="true" data-hover-feedback style={{height:72,overflowY:'auto',lineHeight:'24px'}}>
        {ids.map(id=>{const index=config.controls.findIndex(c=>c.sourceCharacterId===id);
          return `${label(index)} — ${rightSourceCharacters.has(id)?(language==='es'?'Correcto.':'Correct.'):(language==='es'?'Inténtalo de nuevo.':'Try again.')}`;}).join(' ')}
      </p>
    </section>:null}
    {glossaryVisible?<button type="button" data-nms-l02-glossary="fraction"
      disabled={!ready||Boolean(failure)||!props.onLessonHostRequest} style={{minHeight:44,padding:'8px 16px',margin:12}}
      onClick={event=>{if(config.glossary.ranges.some(r=>currentFrame()>=r.firstFrame&&currentFrame()<=r.lastFrame))props.onLessonHostRequest?.({type:'open-glossary',entryId:config.glossary.entryId},{trigger:event.currentTarget});}}>
      {config.glossary.labels[language]}</button>:null}</>;
  return <div data-nms-l02-hover-candidate={config.animationId} data-source-frame={props.frame}
    data-hover-ids={idKey} data-hover-ready={ready&&!failure?'true':'false'}>
    <div style={{position:'relative',width:'100%',maxWidth:800,aspectRatio:'4 / 3'}}>
      <canvas ref={canvas} width={800} height={600} aria-label={language==='es'?'Representaciones de fracciones':'Fraction representations'}
        style={{display:'block',width:'100%',height:'100%'}} />
      {visible&&config.controls.map((c,index)=><button key={c.sourceCharacterId} type="button" disabled={!ready||Boolean(failure)}
        data-hover-overlay={c.sourceCharacterId} aria-label={label(index)} aria-pressed={ids.includes(c.sourceCharacterId)}
        {...events(c.sourceCharacterId)}
        style={{position:'absolute',left:`${c.hitBounds.x/8}%`,top:`${c.hitBounds.y/6}%`,width:`${c.hitBounds.width/8}%`,
          height:`${c.hitBounds.height/6}%`,padding:0,border:0,background:'transparent',cursor:'pointer',borderRadius:3}} />)}
    </div>
    {failure?<p role="alert">{language==='es'?'No se pudo cargar la animación.':'The animation could not be loaded.'}</p>:null}
    {companionTarget?createPortal(companion,companionTarget):companion}
  </div>;
}
