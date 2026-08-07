import type {AnimationLanguage} from "../contract";
import type {
  KeytermPlaybackDisposition,
  LessonHostRequest,
} from "../lesson-host-contract";

export interface CourseG04L03SourceGlossaryBounds {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

export interface CourseG04L03SourceGlossaryTerm {
  readonly id: string;
  readonly keyAttribute: string;
  readonly characterId: number;
  readonly firstFrame: number;
  readonly lastFrame: number;
  readonly depth: number;
  readonly sourceBounds: CourseG04L03SourceGlossaryBounds;
  readonly entryIds: Readonly<Record<AnimationLanguage, string>>;
  readonly labels: Readonly<Record<AnimationLanguage, string>>;
}

export interface CourseG04L03SourceGlossaryConfig {
  readonly animationId: string;
  readonly frameDomain: string;
  readonly terms: readonly CourseG04L03SourceGlossaryTerm[];
  readonly playbackDisposition?: KeytermPlaybackDisposition;
  readonly sourceAction: "DoHyperLinks";
  readonly sourceStopTarget: "_root.animation_mc.animation.stop()";
  readonly glossaryAuthority:
    "grade-wide-shell-keyterms-static-candidate";
  readonly glossarySourceDisposition: "unresolved-lesson-vs-grade-wide";
}

export interface CourseG04L03SourceGlossaryOpenResult {
  readonly request: Extract<LessonHostRequest, {type: "open-keyterm"}>;
  readonly term: CourseG04L03SourceGlossaryTerm;
  readonly observedFrame: number;
  readonly sourceAction: CourseG04L03SourceGlossaryConfig["sourceAction"];
  readonly sourceStopTarget:
    CourseG04L03SourceGlossaryConfig["sourceStopTarget"];
}

function normalizeFrame(frame: number) {
  return Number.isFinite(frame) ? Math.max(1, Math.trunc(frame)) : null;
}

export function visibleCourseG04L03SourceGlossaryTerms(
  config: CourseG04L03SourceGlossaryConfig,
  frame: number,
): readonly CourseG04L03SourceGlossaryTerm[] {
  const observedFrame = normalizeFrame(frame);
  if (observedFrame === null) return Object.freeze([]);
  return Object.freeze(
    config.terms.filter(
      (term) =>
        observedFrame >= term.firstFrame && observedFrame <= term.lastFrame,
    ),
  );
}

/**
 * Converts a source-observed KeyAttribute release into a typed, inert host
 * request. It never evaluates ActionScript, mutates `_global`, opens a legacy
 * URL, or reads lesson storage. The product host remains responsible for
 * accepting the request and presenting a reviewed modern Key Terms surface.
 */
export function createCourseG04L03SourceGlossaryOpenResult({
  config,
  frame,
  lang,
  termId,
}: {
  readonly config: CourseG04L03SourceGlossaryConfig;
  readonly frame: number;
  readonly lang: AnimationLanguage;
  readonly termId: string;
}): CourseG04L03SourceGlossaryOpenResult | null {
  const observedFrame = normalizeFrame(frame);
  if (observedFrame === null) return null;
  const term = visibleCourseG04L03SourceGlossaryTerms(
    config,
    observedFrame,
  ).find((candidate) => candidate.id === termId);
  if (!term) return null;
  const entryId = term.entryIds[lang];
  if (!entryId) return null;
  const request: Extract<LessonHostRequest, {type: "open-keyterm"}> =
    config.playbackDisposition
      ? Object.freeze({
          type: "open-keyterm",
          entryId,
          sourceAnimationId: config.animationId,
          playbackDisposition: config.playbackDisposition,
        })
      : Object.freeze({
          type: "open-keyterm",
          entryId,
          sourceAnimationId: config.animationId,
        });
  return Object.freeze({
    request,
    term,
    observedFrame,
    sourceAction: config.sourceAction,
    sourceStopTarget: config.sourceStopTarget,
  });
}

export function validateCourseG04L03SourceGlossaryConfig(
  config: CourseG04L03SourceGlossaryConfig,
) {
  if (
    !config.animationId ||
    !config.frameDomain ||
    config.sourceAction !== "DoHyperLinks" ||
    config.sourceStopTarget !== "_root.animation_mc.animation.stop()" ||
    config.glossaryAuthority !==
      "grade-wide-shell-keyterms-static-candidate" ||
    config.glossarySourceDisposition !== "unresolved-lesson-vs-grade-wide" ||
    (config.playbackDisposition !== undefined &&
      config.playbackDisposition !== "reversible-support-pause" &&
      config.playbackDisposition !==
        "source-stop-timeline-and-audio-until-explicit-resume") ||
    config.terms.length < 1
  ) {
    throw new TypeError("Invalid source glossary candidate configuration");
  }
  const ids = new Set<string>();
  for (const term of config.terms) {
    const bounds = term.sourceBounds;
    if (
      !term.id ||
      ids.has(term.id) ||
      !term.keyAttribute ||
      !Number.isSafeInteger(term.characterId) ||
      !Number.isSafeInteger(term.firstFrame) ||
      !Number.isSafeInteger(term.lastFrame) ||
      !Number.isSafeInteger(term.depth) ||
      term.firstFrame < 1 ||
      term.lastFrame < term.firstFrame ||
      !Number.isFinite(bounds.left) ||
      !Number.isFinite(bounds.right) ||
      !Number.isFinite(bounds.top) ||
      !Number.isFinite(bounds.bottom) ||
      bounds.right <= bounds.left ||
      bounds.bottom <= bounds.top ||
      !term.entryIds.en ||
      !term.entryIds.es ||
      !term.labels.en ||
      !term.labels.es
    ) {
      throw new TypeError(
        `Invalid source glossary term configuration: ${term.id || "unknown"}`,
      );
    }
    ids.add(term.id);
  }
  return config;
}
