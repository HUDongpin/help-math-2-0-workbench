"use client";

import type {AudioCue, AudioTrack} from "../contract";
import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {
  COURSE_G04_L10_VB_004_CONFIG,
  COURSE_G04_L10_VB_004_SOURCE,
} from "../timelines/course-g04-l10-vb-004";

export const COURSE_G04_L10_VB_004_GLOSSARY_TERMS = Object.freeze([
  Object.freeze({
    id: "length",
    sourceKeyAttribute: "Length",
    sourceCharacterId: 10,
    firstFrame: 4,
    labels: Object.freeze({en: "Length", es: "Longitud"}),
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
] as const);

export const COURSE_G04_L10_VB_004_PRIVATE_AUDIO_CUES: readonly AudioCue[] =
  Object.freeze([
    Object.freeze({
      id: "embedded-stream-0001",
      sourceCueId: "sprite-45-soundstream-1",
      frame: 4,
      endFrame: 214,
      frameDomain: "sprite-45",
      language: "en" as const,
      scenario: "source-static-frame",
      source:
        "/flash-assets/courses/course-g04-l10-vb-004/audio/embedded-stream-0001.mp3?sha256=71710f405912d55cf4ac1dcf1c39d5b782cd7a4cb987f649c0a9de4f2b1a672d",
      durationMs: 17476,
      sha256:
        "71710f405912d55cf4ac1dcf1c39d5b782cd7a4cb987f649c0a9de4f2b1a672d",
      spokenLanguage: "undetermined" as const,
    }),
  ]);

export const COURSE_G04_L10_VB_004_PRIVATE_AUDIO_TRACKS: readonly AudioTrack[] =
  Object.freeze([
    Object.freeze({
      id: "spanish-host-narration",
      language: "es" as const,
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l10-vb-004/audio/spanish-host-narration.mp3?sha256=98aeaa8f5d7f1352f215e36c5bc1d8094b9ed761281ba7d53e425eb95e35ee26",
      durationMs: 21504,
      sha256:
        "98aeaa8f5d7f1352f215e36c5bc1d8094b9ed761281ba7d53e425eb95e35ee26",
      activation: "user" as const,
      visibleWhen: Object.freeze(["es" as const]),
      frameDomains: Object.freeze(["sprite-45"]),
      timelineBehavior: "pause-while-playing" as const,
    }),
  ]);

const candidate = createPrivateSourceStaticGlossaryCandidate(
  COURSE_G04_L10_VB_004_CONFIG,
  Object.freeze({
    calibrationId: "g4-l10-candidate-to-product-v7",
    companionSurfaceId: "g4-l10-vb004-glossary",
    glossaryTerms: COURSE_G04_L10_VB_004_GLOSSARY_TERMS,
    audioCues: COURSE_G04_L10_VB_004_PRIVATE_AUDIO_CUES,
    audioTracks: COURSE_G04_L10_VB_004_PRIVATE_AUDIO_TRACKS,
  }),
);

export {COURSE_G04_L10_VB_004_SOURCE};
export const COURSE_G04_L10_VB_004_MOVIE = candidate.movie;
export const COURSE_G04_L10_VB_004_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_VB_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_VB_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Vb004Frame = candidate.normalizeFrame;
export const getCourseG04L10Vb004FrameState = candidate.getFrameState;
export const buildCourseG04L10Vb004CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Vb004Renderer = candidate.Renderer;

export default candidate.module;
