"use client";

import React, {useEffect, useReducer} from "react";

import type {
  AnimationModule,
  AnimationRendererProps,
  MovieMetadata,
} from "../contract";
import {
  COURSE_G04_L11_VB_006_INTERACTION_AUTHORITY,
  COURSE_G04_L11_VB_006_INTERACTION_SOURCE,
  COURSE_G04_L11_VB_006_TERMS,
  createCourseG04L11Vb006InteractionState,
  getCourseG04L11Vb006CoordinateButtonAlpha,
  getCourseG04L11Vb006SelectedTerm,
  reduceCourseG04L11Vb006Interaction,
  type CourseG04L11Vb006InteractionEvent,
  type CourseG04L11Vb006InteractionState,
  type CourseG04L11Vb006TermId,
} from "../timelines/course-g04-l11-vb-006-ordered-pair-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule;
  readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}

const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-85";
const UI_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';

const HELP: Readonly<Record<CourseG04L11Vb006TermId,
Readonly<{en: string; es: string}>>> = Object.freeze({
  "ordered-pair": Object.freeze({
    en: "An ordered pair is a pair of numbers used to locate a point on a coordinate grid.",
    es: "Un par ordenado usa dos números para ubicar un punto en una cuadrícula de coordenadas.",
  }),
  pair: Object.freeze({en: "A pair contains two values in a specific order.",
    es: "Un par contiene dos valores en un orden específico."}),
  number: Object.freeze({en: "Each number tells how far to move along one axis.",
    es: "Cada número indica cuánto avanzar a lo largo de un eje."}),
  locate: Object.freeze({en: "To locate means to identify an exact position.",
    es: "Ubicar significa identificar una posición exacta."}),
  point: Object.freeze({en: "A point marks one exact position on the grid.",
    es: "Un punto marca una posición exacta en la cuadrícula."}),
  "coordinate-grid": Object.freeze({en: "The x- and y-axes form a coordinate grid.",
    es: "Los ejes x e y forman una cuadrícula de coordenadas."}),
  coordinate: Object.freeze({en: "A coordinate is one number in an ordered pair, such as 3 or 4 in (3,4).",
    es: "Una coordenada es un número de un par ordenado, como 3 o 4 en (3,4)."}),
});

function VisualEmphasis({term}: {term: CourseG04L11Vb006TermId | null}) {
  if (!term) return null;
  const pointFocused = term === "point" || term === "locate"
    || term === "ordered-pair" || term === "coordinate";
  const gridFocused = term === "coordinate-grid";
  return (
    <svg
      aria-hidden="true"
      data-modern-pedagogical-emphasis={term}
      preserveAspectRatio="xMidYMid meet"
      style={{height: "100%", inset: 0, pointerEvents: "none",
        position: "absolute", width: "100%"}}
      viewBox="0 0 800 600"
    >
      {gridFocused ? <rect fill="rgb(255 225 60 / 16%)" height="400" rx="18"
        stroke="#d86d00" strokeDasharray="12 8" strokeWidth="6" width="520"
        x="140" y="90" /> : null}
      {pointFocused ? <g>
        <circle cx="400" cy="300" fill="rgb(255 45 90 / 22%)" r="54"
          stroke="#d0004b" strokeWidth="6" />
        <path d="M400 232 V368 M332 300 H468" stroke="#d0004b"
          strokeDasharray="10 8" strokeWidth="4" />
      </g> : null}
      {term === "pair" || term === "number" ? (
        <rect fill="rgb(123 54 255 / 16%)" height="80" rx="18"
          stroke="#6e24d8" strokeWidth="5" width="190" x="305" y="260" />
      ) : null}
    </svg>
  );
}

function Controls({
  dispatch,
  hostFrame,
  interaction,
  lang,
  replay,
}: {
  dispatch: React.Dispatch<CourseG04L11Vb006InteractionEvent>;
  hostFrame: number;
  interaction: CourseG04L11Vb006InteractionState;
  lang: "en" | "es";
  replay: () => void;
}) {
  const selected = getCourseG04L11Vb006SelectedTerm(interaction);
  const available = COURSE_G04_L11_VB_006_TERMS.filter((term) =>
    interaction.frame >= term.sourcePlacementFrame);
  return (
    <section
      aria-label={lang === "es" ? "Términos del par ordenado" : "Ordered-pair important words"}
      className="course-g04-l11-vb006-controls"
      data-animation-internal-control-count={available.length}
      data-legacy-course-shell-included="false"
      data-legacy-player-chrome-included="false"
      data-local-visual-frame={interaction.frame}
      data-local-visual-playing={interaction.playing ? "true" : "false"}
    >
      <header>
        <span>HELP Math 2.0</span>
        <strong>{lang === "es" ? "Par ordenado y coordenadas" : "Ordered Pair / Coordinates"}</strong>
        <p>{lang === "es"
          ? "Elige un término de la animación para pausar y explorar su significado matemático."
          : "Choose an animation term to pause locally and explore its mathematical meaning."}</p>
      </header>
      <div aria-label={lang === "es" ? "Términos disponibles" : "Available terms"} role="group">
        {available.map((term) => {
          const opacity = term.id === "coordinate"
            ? getCourseG04L11Vb006CoordinateButtonAlpha(interaction.frame) : 1;
          return <button
            aria-pressed={interaction.selectedTermId === term.id}
            data-source-button-object-id={term.sourceButtonObjectId}
            disabled={opacity < 1}
            key={term.id}
            onClick={() => dispatch({type: "select-term", termId: term.id})}
            style={{opacity}}
            type="button"
          >{term.label}</button>;
        })}
      </div>
      {selected ? (
        <div aria-live="polite" className="course-g04-l11-vb006-panel" role="status">
          <div>
            <strong>{selected.label}</strong>
            <p>{HELP[selected.id][lang]}</p>
            <small>{lang === "es"
              ? "Ayuda moderna; no afirma paridad con el glosario Flash que falta."
              : "Modern help; this does not claim parity with the missing Flash glossary."}</small>
          </div>
          <div>
            <button onClick={() => dispatch({type: "close-term"})} type="button">
              {lang === "es" ? "Cerrar" : "Close"}
            </button>
            <button onClick={() => dispatch({type: "resume", frame: hostFrame})} type="button">
              {lang === "es" ? "Continuar" : "Resume"}
            </button>
          </div>
        </div>
      ) : null}
      {!interaction.playing && !interaction.panelOpen ? (
        <button onClick={() => dispatch({type: "resume", frame: hostFrame})}
          type="button">{lang === "es" ? "Continuar animación" : "Resume animation"}</button>
      ) : null}
      <button className="course-g04-l11-vb006-replay" onClick={replay} type="button">
        {lang === "es" ? "Repetir" : "Replay"}
      </button>
    </section>
  );
}

export function createCourseG04L11Vb006OrderedPairCandidate<
  SourceContract extends object,
>(candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;

  function Renderer(props: AnimationRendererProps) {
    const interactionVisible = (props.frameDomain ?? SOURCE_DOMAIN) === SOURCE_DOMAIN
      && props.scenario === SOURCE_SCENARIO && !props.entryStateSha256;
    const [interaction, dispatch] = useReducer(
      reduceCourseG04L11Vb006Interaction,
      props.frame,
      createCourseG04L11Vb006InteractionState,
    );
    useEffect(() => {
      dispatch({type: "synchronize-frame", frame: props.frame});
    }, [props.frame]);
    useEffect(() => {
      if ((props.replay ?? 0) > 0) dispatch({type: "replay"});
    }, [props.replay]);
    const replay = () => {
      dispatch({type: "replay"});
      props.onReplay?.();
    };
    const visualFrame = interactionVisible ? interaction.frame : props.frame;
    return (
      <div
        className="course-g04-l11-vb006-candidate"
        data-authoritative-original-runtime-evidence="false"
        data-current-js-functional-candidate="true"
        data-current-js-functional-scope="source-canvas-plus-local-term-controls"
        data-registered-current-javascript="false"
        data-strict-acceptance-effect="none"
        style={{margin: "0 auto", maxWidth: candidate.movie.stage.width,
          position: "relative", width: "100%"}}
      >
        <div style={{position: "relative"}}>
          <SourceRenderer {...props} frame={visualFrame} state={undefined} />
          {interactionVisible ? <VisualEmphasis term={interaction.selectedTermId} /> : null}
        </div>
        {interactionVisible ? <Controls dispatch={dispatch} hostFrame={props.frame}
          interaction={interaction} lang={props.uiLanguage ?? props.lang}
          replay={replay} /> : null}
        <style>{`
          .course-g04-l11-vb006-candidate [data-source-replay-parity="unvalidated"] {display:none}
          .course-g04-l11-vb006-controls {background:linear-gradient(145deg,#f5fbff,#e2f1ff);border:2px solid #1d5b96;border-radius:16px;color:#17395f;display:grid;font-family:${UI_FONT};gap:14px;margin-top:12px;padding:16px}
          .course-g04-l11-vb006-controls header span {color:#0758ba;display:block;font-size:12px;font-weight:900;letter-spacing:.08em}
          .course-g04-l11-vb006-controls header strong {display:block;font-size:clamp(21px,4vw,30px);line-height:1.1;margin-top:3px}
          .course-g04-l11-vb006-controls p {font-family:system-ui,sans-serif;line-height:1.45;margin:6px 0 0}
          .course-g04-l11-vb006-controls > div[role="group"] {display:grid;gap:9px;grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}
          .course-g04-l11-vb006-controls button {background:linear-gradient(#fff8ad,#ffc72f);border:2px solid #a95000;border-radius:10px;color:#102b70;cursor:pointer;font:800 15px ${UI_FONT};min-height:46px;padding:8px 12px}
          .course-g04-l11-vb006-controls button[aria-pressed="true"] {background:#0a61bc;border-color:#063a73;color:#fff}
          .course-g04-l11-vb006-controls button:focus-visible {outline:4px solid #0758ba;outline-offset:3px}
          .course-g04-l11-vb006-panel {align-items:center;background:#fff;border:2px solid #5d8fc0;border-radius:12px;display:flex;gap:14px;justify-content:space-between;padding:14px}
          .course-g04-l11-vb006-panel small {display:block;font-family:system-ui,sans-serif;margin-top:6px}
          .course-g04-l11-vb006-panel > div:last-child {display:flex;flex-wrap:wrap;gap:8px}
          .course-g04-l11-vb006-replay {justify-self:start}
          @media(max-width:540px){.course-g04-l11-vb006-panel{align-items:stretch;flex-direction:column}.course-g04-l11-vb006-panel>div:last-child{display:grid;grid-template-columns:1fr 1fr}}
        `}</style>
      </div>
    );
  }

  const sourceContract = Object.freeze({
    ...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "source-canvas-plus-local-ordered-pair-term-controls",
    currentJavascriptFunctionalEntry: Object.freeze({
      frameDomain: SOURCE_DOMAIN,
      frame: 64,
      scenario: SOURCE_SCENARIO,
      language: "en",
      deterministicCaptureOverlayEnabled: false,
    }),
    sourceInteraction: COURSE_G04_L11_VB_006_INTERACTION_SOURCE,
    interactionAuthority: COURSE_G04_L11_VB_006_INTERACTION_AUTHORITY,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    sourceDefinitionTextParityEstablished: false,
    sourceAudioEnabled: false,
    registeredCurrentJavascript: false,
    strictAcceptanceEffect: "none",
  });
  return Object.freeze({
    Renderer,
    sourceContract,
    module: Object.freeze({...candidate.module, Renderer}),
  });
}
