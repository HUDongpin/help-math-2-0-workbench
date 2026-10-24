"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_VB_009_CONFIG, COURSE_G03_L02_VB_009_SOURCE,
} from "../timelines/course-g03-l02-vb-009";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_VB_009_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_VB_009_SOURCE};
export const COURSE_G03_L02_VB_009_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_VB_009_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_VB_009_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_VB_009_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Vb009Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Vb009FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Vb009CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Vb009Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-vb-009-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-vb-009/audio/source-associated-undetermined.mp3",
      durationMs: 5712,
      sha256: "f980ba8235b204e9bf55602facc4d8a188976de860f29c7f2c9a651408d65157",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-24"]),
      timelineBehavior: "none" as const,
    })]),
});
