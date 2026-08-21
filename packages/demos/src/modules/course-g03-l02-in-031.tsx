"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_031_CONFIG, COURSE_G03_L02_IN_031_SOURCE,
} from "../timelines/course-g03-l02-in-031";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_031_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_031_SOURCE};
export const COURSE_G03_L02_IN_031_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_031_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_031_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_031_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In031Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In031FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In031CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In031Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-031-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-031/audio/source-associated-undetermined.mp3",
      durationMs: 19152,
      sha256: "29860c459cae71de1a9bc2c2ce606cea1979a9ba376cc75fb3ddc982fd347fe1",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-52"]),
      timelineBehavior: "none" as const,
    })]),
});
