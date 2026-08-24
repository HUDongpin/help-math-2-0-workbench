"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {
  AnimationModule,
  AnimationRendererProps,
  MovieMetadata,
} from "../contract";
import {
  COURSE_G04_L11_IN_002_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_002_INTERACTION_SOURCE,
  COURSE_G04_L11_IN_002_TERMS,
  createCourseG04L11In002CoordinateGridState,
  getCourseG04L11In002SelectedTerm,
  reduceCourseG04L11In002CoordinateGrid,
  type CourseG04L11In002CoordinateGridEvent,
  type CourseG04L11In002CoordinateGridState,
  type CourseG04L11In002TermId,
} from "../timelines/course-g04-l11-in-002-coordinate-grid-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule;
  readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}

const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-80";
const UI_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';

const SPANISH_LABELS: Readonly<Record<CourseG04L11In002TermId, string>> =
  Object.freeze({
    "coordinate-grid": "Cuadrícula de coordenadas",
    grid: "Cuadrícula",
    form: "Formar",
    intersect: "Intersecar",
    "number-line": "Recta numérica",
    horizontal: "Horizontal",
    "x-axis": "Eje x",
    vertical: "Vertical",
    "y-axis": "Eje y",
  });

const SPANISH_PROMPTS: Readonly<Record<CourseG04L11In002TermId, string>> =
  Object.freeze({
    "coordinate-grid":
      "Una cuadrícula de coordenadas se forma con un eje x horizontal y un eje y vertical.",
    grid:
      "Una cuadrícula es un patrón de líneas horizontales y verticales igualmente espaciadas.",
    form: "Formar significa hacer o crear algo.",
    intersect: "Dos líneas se intersecan cuando se cruzan en el mismo punto.",
    "number-line":
      "Una recta numérica coloca los números en orden y a distancias iguales.",
    horizontal: "Horizontal significa de izquierda a derecha, como el eje x.",
    "x-axis": "El eje x es la recta numérica horizontal de la cuadrícula.",
    vertical: "Vertical significa de arriba abajo, como el eje y.",
    "y-axis": "El eje y es la recta numérica vertical de la cuadrícula.",
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

function CoordinateGridControls({
  dispatch,
  hostFrame,
  interaction,
  lang,
  replayLocally,
}: {
  dispatch: React.Dispatch<CourseG04L11In002CoordinateGridEvent>;
  hostFrame: number;
  interaction: CourseG04L11In002CoordinateGridState;
  lang: "en" | "es";
  replayLocally: () => void;
}) {
  const selected = getCourseG04L11In002SelectedTerm(interaction);
  const selectTerm = (termId: CourseG04L11In002TermId) => {
    dispatch({type: "select-term", termId, frame: interaction.frame});
  };
  const points = COURSE_G04_L11_IN_002_INTERACTION_SOURCE.points;

  return (
    <section
      aria-label={lang === "es"
        ? "Ayuda para la cuadrícula de coordenadas"
        : "Coordinate grid help"}
      className="course-g04-l11-in002-coordinate-grid-controls"
      data-animation-internal-control-count="9"
      data-legacy-course-shell-included="false"
      data-legacy-player-chrome-included="false"
      data-local-visual-frame={interaction.frame}
      data-local-visual-playing={interaction.playing ? "true" : "false"}
      data-source-definition-parity-established="true"
      data-spanish-source-visual-parity-established="false"
    >
      <header>
        <span>HELP Math 2.0</span>
        <strong>{lang === "es" ? "Cuadrícula de coordenadas" : "Coordinate Grid"}</strong>
        <p>
          {lang === "es"
            ? "Una cuadrícula de coordenadas es una cuadrícula formada por dos rectas numéricas que se intersecan: el eje x horizontal y el eje y vertical."
            : COURSE_G04_L11_IN_002_INTERACTION_SOURCE.definition}
        </p>
      </header>

      <div className="course-g04-l11-in002-rule-card">
        <div aria-label={lang === "es" ? "Regla de la función" : "Function rule"}>
          <span>{lang === "es" ? "Regla" : "Rule"}</span>
          <strong>y = x + 4</strong>
          <p>
            {lang === "es"
              ? "Suma 4 a cada valor de x para encontrar y."
              : "Add 4 to each x-value to find y."}
          </p>
        </div>
        <table aria-label={lang === "es" ? "Puntos trazados" : "Plotted points"}>
          <thead><tr><th scope="col">x</th><th scope="col">y</th><th scope="col">
            {lang === "es" ? "Punto" : "Point"}
          </th></tr></thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.orderedPair}>
                <td>{point.x}</td><td>{point.y}</td><td>{point.orderedPair}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ol aria-label={lang === "es" ? "Cómo trazar un punto" : "How to plot a point"}>
        <li>
          <span aria-hidden="true">1</span>
          <div>
            <strong>{lang === "es" ? "Lee x" : "Read x"}</strong>
            <p>{lang === "es" ? "Muévete por el eje horizontal." : "Move along the horizontal axis."}</p>
          </div>
        </li>
        <li>
          <span aria-hidden="true">2</span>
          <div>
            <strong>{lang === "es" ? "Calcula y" : "Find y"}</strong>
            <p>{lang === "es" ? "Usa y = x + 4." : "Use y = x + 4."}</p>
          </div>
        </li>
        <li>
          <span aria-hidden="true">3</span>
          <div>
            <strong>{lang === "es" ? "Traza el punto" : "Plot the point"}</strong>
            <p>{lang === "es" ? "Sube hasta el valor de y." : "Move up to the y-value."}</p>
          </div>
        </li>
      </ol>

      <div aria-label={lang === "es" ? "Términos matemáticos" : "Math terms"} role="group">
        {COURSE_G04_L11_IN_002_TERMS.map((term) => (
          <button
            aria-pressed={interaction.selectedTermId === term.id}
            data-source-button-object-id={term.sourceButtonObjectId}
            data-source-key-attribute={term.sourceKeyAttribute}
            key={term.id}
            onClick={() => selectTerm(term.id)}
            type="button"
          >
            {lang === "es" ? SPANISH_LABELS[term.id] : term.label}
          </button>
        ))}
      </div>

      {selected ? (
        <div aria-live="polite" className="course-g04-l11-in002-term-panel" role="status">
          <div>
            <strong>{lang === "es" ? SPANISH_LABELS[selected.id] : selected.label}</strong>
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
          className="course-g04-l11-in002-resume"
          onClick={() => dispatch({type: "resume", frame: hostFrame})}
          type="button"
        >
          {lang === "es" ? "Continuar animación" : "Resume animation"}
        </button>
      ) : null}

      <button
        className="course-g04-l11-in002-replay"
        onClick={replayLocally}
        type="button"
      >
        {lang === "es" ? "Repetir" : "Replay"}
      </button>
    </section>
  );
}

export function createCourseG04L11In002CoordinateGridCandidate<
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
      reduceCourseG04L11In002CoordinateGrid,
      props.frame,
      createCourseG04L11In002CoordinateGridState,
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
        className="course-g04-l11-in002-coordinate-grid-candidate"
        data-authoritative-original-runtime-evidence="false"
        data-current-js-functional-candidate="true"
        data-current-js-functional-scope="source-canvas-sequence-and-nine-local-glossary-controls"
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
            <CoordinateGridControls
              dispatch={dispatch}
              hostFrame={props.frame}
              interaction={interaction}
              lang={props.uiLanguage ?? props.lang}
              replayLocally={replayLocally}
            />
          </PageCompanionPortal>
        ) : null}
        <style>{`
          .course-g04-l11-in002-coordinate-grid-candidate [data-source-replay-parity="unvalidated"] {display: none;}
          .course-g04-l11-in002-coordinate-grid-controls {
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
          .course-g04-l11-in002-coordinate-grid-controls header span,
          .course-g04-l11-in002-rule-card > div > span {
            color: #0758ba;
            display: block;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: .08em;
            text-transform: uppercase;
          }
          .course-g04-l11-in002-coordinate-grid-controls header strong {
            display: block;
            font-size: clamp(23px, 4vw, 32px);
            line-height: 1.1;
            margin-top: 3px;
          }
          .course-g04-l11-in002-coordinate-grid-controls p {
            font-family: system-ui, sans-serif;
            line-height: 1.45;
            margin: 5px 0 0;
          }
          .course-g04-l11-in002-rule-card {
            display: grid;
            gap: 12px;
            grid-template-columns: minmax(0, 1fr) minmax(230px, .8fr);
          }
          .course-g04-l11-in002-rule-card > div,
          .course-g04-l11-in002-rule-card table {
            background: white;
            border: 2px solid #75a6d5;
            border-radius: 14px;
            padding: 12px;
          }
          .course-g04-l11-in002-rule-card > div > strong {
            color: #8b3100;
            display: block;
            font-size: clamp(26px, 5vw, 40px);
            margin-top: 4px;
          }
          .course-g04-l11-in002-rule-card table {
            border-collapse: separate;
            border-spacing: 0;
            font-family: system-ui, sans-serif;
            text-align: center;
            width: 100%;
          }
          .course-g04-l11-in002-rule-card th,
          .course-g04-l11-in002-rule-card td {border-bottom: 1px solid #b7d2ea; padding: 5px 8px;}
          .course-g04-l11-in002-rule-card tbody tr:last-child td {border-bottom: 0;}
          .course-g04-l11-in002-coordinate-grid-controls > ol {
            display: grid;
            gap: 10px;
            grid-template-columns: repeat(3, 1fr);
            list-style: none;
            margin: 0;
            padding: 0;
          }
          .course-g04-l11-in002-coordinate-grid-controls > ol > li {
            align-items: center;
            background: white;
            border: 2px solid #75a6d5;
            border-radius: 14px;
            display: flex;
            gap: 10px;
            min-height: 72px;
            padding: 10px;
          }
          .course-g04-l11-in002-coordinate-grid-controls > ol > li > span {
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
          .course-g04-l11-in002-coordinate-grid-controls > div[role="group"] {
            display: grid;
            gap: 9px;
            grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
          }
          .course-g04-l11-in002-coordinate-grid-controls button {
            background: linear-gradient(#fff8ad, #ffc72f);
            border: 2px solid #a95000;
            border-radius: 11px;
            color: #102b70;
            cursor: pointer;
            font: 800 15px ${UI_FONT};
            min-height: 48px;
            padding: 9px 11px;
          }
          .course-g04-l11-in002-coordinate-grid-controls button[aria-pressed="true"] {
            background: #0a61bc;
            border-color: #063a73;
            color: white;
          }
          .course-g04-l11-in002-coordinate-grid-controls button:focus-visible {
            outline: 4px solid #0758ba;
            outline-offset: 3px;
          }
          .course-g04-l11-in002-term-panel {
            align-items: center;
            background: white;
            border: 2px solid #5d8fc0;
            border-radius: 13px;
            display: flex;
            gap: 14px;
            justify-content: space-between;
            padding: 14px;
          }
          .course-g04-l11-in002-term-panel > div:last-child {display: flex; flex-wrap: wrap; gap: 8px;}
          .course-g04-l11-in002-replay {justify-self: start;}
          @media (max-width: 600px) {
            .course-g04-l11-in002-rule-card,
            .course-g04-l11-in002-coordinate-grid-controls > ol {grid-template-columns: 1fr;}
            .course-g04-l11-in002-term-panel {align-items: stretch; flex-direction: column;}
            .course-g04-l11-in002-term-panel > div:last-child {display: grid; grid-template-columns: 1fr 1fr;}
          }
        `}</style>
      </div>
    );
  }

  const sourceContract = Object.freeze({
    ...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "source-canvas-sequence-and-nine-local-glossary-controls-functional-candidate",
    currentJavascriptFunctionalEntry: Object.freeze({
      frameDomain: SOURCE_DOMAIN,
      frame: 1,
      scenario: SOURCE_SCENARIO,
      language: "en",
      deterministicCaptureOverlayEnabled: false,
    }),
    sourceInteraction: COURSE_G04_L11_IN_002_INTERACTION_SOURCE,
    interactionAuthority: COURSE_G04_L11_IN_002_INTERACTION_AUTHORITY,
    sourceDefinitionTextDisplayed: true,
    functionRuleAndFourPointsDisplayed: true,
    sourceTerminalBehaviorEstablished: false,
    modernLocalReplayProvided: true,
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
