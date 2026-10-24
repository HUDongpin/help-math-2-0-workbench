"use client";
import React, {useEffect,useState} from "react";
import type {AnimationAuthoredTimelineControl,AnimationRendererProps} from "./contract";
import {G678_ALG_L11_ADVANCED3_TRANCHE_D_P033_CANDIDATE_MODULE} from "./g678-alg-l11-advanced3-tranche-d-candidates";
import {buildAlgL11Advanced3NavigationIntent,createAlgL11Advanced3ControllerState,
  reduceAlgL11Advanced3Controller,type AlgL11Advanced3Level} from "./g678-alg-l11-advanced3-tranche-d-state";
import {G678_ALG_L11_P033_INSTRUCTIONAL_SEQUENCE as SOURCE} from "./generated/g678-alg-l11-p033-instructional-sequence-v1";

export const ALG_L11_P033_AUTHORED_CONTROLS: readonly AnimationAuthoredTimelineControl[] = Object.freeze([
  Object.freeze({id:"alg-l11-p033-repeat-directions",frameDomain:"sprite-116",
    sourceFrameRanges:Object.freeze([Object.freeze({first:1,last:6})]),targetFrame:11,
    playback:"play",sourceLabel:"RepeatDirection"}),
  Object.freeze({id:"alg-l11-p033-skip-directions",frameDomain:"sprite-116",
    sourceFrameRanges:Object.freeze([Object.freeze({first:7,last:604})]),targetFrame:605,
    playback:"stop",sourceLabel:"SelectLevel"}),
]);

export function algL11P033SourceFrame(frame:number){
  if(!Number.isSafeInteger(frame)||frame<1||frame>606)throw new Error("p033 source main frame out of bounds");
  return SOURCE.frames[frame-1];
}

export function algL11P033FrameSvg(frame:number){
  const row=algL11P033SourceFrame(frame);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ffdec="https://www.free-decompiler.com/flash" width="800" height="600" viewBox="0 0 800 600" aria-hidden="true" focusable="false" style="display:block;width:100%;height:auto"><defs>${SOURCE.definitions}</defs>${row.group}</svg>`;
}

type VisualControl={readonly frame:number;readonly width:number;readonly height:number;
  readonly offsetX:number;readonly offsetY:number;readonly svg:string;readonly sha256:string};
type Placement={readonly name:string;readonly characterId:number;readonly transform:string};
const ART=SOURCE.controls as Readonly<Record<number,readonly VisualControl[]>>;

export function algL11P033ControlBounds(placement:Placement,visual:VisualControl){
  const values=placement.transform.match(/^matrix\(([^)]*)\)$/)?.[1].split(",").map(Number);
  if(!values||values.length!==6||values.some(value=>!Number.isFinite(value))||values[1]!==0||values[2]!==0)throw new Error("p033 unsupported source control transform");
  return {x:412.4+values[4]-values[0]*visual.offsetX,
    y:283.3+values[5]-values[3]*visual.offsetY,
    width:values[0]*visual.width,height:values[3]*visual.height};
}

function SourceControl({placement,label,pressed,disabled,onActivate}: {
  placement:Placement;label:string;pressed?:boolean;disabled:boolean;
  onActivate:(input:"mouse"|"keyboard")=>void;
}){
  const [hover,setHover]=useState(false);
  const visual=ART[placement.characterId][pressed?2:hover?1:0];
  const bounds=algL11P033ControlBounds(placement,ART[placement.characterId][0]);
  return <button aria-label={label} aria-pressed={pressed}
    data-source-instance-name={placement.name} data-source-character-id={placement.characterId}
    data-source-nested-frame={visual.frame} data-source-vector-sha256={visual.sha256}
    disabled={disabled} onClick={event=>{if(!disabled)onActivate(event.detail===0?"keyboard":"mouse");}}
    onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
    onFocus={()=>setHover(true)} onBlur={()=>setHover(false)}
    style={{position:"absolute",left:`${bounds.x/8}%`,top:`${bounds.y/6}%`,
      width:`${bounds.width/8}%`,height:`${bounds.height/6}%`,padding:0,border:0,
      background:"transparent",cursor:disabled?"default":"pointer"}}
    type="button"><span style={{display:"block",pointerEvents:"none"}}
      dangerouslySetInnerHTML={{__html:visual.svg}}/></button>;
}

export function AlgL11P033InstructionalRenderer(props:AnimationRendererProps){
  const frame=algL11P033SourceFrame(props.frame);
  const terminal=props.frame>=605;
  const [level,setLevel]=useState<AlgL11Advanced3Level|null>(null);
  const [popup,setPopup]=useState(false);
  const [message,setMessage]=useState<string|null>(null);
  const [sourceMessage,setSourceMessage]=useState(false);
  useEffect(()=>{setLevel(null);setPopup(false);setMessage(null);setSourceMessage(false);},[props.replay]);
  useEffect(()=>{if(props.frame===1)setLevel(null);if(props.frame!==605)setPopup(false);setSourceMessage(false);},[props.frame]);
  function authored(controlId:string,input:"mouse"|"keyboard"){
    if(props.paused||popup)return;
    const result=props.onAuthoredTimelineControl?.({controlId,frameDomain:"sprite-116",input,source:"maintained-source-authored-control"});
    setMessage(result?.accepted?null:"The lesson player could not apply this instruction control.");
  }
  function start(){
    if(props.paused||popup)return;
    if(level===null){setSourceMessage(terminal);setMessage(terminal?null:"Please select the Level then Click Start");return;}
    let state=createAlgL11Advanced3ControllerState(terminal?"terminal":"initial");
    state=reduceAlgL11Advanced3Controller(state,{type:"select-level",level,input:"mouse"});
    state=reduceAlgL11Advanced3Controller(state,{type:"start",input:"mouse"});
    const intent=buildAlgL11Advanced3NavigationIntent(state)!;
    const result=props.onLessonHostRequest?.(intent.request);
    setMessage(result?.status==="allowed"?null:"The lesson player could not open the matching game.");
  }
  return <section aria-label="Inequalities Match Game instructions"
    data-animation-id="shared-alg001-l11-p033" data-source-main-frame={props.frame}
    data-source-frame-count="606" data-source-root-frame-count="10" data-source-root-frame="6"
    data-source-terminal-stop="605" data-source-handoff-arity={terminal?3:2}
    data-source-frame-sha256={frame.sha256} data-source-content-successor="p033-instructional-sequence-v1"
    data-current-javascript-registered="false" data-product-calibration-passed="false"
    data-authoritative-original-runtime="false" data-visual-fidelity-accepted="false"
    data-audio-accepted="false" data-strict-complete="false" data-release-authorized="false"
    style={{width:"100%",maxWidth:800,margin:"0 auto",color:"#12213c"}}>
    <div style={{width:"100%",aspectRatio:"4/3",position:"relative",background:"white"}}>
      <div role="img" aria-label={`Source game instructions, frame ${props.frame} of 606`}
        dangerouslySetInnerHTML={{__html:algL11P033FrameSvg(props.frame)}}/>
      {frame.controlPlacements.map(placement=>{
        const name=placement.name;
        const label=name==="mcL1"?"Level 1":name==="mcL2"?"Level 2":name==="mcStart"?"Start":placement.characterId===39?"Skip directions":"Repeat directions";
        const active=name==="mcL1"?level===1:name==="mcL2"?level===2:undefined;
        return <SourceControl key={name} placement={placement} label={label}
          pressed={active} disabled={Boolean(props.paused)||popup}
          onActivate={input=>{
            if(name==="mcL1"||name==="mcL2"){setLevel(name==="mcL1"?1:2);setMessage(null);setSourceMessage(false);}
            else if(name==="mcStart")start();
            else if(name==="mcSkip")authored("alg-l11-p033-skip-directions",input);
            else if(terminal){if(props.frame===605)setPopup(true);else setMessage("Directions popup is not present at this source frame.");}
            else authored("alg-l11-p033-repeat-directions",input);
          }}/>;
      })}
      {sourceMessage?<div aria-label="Select a level before starting" role="alert"
        style={{position:"absolute",left:"8%",right:"8%",top:"8%"}}
        dangerouslySetInnerHTML={{__html:ART[59][0].svg}}/>:null}
      {popup?<div aria-label="Game directions" aria-modal="true" role="dialog"
        style={{position:"absolute",left:"8%",right:"8%",top:"16%",padding:6,background:"white",boxShadow:"0 0 0 800px #ffffff55"}}>
        <div role="img" aria-label="Source game directions" data-source-character-id="24"
          dangerouslySetInnerHTML={{__html:ART[24][0].svg}}/>
        <button disabled={props.paused} onClick={()=>{if(!props.paused){setPopup(false);setMessage(null);}}}
          style={{minHeight:44,padding:"8px 16px",fontSize:16}} type="button">Close directions</button>
      </div>:null}
    </div>
    {message?<p role="alert">{message}</p>:null}
    <button disabled={props.paused||!props.onReplay} onClick={props.onReplay}
      style={{minHeight:44,padding:"8px 16px",fontSize:16}} type="button">Replay</button>
  </section>;
}

export const G678_ALG_L11_D_INSTRUCTIONAL_P033_MODULE=Object.freeze({
  ...G678_ALG_L11_ADVANCED3_TRANCHE_D_P033_CANDIDATE_MODULE,
  Renderer:AlgL11P033InstructionalRenderer,authoredTimelineControls:ALG_L11_P033_AUTHORED_CONTROLS,
  reducedMotionFrame:605,
  playbackEndFrameByDomain:Object.freeze({root:6,"sprite-116":605}),
  getFrameState:(frame:number,context:Parameters<typeof G678_ALG_L11_ADVANCED3_TRANCHE_D_P033_CANDIDATE_MODULE.getFrameState>[1])=>{
    const base=G678_ALG_L11_ADVANCED3_TRANCHE_D_P033_CANDIDATE_MODULE.getFrameState(frame,context);
    return{...base as object,sourceInstructionalVisualFrame:frame>=1&&frame<=606?frame:null,
      sourceMainFrameCount:606,sourceTerminalStopFrame:605,sourceNestedControlsMaintained:true,
      currentJavaScriptRegistered:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,
      visualFidelityAccepted:false,audioAccepted:false,strictAcceptanceEffect:"none"};
  },
});
