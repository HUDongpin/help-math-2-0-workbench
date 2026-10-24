"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_032_CONFIG, COURSE_G03_L02_IN_032_SOURCE,
} from "../timelines/course-g03-l02-in-032";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_032_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_032_SOURCE};
export const COURSE_G03_L02_IN_032_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_032_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_032_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_032_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In032Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In032FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In032CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In032Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-032-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-032/audio/source-associated-undetermined.mp3",
      durationMs: 26208,
      sha256: "7286b2daec93ae89c517868f29a2c4ac6da39c7f3daafb9130c0be10a5d3b03c",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-132"]),
      timelineBehavior: "none" as const,
    })]),
});
