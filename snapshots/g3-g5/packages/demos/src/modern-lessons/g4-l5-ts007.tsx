'use client';
import {getCourseG04L05Ts007FrameState,COURSE_G04_L05_TS_007_RENDERER as Fallback} from '../modules/course-g04-l05-ts-007';
import {createPracticePresentation} from './g4-l4-practice';
import {G4_L5_PRACTICE_CONFIGS} from './generated/g4-l5-practice-config';
export const G4_L5_TS007_TEXT_PRESENTATION=createPracticePresentation(G4_L5_PRACTICE_CONFIGS[0],getCourseG04L05Ts007FrameState,Fallback);
