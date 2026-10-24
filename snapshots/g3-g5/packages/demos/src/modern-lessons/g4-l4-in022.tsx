'use client';
import {CourseG04L04In022Renderer,getCourseG04L04In022FrameState} from '../modules/course-g04-l04-in-022';
import {createEstimatedPairPresentation} from './g4-l4-estimated-pair';
import {G4_L4_ESTIMATED_PAIR_CONFIGS} from './generated/g4-l4-estimated-pair-config';
export const G4_L4_IN022_TEXT_PRESENTATION=createEstimatedPairPresentation(G4_L4_ESTIMATED_PAIR_CONFIGS[0],getCourseG04L04In022FrameState,CourseG04L04In022Renderer);
export const G4_L4_IN022_TEXT_BINDING=G4_L4_IN022_TEXT_PRESENTATION.binding;
