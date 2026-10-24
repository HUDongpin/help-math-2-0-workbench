"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_020_CONFIG, COURSE_G03_L02_IN_020_SOURCE,
} from "../timelines/course-g03-l02-in-020";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_020_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_020_SOURCE};
export const COURSE_G03_L02_IN_020_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_020_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_020_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_020_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In020Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In020FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In020CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In020Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-020-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-020/audio/source-associated-undetermined.mp3",
      durationMs: 18024,
      sha256: "74d8ae13d8c4b5b6327bb9dc5fed0166c0089a00ac842e4eeaebb5e3fb0008d9",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-39"]),
      timelineBehavior: "none" as const,
    })]),
});
