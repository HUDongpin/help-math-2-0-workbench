'use client';
import {CourseG04L04In017Renderer,getCourseG04L04In017FrameState} from '../modules/course-g04-l04-in-017';
import {createColumnArithmeticPresentation} from './g4-l4-column-arithmetic';
import {G4_L4_COLUMN_CONFIGS} from './generated/g4-l4-column-config';
export const G4_L4_IN017_TEXT_PRESENTATION=createColumnArithmeticPresentation(G4_L4_COLUMN_CONFIGS[2],getCourseG04L04In017FrameState,CourseG04L04In017Renderer);
export const G4_L4_IN017_TEXT_BINDING=G4_L4_IN017_TEXT_PRESENTATION.binding;
