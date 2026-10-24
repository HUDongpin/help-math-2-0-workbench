'use client';
import {getCourseG04L09Ts007FrameState,CourseG04L09Ts007Renderer as Fallback} from '../modules/course-g04-l09-ts-007';
import {createPracticePresentation} from './g4-l4-practice';
import {G4_L9_PRACTICE_CONFIGS} from './generated/g4-l9-practice-config';
export const G4_L9_TS007_TEXT_PRESENTATION=createPracticePresentation(G4_L9_PRACTICE_CONFIGS[0],getCourseG04L09Ts007FrameState,Fallback);
