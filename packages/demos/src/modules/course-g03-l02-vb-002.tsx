"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_VB_002_CONFIG, COURSE_G03_L02_VB_002_SOURCE,
} from "../timelines/course-g03-l02-vb-002";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_VB_002_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_VB_002_SOURCE};
export const COURSE_G03_L02_VB_002_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_VB_002_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_VB_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_VB_002_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Vb002Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Vb002FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Vb002CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Vb002Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-vb-002-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-vb-002/audio/source-associated-undetermined.mp3",
      durationMs: 51312,
      sha256: "5cfe6b58b21b6d5a7b2f1a101301b85c6920824de17c2807bae4acf3a7463739",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-77"]),
      timelineBehavior: "none" as const,
    })]),
});
