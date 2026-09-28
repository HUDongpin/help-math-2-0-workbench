"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L12_VB_031_CONFIG, COURSE_G04_L12_VB_031_SOURCE} from "../timelines/course-g04-l12-vb-031";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L12_VB_031_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L12_VB_031_SOURCE};
export const COURSE_G04_L12_VB_031_MOVIE = candidate.movie;
export const COURSE_G04_L12_VB_031_RUNTIME = candidate.runtime;
export const COURSE_G04_L12_VB_031_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L12_VB_031_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L12Vb031Frame = candidate.normalizeFrame;
export const getCourseG04L12Vb031FrameState = candidate.getFrameState;
export const buildCourseG04L12Vb031CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L12Vb031Renderer = candidate.Renderer;
export default module;
