'use client';
import {bindTechnicalOwner,nativeTechnicalOwner,publishTechnicalCommit,publishTechnicalState,retireTechnicalObservation,failTechnicalObservation,type TechnicalOwner} from '../../../packages/demos/src/technical-observation-v1';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps,LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from '@/components/animation-runtime';
import {ContinuousSourceStreamClockCandidate} from '../../../packages/demos/src/continuous-source-stream-clock-candidate';
import type {ContinuousSourceClockModule} from '../../../packages/demos/src/continuous-source-clock-attachment';

import {ContinuousAudioGlossaryCompanion} from '../../../packages/demos/src/continuous-audio-glossary-companion';
import {validateFrozenGlossaryControls,type FrozenGlossaryControl} from '../../../packages/demos/src/frozen-calibration-glossary-candidate';
import {frozenContinuousSourceMember} from '../../../packages/demos/src/frozen-continuous-source-scope';
type View={phase:string;frame:number;audioFrame:number;sample:number;reduced:boolean;ready:boolean;error:string|null};
export function ContinuousSourceClockRuntime(props:LessonRuntimeAdapterProps){
  const member=frozenContinuousSourceMember(props.moduleKey),ID=props.moduleKey;
  const [glossaryControls,setGlossaryControls]=useState<readonly FrozenGlossaryControl[]>([]),[replayEpoch,setReplayEpoch]=useState(0);
  const latest=useRef(props);latest.current=props;
  const canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null);
  const control=useRef<LessonRuntimeAdapterControls|null>(null);
  const clockRef=useRef<ContinuousSourceStreamClockCandidate|null>(null);
  const inspectRef=useRef<number|null>(null),lastSeek=useRef(0);
  const [view,setView]=useState<View>({phase:'loading',frame:1,audioFrame:1,sample:0,reduced:false,ready:false,error:null});
  useEffect(()=>{
    let active=true,clock:ContinuousSourceStreamClockCandidate|undefined,raf=0,ticket=0,ready=false,blocked=false;
    let observedReplay=0,observedSourceSha='';
    const observationOwner=():TechnicalOwner|null=>clock&&canvas.current&&observedSourceSha?nativeTechnicalOwner(clock,canvas.current,ID,observedSourceSha,observedReplay):null;
    let lastPainted=0,lastView='',lastReport='',completeReported=false,wantPlay=!latest.current.paused;
    const abort=new AbortController(),timers=new Set<ReturnType<typeof setTimeout>>();
    const media=matchMedia('(prefers-reduced-motion: reduce)');let reduced=media.matches;
    const changeMotion=()=>{reduced=media.matches;};media.addEventListener('change',changeMotion);
    const pause=()=>{wantPlay=false;ticket++;if(clock&&ready)clock.pause();latest.current.onRuntimePausedChange(true);};
    const start=(activation:'automatic'|'user')=>{
      wantPlay=true;if(!clock||!ready||!active)return;
      if(reduced&&activation==='automatic'){pause();return;}
      if(clock.snapshot().timelineReachedEnd){if(clock.replay().accepted)observedReplay++;setReplayEpoch(v=>v+1);completeReported=false;latest.current.onReplay?.();}
      blocked=false;inspectRef.current=null;latest.current.onRuntimePausedChange(false);
      const turn=++ticket;
      void clock.play({activation,reducedMotion:reduced}).then(result=>{
        if(!active||turn!==ticket)return;
        if(!result.accepted){blocked=true;pause();}
      });
      const timeout=setTimeout(bindTechnicalOwner(()=>{
        timers.delete(timeout);if(active&&turn===ticket&&clock?.snapshot().phase==='start-pending'){blocked=true;pause();}
      },observationOwner()),250);timers.add(timeout);
    };
    const stop=()=>{active=false;ticket++;abort.abort();cancelAnimationFrame(raf);for(const t of timers)clearTimeout(t);timers.clear();retireTechnicalObservation(canvas.current,observationOwner());void clock?.close();};
    const controls:LessonRuntimeAdapterControls={setPaused:value=>value?pause():start('user'),
      replay(){if(!clock||!ready||!active)return false;ticket++;inspectRef.current=null;completeReported=false;if(clock.replay().accepted)observedReplay++;setReplayEpoch(v=>v+1);start('user');return true;},
      narration:action=>action==='stop'?pause():start('user'),stop};
    control.current=controls;const disconnect=props.connectRuntimeControls(controls);
    const init=async()=>{
      if(!member||process.env.NODE_ENV==='production'||props.audioEnabled!==true||props.moduleKey!==ID||props.animationId!==ID||
        props.query.capture==='1'||props.query.lang!=='en'||props.query.frameDomain!==member.frameDomain||props.query.scenario!=='source-static-frame'||String(props.query.seed)!=='0')throw Error('source-clock-runtime-scope-mismatch');
      const module=await loadClientAnimationModule(ID) as ContinuousSourceClockModule|undefined;if(!active)return;
      const attachment=module?.privateSourceClock;
      if(!module||module.key!==ID||attachment?.kind!=='continuous-source-clock-candidate-v1'||attachment.plan.sourceSwfSha256!==member.sourceSwfSha256||attachment.plan.decoder.channels!==member.channels)throw Error('registered-source-clock-attachment-missing');
      const plan=attachment.plan;
      const glossary=module.privateGlossaryControls??[];
      if(member.glossary!==Boolean(glossary.length))throw Error('source-glossary-scope-mismatch');
      if(glossary.length)validateFrozenGlossaryControls(glossary,plan.lastFrame);
      setGlossaryControls(glossary);
      observedSourceSha=plan.sourceSwfSha256;
      const paint=(frame:number)=>{
        const target=canvas.current;if(!target||!active)return false;
        if(!attachment.renderFrame(target,frame))return false;
        target.dataset.renderState='ready';target.style.display='block';lastPainted=frame;
        const owner=observationOwner();if(owner)publishTechnicalCommit(target,owner,'source-canvas-with-clock',{frame,frameDomain:plan.frameDomain,errors:[],missing:[]},{paused:latest.current.paused});
        stage.current?.setAttribute('data-flash-frame',String(frame));
        const bounds=target.getBoundingClientRect();return bounds.width>0&&bounds.height>0;
      };
      clock=new ContinuousSourceStreamClockCandidate(plan,{commitHeldFrame:paint,technicalOwner:observationOwner});clockRef.current=clock;
      const url=new URL(attachment.sourceUrl,location.origin);
      if(url.origin!==location.origin||url.pathname!==`/flash-assets/g678-local/${ID}/source-stream.mp3`||url.searchParams.get('sha256')!==plan.decoder.sourceSha256)throw Error('source-audio-url-mismatch');
      const response=await fetch(url,{redirect:'error',cache:'no-store',signal:abort.signal});
      if(!response.ok||response.redirected||response.url!==url.href||response.headers.get('content-type')?.split(';')[0]!=='audio/mpeg')throw Error('source-audio-delivery-failed');
      const length=response.headers.get('content-length');if(length!==String(plan.decoder.sourceBytes))throw Error('source-audio-size-mismatch');
      const result=await clock.prepare(await response.arrayBuffer());if(!active)return;
      if(!result.accepted)throw Error(result.reason);clock.setVolume(latest.current.volume??1);
      if(!paint(plan.firstFrame))throw Error('source-first-frame-not-painted');ready=true;
      const draw=()=>{
        if(!active||!clock)return;
        const snapshot=clock.snapshot();
        const observedOwner=observationOwner();if(observedOwner&&canvas.current)publishTechnicalState(canvas.current,observedOwner,{frame:snapshot.frame,frameDomain:plan.frameDomain,phase:snapshot.phase},{paused:latest.current.paused,playbackComplete:snapshot.timelineReachedEnd&&inspectRef.current===null});
        if(snapshot.phase==='paused'&&['interrupted','play-rejected'].includes(snapshot.audio.phase)&&!latest.current.paused){wantPlay=false;latest.current.onRuntimePausedChange(true);}
        const frame=reduced?lastPainted:snapshot.frame;
        if(frame!==lastPainted&&!paint(frame)){failTechnicalObservation(canvas.current,'source-frame-paint-failed');pause();setView(v=>({...v,error:'source-frame-paint-failed'}));return;}
        if(observedOwner&&canvas.current)publishTechnicalState(canvas.current,observedOwner,{frame,frameDomain:plan.frameDomain,phase:snapshot.phase},{paused:latest.current.paused,playbackComplete:snapshot.timelineReachedEnd&&inspectRef.current===null});
        const narration:AnimationRuntimePlaybackState['narration']=blocked?'blocked':snapshot.phase==='playing'&&!snapshot.audioEnded?'playing':'idle';
        const report:AnimationRuntimePlaybackState={audioAvailable:true,frame,frameCount:plan.lastFrame,frameDomain:plan.frameDomain,fps:plan.fps,narration,
          playbackProgress:reduced||inspectRef.current!==null?null:(frame-plan.firstFrame)/(plan.lastFrame-plan.firstFrame),seekAvailable:true,stepFrames:20,transportMode:'visual-frame-inspector'};
        const reportKey=JSON.stringify(report);if(reportKey!==lastReport){lastReport=reportKey;latest.current.onPlaybackStateChange?.(report);}
        const next:View={phase:snapshot.phase,frame,audioFrame:snapshot.frame,sample:snapshot.audio.decodedSample,reduced,ready:true,error:null};
        const viewKey=[next.phase,next.frame,next.audioFrame,next.reduced,blocked].join(':');
        if(viewKey!==lastView){lastView=viewKey;setView(next);}
        if(snapshot.timelineReachedEnd&&inspectRef.current===null&&!completeReported){completeReported=true;if(!reduced)latest.current.onPlaybackComplete?.();latest.current.onRuntimePausedChange(true);}
        raf=requestAnimationFrame(bindTechnicalOwner(draw,observationOwner()));
      };draw();if(wantPlay)start('automatic');else latest.current.onRuntimePausedChange(true);
    };
    void init().catch(error=>{if(!active)return;failTechnicalObservation(canvas.current,error);pause();void clock?.close();setView(v=>({...v,phase:'failed',error:error instanceof Error?error.message:String(error)}));});
    return()=>{stop();media.removeEventListener('change',changeMotion);disconnect();if(control.current===controls)control.current=null;if(clockRef.current===clock)clockRef.current=null;};
  },[props.moduleKey,props.audioEnabled,props.connectRuntimeControls]);
  useEffect(()=>{const clock=clockRef.current;if(!clock)return;
    if(props.paused&&['playing','start-pending'].includes(clock.snapshot().phase))clock.pause();
    else if(!props.paused&&view.ready&&clock.snapshot().phase==='paused')control.current?.setPaused(false);
  },[props.paused,view.ready]);
  useEffect(()=>{clockRef.current?.setVolume(props.volume??1);},[props.volume]);
  useEffect(()=>{
    const request=props.seekRequest,clock=clockRef.current;if(!request||!clock||!view.ready||request.requestId===lastSeek.current)return;
    lastSeek.current=request.requestId;inspectRef.current=request.frame;clock.seekCandidateFrame(request.frame);props.onRuntimePausedChange(true);
  },[props.seekRequest,view.ready,props.onRuntimePausedChange]);
  useEffect(()=>{if(!props.seekRequest&&inspectRef.current!==null){inspectRef.current=null;if(!props.paused)control.current?.setPaused(false);}},[props.seekRequest,props.paused]);
  const style={'--flash-stage-width':'800px','--flash-stage-height':'600px','--flash-stage-aspect':'800 / 600'} as CSSProperties;
  return <div className="runtime-shell" style={style} data-source-clock-runtime={ID} data-source-clock-phase={view.phase}
    data-audio-available={view.ready?'true':'false'} data-product-audio-enabled={props.audioEnabled?'true':'false'} data-runtime-paused={props.paused?'true':'false'}
    data-runtime-playback-complete={view.phase==='timeline-ended'&&!view.reduced&&inspectRef.current===null?'true':'false'} data-runtime-volume={props.volume??1} data-runtime-presentation="legacy-shell"
    data-source-audio-frame={view.audioFrame} data-source-audio-sample={view.sample} data-source-alignment="candidate-not-accepted" data-source-audio-channels={member?.channels}>
    <div ref={stage} className="runtime-stage" data-animation-module={ID} data-flash-frame={view.frame} data-flash-frame-domain={member?.frameDomain} data-runtime-scenario="source-static-frame" data-source-clock-ready={view.ready?'true':'false'}>
      <canvas ref={canvas} width={800} height={600} data-course-canvas={ID} aria-label={props.uiLanguage==='es'?'Animación de origen':'Source animation'} style={{display:view.ready?'block':'none',width:'100%',height:'auto'}}/>
    </div>
    <ContinuousAudioGlossaryCompanion animationId={ID} controls={glossaryControls} frame={view.frame} ready={view.ready&&!view.error} language={props.uiLanguage??'en'} targetId={props.pageInteractionCompanionTargetId} replayEpoch={replayEpoch} readFrame={()=>Number(canvas.current?.getAttribute('data-flash-frame'))} onRequest={props.onLessonHostRequest} onOpened={()=>control.current?.setPaused(true)}/>
    {!view.ready&&!view.error?<p role="status">{props.labels.loading}</p>:null}
    {view.error?<p role="alert" data-source-clock-error={view.error}>{props.labels.unavailable}</p>:null}
    {view.reduced?<p role="status">{props.labels.reduced}</p>:null}
  </div>;
}
