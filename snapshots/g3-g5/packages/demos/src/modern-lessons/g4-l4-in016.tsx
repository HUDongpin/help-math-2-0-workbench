'use client';
import {CourseG04L04In016Renderer,getCourseG04L04In016FrameState} from '../modules/course-g04-l04-in-016';
import {createPlaceValuePracticePresentation} from './g4-l4-place-value-practice';
import {G4_L4_PLACE_VALUE_PRACTICE_CONFIGS} from './generated/g4-l4-place-value-practice-config';
export const G4_L4_IN016_TEXT_PRESENTATION=createPlaceValuePracticePresentation(G4_L4_PLACE_VALUE_PRACTICE_CONFIGS[2],getCourseG04L04In016FrameState,CourseG04L04In016Renderer);
export const G4_L4_IN016_TEXT_BINDING=G4_L4_IN016_TEXT_PRESENTATION.binding;
