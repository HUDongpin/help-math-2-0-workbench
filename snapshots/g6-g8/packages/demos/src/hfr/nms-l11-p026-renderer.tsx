import React,{useCallback,useEffect,useId,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import type {HfrRendererProps} from './renderer';
import {HfrPlayer} from './player';
import {LessonRuntime} from './lesson-runtime';
import {beginPageSession,isPageSessionCurrent,resolvePageSessionData,hfrSessionFailureCode,type PageSessionLease} from './session';
import {assertHfrMetaMatchesData} from './meta';
import {bridgeHostCall} from './host-bridge';
import {P026PlayerConnection,type P026SourceButtonControl} from './nms-l11-p026-player-connection';
import {P026NativeLayer} from './nms-l11-p026-native-layer';
import type {P026NativeFrame} from './nms-l11-p026-native';
import type {P026GlossaryHold} from './nms-l11-p026-practice-host';
import {P026_REDUCED} from './nms-l11-p026-reduced-motion';
import type {HfrTextIdentity} from './hfr-native-text';
import type {PageData} from './types';

/** Notify the existing player resize path when DPR changes without a CSS resize.
 * Re-arm at each DPR, and retire the exact listener with this renderer effect.
 * HfrPlayer retains its CSS-times-DPR allocation and cap; no playhead is owned here. */
export function observeP026DevicePixelRatio(view:Window|null,onChange:()=>void):()=>void{
 if(!view||typeof view.matchMedia!=='function')return()=>{};
 let disposed=false,query:MediaQueryList|null=null;
 const watch=()=>{query?.removeEventListener('change',change);query=view.matchMedia(`(resolution: ${view.devicePixelRatio||1}dppx)`);query.addEventListener('change',change);};
 function change(){if(disposed)return;watch();onChange();}
 watch();
 return()=>{disposed=true;query?.removeEventListener('change',change);};
}

/** Pan only the visual scrollport; never advance or mutate the lesson source. */
export function panP026Figure(port:Pick<HTMLDivElement,'scrollLeft'|'scrollWidth'|'clientWidth'>|null,direction:-1|1):void{
 if(!port)return;
 const maximum=Math.max(0,port.scrollWidth-port.clientWidth);
 port.scrollLeft=Math.max(0,Math.min(maximum,port.scrollLeft+direction*port.clientWidth*.8));
}

/** P026 source drag practice uses the same maintained player/session/audio engine. */
export function P026Renderer(props:HfrRendererProps){
 const {meta,page,lang,scenario,replay=0,seed,audioEnabled=false,paused=false,reducedMotion=false,volume=1,rendererLessonSession}=props;
 const actualHostPaused=props.hostPaused??paused,effectiveSeed=Number.isSafeInteger(seed)&&seed!>=0?seed!:12345;
 const figureScroll=useRef<HTMLDivElement>(null),figureId=useId()+'-p026-figure';
 const canvas=useRef<HTMLCanvasElement>(null),labels=useRef<HTMLDivElement>(null),title=useRef<HTMLDivElement>(null),diagnostics=useRef<HTMLDivElement>(null),playerRef=useRef<HfrPlayer|null>(null),connection=useRef<P026PlayerConnection|null>(null);
 const identity=useRef<HfrTextIdentity>({lang,scenario,seed:effectiveSeed,replay});identity.current={lang,scenario,seed:effectiveSeed,replay};
 const live=useRef(props);live.current=props;
 const held=useRef<{source:P026GlossaryHold;player:HfrPlayer;pauseObserved:boolean}|null>(null),[denied,setDenied]=useState(false),[frame,setFrame]=useState<P026NativeFrame|null>(null),[sourceButtons,setSourceButtons]=useState<readonly P026SourceButtonControl[]>([]),[status,setStatus]=useState<'loading'|'ready'|'failed'>('loading'),[error,setError]=useState<string|null>(null);
 const lastNarration=useRef(0),narrationIntent=useRef<'play'|'stop'>(props.narrationRequest?.action??'play');
 useEffect(()=>{
  const node=canvas.current;if(!node)return;let disposed=false,lease:PageSessionLease|null=null,lastReport='',sourceTickPending=false;
  const current=()=>!disposed&&Boolean(lease&&isPageSessionCurrent(lease));
  const report=()=>{const p=playerRef.current,c=connection.current;if(!current()||!p?.rt||!c?.current())return;const progress=p.progress(),value={frame:progress.frame,frameCount:progress.frameCount,frameDomain:progress.domain,fps:meta.stage.fps,settled:progress.settled,complete:c.product!.adapter.snapshot().complete,lessonFinished:false,narration:p.narrationState()};if(diagnostics.current){Object.assign(diagnostics.current.dataset,{hfrRootFrame:String(p.rt.page_.frame),hfrProgressFrame:String(progress.frame),hfrTickCount:String(p.rt.tickCount),hfrAudioContextState:p.audio?.ctx.state??'unavailable',hfrNarrationState:p.narrationState(),hfrRunning:String(p.running)});}const key=JSON.stringify(value);if(key!==lastReport){lastReport=key;live.current.onRendererPlayback?.(value);}};
  const c=new P026PlayerConnection({player:()=>playerRef.current,current,identity:()=>identity.current,controls:()=>({blocked:Boolean(document.hidden||(live.current.hostPaused??live.current.paused)||held.current),reduced:Boolean(live.current.reducedMotion)}),frame:f=>{if(current()){setFrame(f);setSourceButtons(c.sourceButtons());if(!f)for(const layer of[labels.current,title.current])if(layer)layer.style.visibility='hidden';}},glossary:(hold,trigger)=>{if(hold.request.type!=='open-glossary')throw Error('P026_GLOSSARY_REQUEST_REQUIRED');const p=playerRef.current!;p.pause();held.current={source:hold,player:p,pauseObserved:false};const decision=live.current.onLessonHostRequest?.(hold.request,{trigger:trigger??node});setDenied(!(decision?.status==='allowed'&&decision.state.currentAnimationId===meta.key&&decision.state.glossaryEntryId===hold.request.entryId));}});
  connection.current=c;
  const p=new HfrPlayer(node,{onRuntimeActivated:(rt,hash)=>c.activate(rt,hash),sourceButtonInput:(rt,o)=>c.input(rt,o),onSourcePointerMutation:rt=>{try{c.pointerMutated(rt);}catch(e){p.destroy();p.opts.onError?.(e);}},onSourceButtonRelease:(rt,o,_point,release)=>{try{c.release(rt,o,release);}catch(e){p.destroy();p.opts.onError?.(e);}},onSourceTick:()=>{const rt=p.rt;if(!current()||!lease||playerRef.current!==p||!rt||!c.current(rt)||meta.key!=='shared-nms002-l11-p026'||rt.page.source.sha256!==meta.sourceSha256)return;node.dispatchEvent(new CustomEvent('helpmath:p026-source-tick',{bubbles:true,detail:Object.freeze({kind:'p026-source-tick-v1',animationId:meta.key,sourceSha256:meta.sourceSha256,tick:rt.tickCount,rootFrame:rt.page_.frame,sessionToken:lease.token})}));sourceTickPending=true;},onBeforeRender:()=>c.beforeRender(),shouldSuppressText:(rt,o)=>c.suppress(rt,o),onTick:()=>{if(sourceTickPending){sourceTickPending=false;flushSync(()=>c.project());}else c.project();report();},onMediaStateChange:report,onHost:call=>{if(!current())return;const action=bridgeHostCall(meta,call);if(action.kind==='request')live.current.onLessonHostRequest?.(action.request);},onError:e=>{if(!current())return;c.dispose();setError(hfrSessionFailureCode(e));setStatus('failed');}});
  playerRef.current=p;held.current=null;setDenied(false);setFrame(null);setSourceButtons([]);setStatus('loading');setError(null);
  const resize=()=>{p.resize();const w=node.width,h=node.height,scale=Math.min(w/800,h/600);for(const layer of [labels.current])if(layer&&w&&h)Object.assign(layer.style,{left:`${(w-800*scale)/2/w*100}%`,top:`${(h-600*scale)/2/h*100}%`,width:`${800*scale/w*100}%`,height:`${600*scale/h*100}%`});};
  (async()=>{if(!rendererLessonSession)throw Error('HFR_SESSION_HOST_SCOPE_MISSING');lease=beginPageSession({hostScope:rendererLessonSession,lessonKey:meta.lessonKey,pageKey:meta.key,sourceSha256:meta.sourceSha256,compiler:meta.compiler,seed:effectiveSeed},()=>new LessonRuntime());const response=await fetch(meta.dataUrl);if(!response.ok)throw Error('P026_DATA_RESPONSE');const bytes=await response.arrayBuffer(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');if(!current())return;let data=JSON.parse(new TextDecoder().decode(bytes)) as PageData;assertHfrMetaMatchesData(meta,data);data=resolvePageSessionData(lease,data,page,hash);const loaded=await p.load(data,page,meta.dataUrl.replace(/[^/]*$/u,''),{audio:audioEnabled,reducedMotionState:reducedMotion?P026_REDUCED:undefined,session:lease,dataSha256:hash,progressTimeline:114,seed:effectiveSeed});if(!current()||!loaded||!c.product)return;await c.product.prepareNative();if(!current()||!c.current())return;resize();p.setVolume(live.current.volume??1);p.setSpanish((live.current.audioLanguage??live.current.lang)==='es');if(narrationIntent.current==='stop')p.stopNarration();setStatus('ready');p.redraw();if(!live.current.paused&&!live.current.reducedMotion&&!document.hidden&&!held.current)p.start();report();})().catch(e=>{if(!disposed&&playerRef.current===p){c.dispose();p.destroy();setFrame(null);setError(hfrSessionFailureCode(e));setStatus('failed');}});
  const observer=new ResizeObserver(resize);observer.observe(node);
  const stopDpr=observeP026DevicePixelRatio(node.ownerDocument.defaultView,resize);
  return()=>{disposed=true;stopDpr();observer.disconnect();c.dispose();p.destroy();if(connection.current===c)connection.current=null;if(playerRef.current===p)playerRef.current=null;held.current=null;};
 },[meta,page,rendererLessonSession,effectiveSeed,replay,audioEnabled,reducedMotion]);
 const resume=()=>{const hold=held.current,c=connection.current,p=playerRef.current;if(!hold||!c?.current()||hold.player!==p||!c.product!.adapter.resumeHeldSource(hold.source))return false;held.current=null;setDenied(false);p!.redraw();return true;};
 useEffect(()=>{const p=playerRef.current;if(!p||status!=='ready')return;const h=held.current;if(h){if(actualHostPaused)h.pauseObserved=true;if(!actualHostPaused&&h.pauseObserved&&!document.hidden){if(!resume())return;}else{p.pause();return;}}if(paused||reducedMotion||document.hidden)p.pause();else p.start();},[paused,actualHostPaused,reducedMotion,status]);
 useEffect(()=>{if(status==='ready')playerRef.current?.setVolume(volume);},[volume,status]);
 useEffect(()=>{if(status==='ready')playerRef.current?.setSpanish((props.audioLanguage??lang)==='es');},[props.audioLanguage,lang,status]);
 useEffect(()=>{const r=props.narrationRequest,p=playerRef.current;if(!r||r.requestId===lastNarration.current)return;if(r.action==='stop'){lastNarration.current=r.requestId;narrationIntent.current='stop';p?.stopNarration();}else if(p&&status==='ready'&&!paused&&!reducedMotion&&!document.hidden&&!held.current){lastNarration.current=r.requestId;narrationIntent.current='play';void p.resumeAudio();}},[props.narrationRequest,status,paused,reducedMotion]);
 useEffect(()=>{const change=()=>{const p=playerRef.current;if(!p||status!=='ready')return;if(document.hidden)p.pause();else if(!live.current.paused&&!live.current.reducedMotion&&!held.current)p.start();};document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change);},[status]);
 // The host owns modal state; this source-bound page keeps its keyboard focus inside the active glossary.
 useEffect(()=>{const keydown=(event:KeyboardEvent)=>{const h=held.current,c=connection.current,p=playerRef.current;
  if(!h||!c?.current()||h.player!==p||h.source.runtime!==p?.rt||h.source.request.type!=='open-glossary')return;
  const dialog=document.querySelector<HTMLElement>(`[role="dialog"][data-glossary-entry-id="${h.source.request.entryId}"]`);if(!dialog)return;
  if(event.key==='Tab'){const close=dialog.querySelector<HTMLButtonElement>('button:not(:disabled)');if(close){event.preventDefault();event.stopPropagation();close.focus();}}
  else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();live.current.onLessonHostRequest?.({type:'close-glossary'});}
 };document.addEventListener('keydown',keydown,true);return()=>document.removeEventListener('keydown',keydown,true);},[]);
 const committed=useCallback((f:P026NativeFrame|null)=>{const p=playerRef.current,ok=connection.current?.commit(f);for(const layer of [labels.current,title.current])if(layer)layer.style.visibility=ok?'visible':'hidden';if(p?.rt)p.renderer.render(p.rt);},[]);
 useEffect(()=>{playerRef.current?.redraw();},[lang,scenario]);
 return <div ref={diagnostics} className="faithful-stage-wrap hfr-stage" data-hfr-page={meta.key} data-hfr-source-sha256={meta.sourceSha256} data-hfr-compiler={meta.compiler} data-hfr-seed={effectiveSeed} data-hfr-source-presentation={reducedMotion?'audited-readable-static-state':'source-clock'} data-hfr-session-error={error??undefined} data-hfr-native-text-status={frame?.snapshot.status??(status==='loading'?'loading':'retained-source')}>
  <div ref={title} data-p026-native-host="title" style={{visibility:'hidden'}}><P026NativeLayer frame={frame} controls={sourceButtons} connection={connection.current} blocked={actualHostPaused||Boolean(held.current)} labelsHost={labels.current} onCommitted={committed}/></div>
  <div role="group" aria-label={(props.uiLanguage??lang)==='es'?'Mover diagrama':'Move diagram'} data-p026-diagram-pan="true" style={{display:'flex',flexWrap:'wrap',gap:'.5rem',marginBlock:'.5rem'}}>
   <button type="button" aria-controls={figureId} aria-label={(props.uiLanguage??lang)==='es'?'Desplazar el diagrama a la izquierda':'Move diagram left'} disabled={status!=='ready'||Boolean(held.current)} onClick={()=>panP026Figure(figureScroll.current,-1)} style={{minHeight:44,minWidth:44,maxWidth:'100%',padding:'.5rem .75rem',font:'inherit'}}>{(props.uiLanguage??lang)==='es'?'← Izquierda':'← Left'}</button>
   <button type="button" aria-controls={figureId} aria-label={(props.uiLanguage??lang)==='es'?'Desplazar el diagrama a la derecha':'Move diagram right'} disabled={status!=='ready'||Boolean(held.current)} onClick={()=>panP026Figure(figureScroll.current,1)} style={{minHeight:44,minWidth:44,maxWidth:'100%',padding:'.5rem .75rem',font:'inherit'}}>{(props.uiLanguage??lang)==='es'?'Derecha →':'Right →'}</button>
  </div>
  <div ref={figureScroll} id={figureId} data-hfr-vocabulary-figure-scroll="true" style={{overflowX:'auto',maxWidth:'100%'}}><div style={{position:'relative',minWidth:'50rem',width:'max(100%, 50rem)'}}><canvas ref={canvas} className="faithful-stage" width={800} height={600} tabIndex={actualHostPaused?-1:0} data-canvas-status={status} aria-label={lang==='es'?'Página de la lección':'Lesson page'} style={{visibility:status==='ready'?'visible':'hidden',touchAction:'none'}}/><div ref={labels} data-p026-native-host="labels" style={{position:'absolute',inset:0,visibility:'hidden',pointerEvents:'none'}}/></div></div>
  <style>{'[data-hfr-page="shared-nms002-l11-p026"][data-hfr-source-sha256="a1b2d1ad691061ca206dab4b868eb9ffede0f880cbc58d1888db2896fe0fb4ea"] [data-p026-native-host], [data-hfr-page="shared-nms002-l11-p026"][data-hfr-source-sha256="a1b2d1ad691061ca206dab4b868eb9ffede0f880cbc58d1888db2896fe0fb4ea"] [data-p026-native-host] *{transition-property:none!important}'}</style>
  {denied?<p role="status">{lang==='es'?'El glosario no está disponible.':'The glossary is unavailable.'} <button type="button" disabled={actualHostPaused} onClick={()=>{if(!document.hidden&&resume()&&!paused&&!reducedMotion)playerRef.current?.start();}}>{lang==='es'?'Continuar':'Continue'}</button></p>:null}
  {status==='failed'?<p role="alert">{lang==='es'?'Esta página no se pudo cargar.':'This page could not be loaded.'}</p>:null}
 </div>;
}
