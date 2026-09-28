"use client";

import {createCourseG04L03SourceGlossaryCandidate} from "./course-g04-l03-source-glossary-candidate";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_IN_007_CONFIG,
  COURSE_G04_L03_IN_007_GLOSSARY_CONFIG,
  COURSE_G04_L03_IN_007_SOURCE,
} from "../timelines/course-g04-l03-in-007";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_IN_007_CONFIG,
);

const glossaryCandidate = createCourseG04L03SourceGlossaryCandidate(
  {...candidate, module: {...candidate.module, reducedMotionFrame: 555}},
  COURSE_G04_L03_IN_007_GLOSSARY_CONFIG,
);

export {COURSE_G04_L03_IN_007_SOURCE};
export const COURSE_G04_L03_IN_007_MOVIE = candidate.movie;
export const COURSE_G04_L03_IN_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_IN_007_SOURCE_CONTRACT = glossaryCandidate.sourceContract;
export const COURSE_G04_L03_IN_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03In007Frame = candidate.normalizeFrame;
export const getCourseG04L03In007FrameState = candidate.getFrameState;
export const buildCourseG04L03In007CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L03In007Renderer = glossaryCandidate.Renderer;

export default glossaryCandidate.module;
