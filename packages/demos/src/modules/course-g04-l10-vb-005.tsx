"use client";

import type {AudioCue, AudioTrack} from "../contract";
import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {
  COURSE_G04_L10_VB_005_CONFIG,
  COURSE_G04_L10_VB_005_SOURCE,
} from "../timelines/course-g04-l10-vb-005";

export const COURSE_G04_L10_VB_005_GLOSSARY_TERMS = Object.freeze([
  Object.freeze({
    id: "width",
    sourceKeyAttribute: "Width",
    sourceCharacterId: 10,
    firstFrame: 4,
    labels: Object.freeze({en: "Width", es: "Anchura"}),
  }),
  Object.freeze({
    id: "measure",
    sourceKeyAttribute: "Measure",
    sourceCharacterId: 11,
    firstFrame: 4,
    labels: Object.freeze({en: "Measure", es: "Medir"}),
  }),
  Object.freeze({
    id: "distance",
    sourceKeyAttribute: "Distance",
    sourceCharacterId: 12,
    firstFrame: 4,
    labels: Object.freeze({en: "Distance", es: "Distancia"}),
  }),
  Object.freeze({
    id: "side",
    sourceKeyAttribute: "Side",
    sourceCharacterId: 13,
    firstFrame: 4,
    labels: Object.freeze({en: "Side", es: "Lado"}),
  }),
  Object.freeze({
    id: "shape",
    sourceKeyAttribute: "Shape",
    sourceCharacterId: 14,
    firstFrame: 4,
    labels: Object.freeze({en: "Shape", es: "Forma"}),
  }),
] as const);

export const COURSE_G04_L10_VB_005_PRIVATE_AUDIO_CUES: readonly AudioCue[] =
  Object.freeze([
    Object.freeze({
      id: "embedded-stream-0001",
      sourceCueId: "sprite-44-soundstream-1",
      frame: 4,
      endFrame: 218,
      frameDomain: "sprite-44",
      language: "en" as const,
      scenario: "source-static-frame",
      source:
        "/flash-assets/courses/course-g04-l10-vb-005/audio/embedded-stream-0001.mp3?sha256=becb287076eea596cb19cded297f390b7c242706367cf1d2bb42bdb2b7b04208",
      durationMs: 17816,
      sha256:
        "becb287076eea596cb19cded297f390b7c242706367cf1d2bb42bdb2b7b04208",
      spokenLanguage: "undetermined" as const,
    }),
  ]);

export const COURSE_G04_L10_VB_005_PRIVATE_AUDIO_TRACKS: readonly AudioTrack[] =
  Object.freeze([
    Object.freeze({
      id: "spanish-host-narration",
      language: "es" as const,
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l10-vb-005/audio/spanish-host-narration.mp3?sha256=be425939acfbbee527a239ce8a78a798a43d78521ac0b9056ada2074adceb77b",
      durationMs: 21792,
      sha256:
        "be425939acfbbee527a239ce8a78a798a43d78521ac0b9056ada2074adceb77b",
      activation: "user" as const,
      visibleWhen: Object.freeze(["es" as const]),
      frameDomains: Object.freeze(["sprite-44"]),
      timelineBehavior: "pause-while-playing" as const,
    }),
  ]);

const candidate = createPrivateSourceStaticGlossaryCandidate(
  COURSE_G04_L10_VB_005_CONFIG,
  Object.freeze({
    calibrationId: "g4-l10-candidate-to-product-v15",
    companionSurfaceId: "g4-l10-vb005-glossary",
    glossaryTerms: COURSE_G04_L10_VB_005_GLOSSARY_TERMS,
    audioCues: COURSE_G04_L10_VB_005_PRIVATE_AUDIO_CUES,
    audioTracks: COURSE_G04_L10_VB_005_PRIVATE_AUDIO_TRACKS,
  }),
);

export {COURSE_G04_L10_VB_005_SOURCE};
export const COURSE_G04_L10_VB_005_MOVIE = candidate.movie;
export const COURSE_G04_L10_VB_005_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_VB_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_VB_005_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Vb005Frame = candidate.normalizeFrame;
export const getCourseG04L10Vb005FrameState = candidate.getFrameState;
export const buildCourseG04L10Vb005CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Vb005Renderer = candidate.Renderer;

export default candidate.module;
