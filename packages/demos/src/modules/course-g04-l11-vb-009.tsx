"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L11_VB_009_CONFIG,
  COURSE_G04_L11_VB_009_SOURCE,
} from "../timelines/course-g04-l11-vb-009";
import {
  createCourseG04L11Vb009PointCandidate,
} from "./course-g04-l11-vb-009-point-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L11_VB_009_CONFIG,
);
const candidate = createCourseG04L11Vb009PointCandidate(sourceCandidate);

export {COURSE_G04_L11_VB_009_SOURCE};
export const COURSE_G04_L11_VB_009_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_VB_009_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_VB_009_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_VB_009_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11Vb009Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11Vb009FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11Vb009CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11Vb009Renderer = candidate.Renderer;

export default candidate.module;
