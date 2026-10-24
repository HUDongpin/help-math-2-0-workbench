'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps,LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from '@/components/animation-runtime';
import {ContinuousSourceStreamClockCandidate,type ContinuousSourceClockPlan} from '../../../packages/demos/src/continuous-source-stream-clock-candidate';
import type {AnimationModule} from '../../../packages/demos/src/contract';
import type {SourceStaticCanvasCandidateConfig} from '../../../packages/demos/src/source-static-canvas-candidate';
import {ContinuousAudioGlossaryCompanion} from '../../../packages/demos/src/continuous-audio-glossary-companion';
import {validateFrozenGlossaryControls,type FrozenGlossaryControl} from '../../../packages/demos/src/frozen-calibration-glossary-candidate';
import {G678SourceReadingBeatView,type G678SourceReadingBeat as ReadingBeat} from './g678-source-reading-v1';
type Clock=ContinuousSourceStreamClockCandidate;
type SourceHotspot=Readonly<{sourceCharacterId:number;entryId:string;ranges:readonly Readonly<{firstFrame:number;lastFrame:number;rect:Readonly<{left:number;right:number;top:number;bottom:number}>}>[]}>;
type TerminalAttachment=Readonly<{version:1;clockKind:'continuous';PLAN:ContinuousSourceClockPlan;reading:readonly ReadingBeat[];controls:readonly FrozenGlossaryControl[];hotspots:readonly SourceHotspot[];CONFIG:SourceStaticCanvasCandidateConfig;sourceAudioBase64:string;prepare:()=>Promise<unknown>}>;
type SourceTerminalModule=AnimationModule&{readonly privateSourceTerminal:TerminalAttachment};

type View={phase:string;frame:number;audioFrame:number;sample:number;complete:boolean;reduced:boolean;ready:boolean;error:string|null};
// The original indexMI host stops this page at frame646; its bare MovieClip would loop without that host.
export function NmsL1P017SourceRuntimeV3(props:LessonRuntimeAdapterProps&{readingHeading?:Readonly<{en:string;es:string}>}){
  const ID=props.animationId;
  const [glossaryControls,setGlossaryControls]=useState<readonly FrozenGlossaryControl[]>([]),[replayEpoch,setReplayEpoch]=useState(0);
  const [reading,setReading]=useState<readonly ReadingBeat[]>([]);
  const [title,setTitle]=useState('');
  const [hotspots,setHotspots]=useState<readonly SourceHotspot[]>([]);
  const latest=useRef(props);latest.current=props;
  const canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null);
  const [readableTarget,setReadableTarget]=useState<HTMLElement|null>(null);
  useEffect(()=>{
    const source=stage.current,owner=source?.closest('.lesson-shell2__learning-column'),id=props.pageInteractionCompanionTargetId;
    if(!source||!owner||!id?.endsWith('-terminal-source-v1-readable'))return;
    const resolve=()=>{
      const target=source.ownerDocument.getElementById(id);
      const admitted=target?.parentElement===owner&&target.dataset.pageInteractionCompanionHost==='true'&&!source.contains(target)?target:null;
      setReadableTarget(previous=>previous===admitted?previous:admitted);
    };
    resolve();const observer=new MutationObserver(resolve);observer.observe(owner,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[props.pageInteractionCompanionTargetId]);
  const control=useRef<LessonRuntimeAdapterControls|null>(null);
  const clockRef=useRef<Clock|null>(null);
  const closeObserver=useRef<MutationObserver|null>(null);
  useEffect(()=>()=>closeObserver.current?.disconnect(),[]);
  useEffect(()=>{closeObserver.current?.disconnect();closeObserver.current=null;},[replayEpoch]);
  const restoreHotspotAfterClose=(trigger:HTMLButtonElement,h:SourceHotspot)=>{
    closeObserver.current?.disconnect();const selector='[role="dialog"][data-glossary-entry-id="'+h.entryId+'"]';let seen=Boolean(document.querySelector(selector));
    const observer=new MutationObserver(()=>{
      const dialog=document.querySelector<HTMLElement>(selector);
      if(dialog){if(!seen){const r=dialog.getBoundingClientRect();window.scrollBy({top:r.top+r.height/2-window.innerHeight/2,behavior:'instant'});}seen=true;return;}
      if(!seen)return;observer.disconnect();if(closeObserver.current===observer)closeObserver.current=null;
      const frame=Number(canvas.current?.getAttribute('data-flash-frame'));
      if(trigger.isConnected&&!trigger.disabled&&h.ranges.some(r=>frame>=r.firstFrame&&frame<=r.lastFrame))trigger.focus({preventScroll:true});
    });closeObserver.current=observer;observer.observe(document.body,{childList:true,subtree:true});
  };
  const inspectRef=useRef<number|null>(null),lastSeek=useRef(0),completionEligible=useRef(true);
  const [view,setView]=useState<View>({phase:'loading',frame:1,audioFrame:1,sample:0,complete:false,reduced:false,ready:false,error:null});
  useEffect(()=>{
    let active=true,clock:Clock|undefined,raf=0,ticket=0,ready=false,blocked=false;
    let lastPainted=0,lastView='',lastReport='',completeReported=false,wantPlay=!latest.current.paused;
    const abort=new AbortController(),timers=new Set<ReturnType<typeof setTimeout>>();
    const media=matchMedia('(prefers-reduced-motion: reduce)');let reduced=media.matches;
    const changeMotion=()=>{reduced=media.matches;};media.addEventListener('change',changeMotion);
    const pause=()=>{wantPlay=false;ticket++;if(clock&&ready)clock.pause();latest.current.onRuntimePausedChange(true);};
    const start=(activation:'automatic'|'user')=>{
      wantPlay=true;if(!clock||!ready||!active)return;
      if(reduced&&activation==='automatic'){pause();return;}
      if(clock.snapshot().timelineReachedEnd){clock.replay();setReplayEpoch(v=>v+1);completeReported=false;completionEligible.current=true;latest.current.onReplay?.();}
      blocked=false;inspectRef.current=null;latest.current.onRuntimePausedChange(false);
      const turn=++ticket;
      void clock.play({activation,reducedMotion:reduced}).then(result=>{
        if(!active||turn!==ticket)return;
        if(!result.accepted){blocked=true;pause();}
      });
      const timeout=setTimeout(()=>{
        timers.delete(timeout);if(active&&turn===ticket&&clock?.snapshot().phase==='start-pending'){blocked=true;pause();}
      },250);timers.add(timeout);
    };
    const stop=()=>{active=false;ticket++;abort.abort();cancelAnimationFrame(raf);for(const t of timers)clearTimeout(t);timers.clear();void clock?.close();};
    const controls:LessonRuntimeAdapterControls={setPaused:value=>value?pause():start('user'),
      replay(){if(!clock||!ready||!active)return false;ticket++;inspectRef.current=null;completeReported=false;completionEligible.current=true;clock.replay();setReplayEpoch(v=>v+1);start('user');return true;},
      narration:action=>action==='stop'?pause():start('user'),stop};
    control.current=controls;const disconnect=props.connectRuntimeControls(controls);
    const init=async()=>{
      if(!['shared-nms002-l01-p017'].includes(ID)||process.env.NODE_ENV==='production'||props.audioEnabled!==true||props.moduleKey!==ID||props.animationId!==ID||
        props.query.capture==='1'||props.query.lang!=='en'||!props.query.frameDomain?.startsWith('sprite-')||props.query.scenario!=='source-static-frame'||String(props.query.seed)!=='0')throw Error('source-clock-runtime-scope-mismatch');
      const module=await loadClientAnimationModule(ID) as SourceTerminalModule|undefined;if(!active)return;
      const attachment=module?.privateSourceTerminal;
      if(!module||module.key!==ID||!attachment||attachment.version!==1||attachment.CONFIG.animationId!==ID||
        attachment.PLAN.sourceSwfSha256!==attachment.CONFIG.sourceSwfSha256||attachment.PLAN.frameDomain!==props.query.frameDomain||
        attachment.PLAN.lastFrame!==attachment.CONFIG.mainFrameCount||attachment.PLAN.decoder.channels!==1||
        attachment.CONFIG.stage.width!==800||attachment.CONFIG.stage.height!==600)throw Error('registered-terminal-source-clock-missing');
      const member={sourceSwfSha256:attachment.CONFIG.sourceSwfSha256,frameDomain:attachment.PLAN.frameDomain};
      if(attachment.clockKind!=='continuous'||attachment.controls.length!==3||attachment.PLAN.frameDomain!=='sprite-62'||attachment.PLAN.lastFrame!==646)throw Error('source-story-clock-and-glossary-scope');
      if(attachment.controls.length)validateFrozenGlossaryControls(attachment.controls,attachment.PLAN.lastFrame);
      if(attachment.hotspots.length!==3||attachment.hotspots.some(h=>!attachment.controls.some(c=>c.sourceCharacterId===h.sourceCharacterId&&c.entryId===h.entryId)))throw Error('source-hotspot-binding-mismatch');
      setGlossaryControls(attachment.controls);setReading(attachment.reading);setHotspots(attachment.hotspots);setTitle(attachment.CONFIG.title);
      await attachment.prepare();if(!active)return;
      const asset=window.HELP_MATH_CANVAS_ASSETS?.[ID] as (NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string]&{metadata?:{sourceSwfSha256?:string}})|undefined;
      if(!asset||asset.metadata?.sourceSwfSha256!==member.sourceSwfSha256)throw Error('terminal-source-canvas-missing');
      const plan=attachment.PLAN;
      const paint=(frame:number)=>{
        const target=canvas.current;if(!target||!active)return false;
        if(window.HELP_MATH_CANVAS_ASSETS?.[ID]!==asset)return false;
        const state=asset.render(target,{frame,scenario:'source-static-frame',lang:'en',seed:0}) as {localFrame?:number;frameDomain?:string};
        if(state.localFrame!==frame||state.frameDomain!==member.frameDomain||target.getAttribute('data-flash-frame')!==String(frame))return false;
        target.dataset.renderState='ready';target.style.display='block';lastPainted=frame;
        stage.current?.setAttribute('data-flash-frame',String(frame));
        return target.isConnected&&target.width===800&&target.height===600;
      };
      clock=new ContinuousSourceStreamClockCandidate(attachment.PLAN,{commitHeldFrame:paint});clockRef.current=clock;
      // The locally registered module carries the unmodified embedded MP3.
      // Transport verifies its complete source and decoded PCM hashes before use.
      const sourceBytes=Uint8Array.from(atob(attachment.sourceAudioBase64),char=>char.charCodeAt(0));
      const result=await clock.prepare(sourceBytes.buffer);if(!active)return;
      if(!result.accepted)throw Error(result.reason);clock.setVolume(latest.current.volume??1);
      if(!paint(plan.firstFrame))throw Error('source-first-frame-not-painted');ready=true;
      const draw=()=>{
        if(!active||!clock)return;
        const snapshot=clock.snapshot();
        if(snapshot.phase==='failed'){pause();void clock.close();setView(v=>({...v,phase:'failed',ready:false,error:snapshot.audio.failure??'source-host-terminal-failed'}));return;}
        if(snapshot.phase==='paused'&&['interrupted','play-rejected'].includes(snapshot.audio.phase)&&!latest.current.paused){wantPlay=false;latest.current.onRuntimePausedChange(true);}
        const frame=reduced?(snapshot.timelineReachedEnd?plan.lastFrame:lastPainted):snapshot.frame;
        if(frame!==lastPainted&&!paint(frame)){pause();void clock.close();setView(v=>({...v,phase:'failed',ready:false,error:'source-frame-paint-failed'}));return;}
        const narration:AnimationRuntimePlaybackState['narration']=blocked?'blocked':snapshot.phase==='playing'&&!snapshot.audioEnded?'playing':'idle';
        const report:AnimationRuntimePlaybackState={audioAvailable:true,frame,frameCount:plan.lastFrame,frameDomain:plan.frameDomain,fps:plan.fps,narration,
          playbackProgress:reduced||inspectRef.current!==null?null:(frame-plan.firstFrame)/(plan.lastFrame-plan.firstFrame),seekAvailable:true,stepFrames:20,transportMode:'visual-frame-inspector'};
        const reportKey=JSON.stringify(report);if(reportKey!==lastReport){lastReport=reportKey;latest.current.onPlaybackStateChange?.(report);}
        const next:View={phase:snapshot.phase,frame,audioFrame:snapshot.frame,sample:snapshot.audio.decodedSample,complete:snapshot.timelineReachedEnd&&!reduced&&completionEligible.current,reduced,ready:true,error:null};
        const viewKey=[next.phase,next.frame,next.audioFrame,next.complete,next.reduced,blocked].join(':');
        if(viewKey!==lastView){lastView=viewKey;setView(next);}
        if(snapshot.timelineReachedEnd&&!completeReported){completeReported=true;wantPlay=false;if(!reduced&&completionEligible.current)latest.current.onPlaybackComplete?.();latest.current.onRuntimePausedChange(true);}
        raf=requestAnimationFrame(draw);
      };draw();if(wantPlay)start('automatic');else latest.current.onRuntimePausedChange(true);
    };
    void init().catch(error=>{if(!active)return;pause();void clock?.close();setView(v=>({...v,phase:'failed',error:error instanceof Error?error.message:String(error)}));});
    return()=>{stop();media.removeEventListener('change',changeMotion);disconnect();if(control.current===controls)control.current=null;if(clockRef.current===clock)clockRef.current=null;};
  },[ID,props.moduleKey,props.audioEnabled,props.connectRuntimeControls]);
  useEffect(()=>{const clock=clockRef.current;if(!clock)return;
    if(props.paused&&['playing','start-pending'].includes(clock.snapshot().phase))clock.pause();
    else if(!props.paused&&view.ready&&clock.snapshot().phase==='paused')control.current?.setPaused(false);
  },[props.paused,view.ready]);
  useEffect(()=>{clockRef.current?.setVolume(props.volume??1);},[props.volume]);
  useEffect(()=>{
    const request=props.seekRequest,clock=clockRef.current;if(!request||!clock||!view.ready||request.requestId===lastSeek.current)return;
    lastSeek.current=request.requestId;inspectRef.current=request.frame;completionEligible.current=false;clock.seekCandidateFrame(request.frame);props.onRuntimePausedChange(true);
  },[props.seekRequest,view.ready,props.onRuntimePausedChange]);
  useEffect(()=>{if(!props.seekRequest&&inspectRef.current!==null){inspectRef.current=null;if(!props.paused)control.current?.setPaused(false);}},[props.seekRequest,props.paused]);
  useEffect(()=>{
    // The page's existing glossary is portaled to body, outside the lesson keyboard boundary.
    // Keep Escape and Tab within this exact page's three admitted glossary dialogs.
    const keydown=(event:KeyboardEvent)=>{
      const dialog=document.querySelector<HTMLElement>('[role="dialog"][data-glossary-entry-id]');
      if(!view.ready||!stage.current?.isConnected||!dialog||!glossaryControls.some(c=>c.entryId===dialog.dataset.glossaryEntryId))return;
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();latest.current.onLessonHostRequest?.({type:'close-glossary'});return;}
      if(event.key!=='Tab')return;
      const controls=[...dialog.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')];
      const first=controls[0],last=controls.at(-1);if(!first||!last)return;
      if(!dialog.contains(document.activeElement)||event.shiftKey&&document.activeElement===first||!event.shiftKey&&document.activeElement===last){event.preventDefault();(event.shiftKey?last:first).focus();}
    };
    document.addEventListener('keydown',keydown,true);return()=>document.removeEventListener('keydown',keydown,true);
  },[glossaryControls,view.ready]);
  const visibleFrame=view.reduced?view.audioFrame:view.frame;
  const style={height:'auto','--flash-stage-width':'800px','--flash-stage-height':'600px','--flash-stage-aspect':'800 / 600'} as CSSProperties;
  return <div className="runtime-shell" style={style} data-source-clock-runtime={ID} data-source-clock-phase={view.phase} data-source-failure={view.error??''}
    data-audio-available={view.ready?'true':'false'} data-product-audio-enabled={props.audioEnabled?'true':'false'} data-runtime-paused={props.paused?'true':'false'}
    data-runtime-playback-complete={view.complete?'true':'false'} data-source-host-stop-frame="646" data-source-inspection={completionEligible.current?'false':'true'} data-source-playback-mode="once" data-runtime-volume={props.volume??1} data-runtime-presentation="modern-wide"
    data-source-audio-frame={view.audioFrame} data-source-audio-sample={view.sample} data-source-alignment="candidate-not-accepted" data-source-audio-channels={1}>
    <div ref={stage} className="runtime-stage" style={{position:'relative',height:'auto',aspectRatio:'4 / 3'}} data-animation-module={ID} data-flash-frame={view.frame} data-flash-frame-domain={props.query.frameDomain} data-runtime-scenario="source-static-frame" data-source-clock-ready={view.ready?'true':'false'}>
      <canvas ref={canvas} width={800} height={600} data-course-canvas={ID} aria-label={title||props.labels.loading} style={{display:view.ready?'block':'none',width:'100%',height:'auto'}}/>
      {view.ready&&!view.error?hotspots.flatMap(h=>{
        const range=h.ranges.find(r=>view.frame>=r.firstFrame&&view.frame<=r.lastFrame),term=glossaryControls.find(c=>c.sourceCharacterId===h.sourceCharacterId);
        if(!range||!term)return [];
        const r=range.rect;
        return <button key={h.sourceCharacterId} type="button" data-source-hotspot={h.sourceCharacterId}
          aria-label={term.labels[props.uiLanguage??'en']} title={term.labels[props.uiLanguage??'en']}
          style={{position:'absolute',left:`${r.left/8}%`,top:`${r.top/6}%`,width:`${(r.right-r.left)/8}%`,height:`${(r.bottom-r.top)/6}%`,padding:0,minWidth:0,minHeight:0,border:0,borderRadius:0,background:'transparent',color:'transparent',cursor:'pointer'}}
          onClick={event=>{
            const actual=Number(canvas.current?.getAttribute('data-flash-frame'));
            if(!h.ranges.some(r=>actual>=r.firstFrame&&actual<=r.lastFrame))return;
            control.current?.setPaused(true);
            const decision=props.onLessonHostRequest?.({type:'open-glossary',entryId:h.entryId},{trigger:event.currentTarget});
            if(decision?.status==='allowed')restoreHotspotAfterClose(event.currentTarget,h);
            else setView(v=>({...v,error:'source-glossary-request-unavailable'}));
          }}/>;
      }):null}
    </div>
    {view.ready&&readableTarget&&reading.some(beat=>visibleFrame>=beat.firstFrame&&visibleFrame<=beat.lastFrame)?createPortal(
      <section aria-labelledby={`${ID}-readable-title`} data-terminal-source-readable
        style={{margin:'12px auto 0',padding:16,width:'min(100%, 640px)',border:'1px solid var(--lesson-platform-hair, var(--line))',borderRadius:12,
          background:'var(--lesson-platform-surface, var(--paper))',color:'var(--lesson-platform-ink, var(--ink))',fontSize:16,lineHeight:1.5}}>
        <h3 id={`${ID}-readable-title`} style={{fontSize:18,fontWeight:700,margin:'0 0 8px'}}>{props.uiLanguage==='es'?(props.readingHeading?.es??'Idea principal'):(props.readingHeading?.en??'Main idea')}</h3>
        {reading.filter(beat=>visibleFrame>=beat.firstFrame&&visibleFrame<=beat.lastFrame).map(beat=><G678SourceReadingBeatView key={`${beat.firstFrame}-${beat.text}`} beat={beat}/>)}
      </section>,readableTarget):null}
    <ContinuousAudioGlossaryCompanion animationId={ID} controls={glossaryControls} frame={visibleFrame} ready={view.ready&&!view.error} language={props.uiLanguage??'en'} targetId={props.pageInteractionCompanionTargetId} replayEpoch={replayEpoch} readFrame={()=>view.reduced?clockRef.current?.snapshot().frame??1:Number(canvas.current?.getAttribute('data-flash-frame'))} onRequest={props.onLessonHostRequest} onOpened={()=>control.current?.setPaused(true)}/>
    {!view.ready&&!view.error?<p role="status">{props.labels.loading}</p>:null}
    {view.error?<p role="alert" data-source-clock-error={view.error}>{props.labels.unavailable}</p>:null}
    {view.reduced&&readableTarget?createPortal(<p role="status" data-source-reduced-motion-note style={{margin:'12px 0',fontSize:16,lineHeight:1.5}}>{props.labels.reduced}</p>,readableTarget):null}
  </div>;
}
