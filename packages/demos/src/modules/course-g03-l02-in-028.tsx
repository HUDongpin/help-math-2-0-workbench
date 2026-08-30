"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_028_CONFIG, COURSE_G03_L02_IN_028_SOURCE,
} from "../timelines/course-g03-l02-in-028";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_028_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_028_SOURCE};
export const COURSE_G03_L02_IN_028_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_028_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_028_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_028_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In028Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In028FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In028CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In028Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-028-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-028/audio/source-associated-undetermined.mp3",
      durationMs: 13752,
      sha256: "fb3360c65189529fb56d516c76f842b89822ffa6736467cb7e63e0520af11f0d",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-328"]),
      timelineBehavior: "none" as const,
    })]),
});
