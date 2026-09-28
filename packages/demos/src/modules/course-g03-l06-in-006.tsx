"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L06_IN_006_CONFIG, COURSE_G03_L06_IN_006_SOURCE} from "../timelines/course-g03-l06-in-006";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L06_IN_006_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L06_IN_006_SOURCE};
export const COURSE_G03_L06_IN_006_MOVIE = candidate.movie;
export const COURSE_G03_L06_IN_006_RUNTIME = candidate.runtime;
export const COURSE_G03_L06_IN_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L06_IN_006_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L06In006Frame = candidate.normalizeFrame;
export const getCourseG03L06In006FrameState = candidate.getFrameState;
export const buildCourseG03L06In006CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L06In006Renderer = candidate.Renderer;
export default module;
