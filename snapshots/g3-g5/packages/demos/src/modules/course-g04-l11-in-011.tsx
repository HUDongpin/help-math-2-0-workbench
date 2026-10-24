"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_IN_011_CONFIG, COURSE_G04_L11_IN_011_SOURCE} from
  "../timelines/course-g04-l11-in-011";
import {createCourseG04L11In011LineSegmentCandidate} from
  "./course-g04-l11-in-011-line-segment-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_IN_011_CONFIG);
const candidate = createCourseG04L11In011LineSegmentCandidate(sourceCandidate);

export {COURSE_G04_L11_IN_011_SOURCE};
export const COURSE_G04_L11_IN_011_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_IN_011_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_IN_011_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_IN_011_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11In011Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11In011FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11In011CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11In011Renderer = candidate.Renderer;
export default candidate.module;
