"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {
  AnimationModule,
  AnimationRendererProps,
  MovieMetadata,
} from "../contract";
import {
  COURSE_G04_L11_VB_008_INTERACTION_AUTHORITY,
  COURSE_G04_L11_VB_008_INTERACTION_SOURCE,
  COURSE_G04_L11_VB_008_TERMS,
  createCourseG04L11Vb008PlotState,
  getCourseG04L11Vb008SelectedTerm,
  reduceCourseG04L11Vb008Plot,
  type CourseG04L11Vb008PlotEvent,
  type CourseG04L11Vb008PlotState,
  type CourseG04L11Vb008TermId,
} from "../timelines/course-g04-l11-vb-008-plot-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule;
  readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}

const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-41";
const UI_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';

const SPANISH_PROMPTS: Readonly<Record<CourseG04L11Vb008TermId, string>> =
  Object.freeze({
    plot: "Ubica un punto en la cuadrícula siguiendo su par ordenado.",
    locate: "Encuentra la posición exacta donde pertenece el par ordenado.",
    point: "Un punto marca una ubicación exacta en la cuadrícula.",
    "coordinate-grid":
      "El eje x horizontal y el eje y vertical forman la cuadrícula de coordenadas.",
    "ordered-pair": "Lee el par ordenado en orden: primero x y después y.",
    coordinate: "Cada coordenada indica cuánto moverse sobre un eje.",
  });

function PageCompanionPortal({
  children,
  targetId,
}: {
  children: React.ReactNode;
  targetId?: string;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  useEffect(() => {
    if (!targetId) {
      setTarget(null);
      setResolvedId(null);
      return;
    }
    setTarget(document.getElementById(targetId));
    setResolvedId(targetId);
  }, [targetId]);

  if (!targetId) return children;
  if (resolvedId !== targetId) return null;
  return target ? createPortal(children, target) : children;
}

function PlotControls({
  dispatch,
  hostFrame,
  interaction,
  lang,
  replayLocally,
}: {
  dispatch: React.Dispatch<CourseG04L11Vb008PlotEvent>;
  hostFrame: number;
  interaction: CourseG04L11Vb008PlotState;
  lang: "en" | "es";
  replayLocally: () => void;
}) {
  const selected = getCourseG04L11Vb008SelectedTerm(interaction);
  const selectTerm = (termId: CourseG04L11Vb008TermId) => {
    dispatch({type: "select-term", termId, frame: interaction.frame});
  };

  return (
    <section
      aria-label={lang === "es" ? "Ayuda para representar puntos" : "Plotting help"}
      className="course-g04-l11-vb008-plot-controls"
      data-animation-internal-control-count="6"
      data-legacy-course-shell-included="false"
      data-legacy-player-chrome-included="false"
      data-local-visual-frame={interaction.frame}
      data-local-visual-playing={interaction.playing ? "true" : "false"}
      data-source-definition-parity-established="true"
      data-spanish-source-visual-parity-established="false"
    >
      <header>
        <span>HELP Math 2.0</span>
        <strong>{lang === "es" ? "Representación gráfica" : "Plot"}</strong>
        <p className="course-g04-l11-vb008-definition">
          {lang === "es"
            ? "Representar significa ubicar puntos en una cuadrícula de coordenadas usando pares ordenados o coordenadas."
            : "Plot means to locate points on a coordinate grid using ordered pairs or coordinates."}
        </p>
      </header>

      <ol aria-label={lang === "es" ? "Orden para ubicar uno coma dos" : "How to plot one comma two"}>
        <li>
          <span aria-hidden="true">1</span>
          <div>
            <strong>{lang === "es" ? "Primero x" : "x first"}</strong>
            <p>{lang === "es" ? "Muévete 1 unidad a la derecha." : "Move 1 unit right."}</p>
          </div>
        </li>
        <li>
          <span aria-hidden="true">2</span>
          <div>
            <strong>{lang === "es" ? "Después y" : "then y"}</strong>
            <p>{lang === "es" ? "Sube 2 unidades." : "Move 2 units up."}</p>
          </div>
        </li>
        <li className="course-g04-l11-vb008-result">
          <span aria-hidden="true">●</span>
          <div>
            <strong>{lang === "es" ? "Punto" : "Point"}</strong>
            <p>(1,2)</p>
          </div>
        </li>
      </ol>

      <div aria-label={lang === "es" ? "Términos matemáticos" : "Math terms"} role="group">
        {COURSE_G04_L11_VB_008_TERMS.map((term) => (
          <button
            aria-pressed={interaction.selectedTermId === term.id}
            data-source-button-object-id={term.sourceButtonObjectId}
            data-source-key-attribute={term.sourceKeyAttribute}
            key={term.id}
            onClick={() => selectTerm(term.id)}
            type="button"
          >
            {term.label}
          </button>
        ))}
      </div>

      {selected ? (
        <div aria-live="polite" className="course-g04-l11-vb008-term-panel" role="status">
          <div>
            <strong>{selected.label}</strong>
            <p>{lang === "es" ? SPANISH_PROMPTS[selected.id] : selected.modernPedagogicalPrompt}</p>
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
        <button
          className="course-g04-l11-vb008-resume"
          onClick={() => dispatch({type: "resume", frame: hostFrame})}
          type="button"
        >
          {lang === "es" ? "Continuar animación" : "Resume animation"}
        </button>
      ) : null}

      <button
        className="course-g04-l11-vb008-replay"
        onClick={replayLocally}
        type="button"
      >
        {lang === "es" ? "Repetir" : "Replay"}
      </button>
    </section>
  );
}

export function createCourseG04L11Vb008PlotCandidate<
  SourceContract extends object,
>(candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;

  function Renderer(props: AnimationRendererProps) {
    const frameDomain = props.frameDomain ?? SOURCE_DOMAIN;
    const deterministicCapture = Boolean(props.entryStateSha256);
    const interactionVisible = frameDomain === SOURCE_DOMAIN
      && props.scenario === SOURCE_SCENARIO
      && !deterministicCapture;
    const [interaction, dispatch] = useReducer(
      reduceCourseG04L11Vb008Plot,
      props.frame,
      createCourseG04L11Vb008PlotState,
    );
    useEffect(() => {
      dispatch({type: "synchronize-frame", frame: props.frame});
    }, [props.frame]);
    useEffect(() => {
      if ((props.replay ?? 0) > 0) dispatch({type: "replay"});
    }, [props.replay]);
    const replayLocally = () => {
      dispatch({type: "replay"});
      props.onReplay?.();
    };
    const visualFrame = interactionVisible ? interaction.frame : props.frame;

    return (
      <div
        className="course-g04-l11-vb008-plot-candidate"
        data-authoritative-original-runtime-evidence="false"
        data-current-js-functional-candidate="true"
        data-current-js-functional-scope="source-canvas-sequence-and-six-local-glossary-controls"
        data-legacy-course-shell-included="false"
        data-legacy-player-chrome-included="false"
        data-owner-accepted="false"
        data-registered-current-javascript="false"
        data-strict-acceptance-effect="none"
        data-strict-migration-complete="false"
        style={{margin: "0 auto", maxWidth: candidate.movie.stage.width, position: "relative", width: "100%"}}
      >
        <SourceRenderer {...props} frame={visualFrame} state={undefined} />
        {interactionVisible ? (
          <PageCompanionPortal targetId={props.pageInteractionCompanionTargetId}>
            <PlotControls
              dispatch={dispatch}
              hostFrame={props.frame}
              interaction={interaction}
              lang={props.uiLanguage ?? props.lang}
              replayLocally={replayLocally}
            />
          </PageCompanionPortal>
        ) : null}
        <style>{`
          .course-g04-l11-vb008-plot-candidate [data-source-replay-parity="unvalidated"] {
            display: none;
          }
          .course-g04-l11-vb008-plot-controls {
            background: linear-gradient(145deg, #f5fbff, #e2f4ff);
            border: 2px solid #2168a7;
            border-radius: 18px;
            box-sizing: border-box;
            color: #17395f;
            display: grid;
            font-family: ${UI_FONT};
            gap: 14px;
            margin-top: 12px;
            padding: 16px;
            width: 100%;
          }
          .course-g04-l11-vb008-plot-controls header span {
            color: #0758ba;
            display: block;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: .08em;
          }
          .course-g04-l11-vb008-plot-controls header strong {
            display: block;
            font-size: clamp(23px, 4vw, 32px);
            line-height: 1.1;
            margin-top: 3px;
          }
          .course-g04-l11-vb008-plot-controls p {
            font-family: system-ui, sans-serif;
            line-height: 1.45;
            margin: 5px 0 0;
          }
          .course-g04-l11-vb008-plot-controls > ol {
            display: grid;
            gap: 10px;
            grid-template-columns: repeat(3, 1fr);
            list-style: none;
            margin: 0;
            padding: 0;
          }
          .course-g04-l11-vb008-plot-controls > ol > li {
            align-items: center;
            background: white;
            border: 2px solid #75a6d5;
            border-radius: 14px;
            display: flex;
            gap: 10px;
            min-height: 72px;
            padding: 10px;
          }
          .course-g04-l11-vb008-plot-controls > ol > li > span {
            align-items: center;
            background: #ffcc38;
            border: 2px solid #9b5800;
            border-radius: 999px;
            color: #17395f;
            display: flex;
            flex: 0 0 34px;
            font-size: 18px;
            height: 34px;
            justify-content: center;
          }
          .course-g04-l11-vb008-result > span {background: #1477d3 !important; color: white !important;}
          .course-g04-l11-vb008-plot-controls > div[role="group"] {
            display: grid;
            gap: 9px;
            grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
          }
          .course-g04-l11-vb008-plot-controls button {
            background: linear-gradient(#fff8ad, #ffc72f);
            border: 2px solid #a95000;
            border-radius: 11px;
            color: #102b70;
            cursor: pointer;
            font: 800 16px ${UI_FONT};
            min-height: 48px;
            padding: 9px 13px;
          }
          .course-g04-l11-vb008-plot-controls button[aria-pressed="true"] {
            background: #0a61bc;
            border-color: #063a73;
            color: white;
          }
          .course-g04-l11-vb008-plot-controls button:focus-visible {
            outline: 4px solid #0758ba;
            outline-offset: 3px;
          }
          .course-g04-l11-vb008-term-panel {
            align-items: center;
            background: white;
            border: 2px solid #5d8fc0;
            border-radius: 13px;
            display: flex;
            gap: 14px;
            justify-content: space-between;
            padding: 14px;
          }
          .course-g04-l11-vb008-term-panel > div:last-child {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .course-g04-l11-vb008-replay {justify-self: start;}
          @media (max-width: 600px) {
            .course-g04-l11-vb008-plot-controls > ol {grid-template-columns: 1fr;}
            .course-g04-l11-vb008-term-panel {align-items: stretch; flex-direction: column;}
            .course-g04-l11-vb008-term-panel > div:last-child {display: grid; grid-template-columns: 1fr 1fr;}
          }
        `}</style>
      </div>
    );
  }

  const sourceContract = Object.freeze({
    ...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "source-canvas-sequence-and-six-local-glossary-controls-functional-candidate",
    currentJavascriptFunctionalEntry: Object.freeze({
      frameDomain: SOURCE_DOMAIN,
      frame: 1,
      scenario: SOURCE_SCENARIO,
      language: "en",
      deterministicCaptureOverlayEnabled: false,
    }),
    sourceInteraction: COURSE_G04_L11_VB_008_INTERACTION_SOURCE,
    interactionAuthority: COURSE_G04_L11_VB_008_INTERACTION_AUTHORITY,
    sourceDefinitionTextDisplayed: true,
    orderedXThenYInstructionDisplayed: true,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    registeredCurrentJavascript: false,
    sourceHostPauseParityEstablished: false,
    sourceAudioAccepted: false,
    spanishSourceVisualParityEstablished: false,
    behaviorParityEstablished: false,
    strictAcceptanceEffect: "none",
  });

  const module = Object.freeze({...candidate.module, Renderer});
  return Object.freeze({Renderer, module, sourceContract});
}
