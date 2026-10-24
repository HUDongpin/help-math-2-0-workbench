'use client';
import {CourseG04L05Vb006Renderer,getCourseG04L05Vb006FrameState} from '../modules/course-g04-l05-vb-006';
import {createMultiplesPresentation} from './g4-l5-multiples';
import {G4_L5_MULTIPLES_CONFIGS} from './generated/g4-l5-multiples-config';
export const G4_L5_VB006_TEXT_PRESENTATION=createMultiplesPresentation(G4_L5_MULTIPLES_CONFIGS[0],getCourseG04L05Vb006FrameState,CourseG04L05Vb006Renderer);
export const G4_L5_VB006_TEXT_BINDING=G4_L5_VB006_TEXT_PRESENTATION.binding;
