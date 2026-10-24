"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_GS_002_CONFIG,
  COURSE_G05_L03_GS_002_SOURCE,
} from "../timelines/course-g05-l03-gs-002";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_GS_002_CONFIG);

export {COURSE_G05_L03_GS_002_SOURCE};
export const COURSE_G05_L03_GS_002_MOVIE = candidate.movie;
export const COURSE_G05_L03_GS_002_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_GS_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_GS_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03Gs002Frame = candidate.normalizeFrame;
export const getCourseG05L03Gs002FrameState = candidate.getFrameState;
export const buildCourseG05L03Gs002CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03Gs002Renderer = candidate.Renderer;

export default candidate.module;
