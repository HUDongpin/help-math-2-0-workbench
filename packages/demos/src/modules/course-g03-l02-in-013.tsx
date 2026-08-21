"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_013_CONFIG, COURSE_G03_L02_IN_013_SOURCE,
} from "../timelines/course-g03-l02-in-013";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_013_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_013_SOURCE};
export const COURSE_G03_L02_IN_013_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_013_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_013_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_013_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In013Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In013FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In013CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In013Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-013-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-013/audio/source-associated-undetermined.mp3",
      durationMs: 36336,
      sha256: "98f096b9875d740b813bb68beeaba3a0af55b7ea050abf4ba9d8a10505a3ce51",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-61"]),
      timelineBehavior: "none" as const,
    })]),
});
