'use client';
import {useEffect,useRef,useState} from 'react';
import type {SourceStaticCanvasCandidateConfig} from './source-static-canvas-candidate';
import {prepareFrozenGlossaryCanvas} from './frozen-glossary-canvas-preparation';
import {visibleFrozenGlossaryControls,type FrozenGlossaryControl} from './frozen-calibration-glossary-candidate';
import {SourceLoopAudioSession,type SourceLoopSessionOptions} from './source-loop-audio-session-v1';
import {SourceStreamCycleClockV2,type SourceStreamCycleClockPlan} from './source-stream-cycle-clock-v2';
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import {LessonAnimationTitleV1} from './lesson-animation-title-v1';
import './source-canvas-loop-v1.css';
export interface SourceCanvasLoopConfig {
 readonly animationId:string; readonly mainId:number; readonly title:string;
 readonly canvas:SourceStaticCanvasCandidateConfig; readonly clockPlan:SourceStreamCycleClockPlan;
 readonly sa:DecodedSourceStreamBinding; readonly controls:readonly (FrozenGlossaryControl & {readonly rect:Readonly<{left:number;top:number;width:number;height:number}>})[];
 readonly terms:readonly {id:string;sourceKeyAttribute:string;labels:Readonly<{en:string;es:string}>;definitions:Readonly<{en:string;es:string}>;sourceEntrySha256:Readonly<{en:string;es:string}>}[];
}
export type SourceCanvasLoopSession=SourceLoopAudioSession<number,string>;
export interface SourceCanvasLoopControls {setPaused(value:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void;closeGlossary():void;inspect(frame:number):boolean;}
export interface SourceCanvasLoopPlayerProps {
 source:SourceCanvasLoopConfig;seed:number;uiLanguage:'en'|'es';paused?:boolean;volume?:number;reducedMotion?:boolean;
 readAudio:SourceLoopSessionOptions<number>['load'];connectControls?:(c:SourceCanvasLoopControls)=>()=>void;
 onState?:(s:ReturnType<SourceCanvasLoopSession['snapshot']>)=>void;onPaused?:(v:boolean)=>void;onReplay?:()=>void;onGlossary?:(term:string,trigger:HTMLButtonElement)=>void;
}
/** The maintained session owns main/SA audio and glossary holds. Source Canvas drawing is synchronous at the clock's held frame. */
export function SourceCanvasLoopPlayerV1(props:SourceCanvasLoopPlayerProps){
 const latest=useRef(props);latest.current=props;const engine=useRef<SourceCanvasLoopSession|null>(null),canvas=useRef<HTMLCanvasElement>(null),trigger=useRef<HTMLButtonElement|null>(null);
 const [snapshot,setSnapshot]=useState<ReturnType<SourceCanvasLoopSession['snapshot']>|null>(null),[drawing,setDrawing]=useState<'loading'|'ready'|'failed'>('loading'),[renderFailure,setRenderFailure]=useState<string|null>(null);
 useEffect(()=>{
  const source=latest.current.source;let active=true,raf:number|null=null,last='',lastFrame=0,prepared=false,failed=false;
  const paint=(frame:number)=>{
   if(!active||failed||!prepared||!canvas.current)return false;
   if(frame===lastFrame)return true;
   try{const asset=window.HELP_MATH_CANVAS_ASSETS?.[source.animationId];if(!asset)throw Error('source-canvas-missing');
    const state=asset.render(canvas.current,{frame,scenario:'source-static-frame',lang:'en',seed:0}) as {localFrame?:number;frameDomain?:string};
    if(state?.localFrame!==frame||state.frameDomain!==source.canvas.mainFrameDomain||canvas.current.dataset.flashFrame!==String(frame))throw Error('source-canvas-frame-mismatch');
    lastFrame=frame;setDrawing('ready');return true;
   }catch(error){failed=true;setDrawing('failed');setRenderFailure(error instanceof Error?error.message:String(error));return false;}
  };
  const update=()=>{if(!active||!canvas.current?.isConnected)return;const s=session.snapshot();if(prepared&&!failed&&!paint(s.frame)){session.pause();latest.current.onPaused?.(true);return;}
   const key=JSON.stringify(s);if(key!==last){last=key;setSnapshot(s);latest.current.onState?.(s);}
   if(s.phase==='playing'&&!failed&&raf===null)raf=requestAnimationFrame(tick);
  };
  const tick=()=>{raf=null;session.tick();update();};
  const preparation=prepareFrozenGlossaryCanvas(source.canvas).then(()=>{if(!active)return;prepared=true;if(!paint(session.snapshot().frame))session.pause();update();}).catch(error=>{if(!active)return;failed=true;setDrawing('failed');setRenderFailure(error instanceof Error?error.message:String(error));session.pause();latest.current.onPaused?.(true);});
  const session=new SourceLoopAudioSession<number,string>({mainId:source.mainId,clockPlan:source.clockPlan,sa:source.sa,initialState:()=>({mainFrame:1,cycle:0,replay:0,glossary:null}),termsAtFrame:f=>visibleFrozenGlossaryControls(source.controls,f).map(c=>c.sourceKeyAttribute)},
   {load:async(id,signal)=>{await preparation;if(!active||signal.aborted||failed||!prepared)throw Error('source-canvas-not-ready');return latest.current.readAudio(id,signal);},changed:update,makeClock:(plan,commit)=>new SourceStreamCycleClockV2(plan,{commitHeldFrame:f=>paint(f)&&commit(f)})});
  engine.current=session;session.setVolume(latest.current.volume??.8);update();
  const play=()=>{void session.play().then(()=>{if(active)latest.current.onPaused?.(!['playing','loading','start-pending'].includes(session.snapshot().phase));});};
  const controls:SourceCanvasLoopControls={setPaused(value){if(!active)return;latest.current.onPaused?.(value);if(value)session.pause();else play();},replay(){if(!active||failed)return false;latest.current.onReplay?.();latest.current.onPaused?.(false);void session.replay();return true;},narration(action){if(!active)return;latest.current.onPaused?.(action==='stop');if(action==='stop')session.pause();else play();},stop(){if(active)void session.close();},closeGlossary(){session.closeGlossary();latest.current.onPaused?.(true);},inspect(frame){return prepared&&!failed&&session.inspect(frame);}};
  const disconnect=latest.current.connectControls?.(controls),hidden=()=>{if(document.hidden){session.pause();latest.current.onPaused?.(true);}};document.addEventListener('visibilitychange',hidden);
  return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);disconnect?.();document.removeEventListener('visibilitychange',hidden);if(engine.current===session)engine.current=null;void session.close();};
 },[props.source,props.seed]);
 useEffect(()=>{engine.current?.setVolume(props.volume??.8);},[props.volume]);useEffect(()=>{if(props.paused)engine.current?.pause();},[props.paused]);
 const s=snapshot,state=s?.state??{mainFrame:1,cycle:0,replay:0,glossary:null},es=props.uiLanguage==='es',visible=props.source.controls.filter(c=>visibleFrozenGlossaryControls([c],state.mainFrame).length>0),playing=['playing','loading','start-pending'].includes(s?.phase??'');
 const term=props.source.terms.find(t=>t.sourceKeyAttribute===state.glossary),disabled=drawing!=='ready'||Boolean(s?.loading)||s?.mode==='sa'||Boolean(state.glossary);
 // The host closes its overlay before React re-enables these native controls.
 // Restore focus after that commit, while keeping a departed page untouched.
 useEffect(()=>{if(state.glossary||!trigger.current)return;const target=trigger.current;trigger.current=null;if(target.isConnected&&!target.disabled)target.focus({preventScroll:true});},[state.glossary]);
 const titleParts=props.source.title.split(':');
 return <section className="source-canvas-loop-v1" data-source-loop-id={props.source.animationId} data-source-loop-phase={s?.phase??'initializing'} data-source-loop-frame={state.mainFrame} data-source-loop-cycle={state.cycle} data-source-loop-replay={state.replay} data-source-loop-audio-phase={s?.audioPhase??'idle'} data-source-loop-audio-mode={s?.mode??'main'} data-source-loop-decoded-sample={s?.decodedSample??0} data-source-loop-glossary={state.glossary??''} data-canvas-status={drawing}>
  <LessonAnimationTitleV1 courseTitle={titleParts[0]} activityTitle={titleParts.slice(1).join(':').trim()} language="en"/>
  <div className="source-canvas-loop-v1__scroll" tabIndex={0} role="region" aria-label={es?'Diagrama de la actividad. Desplázate horizontalmente si es necesario.':'Activity diagram. Scroll horizontally if needed.'}>
   <div className="source-canvas-loop-v1__stage">
    <canvas ref={canvas} width={props.source.canvas.stage.width} height={props.source.canvas.stage.height} aria-label={props.source.title} role="img"/>
    {visible.map(c=><button key={c.sourceCharacterId} type="button" className="source-canvas-loop-v1__hotspot" tabIndex={-1} aria-hidden="true" title={c.labels[props.uiLanguage]} disabled={disabled} data-source-hit-character={c.sourceCharacterId} style={{left:`${c.rect.left/8}%`,top:`${c.rect.top/6}%`,width:`${c.rect.width/8}%`,height:`${c.rect.height/6}%`}} onClick={event=>{const button=event.currentTarget.closest('section')?.querySelector<HTMLButtonElement>(`button[data-source-character-id="${c.sourceCharacterId}"]`);if(!button||!engine.current?.openGlossary(c.sourceKeyAttribute))return;trigger.current=button;latest.current.onPaused?.(true);latest.current.onGlossary?.(c.sourceKeyAttribute,button);}}/>)}
   </div>
  </div>
  <div className="source-canvas-loop-v1__controls" lang={props.uiLanguage}>
   {visible.map(c=><button key={c.sourceCharacterId} type="button" data-source-character-id={c.sourceCharacterId} data-source-key-attribute={c.sourceKeyAttribute} disabled={disabled} onClick={event=>{if(!engine.current?.openGlossary(c.sourceKeyAttribute))return;trigger.current=event.currentTarget;latest.current.onPaused?.(true);latest.current.onGlossary?.(c.sourceKeyAttribute,event.currentTarget);}}>{c.labels[props.uiLanguage]}</button>)}
   {!props.connectControls&&<><button type="button" disabled={Boolean(state.glossary)||drawing!=='ready'} onClick={()=>playing?engine.current?.pause():void engine.current?.play()}>{playing?(es?'Pausa':'Pause'):(es?'Reanudar':'Resume')}</button><button type="button" disabled={drawing!=='ready'} onClick={()=>{latest.current.onReplay?.();void engine.current?.replay();}}>{es?'Repetir':'Replay'}</button></>}
   <button type="button" data-source-loop-spanish-audio="true" disabled={Boolean(state.glossary)||Boolean(s?.loading)||drawing!=='ready'} onClick={()=>{latest.current.onPaused?.(false);void engine.current?.spanishAudio();}}>{es?'Audio en español':'Spanish Audio'}</button>
   {s?.mode==='sa'&&<button type="button" data-source-loop-return="true" onClick={()=>{engine.current?.returnMain();latest.current.onPaused?.(true);}}>{es?'Volver a la animación':'Return to animation'}</button>}
  </div>
  {term&&!props.onGlossary&&<SourceLoopDialog term={term} language={props.uiLanguage} trigger={trigger.current} close={()=>{engine.current?.closeGlossary();latest.current.onPaused?.(true);}}/>}
  {(renderFailure||s?.failure)&&<p role="alert" lang={props.uiLanguage}>{es?'No se pudo cargar la actividad. Inténtalo de nuevo.':'The activity could not load. Please try again.'}</p>}
 </section>;
}
function SourceLoopDialog({term,language,trigger,close}:{term:SourceCanvasLoopConfig['terms'][number];language:'en'|'es';trigger:HTMLButtonElement|null;close:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null),button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{dialog.current?.showModal();heading.current?.focus();return()=>{dialog.current?.close();if(trigger?.isConnected)trigger.focus({preventScroll:true});};},[term,trigger]);
 return <dialog ref={dialog} className="source-canvas-loop-v1__dialog" lang={language} aria-label={term.labels[language]} data-source-entry-sha256={term.sourceEntrySha256[language]} onCancel={e=>{e.preventDefault();close();}} onKeyDown={e=>{if(e.key==='Tab'){e.preventDefault();button.current?.focus();}}}><h2 ref={heading} tabIndex={-1}>{term.labels[language]}</h2><p>{term.definitions[language]}</p><p>{language==='es'?'La animación seguirá en pausa al cerrar.':'The animation will stay paused when you close.'}</p><button ref={button} type="button" onClick={close}>{language==='es'?'Cerrar':'Close'}</button></dialog>;
}
