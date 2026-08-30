"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_019_CONFIG, COURSE_G03_L02_IN_019_SOURCE,
} from "../timelines/course-g03-l02-in-019";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_019_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_019_SOURCE};
export const COURSE_G03_L02_IN_019_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_019_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_019_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_019_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In019Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In019FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In019CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In019Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-019-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-019/audio/source-associated-undetermined.mp3",
      durationMs: 26112,
      sha256: "6018eb3b9644c54cf06d56382b648d4428bc26c8dc5a3878b5cb934e790333e9",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-54"]),
      timelineBehavior: "none" as const,
    })]),
});
