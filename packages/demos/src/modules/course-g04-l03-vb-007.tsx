"use client";

import React, {useMemo} from "react";

import type {AnimationRendererProps} from "../contract";
import {getG4L3VisibleCompanionAudioCandidates} from "../g4-l3-visible-companion-audio.generated";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  isSourceStaticBehaviorCompositeCaptureRequest,
  SourceStaticBehaviorCompositeCapture,
} from "../source-static-behavior-composite-capture";
import {createCourseG04L03VbSignQuizCandidate} from "./course-g04-l03-vb-sign-quiz";
import {COURSE_G04_L03_VB_007_SIGN_QUIZ} from "../timelines/course-g04-l03-vb-sign-quiz-interaction";
import {
  COURSE_G04_L03_VB_007_CONFIG,
  COURSE_G04_L03_VB_007_DIRECT_COMPANION_COMPOSITE_CAPTURES,
  COURSE_G04_L03_VB_007_DIRECT_COMPANION_COMPOSITE_CONFIGS,
  COURSE_G04_L03_VB_007_NATURAL_PARENT_COMPOSITE_CAPTURES,
  COURSE_G04_L03_VB_007_NATURAL_PARENT_COMPOSITE_CONFIG,
  COURSE_G04_L03_VB_007_PARENT_COMPOSITE_CAPTURES,
  COURSE_G04_L03_VB_007_PARENT_COMPOSITE_CONFIG,
  COURSE_G04_L03_VB_007_SOURCE,
} from "../timelines/course-g04-l03-vb-007";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_VB_007_CONFIG,
);
const functionalCandidate = createCourseG04L03VbSignQuizCandidate(
  candidate,
  COURSE_G04_L03_VB_007_SIGN_QUIZ,
);
const visibleCompanionAudioCandidates =
  getG4L3VisibleCompanionAudioCandidates("course-g04-l03-vb-007");
const parentCompositeCandidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_VB_007_PARENT_COMPOSITE_CONFIG,
);
const ParentCompositeSourceRenderer = parentCompositeCandidate.Renderer;
const naturalParentCompositeCandidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_VB_007_NATURAL_PARENT_COMPOSITE_CONFIG,
);
const NaturalParentCompositeSourceRenderer =
  naturalParentCompositeCandidate.Renderer;
const directCompanionCandidates = new Map(
  COURSE_G04_L03_VB_007_DIRECT_COMPANION_COMPOSITE_CONFIGS.map((config) => [
    config.animationId,
    createSourceStaticCanvasCandidate(config),
  ]),
);
const visibleCompanionPlaybackEndFrameByDomain = Object.freeze(
  Object.fromEntries(
    [
      ...COURSE_G04_L03_VB_007_PARENT_COMPOSITE_CAPTURES,
      ...COURSE_G04_L03_VB_007_NATURAL_PARENT_COMPOSITE_CAPTURES,
      ...COURSE_G04_L03_VB_007_DIRECT_COMPANION_COMPOSITE_CAPTURES,
    ].map(({frameDomain, localFrameCount}) => [
      frameDomain,
      localFrameCount,
    ]),
  ),
);

type ParentCompositeCapture =
  (typeof COURSE_G04_L03_VB_007_PARENT_COMPOSITE_CAPTURES)[number];
type NaturalParentCompositeCapture =
  (typeof COURSE_G04_L03_VB_007_NATURAL_PARENT_COMPOSITE_CAPTURES)[number];
type DirectCompanionCompositeCapture =
  (typeof COURSE_G04_L03_VB_007_DIRECT_COMPANION_COMPOSITE_CAPTURES)[number];

function findParentCompositeCapture(
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
): ParentCompositeCapture | undefined {
  return COURSE_G04_L03_VB_007_PARENT_COMPOSITE_CAPTURES.find(
    (mapping) =>
      props.requirementId === mapping.requirementId
      && props.traceId === mapping.traceId
      && props.entryStateSha256 === mapping.entryStateSha256
      && isSourceStaticBehaviorCompositeCaptureRequest(props, mapping),
  );
}

function findNaturalParentCompositeCapture(
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
): NaturalParentCompositeCapture | undefined {
  return COURSE_G04_L03_VB_007_NATURAL_PARENT_COMPOSITE_CAPTURES.find(
    (mapping) =>
      props.requirementId === mapping.requirementId
      && props.traceId === mapping.traceId
      && props.entryStateSha256 === mapping.entryStateSha256
      && isSourceStaticBehaviorCompositeCaptureRequest(props, mapping),
  );
}

function findDirectCompanionCompositeCapture(
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
): DirectCompanionCompositeCapture | undefined {
  return COURSE_G04_L03_VB_007_DIRECT_COMPANION_COMPOSITE_CAPTURES.find(
    (mapping) =>
      props.requirementId === mapping.requirementId
      && props.traceId === mapping.traceId
      && props.entryStateSha256 === mapping.entryStateSha256
      && isSourceStaticBehaviorCompositeCaptureRequest(props, mapping),
  );
}

function ParentCompositeEvidenceRenderer({
  mapping,
  props,
}: {
  mapping: ParentCompositeCapture;
  props: AnimationRendererProps;
}) {
  const behaviorCompositeState =
    `${mapping.behaviorCompositeStatePrefix}${String(props.frame).padStart(3, "0")}`;
  const sourceState = useMemo(() => {
    const base = parentCompositeCandidate.getFrameState(mapping.sourceFrame, {
      frameDomain: mapping.sourceFrameDomain,
      scenario: mapping.sourceScenario,
      lang: mapping.language,
      seed: props.seed,
    });
    return Object.freeze({
      ...base,
      behaviorCompositeContractId: mapping.behaviorCompositeContractId,
      behaviorCompositeState,
    });
  }, [behaviorCompositeState, mapping, props.seed]);
  return (
    <SourceStaticBehaviorCompositeCapture
      mapping={mapping}
      props={props}
      sourceState={sourceState}
      SourceRenderer={ParentCompositeSourceRenderer}
    />
  );
}

function NaturalParentCompositeEvidenceRenderer({
  mapping,
  props,
}: {
  mapping: NaturalParentCompositeCapture;
  props: AnimationRendererProps;
}) {
  const behaviorCompositeState =
    `${mapping.behaviorCompositeStatePrefix}${String(props.frame).padStart(3, "0")}`;
  const sourceState = useMemo(() => {
    const base = naturalParentCompositeCandidate.getFrameState(
      mapping.sourceFrame,
      {
        frameDomain: mapping.sourceFrameDomain,
        scenario: mapping.sourceScenario,
        lang: mapping.language,
        seed: props.seed,
      },
    );
    return Object.freeze({
      ...base,
      behaviorCompositeContractId: mapping.behaviorCompositeContractId,
      behaviorCompositeState,
    });
  }, [behaviorCompositeState, mapping, props.seed]);
  return (
    <SourceStaticBehaviorCompositeCapture
      mapping={mapping}
      props={props}
      sourceState={sourceState}
      SourceRenderer={NaturalParentCompositeSourceRenderer}
    />
  );
}

function DirectCompanionCompositeEvidenceRenderer({
  mapping,
  props,
}: {
  mapping: DirectCompanionCompositeCapture;
  props: AnimationRendererProps;
}) {
  const selectedCandidate = directCompanionCandidates.get(mapping.assetKey);
  if (!selectedCandidate) {
    throw new Error(`Missing direct companion asset: ${mapping.assetKey}`);
  }
  const SourceRenderer = selectedCandidate.Renderer;
  const behaviorCompositeState =
    `${mapping.behaviorCompositeStatePrefix}${String(props.frame).padStart(3, "0")}`;
  const sourceState = useMemo(() => {
    const base = selectedCandidate.getFrameState(mapping.sourceFrame, {
      frameDomain: mapping.sourceFrameDomain,
      scenario: mapping.sourceScenario,
      lang: mapping.language,
      seed: props.seed,
    });
    return Object.freeze({
      ...base,
      behaviorCompositeContractId: mapping.behaviorCompositeContractId,
      behaviorCompositeState,
    });
  }, [behaviorCompositeState, mapping, props.seed, selectedCandidate]);
  return (
    <SourceStaticBehaviorCompositeCapture
      mapping={mapping}
      props={props}
      sourceState={sourceState}
      SourceRenderer={SourceRenderer}
    />
  );
}

export function getCourseG04L03Vb007FrameState(
  frame: number,
  context: Parameters<typeof candidate.getFrameState>[1],
) {
  const base = candidate.getFrameState(frame, context);
  const request = {
    entryStateSha256: context.entryStateSha256,
    frame,
    frameDomain: context.frameDomain,
    lang: context.lang,
    requirementId: context.requirementId,
    scenario: context.scenario,
    traceId: context.traceId,
  };
  const mapping = findParentCompositeCapture(request)
    ?? findNaturalParentCompositeCapture(request)
    ?? findDirectCompanionCompositeCapture(request);
  if (!mapping) return base;
  return Object.freeze({
    ...base,
    blocker: null,
    exportFrame: null,
    frame,
    frameDomain: mapping.frameDomain,
    language: mapping.language,
    rootFrame: mapping.rootEntryFrame,
    scenario: mapping.scenario,
    sourceStaticVisualReady: true,
    status: "ready" as const,
    visibleSourceMarkers: Object.freeze([
      `${mapping.frameDomain}-path-${mapping.pathIndex}-source-behavior-composite-frame-${frame}`,
    ]),
  });
}

export function CourseG04L03Vb007Renderer(props: AnimationRendererProps) {
  const directMapping = findDirectCompanionCompositeCapture(props);
  if (directMapping) {
    return (
      <DirectCompanionCompositeEvidenceRenderer
        mapping={directMapping}
        props={props}
      />
    );
  }
  const naturalMapping = findNaturalParentCompositeCapture(props);
  if (naturalMapping) {
    return (
      <NaturalParentCompositeEvidenceRenderer
        mapping={naturalMapping}
        props={props}
      />
    );
  }
  const mapping = findParentCompositeCapture(props);
  return mapping
    ? <ParentCompositeEvidenceRenderer mapping={mapping} props={props} />
    : <functionalCandidate.Renderer {...props} />;
}

export {COURSE_G04_L03_VB_007_SOURCE};
export const COURSE_G04_L03_VB_007_MOVIE = candidate.movie;
export const COURSE_G04_L03_VB_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_VB_007_SOURCE_CONTRACT = Object.freeze({
  ...functionalCandidate.sourceContract,
  parentCompositeCaptureStatus:
    "three-source-static-placement-paths-current-js-only",
  parentCompositeAsset: Object.freeze({
    path: COURSE_G04_L03_VB_007_PARENT_COMPOSITE_CONFIG.assetSource,
    sha256: COURSE_G04_L03_VB_007_PARENT_COMPOSITE_CONFIG.assetSha256,
    manifest:
      "public/flash-assets/courses/course-g04-l03-vb-007-parent-composite/manifest.json",
    report: "reports/g4-l3-parent-composite-assets.json",
  }),
  naturalParentCompositeCaptureStatus:
    "two-source-static-parent-domains-current-js-only",
  naturalParentCompositeAsset: Object.freeze({
    path: COURSE_G04_L03_VB_007_NATURAL_PARENT_COMPOSITE_CONFIG.assetSource,
    sha256:
      COURSE_G04_L03_VB_007_NATURAL_PARENT_COMPOSITE_CONFIG.assetSha256,
    manifest:
      "public/flash-assets/courses/course-g04-l03-vb-007-natural-parent-composite/manifest.json",
    report: "reports/g4-l3-natural-parent-composite-assets.json",
  }),
  directCompanionCompositeCaptureStatus:
    "seven-source-static-direct-companion-domains-current-js-only",
  directCompanionCompositeAssets:
    COURSE_G04_L03_VB_007_DIRECT_COMPANION_COMPOSITE_CONFIGS.map((config) =>
      Object.freeze({
        path: config.assetSource,
        sha256: config.assetSha256,
        report: "reports/g4-l3-natural-parent-composite-assets.json",
      })),
  visibleCompanionAudioStatus:
    "nine-exact-source-payload-local-domain-candidates-listening-and-runtime-sync-pending",
  visibleCompanionAudioReport:
    "reports/g4-l3-visible-companion-audio-candidates.json",
  unresolvedCompanionAudioCueCount: 1,
  visibleCompanionPlaybackStatus:
    "deterministic-local-domain-only-parent-and-root-synchronization-pending",
  originalRuntimeAuthorityEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G04_L03_VB_007_SCENARIOS = Object.freeze([
  ...candidate.scenarios,
  Object.freeze({
    id: "source-static-reachable-domain",
    label: "Source-static reachable companion diagnostic",
    description:
      "English-only exact placement-path inspection; not original runtime or fidelity acceptance.",
  }),
]);
export const normalizeCourseG04L03Vb007Frame = candidate.normalizeFrame;
export const buildCourseG04L03Vb007CaptureAttributes =
  candidate.buildCaptureAttributes;

export default Object.freeze({
  ...functionalCandidate.module,
  audioCues: Object.freeze([
    ...functionalCandidate.module.audioCues,
    ...visibleCompanionAudioCandidates,
  ]),
  playbackEndFrameByDomain: Object.freeze({
    ...functionalCandidate.module.playbackEndFrameByDomain,
    ...visibleCompanionPlaybackEndFrameByDomain,
  }),
  defaultScenarioByFrameDomain: Object.freeze({
    ...functionalCandidate.module.defaultScenarioByFrameDomain,
    "sprite-136": "source-static-reachable-domain",
    "sprite-142": "source-static-reachable-domain",
    "sprite-166": "source-static-reachable-domain",
    "sprite-176": "source-static-reachable-domain",
    "sprite-45": "source-static-reachable-domain",
    "sprite-63": "source-static-reachable-domain",
    "sprite-77": "source-static-reachable-domain",
    "sprite-105": "source-static-reachable-domain",
    "sprite-202": "source-static-reachable-domain",
    "sprite-234": "source-static-reachable-domain",
    "sprite-267": "source-static-reachable-domain",
  }),
  scenarios: COURSE_G04_L03_VB_007_SCENARIOS,
  getFrameState: getCourseG04L03Vb007FrameState,
  Renderer: CourseG04L03Vb007Renderer,
});
