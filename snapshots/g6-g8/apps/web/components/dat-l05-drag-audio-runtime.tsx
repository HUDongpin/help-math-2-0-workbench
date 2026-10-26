'use client';
import{useCallback,useEffect,useRef,useState,type CSSProperties}from'react';
import type{LessonRuntimeAdapterProps,LessonRuntimeAdapterControls}from'@/lib/lesson-runtime-adapter';
import type{AnimationRuntimePlaybackState}from'./animation-runtime';
import{DatL05DragCandidateRenderer,type DatL05DragConfig,type DatL05DragSurface,type DatL05View,type DatL05DragActions}from'../../../packages/demos/src/dat-l05-drag-candidate';
import{DatL05SourceAudioCandidate,type DatL05AudioPlan}from'../../../packages/demos/src/dat-l05-source-audio-candidate';
const ID='shared-dat001-l05-p040';
export interface DatL05DragAudioPackage{readonly config:DatL05DragConfig;readonly plan:DatL05AudioPlan;readonly audioSources:readonly Readonly<{frameDomain:string;bytes:number;sha256:string;url:string}>[];}
async function fetchBoundAudio(source:DatL05DragAudioPackage['audioSources'][number],signal:AbortSignal){
 const url=new URL(source.url,location.origin);if(url.origin!==location.origin||url.pathname!==`/flash-assets/g678-local/${ID}/interactive-audio/${source.frameDomain}`||url.search!==`?sha256=${source.sha256}`)throw Error('DAT source URL mismatch');
 const r=await fetch(url,{redirect:'error',cache:'no-store',signal});if(!r.ok||r.redirected||r.url!==url.href||r.headers.get('content-type')?.split(';')[0]!=='audio/mpeg'||r.headers.get('content-length')!==String(source.bytes)||!r.body)throw Error('DAT source response mismatch');
 const bytes=new Uint8Array(source.bytes),reader=r.body.getReader();let offset=0;try{while(true){const{done,value}=await reader.read();if(done)break;if(offset+value.length>bytes.length)throw Error('DAT source response too large');bytes.set(value,offset);offset+=value.length;}if(offset!==bytes.length)throw Error('DAT source response truncated');}catch(e){await reader.cancel();throw e;}finally{reader.releaseLock();}return bytes.buffer;
}
export function createDatL05DragAudioRuntime(pkg:DatL05DragAudioPackage){
 if(pkg.config.animationId!==ID||pkg.config.sourceSwfSha256!==pkg.plan.sourceSwfSha256||pkg.plan.clips.length!==8||pkg.audioSources.length!==8||new Set(pkg.audioSources.map(s=>s.frameDomain)).size!==8||pkg.audioSources.some(s=>{const c=pkg.plan.clips.find(c=>c.frameDomain===s.frameDomain);return!c||s.bytes!==c.decoder.sourceBytes||s.sha256!==c.decoder.sourceSha256;}))throw Error('DAT source package mismatch');
 return function DatL05DragAudioRuntime(props:LessonRuntimeAdapterProps){
  const latest=useRef(props);latest.current=props;
  const[surface,setSurface]=useState<DatL05DragSurface|null>(null),[view,setView]=useState<DatL05View|null>(null),[ready,setReady]=useState(false),[error,setError]=useState<string|null>(null),[reduced,setReduced]=useState(false);
  const clockRef=useRef<DatL05SourceAudioCandidate|null>(null),controlsRef=useRef<LessonRuntimeAdapterControls|null>(null),actionRef=useRef<DatL05DragActions|null>(null),lastSeek=useRef(0),liveMotion=useRef(false);
  const receive=useCallback((s:DatL05DragSurface|null)=>setSurface(s),[]);
  useEffect(()=>{
   if(!surface)return;let active=true,loaded=false,raf=0,ticket=0,complete=false,lastView='',lastReport='',lastPaused:boolean|undefined,seed=Number(latest.current.query.seed??0)>>>0;
   const abort=new AbortController(),timers=new Set<ReturnType<typeof setTimeout>>(),media=matchMedia('(prefers-reduced-motion: reduce)');liveMotion.current=media.matches;setReduced(media.matches);const motion=()=>{liveMotion.current=media.matches;setReduced(media.matches);};media.addEventListener('change',motion);
   const clock=new DatL05SourceAudioCandidate(pkg.plan,{commitPicture:p=>surface.paint(p)});clockRef.current=clock;
   const publishPause=(value:boolean)=>{if(lastPaused!==value){lastPaused=value;latest.current.onRuntimePausedChange(value);}};
   const pause=()=>{ticket++;clock.pause();publishPause(true);};
   const start=(activation:'user'|'automatic')=>{if(!active||!loaded)return;if(clock.snapshot().phase==='ended'){seed=(seed+1)%12;clock.replay(seed);complete=false;latest.current.onReplay?.();}const turn=++ticket;publishPause(false);void clock.play({activation,reducedMotion:liveMotion.current}).then(r=>{if(active&&turn===ticket&&!r.accepted)publishPause(true);});const t=setTimeout(()=>{timers.delete(t);if(active&&turn===ticket&&clock.snapshot().phase.startsWith('starting-'))pause();},250);timers.add(t);};
   const stop=()=>{if(!active)return;active=false;ticket++;abort.abort();cancelAnimationFrame(raf);for(const t of timers)clearTimeout(t);timers.clear();void clock.close();};
   const controls:LessonRuntimeAdapterControls={setPaused:v=>v?pause():start('user'),replay(){if(!active||!loaded)return false;ticket++;seed=(seed+1)%12;const r=clock.replay(seed);if(!r.accepted)return false;complete=false;start('user');return true;},narration:action=>action==='stop'?pause():start('user'),stop};controlsRef.current=controls;const disconnect=props.connectRuntimeControls(controls);
   const act=(fn:()=>Promise<unknown>|unknown)=>{if(!active||!loaded)return;void Promise.resolve(fn()).catch(e=>{if(active){pause();void clock.close();setError(e instanceof Error?e.message:String(e));}});};
   actionRef.current={press:id=>act(()=>clock.press(id)),move:(x,y)=>act(()=>clock.moveDrag(x,y)),drop:id=>{publishPause(false);act(()=>clock.drop(id,{activation:'user',reducedMotion:liveMotion.current}));},cancel:()=>act(()=>clock.cancelDrag()),openPopup:id=>act(()=>clock.openPopup(id)),closePopup:id=>act(()=>clock.closePopup(id))};
   const init=async()=>{
    if(process.env.NODE_ENV==='production'||props.moduleKey!==ID||props.animationId!==ID||props.audioEnabled!==true||props.query.capture==='1'||props.query.lang!=='en'||props.query.frameDomain!=='sprite-315'||props.query.scenario!=='source-static-frame'||!Number.isSafeInteger(Number(props.query.seed??0)))throw Error('DAT runtime scope mismatch');
    const payloads=new Map(await Promise.all(pkg.audioSources.map(async s=>[s.frameDomain,await fetchBoundAudio(s,abort.signal)] as const)));if(!active)return;const prepared=await clock.prepare(payloads);if(!active)return;if(!prepared.accepted||!clock.replay(seed).accepted)throw Error('DAT source preparation failed');loaded=true;setReady(true);clock.setVolume(latest.current.volume??1);
    const draw=()=>{if(!active)return;const state=clock.tick(),moving=['main-playing','feedback-playing'].includes(state.phase),inspect=state.inspectionMode;
     if((!liveMotion.current||!moving||inspect)&&JSON.stringify(surface.readPicture())!==JSON.stringify(state.picture)&&!surface.paint(state.picture)){pause();setError('DAT source frame could not be painted');return;}
     const key=JSON.stringify([state.phase,state.picture,state.inspectionMode,state.interaction,state.globalPaused,state.audioNodePlaying]);if(lastView!==key){lastView=key;setView(state);}publishPause(state.globalPaused);
     const frame=surface.readPicture().mainFrame,report:AnimationRuntimePlaybackState={audioAvailable:true,frame,frameCount:254,frameDomain:'sprite-315',fps:12,narration:state.audioNodePlaying?'playing':'idle',playbackProgress:liveMotion.current||inspect?null:(frame-1)/253,seekAvailable:true,stepFrames:20,transportMode:'visual-frame-inspector'};const k=JSON.stringify(report);if(k!==lastReport){lastReport=k;latest.current.onPlaybackStateChange?.(report);}
     if(state.phase==='ended'&&!complete){complete=true;if(!inspect&&!liveMotion.current&&state.interaction.correctDrops===5)latest.current.onPlaybackComplete?.();}raf=requestAnimationFrame(draw);
    };draw();if(!latest.current.paused)start('automatic');else publishPause(true);
   };
   setReady(false);setError(null);setView(null);void init().catch(e=>{if(active){pause();void clock.close();setError(e instanceof Error?e.message:String(e));}});
   return()=>{stop();media.removeEventListener('change',motion);disconnect();if(clockRef.current===clock)clockRef.current=null;if(controlsRef.current===controls){controlsRef.current=null;actionRef.current=null;}};
  },[surface,props.moduleKey,props.audioEnabled,props.connectRuntimeControls]);
  useEffect(()=>{const c=clockRef.current;if(!c)return;const s=c.snapshot();if(props.paused&&!s.globalPaused)c.pause();else if(!props.paused&&s.globalPaused)controlsRef.current?.setPaused(false);},[props.paused]);
  useEffect(()=>{clockRef.current?.setVolume(props.volume??1);},[props.volume]);
  useEffect(()=>{const r=props.seekRequest,c=clockRef.current;if(!r||!c||!ready||r.requestId===lastSeek.current)return;lastSeek.current=r.requestId;c.inspectMainFrameForAudit(r.frame);props.onRuntimePausedChange(true);},[props.seekRequest,props.onRuntimePausedChange,ready]);
  const actions=useRef<DatL05DragActions>({press:id=>actionRef.current?.press(id),move:(x,y)=>actionRef.current?.move(x,y),drop:id=>actionRef.current?.drop(id),cancel:()=>actionRef.current?.cancel(),openPopup:id=>actionRef.current?.openPopup(id),closePopup:id=>actionRef.current?.closePopup(id)});
  const style={'--flash-stage-width':'800px','--flash-stage-height':'600px','--flash-stage-aspect':'800 / 600'} as CSSProperties;
  return<div className="runtime-shell" style={style} data-source-clock-runtime={ID} data-source-clock-phase={view?.phase??'loading'} data-source-clock-ready={ready?'true':'false'} data-source-audio-frame={view?.picture.mainFrame??1} data-source-feedback-seed={view?.feedbackSeed??0} data-source-feedback-object={view?.picture.interaction.feedbackObjectId??''} data-source-feedback-frame={view?.picture.interaction.feedbackFrame??1} data-source-drag-count={view?.interaction.correctDrops??0} data-source-audio-inspection={view?.inspectionMode?'true':'false'} data-source-global-paused={view?.globalPaused?'true':'false'} data-runtime-paused={props.paused?'true':'false'} data-source-alignment="candidate-not-accepted">
   <div className="runtime-stage" data-animation-module={ID} data-flash-frame={view?.picture.mainFrame??1} data-flash-frame-domain="sprite-315" data-runtime-scenario="source-static-frame"><DatL05DragCandidateRenderer config={pkg.config} view={view??undefined} actions={actions.current} onSurfaceReady={receive} externalClock frame={view?.picture.mainFrame??1} seed={Number(props.query.seed??0)} lang="en" uiLanguage={props.uiLanguage??'en'} frameDomain="sprite-315" scenario="source-static-frame" reducedMotion={reduced} pageInteractionCompanionTargetId={props.pageInteractionCompanionTargetId} onLessonHostRequest={props.onLessonHostRequest?(request,options)=>{const r=props.onLessonHostRequest!(request,options);if(r?.status==='allowed'&&request.type==='open-glossary')controlsRef.current?.setPaused(true);return r;}:undefined}/></div>
   {!ready&&!error?<p role="status">{props.labels.loading}</p>:null}{error?<p role="alert" data-source-clock-error={error}>{props.labels.unavailable}</p>:null}
  </div>;
 };
}
