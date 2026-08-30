"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_TI_002_CONFIG, COURSE_G04_L11_TI_002_SOURCE} from
  "../timelines/course-g04-l11-ti-002";
import {createCourseG04L11Ti002TermMatchingCandidate} from
  "./course-g04-l11-ti-002-term-matching-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_TI_002_CONFIG);
const candidate = createCourseG04L11Ti002TermMatchingCandidate(sourceCandidate);

export {COURSE_G04_L11_TI_002_SOURCE};
export const COURSE_G04_L11_TI_002_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_TI_002_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_TI_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_TI_002_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11Ti002Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11Ti002FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11Ti002CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11Ti002Renderer = candidate.Renderer;
export default candidate.module;
