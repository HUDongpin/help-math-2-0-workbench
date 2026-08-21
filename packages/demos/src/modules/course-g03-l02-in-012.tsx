"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_012_CONFIG, COURSE_G03_L02_IN_012_SOURCE,
} from "../timelines/course-g03-l02-in-012";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_012_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_012_SOURCE};
export const COURSE_G03_L02_IN_012_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_012_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_012_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_012_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In012Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In012FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In012CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In012Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-012-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-012/audio/source-associated-undetermined.mp3",
      durationMs: 30696,
      sha256: "cd6d8c4bd79c4a4b197b9d4c1a907a0c368b274a359501c7de9c74b463c8dfa3",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-113"]),
      timelineBehavior: "none" as const,
    })]),
});
