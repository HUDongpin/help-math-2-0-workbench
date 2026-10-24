'use client';
import {getCourseG04L09Ts008FrameState,CourseG04L09Ts008Renderer as Fallback} from '../modules/course-g04-l09-ts-008';
import {createPracticePresentation} from './g4-l4-practice';
import {G4_L9_PRACTICE_CONFIGS} from './generated/g4-l9-practice-config';
export const G4_L9_TS008_TEXT_PRESENTATION=createPracticePresentation(G4_L9_PRACTICE_CONFIGS[1],getCourseG04L09Ts008FrameState,Fallback);
