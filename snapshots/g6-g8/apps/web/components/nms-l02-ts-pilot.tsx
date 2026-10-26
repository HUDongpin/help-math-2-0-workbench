'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {P055_CONTROLS,P055_ID,P055_SOURCE,p055TextSnapshot,type P055TextIr} from '../../../packages/demos/src/nms-l02-ts-pilot-text';
import {SourceGlossaryControls} from '../../../packages/demos/src/source-glossary-controls';
import {SourceGlossarySession,type GlossaryTransportSnapshot} from '../../../packages/demos/src/source-glossary-session';
import {SourceLinearAudioController} from '../../../packages/demos/src/source-linear-audio';
import {loadVerifiedPairAudio} from '../../../packages/demos/src/alg-l12-glossary-pair-audio-loader';

type AssetPin={name:'typography.js'|'main.mp3';url:string;sha256:string;bytes:number};
interface Drawing {
 metadata:{animationId:string;sourceSwfSha256:string;renderScale:number;requiredCanvas:{width:number;height:number}};
 ready():Promise<void>;
 renderWithText(canvas:HTMLCanvasElement,request:Record<string,unknown>):{
  state:{frame?:number;localFrame?:number;frameDomain:string;rootFrame:number};
  suppressedInstanceIds:string[];unfulfilledSuppressionIds:string[]};
}
let pending:Promise<Drawing>|undefined;
function loadDrawing(pin:AssetPin):Promise<Drawing>{
 if(process.env.NODE_ENV==='production')return Promise.reject(Error('Local candidate only'));
 if(pending)return pending;
 pending=(async()=>{
  const registry=()=>((window as unknown as {HELP_MATH_CANVAS_ASSETS?:Record<string,Drawing>}).HELP_MATH_CANVAS_ASSETS);
  const old=registry();if(old?.[P055_ID]&&!Reflect.deleteProperty(old,P055_ID))throw Error('Stale drawing');
  await new Promise<void>((resolve,reject)=>{
   const script=document.createElement('script');script.src=pin.url;script.crossOrigin='anonymous';
   script.integrity='sha256-'+btoa(String.fromCharCode(...pin.sha256.match(/../g)!.map(x=>parseInt(x,16))));
   script.onload=()=>{script.remove();resolve();};script.onerror=()=>{script.remove();reject(Error('Drawing unavailable'));};
   document.head.append(script);
  });
  const drawing=registry()?.[P055_ID];
  if(!drawing||drawing.metadata.animationId!==P055_ID||drawing.metadata.sourceSwfSha256!==P055_SOURCE||
   drawing.metadata.renderScale!==2||drawing.metadata.requiredCanvas.width!==1600||drawing.metadata.requiredCanvas.height!==1200||
   typeof drawing.renderWithText!=='function')throw Error('Drawing identity');
  await drawing.ready();return drawing;
 })().catch(error=>{pending=undefined;throw error;});
 return pending;
}
const INITIAL:GlossaryTransportSnapshot={phase:'paused',frame:1,timelineSample:0,volume:1,error:null};
export function NmsL02TsPilot({ir,assets,locale}:{ir:P055TextIr;assets:AssetPin[];locale:'en'|'es'}){
 const [drawing,setDrawing]=useState<Drawing|null>(null),[state,setState]=useState(INITIAL);
 const [text,setText]=useState<ReturnType<typeof p055TextSnapshot>|null>(null),[failed,setFailed]=useState(false);
 const [replay,setReplay]=useState(0),[volume,setVolume]=useState(1),[denied,setDenied]=useState(false);
 const canvas=useRef<HTMLCanvasElement>(null),session=useRef<SourceGlossarySession|null>(null);
 const spanish=locale==='es';
 useEffect(()=>{let active=true;const pin=assets.find(x=>x.name==='typography.js');
  if(!pin){setFailed(true);return;}
  void loadDrawing(pin).then(x=>{if(active)setDrawing(x);}).catch(()=>{if(active)setFailed(true);});
  return()=>{active=false;};
 },[assets]);
 useEffect(()=>{
  const pin=assets.find(x=>x.name==='main.mp3');if(!pin||process.env.NODE_ENV==='production')return;
  let active=true,last='';
  const transport=new SourceLinearAudioController({frameCount:351,fps:12,sampleRate:22050,channels:1,
   audioStartFrame:5,decodedSamples:637056,originalBlockHeaderSamples:637056,sourceSwfSha256:P055_SOURCE,mp3Sha256:pin.sha256},
   {readVerified:async signal=>{
    const buffer=await loadVerifiedPairAudio({path:pin.url,sha256:pin.sha256,bytes:pin.bytes,sampleRate:22050,
     channels:1,decodedSamples:637056},window.location.origin,new OfflineAudioContext(1,1,22050),signal,()=>!signal.aborted);
    if(!buffer)throw Error('LINEAR_AUDIO_CANCELLED');return buffer;
   }});
  transport.setVolume(1);
  const owned=new SourceGlossarySession({page:P055_CONTROLS,transport,
   request:()=>{if(active)setDenied(true);},paused:()=>{},complete:()=>{}});
  session.current=owned;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  if(media.matches)transport.seekFrame(351);
  const pause=()=>owned.pause();media.addEventListener('change',pause);
  const visibility=()=>{if(document.hidden)pause();};document.addEventListener('visibilitychange',visibility);
  let handle=0;const tick=()=>{const next=owned.tick();if(next){const key=[next.frame,next.phase,next.volume,next.error].join(':');
   if(key!==last){last=key;setState(next);}}handle=requestAnimationFrame(tick);};tick();
  return()=>{active=false;cancelAnimationFrame(handle);media.removeEventListener('change',pause);
   document.removeEventListener('visibilitychange',visibility);if(session.current===owned)session.current=null;void owned.close().catch(()=>{});};
 },[assets]);
 useLayoutEffect(()=>{
  if(!drawing||!canvas.current)return;
  try{
   const next=p055TextSnapshot(ir,state.frame),buffer=document.createElement('canvas');buffer.width=1600;buffer.height=1200;
   const result=drawing.renderWithText(buffer,{frame:state.frame,frameDomain:'sprite-26',rootFrame:6,
    scenario:'source-static-frame',lang:'en',seed:0,text:{suppressInstanceIds:next.suppressionIds}});
   if(result.unfulfilledSuppressionIds.length||result.suppressedInstanceIds.length!==next.suppressionIds.length||
    next.suppressionIds.some(id=>!result.suppressedInstanceIds.includes(id))||
    (result.state.localFrame??result.state.frame)!==state.frame||result.state.frameDomain!=='sprite-26'||result.state.rootFrame!==6)
    throw Error('Text transaction mismatch');
   const ctx=canvas.current.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
   ctx.clearRect(0,0,1600,1200);ctx.drawImage(buffer,0,0);buffer.width=0;buffer.height=0;
   setText(next);setFailed(false);session.current?.setReady(true);
  }catch{setText(null);setFailed(true);session.current?.setReady(false);}
 },[drawing,ir,state.frame,replay]);
 const ready=Boolean(text)&&!failed;
 const visible=text?.text.filter(x=>x.visible)??[];
 const renderText=(id:number)=>visible.filter(x=>x.characterId===id).map(x=><span key={x.instanceId}
  data-source-instance-id={x.instanceId} style={{opacity:x.alpha}}>{x.text}</span>);
 const play=()=>{setDenied(false);if(state.frame===351&&state.phase!=='playing')void session.current?.replay();else void session.current?.play();};
 return <article className="nms-ts-pilot" data-p055-ready={ready} data-p055-phase={state.phase} data-p055-frame={state.frame}>
  <p className="nms-ts-status">{spanish?'Candidato local · sin registrar':'Local candidate · unregistered'}</p>
  <h1 lang="en">4 Step Plan</h1>
  {spanish&&<p lang="es">Texto original en inglés. No hay una traducción al español verificada.</p>}
  {!ready&&!failed&&<p role="status">{spanish?'Cargando…':'Loading…'}</p>}
  {(failed||state.phase==='error')&&<p role="alert">{spanish?'No se pudo cargar la animación.':'The animation could not load.'}</p>}
  <section lang="en" aria-label="Four step plan" className="nms-ts-step-grid" hidden={!ready}>
   <div>{renderText(8)}{renderText(7)} <strong>{renderText(9)}</strong></div>
   <div>{renderText(4)}</div><div>{renderText(5)}</div><div>{renderText(6)}</div>
  </section>
  <section lang="en" className="nms-ts-instructions" hidden={!ready} aria-label="Instructions">
   {[13,20,24].map(id=><p key={id}>{renderText(id)}</p>)}
   <div className="nms-ts-emphasis" aria-label="Source emphasis">{[17,18,23].map(id=>renderText(id))}</div>
  </section>
  <div className="nms-ts-transport" aria-label={spanish?'Reproducción':'Playback'}>
   <button disabled={!ready||state.phase==='playing'||state.phase==='loading'} onClick={play}>{spanish?'Reproducir':'Play'}</button>
   <button disabled={!ready||!['playing','loading'].includes(state.phase)} onClick={()=>session.current?.pause()}>{spanish?'Pausar':'Pause'}</button>
   <button disabled={!ready} onClick={()=>{setDenied(false);setReplay(x=>x+1);void session.current?.replay();}}>{spanish?'Reiniciar':'Replay'}</button>
   <label>{spanish?'Volumen':'Volume'} <input aria-label={spanish?'Volumen':'Volume'} type="range" min="0" max="1" step="0.05" value={volume}
    onChange={e=>{const value=Number(e.target.value);setVolume(value);session.current?.setVolume(value);}}/></label>
   <label>{spanish?'Fotograma':'Frame'} {state.frame} / 351 <input aria-label={spanish?'Fotograma':'Frame'} type="range" min="1" max="351" value={state.frame}
    disabled={!ready} onChange={e=>{setDenied(false);session.current?.seekFrame(Number(e.target.value));}}/></label>
  </div>
  <SourceGlossaryControls page={P055_CONTROLS} frame={state.frame} frameDomain="sprite-26" ready={ready} replay={replay}
   onLessonHostRequest={(request,context)=>{if(request.type==='open-glossary')return session.current?.openGlossary(request.entryId,context?.trigger);}}/>
  {denied&&<p role="status">{spanish?'La animación está pausada. La entrada del diccionario aún no está verificada.':'The animation is paused. This dictionary entry is not yet verified.'}</p>}
  <details><summary>{spanish?'Dibujo de referencia':'Reference drawing'}</summary>
   <p>{spanish?'El texto extraído aparece arriba.':'Extracted text is presented above.'}</p>
   <canvas ref={canvas} width={1600} height={1200} aria-label="Source step containers, pointer and outlined chapter title" role="img"/>
  </details>
 </article>;
}
