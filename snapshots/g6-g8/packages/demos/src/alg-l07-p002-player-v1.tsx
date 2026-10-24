'use client';
import {useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import {AlgL07P002Session,type AlgL07P002SessionDependencies} from './alg-l07-p002-session-v1';
import {algL07P002Frame} from './alg-l07-p002-state-v1';
import {AlgL07P002Presentation,algL07P002Commit} from './alg-l07-p002-presentation-v1';
export interface AlgL07P002Controls{setPaused(paused:boolean):void;replay():boolean;
  narration(action:'play'|'stop'):void;stop():void;inspectFrame(frame:number):boolean;}
export interface AlgL07P002PlayerProps{
  seed:number;uiLanguage:'en'|'es';paused?:boolean;volume?:number;reducedMotion?:boolean;
  readAudio:AlgL07P002SessionDependencies['read'];
  connectControls?:(controls:AlgL07P002Controls)=>()=>void;
  onState?:(state:ReturnType<AlgL07P002Session['snapshot']>)=>void;
  onPaused?:(paused:boolean)=>void;
  onReplay?:()=>void;
}
export function AlgL07P002Player(props:AlgL07P002PlayerProps){
  const latest=useRef(props);latest.current=props;const engine=useRef<AlgL07P002Session|null>(null);
  const [snapshot,setSnapshot]=useState<ReturnType<AlgL07P002Session['snapshot']>|null>(null);
  const [frame,setFrame]=useState(1);const host=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    let active=true,raf:number|null=null,lastKey='';
    const update=()=>{if(!active)return;const state=session.snapshot();const key=JSON.stringify(state);
      if(key!==lastKey){lastKey=key;setSnapshot(state);setFrame(state.frame);latest.current.onState?.(state);}
      if(state.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);
    };
    const tick=()=>{raf=null;update();};
    const session=new AlgL07P002Session({read:async signal=>{const asset=(window as Window & {HELP_MATH_CANVAS_ASSETS?:Record<string,{ready:()=>Promise<void>}>}).HELP_MATH_CANVAS_ASSETS?.['shared-alg001-l07-p002'];if(!asset)throw Error('SOURCE_ART_NOT_READY');await asset.ready();return latest.current.readAudio(signal);},changed:update,
      commitFrame(value){if(!active)return false;const canvas=host.current?.querySelector<HTMLCanvasElement>('canvas');if(!canvas)return false;flushSync(()=>setFrame(value));return algL07P002Commit(canvas,value,latest.current.seed);}});
    engine.current=session;session.setVolume(latest.current.volume??.8);update();
    const controls:AlgL07P002Controls={setPaused(value){if(!active)return;if(value)session.pause();else void session.play();
      latest.current.onPaused?.(value);},
      replay(){if(!active)return false;latest.current.onReplay?.();latest.current.onPaused?.(false);
        void session.replay();return true;},
      narration(action){if(!active)return;if(action==='stop')session.pause();else void session.play();
        latest.current.onPaused?.(action==='stop');},
      inspectFrame(value){return session.inspectFrame(value);},
      stop(){if(!active)return;latest.current.onPaused?.(true);void session.close();}};
    const disconnect=latest.current.connectControls?.(controls);
    const hide=()=>{if(document.hidden)session.pause();};document.addEventListener('visibilitychange',hide);
    return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);disconnect?.();document.removeEventListener('visibilitychange',hide);
      if(engine.current===session)engine.current=null;void session.close();};
  },[props.seed]);
  useEffect(()=>{engine.current?.setVolume(props.volume??.8);},[props.volume]);
  // Explicit host controls own play; observing an unpaused prop never starts source audio.
  useEffect(()=>{if(props.paused)engine.current?.pause();},[props.paused]);
  const reduced=props.reducedMotion??false;
  const state=algL07P002Frame(reduced?1195:frame,{frame:reduced?1195:frame,frameDomain:'sprite-452',scenario:'source-static-frame',lang:props.uiLanguage,seed:props.seed,replay:snapshot?.replay??0});
  const playing=['playing','loading','start-pending'].includes(snapshot?.phase??''),es=props.uiLanguage==='es';
  return <div ref={host} className="alg-l07-p002-player" data-p002-phase={snapshot?.phase??'initializing'} data-p002-frame={snapshot?.frame??1}
    data-p002-terminal-held={snapshot?.terminalHeld??false} data-p002-replay={snapshot?.replay??0} data-p002-audio-phase={snapshot?.audioPhase??'idle'}>
    <AlgL07P002Presentation state={state} reducedMotion={reduced}/>
    {!props.connectControls&&<div className="alg-l07-p002-player__controls">
      <button type="button" onClick={()=>playing?engine.current?.pause():void engine.current?.play()}>{playing?(es?'Pausa':'Pause'):(es?'Reproducir':'Play')}</button>
      <button type="button" onClick={()=>{latest.current.onReplay?.();void engine.current?.replay();}}>{es?'Repetir':'Replay'}</button>
    </div>}
    {snapshot?.failure&&<p role="alert">{es?'No se pudo reproducir el audio. Inténtalo de nuevo.':'Audio could not play. Please try again.'}</p>}
  </div>;
}
