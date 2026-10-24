'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps,LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import type {AnimationModule} from '../../../packages/demos/src/contract';
import type {SourceStaticCanvasCandidateConfig} from '../../../packages/demos/src/source-static-canvas-candidate';
import {P024SourceClockV1,type P024AudioPlan,type P024Picture} from '../../../packages/demos/src/nms-l01-p024-source-clock-v1';
type Bounds=Readonly<{x:number;y:number;width:number;height:number}>;
type Practice=Readonly<{questions:readonly string[];newProblemBounds:Bounds;multiplyBounds:Bounds;
 problems:readonly Readonly<{left:number;right:number;result:number;answerCharacterId:number;frameCount:number}>[];
 introMotionKeyframes:readonly number[];reading:readonly Readonly<{firstFrame:number;lastFrame:number;text:string}>[]}>;
type Attachment=Readonly<{version:1;CONFIG:SourceStaticCanvasCandidateConfig;PLAN:P024AudioPlan;PRACTICE:Practice;sourceAudioPayloads:Readonly<Record<string,string>>;prepare:()=>Promise<unknown>}>;
type Snapshot=ReturnType<P024SourceClockV1['snapshot']>;
const ID='shared-nms002-l01-p024';
const buttonStyle:CSSProperties={minHeight:44,padding:'8px 12px',border:'1px solid var(--line, #8797a9)',borderRadius:9,background:'var(--paper, white)',color:'var(--ink, #132a40)',fontWeight:600};
export function NmsL1P024SourceRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;
 const canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null),clockRef=useRef<P024SourceClockV1|null>(null),controlsRef=useRef<LessonRuntimeAdapterControls|null>(null),sync=useRef<()=>void>(()=>{}),lastSeek=useRef(0);
 const [practice,setPractice]=useState<Practice|null>(null),[snapshot,setSnapshot]=useState<Snapshot|null>(null),[error,setError]=useState<string|null>(null),[reduced,setReduced]=useState(false),[paintedFrame,setPaintedFrame]=useState(1),[companion,setCompanion]=useState<HTMLElement|null>(null);
 const es=props.uiLanguage==='es';
 useEffect(()=>{
  const source=stage.current,owner=source?.closest('.lesson-shell2__learning-column'),id=props.pageInteractionCompanionTargetId;if(!source||!owner||!id?.endsWith('-terminal-source-v1-readable'))return;
  const resolve=()=>{const target=document.getElementById(id);setCompanion(target?.parentElement===owner&&target.dataset.pageInteractionCompanionHost==='true'&&!source.contains(target)?target:null);};
  resolve();const observer=new MutationObserver(resolve);observer.observe(owner,{childList:true,subtree:true});return()=>observer.disconnect();
 },[props.pageInteractionCompanionTargetId]);
 useEffect(()=>{
  let active=true,ready=false,clock:P024SourceClockV1|undefined,raf=0,ticket=0,lastPaint='',lastView='',lastReport='',painted=1,paintedAnswer=1,paintedQuestion=-1,wantPlay=!latest.current.paused,runtimeFailed=false;
  const timers=new Set<ReturnType<typeof setTimeout>>(),media=matchMedia('(prefers-reduced-motion: reduce)');let motion=media.matches;setReduced(motion);const changed=()=>{motion=media.matches;setReduced(motion);};media.addEventListener('change',changed);
  const pause=()=>{wantPlay=false;ticket++;clock?.pause();latest.current.onRuntimePausedChange(true);};
  const start=(activation:'automatic'|'user')=>{
   wantPlay=true;if(!active||!ready||!clock)return;if(motion&&activation==='automatic'){pause();return;}
   const turn=++ticket;latest.current.onRuntimePausedChange(false);void clock.play({activation,reducedMotion:motion}).then(r=>{if(active&&turn===ticket&&(!r.accepted||clock?.snapshot().phase==='question'))pause();});
   const timer=setTimeout(()=>{timers.delete(timer);if(active&&turn===ticket&&clock?.snapshot().phase==='starting')pause();},250);timers.add(timer);
  };
  const stop=()=>{active=false;ticket++;cancelAnimationFrame(raf);for(const t of timers)clearTimeout(t);timers.clear();void clock?.close();};
  const controls:LessonRuntimeAdapterControls={setPaused:v=>v?pause():start('user'),replay(){if(!active||!ready||!clock)return false;ticket++;clock.replay();start('user');return true;},narration:a=>a==='stop'?pause():start('user'),stop};
  controlsRef.current=controls;const disconnect=props.connectRuntimeControls(controls);
  const init=async()=>{
   if(process.env.NODE_ENV==='production'||props.animationId!==ID||props.moduleKey!==ID||props.audioEnabled!==true||props.query.capture==='1'||props.query.lang!=='en'||props.query.frameDomain!=='sprite-137'||props.query.scenario!=='source-static-frame'||String(props.query.seed)!=='0')throw Error('P024_PRIVATE_SCOPE_MISMATCH');
   const module=await loadClientAnimationModule(ID) as (AnimationModule&{privateP024Practice?:Attachment})|undefined;if(!active)return;const a=module?.privateP024Practice;
   if(module?.key!==ID||!a||a.version!==1||a.CONFIG.animationId!==ID||a.CONFIG.mainFrameDomain!=='sprite-137'||a.CONFIG.mainFrameCount!==469||a.PLAN.sourceSwfSha256!==a.CONFIG.sourceSwfSha256||a.PRACTICE.questions.length!==10||a.PRACTICE.problems.length!==10||Object.keys(a.sourceAudioPayloads).join()!=='sprite-137'||JSON.stringify(a.PRACTICE.introMotionKeyframes)!=='[1,6,183,289,346,385,467,468,469]')throw Error('P024_REGISTERED_SOURCE_MISSING');
   setPractice(a.PRACTICE);await a.prepare();if(!active)return;
   const asset=window.HELP_MATH_CANVAS_ASSETS?.[ID] as (NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string]&{metadata?:{sourceSwfSha256?:string}})|undefined;
   if(!asset||asset.metadata?.sourceSwfSha256!==a.CONFIG.sourceSwfSha256)throw Error('P024_SOURCE_CANVAS_MISSING');
   const paint=(picture:P024Picture,force=false)=>{
    const target=canvas.current;if(!active||!target||window.HELP_MATH_CANVAS_ASSETS?.[ID]!==asset)return false;
    const milestone=a.PRACTICE.introMotionKeyframes.findLast(f=>f<=picture.mainFrame)??1;
    const frame=motion&&!force&&picture.mainFrame<468?Math.max(painted<=picture.mainFrame?painted:1,milestone):picture.mainFrame;
    let interaction=picture.interaction;
    if(motion&&!force&&interaction.revealed){const terminal=a.PRACTICE.problems[interaction.questionIndex]!.frameCount,held=paintedQuestion===interaction.questionIndex&&paintedAnswer<=interaction.answerFrame?paintedAnswer:2;interaction={...interaction,answerFrame:Math.max(held,interaction.answerFrame>=terminal?terminal:2)};}
    const request={frame,scenario:'source-static-frame',lang:'en',seed:0,interaction},key=JSON.stringify(request);
    if(key!==lastPaint){const state=asset.render(target,request) as {localFrame?:number;frameDomain?:string};if(state.localFrame!==frame||state.frameDomain!=='sprite-137'||target.dataset.flashFrame!==String(frame))return false;lastPaint=key;painted=frame;paintedQuestion=interaction.questionIndex;paintedAnswer=interaction.answerFrame;setPaintedFrame(frame);target.dataset.sourcePaintedAnswerFrame=String(paintedAnswer);target.dataset.renderState='ready';target.style.display='block';stage.current?.setAttribute('data-flash-frame',String(frame));}
    return target.isConnected&&target.width===800&&target.height===600;
   };
   clock=new P024SourceClockV1(a.PLAN,{commitPicture:p=>paint(p,true)});clockRef.current=clock;
   const payload=Uint8Array.from(atob(a.sourceAudioPayloads['sprite-137']!),c=>c.charCodeAt(0)).buffer;
   const prepared=await clock.prepare(payload);if(!active)return;if(!prepared.accepted)throw Error(prepared.reason);clock.setVolume(latest.current.volume??1);ready=true;
   const draw=()=>{
    if(!active||!clock||runtimeFailed)return;const s=clock.snapshot();
    if(s.phase==='failed'){runtimeFailed=true;setSnapshot(s);setError(s.failure??'P024_SOURCE_FAILED');latest.current.onRuntimePausedChange(true);void clock.close();return;}
    if(!paint(s.picture,s.phase!=='playing')){pause();setError('P024_SOURCE_PAINT_FAILED');return;}
    const viewKey=JSON.stringify({...s,contextTime:null,audioSample:0,operationSeconds:0});if(viewKey!==lastView){lastView=viewKey;setSnapshot(s);}
    const report:AnimationRuntimePlaybackState={audioAvailable:true,frame:painted,frameCount:469,frameDomain:'sprite-137',fps:12,narration:s.audioNodePlaying?'playing':'idle',playbackProgress:motion||s.inspectionMode?null:(s.picture.mainFrame-1)/468,seekAvailable:true,stepFrames:20,transportMode:'visual-frame-inspector'};
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
 useEffect(()=>{const q=props.seekRequest,c=clockRef.current;if(!q||!c||!snapshot||q.requestId===lastSeek.current)return;lastSeek.current=q.requestId;c.inspect(q.frame);props.onRuntimePausedChange(true);sync.current();},[props.seekRequest,Boolean(snapshot),props.onRuntimePausedChange]);
 const multiply=()=>{const c=clockRef.current;if(!c||!c.snapshot().canMultiply)return;props.onRuntimePausedChange(false);void c.multiply({activation:'user',reducedMotion:reduced}).then(r=>{if(!r.accepted)props.onRuntimePausedChange(true);sync.current();});sync.current();};
 const newProblem=()=>{if(clockRef.current?.newProblem()){props.onRuntimePausedChange(true);sync.current();}};
 const readable=practice&&snapshot?<section data-p024-companion style={{padding:16,border:'1px solid var(--line, #8797a9)',borderRadius:12,background:'var(--paper, white)',color:'var(--ink, #132a40)',fontSize:16,lineHeight:1.5,margin:'12px auto',width:'min(100%,680px)'}}>
  <h3 style={{margin:'0 0 8px',fontSize:18}}>{es?'Multiplicación de enteros':'Multiplying integers'}</h3>
  {snapshot.picture.mainFrame<468?<>
   <p data-p024-intro>{es?'Escucha la explicación y compara los grupos de saltos en la recta numérica. Después, elige Multiplicar para ver cada operación.':'Listen to the explanation and compare the groups of jumps on the number line. Then choose Multiply to see each operation.'}</p>
   {practice.reading.filter(r=>paintedFrame>=r.firstFrame&&paintedFrame<=r.lastFrame).map(r=><p lang="en" data-p024-source-reading key={r.firstFrame}>{r.text}</p>)}
  </>:<>
   <p>{es?'Elige Multiplicar para mostrar la respuesta y los saltos en la recta numérica. Puedes elegir un nuevo problema en cualquier momento.':'Choose Multiply to show the answer and the jumps on the number line. You can choose a new problem at any time.'}</p>
   <p data-p024-equation role="status" aria-live="polite" aria-atomic="true" style={{fontWeight:700,fontSize:24,margin:'18px 0'}}>{snapshot.practice.question} {snapshot.practice.picture.revealed?snapshot.practice.result:'?'}</p>
   <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
    <button type="button" data-p024-multiply style={buttonStyle} disabled={!snapshot.canMultiply} onClick={multiply}>{es?'Multiplicar':'Multiply'}</button>
    <button type="button" data-p024-new-problem style={buttonStyle} disabled={!snapshot.canNewProblem} onClick={newProblem}>{es?'Nuevo problema':'New problem'}</button>
   </div>
   {snapshot.practice.picture.revealed?<p data-p024-jump-description>{es?`${snapshot.practice.left} grupos de ${snapshot.practice.right} dan ${snapshot.practice.result}; ${snapshot.practice.right} grupos de ${snapshot.practice.left} dan el mismo resultado.`:`${snapshot.practice.left} groups of ${snapshot.practice.right} give ${snapshot.practice.result}; ${snapshot.practice.right} groups of ${snapshot.practice.left} give the same result.`}</p>:null}
  </>}
  {reduced?<p data-p024-reduced-note style={{marginBottom:0,fontSize:14}}>{props.labels.reduced}</p>:null}
 </section>:null;
 const hitStyle=(b:Bounds):CSSProperties=>({position:'absolute',left:`${b.x/8}%`,top:`${b.y/6}%`,width:`${b.width/8}%`,height:`${b.height/6}%`,minHeight:0,minWidth:0,padding:0,border:0,background:'transparent',cursor:'pointer'});
 return <div className="runtime-shell" style={{height:'auto','--flash-stage-width':'800px','--flash-stage-height':'600px','--flash-stage-aspect':'800 / 600'} as CSSProperties} data-source-clock-runtime={ID} data-source-clock-phase={snapshot?.phase??'loading'} data-source-failure={snapshot?.failure??error??''} data-source-operation={snapshot?.operation??'intro'} data-source-audio-frame={snapshot?.picture.mainFrame??1} data-source-audio-playing={snapshot?.audioNodePlaying?'true':'false'} data-source-answer-frame={snapshot?.practice.picture.answerFrame??1} data-source-answer-revealed={snapshot?.practice.picture.revealed?'true':'false'} data-source-question-ordinal={snapshot?.practice.questionOrdinal??0} data-source-question-index={snapshot?.practice.picture.questionIndex??0} data-source-result={snapshot?.practice.result??0} data-source-quiz-active={snapshot?.sourceQuizActive?'true':'false'} data-source-inspection={snapshot?.inspectionMode?'true':'false'} data-runtime-volume={props.volume??1} data-audio-available={snapshot?'true':'false'} data-runtime-paused={props.paused?'true':'false'} data-runtime-presentation="modern-wide" data-runtime-playback-complete="false">
  <div ref={stage} className="runtime-stage" style={{position:'relative',height:'auto',aspectRatio:'4 / 3'}} data-animation-module={ID} data-flash-frame={paintedFrame} data-flash-frame-domain="sprite-137" data-source-clock-ready={snapshot?'true':'false'}>
   <canvas ref={canvas} width={800} height={600} data-course-canvas={ID} aria-label={es?'Multiplica enteros con saltos en la recta numérica':'Multiply integers with jumps on the number line'} style={{display:snapshot?'block':'none',width:'100%',height:'auto'}}/>
   {practice&&snapshot?.picture.mainFrame===468?<>
    <button type="button" data-p024-source-multiply aria-label={es?'Multiplicar en la imagen':'Multiply in the picture'} disabled={!snapshot.canMultiply} onClick={multiply} style={hitStyle(practice.multiplyBounds)}/>
    <button type="button" data-p024-source-new-problem aria-label={es?'Nuevo problema en la imagen':'New problem in the picture'} disabled={!snapshot.canNewProblem} onClick={newProblem} style={hitStyle(practice.newProblemBounds)}/>
   </>:null}
  </div>
  {companion&&readable?createPortal(readable,companion):null}
  {!snapshot&&!error?<p role="status">{props.labels.loading}</p>:null}{error?<p role="alert" data-source-clock-error={error}>{props.labels.unavailable}</p>:null}
 </div>;
}
