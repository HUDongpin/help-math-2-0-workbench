"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import type {AnimationModule} from "../contract";
import {
  COURSE_G04_L03_RW_002_CONFIG,
  COURSE_G04_L03_RW_002_SOURCE,
} from "../timelines/course-g04-l03-rw-002";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_RW_002_CONFIG,
);

export {COURSE_G04_L03_RW_002_SOURCE};
export const COURSE_G04_L03_RW_002_MOVIE = candidate.movie;
export const COURSE_G04_L03_RW_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_RW_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L03_RW_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Rw002Frame = candidate.normalizeFrame;
export const getCourseG04L03Rw002FrameState = candidate.getFrameState;
export const buildCourseG04L03Rw002CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L03Rw002Renderer = candidate.Renderer;

const animationModule: AnimationModule = Object.freeze({
  ...candidate.module,
  audioCues: Object.freeze([
    Object.freeze({
      id: "course-g04-l03-rw-002-embedded-stream-0001",
      sourceCueId: "embedded-stream-0001",
      frame: 1,
      frameDomain: "sprite-421",
      language: "en",
      scenario: "source-static-frame",
      source:
        "/flash-assets/courses/course-g04-l03-rw-002/audio/embedded-stream-0001.mp3",
      durationMs: 106_522,
      sha256:
        "7616d349bf0b7e8122a3e82fb35da28fca538aa2907326ce5299b1e6b42ac46c",
      spokenLanguage: "undetermined",
    }),
  ]),
  audioTracks: Object.freeze([
    Object.freeze({
      id: "course-g04-l03-rw-002-spanish-host-narration",
      language: "es",
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l03-rw-002/audio/spanish-host-narration.mp3",
      durationMs: 28_992,
      sha256:
        "79d0b6504a0d8bb66e3a7a19a5156ab35a49271fdbaab40033c0dda5600a627e",
      activation: "user",
      visibleWhen: Object.freeze(["es"] as const),
      frameDomains: Object.freeze(["sprite-421"]),
      timelineBehavior: "pause-while-playing",
    }),
  ]),
});

export default animationModule;
