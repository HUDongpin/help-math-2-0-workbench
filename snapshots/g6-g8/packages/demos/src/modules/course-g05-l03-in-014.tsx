"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_IN_014_CONFIG,
  COURSE_G05_L03_IN_014_SOURCE,
} from "../timelines/course-g05-l03-in-014";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_IN_014_CONFIG);

export {COURSE_G05_L03_IN_014_SOURCE};
export const COURSE_G05_L03_IN_014_MOVIE = candidate.movie;
export const COURSE_G05_L03_IN_014_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_IN_014_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_IN_014_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03In014Frame = candidate.normalizeFrame;
export const getCourseG05L03In014FrameState = candidate.getFrameState;
export const buildCourseG05L03In014CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03In014Renderer = candidate.Renderer;

export default candidate.module;
