"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationModule, AnimationRendererProps, MovieMetadata} from "../contract";
import {COURSE_G04_L11_IN_012_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_012_INTERACTION_SOURCE, COURSE_G04_L11_IN_012_TERMS,
  createCourseG04L11In012LineSegmentState,
  getCourseG04L11In012SelectedTerm, reduceCourseG04L11In012LineSegment,
  type CourseG04L11In012LineSegmentEvent,
  type CourseG04L11In012LineSegmentState,
  type CourseG04L11In012TermId} from
  "../timelines/course-g04-l11-in-012-line-segment-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule; readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}
const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-68";
const UI_FONT = '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';
const ES_LABELS: Readonly<Record<CourseG04L11In012TermId, string>> = Object.freeze({
  length: "Longitud", unit: "Unidad",
});
const ES_PROMPTS: Readonly<Record<CourseG04L11In012TermId, string>> = Object.freeze({
  length: "La longitud indica la distancia de un extremo al otro.",
  unit: "Una unidad es un paso igual que se usa para medir la distancia.",
});

function PageCompanionPortal({children, targetId}: {
  children: React.ReactNode; targetId?: string;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  useEffect(() => {
    if (!targetId) { setTarget(null); setResolvedId(null); return; }
    setTarget(document.getElementById(targetId)); setResolvedId(targetId);
  }, [targetId]);
  if (!targetId) return children;
  if (resolvedId !== targetId) return null;
  return target ? createPortal(children, target) : children;
}

function LineSegmentControls({dispatch, hostFrame, interaction, lang,
  replayLocally}: {
  dispatch: React.Dispatch<CourseG04L11In012LineSegmentEvent>;
  hostFrame: number; interaction: CourseG04L11In012LineSegmentState;
  lang: "en" | "es"; replayLocally: () => void;
}) {
  const selected = getCourseG04L11In012SelectedTerm(interaction);
  const isSpanish = lang === "es";
  return (
    <section aria-label={isSpanish ? "Longitud de un segmento vertical" :
      "Vertical line-segment length help"}
      className="course-g04-l11-in012-controls"
      data-animation-internal-control-count="2"
      data-glossary-control-count="2"
      data-legacy-course-shell-included="false"
      data-legacy-player-chrome-included="false"
      data-modern-lesson-playback-controls="true"
      data-source-audio-enabled="false"
      data-external-spanish-audio-enabled="false"
      data-spanish-source-visual-parity-established="false">
      <header>
        <span>HELP Math 2.0</span>
        <strong>{isSpanish ? "Longitud de segmentos verticales" :
          "Find the Length of a Vertical Segment"}</strong>
        <p>{isSpanish
          ? "Un segmento de línea es la parte de una línea entre dos puntos."
          : COURSE_G04_L11_IN_012_INTERACTION_SOURCE.definition}</p>
      </header>
      <div className="course-g04-l11-in012-example">
        <div><span>{isSpanish ? "Extremos" : "Endpoints"}</span>
          <strong>(3,1) → (3,9)</strong>
          <p>{isSpanish ? "Los dos puntos tienen x = 3." :
            "Both points share x = 3, so the segment is vertical."}</p></div>
        <div><span>{isSpanish ? "Resta" : "Subtract"}</span>
          <strong>9 − 1 = 8</strong>
          <p>{isSpanish ? "longitud = 8 unidades" : "length = 8 units"}</p></div>
      </div>
      <ol aria-label={isSpanish ? "Pasos" : "Steps"}>
        <li><b>1</b><div><strong>{isSpanish ? "Mira los extremos" : "Read the endpoints"}</strong>
          <p>(3,1) and (3,9)</p></div></li>
        <li><b>2</b><div><strong>{isSpanish ? "Resta y" : "Subtract the y-values"}</strong>
          <p>9 − 1 = 8</p></div></li>
        <li><b>3</b><div><strong>{isSpanish ? "Escribe la longitud" : "State the length"}</strong>
          <p>{isSpanish ? "8 unidades" : "8 units"}</p></div></li>
      </ol>
      <div aria-label={isSpanish ? "Términos matemáticos" : "Math terms"}
        className="course-g04-l11-in012-terms" role="group">
        {COURSE_G04_L11_IN_012_TERMS.map((term) => (
          <button aria-pressed={interaction.selectedTermId === term.id}
            data-source-button-object-id={term.sourceButtonObjectId}
            data-source-key-attribute={term.sourceKeyAttribute}
            key={term.id} onClick={() => dispatch({type: "select-term",
              termId: term.id, frame: interaction.frame})} type="button">
            {isSpanish ? ES_LABELS[term.id] : term.label}
          </button>
        ))}
      </div>
      {selected ? <div aria-live="polite" className="course-g04-l11-in012-term-panel"
        role="status"><div><strong>{isSpanish ? ES_LABELS[selected.id] :
          selected.label}</strong><p>{isSpanish ? ES_PROMPTS[selected.id] :
          selected.modernPedagogicalPrompt}</p></div><div>
          <button onClick={() => dispatch({type: "close-term"})} type="button">
            {isSpanish ? "Cerrar" : "Close"}</button>
          <button onClick={() => dispatch({type: "resume", frame: hostFrame})} type="button">
            {isSpanish ? "Continuar" : "Resume"}</button>
        </div></div> : null}
      <div className="course-g04-l11-in012-playback" role="group"
        aria-label={isSpanish ? "Controles de la lección" : "Lesson playback controls"}>
        {interaction.playing ? <button onClick={() => dispatch({type: "pause",
          frame: interaction.frame})} type="button">{isSpanish ? "Pausa" : "Pause"}</button> :
          <button onClick={() => dispatch({type: "resume", frame: hostFrame})} type="button">
            {isSpanish ? "Continuar animación" : "Resume animation"}</button>}
        <button onClick={replayLocally} type="button">
          {isSpanish ? "Repetir" : "Replay"}</button>
      </div>
    </section>
  );
}

export function createCourseG04L11In012LineSegmentCandidate<
  SourceContract extends object,
>(candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const frameDomain = props.frameDomain ?? SOURCE_DOMAIN;
    const deterministicCapture = Boolean(props.entryStateSha256);
    const interactionVisible = frameDomain === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !deterministicCapture;
    const [interaction, dispatch] = useReducer(
      reduceCourseG04L11In012LineSegment, props.frame,
      createCourseG04L11In012LineSegmentState);
    useEffect(() => { dispatch({type: "synchronize-frame", frame: props.frame}); },
      [props.frame]);
    useEffect(() => { if ((props.replay ?? 0) > 0) dispatch({type: "replay"}); },
      [props.replay]);
    const replayLocally = () => { dispatch({type: "replay"}); props.onReplay?.(); };
    const visualFrame = interactionVisible ? interaction.frame : props.frame;
    return <div className="course-g04-l11-in012-candidate"
      data-authoritative-original-runtime-evidence="false"
      data-current-js-functional-candidate="true"
      data-current-js-functional-scope="440-source-canvas-frames-and-two-local-glossary-controls"
      data-legacy-course-shell-included="false"
      data-legacy-player-chrome-included="false"
      data-owner-accepted="false" data-registered-current-javascript="false"
      data-strict-acceptance-effect="none" data-strict-migration-complete="false"
      style={{margin: "0 auto", maxWidth: candidate.movie.stage.width,
        position: "relative", width: "100%"}}>
      <SourceRenderer {...props} frame={visualFrame} state={undefined} />
      {interactionVisible ? <PageCompanionPortal
        targetId={props.pageInteractionCompanionTargetId}>
        <LineSegmentControls dispatch={dispatch} hostFrame={props.frame}
          interaction={interaction} lang={props.uiLanguage ?? props.lang}
          replayLocally={replayLocally} />
      </PageCompanionPortal> : null}
      <style>{`
        .course-g04-l11-in012-candidate [data-source-replay-parity="unvalidated"]{display:none}
        .course-g04-l11-in012-controls{background:linear-gradient(145deg,#f5fbff,#e2f4ff);border:2px solid #2168a7;border-radius:18px;box-sizing:border-box;color:#17395f;display:grid;font-family:${UI_FONT};gap:14px;margin-top:12px;padding:16px;width:100%}
        .course-g04-l11-in012-controls header span,.course-g04-l11-in012-example span{color:#0758ba;display:block;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
        .course-g04-l11-in012-controls header strong{display:block;font-size:clamp(23px,4vw,32px);line-height:1.1;margin-top:3px}
        .course-g04-l11-in012-controls p{font-family:system-ui,sans-serif;line-height:1.45;margin:5px 0 0}
        .course-g04-l11-in012-example{display:grid;gap:12px;grid-template-columns:1fr 1fr}
        .course-g04-l11-in012-example>div{background:white;border:2px solid #75a6d5;border-radius:14px;padding:13px}
        .course-g04-l11-in012-example strong{color:#8b3100;display:block;font-size:clamp(24px,5vw,38px);margin-top:4px}
        .course-g04-l11-in012-controls ol{display:grid;gap:10px;grid-template-columns:repeat(3,1fr);list-style:none;margin:0;padding:0}
        .course-g04-l11-in012-controls li{align-items:center;background:white;border:2px solid #75a6d5;border-radius:14px;display:flex;gap:10px;min-height:72px;padding:10px}
        .course-g04-l11-in012-controls li b{align-items:center;background:#ffcc38;border:2px solid #9b5800;border-radius:999px;display:flex;flex:0 0 34px;height:34px;justify-content:center}
        .course-g04-l11-in012-terms{display:grid;gap:9px;grid-template-columns:repeat(2,minmax(125px,1fr))}
        .course-g04-l11-in012-controls button{background:linear-gradient(#fff8ad,#ffc72f);border:2px solid #a95000;border-radius:11px;color:#102b70;cursor:pointer;font:800 15px ${UI_FONT};min-height:48px;padding:9px 11px}
        .course-g04-l11-in012-controls button[aria-pressed="true"]{background:#0a61bc;border-color:#063a73;color:white}
        .course-g04-l11-in012-controls button:focus-visible{outline:4px solid #0758ba;outline-offset:3px}
        .course-g04-l11-in012-term-panel{align-items:center;background:white;border:2px solid #5d8fc0;border-radius:13px;display:flex;gap:14px;justify-content:space-between;padding:14px}
        .course-g04-l11-in012-term-panel>div:last-child,.course-g04-l11-in012-playback{display:flex;flex-wrap:wrap;gap:8px}
        @media(max-width:600px){.course-g04-l11-in012-example,.course-g04-l11-in012-controls ol{grid-template-columns:1fr}.course-g04-l11-in012-term-panel{align-items:stretch;flex-direction:column}.course-g04-l11-in012-playback{display:grid;grid-template-columns:1fr 1fr}}
      `}</style>
    </div>;
  }
  const sourceContract = Object.freeze({...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "440-source-canvas-frames-and-two-local-glossary-controls-functional-candidate",
    currentJavascriptFunctionalEntry: Object.freeze({frameDomain: SOURCE_DOMAIN,
      frame: 1, scenario: SOURCE_SCENARIO, language: "en",
      deterministicCaptureOverlayEnabled: false}),
    sourceInteraction: COURSE_G04_L11_IN_012_INTERACTION_SOURCE,
    interactionAuthority: COURSE_G04_L11_IN_012_INTERACTION_AUTHORITY,
    exactWorkedExampleDisplayed: true, sourceTerminalBehaviorEstablished: false,
    modernLocalPlaybackControlsProvided: true,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    registeredCurrentJavascript: false, sourceHostPauseParityEstablished: false,
    sourceAudioAccepted: false, externalSpanishAudioAccepted: false,
    spanishSourceVisualParityEstablished: false,
    behaviorParityEstablished: false, strictAcceptanceEffect: "none"});
  return Object.freeze({Renderer, module: Object.freeze({...candidate.module, Renderer}),
    sourceContract});
}
