"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {
  AnimationModule,
  AnimationRendererProps,
  MovieMetadata,
} from "../contract";
import {
  COURSE_G04_L11_IN_003_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_003_INTERACTION_SOURCE,
  COURSE_G04_L11_IN_003_TERMS,
  createCourseG04L11In003OrderedPairState,
  getCourseG04L11In003SelectedTerm,
  reduceCourseG04L11In003OrderedPair,
  type CourseG04L11In003OrderedPairEvent,
  type CourseG04L11In003OrderedPairState,
  type CourseG04L11In003TermId,
} from "../timelines/course-g04-l11-in-003-ordered-pair-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule;
  readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}

const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-109";
const UI_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';

const SPANISH_LABELS: Readonly<Record<CourseG04L11In003TermId, string>> =
  Object.freeze({
    locate: "Localizar",
    "ordered-pair": "Par ordenado",
    "coordinate-grid": "Cuadrícula de coordenadas",
    pair: "Par",
    number: "Número",
    point: "Punto",
  });

const SPANISH_PROMPTS: Readonly<Record<CourseG04L11In003TermId, string>> =
  Object.freeze({
    locate:
      "Localizar un punto significa identificar su posición exacta en la cuadrícula.",
    "ordered-pair":
      "Un par ordenado da primero la coordenada x y después la coordenada y.",
    "coordinate-grid":
      "Una cuadrícula de coordenadas usa un eje x horizontal y un eje y vertical para localizar puntos.",
    pair: "Un par es un grupo de dos valores considerados juntos.",
    number: "Un número indica una cantidad o una posición.",
    point: "Un punto marca una posición exacta en la cuadrícula.",
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

function OrderedPairControls({
  dispatch,
  hostFrame,
  interaction,
  lang,
  replayLocally,
}: {
  dispatch: React.Dispatch<CourseG04L11In003OrderedPairEvent>;
  hostFrame: number;
  interaction: CourseG04L11In003OrderedPairState;
  lang: "en" | "es";
  replayLocally: () => void;
}) {
  const selected = getCourseG04L11In003SelectedTerm(interaction);
  const selectTerm = (termId: CourseG04L11In003TermId) => {
    dispatch({type: "select-term", termId, frame: interaction.frame});
  };
  const points = COURSE_G04_L11_IN_003_INTERACTION_SOURCE.points;

  return (
    <section
      aria-label={lang === "es"
        ? "Ayuda para localizar puntos"
        : "Ordered pair help"}
      className="course-g04-l11-in003-ordered-pair-controls"
      data-animation-internal-control-count="6"
      data-legacy-course-shell-included="false"
      data-legacy-player-chrome-included="false"
      data-local-visual-frame={interaction.frame}
      data-local-visual-playing={interaction.playing ? "true" : "false"}
      data-source-definition-parity-established="true"
      data-source-next-ordered-pair-click-parity-established="false"
      data-spanish-source-visual-parity-established="false"
    >
      <header>
        <span>HELP Math 2.0</span>
        <strong>{lang === "es"
          ? "Localizar puntos en una cuadrícula de coordenadas"
          : "Locate Points on a Coordinate Grid"}</strong>
        <p>
          {lang === "es"
            ? "Un par ordenado es un par de números que se usa para localizar un punto en una cuadrícula de coordenadas."
            : COURSE_G04_L11_IN_003_INTERACTION_SOURCE.definition}
        </p>
      </header>

      <div className="course-g04-l11-in003-rule-card">
        <div aria-label={lang === "es" ? "Orden para trazar" : "Plotting order"}>
          <span>{lang === "es" ? "Orden" : "Order"}</span>
          <strong>x → y</strong>
          <p>
            {lang === "es"
              ? "Muévete primero por x y después por y."
              : "Move along x first, then move along y."}
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
            <strong>{lang === "es" ? "Lee y" : "Read y"}</strong>
            <p>{lang === "es" ? "Muévete verticalmente." : "Move vertically."}</p>
          </div>
        </li>
        <li>
          <span aria-hidden="true">3</span>
          <div>
            <strong>{lang === "es" ? "Traza el punto" : "Plot the point"}</strong>
            <p>{lang === "es" ? "Marca la ubicación exacta." : "Mark the exact location."}</p>
          </div>
        </li>
      </ol>

      <div aria-label={lang === "es" ? "Términos matemáticos" : "Math terms"} role="group">
        {COURSE_G04_L11_IN_003_TERMS.map((term) => (
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
        <div aria-live="polite" className="course-g04-l11-in003-term-panel" role="status">
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
          className="course-g04-l11-in003-resume"
          onClick={() => dispatch({type: "resume", frame: hostFrame})}
          type="button"
        >
          {lang === "es" ? "Continuar animación" : "Resume animation"}
        </button>
      ) : null}

      <button
        className="course-g04-l11-in003-replay"
        onClick={replayLocally}
        type="button"
      >
        {lang === "es" ? "Repetir" : "Replay"}
      </button>
    </section>
  );
}

export function createCourseG04L11In003OrderedPairCandidate<
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
      reduceCourseG04L11In003OrderedPair,
      props.frame,
      createCourseG04L11In003OrderedPairState,
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
        className="course-g04-l11-in003-ordered-pair-candidate"
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
            <OrderedPairControls
              dispatch={dispatch}
              hostFrame={props.frame}
              interaction={interaction}
              lang={props.uiLanguage ?? props.lang}
              replayLocally={replayLocally}
            />
          </PageCompanionPortal>
        ) : null}
        <style>{`
          .course-g04-l11-in003-ordered-pair-candidate [data-source-replay-parity="unvalidated"] {display: none;}
          .course-g04-l11-in003-ordered-pair-controls {
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
          .course-g04-l11-in003-ordered-pair-controls header span,
          .course-g04-l11-in003-rule-card > div > span {
            color: #0758ba;
            display: block;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: .08em;
            text-transform: uppercase;
          }
          .course-g04-l11-in003-ordered-pair-controls header strong {
            display: block;
            font-size: clamp(23px, 4vw, 32px);
            line-height: 1.1;
            margin-top: 3px;
          }
          .course-g04-l11-in003-ordered-pair-controls p {
            font-family: system-ui, sans-serif;
            line-height: 1.45;
            margin: 5px 0 0;
          }
          .course-g04-l11-in003-rule-card {
            display: grid;
            gap: 12px;
            grid-template-columns: minmax(0, 1fr) minmax(230px, .8fr);
          }
          .course-g04-l11-in003-rule-card > div,
          .course-g04-l11-in003-rule-card table {
            background: white;
            border: 2px solid #75a6d5;
            border-radius: 14px;
            padding: 12px;
          }
          .course-g04-l11-in003-rule-card > div > strong {
            color: #8b3100;
            display: block;
            font-size: clamp(26px, 5vw, 40px);
            margin-top: 4px;
          }
          .course-g04-l11-in003-rule-card table {
            border-collapse: separate;
            border-spacing: 0;
            font-family: system-ui, sans-serif;
            text-align: center;
            width: 100%;
          }
          .course-g04-l11-in003-rule-card th,
          .course-g04-l11-in003-rule-card td {border-bottom: 1px solid #b7d2ea; padding: 5px 8px;}
          .course-g04-l11-in003-rule-card tbody tr:last-child td {border-bottom: 0;}
          .course-g04-l11-in003-ordered-pair-controls > ol {
            display: grid;
            gap: 10px;
            grid-template-columns: repeat(3, 1fr);
            list-style: none;
            margin: 0;
            padding: 0;
          }
          .course-g04-l11-in003-ordered-pair-controls > ol > li {
            align-items: center;
            background: white;
            border: 2px solid #75a6d5;
            border-radius: 14px;
            display: flex;
            gap: 10px;
            min-height: 72px;
            padding: 10px;
          }
          .course-g04-l11-in003-ordered-pair-controls > ol > li > span {
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
          .course-g04-l11-in003-ordered-pair-controls > div[role="group"] {
            display: grid;
            gap: 9px;
            grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
          }
          .course-g04-l11-in003-ordered-pair-controls button {
            background: linear-gradient(#fff8ad, #ffc72f);
            border: 2px solid #a95000;
            border-radius: 11px;
            color: #102b70;
            cursor: pointer;
            font: 800 15px ${UI_FONT};
            min-height: 48px;
            padding: 9px 11px;
          }
          .course-g04-l11-in003-ordered-pair-controls button[aria-pressed="true"] {
            background: #0a61bc;
            border-color: #063a73;
            color: white;
          }
          .course-g04-l11-in003-ordered-pair-controls button:focus-visible {
            outline: 4px solid #0758ba;
            outline-offset: 3px;
          }
          .course-g04-l11-in003-term-panel {
            align-items: center;
            background: white;
            border: 2px solid #5d8fc0;
            border-radius: 13px;
            display: flex;
            gap: 14px;
            justify-content: space-between;
            padding: 14px;
          }
          .course-g04-l11-in003-term-panel > div:last-child {display: flex; flex-wrap: wrap; gap: 8px;}
          .course-g04-l11-in003-replay {justify-self: start;}
          @media (max-width: 600px) {
            .course-g04-l11-in003-rule-card,
            .course-g04-l11-in003-ordered-pair-controls > ol {grid-template-columns: 1fr;}
            .course-g04-l11-in003-term-panel {align-items: stretch; flex-direction: column;}
            .course-g04-l11-in003-term-panel > div:last-child {display: grid; grid-template-columns: 1fr 1fr;}
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
    sourceInteraction: COURSE_G04_L11_IN_003_INTERACTION_SOURCE,
    interactionAuthority: COURSE_G04_L11_IN_003_INTERACTION_AUTHORITY,
    sourceDefinitionTextDisplayed: true,
    orderedPairDefinitionAndTwoExamplesDisplayed: true,
    sourceNextOrderedPairClickBehaviorEstablished: false,
    supplementalHurricaneChartReachabilityEstablished: false,
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
