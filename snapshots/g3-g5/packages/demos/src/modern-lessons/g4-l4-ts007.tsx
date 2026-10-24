'use client';
import {getCourseG04L04Ts007FrameState,CourseG04L04Ts007Renderer} from '../modules/course-g04-l04-ts-007';
import {createPracticePresentation} from './g4-l4-practice';
import {G4_L4_PRACTICE_CONFIGS} from './generated/g4-l4-practice-config';
export const G4_L4_TS007_TEXT_PRESENTATION=createPracticePresentation(G4_L4_PRACTICE_CONFIGS[0],getCourseG04L04Ts007FrameState,CourseG04L04Ts007Renderer);
