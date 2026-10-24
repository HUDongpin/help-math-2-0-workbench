"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_030_CONFIG, COURSE_G03_L02_IN_030_SOURCE,
} from "../timelines/course-g03-l02-in-030";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_030_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_030_SOURCE};
export const COURSE_G03_L02_IN_030_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_030_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_030_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_030_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In030Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In030FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In030CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In030Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-030-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-030/audio/source-associated-undetermined.mp3",
      durationMs: 15312,
      sha256: "9355c0744a370d53525e970061db05002a9f65bc7bbbcf0e99e3b1611783ecbe",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-214"]),
      timelineBehavior: "none" as const,
    })]),
});
