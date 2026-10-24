"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {
  AnimationModule,
  AnimationRendererProps,
  MovieMetadata,
} from "../contract";
import {
  COURSE_G04_L11_VB_009_INTERACTION_AUTHORITY,
  COURSE_G04_L11_VB_009_INTERACTION_SOURCE,
  COURSE_G04_L11_VB_009_TERMS,
  createCourseG04L11Vb009PointState,
  getCourseG04L11Vb009SelectedTerm,
  reduceCourseG04L11Vb009Point,
  type CourseG04L11Vb009PointEvent,
  type CourseG04L11Vb009PointState,
  type CourseG04L11Vb009TermId,
} from "../timelines/course-g04-l11-vb-009-point-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule;
  readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}

const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-60";
const UI_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';

const SPANISH_PROMPTS: Readonly<Record<CourseG04L11Vb009TermId, string>> =
  Object.freeze({
    point: "Un punto marca una ubicación exacta en la cuadrícula.",
    location: "Una ubicación indica exactamente dónde pertenece el punto.",
    "coordinate-grid":
      "Usa el eje x horizontal y el eje y vertical para nombrar una ubicación.",
    "ordered-pair": "Lee el par ordenado en orden: primero x y después y.",
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

function PointControls({
  dispatch,
  hostFrame,
  interaction,
  lang,
  replayLocally,
}: {
  dispatch: React.Dispatch<CourseG04L11Vb009PointEvent>;
  hostFrame: number;
  interaction: CourseG04L11Vb009PointState;
  lang: "en" | "es";
  replayLocally: () => void;
}) {
  const selected = getCourseG04L11Vb009SelectedTerm(interaction);
  const selectTerm = (termId: CourseG04L11Vb009TermId) => {
    dispatch({type: "select-term", termId, frame: interaction.frame});
  };

  return (
    <section
      aria-label={lang === "es" ? "Ayuda para el punto A" : "Point A help"}
      className="course-g04-l11-vb009-point-controls"
      data-animation-internal-control-count="4"
      data-legacy-course-shell-included="false"
      data-legacy-player-chrome-included="false"
      data-local-visual-frame={interaction.frame}
      data-local-visual-playing={interaction.playing ? "true" : "false"}
      data-source-definition-parity-established="true"
      data-spanish-source-visual-parity-established="false"
    >
      <header>
        <span>HELP Math 2.0</span>
        <strong>{lang === "es" ? "Punto" : "Point"}</strong>
        <p className="course-g04-l11-vb009-definition">
          {lang === "es"
            ? "Un punto es una ubicación exacta en una cuadrícula de coordenadas, nombrada por un par ordenado."
            : "A point is an exact location on a coordinate grid, named by an ordered pair."}
        </p>
      </header>

      <ol aria-label={lang === "es" ? "Cómo ubicar el punto A" : "How to locate Point A"}>
        <li>
          <span aria-hidden="true">1</span>
          <div>
            <strong>{lang === "es" ? "Primero x" : "x first"}</strong>
            <p>{lang === "es" ? "Muévete 4 unidades a la derecha." : "Move 4 units right."}</p>
          </div>
        </li>
        <li>
          <span aria-hidden="true">2</span>
          <div>
            <strong>{lang === "es" ? "Después y" : "then y"}</strong>
            <p>{lang === "es" ? "Sube 3 unidades." : "Move 3 units up."}</p>
          </div>
        </li>
        <li className="course-g04-l11-vb009-result">
          <span aria-hidden="true">●</span>
          <div>
            <strong>Point A</strong>
            <p>(4,3)</p>
          </div>
        </li>
      </ol>

      <div aria-label={lang === "es" ? "Términos matemáticos" : "Math terms"} role="group">
        {COURSE_G04_L11_VB_009_TERMS.map((term) => (
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
        <div aria-live="polite" className="course-g04-l11-vb009-term-panel" role="status">
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
          className="course-g04-l11-vb009-resume"
          onClick={() => dispatch({type: "resume", frame: hostFrame})}
          type="button"
        >
          {lang === "es" ? "Continuar animación" : "Resume animation"}
        </button>
      ) : null}

      <button
        className="course-g04-l11-vb009-replay"
        onClick={replayLocally}
        type="button"
      >
        {lang === "es" ? "Repetir" : "Replay"}
      </button>
    </section>
  );
}

export function createCourseG04L11Vb009PointCandidate<
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
      reduceCourseG04L11Vb009Point,
      props.frame,
      createCourseG04L11Vb009PointState,
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
        className="course-g04-l11-vb009-point-candidate"
        data-authoritative-original-runtime-evidence="false"
        data-current-js-functional-candidate="true"
        data-current-js-functional-scope="source-canvas-sequence-and-four-local-glossary-controls"
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
            <PointControls
              dispatch={dispatch}
              hostFrame={props.frame}
              interaction={interaction}
              lang={props.uiLanguage ?? props.lang}
              replayLocally={replayLocally}
            />
          </PageCompanionPortal>
        ) : null}
        <style>{`
          .course-g04-l11-vb009-point-candidate [data-source-replay-parity="unvalidated"] {
            display: none;
          }
          .course-g04-l11-vb009-point-controls {
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
          .course-g04-l11-vb009-point-controls header span {
            color: #0758ba;
            display: block;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: .08em;
          }
          .course-g04-l11-vb009-point-controls header strong {
            display: block;
            font-size: clamp(23px, 4vw, 32px);
            line-height: 1.1;
            margin-top: 3px;
          }
          .course-g04-l11-vb009-point-controls p {
            font-family: system-ui, sans-serif;
            line-height: 1.45;
            margin: 5px 0 0;
          }
          .course-g04-l11-vb009-point-controls > ol {
            display: grid;
            gap: 10px;
            grid-template-columns: repeat(3, 1fr);
            list-style: none;
            margin: 0;
            padding: 0;
          }
          .course-g04-l11-vb009-point-controls > ol > li {
            align-items: center;
            background: white;
            border: 2px solid #75a6d5;
            border-radius: 14px;
            display: flex;
            gap: 10px;
            min-height: 72px;
            padding: 10px;
          }
          .course-g04-l11-vb009-point-controls > ol > li > span {
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
          .course-g04-l11-vb009-result > span {background: #1477d3 !important; color: white !important;}
          .course-g04-l11-vb009-point-controls > div[role="group"] {
            display: grid;
            gap: 9px;
            grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
          }
          .course-g04-l11-vb009-point-controls button {
            background: linear-gradient(#fff8ad, #ffc72f);
            border: 2px solid #a95000;
            border-radius: 11px;
            color: #102b70;
            cursor: pointer;
            font: 800 16px ${UI_FONT};
            min-height: 48px;
            padding: 9px 13px;
          }
          .course-g04-l11-vb009-point-controls button[aria-pressed="true"] {
            background: #0a61bc;
            border-color: #063a73;
            color: white;
          }
          .course-g04-l11-vb009-point-controls button:focus-visible {
            outline: 4px solid #0758ba;
            outline-offset: 3px;
          }
          .course-g04-l11-vb009-term-panel {
            align-items: center;
            background: white;
            border: 2px solid #5d8fc0;
            border-radius: 13px;
            display: flex;
            gap: 14px;
            justify-content: space-between;
            padding: 14px;
          }
          .course-g04-l11-vb009-term-panel > div:last-child {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .course-g04-l11-vb009-replay {justify-self: start;}
          @media (max-width: 600px) {
            .course-g04-l11-vb009-point-controls > ol {grid-template-columns: 1fr;}
            .course-g04-l11-vb009-term-panel {align-items: stretch; flex-direction: column;}
            .course-g04-l11-vb009-term-panel > div:last-child {display: grid; grid-template-columns: 1fr 1fr;}
          }
        `}</style>
      </div>
    );
  }

  const sourceContract = Object.freeze({
    ...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "source-canvas-sequence-and-four-local-glossary-controls-functional-candidate",
    currentJavascriptFunctionalEntry: Object.freeze({
      frameDomain: SOURCE_DOMAIN,
      frame: 1,
      scenario: SOURCE_SCENARIO,
      language: "en",
      deterministicCaptureOverlayEnabled: false,
    }),
    sourceInteraction: COURSE_G04_L11_VB_009_INTERACTION_SOURCE,
    interactionAuthority: COURSE_G04_L11_VB_009_INTERACTION_AUTHORITY,
    sourceDefinitionTextDisplayed: true,
    pointAProjectionInstructionDisplayed: true,
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
