"use client";

import type {AudioCue, AudioTrack} from "../contract";
import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {
  COURSE_G04_L10_VB_011_CONFIG,
  COURSE_G04_L10_VB_011_SOURCE,
} from "../timelines/course-g04-l10-vb-011";

export const COURSE_G04_L10_VB_011_GLOSSARY_TERMS = Object.freeze([
  Object.freeze({
    id: "formula",
    sourceKeyAttribute: "Formula",
    sourceCharacterId: 10,
    firstFrame: 4,
    labels: Object.freeze({en: "Formula", es: "Fórmula"}),
  }),
  Object.freeze({
    id: "equation",
    sourceKeyAttribute: "Equation",
    sourceCharacterId: 11,
    firstFrame: 4,
    labels: Object.freeze({en: "Equation", es: "Ecuaciòn"}),
  }),
] as const);

export const COURSE_G04_L10_VB_011_PRIVATE_AUDIO_CUES: readonly AudioCue[] =
  Object.freeze([
    Object.freeze({
      id: "embedded-stream-0001",
      sourceCueId: "sprite-31-soundstream-1",
      frame: 2,
      endFrame: 154,
      frameDomain: "sprite-31",
      language: "en" as const,
      scenario: "source-static-frame",
      source:
        "/flash-assets/courses/course-g04-l10-vb-011/audio/embedded-stream-0001.mp3?sha256=ab8c00ecbf6c90d284a295fee5a785fc7e3478490382fcda0b7064be1bfd1e66",
      durationMs: 12643,
      sha256:
        "ab8c00ecbf6c90d284a295fee5a785fc7e3478490382fcda0b7064be1bfd1e66",
      spokenLanguage: "undetermined" as const,
    }),
  ]);

export const COURSE_G04_L10_VB_011_PRIVATE_AUDIO_TRACKS: readonly AudioTrack[] =
  Object.freeze([
    Object.freeze({
      id: "spanish-host-narration",
      language: "es" as const,
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l10-vb-011/audio/spanish-host-narration.mp3?sha256=1508e26d670d3f53a9e5f3d2b3945c8167d1ba8cd0e7a1959bf726fcb203e87f",
      durationMs: 13368,
      sha256:
        "1508e26d670d3f53a9e5f3d2b3945c8167d1ba8cd0e7a1959bf726fcb203e87f",
      activation: "user" as const,
      visibleWhen: Object.freeze(["es" as const]),
      frameDomains: Object.freeze(["sprite-31"]),
      timelineBehavior: "pause-while-playing" as const,
    }),
  ]);

const candidate = createPrivateSourceStaticGlossaryCandidate(
  COURSE_G04_L10_VB_011_CONFIG,
  Object.freeze({
    calibrationId: "g4-l10-candidate-to-product-v5",
    companionSurfaceId: "g4-l10-vb011-glossary",
    glossaryTerms: COURSE_G04_L10_VB_011_GLOSSARY_TERMS,
    audioCues: COURSE_G04_L10_VB_011_PRIVATE_AUDIO_CUES,
    audioTracks: COURSE_G04_L10_VB_011_PRIVATE_AUDIO_TRACKS,
  }),
);

export {COURSE_G04_L10_VB_011_SOURCE};
export const COURSE_G04_L10_VB_011_MOVIE = candidate.movie;
export const COURSE_G04_L10_VB_011_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_VB_011_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_VB_011_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Vb011Frame = candidate.normalizeFrame;
export const getCourseG04L10Vb011FrameState = candidate.getFrameState;
export const buildCourseG04L10Vb011CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Vb011Renderer = candidate.Renderer;

export default candidate.module;
