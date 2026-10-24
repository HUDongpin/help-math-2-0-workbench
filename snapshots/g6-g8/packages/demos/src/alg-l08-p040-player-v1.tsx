'use client';
import{useEffect,useRef,useState}from'react';
import{P040Session,type P040AudioId}from'./alg-l08-p040-session-v1';
import{p040InitialState}from'./alg-l08-p040-state-v1';
import{AlgL08P040Presentation}from'./alg-l08-p040-presentation-v1';
export interface P040Controls{setPaused(value:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void;}
type Snapshot=ReturnType<P040Session['snapshot']>;
export interface P040PlayerProps{seed:number;uiLanguage:'en'|'es';paused?:boolean;volume?:number;readAudio:(id:P040AudioId,signal:AbortSignal)=>Promise<ArrayBuffer>;connectControls?:(controls:P040Controls)=>()=>void;onState?:(s:Snapshot)=>void;onPaused?:(v:boolean)=>void;onReplay?:()=>void;}
export function AlgL08P040Player(props:P040PlayerProps){const latest=useRef(props);latest.current=props;const engine=useRef<P040Session|null>(null),trigger=useRef<Element|null>(null),[snapshot,setSnapshot]=useState<Snapshot|null>(null);
 useEffect(()=>{let active=true,raf:number|null=null,last='';const update=()=>{if(!active)return;const s=session.snapshot(),key=JSON.stringify(s);if(key!==last){last=key;setSnapshot(s);latest.current.onState?.(s);}if(s.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);};const tick=()=>{raf=null;session.tick();update();};const session=new P040Session({seed:latest.current.seed,load:(id,signal)=>latest.current.readAudio(id,signal),changed:update});engine.current=session;session.setVolume(latest.current.volume??.8);update();
  const play=()=>{latest.current.onPaused?.(false);void session.play();},controls:P040Controls={setPaused(v){latest.current.onPaused?.(v);if(v)session.pause();else play();},replay(){if(!active)return false;latest.current.onReplay?.();latest.current.onPaused?.(false);void session.replay();return true;},narration(a){if(a==='stop')session.pause();else play();},stop(){void session.close().catch(()=>{});}};
  const disconnect=latest.current.connectControls?.(controls),hide=()=>{if(document.hidden){session.pause();latest.current.onPaused?.(true);}};document.addEventListener('visibilitychange',hide);
  return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);disconnect?.();document.removeEventListener('visibilitychange',hide);if(engine.current===session)engine.current=null;void session.close().catch(()=>{});};
 },[props.seed]);
 useEffect(()=>{engine.current?.setVolume(props.volume??.8);},[props.volume]);useEffect(()=>{if(props.paused)engine.current?.pause();},[props.paused]);const state=snapshot?.state??p040InitialState(props.seed),es=props.uiLanguage==='es',previousPopup=useRef(false);
 // Closing directions can render while audio activation disables the fieldset.
 // Keep the return pending until the trigger can receive focus again.
 useEffect(()=>{
  if(state.source.popup){previousPopup.current=true;return;}
  if(!previousPopup.current||snapshot?.loading||snapshot?.mode==='sa')return;
  const target=trigger.current;previousPopup.current=false;trigger.current=null;
  if(target?.isConnected)(target as HTMLElement).focus?.({preventScroll:true});
 },[state.source.popup,snapshot?.loading,snapshot?.mode]);
 return<div className="alg-l08-p040-player" data-p040-phase={snapshot?.phase??'initializing'} data-p040-frame={state.source.mainFrame} data-p040-epoch={state.source.epoch} data-p040-audio-mode={snapshot?.mode??'main'} data-p040-feedback={state.source.game?.feedback.map(f=>`${f.kind}:${f.frame}`).join(',')??''}>
 <fieldset disabled={snapshot?.loading||snapshot?.mode==='sa'}><AlgL08P040Presentation state={state} language={props.uiLanguage} disabled={snapshot?.loading||snapshot?.mode==='sa'} onAction={(a,b)=>{if(a.type==='show-directions')trigger.current=b??null;engine.current?.action(a);latest.current.onPaused?.(false);}}/></fieldset>
 <div className="alg-l08-p040__transport" lang={props.uiLanguage}>{!props.connectControls&&<><button type="button" disabled={snapshot?.loading} onClick={()=>{if(snapshot?.phase==='playing'){engine.current?.pause();latest.current.onPaused?.(true);}else{void engine.current?.play();latest.current.onPaused?.(false);}}}>{snapshot?.phase==='playing'?(es?'Pausa':'Pause'):(es?'Continuar':'Play')}</button><button type="button" onClick={()=>{void engine.current?.replay();latest.current.onReplay?.();}}>{es?'Reiniciar':'Replay'}</button></>}{snapshot?.mode==='sa'?<button type="button" onClick={()=>{engine.current?.returnFromSpanish();latest.current.onPaused?.(true);}}>{es?'Volver al juego':'Return to game'}</button>:<button type="button" disabled={snapshot?.loading} onClick={()=>{latest.current.onPaused?.(false);void engine.current?.spanishAudio();}}>{es?'Audio en español':'Spanish Audio'}</button>}</div>
 {snapshot?.failure&&<p role="alert">{es?'No se pudo reproducir el audio. Intenta de nuevo.':'Audio could not play. Try again.'}</p>}</div>;
}
