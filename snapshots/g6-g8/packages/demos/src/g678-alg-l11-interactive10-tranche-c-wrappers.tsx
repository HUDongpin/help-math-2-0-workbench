"use client";

import React, {useEffect, useState} from "react";

import type {AnimationRendererProps} from "./contract";
import type {
  AlgL11Interactive10ChoicePage,
  AlgL11Interactive10Page,
  AlgL11Interactive10TwoTryPage,
} from
  "./g678-alg-l11-interactive10-tranche-c-core";
import {
  G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CHOICE_HELP,
} from "./g678-alg-l11-interactive10-tranche-c-core";
import {
  buildAlgL11Interactive10PracticeFeedbackRequest,
  buildAlgL11Interactive10PracticeFeedbackResetRequest,
  createAlgL11Interactive10ChoiceState,
  createAlgL11Interactive10RandomState,
  createAlgL11Interactive10TwoTryState,
  reduceAlgL11Interactive10Choice,
  reduceAlgL11Interactive10Random,
  reduceAlgL11Interactive10TwoTry,
  resolveAlgL11Interactive10PracticeFeedbackResetStatus,
  type AlgL11Interactive10ChoiceState,
  type AlgL11Interactive10ChoiceSlot,
} from "./g678-alg-l11-interactive10-tranche-c-state";

const panelStyle: React.CSSProperties = Object.freeze({
  background: "#f7fbff", border: "2px solid #245a88", borderRadius: 14,
  boxSizing: "border-box", color: "#132f49", display: "grid", gap: 14,
  margin: "0 auto", maxWidth: 800, minHeight: 500, padding: 22,
});
const buttonStyle: React.CSSProperties = Object.freeze({
  background: "#fff", border: "2px solid #245a88", borderRadius: 9,
  color: "#132f49", cursor: "pointer", fontSize: 17, minHeight: 48,
  padding: "9px 13px",
});

type GraphSpec = Readonly<{boundary: number; closed: boolean;
  direction: "left" | "right"; label: string}>;
type VisibleOption = Readonly<{math: string; graph?: GraphSpec}>;
type VisibleChoicePage = Readonly<{prompt: string;
  options: Readonly<Partial<Record<AlgL11Interactive10ChoiceSlot,
    VisibleOption>>>}>;

const VISIBLE_CHOICES = {
    "shared-alg001-l11-p008": Object.freeze({
      prompt: "Choose the inequality that represents the graph shown.",
      options: Object.freeze({A: {math: "x > −3"},
        B: {math: "−3 < x < 3"}, C: {math: "x < 3"}}),
    }),
    "shared-alg001-l11-p011": Object.freeze({
      prompt: "Simplify the inequality −10x ≤ −20.",
      options: Object.freeze({A: {math: "x < 2"}, B: {math: "x < 10"},
        C: {math: "x ≥ 2"}, D: {math: "x ≤ 10"}}),
    }),
    "shared-alg001-l11-p014": Object.freeze({
      prompt: "To get a driver's license, you must be at least 16 years old.",
      options: Object.freeze({A: {math: "age = 16"}, B: {math: "age < 16"},
        C: {math: "16 > age"}, D: {math: "age ≥ 16"}}),
    }),
    "shared-alg001-l11-p019": Object.freeze({
      prompt: "Choose the correct graph for x + 3 ≤ 5.",
      options: Object.freeze({
        A: {math: "x ≤ 2", graph: {boundary: 2, closed: true,
          direction: "left" as const, label: "closed boundary at 2, ray left"}},
        B: {math: "x ≤ 5", graph: {boundary: 5, closed: true,
          direction: "left" as const, label: "closed boundary at 5, ray left"}},
        C: {math: "source alternate number-line graph"},
      }),
    }),
    "shared-alg001-l11-p020": Object.freeze({
      prompt: "Choose the correct graph for 3x ≥ 6.",
      options: Object.freeze({
        A: {math: "x ≥ 6", graph: {boundary: 6, closed: true,
          direction: "right" as const, label: "closed boundary at 6, ray right"}},
        B: {math: "x ≥ 2", graph: {boundary: 2, closed: true,
          direction: "right" as const, label: "closed boundary at 2, ray right"}},
        C: {math: "x ≥ 3", graph: {boundary: 3, closed: true,
          direction: "right" as const, label: "closed boundary at 3, ray right"}},
      }),
    }),
    "shared-alg001-l11-p021": Object.freeze({
      prompt: "Choose the correct graph for −5x < 25.",
      options: Object.freeze({
        A: {math: "x > 5", graph: {boundary: 5, closed: false,
          direction: "right" as const, label: "open boundary at 5, ray right"}},
        B: {math: "x > −5", graph: {boundary: -5, closed: false,
          direction: "right" as const, label: "open boundary at negative 5, ray right"}},
        C: {math: "source alternate number-line graph"},
      }),
    }),
    "shared-alg001-l11-p025": Object.freeze({
      prompt: "Choose the inequality that represents the graph shown.",
      options: Object.freeze({A: {math: "x > −7"},
        B: {math: "−7 < x < 7"}, C: {math: "x < 7"}}),
    }),
  } as const satisfies Readonly<Record<string, VisibleChoicePage>>;

function Boundary({animationId, paused, replay, children}: {
  readonly animationId: string; readonly paused?: boolean;
  readonly replay?: number; readonly children: React.ReactNode;
}) {
  return <div data-acceptance-passed="false"
    data-animation-id={animationId} data-audio-accepted="false"
    data-authoritative-original-runtime="false"
    data-browser-product-calibration-passed="false"
    data-current-javascript-implemented="true"
    data-current-javascript-registered="false"
    data-private-current-js="true" data-product-calibration-passed="false"
    data-release-authorized="false" data-runtime-paused={paused ? "true" : "false"}
    data-runtime-replay={replay ?? 0} data-source-actionscript-executed="false"
    data-source-audio-played="false" data-strict-complete="false"
    data-tranche="g678-alg-l11-interactive10-tranche-c"
    data-whole-lesson-engineering-preview-ready="false" style={panelStyle}>
    {children}
  </div>;
}

function NumberLine({graph}: {readonly graph: GraphSpec}) {
  const x = 130 + graph.boundary * 9;
  const start = graph.direction === "right" ? x : 18;
  const end = graph.direction === "right" ? 242 : x;
  return <svg aria-label={graph.label} data-boundary-closed={String(graph.closed)}
    data-boundary-value={graph.boundary} data-ray-direction={graph.direction}
    role="img" viewBox="0 0 260 62"
    style={{height: 58, maxWidth: 360, width: "100%"}}>
    <line stroke="#52677a" strokeWidth="2" x1="16" x2="244" y1="28" y2="28" />
    {Array.from({length: 19}, (_, index) => index - 9).map((tick) => {
      const tickX = 130 + tick * 9;
      return <g key={tick}><line stroke="#52677a" x1={tickX} x2={tickX}
        y1="23" y2="34"/><text fill="#132f49" fontSize="8"
        textAnchor="middle" x={tickX} y="47">{tick}</text></g>;
    })}
    <line stroke="#111" strokeWidth="4" x1={start} x2={end} y1="18" y2="18" />
    <polygon fill="#111" points={graph.direction === "right"
      ? `${end},18 ${end - 10},12 ${end - 10},24`
      : `${start},18 ${start + 10},12 ${start + 10},24`} />
    <circle cx={x} cy="18" fill={graph.closed ? "#111" : "#fff"} r="6"
      stroke="#111" strokeWidth="3" />
  </svg>;
}

function choicePage(config: AlgL11Interactive10Page): Readonly<{
  config: AlgL11Interactive10ChoicePage; visible: VisibleChoicePage;
}> {
  if (config.sourceContract.kind !== "choice-feedback-practice") {
    throw new Error(`${config.animationId}: choice wrapper family drifted`);
  }
  const visible = VISIBLE_CHOICES[
    config.animationId as keyof typeof VISIBLE_CHOICES] as VisibleChoicePage;
  if (!visible) throw new Error(`${config.animationId}: visible choice spec missing`);
  return {config: config as AlgL11Interactive10ChoicePage, visible};
}

export function AlgL11Interactive10ChoiceHelp({config}: {
  readonly config: AlgL11Interactive10ChoicePage;
}) {
  const custody = G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CHOICE_HELP[
    config.animationId as keyof typeof
      G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CHOICE_HELP];
  if (!custody) {
    throw new Error(`${config.animationId}: source-bound help projection missing`);
  }
  return <div data-source-help-popup-export-name={custody.popupSprite.exportName}
    data-source-help-popup-frame-count={custody.popupSprite.frameCount}
    data-source-help-popup-object-id={custody.popupSprite.objectId}
    data-source-help-control-present={String(
      custody.sourceControlScripts.length > 0)}
    data-source-help-script-count={custody.sourceControlScripts.length}
    data-source-help-script-sha256={custody.sourceControlScripts
      .map((script) => script.sha256).join("|")}>
    {custody.textPlacements.map((placement) =>
      <p data-source-definition-sha256={placement.definitionSha256}
        data-source-placement-depth={placement.depth}
        data-source-placement-fragment-sha256={
          placement.placementFragmentSha256}
        data-source-text-object-id={placement.objectId}
        data-source-text-sha256={placement.text.sha256}
        key={placement.objectId}>{placement.text.visibleText}</p>)}
  </div>;
}

export function AlgL11Interactive10ChoiceFeedbackStatus({state, paused,
  onDismiss}: {
  readonly state: AlgL11Interactive10ChoiceState;
  readonly paused: boolean;
  readonly onDismiss: () => void;
}) {
  return <div aria-live="assertive" data-feedback-branch={
    state.feedbackBranchIndex ?? "none"}
    data-feedback-phase={state.phase}
    data-help-open={String(state.helpOpen)}
    data-host-feedback-status={state.hostFeedbackStatus}
    data-host-reset-status={state.hostResetStatus} role="status">
    {state.feedbackText ? <p>{state.feedbackText}</p> : null}
    {(state.phase === "right-feedback" || state.phase === "wrong-feedback")
      ? <button disabled={paused} onClick={onDismiss}
        style={buttonStyle} type="button">{
          state.phase === "wrong-feedback" && state.wrongAttempt === 1
            ? "Try again" : "Continue"}</button> : null}
    {state.hostFeedbackStatus === "blocked" ? <p role="alert">
      Typed practice-feedback request failed closed.</p> : null}
  </div>;
}

export function createAlgL11Interactive10ChoiceRenderer(
  input: AlgL11Interactive10Page,
) {
  const {config, visible} = choicePage(input);
  const helpAvailable = Object.hasOwn(
    G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CHOICE_HELP,
    config.animationId);
  function Renderer(props: AnimationRendererProps) {
    const [state, setState] = useState(() =>
      createAlgL11Interactive10ChoiceState(props.replay ?? 0));
    useEffect(() => setState(createAlgL11Interactive10ChoiceState(
      props.replay ?? 0)), [props.replay]);
    const choose = (slot: AlgL11Interactive10ChoiceSlot) => {
      if (props.paused || state.phase !== "choosing" || state.helpOpen) return;
      const next = reduceAlgL11Interactive10Choice(config, state,
        {type: "select", slot, input: "mouse", seed: props.seed});
      if (next.feedbackBranchIndex === null ||
        next.feedbackBranchCount === null) {
        setState(next);
        return;
      }
      const request = buildAlgL11Interactive10PracticeFeedbackRequest(
        config.animationId,
        next.phase === "right-feedback" ? "correct" : "incorrect",
        next.feedbackBranchIndex, next.feedbackBranchCount);
      const decision = props.onLessonHostRequest?.(request);
      setState(reduceAlgL11Interactive10Choice(config, next,
        {type: "host-result", status: decision?.status === "allowed"
          ? "allowed" : "blocked"}));
    };
    const dismissFeedback = () => {
      if (props.paused) return;
      const decision = props.onLessonHostRequest?.(
        buildAlgL11Interactive10PracticeFeedbackResetRequest(
          config.animationId));
      setState((current) => reduceAlgL11Interactive10Choice(config, current,
        {type: "dismiss-feedback", input: "mouse",
          resetStatus:
            resolveAlgL11Interactive10PracticeFeedbackResetStatus(decision)}));
    };
    return <Boundary animationId={config.animationId} paused={props.paused}
      replay={props.replay}>
      <header><h2 style={{margin: 0}}>Inequality practice</h2>
        <p>{visible.prompt}</p></header>
      <section aria-label="Exact source-choice projection"
        data-geometry-mode={config.sourceContract.geometryMode}
        data-source-geometry-set-sha256={config.sourceContract.geometrySetSha256}
        data-source-quiz-frame={config.sourceContract.quizFrame}>
        <div style={{display: "grid", gap: 10}}>
          {config.sourceContract.optionSlots.filter((option) => option.present)
            .map((option) => {
              const visual = visible.options[option.slot];
              if (!visual) throw new Error(`${config.animationId} ${option.slot}: visible option missing`);
              return <button aria-label={`${option.slot}: ${visual.math}`}
                aria-pressed={state.selected === option.slot}
                data-correct-source-option={String(option.correct)}
                data-source-geometry-sha256={option.geometrySha256}
                data-source-hit-object-id={option.hitTarget.objectId}
                data-source-hit-target={option.hitTarget.name}
                data-source-visible-object-count={option.visibleObjectCount}
                data-source-visible-object-projection-sha256={
                  option.visibleObjectProjectionSha256}
                data-source-visible-text-vector={option.visibleTextValues.join(" | ")}
                disabled={Boolean(props.paused) || state.phase !== "choosing" ||
                  state.helpOpen}
                key={option.slot} onClick={() => choose(option.slot)}
                style={{...buttonStyle, textAlign: "left"}} type="button">
                <strong>{option.slot}. </strong><span>{visual.math}</span>
                {visual.graph ? <NumberLine graph={visual.graph}/> : null}
              </button>;
            })}
        </div>
      </section>
      <AlgL11Interactive10ChoiceFeedbackStatus state={state}
        paused={Boolean(props.paused)} onDismiss={dismissFeedback}/>
      {helpAvailable ? <div>
        <button disabled={Boolean(props.paused) ||
          state.phase !== "choosing" || state.helpOpen}
          onClick={() => setState((current) =>
            reduceAlgL11Interactive10Choice(config, current,
              {type: "open-help", input: "mouse"}))}
          style={buttonStyle} type="button">Need more help</button>
      </div> : null}
      {helpAvailable && state.helpOpen ?
        <aside aria-label="Source-bound choice help"
        data-maintained-help-surface="true"
        data-source-need-more-help-open="true">
        <AlgL11Interactive10ChoiceHelp config={config}/>
        <button disabled={Boolean(props.paused)} onClick={() => setState(
          (current) => reduceAlgL11Interactive10Choice(config, current,
            {type: "close-help", input: "mouse"}))}
        style={buttonStyle} type="button">Close help</button>
      </aside> : null}
      <footer><button disabled={Boolean(props.paused) || !props.onReplay}
        onClick={props.onReplay} style={buttonStyle}
        type="button">Replay</button>
        <p>Source audio is evidence-only and is not played.</p></footer>
    </Boundary>;
  }
  return Renderer;
}

export function createAlgL11Interactive10RandomRenderer(
  config: AlgL11Interactive10Page,
) {
  if (config.sourceContract.kind !== "random-audio-label-timeline") {
    throw new Error(`${config.animationId}: random wrapper family drifted`);
  }
  const randomConfig = config as Extract<AlgL11Interactive10Page,
    {readonly animationId: "shared-alg001-l11-p006"}>;
  function Renderer(props: AnimationRendererProps) {
    const [state, setState] = useState(() =>
      createAlgL11Interactive10RandomState(props.seed, props.replay ?? 0));
    useEffect(() => setState(createAlgL11Interactive10RandomState(props.seed,
      props.replay ?? 0)), [props.replay, props.seed]);
    const window = randomConfig.sourceContract.labelWindows.find((candidate) =>
      candidate.label === state.selectedLabel);
    return <Boundary animationId={config.animationId} paused={props.paused}
      replay={props.replay}>
      <h2 style={{margin: 0}}>Random source branch: {state.selectedLabel}</h2>
      <p data-audio-played="false" data-source-branch-end={window?.returnFrame}
        data-source-branch-start={window?.startFrame}
        data-source-sound-stream-block-count={window?.soundStreamBlockCount}>
        The deterministic candidate selected {state.selectedLabel}; its source
        streamed audio remains silent and acceptance-neutral.</p>
      <div style={{display: "grid", gap: 10}}>
        <button disabled={Boolean(props.paused)} onClick={() => setState(
          (current) => reduceAlgL11Interactive10Random(current,
            {type: "select", option: "Opt_1", input: "mouse"}))}
        style={buttonStyle} type="button">{"x > 5"}</button>
        <button disabled={Boolean(props.paused)} onClick={() => setState(
          (current) => reduceAlgL11Interactive10Random(current,
            {type: "select", option: "Opt_2", input: "mouse"}))}
        style={buttonStyle} type="button">Source visual distractor</button>
      </div>
      <p aria-live="polite" data-feedback-phase={state.phase} role="status">
        {state.phase === "right-feedback" ? "Correct." :
          state.phase === "wrong-feedback" ? "Try again." : "Choose an answer."}
      </p>
      <button disabled={Boolean(props.paused) || !props.onReplay}
        onClick={props.onReplay} style={buttonStyle} type="button">Replay</button>
    </Boundary>;
  }
  return Renderer;
}

export function createAlgL11Interactive10TwoTryRenderer(
  config: AlgL11Interactive10Page,
) {
  if (config.sourceContract.kind !== "two-try-need-more-help") {
    throw new Error(`${config.animationId}: two-try wrapper family drifted`);
  }
  const twoTryConfig = config as AlgL11Interactive10TwoTryPage;
  function Renderer(props: AnimationRendererProps) {
    const [state, setState] = useState(() =>
      createAlgL11Interactive10TwoTryState(props.replay ?? 0));
    useEffect(() => setState(createAlgL11Interactive10TwoTryState(
      props.replay ?? 0)), [props.replay]);
    const send = (type: "open-feedback" | "close-popup" |
      "advance-local-parent" | "open-help" | "close-help") =>
      setState((current) => reduceAlgL11Interactive10TwoTry(current,
        {type, input: "mouse"}));
    return <Boundary animationId={config.animationId} paused={props.paused}
      replay={props.replay}>
      <h2 style={{margin: 0}}>Two-try help interaction</h2>
      <p data-maintained-local-parent-transition="true"
        data-original-runtime-parent-binding-established="false"
        data-source-nested-frame={state.nestedFrame}
        data-source-parent-chain-sha256={
          twoTryConfig.sourceContract.sourceParentChain.mainToNested
            .placementFragmentSha256}>
        The maintained adapter resolves the local nested transition explicitly;
        the original Flash <code>_parent</code> runtime binding remains unresolved.
      </p>
      <div style={{display: "flex", flexWrap: "wrap", gap: 10}}>
        <button disabled={Boolean(props.paused) || state.phase !== "ready"}
          onClick={() => send("open-feedback")} style={buttonStyle}
          type="button">Open attempt feedback</button>
        <button disabled={Boolean(props.paused) ||
          state.phase !== "feedback-stopped"} onClick={() => send("close-popup")}
          style={buttonStyle} type="button">Close feedback</button>
        <button disabled={Boolean(props.paused) ||
          state.phase !== "parent-transition"}
          onClick={() => send("advance-local-parent")} style={buttonStyle}
          type="button">Continue local parent transition</button>
        <button disabled={Boolean(props.paused) ||
          state.phase === "parent-transition" || state.phase === "help-open"}
          onClick={() => send("open-help")} style={buttonStyle}
          type="button">Need more help</button>
      </div>
      {state.phase === "help-open" ? <aside aria-label="Local help surface"
        data-source-popup-frame-count={
          twoTryConfig.sourceContract.sourceParentChain.popupFrameCount}>
        <p>Help stays local, memory-only, and acceptance-neutral.</p>
        <button disabled={Boolean(props.paused)} onClick={() => send("close-help")}
          style={buttonStyle} type="button">Close help</button>
      </aside> : null}
      <p aria-live="polite" data-two-try-phase={state.phase}
        data-two-try-source-count={state.tryCount} role="status">
        {state.phase === "complete" ? "Two source-shaped attempts complete." :
          `Maintained phase: ${state.phase}.`}</p>
      <button disabled={Boolean(props.paused) || !props.onReplay}
        onClick={props.onReplay} style={buttonStyle} type="button">Replay</button>
    </Boundary>;
  }
  return Renderer;
}
