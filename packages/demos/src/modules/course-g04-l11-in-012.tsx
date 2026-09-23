"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_IN_012_CONFIG, COURSE_G04_L11_IN_012_SOURCE} from
  "../timelines/course-g04-l11-in-012";
import {createCourseG04L11In012LineSegmentCandidate} from
  "./course-g04-l11-in-012-line-segment-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_IN_012_CONFIG);
const candidate = createCourseG04L11In012LineSegmentCandidate(sourceCandidate);

export {COURSE_G04_L11_IN_012_SOURCE};
export const COURSE_G04_L11_IN_012_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_IN_012_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_IN_012_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_IN_012_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11In012Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11In012FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11In012CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11In012Renderer = candidate.Renderer;
export default candidate.module;
