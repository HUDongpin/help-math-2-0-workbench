"use client";

import type {AudioCue, AudioTrack} from "../contract";
import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {
  COURSE_G04_L10_VB_008_CONFIG,
  COURSE_G04_L10_VB_008_SOURCE,
} from "../timelines/course-g04-l10-vb-008";

export const COURSE_G04_L10_VB_008_GLOSSARY_TERMS = Object.freeze([
  Object.freeze({
    id: "perimeter",
    sourceKeyAttribute: "Perimeter",
    sourceCharacterId: 10,
    firstFrame: 4,
    labels: Object.freeze({en: "Perimeter", es: "Perímetro"}),
  }),
  Object.freeze({
    id: "distance",
    sourceKeyAttribute: "Distance",
    sourceCharacterId: 11,
    firstFrame: 4,
    labels: Object.freeze({en: "Distance", es: "Distancia"}),
  }),
  Object.freeze({
    id: "around",
    sourceKeyAttribute: "Around",
    sourceCharacterId: 12,
    firstFrame: 4,
    labels: Object.freeze({en: "Around", es: "Alrededor"}),
  }),
  Object.freeze({
    id: "shape",
    sourceKeyAttribute: "Shape",
    sourceCharacterId: 13,
    firstFrame: 4,
    labels: Object.freeze({en: "Shape", es: "Forma"}),
  }),
  Object.freeze({
    id: "rectangle",
    sourceKeyAttribute: "Rectangle",
    sourceCharacterId: 50,
    firstFrame: 265,
    labels: Object.freeze({en: "Rectangle", es: "Rectángulo"}),
  }),
  Object.freeze({
    id: "unit-of-measurement",
    sourceKeyAttribute: "Unit of measurement",
    sourceCharacterId: 53,
    firstFrame: 329,
    labels: Object.freeze({en: "Unit of measurement", es: "Unidad de medición"}),
  }),
  Object.freeze({
    id: "measure",
    sourceKeyAttribute: "Measure",
    sourceCharacterId: 59,
    firstFrame: 383,
    labels: Object.freeze({en: "Measure", es: "Medir"}),
  }),
  Object.freeze({
    id: "side",
    sourceKeyAttribute: "Side",
    sourceCharacterId: 60,
    firstFrame: 383,
    labels: Object.freeze({en: "Side", es: "Lado"}),
  }),
] as const);

export const COURSE_G04_L10_VB_008_PRIVATE_AUDIO_CUES: readonly AudioCue[] =
  Object.freeze([
    Object.freeze({
      id: "embedded-stream-0001",
      sourceCueId: "sprite-62-soundstream-1",
      frame: 5,
      endFrame: 414,
      frameDomain: "sprite-62",
      language: "en" as const,
      scenario: "source-static-frame",
      source:
        "/flash-assets/courses/course-g04-l10-vb-008/audio/embedded-stream-0001.mp3?sha256=905f086003308e1769b8e4ab30a0fcaf9483fe73d56620c32f05dfc3ffcb6ab7",
      durationMs: 24059,
      sha256:
        "905f086003308e1769b8e4ab30a0fcaf9483fe73d56620c32f05dfc3ffcb6ab7",
      spokenLanguage: "undetermined" as const,
    }),
  ]);

export const COURSE_G04_L10_VB_008_PRIVATE_AUDIO_TRACKS: readonly AudioTrack[] =
  Object.freeze([
    Object.freeze({
      id: "spanish-host-narration",
      language: "es" as const,
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l10-vb-008/audio/spanish-host-narration.mp3?sha256=411a95e4132bda8195b03ef0617443895c14c279992c8421ea70e48f86048e4b",
      durationMs: 28368,
      sha256:
        "411a95e4132bda8195b03ef0617443895c14c279992c8421ea70e48f86048e4b",
      activation: "user" as const,
      visibleWhen: Object.freeze(["es" as const]),
      frameDomains: Object.freeze(["sprite-62"]),
      timelineBehavior: "pause-while-playing" as const,
    }),
  ]);

const candidate = createPrivateSourceStaticGlossaryCandidate(
  COURSE_G04_L10_VB_008_CONFIG,
  Object.freeze({
    calibrationId: "g4-l10-candidate-to-product-v21",
    companionSurfaceId: "g4-l10-vb008-glossary",
    glossaryTerms: COURSE_G04_L10_VB_008_GLOSSARY_TERMS,
    audioCues: COURSE_G04_L10_VB_008_PRIVATE_AUDIO_CUES,
    audioTracks: COURSE_G04_L10_VB_008_PRIVATE_AUDIO_TRACKS,
  }),
);

export {COURSE_G04_L10_VB_008_SOURCE};
export const COURSE_G04_L10_VB_008_MOVIE = candidate.movie;
export const COURSE_G04_L10_VB_008_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_VB_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_VB_008_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Vb008Frame = candidate.normalizeFrame;
export const getCourseG04L10Vb008FrameState = candidate.getFrameState;
export const buildCourseG04L10Vb008CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Vb008Renderer = candidate.Renderer;

export default candidate.module;
