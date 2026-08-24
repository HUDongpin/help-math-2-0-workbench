"use client";

import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "../contract";
import type {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  createCourseG04L03SourceGlossaryOpenResult,
  validateCourseG04L03SourceGlossaryConfig,
  visibleCourseG04L03SourceGlossaryTerms,
  type CourseG04L03SourceGlossaryConfig,
  type CourseG04L03SourceGlossaryTerm,
} from "../timelines/course-g04-l03-source-glossary-interaction";

type SourceStaticCandidate<
  SourceContract extends object,
  Module extends object,
> = Pick<
  ReturnType<typeof createSourceStaticCanvasCandidate>,
  "Renderer" | "movie"
> &
  Readonly<{module: Module; sourceContract: SourceContract}>;

const SOURCE_ACTIVITY_SCENARIO = "source-static-frame";
const SOURCE_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';
const useClientLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function isDeterministicEvidenceCapture({
  entryStateSha256,
}: AnimationRendererProps) {
  return Boolean(entryStateSha256);
}

function stagePercent(value: number, extent: number) {
  return `${((value / extent) * 100).toFixed(6)}%`;
}

export function buildCourseG04L03SourceGlossaryHitStyle(
  term: CourseG04L03SourceGlossaryTerm,
  stage: Readonly<{width: number; height: number}>,
) {
  const sourceWidth = term.sourceBounds.right - term.sourceBounds.left;
  const sourceHeight = term.sourceBounds.bottom - term.sourceBounds.top;
  const centerX = (term.sourceBounds.left + term.sourceBounds.right) / 2;
  const centerY = (term.sourceBounds.top + term.sourceBounds.bottom) / 2;
  return {
    height: `max(44px, ${stagePercent(sourceHeight, stage.height)})`,
    left: `calc(${stagePercent(centerX, stage.width)} - max(22px, ${stagePercent(sourceWidth / 2, stage.width)}))`,
    top: `calc(${stagePercent(centerY, stage.height)} - max(22px, ${stagePercent(sourceHeight / 2, stage.height)}))`,
    width: `max(44px, ${stagePercent(sourceWidth, stage.width)})`,
  } as const;
}

function VisibleStageContentPortal({
  children,
  targetId,
}: {
  children: React.ReactNode;
  targetId?: string;
}) {
  const [stageTarget, setStageTarget] = useState<HTMLElement | null>(null);

  useClientLayoutEffect(() => {
    if (!targetId) {
      setStageTarget(null);
      return;
    }
    const target = document.getElementById(targetId);
    setStageTarget(
      target?.dataset.pageInteractionStageHost === "true" ? target : null,
    );
  }, [targetId]);

  return stageTarget ? createPortal(children, stageTarget) : children;
}

function GlossaryTermButtons({
  config,
  controlsReady,
  frame,
  lang,
  onLessonHostRequest,
  terms,
}: {
  config: CourseG04L03SourceGlossaryConfig;
  controlsReady: boolean;
  frame: number;
  lang: "en" | "es";
  onLessonHostRequest: AnimationRendererProps["onLessonHostRequest"];
  terms: readonly CourseG04L03SourceGlossaryTerm[];
}) {
  const [requestStatus, setRequestStatus] = useState<
    "idle" | "accepted" | "blocked"
  >("idle");
  const openTerm = (
    termId: string,
    trigger: HTMLButtonElement,
  ) => {
    if (!controlsReady || !onLessonHostRequest) return;
    const result = createCourseG04L03SourceGlossaryOpenResult({
      config,
      frame,
      lang,
      termId,
    });
    if (!result) {
      setRequestStatus("blocked");
      return;
    }
    const decision = onLessonHostRequest(result.request, {trigger});
    setRequestStatus(
      decision && decision.status === "blocked" ? "blocked" : "accepted",
    );
  };

  return (
    <section
      aria-label={
        lang === "es"
          ? "Términos clave vinculados a esta página"
          : "Key Terms linked from this page"
      }
      className="course-g04-l03-source-glossary-stage-surface"
      data-behavior-parity-established="false"
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-glossary-source-authority={config.glossaryAuthority}
      data-glossary-source-disposition={config.glossarySourceDisposition}
      data-page-interaction-companion-surface="source-glossary"
      data-source-glossary-placement="visible-stage-content-bottom"
      data-source-animation-stop-modeled={
        config.playbackDisposition ?? "host-support-pause-session"
      }
      data-source-host-action={config.sourceAction}
      data-source-term-count={terms.length}
    >
      <span className="sr-only">
        {lang === "es"
          ? "Abrir un término clave de esta animación"
          : "Open a Key Term from this animation"}
      </span>
      <div
        aria-label={lang === "es" ? "Términos clave" : "Key Terms"}
        role="group"
      >
        {terms.map((term) => (
          <button
            data-source-character-id={term.characterId}
            data-source-key-attribute={term.keyAttribute}
            disabled={!controlsReady}
            key={term.id}
            onClick={(event) => openTerm(term.id, event.currentTarget)}
            type="button"
          >
            {term.labels[lang]}
          </button>
        ))}
      </div>
      {requestStatus === "blocked" ? (
        <p aria-live="assertive" role="alert">
          {lang === "es"
            ? "La solicitud de Términos clave se cerró de forma segura."
            : "The Key Terms request failed closed."}
        </p>
      ) : null}
    </section>
  );
}

function SourceGlossaryInteraction({
  config,
  frame,
  lang,
  onLessonHostRequest,
  pageInteractionStageTargetId,
  replay = 0,
  terms,
  visualHostRef,
}: Pick<
  AnimationRendererProps,
  | "frame"
  | "lang"
  | "onLessonHostRequest"
  | "pageInteractionStageTargetId"
  | "replay"
> & {
  config: CourseG04L03SourceGlossaryConfig;
  terms: readonly CourseG04L03SourceGlossaryTerm[];
  visualHostRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [canvasReady, setCanvasReady] = useState(false);
  const controlsReady = canvasReady && Boolean(onLessonHostRequest);

  useEffect(() => {
    const host = visualHostRef.current;
    if (!host) {
      setCanvasReady(false);
      return;
    }
    const update = () => {
      const candidate = host.querySelector<HTMLElement>(
        '[data-candidate-status="source-static-engineering-not-strict"]' +
          "[data-canvas-status]",
      );
      const status = candidate?.dataset.canvasStatus;
      // `updating` retains the last successfully painted bitmap while the next
      // frame is drawn. Keep glossary controls stable across that atomic visual
      // handoff; capture readiness remains separately fail-closed on Canvas.
      setCanvasReady(status === "ready" || status === "updating");
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(host, {
      attributeFilter: ["data-canvas-status"],
      attributes: true,
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [replay, visualHostRef]);

  return (
    <>
      <style>{`
        .course-g04-l03-source-glossary-stage-surface {
          align-content: end;
          aspect-ratio: 4 / 3;
          box-sizing: border-box;
          color: #17395f;
          display: grid;
          font-family: ${SOURCE_FONT};
          gap: 6px;
          bottom: var(--lesson-authored-content-bottom-inset, 0%);
          left: 0;
          padding: 0 clamp(8px, 2.25%, 18px) clamp(8px, 2%, 14px);
          pointer-events: none;
          position: absolute;
          width: 100%;
          z-index: 4;
        }

        .course-g04-l03-source-glossary-stage-surface > div[role="group"] {
          backdrop-filter: blur(10px);
          background: rgb(244 249 255 / 92%);
          border: 2px solid rgb(34 90 150 / 82%);
          border-radius: 13px;
          box-shadow: 0 7px 18px rgb(18 57 106 / 20%);
          display: grid;
          gap: clamp(5px, 1.1cqw, 9px);
          grid-auto-columns: minmax(0, 1fr);
          grid-auto-flow: column;
          padding: clamp(5px, 1.1cqw, 9px);
          pointer-events: auto;
          width: 100%;
        }

        .course-g04-l03-source-glossary-stage-surface button {
          background: linear-gradient(180deg, #fff9d5, #ffe38b);
          border: 2px solid #8b6a13;
          border-radius: 9px;
          color: #102b70;
          cursor: pointer;
          font: 800 clamp(.75rem, 1.8cqw, 1rem) ${SOURCE_FONT};
          line-height: 1.08;
          min-height: 48px;
          min-width: 0;
          overflow-wrap: anywhere;
          padding: 6px clamp(4px, 1.2cqw, 10px);
        }

        .course-g04-l03-source-glossary-stage-surface button:hover {
          background: linear-gradient(180deg, #fffdf0, #ffd95d);
        }

        .course-g04-l03-source-glossary-stage-surface button:focus-visible {
          box-shadow: inset 0 0 0 4px #0758ba;
          outline: 3px solid #ffcc00;
          outline-offset: 1px;
        }

        .course-g04-l03-source-glossary-stage-surface button:disabled {
          cursor: default;
          opacity: .58;
        }

        .course-g04-l03-source-glossary-stage-surface > p[role="alert"] {
          background: rgb(255 246 225 / 96%);
          border: 1px solid #9a5e10;
          border-radius: 8px;
          font: 700 clamp(.68rem, 1.6cqw, .9rem) system-ui, sans-serif;
          margin: 0;
          padding: 5px 8px;
          text-align: center;
        }

        @media (max-width: 520px) {
          .course-g04-l03-source-glossary-stage-surface {
            padding-bottom: 5px;
            padding-inline: 5px;
          }

          .course-g04-l03-source-glossary-stage-surface > div[role="group"] {
            border-radius: 9px;
            gap: 4px;
            padding: 4px;
          }

          .course-g04-l03-source-glossary-stage-surface button {
            border-width: 1.5px;
            min-height: 44px;
            padding-inline: 3px;
          }
        }
      `}</style>
      <VisibleStageContentPortal targetId={pageInteractionStageTargetId}>
        <GlossaryTermButtons
          config={config}
          controlsReady={controlsReady}
          frame={frame}
          lang={lang}
          onLessonHostRequest={onLessonHostRequest}
          terms={terms}
        />
      </VisibleStageContentPortal>
    </>
  );
}

export function createCourseG04L03SourceGlossaryCandidate<
  SourceContract extends object,
  Module extends object,
>(
  candidate: SourceStaticCandidate<SourceContract, Module>,
  unsafeConfig: CourseG04L03SourceGlossaryConfig,
) {
  const config = validateCourseG04L03SourceGlossaryConfig(unsafeConfig);
  const SourceStaticRenderer = candidate.Renderer;
  const playbackScope =
    config.playbackDisposition ===
    "source-stop-timeline-and-audio-until-explicit-resume"
      ? "source-stop-timeline-and-audio-until-explicit-resume"
      : "host-support-tool-pause-session";

  function Renderer(props: AnimationRendererProps) {
    const visualHostRef = useRef<HTMLDivElement>(null);
    const frameDomain = props.frameDomain ?? config.frameDomain;
    const terms = visibleCourseG04L03SourceGlossaryTerms(config, props.frame);
    const interactionVisible =
      frameDomain === config.frameDomain &&
      props.scenario === SOURCE_ACTIVITY_SCENARIO &&
      props.lang === "en" &&
      terms.length > 0 &&
      !isDeterministicEvidenceCapture(props);
    const controlsEnabled =
      interactionVisible && Boolean(props.onLessonHostRequest);

    return (
      <div
        data-authoritative-original-runtime-evidence="false"
        data-behavior-parity-established="false"
        data-current-js-controls-enabled={controlsEnabled ? "true" : "false"}
        data-current-js-functional-candidate="true"
        data-current-js-functional-scope="source-keyattribute-keyterms-host-adapter"
        data-glossary-source-authority={config.glossaryAuthority}
        data-glossary-source-disposition={config.glossarySourceDisposition}
        data-owner-accepted="false"
        data-source-host-action={config.sourceAction}
        data-source-host-stop-target={config.sourceStopTarget}
        data-strict-acceptance-effect="none"
        data-strict-migration-complete="false"
        style={{
          margin: "0 auto",
          maxWidth: candidate.movie.stage.width,
          position: "relative",
          width: "100%",
        }}
      >
        <div
          data-source-glossary-visual-plane="source-static-canvas"
          ref={visualHostRef}
          style={{position: "relative"}}
        >
          <SourceStaticRenderer {...props} />
          {interactionVisible ? (
            <SourceGlossaryInteraction
              config={config}
              frame={props.frame}
              lang={props.lang}
              onLessonHostRequest={props.onLessonHostRequest}
              pageInteractionStageTargetId={props.pageInteractionStageTargetId}
              replay={props.replay}
              terms={terms}
              visualHostRef={visualHostRef}
            />
          ) : null}
        </div>
      </div>
    );
  }

  const sourceContract = Object.freeze({
    ...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "source-keyattribute-keyterms-functional-candidate",
    currentJavascriptFunctionalEntry: Object.freeze({
      frameDomain: config.frameDomain,
      frame: Math.min(...config.terms.map(({firstFrame}) => firstFrame)),
      scenario: SOURCE_ACTIVITY_SCENARIO,
      language: "en",
      deterministicCaptureOverlayEnabled: false,
    }),
    currentJavascriptInteractionScope: Object.freeze([
      "source-frame-window-bound-term-controls",
      "source-audit-bounds-retained-not-rendered",
      "typed-memory-only-keyterm-host-request",
      playbackScope,
      "current-js-visible-stage-bottom-keyterm-controls",
      "deterministic-capture-overlay-suppression",
    ]),
    sourceCanvasControlStatus: "disabled-preserved-visual-only",
    sourceActionScriptExecutionStatus: "never-executed",
    sourceGlossaryHostStatus:
      "modern-keyterms-adapter-grade-wide-candidate-only",
    sourceGlossaryContentDisposition: config.glossarySourceDisposition,
    sourceGlossaryRuntimeParityEstablished: false,
    sourceHostPauseParityEstablished: false,
    behaviorParityEstablished: false,
    strictAcceptanceEffect: "none",
  });

  const module = Object.freeze({
    ...candidate.module,
    lessonHost: Object.freeze({
      capabilities: Object.freeze(["keyterm"] as const),
      legacyOperations: "blocked" as const,
      auditStorage: "memory-only" as const,
      storesPersonalData: false as const,
    }),
    Renderer,
  });

  return Object.freeze({Renderer, sourceContract, module});
}
