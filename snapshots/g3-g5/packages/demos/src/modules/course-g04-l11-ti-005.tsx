"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_TI_005_CONFIG, COURSE_G04_L11_TI_005_SOURCE} from
  "../timelines/course-g04-l11-ti-005";
import {createCourseG04L11Ti005EquationPlotCandidate} from
  "./course-g04-l11-ti-005-equation-plot-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_TI_005_CONFIG);
const candidate = createCourseG04L11Ti005EquationPlotCandidate(sourceCandidate);

export {COURSE_G04_L11_TI_005_SOURCE};
export const COURSE_G04_L11_TI_005_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_TI_005_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_TI_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_TI_005_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11Ti005Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11Ti005FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11Ti005CaptureAttributes = sourceCandidate.buildCaptureAttributes;
export const CourseG04L11Ti005Renderer = candidate.Renderer;
export default candidate.module;
