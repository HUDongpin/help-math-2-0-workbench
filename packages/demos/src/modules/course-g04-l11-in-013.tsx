"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_IN_013_CONFIG, COURSE_G04_L11_IN_013_SOURCE} from
  "../timelines/course-g04-l11-in-013";
import {createCourseG04L11In013SegmentLengthPracticeCandidate} from
  "./course-g04-l11-in-013-segment-length-practice-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_IN_013_CONFIG);
const candidate = createCourseG04L11In013SegmentLengthPracticeCandidate(sourceCandidate);

export {COURSE_G04_L11_IN_013_SOURCE};
export const COURSE_G04_L11_IN_013_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_IN_013_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_IN_013_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_IN_013_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11In013Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11In013FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11In013CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11In013Renderer = candidate.Renderer;
export default candidate.module;
