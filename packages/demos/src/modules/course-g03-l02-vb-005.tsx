"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_VB_005_CONFIG, COURSE_G03_L02_VB_005_SOURCE,
} from "../timelines/course-g03-l02-vb-005";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_VB_005_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_VB_005_SOURCE};
export const COURSE_G03_L02_VB_005_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_VB_005_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_VB_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_VB_005_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Vb005Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Vb005FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Vb005CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Vb005Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-vb-005-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-vb-005/audio/source-associated-undetermined.mp3",
      durationMs: 11856,
      sha256: "7dfee90501eb8f15197500d55a91b6fd47ad322a3c4c0d02ab46e721e733323d",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-30"]),
      timelineBehavior: "none" as const,
    })]),
});
