"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L11_IN_002_CONFIG,
  COURSE_G04_L11_IN_002_SOURCE,
} from "../timelines/course-g04-l11-in-002";
import {
  createCourseG04L11In002CoordinateGridCandidate,
} from "./course-g04-l11-in-002-coordinate-grid-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L11_IN_002_CONFIG,
);
const candidate = createCourseG04L11In002CoordinateGridCandidate(sourceCandidate);

export {COURSE_G04_L11_IN_002_SOURCE};
export const COURSE_G04_L11_IN_002_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_IN_002_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_IN_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_IN_002_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11In002Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11In002FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11In002CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11In002Renderer = candidate.Renderer;

export default candidate.module;
