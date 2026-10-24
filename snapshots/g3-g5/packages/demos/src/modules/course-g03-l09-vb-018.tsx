"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L09_VB_018_CONFIG, COURSE_G03_L09_VB_018_SOURCE} from "../timelines/course-g03-l09-vb-018";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L09_VB_018_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L09_VB_018_SOURCE};
export const COURSE_G03_L09_VB_018_MOVIE = candidate.movie;
export const COURSE_G03_L09_VB_018_RUNTIME = candidate.runtime;
export const COURSE_G03_L09_VB_018_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L09_VB_018_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L09Vb018Frame = candidate.normalizeFrame;
export const getCourseG03L09Vb018FrameState = candidate.getFrameState;
export const buildCourseG03L09Vb018CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L09Vb018Renderer = candidate.Renderer;
export default module;
