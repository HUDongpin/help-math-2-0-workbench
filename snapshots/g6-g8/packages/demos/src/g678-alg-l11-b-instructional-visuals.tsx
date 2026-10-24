"use client";

import React, {useEffect, useRef, useState} from "react";
import type {AnimationRendererProps, AnimationModule, RuntimeContext} from "./contract";
import {createAlgL11Behavior10CandidateCore} from "./g678-alg-l11-behavior10-tranche-b-candidate-core";
import {buildAlgL11Behavior10FeedbackRequest, createAlgL11Behavior10State,
  feedbackTextForAlgL11Behavior10, reduceAlgL11Behavior10,
  type AlgL11Behavior10PageConfig} from "./g678-alg-l11-behavior10-tranche-b-state";
import {G678_ALG_L11_B_SOURCE_FEEDBACK} from "./g678-alg-l11-b-source-feedback.generated";
import {G678_ALG_L11_B_NESTED_HELP_CLOSE} from "./g678-alg-l11-b-nested-help-close.generated";

export function buildAlgL11BSourceFeedbackIntent(config:AlgL11Behavior10PageConfig,
  choice:"A"|"B"|"C"|"D",seed:number){
  const raw=buildAlgL11Behavior10FeedbackRequest(config,choice,seed);
  // TI source buttons explicitly start Mc_Right_Feed4/Mc_Wrong_Feed4.
  // TS delegates branch selection to the legacy host; the maintained test
  // adapter preserves its deterministic seed selection with 1-based host IDs.
  const branchIndex=config.familyId==='l11-tutorial-multi-question-choice'?4:raw.branchIndex+1;
  return {request:{...raw.request,branchIndex},branchIndex};
}

export function sourceInstructionalFeedback(config: AlgL11Behavior10PageConfig,
  state: ReturnType<typeof createAlgL11Behavior10State>) {
  if (state.phase === "right-feedback") return "Correct.";
  if (config.p029Feedback) return feedbackTextForAlgL11Behavior10(config,state);
  const source = G678_ALG_L11_B_SOURCE_FEEDBACK[config.animationId as keyof typeof G678_ALG_L11_B_SOURCE_FEEDBACK];
  if (state.phase === "wrong-feedback-1") return source?.firstWrong ?? "Try again.";
  if (state.phase === "wrong-feedback-2") return source?.secondWrong ?? "Continue to the solution.";
  return null;
}

type Point = readonly [number, number];
type Polygon = readonly Point[];
export interface AlgL11BSourceGlossaryConfig {
  readonly schemaVersion: 1; readonly animationId: string; readonly sourceSha256: string;
  readonly mainFrameCount: number;
  readonly controls: readonly {readonly surface: string; readonly sourceObjectId: number; readonly depth: number;
    readonly sourceKey: string; readonly entryId: string; readonly polygon: Polygon; readonly scriptSha256: string;
    readonly firstFrame: number; readonly lastFrame: number}[];
  readonly entries: readonly {readonly id: string; readonly key: string;
    readonly labels: Readonly<{en: string; es: string}>; readonly definitions: Readonly<{en: string; es: string}>}[];
}
export function visibleAlgL11BSourceGlossary(config: AlgL11BSourceGlossaryConfig,frame: number,surface: string) {
  if(!Number.isSafeInteger(frame)||frame<1)throw Error("Invalid glossary source frame");
  return config.controls.filter(control=>control.surface===surface&&frame>=control.firstFrame&&frame<=control.lastFrame);
}
export interface AlgL11BExplanationBundle {
  readonly schemaVersion: 1; readonly animationId: string; readonly sourceSha256: string;
  readonly definitions: readonly string[];
  readonly branches: readonly {readonly mainFrame: number; readonly name: string; readonly spriteId: number;
    readonly sourceFrameCount: number; readonly stopFrame: 15; readonly closeStartFrame: 16;
    readonly resetFrame: 20; readonly openPolygon: Polygon; readonly closePolygon: Polygon;
    readonly frameBodies: readonly string[]}[];
}
export function resolveAlgL11BExplanationFrame(elapsedMs: number, closing = false) {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw new Error("Invalid explanation elapsed time");
  const frame = (closing ? 16 : 1) + Math.floor(elapsedMs * 12 / 1000);
  return Math.min(closing ? 20 : 15, frame);
}
export interface AlgL11BVectorBundle {
  readonly schemaVersion: 1;
  readonly animationId: string;
  readonly source: {readonly path: string; readonly sha256: string};
  readonly frameCount: number;
  readonly quizFrame: number;
  readonly mainObjectId: number;
  readonly stage: {readonly width: 800; readonly height: 600; readonly background: string};
  readonly definitions: readonly string[];
  readonly rootBody: string;
  readonly frameBodies: readonly string[];
  readonly frameBodyIndices: readonly number[];
  readonly helpBody: string;
  readonly helpCloseBody: string;
  readonly choiceControls: readonly {readonly label: "A" | "B" | "C" | "D";
    readonly instanceName: string; readonly characterId: number; readonly polygon: Polygon}[];
  readonly helpOpenPolygon: Polygon;
  readonly helpClosePolygon: Polygon | null;
  readonly guidedControls: readonly {readonly frame: number; readonly objectId: number;
    readonly depth: number; readonly polygon: Polygon; readonly action: "continue-main"}[];
  readonly childDomainsPending: readonly {readonly spriteId: number; readonly frameCount: number}[];
  readonly unresolvedGuidedControls?: readonly {readonly frame: number; readonly objectId: number;
    readonly depth: number; readonly reason: string; readonly candidatePolygonInvented: false}[];
}

export function resolveAlgL11BNativeVectorFrame(bundle: AlgL11BVectorBundle,
  frame: number, helpOpen = false) {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > bundle.frameCount ||
      bundle.frameBodyIndices.length !== bundle.frameCount) {
    throw new Error("Source vector frame is outside the exact main timeline");
  }
  const body = bundle.frameBodies[bundle.frameBodyIndices[frame - 1]];
  if (body === undefined) throw new Error("Source vector frame is missing");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" ` +
    `data-source-vector-frame="${frame}"><defs>${bundle.definitions.join("")}</defs>` +
    `<rect width="800" height="600" fill="${bundle.stage.background}"/>` +
    bundle.rootBody + body + (helpOpen ? bundle.helpBody + bundle.helpCloseBody : "") + "</svg>";
}

function Hit({polygon, label, disabled, onActivate, sourceInstance}: {
  readonly polygon: Polygon; readonly label: string; readonly disabled: boolean;
  readonly onActivate: () => void; readonly sourceInstance: string;
}) {
  return <polygon aria-disabled={disabled} aria-label={label}
    data-source-hit-instance={sourceInstance} fill="transparent"
    onClick={() => { if (!disabled) onActivate(); }}
    onKeyDown={(event) => {
      if (!disabled && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault(); onActivate();
      }
    }} points={polygon.map(point => point.join(",")).join(" ")}
    role="button" style={{cursor: disabled ? "default" : "pointer"}}
    tabIndex={disabled ? -1 : 0} />;
}

/** New unregistered successor: every main frame comes from original vectors. */
export function createAlgL11BInstructionalVisualCandidate(
  config: AlgL11Behavior10PageConfig, bundle: AlgL11BVectorBundle,
  explanations?: AlgL11BExplanationBundle,
  glossary?: AlgL11BSourceGlossaryConfig,
) {
  if (bundle.animationId !== config.animationId || bundle.source.sha256 !== config.source.sha256 ||
      bundle.frameCount !== config.frameCount || bundle.mainObjectId !== config.mainObjectId ||
      bundle.quizFrame !== config.quizFrame || bundle.choiceControls.length !== 4 ||
      bundle.stage.width !== 800 || bundle.stage.height !== 600) {
    throw new Error("B source vector bundle does not match the exact behavior page");
  }
  if (explanations && (explanations.animationId !== config.animationId ||
    explanations.sourceSha256 !== config.source.sha256 || explanations.branches.length !== 2)) {
    throw new Error("B explanation bundle does not match source identity");
  }
  if(glossary && (glossary.animationId!==config.animationId||glossary.sourceSha256!==config.source.sha256||
    glossary.mainFrameCount!==config.frameCount||!glossary.controls.length||
    glossary.controls.some(control=>!glossary.entries.some(entry=>entry.id===control.entryId&&entry.key===control.sourceKey)))) {
    throw Error("B glossary configuration does not match exact source page or entries");
  }
  const prior = createAlgL11Behavior10CandidateCore(config,
    config.familyId === "l11-tutorial-multi-question-choice" ? "tutorial" : "guided");
  const nestedClose=G678_ALG_L11_B_NESTED_HELP_CLOSE[config.animationId as keyof typeof G678_ALG_L11_B_NESTED_HELP_CLOSE];
  if(nestedClose && (nestedClose.sourceSha256!==config.source.sha256||nestedClose.popupObjectId!==config.help.characterId||
    nestedClose.sourceCloseButtonId!==config.help.closeButtonId))throw Error('Nested source help close identity mismatch');
  const helpClosePolygon=bundle.helpClosePolygon??nestedClose?.polygon;
  if(!helpClosePolygon)throw Error('Source help has no bound Close button');
  function Renderer(props: AnimationRendererProps) {
    const [state, setState] = useState(() => createAlgL11Behavior10State(config, props.frame, props.replay ?? 0));
    const [hostBlocked, setHostBlocked] = useState(false);
    const [explanation, setExplanation] = useState<{branch: number; frame: number; closing: boolean} | null>(null);
    const replay = useRef(props.replay ?? 0);
    const sent = useRef(new Set<string>());
    useEffect(() => setState(current => reduceAlgL11Behavior10(config, current,
      {type: "observe-frame", frame: props.frame})), [props.frame]);
    useEffect(() => {
      if (replay.current === (props.replay ?? 0)) return;
      replay.current = props.replay ?? 0;
      sent.current.clear(); setHostBlocked(false); setExplanation(null);
      setState(current => reduceAlgL11Behavior10(config, current, {type: "replay", input: "mouse"}));
      props.onLessonHostRequest?.({type: "reset-practice-feedback", interactionId: config.animationId});
    }, [props.replay, props.onLessonHostRequest]);
    useEffect(() => {
      if (state.phase !== "resumed" || state.resolvedStopFrame === null) return;
      const stop = prior.interactiveStops.find(row => row.stopFrame === state.resolvedStopFrame);
      if (!stop || sent.current.has(`${state.replay}:${stop.id}`)) return;
      sent.current.add(`${state.replay}:${stop.id}`);
      props.onInteractiveStopResolved?.({stopId: stop.id, frameDomain: stop.frameDomain,
        resolution: stop.resolution, source: "maintained-source-derived-interaction"});
    }, [state.phase, state.resolvedStopFrame, state.replay, props.onInteractiveStopResolved]);
    const explanationBranch = explanation?.branch ?? -1;
    const explanationClosing = explanation?.closing ?? false;
    useEffect(() => {
      if (explanationBranch < 0 || props.paused) return;
      let handle = 0;
      let first: number | null = null;
      // Restart only when the active domain/phase or pause state changes.
      // The first callback resumes from the rendered frame, not frame one.
      const initialFrame = explanation?.frame ?? 1;
      const tick = (now: number) => {
        if (first === null) first = now;
        const elapsed = (initialFrame - (explanationClosing ? 16 : 1)) * 1000 / 12 + now - first;
        const frame = resolveAlgL11BExplanationFrame(elapsed, explanationClosing);
        setExplanation(current => current?.branch === explanationBranch ?
          (explanationClosing && frame === 20 ? null : {...current, frame}) : current);
        if (frame < (explanationClosing ? 20 : 15)) handle = requestAnimationFrame(tick);
      };
      handle = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(handle);
    }, [explanationBranch, explanationClosing, props.paused]);
    const feedback = sourceInstructionalFeedback(config, state);
    const choose = (choice: "A" | "B" | "C" | "D") => {
      const intent = buildAlgL11BSourceFeedbackIntent(config, choice, props.seed);
      const allowed = props.onLessonHostRequest?.(intent.request)?.status === "allowed";
      setHostBlocked(!allowed);
      setState(current => reduceAlgL11Behavior10(config, current, {type: "choose", choiceId: choice,
        input: "mouse", hostAllowed: allowed, feedbackBranch: intent.branchIndex}));
    };
    const dismiss = () => {
      const allowed = props.onLessonHostRequest?.({type: "reset-practice-feedback",
        interactionId: config.animationId})?.status === "allowed";
      setHostBlocked(!allowed);
      setState(current => reduceAlgL11Behavior10(config, current, {type: "dismiss-feedback",
        input: "mouse", hostResetAllowed: allowed}));
    };
    const activeExplanation = explanation && explanations?.branches[explanation.branch];
    const visual = resolveAlgL11BNativeVectorFrame(bundle, props.frame, state.phase === "help-open");
    const explanationVisual = activeExplanation && explanation ? `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs>${explanations!.definitions.join("")}</defs>${activeExplanation.frameBodies[explanation.frame-1]}</svg>` : null;
    const continueGuided = () => {
      setExplanation(null);
      setState(current => reduceAlgL11Behavior10(config, current, {type: "continue-guided", input: "mouse"}));
    };
    const glossarySurface=activeExplanation?'explanation-'+activeExplanation.name:state.phase==='help-open'?'help':'main';
    const glossaryFrame=activeExplanation?explanation!.frame:state.phase==='help-open'?1:props.frame;
    const visibleGlossary=glossary&&!feedback?visibleAlgL11BSourceGlossary(glossary,glossaryFrame,glossarySurface):[];
    const openGlossary=(entryId:string)=>{
      if(props.paused)return;
      const allowed=props.onLessonHostRequest?.({type:'open-glossary',entryId})?.status==='allowed';
      setHostBlocked(!allowed);
    };
    return <div data-animation-id={config.animationId}
      data-vector-successor="g678-alg-l11-b-instructional-visuals"
      data-main-frame={props.frame} data-phase={state.phase}
      data-current-javascript-registered="false" data-product-calibration-passed="false"
      data-source-feedback-animation-rendered="false"
      data-pending-child-domain-count={bundle.childDomainsPending.length}
      data-unresolved-source-guided-controls={bundle.unresolvedGuidedControls?.length ?? 0}
      data-maintained-empty-hit-adapter="source-continuation-accessible-button"
      data-guided-explanation-rendered={Boolean(explanations)}
      data-source-glossary-enabled={Boolean(glossary)}
      data-active-source-glossary-surface={glossarySurface}
      data-explanation-child-frame={explanation?.frame ?? "none"}
      style={{aspectRatio: "4 / 3", margin: "0 auto 48px", maxWidth: 800,
        position: "relative", width: "100%", background: bundle.stage.background}}>
      <style>{`[data-vector-successor] > .source-vectors svg {display:block;width:100%;height:100%}
        [data-vector-successor] polygon[role=button]:focus-visible {stroke:#154c96;stroke-width:2;fill:#ffffff24;outline:none}`}</style>
      <div aria-label="Source instructional animation" className="source-vectors"
        dangerouslySetInnerHTML={{__html: visual}} style={{inset: 0, position: "absolute"}} />
      {explanationVisual ? <div aria-label="Source explanation" className="source-vectors"
        dangerouslySetInnerHTML={{__html: explanationVisual}} style={{inset:0,position:"absolute"}}/> : null}
      <svg aria-label="Source-positioned lesson controls" viewBox="0 0 800 600"
        style={{height: "100%", inset: 0, position: "absolute", width: "100%"}}>
        {state.phase === "choosing" ? <>{bundle.choiceControls.map(choice =>
          <Hit disabled={Boolean(props.paused)} key={choice.label}
            label={`Answer ${choice.label}`} onActivate={() => choose(choice.label)}
            polygon={choice.polygon} sourceInstance={choice.instanceName} />)}
          <Hit disabled={Boolean(props.paused)} label="Need more help"
            onActivate={() => setState(current => reduceAlgL11Behavior10(config, current,
              {type: "open-help", input: "mouse"}))}
            polygon={bundle.helpOpenPolygon} sourceInstance="NMHBtn" /></> : null}
        {state.phase === "help-open" ?
          <Hit disabled={Boolean(props.paused)} label="Close help" onActivate={() =>
            setState(current => reduceAlgL11Behavior10(config, current,
              {type: "close-help", input: "mouse"}))}
            polygon={helpClosePolygon} sourceInstance="CloseBtn" /> : null}
        {state.phase === "guided-stop" ? bundle.guidedControls.filter(hit => hit.frame === state.activeStopFrame)
          .map(hit => <Hit disabled={Boolean(props.paused)} key={hit.depth}
            label="Continue the guided solution" onActivate={continueGuided}
            polygon={hit.polygon} sourceInstance={`depth-${hit.depth}`} />) : null}
        {state.phase === "guided-stop" && explanation === null ? explanations?.branches.map((branch,index) =>
          branch.mainFrame === state.activeStopFrame ? <Hit disabled={Boolean(props.paused)}
            key={branch.name} label="Show the explanation for this answer" sourceInstance={branch.name}
            polygon={branch.openPolygon} onActivate={()=>setExplanation({branch:index,frame:1,closing:false})}/> : null) : null}
        {activeExplanation && explanation?.frame === 15 ? <Hit disabled={Boolean(props.paused)}
          label="Close explanation" sourceInstance={`${activeExplanation.name}-close`} polygon={activeExplanation.closePolygon}
          onActivate={()=>setExplanation(current=>current?{...current,frame:16,closing:true}:current)}/> : null}
        {visibleGlossary.map((control,index)=><Hit key={`glossary-${control.sourceObjectId}-${control.depth}-${index}`}
          label={`Define ${control.sourceKey}`} sourceInstance={`glossary-${control.entryId}-depth-${control.depth}`}
          polygon={control.polygon} disabled={Boolean(props.paused)} onActivate={()=>openGlossary(control.entryId)}/>)}
      </svg>
      {state.phase === "guided-stop" && explanation === null &&
        bundle.unresolvedGuidedControls?.some(hit=>hit.frame===state.activeStopFrame) &&
        !bundle.guidedControls.some(hit=>hit.frame===state.activeStopFrame) ?
        <button data-maintained-empty-source-hit-adapter="true" disabled={Boolean(props.paused)}
          onClick={continueGuided} type="button" style={{position:"absolute",right:"3%",bottom:"3%",
            background:"#fff",border:"2px solid #235b8a",borderRadius:8,padding:"10px 18px"}}>Continue</button> : null}
      {feedback ? <div aria-live="assertive" role="alert" style={{background: "#fff",
        border: "2px solid #235b8a", borderRadius: 10, boxSizing: "border-box",
        left: "20%", padding: "2%", position: "absolute", top: "32%", width: "60%"}}>
        <p>{feedback}</p><button disabled={Boolean(props.paused)} onClick={dismiss} type="button">
          {state.phase === "wrong-feedback-1" ? "Try again" : "Continue"}</button></div> : null}
      {hostBlocked ? <div role="alert" style={{position: "absolute", bottom: 0, background: "#fff"}}>
        Practice feedback is unavailable.</div> : null}
      <button data-source-successor-replay="true" type="button" disabled={Boolean(props.paused)||!props.onReplay}
        onClick={()=>{
          const allowed=props.onLessonHostRequest?.({type:'reset-practice-feedback',interactionId:config.animationId})?.status==='allowed';
          setHostBlocked(!allowed);
          if(allowed){setExplanation(null);props.onReplay?.();}
        }} style={{position:'absolute',top:'100%',left:0,minHeight:40,marginTop:4,padding:'8px 18px'}}>Replay</button>
    </div>;
  }
  const module: AnimationModule = {...prior.module, Renderer,
    // Runtime clamps this source target through every unresolved guided stop.
    reducedMotionFrame:config.quizFrame,
    lessonHost:{...prior.module.lessonHost!,capabilities:glossary?['practice-feedback','glossary']:['practice-feedback']},
    getFrameState: (frame: number, context: RuntimeContext) => ({...prior.module.getFrameState(frame, context),
      sourceVectorMainFramesImplemented: bundle.frameCount,
      sourceInstructionalMainTimelineRendered: true,
      sourceFeedbackAnimationRendered: false,
      pendingSourceChildDomains: bundle.childDomainsPending.length,
      sourceGuidedExplanationDomainsRendered: explanations?.branches.length ?? 0,
      sourceGlossaryControlRanges:glossary?.controls.length??0,
      currentJavaScriptRegistered: false, productCalibrationPassed: false})};
  return Object.freeze({config, bundle, Renderer, module,glossaryEntries:glossary?.entries??[]});
}
