"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_IN_008_CONFIG, COURSE_G04_L11_IN_008_SOURCE} from
  "../timelines/course-g04-l11-in-008";
import {createCourseG04L11In008PlotLineCandidate} from
  "./course-g04-l11-in-008-plot-line-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_IN_008_CONFIG);
const candidate = createCourseG04L11In008PlotLineCandidate(sourceCandidate);

export {COURSE_G04_L11_IN_008_SOURCE};
export const COURSE_G04_L11_IN_008_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_IN_008_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_IN_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_IN_008_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11In008Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11In008FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11In008CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11In008Renderer = candidate.Renderer;

export default candidate.module;
