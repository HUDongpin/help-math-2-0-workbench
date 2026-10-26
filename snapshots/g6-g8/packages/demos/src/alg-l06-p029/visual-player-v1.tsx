'use client';
import React,{useEffect,useRef,useState} from 'react';
import type {DecodedSourceStreamBinding} from '../decoded-source-stream-transport';
import {p029Adpcm179EntryPolicy} from './adpcm179-entry-policy-v1';
import {P029AudioOwnerCueV3} from './audio-owner-v3';
import {P029_AUDIO_MANIFEST} from './audio-schedule-v1';
import {loadP029Audio} from './browser-audio-v1';
import {P029DomainClockCueV4} from './domain-clock-v4';
import type {P029GlossaryKey}
 from './native-source-v1';
import type {P029Kind} from './quiz-reducer-v1';
import {P029ProductSessionV2,type P029CanvasAssetV1,type P029VisualSnapshotV1}
 from './product-session-v2';
import {P029NativeSourceReadingV2} from './native-source-reading-v2';
import {p029WrongDisplayTextV6}
 from './wrongfeed-v6-v1';

type Asset=(typeof P029_AUDIO_MANIFEST.embedded)[number]|typeof P029_AUDIO_MANIFEST.separateSa;
export const P029_GLOSSARY_ENTRY_IDS={Relation:'relation','Ordered pair':'ordered-pair'} as const;
export const P029_HOST_BINDING_V1={frameCount:234,frameDomain:'sprite-185',fps:12,
  companionIdSuffix:'-p029-source-readable',glossaryEntries:P029_GLOSSARY_ENTRY_IDS} as const;

/** Same control and snapshot shape used by the SourceLessonHost bridge. */
export interface P029PlayerControlsV1 {
  setPaused(paused:boolean):void;replay():boolean;
  narration(action:'play'|'stop'):void;stop():void;closeGlossary():void;
}
export interface P029PlayerPropsV1 {
  asset:P029CanvasAssetV1;
  bindings:Readonly<Record<string,DecodedSourceStreamBinding|undefined>>;
  loadAudio?:(asset:Asset,signal:AbortSignal)=>Promise<ArrayBuffer>;
  chooseFeedback:(kind:P029Kind,variants:readonly number[])=>number;
  language?:'en'|'es';volume?:number;
  onSnapshot?:(snapshot:P029VisualSnapshotV1)=>void;
  connectControls?:(controls:P029PlayerControlsV1)=>void|(()=>void);
  onOpenGlossary?:(key:P029GlossaryKey,trigger:HTMLButtonElement)=>void;
  hidePlaybackControls?:boolean;
}

/** One always-readable native action surface accompanies the source Canvas. */
export function P029PlayerV4({asset,bindings,loadAudio=loadP029Audio,
  chooseFeedback,language='en',volume=1,onSnapshot,connectControls,
  onOpenGlossary,hidePlaybackControls=false}:P029PlayerPropsV1){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const sessionRef=useRef<P029ProductSessionV2|null>(null);
  const callbackRef=useRef(onSnapshot),selectorRef=useRef(chooseFeedback);
  const glossaryRef=useRef(onOpenGlossary),connectRef=useRef(connectControls);
  callbackRef.current=onSnapshot;selectorRef.current=chooseFeedback;
  glossaryRef.current=onOpenGlossary;connectRef.current=connectControls;
  const [view,setView]=useState<P029VisualSnapshotV1|null>(null);
  const [error,setError]=useState(false);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    let active=true,raf:number|null=null;
    const adpcmBinding=bindings['sprite-179'];
    let adpcmPolicy:ReturnType<typeof p029Adpcm179EntryPolicy>;
    try{
      if(!adpcmBinding)throw Error('P029_ADPCM_BINDING_REQUIRED');
      adpcmPolicy=p029Adpcm179EntryPolicy(adpcmBinding);
    }catch{setError(true);return;}
    const owner=new P029AudioOwnerCueV3({bindings,load:loadAudio,
      adpcm179EntryPolicy:adpcmPolicy});
    const clock=new P029DomainClockCueV4(owner);
    const shouldTick=()=>{
      if(!active||session.snapshot().failure)return false;
      const audio=owner.snapshot();
      return audio.spanishSelected?
        ['loading','playing','start-pending'].includes(audio.phase):
        clock.snapshot().anchor!==null;
    };
    const schedule=()=>{
      if(raf!==null||!shouldTick())return;
      raf=requestAnimationFrame(()=>{
        raf=null;
        void session.tick().then(()=>schedule(),()=>{if(active){session.pause();setError(true);}});
      });
    };
    const session=new P029ProductSessionV2({asset,canvas,owner,clock,
      chooseFeedback:(kind,variants)=>selectorRef.current(kind,variants),
      onOpenGlossary:(key,trigger)=>glossaryRef.current?.(key,trigger),
      onSnapshot:snapshot=>{
        if(!active)return;
        setView(snapshot);
        try{callbackRef.current?.(snapshot);}catch{
          clock.holdPlayback();setError(true);return;
        }
        schedule();
      }});
    sessionRef.current=session;
    const controls:P029PlayerControlsV1={
      setPaused:paused=>{if(paused)session.pause();else void session.play();},
      replay:()=>{if(!session.snapshot().ready)return false;
        void session.replay();return true;},
      narration:action=>{if(action==='stop')session.pause();else void session.play();},
      stop:()=>{void session.close();},closeGlossary:()=>session.closeGlossary(),
    };
    const disconnect=connectRef.current?.(controls);
    void session.initialize().then(ok=>{if(active&&!ok)setError(true);});
    return()=>{
      active=false;if(raf!==null)cancelAnimationFrame(raf);
      raf=null;if(sessionRef.current===session)sessionRef.current=null;
      if(typeof disconnect==='function')disconnect();
      void session.close();
    };
  },[asset,bindings,loadAudio]);

  useEffect(()=>{sessionRef.current?.setVolume(volume);},[volume]);
  const session=sessionRef.current;
  const selectedSpanish=view?.selectedAudio==='spanish';
  const mainActions=!!view&&!selectedSpanish&&!view.returning;
  const canPlay=session?.canPlay()??false;
  const activePhase=selectedSpanish?view?.spanish.phase:view?.phase;
  const canPause=!!view&&['playing','start-pending','loading'].includes(activePhase??'')&&
    (selectedSpanish||view.lessonPhase!=='question');
  const playbackButtonStyle:React.CSSProperties={minHeight:44,minWidth:44,
    padding:'0.35em 0.65em',font:'inherit',lineHeight:1.25};
  const controls=hidePlaybackControls?null:<div role="group" aria-label="Lesson playback"
    style={{display:'flex',flexWrap:'wrap',gap:8,padding:'12px 0'}}>
    <button type="button" disabled={!canPlay||
      ['playing','start-pending'].includes(activePhase??'')}
      style={playbackButtonStyle}
      onClick={()=>{void sessionRef.current?.play();}}>Play</button>
    <button type="button" disabled={!canPause} style={playbackButtonStyle}
      onClick={()=>{sessionRef.current?.pause();}}>Pause</button>
    <button type="button" disabled={!view?.ready} style={playbackButtonStyle}
      onClick={()=>{void sessionRef.current?.replay();}}>Replay</button>
    <button type="button" disabled={!view?.ready||selectedSpanish}
      style={playbackButtonStyle}
      onClick={()=>{void sessionRef.current?.startSeparateSpanish();}}>Spanish Audio</button>
    <button type="button" disabled={!selectedSpanish} style={playbackButtonStyle}
      onClick={()=>{void sessionRef.current?.returnMain();}}>Return</button>
  </div>;
  return <div data-p029-player="true" data-p029-source-sha256={P029_AUDIO_MANIFEST.physicalSwf.sha256}
    data-p029-main-frame={view?.frame??1} data-p029-lesson-phase={view?.lessonPhase??'loading'}
    data-p029-feedback-sprite={view?.feedback?.spriteId??''}
    data-p029-replay-epoch={view?.state.epoch??0}
    style={{width:'100%',maxWidth:800,minWidth:0,fontFamily:'var(--font-lesson-sans,Arial),sans-serif'}}>
    <div style={{position:'relative',width:'100%',aspectRatio:'4 / 3',overflow:'hidden'}}>
      <canvas ref={canvasRef} width={800} height={600} aria-hidden="true"
        style={{display:'block',width:'100%',height:'auto'}}/>
    </div>
    {view?.ready&&view.committed&&
      <P029NativeSourceReadingV2 state={view.state} language={language}
        resolveWrongPopup={p029WrongDisplayTextV6}
        onValueChange={mainActions?value=>{void sessionRef.current?.input(value);}:undefined}
        onSubmit={mainActions?value=>{void sessionRef.current?.submit(value);}:undefined}
        onGlossary={mainActions&&onOpenGlossary?(key,trigger)=>{
          sessionRef.current?.openGlossary(key,trigger);}:undefined}
        onWrongClose={mainActions?spriteId=>{void sessionRef.current?.closeWrong(spriteId);}:undefined}/>}
    {controls}
    {error||view?.failure?<p role="alert">
      {language==='es'?'La lección no está disponible.':'The lesson is unavailable.'}</p>:
      !view?.ready?<p role="status">{language==='es'?'Cargando…':'Loading…'}</p>:null}
  </div>;
}
