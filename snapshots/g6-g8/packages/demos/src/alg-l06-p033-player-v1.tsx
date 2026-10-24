import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {P033PageRuntimeV1,type P033RuntimeSnapshot} from './alg-l06-p033-audio-runtime-v1';
import {P033NativeV1} from './alg-l06-p033-native-v1';
import {p033InitialState,type P033State} from './alg-l06-p033-state-v1';
import {P033_SOURCE_SHA256} from './alg-l06-p033-source-v1';
import type {P033AudioDomain} from './alg-l06-p033-measured-bindings-v1';
export type P033CanvasRequest={frame:number;seed:0;lang:'en';feedback:null|{spriteId:number;localFrame:number;wrongAttempt?:number}};
export interface P033CanvasAsset{ready():Promise<unknown>;render(canvas:HTMLCanvasElement,request:P033CanvasRequest):{localFrame:number;frameDomain:string;rootFrame:number;audioRendered:boolean;feedback:null|{spriteId:number;localFrame:number;hostX:number}};}
export function p033VisualRequest(state:P033State):P033CanvasRequest{
 const f=state.feedback;return {frame:state.mainFrame,lang:'en',seed:0,feedback:f?{spriteId:f.spriteId,localFrame:f.frame,...(f.kind==='wrong'?{wrongAttempt:state.quizTryCount}:{})}:null};
}
export interface P033PlayerProps{
 asset:P033CanvasAsset;load:(id:P033AudioDomain,signal:AbortSignal)=>Promise<ArrayBuffer>;
 seed?:number;language?:'en'|'es';volume?:number;hidePlaybackControls?:boolean;nativeTextTarget?:HTMLElement|null;
 connectRuntime?:(runtime:P033PageRuntimeV1|null)=>void;onSnapshot?:(snapshot:P033RuntimeSnapshot)=>void;
 onGlossary?:(key:string,trigger:HTMLButtonElement)=>void;onCleanup?:()=>void;
}
export function P033PlayerV1(props:P033PlayerProps){
 const canvas=useRef<HTMLCanvasElement>(null),runtime=useRef<P033PageRuntimeV1|null>(null),callbacks=useRef(props);callbacks.current=props;
 const [state,setState]=useState(p033InitialState),[ready,setReady]=useState(false),[error,setError]=useState<string|null>(null);
 const [spanish,setSpanish]=useState(false),[loading,setLoading]=useState(false),[reduced,setReduced]=useState(false);
 useEffect(()=>{const q=window.matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(q.matches);change();q.addEventListener('change',change);return()=>q.removeEventListener('change',change);},[]);
 useEffect(()=>{
  let live=true,raf=0;setReady(false);setError(null);setState(p033InitialState());
  const commit=(s:P033State)=>{
   if(!live||!canvas.current)return false;
   try{const request=p033VisualRequest(s),r=props.asset.render(canvas.current,request);
    if(r.localFrame!==s.mainFrame||r.frameDomain!=='sprite-190'||r.rootFrame!==6||r.audioRendered!==false||
     canvas.current.getAttribute('data-flash-frame')!==String(s.mainFrame)||
     canvas.current.getAttribute('data-p033-feedback-sprite')!==(s.feedback?String(s.feedback.spriteId):'none')||
     (s.feedback?r.feedback?.spriteId!==s.feedback.spriteId||r.feedback?.localFrame!==s.feedback.frame||r.feedback?.hostX!==5:r.feedback!==null))throw Error('P033_CANVAS_READBACK');
    setState(s);return true;
   }catch(e){setError(String(e));return false;}
  };
  const page=new P033PageRuntimeV1({seed:props.seed,load:props.load,commit,onSnapshot:s=>{
   if(!live)return;setReady(s.ready);setError(s.failure);setSpanish(s.spanishSelected);setLoading(s.spanishLoading);callbacks.current.onSnapshot?.(s);
  },onCleanup:()=>callbacks.current.onCleanup?.()});runtime.current=page;callbacks.current.connectRuntime?.(page);
  const tick=()=>{if(!live)return;page.tick();raf=requestAnimationFrame(tick);};
  void props.asset.ready().then(async()=>{if(!live)return;page.setVolume(callbacks.current.volume??1);await page.start();if(live)tick();},e=>{if(live)setError(String(e));});
  return()=>{live=false;cancelAnimationFrame(raf);callbacks.current.connectRuntime?.(null);if(runtime.current===page)runtime.current=null;void page.close();};
 },[props.asset,props.load,props.seed]);
 useEffect(()=>{runtime.current?.setVolume(props.volume??1);},[props.volume]);
 const en=props.language!=='es',control:React.CSSProperties={font:'inherit',minHeight:44,padding:'.45em .65em'};
 const native=<><P033NativeV1 state={state} language={props.language} reducedMotion={reduced} disabled={!ready||spanish}
  onChoose={answer=>runtime.current?.choose(answer)} onClose={generation=>runtime.current?.closeWrong(generation)}
  onGlossary={props.onGlossary?(key,trigger)=>{runtime.current?.pause();props.onGlossary?.(key,trigger);}:undefined}/>
  {props.hidePlaybackControls&&<div data-p033-spanish-controls style={{display:'flex',flexWrap:'wrap',gap:'.5em',padding:'.75em',fontSize:'1rem'}}>
   <button type="button" data-p033-spanish-control style={control} disabled={!ready||loading} onClick={()=>void runtime.current?.startSpanish()}>{en?'Spanish Audio':'Audio en español'}</button>
   {loading&&<span role="status">{en?'Loading audio…':'Cargando audio…'}</span>}
   {spanish&&<button type="button" data-p033-return-control style={control} onClick={()=>runtime.current?.returnMain()}>{en?'Return to animation':'Volver a la animación'}</button>}
  </div>}
 </>;
 return <div data-p033-player data-p033-ready={String(ready)} data-p033-frame={state.mainFrame} data-p033-phase={state.phase} data-p033-spanish={String(spanish)} data-source-sha256={P033_SOURCE_SHA256}
  style={{width:'100%',maxWidth:800,minWidth:0,fontSize:'1rem',lineHeight:1.5,color:'#203a60'}}>
  {error&&<p role="alert">{error}</p>}
  <canvas ref={canvas} width={800} height={600} aria-label={en?'Source lesson animation':'Animación de la lección'} style={{display:'block',width:'100%',height:'auto',aspectRatio:'4 / 3'}}/>
  {!props.hidePlaybackControls&&<div style={{display:'flex',flexWrap:'wrap',gap:'.5em',padding:'.75em'}}>
   <button type="button" data-p033-play style={control} disabled={!ready||loading} onClick={()=>runtime.current?.play()}>{en?'Play':'Reproducir'}</button>
   <button type="button" data-p033-pause style={control} disabled={!ready} onClick={()=>runtime.current?.pause()}>{en?'Pause':'Pausar'}</button>
   <button type="button" data-p033-replay style={control} onClick={()=>runtime.current?.replay()}>{en?'Replay':'Repetir'}</button>
   <button type="button" data-p033-spanish style={control} disabled={!ready||loading} onClick={()=>void runtime.current?.startSpanish()}>{en?'Spanish Audio':'Audio en español'}</button>
   {spanish&&<button type="button" data-p033-return style={control} onClick={()=>runtime.current?.returnMain()}>{en?'Return to lesson':'Volver a la lección'}</button>}
  </div>}
  {props.nativeTextTarget?createPortal(native,props.nativeTextTarget):native}
 </div>;
}
