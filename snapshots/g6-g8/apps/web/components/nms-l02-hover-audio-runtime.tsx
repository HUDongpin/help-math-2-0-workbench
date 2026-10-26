'use client';
import {useCallback,useEffect,useRef,useState,type CSSProperties} from 'react';
import type {LessonRuntimeAdapterProps,LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import {NmsL2HoverCandidateRenderer,type NmsL2HoverConfig,type NmsL2HoverSurface} from '../../../packages/demos/src/nms-l02-hover-candidate';
import {ContinuousSourceStreamClockCandidate,type ContinuousSourceClockPlan} from '../../../packages/demos/src/continuous-source-stream-clock-candidate';

export interface NmsL2HoverAudioPackage {readonly config:NmsL2HoverConfig;readonly plan:ContinuousSourceClockPlan;readonly sourceUrl:string;}
const ID='shared-nms002-l02-p020';
type View={frame:number;audioFrame:number;sample:number;phase:string;ready:boolean;reduced:boolean;error:string|null};

/** A source-bound adapter factory. Calling it does not register or authorize
 * delivery of a candidate; the server's exact package and registry gates remain required. */
export function createNmsL2HoverAudioRuntime(pkg:NmsL2HoverAudioPackage){
  if(pkg.config.animationId!==ID||pkg.plan.sourceSwfSha256!==pkg.config.sourceSwfSha256||pkg.plan.sourceSwfSha256!=='5aaf739cf2ef1b093564d0f64d3799dcfca2ab5ffa7cc0375f4c0b43dc3364b5'||pkg.plan.frameDomain!=='sprite-69'||
    pkg.plan.firstFrame!==1||pkg.plan.lastFrame!==151||pkg.plan.audioFirstFrame!==10||pkg.plan.fps!==12||pkg.plan.latencySamples!==1673||
    pkg.plan.decoder.channels!==1||pkg.plan.decoder.sampleRate!==22050||pkg.plan.decoder.decodedSamples!==260352||pkg.plan.decoder.sourceBytes!==58760||pkg.plan.sourceSegmentCount!==1||pkg.plan.sourceHasNegativeSeek!==false||
    pkg.plan.decoder.sourceSha256!=='d4bb145a64fed85e0a7be5a9a0be1f4b2f0c42e49dd97e023f644e6280a25d55'||
    pkg.plan.decoder.pcmSha256!=='2b202859dd0660b417e905a3d35770d45334c273120332be521eb10984fc9f3d')throw Error('NMS hover audio package mismatch');
  return function NmsL2HoverAudioRuntime(props:LessonRuntimeAdapterProps){
    const latest=useRef(props);latest.current=props;
    const [surface,setSurface]=useState<NmsL2HoverSurface|null>(null);
    const [view,setView]=useState<View>({frame:1,audioFrame:1,sample:0,phase:'loading',ready:false,reduced:false,error:null});
    const [replay,setReplay]=useState(0);
    const clockRef=useRef<ContinuousSourceStreamClockCandidate|null>(null),controlsRef=useRef<LessonRuntimeAdapterControls|null>(null);
    const inspected=useRef(false),lastSeek=useRef(0);
    const receiveSurface=useCallback((value:NmsL2HoverSurface|null)=>setSurface(value),[]);
    useEffect(()=>{
      if(!surface)return;
      let active=true,ready=false,raf=0,ticket=0,clock:ContinuousSourceStreamClockCandidate|undefined;
      let wantPlay=!latest.current.paused,completeReported=false,lastView='',lastReport='';
      const abort=new AbortController(),timeouts=new Set<ReturnType<typeof setTimeout>>();
      const media=matchMedia('(prefers-reduced-motion: reduce)');let reduced=media.matches;
      const motion=()=>{reduced=media.matches;};media.addEventListener('change',motion);
      const pause=()=>{wantPlay=false;ticket++;if(ready)clock?.pause();latest.current.onRuntimePausedChange(true);};
      const reset=()=>{surface.clearInteractions();clock?.replay();surface.paint(1);inspected.current=false;completeReported=false;setReplay(n=>n+1);};
      const start=(activation:'automatic'|'user')=>{
        wantPlay=true;if(!active||!clock||!ready)return;
        if(reduced&&activation==='automatic'){pause();return;}
        if(clock.snapshot().timelineReachedEnd){reset();latest.current.onReplay?.();}
        inspected.current=false;latest.current.onRuntimePausedChange(false);const turn=++ticket;
        void clock.play({activation,reducedMotion:reduced}).then(result=>{if(active&&turn===ticket&&!result.accepted)pause();});
        const timeout=setTimeout(()=>{timeouts.delete(timeout);if(active&&turn===ticket&&clock?.snapshot().phase==='start-pending')pause();},250);timeouts.add(timeout);
      };
      const stop=()=>{active=false;ticket++;abort.abort();cancelAnimationFrame(raf);for(const t of timeouts)clearTimeout(t);timeouts.clear();surface.clearInteractions();void clock?.close();};
      const controls:LessonRuntimeAdapterControls={setPaused:paused=>paused?pause():start('user'),
        replay(){if(!active||!ready)return false;ticket++;reset();start('user');return true;},
        narration:action=>action==='stop'?pause():start('user'),stop};
      controlsRef.current=controls;const disconnect=props.connectRuntimeControls(controls);
      const init=async()=>{
        if(process.env.NODE_ENV==='production'||props.moduleKey!==ID||props.animationId!==ID||props.audioEnabled!==true||
          props.query.capture==='1'||props.query.lang!=='en'||props.query.frameDomain!=='sprite-69'||props.query.scenario!=='source-static-frame'||String(props.query.seed)!=='0')throw Error('NMS hover runtime scope mismatch');
        clock=new ContinuousSourceStreamClockCandidate(pkg.plan,{commitHeldFrame:frame=>surface.paint(frame)});clockRef.current=clock;
        const url=new URL(pkg.sourceUrl,location.origin);
        if(url.origin!==location.origin||url.pathname!==`/flash-assets/g678-local/${ID}/source-stream.mp3`||url.search!==`?sha256=${pkg.plan.decoder.sourceSha256}`)throw Error('NMS source audio URL mismatch');
        const response=await fetch(url,{redirect:'error',cache:'no-store',signal:abort.signal});
        if(!response.ok||response.redirected||response.url!==url.href||response.headers.get('content-type')?.split(';')[0]!=='audio/mpeg'||response.headers.get('content-length')!==String(pkg.plan.decoder.sourceBytes))throw Error('NMS source audio delivery mismatch');
        const prepared=await clock.prepare(await response.arrayBuffer());if(!active)return;
        if(!prepared.accepted||!surface.paint(1))throw Error('NMS source audio preparation failed');
        ready=true;clock.setVolume(latest.current.volume??1);
        const draw=()=>{
          if(!active||!clock)return;
          const state=clock.snapshot();
          if(state.phase==='paused'&&['interrupted','play-rejected'].includes(state.audio.phase)&&!latest.current.paused){wantPlay=false;latest.current.onRuntimePausedChange(true);}
          const frame=reduced?surface.readFrame():state.frame;
          if(surface.readFrame()!==frame&&!surface.paint(frame)){pause();setView(v=>({...v,error:'NMS source paint failed'}));return;}
          const next:View={frame,audioFrame:state.frame,sample:state.audio.decodedSample,phase:state.phase,ready:true,reduced,error:null};
          const key=[next.phase,next.frame,next.audioFrame,next.reduced].join(':');if(key!==lastView){lastView=key;setView(next);}
          const report:AnimationRuntimePlaybackState={audioAvailable:true,frame,frameCount:151,frameDomain:'sprite-69',fps:12,
            narration:state.phase==='playing'&&!state.audioEnded?'playing':'idle',playbackProgress:reduced||inspected.current?null:(frame-1)/150,
            seekAvailable:true,stepFrames:20,transportMode:'visual-frame-inspector'};
          const reportKey=JSON.stringify(report);if(reportKey!==lastReport){lastReport=reportKey;latest.current.onPlaybackStateChange?.(report);}
          if(state.timelineReachedEnd&&!inspected.current&&!completeReported){completeReported=true;if(!reduced)latest.current.onPlaybackComplete?.();latest.current.onRuntimePausedChange(true);}
          raf=requestAnimationFrame(draw);
        };draw();if(wantPlay)start('automatic');else latest.current.onRuntimePausedChange(true);
      };
      void init().catch(error=>{if(!active)return;pause();void clock?.close();setView(v=>({...v,phase:'failed',error:error instanceof Error?error.message:String(error)}));});
      return()=>{stop();media.removeEventListener('change',motion);disconnect();if(clockRef.current===clock)clockRef.current=null;if(controlsRef.current===controls)controlsRef.current=null;};
    },[surface,props.moduleKey,props.audioEnabled,props.connectRuntimeControls]);
    useEffect(()=>{
      const clock=clockRef.current;if(!clock)return;
      if(props.paused&&['playing','start-pending'].includes(clock.snapshot().phase))clock.pause();
      else if(!props.paused&&view.ready&&clock.snapshot().phase==='paused')controlsRef.current?.setPaused(false);
    },[props.paused,view.ready]);
    useEffect(()=>{clockRef.current?.setVolume(props.volume??1);},[props.volume]);
    useEffect(()=>{
      const request=props.seekRequest,clock=clockRef.current;if(!request||!clock||!view.ready||lastSeek.current===request.requestId)return;
      lastSeek.current=request.requestId;inspected.current=true;
      if(request.frame<149)surface?.clearInteractions();
      clock.seekCandidateFrame(request.frame);props.onRuntimePausedChange(true);
    },[props.seekRequest,view.ready,props.onRuntimePausedChange,surface]);
    const style={'--flash-stage-width':'800px','--flash-stage-height':'600px','--flash-stage-aspect':'800 / 600'} as CSSProperties;
    return <div className="runtime-shell" style={style} data-source-clock-runtime={ID} data-source-clock-phase={view.phase}
      data-source-audio-frame={view.audioFrame} data-source-audio-sample={view.sample} data-source-clock-ready={view.ready?'true':'false'}
      data-runtime-paused={props.paused?'true':'false'} data-source-alignment="candidate-not-accepted">
      <div className="runtime-stage" data-animation-module={ID} data-flash-frame={view.frame} data-flash-frame-domain="sprite-69">
        <NmsL2HoverCandidateRenderer config={pkg.config} frame={view.frame} replay={replay} seed={0} lang="en" uiLanguage={props.uiLanguage??'en'}
          frameDomain="sprite-69" scenario="source-static-frame" externalClock onSurfaceReady={receiveSurface}
          pageInteractionCompanionTargetId={props.pageInteractionCompanionTargetId}
          onLessonHostRequest={props.onLessonHostRequest?(request,options)=>{const result=props.onLessonHostRequest?.(request,options);if(result?.status==='allowed'&&request.type==='open-glossary')controlsRef.current?.setPaused(true);return result!;}:undefined} />
      </div>
      {!view.ready&&!view.error?<p role="status">{props.labels.loading}</p>:null}
      {view.error?<p role="alert" data-source-clock-error={view.error}>{props.labels.unavailable}</p>:null}
    </div>;
  };
}
