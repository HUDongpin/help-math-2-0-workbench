"use client";

import React, {useEffect, useRef, useState} from "react";
import type {AnimationInteractiveStop, AnimationModule, AnimationRendererProps,
  AnimationRuntimeMetadata, MovieMetadata, RuntimeContext} from "./contract";
import {AlgL11ASourceVectorStage, type AlgL11ASourceVectorBundle} from "./g678-alg-l11-tranche-a-source-vector-stage";

type Polygon = readonly (readonly number[])[];
interface SourceGlossaryControl {
  readonly sourceObjectId: number; readonly depth: number; readonly polygon: Polygon;
  readonly sourceKey: string; readonly entryId: string; readonly scriptSha256: string;
  readonly firstFrame?: number; readonly lastFrame?: number;
}
interface SourceAnswer {
  readonly id: string; readonly depth: number; readonly sourceObjectId: number;
  readonly sourceInstanceName: string; readonly correct: boolean; readonly label: string;
  readonly polygon: Polygon;
}
export interface AlgL11ASpecialVisualConfig {
  readonly schemaVersion: 1; readonly animationId: string;
  readonly source: {readonly path: string; readonly sha256: string};
  readonly kind: "source-three-hit-inequality-choice" | "source-linear-teaching-with-glossary";
  readonly mainObjectId: number; readonly frameCount: number;
  readonly glossaryControls: readonly SourceGlossaryControl[];
  readonly glossaryEntries: readonly {readonly id: string; readonly key: string;
    readonly labels: Readonly<{en: string; es: string}>;
    readonly definitions: Readonly<{en: string; es: string}>}[];
  readonly definitions?: readonly string[];
  readonly answers?: readonly SourceAnswer[];
  readonly feedback?: Readonly<{right: {readonly startFrame: 2; readonly endFrame: 20;
    readonly sourceObjectId: 28; readonly frameBodies: readonly string[]};
    wrong: {readonly startFrame: 2; readonly endFrame: 20; readonly sourceObjectId: 48;
      readonly frameBodies: readonly string[]; readonly closePolygon: Polygon;
      readonly glossaryControls: readonly SourceGlossaryControl[]}}>;
  readonly dormantFeedbackDisposition?: Readonly<{
    sourceEntryReachableFromLocalButtons: false; sourceHostEntryEstablished: false;
    candidateTwoTryControlsCreated: false; localStartInvocationCount: 0;
  }>;
}

export interface AlgL11ASpecialVisualState {
  readonly phase: "teaching" | "choosing" | "right-feedback" | "wrong-feedback" | "right-complete";
  readonly mainFrame: number;
  readonly feedbackFrame: number;
  readonly selectedHit: string | null;
}
export function createAlgL11ASpecialVisualState(config: AlgL11ASpecialVisualConfig, frame: number): AlgL11ASpecialVisualState {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > config.frameCount) throw Error("Special source frame invalid");
  return {phase: config.kind === "source-three-hit-inequality-choice" && frame === 24 ? "choosing" : "teaching",
    mainFrame: frame, feedbackFrame: 1, selectedHit: null};
}
export function reduceAlgL11ASpecialVisual(config: AlgL11ASpecialVisualConfig,
  state: AlgL11ASpecialVisualState, event:
    | {readonly type: "observe"; readonly frame: number}
    | {readonly type: "choose"; readonly hitId: string; readonly hostAllowed: boolean}
    | {readonly type: "feedback-frame"; readonly frame: number}
    | {readonly type: "close-wrong"; readonly hostAllowed: boolean}) : AlgL11ASpecialVisualState {
  if (event.type === "observe") {
    if (event.frame === state.mainFrame) return state;
    return createAlgL11ASpecialVisualState(config,event.frame);
  }
  if (config.kind !== "source-three-hit-inequality-choice") return state;
  if (event.type === "choose") {
    if (state.phase !== "choosing" || state.mainFrame !== 24 || !event.hostAllowed) return state;
    const answer=config.answers?.find(answer=>answer.id===event.hitId);
    if (!answer) throw Error("Unknown source answer placement");
    return {...state,phase:answer.correct?"right-feedback":"wrong-feedback",feedbackFrame:2,selectedHit:answer.id};
  }
  if (event.type === "feedback-frame") {
    if (!["right-feedback","wrong-feedback"].includes(state.phase)) return state;
    if (!Number.isSafeInteger(event.frame) || event.frame < state.feedbackFrame || event.frame > 20) throw Error("Feedback source frame invalid");
    return {...state,feedbackFrame:event.frame,phase:state.phase==="right-feedback"&&event.frame===20?"right-complete":state.phase};
  }
  if (state.phase !== "wrong-feedback" || state.feedbackFrame !== 20 || !event.hostAllowed) return state;
  return createAlgL11ASpecialVisualState(config,24);
}
export function resolveAlgL11ASpecialFeedbackFrame(initialFrame: number,elapsedMs: number) {
  if (!Number.isInteger(initialFrame)||initialFrame<2||initialFrame>20||!Number.isFinite(elapsedMs)||elapsedMs<0) throw Error("Invalid feedback clock");
  return Math.min(20,initialFrame+Math.floor(elapsedMs*12/1000));
}
export function visibleAlgL11ASpecialGlossary(config: AlgL11ASpecialVisualConfig, frame: number) {
  return config.glossaryControls.filter(c=>frame>=(c.firstFrame??1)&&frame<=(c.lastFrame??config.frameCount));
}

function Hit({polygon,label,disabled,onActivate,sourceId}: {readonly polygon:Polygon;readonly label:string;
  readonly disabled:boolean;readonly onActivate:()=>void;readonly sourceId:string}) {
  return <polygon aria-label={label} aria-disabled={disabled} data-source-control-id={sourceId}
    fill="transparent" points={polygon.map(p=>p.join(",")).join(" ")} role="button" tabIndex={disabled?-1:0}
    style={{pointerEvents:disabled?"none":"all",cursor:disabled?"default":"pointer"}}
    onClick={()=>{if(!disabled)onActivate();}} onKeyDown={event=>{
      if((event.key==="Enter"||event.key===" ")&&!event.repeat){event.preventDefault();if(!disabled)onActivate();}
    }}/>;
}

const SCENARIO="source-static-frame";
const MOVIE:MovieMetadata={stage:{width:800,height:600},fps:12,frameCount:10,durationMs:833};
export function createAlgL11ASpecialInstructionalVisualCandidate(config: AlgL11ASpecialVisualConfig,
  bundle: AlgL11ASourceVectorBundle) {
  if (!['shared-alg001-l11-p006','shared-alg001-l11-p009','shared-alg001-l11-p010'].includes(config.animationId)||
    config.source.sha256!==bundle.source.sha256||config.animationId!==bundle.animationId||config.frameCount!==bundle.frameCount) {
    throw Error("Special source visual identity mismatch");
  }
  const isChoice=config.kind==="source-three-hit-inequality-choice";
  if(isChoice && (config.answers?.map(a=>a.depth).join(',')!=='6,24,26'||config.answers.filter(a=>a.correct).length!==1||
    !config.feedback||config.feedback.right.frameBodies.length!==20||config.feedback.wrong.frameBodies.length!==20)) {
    throw Error("p006 source answer/feedback closure mismatch");
  }
  if(!isChoice && (!config.dormantFeedbackDisposition||config.dormantFeedbackDisposition.sourceEntryReachableFromLocalButtons!==false)) {
    throw Error("Linear page dormant feedback disposition missing");
  }
  const domain=`sprite-${config.mainObjectId}`;
  const stops:readonly AnimationInteractiveStop[]=isChoice?[{id:`${config.animationId}-source-inequality-choice-24`,
    frameDomain:domain,stopFrame:24,resumeFrame:25,resolution:'explicit-source-feedback-finished',
    completionDisposition:'blocked-while-unresolved',requiresHostInteractiveStop:true,strictAcceptanceEffect:'none'}]:[];

  function Renderer(props:AnimationRendererProps) {
    const [state,setState]=useState(()=>createAlgL11ASpecialVisualState(config,props.frame));
    const [hostBlocked,setHostBlocked]=useState(false);
    const [hostResetAllowed,setHostResetAllowed]=useState(!isChoice);
    const resolutionSent=useRef(false);
    useEffect(()=>setState(current=>reduceAlgL11ASpecialVisual(config,current,{type:'observe',frame:props.frame})),[props.frame]);
    useEffect(()=>{
      // Runtime Replay may remount this renderer. Reset on mount as well as a
      // replay revision so no prior answer survives in the actual lesson host.
      const allowed=!isChoice||props.onLessonHostRequest?.({type:'reset-practice-feedback',interactionId:config.animationId})?.status==='allowed';
      setHostResetAllowed(allowed);setHostBlocked(!allowed);
      if(allowed){resolutionSent.current=false;setState(createAlgL11ASpecialVisualState(config,props.frame));}
    },[props.replay]);
    const feedbackActive=state.phase==='right-feedback'||state.phase==='wrong-feedback';
    useEffect(()=>{
      if(!feedbackActive||props.paused)return;
      const initial=state.feedbackFrame;
      let first:number|null=null,handle=0;
      const tick=(now:number)=>{
        if(first===null)first=now;
        const frame=resolveAlgL11ASpecialFeedbackFrame(initial,now-first);
        setState(current=>reduceAlgL11ASpecialVisual(config,current,{type:'feedback-frame',frame}));
        if(frame<20)handle=requestAnimationFrame(tick);
      };
      handle=requestAnimationFrame(tick);return()=>cancelAnimationFrame(handle);
    },[feedbackActive,state.phase,props.paused]);
    const finishRight=()=>{
      if(resolutionSent.current||state.phase!=='right-complete')return;
      if(!props.onInteractiveStopResolved){setHostBlocked(true);return;}
      const allowed=props.onLessonHostRequest?.({type:'reset-practice-feedback',interactionId:config.animationId})?.status==='allowed';
      setHostBlocked(!allowed);if(!allowed)return;
      resolutionSent.current=true;
      props.onInteractiveStopResolved?.({stopId:stops[0].id,frameDomain:domain,resolution:stops[0].resolution,
        source:'maintained-source-derived-interaction'});
    };
    useEffect(()=>{if(state.phase==='right-complete')finishRight();},[state.phase]);
    const choose=(answer:SourceAnswer)=>{
      if(props.paused||!hostResetAllowed||state.phase!=='choosing')return;
      const allowed=props.onLessonHostRequest?.({type:'record-practice-feedback',interactionId:config.animationId,
        outcome:answer.correct?'correct':'incorrect',branchIndex:1,branchCount:1})?.status==='allowed';
      setHostBlocked(!allowed);
      setState(current=>reduceAlgL11ASpecialVisual(config,current,{type:'choose',hitId:answer.id,hostAllowed:allowed}));
    };
    const closeWrong=()=>{
      if(props.paused)return;
      const allowed=props.onLessonHostRequest?.({type:'reset-practice-feedback',interactionId:config.animationId})?.status==='allowed';
      setHostBlocked(!allowed);setState(current=>reduceAlgL11ASpecialVisual(config,current,{type:'close-wrong',hostAllowed:allowed}));
    };
    const openGlossary=(control:SourceGlossaryControl)=>{
      const allowed=props.onLessonHostRequest?.({type:'open-glossary',entryId:control.entryId})?.status==='allowed';
      setHostBlocked(!allowed);
    };
    const wrongOpen=state.phase==='wrong-feedback';
    const feedbackBody=config.feedback && (wrongOpen?config.feedback.wrong.frameBodies[state.feedbackFrame-1]:
      state.phase==='right-feedback'?config.feedback.right.frameBodies[state.feedbackFrame-1]:null);
    const glossary=wrongOpen&&state.feedbackFrame===20?config.feedback!.wrong.glossaryControls:
      feedbackActive?[]:visibleAlgL11ASpecialGlossary(config,props.frame);
    return <div data-animation-id={config.animationId} data-a-special-source-visual="true"
      data-main-frame={props.frame} data-interaction-phase={state.phase} data-feedback-frame={state.feedbackFrame}
      data-current-javascript-registered="false" data-product-calibration-passed="false"
      data-source-random-audio-local-entry="unresolved" data-audio-accepted="false"
      data-dormant-two-try-controls-created="false"
      style={{position:'relative',width:'100%',maxWidth:800,margin:'0 auto',aspectRatio:'4 / 3'}}>
      <style>{`[data-a-special-source-visual] polygon[role=button]:focus-visible{stroke:#154c96;stroke-width:2;outline:none;fill:#ffffff30}`}</style>
      <AlgL11ASourceVectorStage bundle={bundle} frame={props.frame}/>
      {feedbackBody?<svg aria-label={wrongOpen?'Inequality explanation':'Correct answer feedback'} viewBox="0 0 800 600"
        style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>
        <defs dangerouslySetInnerHTML={{__html:config.definitions!.join('')}}/>
        <g dangerouslySetInnerHTML={{__html:feedbackBody}}/>
      </svg>:null}
      <svg aria-label="Source lesson interaction controls" viewBox="0 0 800 600"
        style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>
        {state.phase==='choosing'?config.answers?.map(answer=><Hit key={answer.id} sourceId={answer.id}
          label={answer.label} polygon={answer.polygon} disabled={Boolean(props.paused)||!hostResetAllowed} onActivate={()=>choose(answer)}/>):null}
        {wrongOpen&&state.feedbackFrame===20?<Hit sourceId="BtnClose" label="Close explanation"
          polygon={config.feedback!.wrong.closePolygon} disabled={Boolean(props.paused)} onActivate={closeWrong}/>:null}
        {glossary.map((control,index)=><Hit key={`${control.sourceObjectId}:${control.depth}:${index}`}
          sourceId={`glossary-${control.entryId}-depth-${control.depth}`} label={`Define ${control.sourceKey}`}
          polygon={control.polygon} disabled={Boolean(props.paused)} onActivate={()=>openGlossary(control)}/>)}
      </svg>
      {hostBlocked?<div role="alert" style={{position:'absolute',bottom:0,background:'#fff',padding:8}}>
        The lesson support request is unavailable.
        {state.phase==='right-complete'?<button type="button" disabled={Boolean(props.paused)} onClick={finishRight}>Continue</button>:null}
      </div>:null}
    </div>;
  }
  const runtime:AnimationRuntimeMetadata={...MOVIE,frameDomains:[{id:'root',frameCount:10,fps:12},
    {id:domain,frameCount:config.frameCount,fps:12,rootFrame:6}],defaultFrameDomain:domain};
  const module:AnimationModule={key:config.animationId,movie:MOVIE,runtime,playbackMode:'once',
    playbackEndFrameByDomain:{root:6,[domain]:config.frameCount},
    reducedMotionFrame:isChoice?24:config.frameCount,
    scenarios:[{id:SCENARIO,label:'Source instructional animation',description:'Local source-vector engineering candidate.'}],
    defaultScenarioByFrameDomain:{[domain]:SCENARIO},audioCues:[],interactiveStops:stops,
    lessonHost:{capabilities:isChoice?['glossary','practice-feedback']:['glossary'],legacyOperations:'blocked',
      auditStorage:'memory-only',storesPersonalData:false},maturity:'private-current-js',Renderer,
    getFrameState:(_frame:number,context:RuntimeContext)=>({animationId:config.animationId,frame:context.frame,
      frameDomain:context.frameDomain??domain,rootFrame:context.rootFrame??6,scenario:context.scenario,
      language:context.lang,seed:context.seed,status:context.scenario===SCENARIO&&context.frame>=1&&context.frame<=config.frameCount&&
        (context.frameDomain??domain)===domain?'ready':'blocked',sourceMainFrames:config.frameCount,
      activeSourceChoiceCount:isChoice?3:0,dormantTwoTryControlsCreated:false,sourceRandomAudioStarted:false,
      sourceSemanticAnswer:isChoice?'x ≥ 5':null,currentJavaScriptRegistered:false,productCalibrationPassed:false,
      authoritativeOriginalRuntime:false,visualFidelityAccepted:false,audioAccepted:false,strictAcceptanceEffect:'none'})};
  return Object.freeze({config,bundle,module,Renderer,glossaryEntries:config.glossaryEntries});
}
