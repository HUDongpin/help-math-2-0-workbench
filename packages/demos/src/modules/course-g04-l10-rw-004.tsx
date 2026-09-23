"use client";

import type {AudioCue, AudioTrack} from "../contract";
import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {
  COURSE_G04_L10_RW_004_CONFIG,
  COURSE_G04_L10_RW_004_SOURCE,
} from "../timelines/course-g04-l10-rw-004";

export const COURSE_G04_L10_RW_004_GLOSSARY_TERMS = Object.freeze([
  Object.freeze({
    id: "perimeter",
    sourceKeyAttribute: "Perimeter",
    sourceCharacterId: 16,
    firstFrame: 136,
    labels: Object.freeze({en: "Perimeter", es: "Perímetro"}),
  }),
  Object.freeze({
    id: "foot-feet",
    sourceKeyAttribute: "Foot/Feet",
    sourceCharacterId: 67,
    firstFrame: 751,
    labels: Object.freeze({en: "Foot/Feet", es: "Pie (pies)"}),
  }),
  Object.freeze({
    id: "area",
    sourceKeyAttribute: "Area",
    sourceCharacterId: 72,
    firstFrame: 818,
    labels: Object.freeze({en: "Area", es: "Área"}),
  }),
] as const);

export const COURSE_G04_L10_RW_004_PRIVATE_AUDIO_CUES: readonly AudioCue[] =
  Object.freeze([
    Object.freeze({
      id: "embedded-stream-0001",
      sourceCueId: "sprite-109-soundstream-1",
      frame: 16,
      endFrame: 1326,
      frameDomain: "sprite-109",
      language: "en" as const,
      scenario: "source-static-frame",
      source:
        "/flash-assets/courses/course-g04-l10-rw-004/audio/embedded-stream-0001.mp3?sha256=92a83e94c3947bcaf30fcc1e1bc2c70625bed4eefd59d5757604073e3f9919d2",
      durationMs: 109113,
      sha256:
        "92a83e94c3947bcaf30fcc1e1bc2c70625bed4eefd59d5757604073e3f9919d2",
      spokenLanguage: "undetermined" as const,
    }),
  ]);

export const COURSE_G04_L10_RW_004_PRIVATE_AUDIO_TRACKS: readonly AudioTrack[] =
  Object.freeze([
    Object.freeze({
      id: "spanish-host-narration",
      language: "es" as const,
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l10-rw-004/audio/spanish-host-narration.mp3?sha256=1b50f6e77e0db24fd34821b330b1838c0b91d392d6a0bbacd733a8494073f535",
      durationMs: 28056,
      sha256:
        "1b50f6e77e0db24fd34821b330b1838c0b91d392d6a0bbacd733a8494073f535",
      activation: "user" as const,
      visibleWhen: Object.freeze(["es" as const]),
      frameDomains: Object.freeze(["sprite-109"]),
      timelineBehavior: "pause-while-playing" as const,
    }),
  ]);

const candidate = createPrivateSourceStaticGlossaryCandidate(
  COURSE_G04_L10_RW_004_CONFIG,
  Object.freeze({
    calibrationId: "g4-l10-candidate-to-product-v11",
    companionSurfaceId: "g4-l10-rw004-glossary",
    glossaryTerms: COURSE_G04_L10_RW_004_GLOSSARY_TERMS,
    audioCues: COURSE_G04_L10_RW_004_PRIVATE_AUDIO_CUES,
    audioTracks: COURSE_G04_L10_RW_004_PRIVATE_AUDIO_TRACKS,
  }),
);

export {COURSE_G04_L10_RW_004_SOURCE};
export const COURSE_G04_L10_RW_004_MOVIE = candidate.movie;
export const COURSE_G04_L10_RW_004_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_RW_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_RW_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Rw004Frame = candidate.normalizeFrame;
export const getCourseG04L10Rw004FrameState = candidate.getFrameState;
export const buildCourseG04L10Rw004CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Rw004Renderer = candidate.Renderer;

export default candidate.module;
