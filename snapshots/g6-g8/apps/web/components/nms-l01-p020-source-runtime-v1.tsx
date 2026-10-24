'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps,LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import type {AnimationModule} from '../../../packages/demos/src/contract';
import type {SourceStaticCanvasCandidateConfig} from '../../../packages/demos/src/source-static-canvas-candidate';
import {P020SourceClockV1,type P020AudioPlan,type P020Picture} from '../../../packages/demos/src/nms-l01-p020-source-clock-v1';
type Bounds=Readonly<{x:number;y:number;width:number;height:number}>;
type Localized=Readonly<{en:string;es:string}>;
type Glossary=Readonly<{id:string;labels:Localized;definitions:Localized}>;
type Practice=Readonly<{questions:readonly string[];newProblemBounds:Bounds;subtractBounds:Bounds;glossary:readonly Glossary[];controls:readonly Readonly<{entryId:string;sourceCharacterId:number;labels:Localized;firstMainFrame:number;lastMainFrame:number}>[];sourceHotspots:readonly Readonly<{entryId:string;sourceCharacterId:number;ranges:readonly Readonly<{firstFrame:number;lastFrame:number;bounds:Bounds}>[]}>[];reading:readonly Readonly<{firstFrame:number;lastFrame:number;text:string}>[]}>;
type Attachment=Readonly<{version:1;CONFIG:SourceStaticCanvasCandidateConfig;PLAN:P020AudioPlan;PRACTICE:Practice;sourceAudioPayloads:Readonly<Record<string,string>>;prepare:()=>Promise<unknown>}>;
type Snapshot=ReturnType<P020SourceClockV1['snapshot']>;
const ID='shared-nms002-l01-p020';
const buttonStyle:CSSProperties={minHeight:44,padding:'8px 12px',border:'1px solid var(--line, #8797a9)',borderRadius:9,background:'var(--paper, white)',color:'var(--ink, #132a40)',fontWeight:600};
export function NmsL1P020SourceRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;
 const canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null),clockRef=useRef<P020SourceClockV1|null>(null),controlsRef=useRef<LessonRuntimeAdapterControls|null>(null),sync=useRef<()=>void>(()=>{}),lastSeek=useRef(0);
 const [practice,setPractice]=useState<Practice|null>(null),[snapshot,setSnapshot]=useState<Snapshot|null>(null),[error,setError]=useState<string|null>(null),[reduced,setReduced]=useState(false),[paintedFrame,setPaintedFrame]=useState(1),[companion,setCompanion]=useState<HTMLElement|null>(null);
 const es=props.uiLanguage==='es',language=es?'es':'en';
 const[glossary,setGlossary]=useState<string|null>(null),dialog=useRef<HTMLDivElement>(null),glossaryRef=useRef<string|null>(null),glossaryResume=useRef(false),glossaryTrigger=useRef<HTMLElement|null>(null);
 const clearGlossary=()=>{glossaryRef.current=null;glossaryResume.current=false;glossaryTrigger.current=null;setGlossary(null);};
 const clearGlossaryRef=useRef(clearGlossary);clearGlossaryRef.current=clearGlossary;
 useEffect(()=>{
  const source=stage.current,owner=source?.closest('.lesson-shell2__learning-column'),id=props.pageInteractionCompanionTargetId;if(!source||!owner||!id?.endsWith('-terminal-source-v1-readable'))return;
  const resolve=()=>{const target=document.getElementById(id);setCompanion(target?.parentElement===owner&&target.dataset.pageInteractionCompanionHost==='true'&&!source.contains(target)?target:null);};
  resolve();const observer=new MutationObserver(resolve);observer.observe(owner,{childList:true,subtree:true});return()=>observer.disconnect();
 },[props.pageInteractionCompanionTargetId]);
 useEffect(()=>{
  let active=true,ready=false,clock:P020SourceClockV1|undefined,raf=0,ticket=0,lastPaint='',lastView='',lastReport='',painted=1,wantPlay=!latest.current.paused,runtimeFailed=false;
  const media=matchMedia('(prefers-reduced-motion: reduce)');let motion=media.matches;setReduced(motion);const changed=()=>{motion=media.matches;setReduced(motion);};media.addEventListener('change',changed);
  const pause=()=>{wantPlay=false;ticket++;clock?.pause();latest.current.onRuntimePausedChange(true);};
  const start=(activation:'automatic'|'user')=>{wantPlay=true;if(!active||!ready||!clock)return;if(motion&&activation==='automatic'){pause();return;}
   const turn=++ticket;latest.current.onRuntimePausedChange(false);void clock.play({activation,reducedMotion:motion}).then(r=>{if(active&&turn===ticket&&(!r.accepted||clock?.snapshot().phase==='question'))pause();});
  };
  const stop=()=>{active=false;ticket++;cancelAnimationFrame(raf);void clock?.close();};
  const controls:LessonRuntimeAdapterControls={setPaused:v=>v?pause():start('user'),replay(){if(!active||!ready||!clock)return false;clearGlossaryRef.current();ticket++;clock.replay();start('user');return true;},narration:a=>a==='stop'?pause():start('user'),stop};
  controlsRef.current=controls;const disconnect=props.connectRuntimeControls(controls);
  const init=async()=>{
   if(process.env.NODE_ENV==='production'||props.animationId!==ID||props.moduleKey!==ID||props.audioEnabled!==true||props.query.capture==='1'||props.query.lang!=='en'||props.query.frameDomain!=='sprite-114'||props.query.scenario!=='source-static-frame'||String(props.query.seed)!=='0')throw Error('P020_PRIVATE_SCOPE_MISMATCH');
   const module=await loadClientAnimationModule(ID) as (AnimationModule&{privateP020Practice?:Attachment})|undefined;if(!active)return;const a=module?.privateP020Practice;
   if(module?.key!==ID||!a||a.version!==1||a.CONFIG.animationId!==ID||a.CONFIG.mainFrameDomain!=='sprite-114'||a.CONFIG.mainFrameCount!==570||a.PLAN.sourceSwfSha256!==a.CONFIG.sourceSwfSha256||a.PRACTICE.questions.length!==10||a.PRACTICE.glossary.length!==6||Object.keys(a.sourceAudioPayloads).join()!=='sprite-114')throw Error('P020_REGISTERED_SOURCE_MISSING');
   setPractice(a.PRACTICE);await a.prepare();if(!active)return;
   const asset=window.HELP_MATH_CANVAS_ASSETS?.[ID] as (NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string]&{metadata?:{sourceSwfSha256?:string}})|undefined;
   if(!asset||asset.metadata?.sourceSwfSha256!==a.CONFIG.sourceSwfSha256)throw Error('P020_SOURCE_CANVAS_MISSING');
   const paint=(picture:P020Picture,force=false)=>{
    const target=canvas.current;if(!active||!target||window.HELP_MATH_CANVAS_ASSETS?.[ID]!==asset)return false;
    const frame=motion&&!force&&picture.mainFrame<569?1:picture.mainFrame;
    const request={frame,scenario:'source-static-frame',lang:'en',seed:0,interaction:picture.interaction},key=JSON.stringify(request);
    if(key!==lastPaint){const state=asset.render(target,request) as {localFrame?:number;frameDomain?:string};if(state.localFrame!==frame||state.frameDomain!=='sprite-114'||target.dataset.flashFrame!==String(frame))return false;lastPaint=key;painted=frame;setPaintedFrame(frame);target.dataset.renderState='ready';target.style.display='block';stage.current?.setAttribute('data-flash-frame',String(frame));}
    return target.isConnected&&target.width===800&&target.height===600;
   };
   clock=new P020SourceClockV1(a.PLAN,{commitPicture:p=>paint(p,true)});clockRef.current=clock;
   const payload=Uint8Array.from(atob(a.sourceAudioPayloads['sprite-114']!),c=>c.charCodeAt(0)).buffer;
   const prepared=await clock.prepare(payload);if(!active)return;if(!prepared.accepted)throw Error(prepared.reason);clock.setVolume(latest.current.volume??1);ready=true;
   const draw=()=>{
    if(!active||!clock||runtimeFailed)return;const s=clock.snapshot();
    if(s.phase==='failed'){runtimeFailed=true;setSnapshot(s);setError(s.failure??'P020_SOURCE_FAILED');latest.current.onRuntimePausedChange(true);void clock.close();return;}
    if(!paint(s.picture,s.inspectionMode)){pause();setError('P020_SOURCE_PAINT_FAILED');return;}
    const viewKey=JSON.stringify({...s,contextTime:null,audioSample:0,operationSeconds:0});if(viewKey!==lastView){lastView=viewKey;setSnapshot(s);}
    const report:AnimationRuntimePlaybackState={audioAvailable:true,frame:painted,frameCount:570,frameDomain:'sprite-114',fps:12,narration:s.audioNodePlaying?'playing':'idle',playbackProgress:motion||s.inspectionMode?null:(s.picture.mainFrame-1)/569,seekAvailable:true,stepFrames:20,transportMode:'visual-frame-inspector'};
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
 useEffect(()=>{const q=props.seekRequest,c=clockRef.current;if(!q||!c||!snapshot||q.requestId===lastSeek.current)return;lastSeek.current=q.requestId;clearGlossaryRef.current();c.inspect(q.frame);props.onRuntimePausedChange(true);sync.current();},[props.seekRequest,Boolean(snapshot),props.onRuntimePausedChange]);
 const entry=practice?.glossary.find(e=>e.id===glossary);
 const openGlossary=(id:string,trigger:HTMLElement)=>{
  if(!practice?.glossary.some(e=>e.id===id)||glossaryRef.current)return;const c=clockRef.current;if(!c)return;
  glossaryTrigger.current=trigger;glossaryResume.current=c.snapshot().phase==='playing'&&!c.snapshot().globalPaused;
  c.pause();props.onRuntimePausedChange(true);glossaryRef.current=id;setGlossary(id);sync.current();
 };
 const closeGlossary=()=>{const resume=glossaryResume.current;glossaryResume.current=false;glossaryRef.current=null;setGlossary(null);if(resume)controlsRef.current?.setPaused(false);const target=glossaryTrigger.current;glossaryTrigger.current=null;requestAnimationFrame(()=>{if(target?.isConnected)target.focus({preventScroll:true});});};
 const closeGlossaryRef=useRef(closeGlossary);closeGlossaryRef.current=closeGlossary;
 useEffect(()=>{if(entry)dialog.current?.querySelector<HTMLButtonElement>('[data-p020-dialog-close]')?.focus({preventScroll:true});},[entry]);
 useEffect(()=>{const keydown=(event:KeyboardEvent)=>{const el=dialog.current;if(!el||!glossaryRef.current)return;
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeGlossaryRef.current();return;}if(event.key!=='Tab')return;
  const items=[...el.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')],first=items[0],last=items.at(-1);
  if(first&&last&&(!el.contains(document.activeElement)||event.shiftKey&&document.activeElement===first||!event.shiftKey&&document.activeElement===last)){event.preventDefault();(event.shiftKey?last:first).focus({preventScroll:true});}
 };document.addEventListener('keydown',keydown,true);return()=>document.removeEventListener('keydown',keydown,true);},[]);
 const subtract=()=>{const c=clockRef.current;if(!c||!c.snapshot().canSubtract||entry)return;props.onRuntimePausedChange(false);void c.subtract({activation:'user',reducedMotion:reduced}).then(r=>{if(!r.accepted)props.onRuntimePausedChange(true);sync.current();});sync.current();};
 const newProblem=()=>{if(entry)return;if(clockRef.current?.newProblem()){props.onRuntimePausedChange(true);sync.current();}};
 const readable=practice&&snapshot?<section data-p020-companion style={{padding:16,border:'1px solid var(--line, #8797a9)',borderRadius:12,background:'var(--paper, white)',color:'var(--ink, #132a40)',fontSize:16,lineHeight:1.5,margin:'12px auto',width:'min(100%,680px)'}}>
  <h3 style={{margin:'0 0 8px',fontSize:18}}>{es?'Resta de enteros':'Subtracting integers'}</h3>
  {snapshot.picture.mainFrame<569?<p data-p020-intro>{es?'Escucha la explicación y observa cómo restar un entero positivo en la recta numérica. Después, elige Restar para ver cada operación.':'Listen to the explanation and watch how to subtract a positive integer on the number line. Then choose Subtract to see each operation.'}</p>:<>
   <p>{es?'Elige Restar para mostrar la respuesta y los saltos en la recta numérica. Puedes elegir un nuevo problema en cualquier momento.':'Choose Subtract to show the answer and the jumps on the number line. You can choose a new problem at any time.'}</p>
   <p data-p020-equation role="status" aria-live="polite" aria-atomic="true" style={{fontWeight:700,fontSize:24,margin:'18px 0'}}>{snapshot.practice.question.replace('-', '−')} {snapshot.practice.picture.revealed?String(snapshot.practice.result).replace('-', '−'):'?'}</p>
   <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
    <button type="button" data-p020-subtract style={buttonStyle} disabled={!snapshot.canSubtract||Boolean(entry)} onClick={subtract}>{es?'Restar':'Subtract'}</button>
    <button type="button" data-p020-new-problem style={buttonStyle} disabled={!snapshot.canNewProblem||Boolean(entry)} onClick={newProblem}>{es?'Nuevo problema':'New problem'}</button>
   </div>
   {snapshot.practice.picture.revealed?<p data-p020-jump-description>{es?`Avanza ${snapshot.practice.value1} desde cero; luego retrocede ${-snapshot.practice.value2}. Llegas a ${snapshot.practice.result}.`:`Move forward ${snapshot.practice.value1} from zero, then move back ${-snapshot.practice.value2}. You reach ${snapshot.practice.result}.`}</p>:null}
  </>}
  <div role="group" aria-label={es?'Términos de la página':'Page terms'} style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:14}}>{practice.controls.filter(c=>snapshot.picture.mainFrame>=c.firstMainFrame&&snapshot.picture.mainFrame<=c.lastMainFrame).map(c=><button key={c.sourceCharacterId} type="button" data-p020-glossary={c.entryId} style={buttonStyle} disabled={Boolean(entry)} onClick={e=>openGlossary(c.entryId,e.currentTarget)}>{c.labels[language]}</button>)}</div>
  {reduced?<p data-p020-reduced-note style={{marginBottom:0,fontSize:14}}>{props.labels.reduced}</p>:null}
 </section>:null;
 const boxStyle:CSSProperties={padding:20,border:'1px solid var(--line, #8797a9)',borderRadius:12,background:'var(--paper, white)',color:'var(--ink, #132a40)',fontSize:16,lineHeight:1.5};
 const modal=entry?<div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(12,25,42,.48)',display:'grid',placeItems:'center',padding:16}}><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`${ID}-dialog-title`} data-p020-dialog={entry.id} style={{...boxStyle,width:'min(100%,620px)',maxHeight:'85dvh',overflowY:'auto',boxShadow:'0 16px 60px #10203044'}}>
  <h3 id={`${ID}-dialog-title`}>{entry.labels[language]}</h3><p>{entry.definitions[language]}</p><button type="button" data-p020-dialog-close style={{...buttonStyle,marginTop:16}} onClick={closeGlossary}>{es?'Cerrar':'Close'}</button>
 </div></div>:null;
 const hitStyle=(b:Bounds):CSSProperties=>({position:'absolute',left:`${b.x/8}%`,top:`${b.y/6}%`,width:`${b.width/8}%`,height:`${b.height/6}%`,minHeight:0,minWidth:0,padding:0,border:0,background:'transparent',cursor:'pointer'});
 return <div className="runtime-shell" style={{height:'auto','--flash-stage-width':'800px','--flash-stage-height':'600px','--flash-stage-aspect':'800 / 600'} as CSSProperties} data-source-clock-runtime={ID} data-source-clock-phase={snapshot?.phase??'loading'} data-source-failure={snapshot?.failure??error??''} data-source-operation={snapshot?.operation??'intro'} data-source-audio-frame={snapshot?.picture.mainFrame??1} data-source-audio-playing={snapshot?.audioNodePlaying?'true':'false'} data-source-answer-frame={snapshot?.practice.picture.answerFrame??1} data-source-answer-revealed={snapshot?.practice.picture.revealed?'true':'false'} data-source-question-ordinal={snapshot?.practice.questionOrdinal??0} data-source-question-index={snapshot?.practice.picture.questionIndex??0} data-source-result={snapshot?.practice.result??0} data-source-quiz-active={snapshot?.sourceQuizActive?'true':'false'} data-source-inspection={snapshot?.inspectionMode?'true':'false'} data-runtime-volume={props.volume??1} data-audio-available={snapshot?'true':'false'} data-runtime-paused={props.paused?'true':'false'} data-runtime-presentation="modern-wide" data-runtime-playback-complete="false">
  <div ref={stage} className="runtime-stage" style={{position:'relative',height:'auto',aspectRatio:'4 / 3'}} data-animation-module={ID} data-flash-frame={paintedFrame} data-flash-frame-domain="sprite-114" data-source-clock-ready={snapshot?'true':'false'}>
   <canvas ref={canvas} width={800} height={600} data-course-canvas={ID} aria-label={es?'Resta de enteros con saltos en la recta numérica':'Subtract integers with jumps on the number line'} style={{display:snapshot?'block':'none',width:'100%',height:'auto'}}/>
   {practice&&snapshot?practice.sourceHotspots.map(h=>{const r=h.ranges.find(r=>paintedFrame>=r.firstFrame&&paintedFrame<=r.lastFrame);if(!r)return null;return <button type="button" key={h.sourceCharacterId} data-p020-source-glossary={h.entryId} disabled={Boolean(entry)} aria-label={practice.glossary.find(e=>e.id===h.entryId)?.labels[language]??h.entryId} onClick={e=>openGlossary(h.entryId,e.currentTarget)} style={hitStyle(r.bounds)}/>;}):null}
   {practice&&snapshot?.picture.mainFrame===569?<>
    <button type="button" data-p020-source-subtract aria-label={es?'Restar en la imagen':'Subtract in the picture'} disabled={!snapshot.canSubtract||Boolean(entry)} onClick={subtract} style={hitStyle(practice.subtractBounds)}/>
    <button type="button" data-p020-source-new-problem aria-label={es?'Nuevo problema en la imagen':'New problem in the picture'} disabled={!snapshot.canNewProblem||Boolean(entry)} onClick={newProblem} style={hitStyle(practice.newProblemBounds)}/>
   </>:null}
  </div>
  {companion&&readable?createPortal(readable,companion):null}{modal&&typeof document!=='undefined'?createPortal(modal,document.body):null}
  {!snapshot&&!error?<p role="status">{props.labels.loading}</p>:null}{error?<p role="alert" data-source-clock-error={error}>{props.labels.unavailable}</p>:null}
 </div>;
}
