"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_VB_014_CONFIG,
  COURSE_G05_L03_VB_014_SOURCE,
} from "../timelines/course-g05-l03-vb-014";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_VB_014_CONFIG);

export {COURSE_G05_L03_VB_014_SOURCE};
export const COURSE_G05_L03_VB_014_MOVIE = candidate.movie;
export const COURSE_G05_L03_VB_014_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_VB_014_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_VB_014_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03Vb014Frame = candidate.normalizeFrame;
export const getCourseG05L03Vb014FrameState = candidate.getFrameState;
export const buildCourseG05L03Vb014CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03Vb014Renderer = candidate.Renderer;

export default candidate.module;
