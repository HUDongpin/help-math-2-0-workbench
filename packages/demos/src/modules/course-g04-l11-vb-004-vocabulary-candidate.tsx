"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {
  AnimationModule,
  AnimationRendererProps,
  MovieMetadata,
} from "../contract";
import {
  COURSE_G04_L11_VB_004_INTERACTION_AUTHORITY,
  COURSE_G04_L11_VB_004_INTERACTION_SOURCE,
  COURSE_G04_L11_VB_004_TERMS,
  createCourseG04L11Vb004VocabularyState,
  getCourseG04L11Vb004SelectedTerm,
  getCourseG04L11Vb004VisualEmphasis,
  reduceCourseG04L11Vb004Vocabulary,
  type CourseG04L11Vb004VocabularyEvent,
  type CourseG04L11Vb004VocabularyState,
  type CourseG04L11Vb004TermId,
} from "../timelines/course-g04-l11-vb-004-vocabulary-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule;
  readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}

const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-71";
const UI_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';

const SPANISH_PROMPTS: Readonly<Record<CourseG04L11Vb004TermId, string>> =
  Object.freeze({
    "y-axis": "Resalta el eje vertical.",
    vertical: "Muestra la dirección de arriba hacia abajo.",
    "number-line": "Muestra valores ordenados en una recta vertical.",
    "coordinate-grid": "Muestra juntos los ejes horizontal y vertical.",
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

function ModernVisualEmphasis({
  selectedTermId,
}: {
  selectedTermId: CourseG04L11Vb004TermId | null;
}) {
  if (!selectedTermId) return null;
  const state = createCourseG04L11Vb004VocabularyState(9);
  const selected = reduceCourseG04L11Vb004Vocabulary(state, {
    type: "select-term",
    termId: selectedTermId,
    frame: 9,
  });
  const emphasis = getCourseG04L11Vb004VisualEmphasis(selected);
  return (
    <svg
      aria-hidden="true"
      data-modern-pedagogical-emphasis={selectedTermId}
      preserveAspectRatio="xMidYMid meet"
      style={{height: "100%", inset: 0, pointerEvents: "none", position: "absolute", width: "100%"}}
      viewBox="0 0 800 600"
    >
      {emphasis.showFullGrid ? (
        <rect fill="rgb(255 224 77 / 16%)" height="360" rx="20" stroke="#e88800" strokeDasharray="12 8" strokeWidth="6" width="540" x="130" y="90" />
      ) : null}
      {emphasis.emphasizeYAxis ? (
        <rect fill="rgb(255 218 44 / 24%)" height="390" rx="18" stroke="#c95f00" strokeWidth="5" width="52" x="374" y="74" />
      ) : null}
      {emphasis.showVerticalDirection ? (
        <g fill="#0a56a8" stroke="#fff" strokeWidth="4">
          <path d="M400 62 L376 102 H424 Z" />
          <path d="M400 478 L376 438 H424 Z" />
        </g>
      ) : null}
      {emphasis.showYAxisNumbers ? (
        <g fill="#083d77" fontFamily={UI_FONT} fontSize="25" fontWeight="900" textAnchor="start">
          <text x="438" y="140">+3</text>
          <text x="438" y="220">+2</text>
          <text x="438" y="300">+1</text>
          <text x="438" y="380">0</text>
          <text x="438" y="460">−1</text>
        </g>
      ) : null}
    </svg>
  );
}

function VocabularyControls({
  dispatch,
  hostFrame,
  interaction,
  lang,
  replayLocally,
}: {
  dispatch: React.Dispatch<CourseG04L11Vb004VocabularyEvent>;
  hostFrame: number;
  interaction: CourseG04L11Vb004VocabularyState;
  lang: "en" | "es";
  replayLocally: () => void;
}) {
  const selected = getCourseG04L11Vb004SelectedTerm(interaction);
  const selectTerm = (termId: CourseG04L11Vb004TermId) => {
    dispatch({type: "select-term", termId, frame: interaction.frame});
  };
  return (
    <section
      aria-label={lang === "es" ? "Palabras importantes de la cuadrícula" : "Coordinate Grid important words"}
      className="course-g04-l11-vb004-vocabulary-controls"
      data-animation-internal-control-count="4"
      data-legacy-course-shell-included="false"
      data-legacy-dohyperlinks-executed="false"
      data-local-visual-frame={interaction.frame}
      data-local-visual-playing={interaction.playing ? "true" : "false"}
      data-source-definition-parity-established="false"
    >
      <header>
        <span>HELP Math 2.0</span>
        <strong>{lang === "es" ? "Eje vertical y" : "Y-axis / Vertical"}</strong>
        <p>
          {lang === "es"
            ? "Los términos de la fuente se conservan en inglés; estas ayudas visuales modernas no afirman paridad con el contenido Flash que falta."
            : "Choose a source term to pause this animation locally and highlight its mathematical meaning."}
        </p>
      </header>
      <div aria-label={lang === "es" ? "Términos de la fuente" : "Source terms"} role="group">
        {COURSE_G04_L11_VB_004_TERMS.map((term) => (
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
        <div aria-live="polite" className="course-g04-l11-vb004-vocabulary-panel" role="status">
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
          className="course-g04-l11-vb004-resume"
          onClick={() => dispatch({type: "resume", frame: hostFrame})}
          type="button"
        >
          {lang === "es" ? "Continuar animación" : "Resume animation"}
        </button>
      ) : null}
      <button className="course-g04-l11-vb004-replay" onClick={replayLocally} type="button">
        {lang === "es" ? "Repetir" : "Replay"}
      </button>
    </section>
  );
}

export function createCourseG04L11Vb004VocabularyCandidate<
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
      reduceCourseG04L11Vb004Vocabulary,
      props.frame,
      createCourseG04L11Vb004VocabularyState,
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
        className="course-g04-l11-vb004-vocabulary-candidate"
        data-authoritative-original-runtime-evidence="false"
        data-current-js-functional-candidate="true"
        data-current-js-functional-scope="source-keyattribute-local-vocabulary-controls"
        data-legacy-course-shell-included="false"
        data-owner-accepted="false"
        data-registered-current-javascript="false"
        data-strict-acceptance-effect="none"
        data-strict-migration-complete="false"
        style={{margin: "0 auto", maxWidth: candidate.movie.stage.width, position: "relative", width: "100%"}}
      >
        <div style={{position: "relative"}}>
          <SourceRenderer {...props} frame={visualFrame} state={undefined} />
          {interactionVisible ? (
            <ModernVisualEmphasis selectedTermId={interaction.selectedTermId} />
          ) : null}
        </div>
        {interactionVisible ? (
          <PageCompanionPortal targetId={props.pageInteractionCompanionTargetId}>
            <div>
              <VocabularyControls
                dispatch={dispatch}
                hostFrame={props.frame}
                interaction={interaction}
                lang={props.uiLanguage ?? props.lang}
                replayLocally={replayLocally}
              />
            </div>
          </PageCompanionPortal>
        ) : null}
        <style>{`
          .course-g04-l11-vb004-vocabulary-candidate [data-source-replay-parity="unvalidated"] {
            display: none;
          }
          .course-g04-l11-vb004-vocabulary-controls {
            background: linear-gradient(145deg, #f5fbff, #e1f2ff);
            border: 2px solid #1d5b96;
            border-radius: 16px;
            box-sizing: border-box;
            color: #17395f;
            display: grid;
            font-family: ${UI_FONT};
            gap: 14px;
            margin-top: 12px;
            padding: 16px;
            width: 100%;
          }
          .course-g04-l11-vb004-vocabulary-controls header span {
            color: #0758ba;
            display: block;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: .08em;
          }
          .course-g04-l11-vb004-vocabulary-controls header strong {
            display: block;
            font-size: clamp(21px, 4vw, 30px);
            line-height: 1.1;
            margin-top: 3px;
          }
          .course-g04-l11-vb004-vocabulary-controls p {
            font-family: system-ui, sans-serif;
            line-height: 1.45;
            margin: 6px 0 0;
          }
          .course-g04-l11-vb004-vocabulary-controls > div[role="group"] {
            display: grid;
            gap: 10px;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          }
          .course-g04-l11-vb004-vocabulary-controls button {
            background: linear-gradient(#fff8ad, #ffc72f);
            border: 2px solid #a95000;
            border-radius: 10px;
            color: #102b70;
            cursor: pointer;
            font: 800 16px ${UI_FONT};
            min-height: 48px;
            padding: 9px 14px;
          }
          .course-g04-l11-vb004-vocabulary-controls button[aria-pressed="true"] {
            background: #0a61bc;
            border-color: #063a73;
            color: white;
          }
          .course-g04-l11-vb004-vocabulary-controls button:focus-visible {
            outline: 4px solid #0758ba;
            outline-offset: 3px;
          }
          .course-g04-l11-vb004-vocabulary-panel {
            align-items: center;
            background: white;
            border: 2px solid #5d8fc0;
            border-radius: 12px;
            display: flex;
            gap: 14px;
            justify-content: space-between;
            padding: 14px;
          }
          .course-g04-l11-vb004-vocabulary-panel > div:last-child {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .course-g04-l11-vb004-replay {justify-self: start;}
          @media (max-width: 540px) {
            .course-g04-l11-vb004-vocabulary-panel {align-items: stretch; flex-direction: column;}
            .course-g04-l11-vb004-vocabulary-panel > div:last-child {display: grid; grid-template-columns: 1fr 1fr;}
          }
        `}</style>
      </div>
    );
  }

  const sourceContract = Object.freeze({
    ...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "source-keyattribute-local-vocabulary-functional-candidate",
    currentJavascriptFunctionalEntry: Object.freeze({
      frameDomain: SOURCE_DOMAIN,
      frame: 9,
      scenario: SOURCE_SCENARIO,
      language: "en",
      deterministicCaptureOverlayEnabled: false,
    }),
    sourceInteraction: COURSE_G04_L11_VB_004_INTERACTION_SOURCE,
    interactionAuthority: COURSE_G04_L11_VB_004_INTERACTION_AUTHORITY,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    registeredCurrentJavascript: false,
    sourceDefinitionTextParityEstablished: false,
    sourceHostPauseParityEstablished: false,
    sourceVisualSequenceParityEstablished: false,
    behaviorParityEstablished: false,
    strictAcceptanceEffect: "none",
  });

  const module = Object.freeze({...candidate.module, Renderer});
  return Object.freeze({Renderer, module, sourceContract});
}
