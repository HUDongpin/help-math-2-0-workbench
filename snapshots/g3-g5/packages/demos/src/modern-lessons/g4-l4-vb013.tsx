'use client';
import {CourseG04L04Vb013Renderer,getCourseG04L04Vb013FrameState} from '../modules/course-g04-l04-vb-013';
import {createNumberLinePresentation} from './g4-l4-number-line';
import {G4_L4_NUMBER_LINE_CONFIGS} from './generated/g4-l4-number-line-config';
export const G4_L4_VB013_TEXT_PRESENTATION=createNumberLinePresentation(G4_L4_NUMBER_LINE_CONFIGS[2],getCourseG04L04Vb013FrameState,CourseG04L04Vb013Renderer);
export const G4_L4_VB013_TEXT_BINDING=G4_L4_VB013_TEXT_PRESENTATION.binding;
