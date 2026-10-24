'use client';
import {getCourseG04L05Ts008FrameState,COURSE_G04_L05_TS_008_RENDERER as Fallback} from '../modules/course-g04-l05-ts-008';
import {createPracticePresentation} from './g4-l4-practice';
import {G4_L5_PRACTICE_CONFIGS} from './generated/g4-l5-practice-config';
export const G4_L5_TS008_TEXT_PRESENTATION=createPracticePresentation(G4_L5_PRACTICE_CONFIGS[1],getCourseG04L05Ts008FrameState,Fallback);
