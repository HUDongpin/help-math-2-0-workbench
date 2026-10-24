'use client';
import {CourseG04L04Ti006Renderer,getCourseG04L04Ti006FrameState} from '../modules/course-g04-l04-ti-006';
import {createEstimatedPairPresentation} from './g4-l4-estimated-pair';
import {G4_L4_ESTIMATED_PAIR_CONFIGS} from './generated/g4-l4-estimated-pair-config';
export const G4_L4_TI006_TEXT_PRESENTATION=createEstimatedPairPresentation(G4_L4_ESTIMATED_PAIR_CONFIGS[1],getCourseG04L04Ti006FrameState,CourseG04L04Ti006Renderer);
export const G4_L4_TI006_TEXT_BINDING=G4_L4_TI006_TEXT_PRESENTATION.binding;
