"use client";

import type {AudioCue, AudioTrack} from "../contract";
import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {
  COURSE_G04_L10_VB_010_CONFIG,
  COURSE_G04_L10_VB_010_SOURCE,
} from "../timelines/course-g04-l10-vb-010";

export const COURSE_G04_L10_VB_010_GLOSSARY_TERMS = Object.freeze([
  Object.freeze({
    id: "square-unit",
    sourceKeyAttribute: "Square unit",
    sourceCharacterId: 10,
    firstFrame: 4,
    labels: Object.freeze({en: "Square unit", es: "Unidad cuadrada"}),
  }),
  Object.freeze({
    id: "square",
    sourceKeyAttribute: "Square",
    sourceCharacterId: 11,
    firstFrame: 4,
    labels: Object.freeze({en: "Square", es: "Cuadrado"}),
  }),
  Object.freeze({
    id: "measure",
    sourceKeyAttribute: "Measure",
    sourceCharacterId: 12,
    firstFrame: 4,
    labels: Object.freeze({en: "Measure", es: "Medir"}),
  }),
  Object.freeze({
    id: "unit",
    sourceKeyAttribute: "Unit",
    sourceCharacterId: 13,
    firstFrame: 4,
    labels: Object.freeze({en: "Unit", es: "Unidad"}),
  }),
  Object.freeze({
    id: "area",
    sourceKeyAttribute: "Area",
    sourceCharacterId: 33,
    firstFrame: 63,
    labels: Object.freeze({en: "Area", es: "Área"}),
  }),
] as const);

export const COURSE_G04_L10_VB_010_PRIVATE_AUDIO_CUES: readonly AudioCue[] =
  Object.freeze([
    Object.freeze({
      id: "embedded-stream-0001",
      sourceCueId: "sprite-36-soundstream-1",
      frame: 3,
      endFrame: 129,
      frameDomain: "sprite-36",
      language: "en" as const,
      scenario: "source-static-frame",
      source:
        "/flash-assets/courses/course-g04-l10-vb-010/audio/embedded-stream-0001.mp3?sha256=a75e01d6a5e30f1f665c8ba31776ea7396129d449d804834f06370979f79132b",
      durationMs: 10475,
      sha256:
        "a75e01d6a5e30f1f665c8ba31776ea7396129d449d804834f06370979f79132b",
      spokenLanguage: "undetermined" as const,
    }),
  ]);

export const COURSE_G04_L10_VB_010_PRIVATE_AUDIO_TRACKS: readonly AudioTrack[] =
  Object.freeze([
    Object.freeze({
      id: "spanish-host-narration",
      language: "es" as const,
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l10-vb-010/audio/spanish-host-narration.mp3?sha256=60cbeacba48c3db11409fef5732336ffbfd04f6d3da7572b891284ac991ee33c",
      durationMs: 13152,
      sha256:
        "60cbeacba48c3db11409fef5732336ffbfd04f6d3da7572b891284ac991ee33c",
      activation: "user" as const,
      visibleWhen: Object.freeze(["es" as const]),
      frameDomains: Object.freeze(["sprite-36"]),
      timelineBehavior: "pause-while-playing" as const,
    }),
  ]);

const candidate = createPrivateSourceStaticGlossaryCandidate(
  COURSE_G04_L10_VB_010_CONFIG,
  Object.freeze({
    calibrationId: "g4-l10-candidate-to-product-v13",
    companionSurfaceId: "g4-l10-vb010-glossary",
    glossaryTerms: COURSE_G04_L10_VB_010_GLOSSARY_TERMS,
    audioCues: COURSE_G04_L10_VB_010_PRIVATE_AUDIO_CUES,
    audioTracks: COURSE_G04_L10_VB_010_PRIVATE_AUDIO_TRACKS,
  }),
);

export {COURSE_G04_L10_VB_010_SOURCE};
export const COURSE_G04_L10_VB_010_MOVIE = candidate.movie;
export const COURSE_G04_L10_VB_010_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_VB_010_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_VB_010_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Vb010Frame = candidate.normalizeFrame;
export const getCourseG04L10Vb010FrameState = candidate.getFrameState;
export const buildCourseG04L10Vb010CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Vb010Renderer = candidate.Renderer;

export default candidate.module;
