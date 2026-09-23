"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_026_CONFIG, COURSE_G03_L02_IN_026_SOURCE,
} from "../timelines/course-g03-l02-in-026";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_026_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_026_SOURCE};
export const COURSE_G03_L02_IN_026_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_026_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_026_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_026_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In026Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In026FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In026CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In026Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-026-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-026/audio/source-associated-undetermined.mp3",
      durationMs: 36264,
      sha256: "25e7882d5a0029d78a5af9a643a2869f1600c22aebc8400475b31b3b5ef04fbf",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-124"]),
      timelineBehavior: "none" as const,
    })]),
});
