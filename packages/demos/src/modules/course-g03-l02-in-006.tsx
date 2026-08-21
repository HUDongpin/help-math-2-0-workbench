"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_006_CONFIG, COURSE_G03_L02_IN_006_SOURCE,
} from "../timelines/course-g03-l02-in-006";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_006_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_006_SOURCE};
export const COURSE_G03_L02_IN_006_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_006_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_006_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In006Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In006FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In006CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In006Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-006-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-006/audio/source-associated-undetermined.mp3",
      durationMs: 38664,
      sha256: "a1d76665148c2ffc476010fd4db2d2dec546d596f10d5dd83bff587fad44848d",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-104"]),
      timelineBehavior: "none" as const,
    })]),
});
