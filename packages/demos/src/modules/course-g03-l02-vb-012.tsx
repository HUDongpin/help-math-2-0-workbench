"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_VB_012_CONFIG, COURSE_G03_L02_VB_012_SOURCE,
} from "../timelines/course-g03-l02-vb-012";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_VB_012_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_VB_012_SOURCE};
export const COURSE_G03_L02_VB_012_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_VB_012_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_VB_012_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_VB_012_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Vb012Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Vb012FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Vb012CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Vb012Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-vb-012-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-vb-012/audio/source-associated-undetermined.mp3",
      durationMs: 27384,
      sha256: "a5e7622544bd857364fe86523390b4f9053db0f8b4811406c110384f746da8bb",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-22"]),
      timelineBehavior: "none" as const,
    })]),
});
