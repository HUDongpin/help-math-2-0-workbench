"use client";

// Own source-routed audio declarations; missing original files remain explicit.
import {G4_L9_FINAL_QUIZ_AUDIO_ASSETS} from "../modern-lessons/generated/g4-l9-final-quiz-config";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L09_FQ_003_CONFIG, COURSE_G04_L09_FQ_003_SOURCE} from "../timelines/course-g04-l09-fq-003";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L09_FQ_003_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const, interactiveAudioAssets: G4_L9_FINAL_QUIZ_AUDIO_ASSETS, interactiveAudioLanguages: ["en", "es"] as const, lessonHost: Object.freeze({capabilities: Object.freeze(["audio"] as const), legacyOperations: "blocked" as const, auditStorage: "memory-only" as const, storesPersonalData: false as const})});

export {COURSE_G04_L09_FQ_003_SOURCE};
export const COURSE_G04_L09_FQ_003_MOVIE = candidate.movie;
export const COURSE_G04_L09_FQ_003_RUNTIME = candidate.runtime;
export const COURSE_G04_L09_FQ_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L09_FQ_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L09Fq003Frame = candidate.normalizeFrame;
export const getCourseG04L09Fq003FrameState = candidate.getFrameState;
export const buildCourseG04L09Fq003CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L09Fq003Renderer = candidate.Renderer;
export default module;
