"use client";

import type {AudioCue, AudioTrack} from "../contract";
import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {
  COURSE_G04_L10_TS_005_CONFIG,
  COURSE_G04_L10_TS_005_SOURCE,
} from "../timelines/course-g04-l10-ts-005";

export const COURSE_G04_L10_TS_005_GLOSSARY_TERMS = Object.freeze([
  Object.freeze({
    id: "strategy",
    sourceKeyAttribute: "strategy",
    sourceCharacterId: 22,
    firstFrame: 106,
    labels: Object.freeze({en: "Strategy", es: "Estrategia"}),
  }),
  Object.freeze({
    id: "equation",
    sourceKeyAttribute: "equation",
    sourceCharacterId: 26,
    firstFrame: 144,
    labels: Object.freeze({en: "Equation", es: "Ecuaciòn"}),
  }),
  Object.freeze({
    id: "pattern",
    sourceKeyAttribute: "Pattern",
    sourceCharacterId: 27,
    firstFrame: 144,
    labels: Object.freeze({en: "Pattern", es: "Patrón"}),
  }),
  Object.freeze({
    id: "simple-simpler-simplest",
    sourceKeyAttribute: "Simple / Simpler / Simplest",
    sourceCharacterId: 28,
    firstFrame: 144,
    labels: Object.freeze({
      en: "Simple / Simpler / Simplest",
      es: "Simple / Más Simple / El Más Simple",
    }),
  }),
  Object.freeze({
    id: "table",
    sourceKeyAttribute: "Table",
    sourceCharacterId: 29,
    firstFrame: 144,
    labels: Object.freeze({en: "Table", es: "Cuadro"}),
  }),
] as const);

export const COURSE_G04_L10_TS_005_PRIVATE_AUDIO_CUES: readonly AudioCue[] =
  Object.freeze([
    Object.freeze({
      id: "embedded-stream-0001",
      sourceCueId: "sprite-32-soundstream-1",
      frame: 1,
      endFrame: 235,
      frameDomain: "sprite-32",
      language: "en" as const,
      scenario: "source-static-frame",
      source:
        "/flash-assets/courses/course-g04-l10-ts-005/audio/embedded-stream-0001.mp3?sha256=8fcd79a8d7ba008b1f8846485c14f5c6e9277dc2dae07a3decf92e903025680d",
      durationMs: 19461,
      sha256:
        "8fcd79a8d7ba008b1f8846485c14f5c6e9277dc2dae07a3decf92e903025680d",
      spokenLanguage: "undetermined" as const,
    }),
  ]);

export const COURSE_G04_L10_TS_005_PRIVATE_AUDIO_TRACKS: readonly AudioTrack[] =
  Object.freeze([
    Object.freeze({
      id: "spanish-host-narration",
      language: "es" as const,
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l10-ts-005/audio/spanish-host-narration.mp3?sha256=153f3ec94840fbc958e67c5209abdc25e403c0afe9424529e80343befd8c3c6c",
      durationMs: 15240,
      sha256:
        "153f3ec94840fbc958e67c5209abdc25e403c0afe9424529e80343befd8c3c6c",
      activation: "user" as const,
      visibleWhen: Object.freeze(["es" as const]),
      frameDomains: Object.freeze(["sprite-32"]),
      timelineBehavior: "pause-while-playing" as const,
    }),
  ]);

const candidate = createPrivateSourceStaticGlossaryCandidate(
  COURSE_G04_L10_TS_005_CONFIG,
  Object.freeze({
    calibrationId: "g4-l10-candidate-to-product-v17",
    companionSurfaceId: "g4-l10-ts005-glossary",
    glossaryTerms: COURSE_G04_L10_TS_005_GLOSSARY_TERMS,
    audioCues: COURSE_G04_L10_TS_005_PRIVATE_AUDIO_CUES,
    audioTracks: COURSE_G04_L10_TS_005_PRIVATE_AUDIO_TRACKS,
  }),
);

export {COURSE_G04_L10_TS_005_SOURCE};
export const COURSE_G04_L10_TS_005_MOVIE = candidate.movie;
export const COURSE_G04_L10_TS_005_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_TS_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_TS_005_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Ts005Frame = candidate.normalizeFrame;
export const getCourseG04L10Ts005FrameState = candidate.getFrameState;
export const buildCourseG04L10Ts005CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Ts005Renderer = candidate.Renderer;

export default candidate.module;
