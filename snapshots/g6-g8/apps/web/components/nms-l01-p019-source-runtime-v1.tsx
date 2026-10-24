'use client';
import {useEffect,useRef,useState,type CSSProperties,type PointerEvent as ReactPointerEvent,type KeyboardEvent as ReactKeyboardEvent} from 'react';
import {createPortal} from 'react-dom';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps,LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import type {AnimationModule} from '../../../packages/demos/src/contract';
import type {SourceStaticCanvasCandidateConfig} from '../../../packages/demos/src/source-static-canvas-candidate';
import {P019SourceClockV1,type P019AudioPlan,type P019Picture} from '../../../packages/demos/src/nms-l01-p019-source-clock-v1';
import type {P019Handle} from '../../../packages/demos/src/nms-l01-p019-interaction-v1';
type Bounds=Readonly<{x:number;y:number;width:number;height:number}>;
type Practice=Readonly<{questions:readonly string[];newProblemBounds:Bounds;handles:readonly Readonly<{id:P019Handle;sourceCharacterId:number;y:number;color:string}>[]}>;
type Attachment=Readonly<{version:1;CONFIG:SourceStaticCanvasCandidateConfig;PLAN:P019AudioPlan;PRACTICE:Practice;sourceAudioPayloads:Readonly<Record<string,string>>;prepare:()=>Promise<unknown>}>;
type Snapshot=ReturnType<P019SourceClockV1['snapshot']>;
const ID='shared-nms002-l01-p019';
const buttonStyle:CSSProperties={minHeight:44,padding:'8px 12px',border:'1px solid var(--line, #8797a9)',borderRadius:9,background:'var(--paper, white)',color:'var(--ink, #132a40)',fontWeight:600};
export function NmsL1P019SourceRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;
 const canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null),clockRef=useRef<P019SourceClockV1|null>(null),controlsRef=useRef<LessonRuntimeAdapterControls|null>(null),sync=useRef<()=>void>(()=>{}),lastSeek=useRef(0);
 const [practice,setPractice]=useState<Practice|null>(null),[snapshot,setSnapshot]=useState<Snapshot|null>(null),[error,setError]=useState<string|null>(null),[reduced,setReduced]=useState(false),[paintedFrame,setPaintedFrame]=useState(1),[companion,setCompanion]=useState<HTMLElement|null>(null);
 const pointer=useRef<{id:number;handle:P019Handle;target:HTMLDivElement}|null>(null),es=props.uiLanguage==='es';
 const clearPointer=(cancel:boolean)=>{const p=pointer.current;pointer.current=null;if(p?.target.hasPointerCapture(p.id))p.target.releasePointerCapture(p.id);clockRef.current?.finish(cancel);};
 const clearPointerRef=useRef(clearPointer);clearPointerRef.current=clearPointer;
 useEffect(()=>{const cancel=(e:KeyboardEvent)=>{if(e.key==='Escape'&&pointer.current){e.preventDefault();clearPointerRef.current(true);}};window.addEventListener('keydown',cancel);return()=>window.removeEventListener('keydown',cancel);},[]);
 useEffect(()=>{
  const source=stage.current,owner=source?.closest('.lesson-shell2__learning-column'),id=props.pageInteractionCompanionTargetId;if(!source||!owner||!id?.endsWith('-terminal-source-v1-readable'))return;
  const resolve=()=>{const target=document.getElementById(id);setCompanion(target?.parentElement===owner&&target.dataset.pageInteractionCompanionHost==='true'&&!source.contains(target)?target:null);};
  resolve();const observer=new MutationObserver(resolve);observer.observe(owner,{childList:true,subtree:true});return()=>observer.disconnect();
 },[props.pageInteractionCompanionTargetId]);
 useEffect(()=>{
  let active=true,ready=false,clock:P019SourceClockV1|undefined,raf=0,ticket=0,lastPaint='',lastView='',lastReport='',painted=1,wantPlay=!latest.current.paused,runtimeFailed=false;
  const media=matchMedia('(prefers-reduced-motion: reduce)');let motion=media.matches;setReduced(motion);const changed=()=>{motion=media.matches;setReduced(motion);};media.addEventListener('change',changed);
  const pause=()=>{wantPlay=false;ticket++;clearPointerRef.current(true);clock?.pause();latest.current.onRuntimePausedChange(true);};
  const start=(activation:'automatic'|'user')=>{wantPlay=true;if(!active||!ready||!clock)return;if(motion&&activation==='automatic'){pause();return;}
   const turn=++ticket;latest.current.onRuntimePausedChange(false);void clock.play({activation,reducedMotion:motion}).then(r=>{if(active&&turn===ticket&&(!r.accepted||clock?.snapshot().phase==='question'))pause();});
  };
  const stop=()=>{active=false;ticket++;cancelAnimationFrame(raf);const p=pointer.current;pointer.current=null;if(p?.target.hasPointerCapture(p.id))p.target.releasePointerCapture(p.id);void clock?.close();};
  const controls:LessonRuntimeAdapterControls={setPaused:v=>v?pause():start('user'),replay(){if(!active||!ready||!clock)return false;clearPointerRef.current(true);ticket++;clock.replay();start('user');return true;},narration:a=>a==='stop'?pause():start('user'),stop};
  controlsRef.current=controls;const disconnect=props.connectRuntimeControls(controls);
  const init=async()=>{
   if(process.env.NODE_ENV==='production'||props.animationId!==ID||props.moduleKey!==ID||props.audioEnabled!==true||props.query.capture==='1'||props.query.lang!=='en'||props.query.frameDomain!=='sprite-71'||props.query.scenario!=='source-static-frame'||String(props.query.seed)!=='0')throw Error('P019_PRIVATE_SCOPE_MISMATCH');
   const module=await loadClientAnimationModule(ID) as (AnimationModule&{privateP019Practice?:Attachment})|undefined;if(!active)return;const a=module?.privateP019Practice;
   if(module?.key!==ID||!a||a.version!==1||a.CONFIG.animationId!==ID||a.CONFIG.mainFrameDomain!=='sprite-71'||a.CONFIG.mainFrameCount!==555||a.PLAN.sourceSwfSha256!==a.CONFIG.sourceSwfSha256||a.PRACTICE.questions.length!==10||a.PRACTICE.handles.length!==2||Object.keys(a.sourceAudioPayloads).join()!=='sprite-71')throw Error('P019_REGISTERED_SOURCE_MISSING');
   setPractice(a.PRACTICE);await a.prepare();if(!active)return;
   const asset=window.HELP_MATH_CANVAS_ASSETS?.[ID] as (NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string]&{metadata?:{sourceSwfSha256?:string}})|undefined;
   if(!asset||asset.metadata?.sourceSwfSha256!==a.CONFIG.sourceSwfSha256)throw Error('P019_SOURCE_CANVAS_MISSING');
   const paint=(picture:P019Picture,force=false)=>{
    const target=canvas.current;if(!active||!target||window.HELP_MATH_CANVAS_ASSETS?.[ID]!==asset)return false;
    const frame=motion&&!force&&picture.mainFrame<553?1:picture.mainFrame;
    const request={frame,scenario:'source-static-frame',lang:'en',seed:0,interaction:picture.interaction},key=JSON.stringify(request);
    if(key!==lastPaint){const state=asset.render(target,request) as {localFrame?:number;frameDomain?:string};if(state.localFrame!==frame||state.frameDomain!=='sprite-71'||target.dataset.flashFrame!==String(frame))return false;lastPaint=key;painted=frame;setPaintedFrame(frame);target.dataset.renderState='ready';target.style.display='block';stage.current?.setAttribute('data-flash-frame',String(frame));}
    return target.isConnected&&target.width===800&&target.height===600;
   };
   clock=new P019SourceClockV1(a.PLAN,{commitPicture:p=>paint(p,true)});clockRef.current=clock;
   const payload=Uint8Array.from(atob(a.sourceAudioPayloads['sprite-71']!),c=>c.charCodeAt(0)).buffer;
   const prepared=await clock.prepare(payload);if(!active)return;if(!prepared.accepted)throw Error(prepared.reason);clock.setVolume(latest.current.volume??1);ready=true;
   const draw=()=>{
    if(!active||!clock||runtimeFailed)return;const s=clock.snapshot();
    if(s.phase==='failed'){runtimeFailed=true;setSnapshot(s);setError(s.failure??'P019_SOURCE_FAILED');latest.current.onRuntimePausedChange(true);void clock.close();return;}
    if(!paint(s.picture,s.inspectionMode)){pause();setError('P019_SOURCE_PAINT_FAILED');return;}
    const viewKey=JSON.stringify({...s,contextTime:null,audioSample:0,operationSeconds:0});if(viewKey!==lastView){lastView=viewKey;setSnapshot(s);}
    const report:AnimationRuntimePlaybackState={audioAvailable:true,frame:painted,frameCount:555,frameDomain:'sprite-71',fps:12,narration:s.audioNodePlaying?'playing':'idle',playbackProgress:motion||s.inspectionMode?null:(s.picture.mainFrame-1)/554,seekAvailable:true,stepFrames:20,transportMode:'visual-frame-inspector'};
    const key=JSON.stringify(report);if(key!==lastReport){lastReport=key;latest.current.onPlaybackStateChange?.(report);}
    if(s.globalPaused&&!latest.current.paused)latest.current.onRuntimePausedChange(true);
   };
   sync.current=draw;const loop=()=>{draw();if(active)raf=requestAnimationFrame(loop);};loop();if(wantPlay)start('automatic');else latest.current.onRuntimePausedChange(true);
  };
  void init().catch(e=>{if(!active)return;pause();void clock?.close();setError(e instanceof Error?e.message:String(e));});
  return()=>{stop();sync.current=()=>{};media.removeEventListener('change',changed);disconnect();if(clockRef.current===clock)clockRef.current=null;if(controlsRef.current===controls)controlsRef.current=null;};
 },[props.animationId,props.moduleKey,props.audioEnabled,props.connectRuntimeControls]);
 useEffect(()=>{const c=clockRef.current;if(!c)return;if(props.paused&&['playing','starting'].includes(c.snapshot().phase))c.pause();else if(!props.paused&&snapshot&&c.snapshot().phase==='paused')controlsRef.current?.setPaused(false);},[props.paused,Boolean(snapshot)]);
 useEffect(()=>{clockRef.current?.setVolume(props.volume??1);},[props.volume]);
 useEffect(()=>{const q=props.seekRequest,c=clockRef.current;if(!q||!c||!snapshot||q.requestId===lastSeek.current)return;lastSeek.current=q.requestId;clearPointerRef.current(true);c.inspect(q.frame);props.onRuntimePausedChange(true);sync.current();},[props.seekRequest,Boolean(snapshot),props.onRuntimePausedChange]);
 const canAct=snapshot?.phase==='question';
 const localX=(e:ReactPointerEvent)=>{const r=canvas.current?.getBoundingClientRect();return r&&r.width>0?(e.clientX-r.left)*800/r.width-412.4:null;};
 const begin=(e:ReactPointerEvent<HTMLDivElement>,id:P019Handle)=>{if(!canAct||pointer.current||e.button!==0)return;const x=localX(e);if(x===null)return;e.preventDefault();if(!clockRef.current?.begin(id,x))return;e.currentTarget.setPointerCapture(e.pointerId);pointer.current={id:e.pointerId,handle:id,target:e.currentTarget};sync.current();};
 const move=(e:ReactPointerEvent<HTMLDivElement>)=>{if(pointer.current?.id!==e.pointerId)return;const x=localX(e);if(x!==null)clockRef.current?.move(x);sync.current();};
 const end=(e:ReactPointerEvent<HTMLDivElement>,cancel=false)=>{if(pointer.current?.id!==e.pointerId)return;if(!cancel)move(e);clearPointer(cancel);};
 const setValue=(id:P019Handle,value:number)=>{if(canAct){clockRef.current?.setValue(id,value);sync.current();}};
 const handleKey=(e:ReactKeyboardEvent<HTMLDivElement>,id:P019Handle)=>{
  if(!canAct||!snapshot)return;const n=id==='h2'?snapshot.practice.value1:snapshot.practice.value2;
  const next=e.key==='Home'?-20:e.key==='End'?20:['ArrowRight','ArrowUp'].includes(e.key)?Math.min(20,n+1):['ArrowLeft','ArrowDown'].includes(e.key)?Math.max(-20,n-1):null;
  if(next!==null){e.preventDefault();setValue(id,next);}
 };
 const newProblem=()=>{clearPointer(true);if(canAct){clockRef.current?.newProblem();sync.current();}};
 const readable=practice&&snapshot?<section data-p019-companion style={{padding:16,border:'1px solid var(--line, #8797a9)',borderRadius:12,background:'var(--paper, white)',color:'var(--ink, #132a40)',fontSize:16,lineHeight:1.5,margin:'12px auto',width:'min(100%,680px)'}}>
  <h3 style={{margin:'0 0 8px',fontSize:18}}>{es?'Suma de enteros':'Add integers'}</h3>
  {snapshot.picture.mainFrame<553?<p data-p019-intro>{es?'Escucha el ejemplo: 4 + 2 = 6. Después, mueve los dos sumandos para explorar la suma.':'Listen to the example: 4 + 2 = 6. Then move the two addends to explore addition.'}</p>:<>
   <p data-p019-question role="status" aria-live="polite">{es?'Halla la suma de':'Find the sum of'} <strong>{snapshot.practice.question}</strong>.</p>
   <p>{es?'Mueve los dos controles o usa las flechas del teclado. Los colores azul y rojo representan el primer y el segundo sumando.':'Move the two controls or use the arrow keys. Blue and red represent the first and second addends.'}</p>
   {practice.handles.map((h,i)=>{const value=i===0?snapshot.practice.value1:snapshot.practice.value2,label=i===0?(es?'Primer sumando':'First addend'):(es?'Segundo sumando':'Second addend');return <label key={h.id} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,marginTop:16}}>
    <span style={{fontWeight:600}}>{label} <span aria-hidden="true" style={{color:h.color}}>●</span></span><output data-p019-value={h.id}>{value}</output>
    <input data-p019-slider={h.id} type="range" aria-label={label} min={-20} max={20} step={1} value={value} disabled={!canAct} onChange={e=>setValue(h.id,Number(e.currentTarget.value))} style={{gridColumn:'1 / -1',width:'100%',height:44,margin:0,accentColor:h.color}}/>
   </label>;})}
   <p data-p019-equation aria-live="polite" aria-atomic="true" style={{fontWeight:700,fontSize:22,margin:'18px 0'}}>{snapshot.practice.value1} + ({snapshot.practice.value2}) = {snapshot.practice.sum}</p>
   <button type="button" data-p019-new-problem style={buttonStyle} disabled={!canAct} onClick={newProblem}>{es?'Nuevo problema':'New problem'}</button>
  </>}
  {reduced?<p data-p019-reduced-note style={{marginBottom:0,fontSize:14}}>{props.labels.reduced}</p>:null}
 </section>:null;
 const b=practice?.newProblemBounds;
 return <div className="runtime-shell" style={{height:'auto','--flash-stage-width':'800px','--flash-stage-height':'600px','--flash-stage-aspect':'800 / 600'} as CSSProperties} data-source-clock-runtime={ID} data-source-clock-phase={snapshot?.phase??'loading'} data-source-failure={snapshot?.failure??error??''} data-source-audio-frame={snapshot?.picture.mainFrame??1} data-source-audio-playing={snapshot?.audioNodePlaying?'true':'false'} data-source-question-ordinal={snapshot?.practice.questionOrdinal??0} data-source-question-index={snapshot?.practice.picture.questionIndex??0} data-source-value-one={snapshot?.practice.value1??0} data-source-value-two={snapshot?.practice.value2??0} data-source-sum={snapshot?.practice.sum??0} data-source-handle-one-x={snapshot?.practice.picture.x1??-15} data-source-handle-two-x={snapshot?.practice.picture.x2??-15} data-source-quiz-active={snapshot?.sourceQuizActive?'true':'false'} data-source-inspection={snapshot?.inspectionMode?'true':'false'} data-runtime-volume={props.volume??1} data-audio-available={snapshot?'true':'false'} data-runtime-paused={props.paused?'true':'false'} data-runtime-presentation="modern-wide" data-runtime-playback-complete="false">
  <div ref={stage} className="runtime-stage" style={{position:'relative',height:'auto',aspectRatio:'4 / 3'}} data-animation-module={ID} data-flash-frame={paintedFrame} data-flash-frame-domain="sprite-71" data-source-clock-ready={snapshot?'true':'false'}>
   <canvas ref={canvas} width={800} height={600} data-course-canvas={ID} aria-label={es?'Suma de enteros con flechas en una recta numérica':'Add integers with arrows on a number line'} style={{display:snapshot?'block':'none',width:'100%',height:'auto'}}/>
   {practice&&canAct&&snapshot?practice.handles.map((h,i)=>{const x=i===0?snapshot.practice.picture.x1:snapshot.practice.picture.x2,value=i===0?snapshot.practice.value1:snapshot.practice.value2;return <div key={h.id} data-p019-drag={h.id} role="slider" tabIndex={0} aria-label={i===0?(es?'Primer sumando en la imagen':'First addend in the picture'):(es?'Segundo sumando en la imagen':'Second addend in the picture')} aria-valuemin={-20} aria-valuemax={20} aria-valuenow={value} aria-orientation="horizontal" onKeyDown={e=>handleKey(e,h.id)} onPointerDown={e=>begin(e,h.id)} onPointerMove={move} onPointerUp={e=>end(e)} onPointerCancel={e=>end(e,true)} onLostPointerCapture={e=>end(e,true)} style={{position:'absolute',left:`${(412.4+x)/8}%`,top:`${(280.3+h.y)/6}%`,width:24,height:24,transform:'translate(-50%, -50%)',touchAction:'none',cursor:'grab',borderRadius:'50%'}}/>;}):null}
   {b&&canAct?<button type="button" data-p019-source-new-problem aria-label={es?'Nuevo problema en la imagen':'New problem in the picture'} onClick={newProblem} style={{position:'absolute',left:`${b.x/8}%`,top:`${b.y/6}%`,width:`${b.width/8}%`,height:`${b.height/6}%`,minWidth:0,minHeight:0,border:0,padding:0,background:'transparent',cursor:'pointer'}}/>:null}
  </div>
  {companion&&readable?createPortal(readable,companion):null}
  {!snapshot&&!error?<p role="status">{props.labels.loading}</p>:null}{error?<p role="alert" data-source-clock-error={error}>{props.labels.unavailable}</p>:null}
 </div>;
}
