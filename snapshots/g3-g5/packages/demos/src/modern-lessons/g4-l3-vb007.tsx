'use client';
import {createVbSignPracticePresentation} from './g4-l3-vb-sign-practice';
import {G4_L3_VB_SIGN_PRACTICE_CONFIGS} from './generated/g4-l3-vb-sign-practice-config';
import {COURSE_G04_L03_VB_007_SIGN_QUIZ} from '../timelines/course-g04-l03-vb-sign-quiz-interaction';
import {getCourseG04L03Vb007FrameState} from '../modules/course-g04-l03-vb-007';
export const G4_L3_VB007_TEXT_PRESENTATION=createVbSignPracticePresentation(G4_L3_VB_SIGN_PRACTICE_CONFIGS['course-g04-l03-vb-007'],COURSE_G04_L03_VB_007_SIGN_QUIZ,getCourseG04L03Vb007FrameState);
