"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_IN_027_CONFIG,
  COURSE_G05_L03_IN_027_SOURCE,
} from "../timelines/course-g05-l03-in-027";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_IN_027_CONFIG);

export {COURSE_G05_L03_IN_027_SOURCE};
export const COURSE_G05_L03_IN_027_MOVIE = candidate.movie;
export const COURSE_G05_L03_IN_027_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_IN_027_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_IN_027_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03In027Frame = candidate.normalizeFrame;
export const getCourseG05L03In027FrameState = candidate.getFrameState;
export const buildCourseG05L03In027CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03In027Renderer = candidate.Renderer;

export default candidate.module;
