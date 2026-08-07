"use client";

import React, {useEffect, useRef, useState} from "react";
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

function PageInteractionCompanionPortal({
  children,
  targetId,
}: {
  children: React.ReactNode;
  targetId?: string;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [resolvedTargetId, setResolvedTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (!targetId) {
      setTarget(null);
      setResolvedTargetId(null);
      return;
    }
    setTarget(document.getElementById(targetId));
    setResolvedTargetId(targetId);
  }, [targetId]);

  if (!targetId) return children;
  if (resolvedTargetId !== targetId) return null;
  return target ? createPortal(children, target) : children;
}

function GlossaryTermButtons({
  companionTargetId,
  config,
  controlsReady,
  frame,
  lang,
  onLessonHostRequest,
  stage,
  terms,
}: {
  companionTargetId?: string;
  config: CourseG04L03SourceGlossaryConfig;
  controlsReady: boolean;
  frame: number;
  lang: "en" | "es";
  onLessonHostRequest: AnimationRendererProps["onLessonHostRequest"];
  stage: Readonly<{width: number; height: number}>;
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

  const companion = (
    <section
      aria-label={
        lang === "es"
          ? "Términos clave vinculados a esta página"
          : "Key Terms linked from this page"
      }
      className="course-g04-l03-source-glossary-companion"
      data-behavior-parity-established="false"
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-glossary-source-authority={config.glossaryAuthority}
      data-glossary-source-disposition={config.glossarySourceDisposition}
      data-page-interaction-companion-surface="source-glossary"
      data-source-animation-stop-modeled={
        config.playbackDisposition ?? "host-support-pause-session"
      }
      data-source-host-action={config.sourceAction}
      data-source-term-count={terms.length}
    >
      <div>
        <span>HELP Math 2.0</span>
        <strong>
          {lang === "es"
            ? "Explorar términos de esta página"
            : "Explore this page’s source terms"}
        </strong>
        <p>
          {lang === "es"
            ? "Abre el panel moderno de Términos clave; no ejecuta ActionScript heredado."
            : "Opens the modern Key Terms panel without executing legacy ActionScript."}
        </p>
      </div>
      <div role="group">
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

  return (
    <>
      <div
        aria-label={lang === "es" ? "Términos de la fuente" : "Source terms"}
        className="course-g04-l03-source-glossary-stage-hotspots"
        data-source-hotspot-geometry-authority="static-audit-bounds-candidate"
        data-source-hotspot-surface="native-stage"
        role="group"
        style={{
          aspectRatio: "4 / 3",
          left: 0,
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          width: "100%",
          zIndex: 3,
        }}
      >
        {terms.map((term) => (
          <button
            aria-label={`${lang === "es" ? "Abrir Términos clave" : "Open Key Terms"}: ${term.labels[lang]}`}
            data-source-character-id={term.characterId}
            data-source-depth={term.depth}
            data-source-key-attribute={term.keyAttribute}
            disabled={!controlsReady}
            key={term.id}
            onClick={(event) => openTerm(term.id, event.currentTarget)}
            style={{
              ...buildCourseG04L03SourceGlossaryHitStyle(term, stage),
              background: "transparent",
              border: 0,
              boxSizing: "border-box",
              color: "transparent",
              cursor: controlsReady ? "pointer" : "default",
              padding: 0,
              pointerEvents: "auto",
              position: "absolute",
            }}
            type="button"
          >
            {term.labels[lang]}
          </button>
        ))}
      </div>

      <PageInteractionCompanionPortal targetId={companionTargetId}>
        {companion}
      </PageInteractionCompanionPortal>
    </>
  );
}

function SourceGlossaryInteraction({
  config,
  frame,
  lang,
  onLessonHostRequest,
  pageInteractionCompanionTargetId,
  replay = 0,
  stage,
  terms,
  visualHostRef,
}: Pick<
  AnimationRendererProps,
  | "frame"
  | "lang"
  | "onLessonHostRequest"
  | "pageInteractionCompanionTargetId"
  | "replay"
> & {
  config: CourseG04L03SourceGlossaryConfig;
  stage: Readonly<{width: number; height: number}>;
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
      setCanvasReady(candidate?.dataset.canvasStatus === "ready");
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
        .course-g04-l03-source-glossary-stage-hotspots button:focus-visible {
          background: rgb(255 245 133 / 22%) !important;
          outline: 5px solid #ffdd29;
          outline-offset: 2px;
        }

        .course-g04-l03-source-glossary-companion {
          background: linear-gradient(155deg, #f7fbff, #e4f3ff);
          border: 2px solid #225a96;
          border-radius: 12px;
          box-sizing: border-box;
          color: #17395f;
          display: none;
          font-family: ${SOURCE_FONT};
          gap: 12px;
          margin: 12px 0 0;
          padding: 14px;
          width: 100%;
        }

        .course-g04-l03-source-glossary-companion span {
          color: #0758ba;
          display: block;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .course-g04-l03-source-glossary-companion strong {
          display: block;
          font-size: 21px;
          line-height: 1.15;
          margin-top: 3px;
        }

        .course-g04-l03-source-glossary-companion p {
          font-family: system-ui, sans-serif;
          font-size: 14px;
          line-height: 1.35;
          margin: 5px 0 0;
        }

        .course-g04-l03-source-glossary-companion > div[role="group"] {
          display: grid;
          gap: 9px;
          grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
        }

        .course-g04-l03-source-glossary-companion button {
          background: linear-gradient(#fff6aa, #ffc62b);
          border: 2px solid #b75a00;
          border-radius: 9px;
          color: #102b70;
          cursor: pointer;
          font: 800 16px ${SOURCE_FONT};
          min-height: 48px;
          min-width: 48px;
          padding: 8px 12px;
        }

        .course-g04-l03-source-glossary-companion button:focus-visible {
          outline: 4px solid #0758ba;
          outline-offset: 3px;
        }

        .course-g04-l03-source-glossary-companion button:disabled {
          cursor: default;
          opacity: .55;
        }

        @media (max-width: 640px), (any-pointer: coarse), (min-width: 1280px) {
          .course-g04-l03-source-glossary-stage-hotspots {
            display: none;
          }

          .course-g04-l03-source-glossary-companion {
            display: grid;
          }
        }

        @media (min-width: 1280px) {
          .lesson-shell2__learning-column:has(
              > .lesson-shell2__page-interaction-companion
                .course-g04-l03-source-glossary-companion
            ) > .lesson-shell2__page-interaction-companion {
            align-self: start;
            display: block;
            grid-column: 2;
            grid-row: 2;
            max-height: min(340px, 38vh);
            min-width: 0;
            overflow: auto;
            overscroll-behavior: contain;
            scrollbar-gutter: stable;
            width: 100%;
          }

          .lesson-shell2__learning-column:has(
              > .lesson-shell2__page-interaction-companion
                .course-g04-l03-source-glossary-companion
            ) > .lesson-shell2__legacy-stage {
            grid-row: 1 / span 5;
          }

          .lesson-shell2__learning-column:has(
              > .lesson-shell2__page-interaction-companion
                .course-g04-l03-source-glossary-companion
            ) > .lesson-shell2__modern-toolbar {
            grid-row: 3;
          }

          .lesson-shell2__learning-column:has(
              > .lesson-shell2__page-interaction-companion
                .course-g04-l03-source-glossary-companion
            ) > .lesson-shell2__transport-boundary {
            grid-row: 4;
          }

          .lesson-shell2__learning-column:has(
              > .lesson-shell2__page-interaction-companion
                .course-g04-l03-source-glossary-companion
            ) > .lesson-shell2__learning-actions {
            grid-row: 5;
          }
        }
      `}</style>
      <GlossaryTermButtons
        companionTargetId={pageInteractionCompanionTargetId}
        config={config}
        controlsReady={controlsReady}
        frame={frame}
        lang={lang}
        onLessonHostRequest={onLessonHostRequest}
        stage={stage}
        terms={terms}
      />
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
        <div ref={visualHostRef}>
          <SourceStaticRenderer {...props} />
        </div>
        {interactionVisible ? (
          <SourceGlossaryInteraction
            config={config}
            frame={props.frame}
            lang={props.lang}
            onLessonHostRequest={props.onLessonHostRequest}
            pageInteractionCompanionTargetId={
              props.pageInteractionCompanionTargetId
            }
            replay={props.replay}
            stage={candidate.movie.stage}
            terms={terms}
            visualHostRef={visualHostRef}
          />
        ) : null}
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
      "source-frame-window-bound-hotspots",
      "source-audit-bounds-candidate-with-44px-responsive-minimum",
      "typed-memory-only-keyterm-host-request",
      playbackScope,
      "wide-right-rail-and-mobile-companion-controls",
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
