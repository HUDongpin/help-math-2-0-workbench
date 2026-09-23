"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_TI_004_CONFIG, COURSE_G03_L02_TI_004_SOURCE,
} from "../timelines/course-g03-l02-ti-004";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_TI_004_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_TI_004_SOURCE};
export const COURSE_G03_L02_TI_004_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_TI_004_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_TI_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_TI_004_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ti004Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ti004FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ti004CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ti004Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-ti-004-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-ti-004/audio/source-associated-undetermined.mp3",
      durationMs: 8496,
      sha256: "f9f443880ff6a8acf2f03fa777d9bc3af63f9fc21c0869a6d669715284540e41",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-235"]),
      timelineBehavior: "none" as const,
    })]),
});
