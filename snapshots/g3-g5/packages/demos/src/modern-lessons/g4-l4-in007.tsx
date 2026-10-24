'use client';
import {CourseG04L04In007Renderer,getCourseG04L04In007FrameState} from '../modules/course-g04-l04-in-007';
import {createColumnArithmeticPresentation} from './g4-l4-column-arithmetic';
import {G4_L4_COLUMN_CONFIGS} from './generated/g4-l4-column-config';
export const G4_L4_IN007_TEXT_PRESENTATION=createColumnArithmeticPresentation(G4_L4_COLUMN_CONFIGS[0],getCourseG04L04In007FrameState,CourseG04L04In007Renderer);
export const G4_L4_IN007_TEXT_BINDING=G4_L4_IN007_TEXT_PRESENTATION.binding;
