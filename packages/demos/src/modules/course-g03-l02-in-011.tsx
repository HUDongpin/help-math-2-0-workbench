"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_011_CONFIG, COURSE_G03_L02_IN_011_SOURCE,
} from "../timelines/course-g03-l02-in-011";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_011_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_011_SOURCE};
export const COURSE_G03_L02_IN_011_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_011_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_011_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_011_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In011Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In011FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In011CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In011Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-011-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-011/audio/source-associated-undetermined.mp3",
      durationMs: 21240,
      sha256: "267c1a37e783916486f6d5b55a517eec4f227b2519c8ea8b3c0f8f8fc4648b23",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-326"]),
      timelineBehavior: "none" as const,
    })]),
});
