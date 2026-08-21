"use client";

import type {AudioCue, AudioTrack} from "../contract";
import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {
  COURSE_G04_L10_VB_002_CONFIG,
  COURSE_G04_L10_VB_002_SOURCE,
} from "../timelines/course-g04-l10-vb-002";

export const COURSE_G04_L10_VB_002_GLOSSARY_TERMS = Object.freeze([
  Object.freeze({
    id: "measure",
    sourceKeyAttribute: "Measure",
    sourceCharacterId: 10,
    firstFrame: 4,
    labels: Object.freeze({en: "Measure", es: "Medir"}),
  }),
  Object.freeze({
    id: "unit-of-measurement",
    sourceKeyAttribute: "Unit of measurement",
    sourceCharacterId: 17,
    firstFrame: 69,
    labels: Object.freeze({en: "Unit of measurement", es: "Unidad de medición"}),
  }),
  Object.freeze({
    id: "time",
    sourceKeyAttribute: "Time",
    sourceCharacterId: 18,
    firstFrame: 69,
    labels: Object.freeze({en: "Time", es: "Tiempo"}),
  }),
  Object.freeze({
    id: "width",
    sourceKeyAttribute: "Width",
    sourceCharacterId: 19,
    firstFrame: 69,
    labels: Object.freeze({en: "Width", es: "Anchura"}),
  }),
  Object.freeze({
    id: "length",
    sourceKeyAttribute: "Length",
    sourceCharacterId: 20,
    firstFrame: 69,
    labels: Object.freeze({en: "Length", es: "Longitud"}),
  }),
  Object.freeze({
    id: "weight",
    sourceKeyAttribute: "Weight",
    sourceCharacterId: 21,
    firstFrame: 69,
    labels: Object.freeze({en: "Weight", es: "Peso"}),
  }),
  Object.freeze({
    id: "capacity",
    sourceKeyAttribute: "Capacity",
    sourceCharacterId: 22,
    firstFrame: 69,
    labels: Object.freeze({en: "Capacity", es: "Capacidad"}),
  }),
  Object.freeze({
    id: "measurement",
    sourceKeyAttribute: "Measurement",
    sourceCharacterId: 31,
    firstFrame: 174,
    labels: Object.freeze({en: "Measurement", es: "Medición"}),
  }),
] as const);

export const COURSE_G04_L10_VB_002_PRIVATE_AUDIO_CUES: readonly AudioCue[] =
  Object.freeze([
    Object.freeze({
      id: "embedded-stream-0001",
      sourceCueId: "sprite-84-soundstream-1",
      frame: 4,
      endFrame: 281,
      frameDomain: "sprite-84",
      language: "en" as const,
      scenario: "source-static-frame",
      source:
        "/flash-assets/courses/course-g04-l10-vb-002/audio/embedded-stream-0001.mp3?sha256=d90fda16e08c6886e4bb1f851162c9ffde7747cf2c6ba532d291ed758197ebbf",
      durationMs: 23066,
      sha256:
        "d90fda16e08c6886e4bb1f851162c9ffde7747cf2c6ba532d291ed758197ebbf",
      spokenLanguage: "undetermined" as const,
    }),
  ]);

export const COURSE_G04_L10_VB_002_PRIVATE_AUDIO_TRACKS: readonly AudioTrack[] =
  Object.freeze([
    Object.freeze({
      id: "spanish-host-narration",
      language: "es" as const,
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l10-vb-002/audio/spanish-host-narration.mp3?sha256=d34075b7bbbf97a731f8fe133b4dea0304f5d69c1bfc825398ec43ff71244548",
      durationMs: 26880,
      sha256:
        "d34075b7bbbf97a731f8fe133b4dea0304f5d69c1bfc825398ec43ff71244548",
      activation: "user" as const,
      visibleWhen: Object.freeze(["es" as const]),
      frameDomains: Object.freeze(["sprite-84"]),
      timelineBehavior: "pause-while-playing" as const,
    }),
  ]);

const candidate = createPrivateSourceStaticGlossaryCandidate(
  COURSE_G04_L10_VB_002_CONFIG,
  Object.freeze({
    calibrationId: "g4-l10-candidate-to-product-v19",
    companionSurfaceId: "g4-l10-vb002-glossary",
    glossaryTerms: COURSE_G04_L10_VB_002_GLOSSARY_TERMS,
    audioCues: COURSE_G04_L10_VB_002_PRIVATE_AUDIO_CUES,
    audioTracks: COURSE_G04_L10_VB_002_PRIVATE_AUDIO_TRACKS,
  }),
);

export {COURSE_G04_L10_VB_002_SOURCE};
export const COURSE_G04_L10_VB_002_MOVIE = candidate.movie;
export const COURSE_G04_L10_VB_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_VB_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_VB_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Vb002Frame = candidate.normalizeFrame;
export const getCourseG04L10Vb002FrameState = candidate.getFrameState;
export const buildCourseG04L10Vb002CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Vb002Renderer = candidate.Renderer;

export default candidate.module;
