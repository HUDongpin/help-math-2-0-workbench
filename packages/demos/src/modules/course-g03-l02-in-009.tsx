"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_009_CONFIG, COURSE_G03_L02_IN_009_SOURCE,
} from "../timelines/course-g03-l02-in-009";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_009_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_009_SOURCE};
export const COURSE_G03_L02_IN_009_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_009_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_009_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_009_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In009Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In009FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In009CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In009Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-009-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-009/audio/source-associated-undetermined.mp3",
      durationMs: 13944,
      sha256: "6935015dc2d55d37147e355ceffe9fa6b6016285c5d45a210339ba9f086a5fa6",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-64"]),
      timelineBehavior: "none" as const,
    })]),
});
