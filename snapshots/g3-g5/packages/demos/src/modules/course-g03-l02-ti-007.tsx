"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_TI_007_CONFIG, COURSE_G03_L02_TI_007_SOURCE,
} from "../timelines/course-g03-l02-ti-007";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_TI_007_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_TI_007_SOURCE};
export const COURSE_G03_L02_TI_007_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_TI_007_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_TI_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_TI_007_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ti007Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ti007FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ti007CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ti007Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-ti-007-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-ti-007/audio/source-associated-undetermined.mp3",
      durationMs: 21264,
      sha256: "f457d87cd037b05586d10b470a8e9c79fdc6e8b0683cc053c0c8a8a77d933f5a",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-284"]),
      timelineBehavior: "none" as const,
    })]),
});
