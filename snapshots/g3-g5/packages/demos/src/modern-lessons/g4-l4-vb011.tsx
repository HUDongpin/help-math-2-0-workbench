'use client';
import {CourseG04L04Vb011Renderer,getCourseG04L04Vb011FrameState} from '../modules/course-g04-l04-vb-011';
import {createNumberLinePresentation} from './g4-l4-number-line';
import {G4_L4_NUMBER_LINE_CONFIGS} from './generated/g4-l4-number-line-config';
export const G4_L4_VB011_TEXT_PRESENTATION=createNumberLinePresentation(G4_L4_NUMBER_LINE_CONFIGS[0],getCourseG04L04Vb011FrameState,CourseG04L04Vb011Renderer);
export const G4_L4_VB011_TEXT_BINDING=G4_L4_VB011_TEXT_PRESENTATION.binding;
