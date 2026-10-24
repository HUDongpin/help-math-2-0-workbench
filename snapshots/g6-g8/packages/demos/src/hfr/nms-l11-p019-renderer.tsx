import React,{useCallback,useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import type {HfrRendererProps} from './renderer';
import {HfrPlayer} from './player';
import {LessonRuntime} from './lesson-runtime';
import {beginPageSession,isPageSessionCurrent,resolvePageSessionData,hfrSessionFailureCode,type PageSessionLease} from './session';
import {assertHfrMetaMatchesData} from './meta';
import {bridgeHostCall} from './host-bridge';
import {P019PlayerConnection} from './nms-l11-p019-player-connection';
import {P019NativeLayer} from './nms-l11-p019-native-layer';
import type {P019NativeFrame} from './nms-l11-p019-native';
import type {P019ProductView,P019GlossaryHold} from './nms-l11-p019-product';
import {P019_REDUCED} from './nms-l11-p019-reduced-motion';
import type {HfrTextIdentity} from './hfr-native-text';
import type {PageData} from './types';

/** Page-owned practice rendering; source scripts and the maintained player own
 * all clocks, answer transitions, stream audio and actual LessonRuntime leases. */
export function P019Renderer(props:HfrRendererProps){
 const {meta,page,lang,scenario,replay=0,seed,audioEnabled=false,paused=false,reducedMotion=false,volume=1,rendererLessonSession}=props;
 const actualHostPaused=props.hostPaused??paused,effectiveSeed=Number.isSafeInteger(seed)&&seed>=0?seed:12345;
 const canvas=useRef<HTMLCanvasElement>(null),labels=useRef<HTMLDivElement>(null),title=useRef<HTMLDivElement>(null),diagnostics=useRef<HTMLDivElement>(null),playerRef=useRef<HfrPlayer|null>(null),connection=useRef<P019PlayerConnection|null>(null),committedFrame=useRef<P019NativeFrame|null>(null);
 const identity=useRef<HfrTextIdentity>({lang,scenario,seed:effectiveSeed,replay});identity.current={lang,scenario,seed:effectiveSeed,replay};
 const live=useRef(props);live.current=props;
 const held=useRef<{source:P019GlossaryHold;player:HfrPlayer;pauseObserved:boolean}|null>(null),[denied,setDenied]=useState(false),[view,setView]=useState<P019ProductView|null>(null),[status,setStatus]=useState<'loading'|'ready'|'failed'>('loading'),[error,setError]=useState<string|null>(null);
 const lastNarration=useRef(0),narrationIntent=useRef<'play'|'stop'>(props.narrationRequest?.action??'play');
 useEffect(()=>{
  const node=canvas.current;if(!node)return;let disposed=false,lease:PageSessionLease|null=null,lastReport='',sourceTickPending=false;
  const current=()=>!disposed&&Boolean(lease&&isPageSessionCurrent(lease));
  const report=()=>{const p=playerRef.current,c=connection.current;if(!current()||!p?.rt||!c?.current())return;const progress=p.progress(),state=c.product!.adapter.snapshot(),value={frame:progress.frame,frameCount:progress.frameCount,frameDomain:progress.domain,fps:meta.stage.fps,settled:progress.settled,complete:state.sourceActivityExited,lessonFinished:false,narration:p.narrationState()};if(diagnostics.current)Object.assign(diagnostics.current.dataset,{hfrRootFrame:String(p.rt.page_.frame),hfrProgressFrame:String(progress.frame),hfrTickCount:String(p.rt.tickCount),hfrAudioContextState:p.audio?.ctx.state??'unavailable',hfrNarrationState:p.narrationState(),hfrRunning:String(p.running)});const key=JSON.stringify(value);if(key!==lastReport){lastReport=key;live.current.onRendererPlayback?.(value);}};
  const c=new P019PlayerConnection({player:()=>playerRef.current,current,identity:()=>identity.current,controls:()=>({blocked:Boolean(document.hidden||(live.current.hostPaused??live.current.paused)||held.current),reduced:Boolean(live.current.reducedMotion)}),view:v=>{if(!current())return;setView(v);if(!v){committedFrame.current=null;for(const layer of [labels.current,title.current])if(layer)layer.style.visibility='hidden';}},request:r=>{live.current.onLessonHostRequest?.(r);},glossary:(hold,trigger)=>{if(hold.request.type!=='open-glossary')throw Error('P019_GLOSSARY_REQUEST_REQUIRED');const p=playerRef.current!;p.pause();held.current={source:hold,player:p,pauseObserved:false};const decision=live.current.onLessonHostRequest?.(hold.request,{trigger:trigger??node});setDenied(!(decision?.status==='allowed'&&decision.state.currentAnimationId===meta.key&&decision.state.glossaryEntryId===hold.request.entryId));}});
  connection.current=c;
  const p=new HfrPlayer(node,{
   onRuntimeActivated:(rt,hash)=>c.activate(rt,hash),sourceButtonInput:(rt,o)=>c.input(rt,o),
   onSourceButtonRelease:(rt,o,point,release)=>{c.execute(()=>c.release(rt,o,point,release,node));},
   onSourceTick:()=>{const rt=p.rt;if(!current()||!lease||playerRef.current!==p||!rt||!c.current(rt))return;c.sourceTick();node.dispatchEvent(new CustomEvent('helpmath:p019-source-tick',{bubbles:true,detail:Object.freeze({kind:'p019-source-tick-v1',animationId:meta.key,sourceSha256:meta.sourceSha256,tick:rt.tickCount,rootFrame:rt.page_.frame,sessionToken:lease.token})}));sourceTickPending=true;},
   onBeforeRender:()=>c.beforeRender(),shouldSuppressText:(rt,o)=>c.suppress(rt,o),onTick:()=>{if(sourceTickPending){sourceTickPending=false;flushSync(()=>c.project());}else c.project();report();},onMediaStateChange:report,
   onHost:call=>{if(!current())return;const action=bridgeHostCall(meta,call);if(action.kind==='request')live.current.onLessonHostRequest?.(action.request);},
   onError:e=>{if(!current())return;c.dispose();committedFrame.current=null;setError(hfrSessionFailureCode(e));setStatus('failed');}
  });
  playerRef.current=p;held.current=null;committedFrame.current=null;setDenied(false);setView(null);setStatus('loading');setError(null);
  const resize=()=>{p.resize();const w=node.width,h=node.height,scale=Math.min(w/800,h/600);if(labels.current&&w&&h)Object.assign(labels.current.style,{left:`${(w-800*scale)/2/w*100}%`,top:`${(h-600*scale)/2/h*100}%`,width:`${800*scale/w*100}%`,height:`${600*scale/h*100}%`});};
  (async()=>{
   if(!rendererLessonSession)throw Error('HFR_SESSION_HOST_SCOPE_MISSING');if(meta.completionMode!=='activity')throw Error('P019_ACTIVITY_COMPLETION_REQUIRED');
   lease=beginPageSession({hostScope:rendererLessonSession,lessonKey:meta.lessonKey,pageKey:meta.key,sourceSha256:meta.sourceSha256,compiler:meta.compiler,seed:effectiveSeed},()=>new LessonRuntime());
   const response=await fetch(meta.dataUrl);if(!response.ok)throw Error('P019_DATA_RESPONSE');const bytes=await response.arrayBuffer(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');if(!current())return;
   let data=JSON.parse(new TextDecoder().decode(bytes)) as PageData;assertHfrMetaMatchesData(meta,data);data=resolvePageSessionData(lease,data,page,hash);
   const loaded=await p.load(data,page,meta.dataUrl.replace(/[^/]*$/u,''),{audio:audioEnabled,reducedMotionState:reducedMotion?P019_REDUCED:undefined,session:lease,dataSha256:hash,progressTimeline:245,seed:effectiveSeed});
   if(!current()||!loaded||!c.product)return;await c.product.prepareNative();if(!current()||!c.current())return;resize();p.setVolume(live.current.volume??1);p.setSpanish((live.current.audioLanguage??live.current.lang)==='es');if(narrationIntent.current==='stop')p.stopNarration();setStatus('ready');p.redraw();if(!live.current.paused&&!live.current.reducedMotion&&!document.hidden&&!held.current)p.start();report();
  })().catch(e=>{if(!disposed&&playerRef.current===p){c.dispose();p.destroy();committedFrame.current=null;setView(null);setError(hfrSessionFailureCode(e));setStatus('failed');}});
  const observer=new ResizeObserver(resize);observer.observe(node);
  return()=>{disposed=true;observer.disconnect();c.dispose();p.destroy();committedFrame.current=null;if(connection.current===c)connection.current=null;if(playerRef.current===p)playerRef.current=null;held.current=null;};
 },[meta,page,rendererLessonSession,effectiveSeed,replay,audioEnabled,reducedMotion]);
 const resume=()=>{const hold=held.current,c=connection.current,p=playerRef.current;if(!hold||!c?.current()||hold.player!==p||!c.product!.resumeHeldSource(hold.source))return false;held.current=null;setDenied(false);p!.redraw();return true;};
 useEffect(()=>{const p=playerRef.current;if(!p||status!=='ready')return;const h=held.current;if(h){if(actualHostPaused)h.pauseObserved=true;if(!actualHostPaused&&h.pauseObserved&&!document.hidden){if(!resume())return;}else{p.pause();return;}}if(paused||reducedMotion||document.hidden)p.pause();else p.start();},[paused,actualHostPaused,reducedMotion,status]);
 useEffect(()=>{if(status==='ready')playerRef.current?.setVolume(volume);},[volume,status]);
 useEffect(()=>{if(status==='ready')playerRef.current?.setSpanish((props.audioLanguage??lang)==='es');},[props.audioLanguage,lang,status]);
 useEffect(()=>{const r=props.narrationRequest,p=playerRef.current;if(!r||r.requestId===lastNarration.current)return;if(r.action==='stop'){lastNarration.current=r.requestId;narrationIntent.current='stop';p?.stopNarration();}else if(p&&status==='ready'&&!paused&&!reducedMotion&&!document.hidden&&!held.current){lastNarration.current=r.requestId;narrationIntent.current='play';void p.resumeAudio();}},[props.narrationRequest,status,paused,reducedMotion]);
 useEffect(()=>{const change=()=>{const p=playerRef.current;if(!p||status!=='ready')return;if(document.hidden)p.pause();else if(!live.current.paused&&!live.current.reducedMotion&&!held.current)p.start();};document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change);},[status]);
 useEffect(()=>{const keydown=(event:KeyboardEvent)=>{const h=held.current,c=connection.current,p=playerRef.current;if(!h||!c?.current()||h.player!==p||h.source.runtime!==p?.rt||h.source.request.type!=='open-glossary')return;const dialog=document.querySelector<HTMLElement>(`[role="dialog"][data-glossary-entry-id="${h.source.request.entryId}"]`);if(!dialog)return;if(event.key==='Tab'){const close=dialog.querySelector<HTMLButtonElement>('button:not(:disabled)');if(close){event.preventDefault();event.stopPropagation();close.focus();}}else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();live.current.onLessonHostRequest?.({type:'close-glossary'});}};document.addEventListener('keydown',keydown,true);return()=>document.removeEventListener('keydown',keydown,true);},[]);
 const committed=useCallback((frame:P019NativeFrame|null)=>{const p=playerRef.current,ok=connection.current?.commit(frame);committedFrame.current=ok?frame:null;for(const layer of [labels.current,title.current])if(layer)layer.style.visibility=ok?'visible':'hidden';if(p?.rt)p.renderer.render(p.rt);},[]);
 useEffect(()=>{playerRef.current?.redraw();},[lang,scenario]);
 return <div ref={diagnostics} className="faithful-stage-wrap hfr-stage" data-hfr-page={meta.key} data-hfr-source-sha256={meta.sourceSha256} data-hfr-compiler={meta.compiler} data-hfr-seed={effectiveSeed} data-hfr-source-presentation={reducedMotion?'audited-readable-static-state':'source-clock'} data-hfr-session-error={error??undefined} data-hfr-native-text-status={view?.native?.snapshot.status??(status==='loading'?'loading':'retained-source')}>
  <div ref={title} data-p019-native-host="title" style={{visibility:'hidden'}}>{view?<P019NativeLayer frame={view.native} view={view} labelsHost={labels.current} blocked={actualHostPaused||Boolean(held.current)} onCommitted={committed} onActivate={(intent,trigger,frame)=>connection.current?.execute(()=>connection.current!.activateNative(intent,frame,trigger))}/>:null}</div>
  <div data-hfr-vocabulary-figure-scroll="true" style={{overflowX:'auto',maxWidth:'100%'}}><div style={{position:'relative',minWidth:'50rem',width:'max(100%, 50rem)'}}><canvas ref={canvas} className="faithful-stage" width={800} height={600} tabIndex={actualHostPaused?-1:0} data-canvas-status={status} aria-label={lang==='es'?'Página de la lección':'Lesson page'} style={{visibility:status==='ready'?'visible':'hidden'}}/><div ref={labels} data-p019-native-host="labels" style={{position:'absolute',inset:0,visibility:'hidden',pointerEvents:'none'}}/></div></div>
  {/* Native paint ownership changes atomically with its committed source frame.
      A global reduced-motion duration must not animate inherited visibility. */}
  <style>{'[data-hfr-page="shared-nms002-l11-p019"][data-hfr-source-sha256="2953b69c2fd544e580eda2a87153e2010177f83a229e67e0d07824b7bcdb209d"] [data-p019-native-host], [data-hfr-page="shared-nms002-l11-p019"][data-hfr-source-sha256="2953b69c2fd544e580eda2a87153e2010177f83a229e67e0d07824b7bcdb209d"] [data-p019-native-host] *{transition-property:none!important}'}</style>
  {denied?<p role="status">{lang==='es'?'El glosario no está disponible.':'The glossary is unavailable.'} <button type="button" disabled={actualHostPaused} onClick={()=>{if(!document.hidden&&resume()&&!paused&&!reducedMotion)playerRef.current?.start();}}>{lang==='es'?'Continuar':'Continue'}</button></p>:null}
  {status==='failed'?<p role="alert">{lang==='es'?'Esta página no se pudo cargar.':'This page could not be loaded.'}</p>:null}
 </div>;
}
