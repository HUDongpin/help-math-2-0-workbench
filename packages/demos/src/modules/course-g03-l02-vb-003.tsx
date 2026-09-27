"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_VB_003_CONFIG, COURSE_G03_L02_VB_003_SOURCE,
} from "../timelines/course-g03-l02-vb-003";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_VB_003_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_VB_003_SOURCE};
export const COURSE_G03_L02_VB_003_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_VB_003_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_VB_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_VB_003_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Vb003Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Vb003FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Vb003CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Vb003Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-vb-003-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-vb-003/audio/source-associated-undetermined.mp3",
      durationMs: 27912,
      sha256: "3e9d02a564a96cf5a5d299f65277a5ccd4ff7a59c77b866318afbcbd97585838",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-69"]),
      timelineBehavior: "none" as const,
    })]),
});
