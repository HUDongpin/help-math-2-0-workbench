"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_GS_002_CONFIG, COURSE_G03_L02_GS_002_SOURCE,
} from "../timelines/course-g03-l02-gs-002";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_GS_002_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_GS_002_SOURCE};
export const COURSE_G03_L02_GS_002_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_GS_002_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_GS_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_GS_002_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Gs002Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Gs002FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Gs002CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Gs002Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-gs-002-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-gs-002/audio/source-associated-undetermined.mp3",
      durationMs: 57984,
      sha256: "58ccdcfb52f38f7317bd407f5c2c5d1d918f1920325dbdc946c2ca5975c9cd89",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-212"]),
      timelineBehavior: "none" as const,
    })]),
});
