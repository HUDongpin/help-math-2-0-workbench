"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_TI_010_CONFIG, COURSE_G03_L02_TI_010_SOURCE,
} from "../timelines/course-g03-l02-ti-010";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_TI_010_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_TI_010_SOURCE};
export const COURSE_G03_L02_TI_010_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_TI_010_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_TI_010_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_TI_010_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ti010Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ti010FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ti010CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ti010Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-ti-010-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-ti-010/audio/source-associated-undetermined.mp3",
      durationMs: 14016,
      sha256: "c6f28950586f8a33ae9f2a18e67da2c7dd0567768531872f77bdf21c2b42b4eb",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-277"]),
      timelineBehavior: "none" as const,
    })]),
});
