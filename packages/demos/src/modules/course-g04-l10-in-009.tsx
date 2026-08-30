"use client";

import type {AudioCue, AudioTrack} from "../contract";
import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {
  COURSE_G04_L10_IN_009_CONFIG,
  COURSE_G04_L10_IN_009_SOURCE,
} from "../timelines/course-g04-l10-in-009";

export const COURSE_G04_L10_IN_009_GLOSSARY_TERMS = Object.freeze([
  Object.freeze({
    id: "area",
    sourceKeyAttribute: "Area",
    sourceCharacterId: 10,
    firstFrame: 1,
    labels: Object.freeze({en: "Area", es: "Área"}),
  }),
  Object.freeze({
    id: "surface",
    sourceKeyAttribute: "Surface",
    sourceCharacterId: 11,
    firstFrame: 1,
    labels: Object.freeze({en: "Surface", es: "Superficie"}),
  }),
  Object.freeze({
    id: "shape",
    sourceKeyAttribute: "Shape",
    sourceCharacterId: 12,
    firstFrame: 1,
    labels: Object.freeze({en: "Shape", es: "Forma"}),
  }),
  Object.freeze({
    id: "length",
    sourceKeyAttribute: "Length",
    sourceCharacterId: 50,
    firstFrame: 167,
    labels: Object.freeze({en: "Length", es: "Longitud"}),
  }),
  Object.freeze({
    id: "width",
    sourceKeyAttribute: "Width",
    sourceCharacterId: 51,
    firstFrame: 167,
    labels: Object.freeze({en: "Width", es: "Anchura"}),
  }),
] as const);

export const COURSE_G04_L10_IN_009_PRIVATE_AUDIO_CUES: readonly AudioCue[] =
  Object.freeze([
    Object.freeze({
      id: "embedded-stream-0001",
      sourceCueId: "sprite-89-soundstream-1",
      frame: 1,
      endFrame: 954,
      frameDomain: "sprite-89",
      language: "en" as const,
      scenario: "source-static-frame",
      source:
        "/flash-assets/courses/course-g04-l10-in-009/audio/embedded-stream-0001.mp3?sha256=2e124e6fc4fff6b6ca4de03cedb7f6df4e9d3d0ff8436cedb777a71c64cf0334",
      durationMs: 79386,
      sha256:
        "2e124e6fc4fff6b6ca4de03cedb7f6df4e9d3d0ff8436cedb777a71c64cf0334",
      spokenLanguage: "undetermined" as const,
    }),
  ]);

export const COURSE_G04_L10_IN_009_PRIVATE_AUDIO_TRACKS: readonly AudioTrack[] =
  Object.freeze([
    Object.freeze({
      id: "spanish-host-narration",
      language: "es" as const,
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l10-in-009/audio/spanish-host-narration.mp3?sha256=a845df10e8c1e754a481f3c3ef1e7314ad9c9a60e1106c6b1c43e16b21ace4d6",
      durationMs: 43824,
      sha256:
        "a845df10e8c1e754a481f3c3ef1e7314ad9c9a60e1106c6b1c43e16b21ace4d6",
      activation: "user" as const,
      visibleWhen: Object.freeze(["es" as const]),
      frameDomains: Object.freeze(["sprite-89"]),
      timelineBehavior: "pause-while-playing" as const,
    }),
  ]);

const candidate = createPrivateSourceStaticGlossaryCandidate(
  COURSE_G04_L10_IN_009_CONFIG,
  Object.freeze({
    calibrationId: "g4-l10-candidate-to-product-v29",
    companionSurfaceId: "g4-l10-in009-glossary",
    glossaryTerms: COURSE_G04_L10_IN_009_GLOSSARY_TERMS,
    audioCues: COURSE_G04_L10_IN_009_PRIVATE_AUDIO_CUES,
    audioTracks: COURSE_G04_L10_IN_009_PRIVATE_AUDIO_TRACKS,
  }),
);

export {COURSE_G04_L10_IN_009_SOURCE};
export const COURSE_G04_L10_IN_009_MOVIE = candidate.movie;
export const COURSE_G04_L10_IN_009_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_IN_009_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_IN_009_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10In009Frame = candidate.normalizeFrame;
export const getCourseG04L10In009FrameState = candidate.getFrameState;
export const buildCourseG04L10In009CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10In009Renderer = candidate.Renderer;

export default candidate.module;
