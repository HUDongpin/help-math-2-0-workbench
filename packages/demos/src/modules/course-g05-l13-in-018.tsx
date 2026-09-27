"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L13_IN_018_CONFIG, COURSE_G05_L13_IN_018_SOURCE} from "../timelines/course-g05-l13-in-018";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L13_IN_018_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L13_IN_018_SOURCE};
export const COURSE_G05_L13_IN_018_MOVIE = candidate.movie;
export const COURSE_G05_L13_IN_018_RUNTIME = candidate.runtime;
export const COURSE_G05_L13_IN_018_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L13_IN_018_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L13In018Frame = candidate.normalizeFrame;
export const getCourseG05L13In018FrameState = candidate.getFrameState;
export const buildCourseG05L13In018CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L13In018Renderer = candidate.Renderer;
export default module;
