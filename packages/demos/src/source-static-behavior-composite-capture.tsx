"use client";

import React, {useEffect, useRef} from "react";
import type {ComponentType} from "react";

import type {AnimationLanguage, AnimationRendererProps} from "./contract";

export interface SourceStaticBehaviorCompositeCaptureMapping {
  readonly animationId: string;
  readonly frameDomain: string;
  readonly localFrameCount: number;
  readonly rootEntryFrame: number;
  readonly scenario: string;
  readonly language: AnimationLanguage;
  readonly sourceFrame: number;
  readonly sourceFrameDomain: string;
  readonly sourceScenario: string;
  readonly behaviorCompositeContractId: string;
  readonly behaviorCompositeStatePrefix: string;
  readonly authority: string;
}

export function isSourceStaticBehaviorCompositeCaptureRequest(
  props: Pick<
    AnimationRendererProps,
    | "entryStateSha256"
    | "frame"
    | "frameDomain"
    | "lang"
    | "requirementId"
    | "scenario"
    | "traceId"
  >,
  mapping: SourceStaticBehaviorCompositeCaptureMapping,
) {
  return Number.isSafeInteger(props.frame)
    && props.frame >= 1
    && props.frame <= mapping.localFrameCount
    && props.frameDomain === mapping.frameDomain
    && props.scenario === mapping.scenario
    && props.lang === mapping.language
    && /^[a-f0-9]{64}$/.test(props.entryStateSha256 ?? "")
    && Boolean(props.requirementId && props.traceId);
}

function setExactAttribute(element: HTMLElement, name: string, value: string) {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

export function SourceStaticBehaviorCompositeCapture({
  mapping,
  props,
  SourceRenderer,
  sourceState,
}: {
  readonly mapping: SourceStaticBehaviorCompositeCaptureMapping;
  readonly props: AnimationRendererProps;
  readonly SourceRenderer: ComponentType<AnimationRendererProps>;
  readonly sourceState: unknown;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const behaviorCompositeState =
    `${mapping.behaviorCompositeStatePrefix}${String(props.frame).padStart(3, "0")}`;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const stampReadyCanvas = () => {
      const canvas = host.querySelector<HTMLElement>(
        "canvas[data-render-visual=\"true\"]",
      );
      if (!canvas) return;
      const attributes = {
        "data-animation-id": mapping.animationId,
        "data-capture-stage": "true",
        "data-flash-entry-state-sha256": props.entryStateSha256 ?? "",
        "data-flash-frame": String(props.frame),
        "data-flash-frame-domain": props.frameDomain ?? "",
        "data-flash-lang": props.lang,
        "data-flash-requirement-id": props.requirementId ?? "",
        "data-flash-root-frame": String(props.rootFrame ?? mapping.rootEntryFrame),
        "data-flash-scenario": props.scenario,
        "data-flash-seed": String(props.seed),
        "data-flash-trace-id": props.traceId ?? "",
        "data-render-state": "ready",
        "data-render-visual": "true",
        "data-runtime-language": props.lang,
        "data-runtime-scenario": props.scenario,
        "data-runtime-seed": String(props.seed),
        "data-source-behavior-composite-contract":
          mapping.behaviorCompositeContractId,
        "data-source-behavior-composite-state": behaviorCompositeState,
        "data-source-parent-composite-frame": String(mapping.sourceFrame),
        "data-source-static-companion-authority": mapping.authority,
      } as const;
      for (const [name, value] of Object.entries(attributes)) {
        setExactAttribute(canvas, name, value);
      }
    };
    const observer = new MutationObserver(stampReadyCanvas);
    observer.observe(host, {attributes: true, childList: true, subtree: true});
    stampReadyCanvas();
    return () => observer.disconnect();
  }, [behaviorCompositeState, mapping, props]);

  return (
    <div
      data-source-static-behavior-composite-capture={`${mapping.frameDomain}-frames-1-${mapping.localFrameCount}`}
      data-strict-acceptance-effect="none"
      ref={hostRef}
    >
      <SourceRenderer
        {...props}
        entryStateSha256=""
        frame={mapping.sourceFrame}
        frameDomain={mapping.sourceFrameDomain}
        lang={mapping.language}
        requirementId=""
        scenario={mapping.sourceScenario}
        state={sourceState}
        traceId=""
      />
    </div>
  );
}
