"use client";

import React, {useEffect, useMemo, useRef, useState} from "react";

import type {
  AnimationInteractiveStop,
  AnimationModule,
  AnimationRendererProps,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext,
  RuntimeScenario,
} from "./contract";
import {
  buildAlgL11Behavior10FeedbackRequest,
  createAlgL11Behavior10State,
  feedbackTextForAlgL11Behavior10,
  reduceAlgL11Behavior10,
  type AlgL11Behavior10PageConfig,
} from "./g678-alg-l11-behavior10-tranche-b-state";

const SCENARIO = "source-static-frame";
const SCENARIOS: readonly RuntimeScenario[] = Object.freeze([Object.freeze({
  id: SCENARIO,
  label: "Source-bound unregistered behavior10 engineering candidate",
  description:
    "Maintained DOM interaction only; no original-runtime, fidelity, audio, product, or release acceptance.",
})]);
const MOVIE: MovieMetadata = Object.freeze({stage: Object.freeze({width: 800,
  height: 600}), fps: 12, frameCount: 10, durationMs: 833});

const shellStyle: React.CSSProperties = Object.freeze({
  background: "#f4f8fc", border: "2px solid #2b5d88", borderRadius: 14,
  boxSizing: "border-box", color: "#16334c", display: "grid", gap: 16,
  margin: "0 auto", maxWidth: 800, minHeight: 500, padding: 22,
});
const buttonStyle: React.CSSProperties = Object.freeze({
  background: "#fff", border: "2px solid #2b5d88", borderRadius: 9,
  color: "#16334c", cursor: "pointer", fontSize: 17, minHeight: 46,
  padding: "9px 13px",
});

function runtime(config: AlgL11Behavior10PageConfig): AnimationRuntimeMetadata {
  return Object.freeze({...MOVIE, frameDomains: Object.freeze([
    Object.freeze({id: "root", frameCount: 10, fps: 12}),
    Object.freeze({id: config.frameDomain, frameCount: config.frameCount,
      fps: 12, rootFrame: 6}),
  ]), defaultFrameDomain: config.frameDomain});
}

function uniqueStopFrames(config: AlgL11Behavior10PageConfig) {
  return [...new Set(config.guidedHits.map((entry) => entry.frame))];
}

function interactiveStops(config: AlgL11Behavior10PageConfig) {
  const guided: AnimationInteractiveStop[] = uniqueStopFrames(config).map(
    (frame) => Object.freeze({id: `${config.animationId}-guided-${frame}`,
      frameDomain: config.frameDomain, stopFrame: frame,
      resumeFrame: frame + 1,
      resolution: "explicit-source-control-finished" as const,
      completionDisposition: "blocked-while-unresolved" as const,
      requiresHostInteractiveStop: true as const,
      strictAcceptanceEffect: "none" as const}));
  return Object.freeze([...guided, Object.freeze({
    id: `${config.animationId}-choice-${config.quizFrame}`,
    frameDomain: config.frameDomain, stopFrame: config.quizFrame,
    resumeFrame: config.resumeFrame,
    resolution: "explicit-source-feedback-finished" as const,
    completionDisposition: "blocked-while-unresolved" as const,
    requiresHostInteractiveStop: true as const,
    strictAcceptanceEffect: "none" as const,
  })]);
}

function SemanticAnswer({config}: {
  readonly config: AlgL11Behavior10PageConfig;
}) {
  const special = config.answerEvidence.specialGeometryConclusion;
  if (special?.kind === "number-line-graph") {
    return <svg aria-label="x greater than 2; open boundary at 2 and ray right"
      data-boundary-closed="false" data-boundary-value="2"
      data-math-geometry="x-greater-than-2-open-right-ray"
      data-ray-direction="right" role="img" viewBox="0 0 240 64"
      style={{display: "block", height: 58, maxWidth: 260, width: "100%"}}>
      <defs><marker id={`${config.animationId}-arrow`} markerHeight="7"
        markerWidth="8" orient="auto" refX="7" refY="3.5">
        <path d="M0,0 L8,3.5 L0,7 Z" fill="#173b63" />
      </marker></defs>
      <line stroke="#173b63" strokeWidth="3" x1="18" x2="220"
        y1="28" y2="28" />
      <line stroke="#173b63" strokeWidth="2" x1="116" x2="116"
        y1="20" y2="36" />
      <circle cx="116" cy="28" fill="#fff" r="7" stroke="#173b63"
        strokeWidth="3" />
      <line markerEnd={`url(#${config.animationId}-arrow)`}
        stroke="#173b63" strokeWidth="4" x1="125" x2="207" y1="28"
        y2="28" />
      <text fill="#173b63" fontSize="15" textAnchor="middle" x="116"
        y="54">2</text>
    </svg>;
  }
  if (special?.kind === "absolute-value-inequality") {
    return <span aria-label="absolute value of x is less than five"
      data-absolute-value-bars="2" data-math-geometry="absolute-value-x-less-5"
      data-operator="less-than" style={{fontSize: 23, fontWeight: 700}}>
      |x| &lt; 5
    </span>;
  }
  return <span data-source-semantic-answer="true">
    {config.correct.semanticAnswer}
  </span>;
}

function frameState(config: AlgL11Behavior10PageConfig,
  context: RuntimeContext,
) {
  const frameDomain = context.frameDomain ?? config.frameDomain;
  const supported = frameDomain === config.frameDomain &&
    context.scenario === SCENARIO && context.frame >= 1 &&
    context.frame <= config.frameCount;
  return Object.freeze({animationId: config.animationId,
    frame: context.frame, frameDomain, rootFrame: context.rootFrame ?? 6,
    scenario: context.scenario, language: context.lang, seed: context.seed,
    status: supported ? "ready" as const : "blocked" as const,
    domRendererImplemented: true as const,
    currentJavaScriptRegistered: false as const,
    staleAngleOverlaySuppressed: Boolean(config.help.staleAngleOverlay),
    correctHelpInstanceName: config.help.instanceName,
    productCalibrationPassed: false as const,
    authoritativeOriginalRuntime: false as const,
    visualFidelityAccepted: false as const,
    audioAccepted: false as const,
    strictAcceptanceEffect: "none" as const});
}

export function createAlgL11Behavior10CandidateCore(
  config: AlgL11Behavior10PageConfig,
  wrapperKind: "tutorial" | "guided",
) {
  const stops = interactiveStops(config);
  if ((wrapperKind === "tutorial") !==
      (config.familyId === "l11-tutorial-multi-question-choice") ||
    config.help.instanceName !== "Mc_Popup" ||
    config.options.length !== 4 ||
    config.options.filter((entry) => entry.correct).length !== 1 ||
    (wrapperKind === "guided" && !config.help.staleAngleOverlay) ||
    (wrapperKind === "tutorial" && config.help.staleAngleOverlay !== null)) {
    throw new Error("ALG L11 behavior10 candidate wrapper identity drifted");
  }

  function Renderer(props: AnimationRendererProps) {
    const sentResolutions = useRef(new Set<string>());
    const previousReplay = useRef(props.replay ?? 0);
    const [requestBlocked, setRequestBlocked] = useState(false);
    const [state, setState] = useState(() =>
      createAlgL11Behavior10State(config, props.frame, props.replay ?? 0));

    useEffect(() => {
      setState((current) => reduceAlgL11Behavior10(config, current,
        {type: "observe-frame", frame: props.frame}));
    }, [props.frame]);

    useEffect(() => {
      const replay = props.replay ?? 0;
      if (replay === previousReplay.current) return;
      previousReplay.current = replay;
      sentResolutions.current.clear();
      setRequestBlocked(false);
      setState((current) => reduceAlgL11Behavior10(config, current,
        {type: "replay", input: "mouse"}));
      props.onLessonHostRequest?.({type: "reset-practice-feedback",
        interactionId: config.animationId});
    }, [props.onLessonHostRequest, props.replay]);

    useEffect(() => {
      if (state.phase !== "resumed" || state.resolvedStopFrame === null ||
        !props.onInteractiveStopResolved) return;
      const stop = stops.find((entry) =>
        entry.stopFrame === state.resolvedStopFrame);
      if (!stop) return;
      const key = `${state.replay}:${stop.id}`;
      if (sentResolutions.current.has(key)) return;
      sentResolutions.current.add(key);
      props.onInteractiveStopResolved({stopId: stop.id,
        frameDomain: stop.frameDomain, resolution: stop.resolution,
        source: "maintained-source-derived-interaction"});
    }, [props.onInteractiveStopResolved, state.phase,
      state.replay, state.resolvedStopFrame]);

    const activeStop = stops.find((entry) =>
      entry.stopFrame === state.activeStopFrame);
    const active = state.phase !== "timeline" && state.phase !== "terminal" &&
      state.phase !== "resumed";
    const controlsReady = active && !props.paused;
    const feedback = feedbackTextForAlgL11Behavior10(config, state);
    const exactChoice = useMemo(() => config.options.find((entry) =>
      entry.id === config.correct.visibleLabel), []);

    const choose = (choiceId: "A" | "B" | "C" | "D") => {
      if (!controlsReady || state.phase !== "choosing") return;
      const intent = buildAlgL11Behavior10FeedbackRequest(config, choiceId,
        props.seed);
      const decision = props.onLessonHostRequest?.(intent.request);
      const allowed = decision?.status === "allowed";
      setRequestBlocked(!allowed);
      setState((current) => reduceAlgL11Behavior10(config, current,
        {type: "choose", choiceId, input: "mouse", hostAllowed: allowed,
          feedbackBranch: intent.branchIndex}));
    };
    const dismissFeedback = () => {
      const decision = props.onLessonHostRequest?.({
        type: "reset-practice-feedback", interactionId: config.animationId});
      const allowed = decision?.status === "allowed";
      setRequestBlocked(!allowed);
      setState((current) => reduceAlgL11Behavior10(config, current,
        {type: "dismiss-feedback", input: "mouse",
          hostResetAllowed: allowed}));
    };

    return <div data-acceptance-passed="false"
      data-animation-id={config.animationId}
      data-audio-accepted="false"
      data-authoritative-original-runtime="false"
      data-browser-product-calibration-passed="false"
      data-current-javascript-implemented="true"
      data-current-javascript-registered="false"
      data-dom-renderer-implemented="true"
      data-private-current-js="true"
      data-product-calibration-passed="false"
      data-release-authorized="false"
      data-source-actionscript-executed="false"
      data-source-audio-trigger-established="false"
      data-stale-angle-overlay-suppressed={
        config.help.staleAngleOverlay ? "true" : "not-applicable"}
      data-strict-complete="false"
      data-tranche="g678-alg-l11-behavior10-tranche-b"
      data-visual-fidelity-accepted="false"
      data-whole-lesson-engineering-preview-ready="false"
      style={shellStyle}>
      <header>
        <h2 style={{margin: 0}}>Inequality source-behavior candidate</h2>
        <p data-source-animation-id={config.animationId}>
          {config.animationId} · main frame {props.frame} of {config.frameCount}
        </p>
      </header>
      <div aria-label="Maintained timeline status" data-active-phase={state.phase}
        data-active-stop-frame={state.activeStopFrame ?? "none"}
        data-frame-domain={config.frameDomain}
        data-main-object-id={config.mainObjectId}
        data-quiz-try-count={state.quizTryCount}
        data-runtime-paused={props.paused ? "true" : "false"}
        role="status">
        Source-bound DOM behavior; complete visual timeline parity is not
        claimed.
      </div>
      {state.phase === "guided-stop" ? <button disabled={!controlsReady}
        onClick={() => setState((current) => reduceAlgL11Behavior10(config,
          current, {type: "continue-guided", input: "mouse"}))}
        style={buttonStyle} type="button">
        Continue guided step {state.activeStopFrame}
      </button> : null}
      {["choosing", "help-open", "right-feedback", "wrong-feedback-1",
        "wrong-feedback-2"].includes(state.phase) ? <section
          aria-label="Source-labeled multiple-choice interaction"
          data-answer-frame-svg-sha256={config.answerEvidence.frameSvg.sha256}
          data-correct-source-instance={exactChoice?.sourceInstanceName}
          data-correct-visible-label={config.correct.visibleLabel}
          data-source-quiz-frame={config.quizFrame}>
          <p>Choose the source-visible label. Exact source vector evidence is
            hash-bound; this maintained DOM is not a fidelity claim.</p>
          <div style={{display: "grid", gap: 9,
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))"}}>
            {config.options.map((choice) => <button
              aria-pressed={state.selectedChoice === choice.id}
              data-choice-id={choice.id}
              data-source-button-character-id={choice.sourceCharacterId}
              data-source-instance-name={choice.sourceInstanceName}
              disabled={!controlsReady || state.phase !== "choosing"}
              key={choice.id} onClick={() => choose(choice.id)}
              style={buttonStyle} type="button">
              <strong>{choice.id}</strong>{choice.correct ? <SemanticAnswer
                config={config} /> : <span>Source vector option</span>}
            </button>)}
          </div>
          {state.phase === "choosing" ? <button disabled={!controlsReady}
            onClick={() => setState((current) => reduceAlgL11Behavior10(config,
              current, {type: "open-help", input: "mouse"}))}
            style={buttonStyle} type="button">Need more help</button> : null}
          {state.phase === "help-open" ? <aside aria-live="polite"
            data-source-character-id={config.help.characterId}
            data-source-help-svg-sha256={config.help.frameSvg.sha256}
            data-source-instance-name="Mc_Popup" role="status">
            <p>Exact source help artwork is bound by its frozen SVG hash.</p>
            <button disabled={Boolean(props.paused)} onClick={() =>
              setState((current) => reduceAlgL11Behavior10(config, current,
                {type: "close-help", input: "mouse"}))}
            style={buttonStyle} type="button">Close help</button>
          </aside> : null}
          {feedback ? <div aria-live="assertive"
            data-feedback-branch={state.feedbackBranch ?? "none"}
            data-feedback-phase={state.phase} role="alert">
            <p>{feedback}</p>
            <button disabled={Boolean(props.paused)} onClick={dismissFeedback}
              style={buttonStyle} type="button">
              {state.phase === "wrong-feedback-1" ? "Try again" : "Continue"}
            </button>
          </div> : null}
          {requestBlocked ? <p aria-live="assertive" role="alert">
            Typed practice-feedback host request failed closed.
          </p> : null}
        </section> : null}
      <footer style={{display: "flex", flexWrap: "wrap", gap: 10}}>
        <button disabled={Boolean(props.paused) || !props.onReplay}
          onClick={props.onReplay} style={buttonStyle}
          type="button">Replay</button>
        <span data-interactive-stop-id={activeStop?.id ?? "none"}>
          Audio candidate retained as evidence only; no cue is requested.
        </span>
      </footer>
    </div>;
  }

  const sourceRuntime = runtime(config);
  const module = Object.freeze({key: config.animationId, movie: MOVIE,
    runtime: sourceRuntime, playbackMode: "once" as const,
    playbackEndFrameByDomain: Object.freeze({root: 6,
      [config.frameDomain]: config.terminalFrame}),
    reducedMotionFrame: 1, scenarios: SCENARIOS,
    defaultScenarioByFrameDomain: Object.freeze({
      [config.frameDomain]: SCENARIO}),
    audioCues: Object.freeze([]), interactiveStops: stops,
    lessonHost: Object.freeze({
      capabilities: Object.freeze(["practice-feedback" as const]),
      legacyOperations: "blocked" as const,
      auditStorage: "memory-only" as const,
      storesPersonalData: false as const}),
    maturity: "private-current-js" as const, Renderer,
    getFrameState: (_frame: number, context: RuntimeContext) =>
      frameState(config, context),
  } satisfies AnimationModule);
  return Object.freeze({config, interactiveStops: stops, module, Renderer});
}
