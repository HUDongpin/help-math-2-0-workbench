'use client';
import {CourseG04L04Vb012Renderer,getCourseG04L04Vb012FrameState} from '../modules/course-g04-l04-vb-012';
import {createNumberLinePresentation} from './g4-l4-number-line';
import {G4_L4_NUMBER_LINE_CONFIGS} from './generated/g4-l4-number-line-config';
export const G4_L4_VB012_TEXT_PRESENTATION=createNumberLinePresentation(G4_L4_NUMBER_LINE_CONFIGS[1],getCourseG04L04Vb012FrameState,CourseG04L04Vb012Renderer);
export const G4_L4_VB012_TEXT_BINDING=G4_L4_VB012_TEXT_PRESENTATION.binding;
