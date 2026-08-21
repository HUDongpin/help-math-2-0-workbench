"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_025_CONFIG, COURSE_G03_L02_IN_025_SOURCE,
} from "../timelines/course-g03-l02-in-025";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_025_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_025_SOURCE};
export const COURSE_G03_L02_IN_025_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_025_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_025_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_025_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In025Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In025FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In025CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In025Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-025-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-025/audio/source-associated-undetermined.mp3",
      durationMs: 35016,
      sha256: "e7adefe51b2717823b083d6ee5c7f246b92eb7d3f3ec74d9a4a515b9fcb0f0be",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-78"]),
      timelineBehavior: "none" as const,
    })]),
});
