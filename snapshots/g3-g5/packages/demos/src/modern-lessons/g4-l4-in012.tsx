'use client';
import {CourseG04L04In012Renderer,getCourseG04L04In012FrameState} from '../modules/course-g04-l04-in-012';
import {createColumnArithmeticPresentation} from './g4-l4-column-arithmetic';
import {G4_L4_COLUMN_CONFIGS} from './generated/g4-l4-column-config';
export const G4_L4_IN012_TEXT_PRESENTATION=createColumnArithmeticPresentation(G4_L4_COLUMN_CONFIGS[1],getCourseG04L04In012FrameState,CourseG04L04In012Renderer);
export const G4_L4_IN012_TEXT_BINDING=G4_L4_IN012_TEXT_PRESENTATION.binding;
