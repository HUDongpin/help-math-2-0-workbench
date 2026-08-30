"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_IN_005_CONFIG, COURSE_G04_L11_IN_005_SOURCE} from
  "../timelines/course-g04-l11-in-005";
import {createCourseG04L11In005PointHoverCandidate} from
  "./course-g04-l11-in-005-point-hover-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_IN_005_CONFIG);
const candidate = createCourseG04L11In005PointHoverCandidate(sourceCandidate);

export {COURSE_G04_L11_IN_005_SOURCE};
export const COURSE_G04_L11_IN_005_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_IN_005_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_IN_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_IN_005_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11In005Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11In005FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11In005CaptureAttributes = sourceCandidate.buildCaptureAttributes;
export const CourseG04L11In005Renderer = candidate.Renderer;
export default candidate.module;
