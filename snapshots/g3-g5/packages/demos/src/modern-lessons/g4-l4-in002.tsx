'use client';
import {CourseG04L04In002Renderer,getCourseG04L04In002FrameState} from '../modules/course-g04-l04-in-002';
import {createNumberLinePresentation} from './g4-l4-number-line';
import {G4_L4_LINEAR_NUMBER_LINE_CONFIGS} from './generated/g4-l4-linear-number-line-config';
export const G4_L4_IN002_TEXT_PRESENTATION=createNumberLinePresentation(G4_L4_LINEAR_NUMBER_LINE_CONFIGS[0],getCourseG04L04In002FrameState,CourseG04L04In002Renderer);
export const G4_L4_IN002_TEXT_BINDING=G4_L4_IN002_TEXT_PRESENTATION.binding;
