'use client';
import {CourseG04L05Vb009Renderer,getCourseG04L05Vb009FrameState} from '../modules/course-g04-l05-vb-009';
import {createMultiplesPresentation} from './g4-l5-multiples';
import {G4_L5_MULTIPLES_CONFIGS} from './generated/g4-l5-multiples-config';
export const G4_L5_VB009_TEXT_PRESENTATION=createMultiplesPresentation(G4_L5_MULTIPLES_CONFIGS[1],getCourseG04L05Vb009FrameState,CourseG04L05Vb009Renderer);
export const G4_L5_VB009_TEXT_BINDING=G4_L5_VB009_TEXT_PRESENTATION.binding;
