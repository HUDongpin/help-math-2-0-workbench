"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_IN_009_CONFIG, COURSE_G04_L11_IN_009_SOURCE} from
  "../timelines/course-g04-l11-in-009";
import {createCourseG04L11In009LinePracticeCandidate} from
  "./course-g04-l11-in-009-line-practice-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_IN_009_CONFIG);
const candidate = createCourseG04L11In009LinePracticeCandidate(sourceCandidate);

export {COURSE_G04_L11_IN_009_SOURCE};
export const COURSE_G04_L11_IN_009_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_IN_009_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_IN_009_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_IN_009_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11In009Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11In009FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11In009CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11In009Renderer = candidate.Renderer;

export default candidate.module;
