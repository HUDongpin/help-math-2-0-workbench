"use client";

import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";

import type {
  AnimationRendererProps,
  AudioCue,
  AudioTrack,
} from "./contract";
import {
  createSourceStaticCanvasCandidate,
  type SourceStaticCanvasCandidateConfig,
} from "./source-static-canvas-candidate";

export interface PrivateSourceStaticGlossaryTerm {
  readonly id: string;
  readonly sourceKeyAttribute: string;
  readonly sourceCharacterId: number;
  readonly firstFrame: number;
  readonly lastFrame: number;
  readonly labels: Readonly<{en: string; es: string}>;
  readonly definitions: Readonly<{en: string; es: string}>;
}

export interface PrivateSourceStaticAlgL11IntroTerminalCandidateOptions {
  readonly calibrationId: string;
  readonly companionSurfaceId: string;
  readonly glossaryTerms: readonly PrivateSourceStaticGlossaryTerm[];
  readonly sourceStopDisposition:
    | "script-free-intro-modern-once-clamp"
    | "explicit-source-terminal-stop"
    | "no-explicit-source-terminal-stop-modern-once-clamp";
  readonly audioCues?: readonly AudioCue[];
  readonly audioTracks?: readonly AudioTrack[];
}

const useClientLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function validateTerms(
  config: SourceStaticCanvasCandidateConfig,
  suppliedTerms: readonly PrivateSourceStaticGlossaryTerm[],
) {
  const ids = new Set<string>();
  const sourceKeys = new Set<string>();
  const sourceCharacters = new Set<number>();
  return Object.freeze(
    suppliedTerms.map((term) => {
      invariant(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(term.id),
        `${config.animationId} has an invalid glossary entry ID`,
      );
      invariant(!ids.has(term.id), `${config.animationId} repeats glossary entry ${term.id}`);
      invariant(
        term.sourceKeyAttribute.trim().length > 0 &&
          !sourceKeys.has(term.sourceKeyAttribute),
        `${config.animationId} has an empty or repeated source KeyAttribute`,
      );
      invariant(
        Number.isSafeInteger(term.sourceCharacterId) &&
          term.sourceCharacterId > 0 &&
          !sourceCharacters.has(term.sourceCharacterId),
        `${config.animationId} has an invalid or repeated source button character`,
      );
      invariant(
        Number.isSafeInteger(term.firstFrame) &&
          term.firstFrame >= 1 &&
          term.firstFrame <= config.mainFrameCount,
        `${config.animationId} has a glossary control outside its source frame domain`,
      );
      invariant(
        Number.isSafeInteger(term.lastFrame) &&
          term.lastFrame >= term.firstFrame &&
          term.lastFrame <= config.mainFrameCount,
        `${config.animationId} has an invalid glossary control lifetime`,
      );
      invariant(
        term.labels.en.trim().length > 0 && term.labels.es.trim().length > 0,
        `${config.animationId} has an empty glossary label`,
      );
      invariant(
        term.definitions.en.trim().length > 0 &&
          term.definitions.es.trim().length > 0 &&
          !term.definitions.en.includes("&#x") &&
          !term.definitions.es.includes("&#x"),
        `${config.animationId} has an empty or undecoded glossary definition`,
      );
      ids.add(term.id);
      sourceKeys.add(term.sourceKeyAttribute);
      sourceCharacters.add(term.sourceCharacterId);
      return Object.freeze({
        ...term,
        labels: Object.freeze({...term.labels}),
        definitions: Object.freeze({...term.definitions}),
      });
    }),
  );
}

export function resetAlgL11GlossaryRequestStatusOnReplay() {
  return "idle" as const;
}

function CompanionPortal({
  children,
  targetId,
}: {
  children: React.ReactNode;
  targetId?: string;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useClientLayoutEffect(() => {
    if (!targetId) {
      setTarget(null);
      return;
    }
    const element = document.getElementById(targetId);
    setTarget(
      element?.dataset.pageInteractionCompanionHost === "true"
        ? element
        : null,
    );
  }, [targetId]);
  return target ? createPortal(children, target) : children;
}

/**
 * Promotes the exact audited ALG L11 intro/terminal tranche1 Canvas family through one
 * narrow bridge with optional source-bound glossary controls. It intentionally keeps legacy globals,
 * network reporting, source ActionScript execution, and every acceptance gate
 * outside the maintained module.
 */
export function createPrivateSourceStaticAlgL11IntroTerminalCandidate(
  config: SourceStaticCanvasCandidateConfig,
  options: PrivateSourceStaticAlgL11IntroTerminalCandidateOptions,
) {
  invariant(
    options.calibrationId ===
      "g678-alg-l11-intro-terminal-tranche1-engineering-v1",
    `${config.animationId} has an invalid calibration ID`,
  );
  invariant(
    /^[a-z0-9-]+$/.test(options.companionSurfaceId),
    `${config.animationId} has an invalid companion surface ID`,
  );
  const glossaryTerms = validateTerms(config, options.glossaryTerms);
  invariant(
    options.sourceStopDisposition !== "script-free-intro-modern-once-clamp" ||
      glossaryTerms.length === 0,
    `${config.animationId} intro candidate cannot invent glossary controls`,
  );
  invariant(
    config.playbackMode === "once" &&
      config.livePlaybackEndFrame === config.mainFrameCount,
    `${config.animationId} must fail closed at its exact source frame-domain end`,
  );
  const candidate = createSourceStaticCanvasCandidate(config);

  function PrivateAlgL11IntroTerminalRenderer(
    props: AnimationRendererProps,
  ) {
    const visualHostRef = useRef<HTMLDivElement>(null);
    const [canvasReady, setCanvasReady] = useState(false);
    const [requestStatus, setRequestStatus] = useState<
      "idle" | "accepted" | "blocked"
    >("idle");
    const frameDomain = props.frameDomain ?? config.mainFrameDomain;
    const visibleTerms = glossaryTerms.filter(
      ({firstFrame, lastFrame}) =>
        props.frame >= firstFrame && props.frame <= lastFrame,
    );
    const interactionVisible =
      frameDomain === config.mainFrameDomain &&
      props.scenario === "source-static-frame" &&
      visibleTerms.length > 0 &&
      !props.entryStateSha256;
    const controlsReady =
      interactionVisible && canvasReady && Boolean(props.onLessonHostRequest);

    useEffect(() => {
      const host = visualHostRef.current;
      if (!host) {
        setCanvasReady(false);
        return;
      }
      const update = () => {
        const surface = host.querySelector<HTMLElement>(
          '[data-candidate-status="source-static-engineering-not-strict"]' +
            '[data-canvas-status]',
        );
        setCanvasReady(
          surface?.dataset.canvasStatus === "ready" ||
            surface?.dataset.canvasStatus === "updating",
        );
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
    }, [props.replay]);

    useEffect(() => {
      setRequestStatus(resetAlgL11GlossaryRequestStatusOnReplay());
    }, [props.replay]);

    const openGlossary = (entryId: string, trigger: HTMLButtonElement) => {
      if (!controlsReady || !props.onLessonHostRequest) return;
      const decision = props.onLessonHostRequest(
        {type: "open-glossary", entryId},
        {trigger},
      );
      setRequestStatus(
        decision && decision.status === "blocked" ? "blocked" : "accepted",
      );
    };

    const controls = interactionVisible ? (
      <section
        aria-label={
          props.uiLanguage === "es"
            ? "Glosario de esta página"
            : "Glossary for this page"
        }
        data-current-js-controls-ready={controlsReady ? "true" : "false"}
        data-legacy-click-record="blocked"
        data-page-interaction-companion-surface={options.companionSurfaceId}
        data-source-action="DoHyperLinks"
        data-source-animation-stop="modeled-by-modern-host-pause"
        data-source-term-count={visibleTerms.length}
        style={{
          alignItems: "center",
          background: "#f5fbf8",
          border: "1px solid #a4c5b4",
          borderRadius: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
          padding: 10,
        }}
      >
        <strong style={{color: "#194f3a", marginInlineEnd: 4}}>
          {props.uiLanguage === "es" ? "Palabras clave" : "Key words"}
        </strong>
        {visibleTerms.map((term) => (
          <button
            data-source-character-id={term.sourceCharacterId}
            data-source-first-frame={term.firstFrame}
            data-source-key-attribute={term.sourceKeyAttribute}
            data-source-last-frame={term.lastFrame}
            disabled={!controlsReady}
            key={term.id}
            onClick={(event) => openGlossary(term.id, event.currentTarget)}
            style={{
              background: "#fff4c7",
              border: "2px solid #86660e",
              borderRadius: 999,
              color: "#163e31",
              cursor: controlsReady ? "pointer" : "default",
              font: "700 .92rem system-ui, sans-serif",
              minHeight: 44,
              padding: "8px 14px",
            }}
            type="button"
          >
            {term.labels[props.uiLanguage === "es" ? "es" : "en"]}
          </button>
        ))}
        {requestStatus === "blocked" ? (
          <span aria-live="assertive" role="alert">
            {props.uiLanguage === "es"
              ? "La solicitud se cerró de forma segura."
              : "The glossary request failed closed."}
          </span>
        ) : null}
      </section>
    ) : null;

    return (
      <div
        data-audio-acceptance="pending"
        data-behavior-parity-established="false"
        data-calibration-id={options.calibrationId}
        data-complexity-lane={
          glossaryTerms.length > 0 ? "interactive-understood" : "low"
        }
        data-current-js-controls-enabled={controlsReady ? "true" : "false"}
        data-product-calibration-passed="false"
        data-private-current-js="true"
        data-replay-reset="base-candidate-complete-state"
        data-source-actionscript-executed="false"
        data-source-stop-disposition={options.sourceStopDisposition}
        data-spoken-language-accepted="false"
        data-strict-acceptance-effect="none"
        ref={visualHostRef}
        style={{margin: "0 auto", maxWidth: candidate.movie.stage.width}}
      >
        <candidate.Renderer {...props} />
        {controls ? (
          <CompanionPortal targetId={props.pageInteractionCompanionTargetId}>
            {controls}
          </CompanionPortal>
        ) : null}
      </div>
    );
  }

  const privateModule = Object.freeze({
    ...candidate.module,
    lessonHost: Object.freeze({
      capabilities: Object.freeze(
        glossaryTerms.length > 0 ? ["glossary"] as const : [] as const,
      ),
      legacyOperations: "blocked" as const,
      auditStorage: "memory-only" as const,
      storesPersonalData: false as const,
    }),
    maturity: "private-current-js" as const,
    ...(options.audioCues ? {audioCues: options.audioCues} : {}),
    ...(options.audioTracks ? {audioTracks: options.audioTracks} : {}),
    Renderer: PrivateAlgL11IntroTerminalRenderer,
  });

  return Object.freeze({
    ...candidate,
    glossaryTerms,
    Renderer: PrivateAlgL11IntroTerminalRenderer,
    module: privateModule,
  });
}
