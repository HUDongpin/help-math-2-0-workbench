"use client";

import type {AudioCue, AudioTrack} from "../contract";
import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {
  COURSE_G04_L10_TS_002_CONFIG,
  COURSE_G04_L10_TS_002_SOURCE,
} from "../timelines/course-g04-l10-ts-002";

export const COURSE_G04_L10_TS_002_GLOSSARY_TERMS = Object.freeze([
  Object.freeze({
    id: "restate",
    sourceKeyAttribute: "Restate",
    sourceCharacterId: 16,
    firstFrame: 93,
    labels: Object.freeze({en: "Restate", es: "Replantear"}),
  }),
  Object.freeze({
    id: "question",
    sourceKeyAttribute: "question",
    sourceCharacterId: 17,
    firstFrame: 93,
    labels: Object.freeze({en: "Question", es: "Pregunta"}),
  }),
  Object.freeze({
    id: "problem",
    sourceKeyAttribute: "problem",
    sourceCharacterId: 23,
    firstFrame: 142,
    labels: Object.freeze({en: "Problem", es: "Problema"}),
  }),
] as const);

export const COURSE_G04_L10_TS_002_PRIVATE_AUDIO_CUES: readonly AudioCue[] =
  Object.freeze([
    Object.freeze({
      id: "embedded-stream-0001",
      sourceCueId: "sprite-29-soundstream-1",
      frame: 1,
      endFrame: 325,
      frameDomain: "sprite-29",
      language: "en" as const,
      scenario: "source-static-frame",
      source:
        "/flash-assets/courses/course-g04-l10-ts-002/audio/embedded-stream-0001.mp3?sha256=fcec76dfe76c74823aa819fce5e08f7f7f322a014dc38d7561f39a688534a556",
      durationMs: 26984,
      sha256:
        "fcec76dfe76c74823aa819fce5e08f7f7f322a014dc38d7561f39a688534a556",
      spokenLanguage: "undetermined" as const,
    }),
  ]);

export const COURSE_G04_L10_TS_002_PRIVATE_AUDIO_TRACKS: readonly AudioTrack[] =
  Object.freeze([
    Object.freeze({
      id: "spanish-host-narration",
      language: "es" as const,
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l10-ts-002/audio/spanish-host-narration.mp3?sha256=148a963e1d0e87136cc65b36a73d97625170f53865842c6a12cda2a94c7df576",
      durationMs: 20592,
      sha256:
        "148a963e1d0e87136cc65b36a73d97625170f53865842c6a12cda2a94c7df576",
      activation: "user" as const,
      visibleWhen: Object.freeze(["es" as const]),
      frameDomains: Object.freeze(["sprite-29"]),
      timelineBehavior: "pause-while-playing" as const,
    }),
  ]);

const candidate = createPrivateSourceStaticGlossaryCandidate(
  COURSE_G04_L10_TS_002_CONFIG,
  Object.freeze({
    calibrationId: "g4-l10-candidate-to-product-v9",
    companionSurfaceId: "g4-l10-ts002-glossary",
    glossaryTerms: COURSE_G04_L10_TS_002_GLOSSARY_TERMS,
    audioCues: COURSE_G04_L10_TS_002_PRIVATE_AUDIO_CUES,
    audioTracks: COURSE_G04_L10_TS_002_PRIVATE_AUDIO_TRACKS,
  }),
);

export {COURSE_G04_L10_TS_002_SOURCE};
export const COURSE_G04_L10_TS_002_MOVIE = candidate.movie;
export const COURSE_G04_L10_TS_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_TS_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_TS_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Ts002Frame = candidate.normalizeFrame;
export const getCourseG04L10Ts002FrameState = candidate.getFrameState;
export const buildCourseG04L10Ts002CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Ts002Renderer = candidate.Renderer;

export default candidate.module;
