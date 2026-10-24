import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {P057PageRuntimeV1,type P057RuntimeSnapshot} from './alg-l06-p057-audio-runtime-v1';
import {P057NativeV1} from './alg-l06-p057-native-v1';
import {p057InitialState,type P057State} from './alg-l06-p057-state-v1';
import {P057_SOURCE_SHA256} from './alg-l06-p057-source-v1';
import {P057_MEASURED_BINDINGS,type P057AudioDomain} from './alg-l06-p057-measured-bindings-v1';
export type P057CanvasRequest={frame:number;seed:0;lang:'en';feedback:null|{spriteId:number;localFrame:number};stepBox:null|{spriteId:number;localFrame:number};helpVisible:boolean};
export interface P057CanvasAsset{ready():Promise<unknown>;render(canvas:HTMLCanvasElement,request:P057CanvasRequest):{localFrame:number;frameDomain:string;rootFrame:number;audioRendered:boolean;feedback:null|{spriteId:number;localFrame:number;hostX:number};stepBox:null|{spriteId:number;localFrame:number};helpVisible:boolean};}
export function p057VisualRequest(state:P057State):P057CanvasRequest{
 const f=state.feedback,b=state.stepBox;return {frame:state.mainFrame,lang:'en',seed:0,feedback:f?{spriteId:f.spriteId,localFrame:f.frame}:null,
  stepBox:b?{spriteId:b.spriteId,localFrame:b.frame}:null,helpVisible:state.helpVisible};
}
export interface P057PlayerProps{
 asset:P057CanvasAsset;load:(id:P057AudioDomain,signal:AbortSignal)=>Promise<ArrayBuffer>;
 seed?:number;language?:'en'|'es';volume?:number;hidePlaybackControls?:boolean;nativeTextTarget?:HTMLElement|null;
 connectRuntime?:(runtime:P057PageRuntimeV1|null)=>void;onSnapshot?:(snapshot:P057RuntimeSnapshot)=>void;
 onGlossary?:(key:string,trigger:HTMLButtonElement)=>void;onCleanup?:()=>void;
}
export function P057PlayerV1(props:P057PlayerProps){
 const canvas=useRef<HTMLCanvasElement>(null),runtime=useRef<P057PageRuntimeV1|null>(null),callbacks=useRef(props);callbacks.current=props;
 const [state,setState]=useState(p057InitialState),[ready,setReady]=useState(false),[error,setError]=useState<string|null>(null);
 const [spanish,setSpanish]=useState(false),[loading,setLoading]=useState(false);
 useEffect(()=>{
  let live=true,raf=0;setReady(false);setError(null);setState(p057InitialState());
  const commit=(s:P057State)=>{
   if(!live||!canvas.current)return false;
   try{const request=p057VisualRequest(s),r=props.asset.render(canvas.current,request);
    if(r.localFrame!==s.mainFrame||r.frameDomain!=='sprite-312'||r.rootFrame!==6||r.audioRendered!==false||
     canvas.current.getAttribute('data-flash-frame')!==String(s.mainFrame)||
     JSON.stringify(r.stepBox)!==JSON.stringify(request.stepBox)||r.helpVisible!==s.helpVisible||
     (s.feedback?r.feedback?.spriteId!==s.feedback.spriteId||r.feedback?.localFrame!==s.feedback.frame||r.feedback?.hostX!==5:r.feedback!==null))throw Error('P057_CANVAS_READBACK');
    setState(s);return true;
   }catch(e){setError(String(e));return false;}
  };
  const page=new P057PageRuntimeV1({seed:props.seed,load:(id,signal)=>{if(!Object.hasOwn(P057_MEASURED_BINDINGS,id))throw Error("P057_UNKNOWN_AUDIO");return props.load(id as P057AudioDomain,signal);},commit,onSnapshot:s=>{
   if(!live)return;setReady(s.ready);setError(s.failure);setSpanish(s.spanishSelected);setLoading(s.spanishLoading);callbacks.current.onSnapshot?.(s);
  },onCleanup:()=>callbacks.current.onCleanup?.()});runtime.current=page;callbacks.current.connectRuntime?.(page);
  const tick=()=>{if(!live)return;page.tick();raf=requestAnimationFrame(tick);};
  void props.asset.ready().then(async()=>{if(!live)return;page.setVolume(callbacks.current.volume??1);await page.start();if(live)tick();},e=>{if(live)setError(String(e));});
  return()=>{live=false;cancelAnimationFrame(raf);callbacks.current.connectRuntime?.(null);if(runtime.current===page)runtime.current=null;void page.close();};
 },[props.asset,props.load,props.seed]);
 useEffect(()=>{runtime.current?.setVolume(props.volume??1);},[props.volume]);
 const en=props.language!=='es',control:React.CSSProperties={font:'inherit',minHeight:44,padding:'.45em .65em'};
 const native=<><P057NativeV1 state={state} language={props.language} disabled={!ready||spanish}
  onChoose={choice=>runtime.current?.choose(choice)} onStep={()=>runtime.current?.stepClick()}
  onContinue={()=>runtime.current?.continueStep()} onCloseBox={()=>runtime.current?.closeBox()}
  onOpenHelp={()=>runtime.current?.openHelp()} onCloseHelp={()=>runtime.current?.closeHelp()}
  onGlossary={props.onGlossary?(buttonId,owner,key,trigger)=>{if(runtime.current?.glossary(buttonId,owner))props.onGlossary?.(key,trigger);}:undefined}/>
  {props.hidePlaybackControls&&<div data-p057-spanish-controls style={{display:'flex',flexWrap:'wrap',gap:'.5em',padding:'.75em',fontSize:'1rem'}}>
   <button type="button" data-p057-spanish-control style={control} disabled={!ready||loading} onClick={()=>void runtime.current?.startSpanish()}>{en?'Spanish Audio':'Audio en español'}</button>
   {loading&&<span role="status">{en?'Loading audio…':'Cargando audio…'}</span>}
   {spanish&&<button type="button" data-p057-return-control style={control} onClick={()=>runtime.current?.returnMain()}>{en?'Return to animation':'Volver a la animación'}</button>}
  </div>}
 </>;
 return <div data-p057-player data-p057-ready={String(ready)} data-p057-frame={state.mainFrame} data-p057-phase={state.phase} data-p057-spanish={String(spanish)} data-source-sha256={P057_SOURCE_SHA256}
  style={{width:'100%',maxWidth:800,minWidth:0,fontSize:'1rem',lineHeight:1.5,color:'#203a60'}}>
  {error&&<p role="alert">{error}</p>}
  <canvas ref={canvas} width={800} height={600} aria-label={en?'Source lesson animation':'Animación de la lección'} style={{display:'block',width:'100%',height:'auto',aspectRatio:'4 / 3'}}/>
  {!props.hidePlaybackControls&&<div style={{display:'flex',flexWrap:'wrap',gap:'.5em',padding:'.75em'}}>
   <button type="button" data-p057-play style={control} disabled={!ready||loading} onClick={()=>runtime.current?.play()}>{en?'Play':'Reproducir'}</button>
   <button type="button" data-p057-pause style={control} disabled={!ready} onClick={()=>runtime.current?.pause()}>{en?'Pause':'Pausar'}</button>
   <button type="button" data-p057-replay style={control} onClick={()=>runtime.current?.replay()}>{en?'Replay':'Repetir'}</button>
   <button type="button" data-p057-spanish style={control} disabled={!ready||loading} onClick={()=>void runtime.current?.startSpanish()}>{en?'Spanish Audio':'Audio en español'}</button>
   {spanish&&<button type="button" data-p057-return style={control} onClick={()=>runtime.current?.returnMain()}>{en?'Return to lesson':'Volver a la lección'}</button>}
  </div>}
  {props.nativeTextTarget?createPortal(native,props.nativeTextTarget):native}
 </div>;
}
