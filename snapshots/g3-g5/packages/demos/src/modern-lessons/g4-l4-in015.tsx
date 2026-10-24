'use client';
import {CourseG04L04In015Renderer,getCourseG04L04In015FrameState} from '../modules/course-g04-l04-in-015';
import {createColumnArithmeticPresentation} from './g4-l4-column-arithmetic';
import {G4_L4_PLACE_VALUE_CONFIGS} from './generated/g4-l4-place-value-config';
export const G4_L4_IN015_TEXT_PRESENTATION=createColumnArithmeticPresentation(G4_L4_PLACE_VALUE_CONFIGS[3],getCourseG04L04In015FrameState,CourseG04L04In015Renderer);
export const G4_L4_IN015_TEXT_BINDING=G4_L4_IN015_TEXT_PRESENTATION.binding;
