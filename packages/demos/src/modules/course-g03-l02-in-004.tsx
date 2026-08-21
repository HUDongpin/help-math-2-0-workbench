"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_004_CONFIG, COURSE_G03_L02_IN_004_SOURCE,
} from "../timelines/course-g03-l02-in-004";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_004_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_004_SOURCE};
export const COURSE_G03_L02_IN_004_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_004_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_004_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In004Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In004FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In004CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In004Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-004-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-004/audio/source-associated-undetermined.mp3",
      durationMs: 20712,
      sha256: "939dfe038e1b96dc7ae25eee7b4e2b6bee613bc11355cad258b7d491fb76955e",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-81"]),
      timelineBehavior: "none" as const,
    })]),
});
