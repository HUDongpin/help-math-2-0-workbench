"use client";

// Own-source question/answer audio; original-runtime and listening acceptance are independent.
import {G4_L8_FINAL_QUIZ_AUDIO_ASSETS} from "../modern-lessons/generated/g4-l8-final-quiz-audio";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L08_FQ_002_CONFIG, COURSE_G04_L08_FQ_002_SOURCE} from "../timelines/course-g04-l08-fq-002";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L08_FQ_002_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const, interactiveAudioAssets: G4_L8_FINAL_QUIZ_AUDIO_ASSETS, interactiveAudioLanguages: ["en", "es"] as const, lessonHost: Object.freeze({capabilities: Object.freeze(["audio"] as const), legacyOperations: "blocked" as const, auditStorage: "memory-only" as const, storesPersonalData: false as const})});

export {COURSE_G04_L08_FQ_002_SOURCE};
export const COURSE_G04_L08_FQ_002_MOVIE = candidate.movie;
export const COURSE_G04_L08_FQ_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L08_FQ_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L08_FQ_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L08Fq002Frame = candidate.normalizeFrame;
export const getCourseG04L08Fq002FrameState = candidate.getFrameState;
export const buildCourseG04L08Fq002CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L08Fq002Renderer = candidate.Renderer;
export default module;
