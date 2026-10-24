'use client';
import {CourseG04L04Ti005Renderer, getCourseG04L04Ti005FrameState} from '../modules/course-g04-l04-ti-005';
import {createNinePairPresentation} from './g4-l4-nine-pair';
import {G4_L4_NINE_PAIR_CONFIGS} from './generated/g4-l4-nine-pair-config';
export const G4_L4_TI005_TEXT_PRESENTATION = createNinePairPresentation(G4_L4_NINE_PAIR_CONFIGS[1], getCourseG04L04Ti005FrameState, CourseG04L04Ti005Renderer);
export const G4_L4_TI005_TEXT_BINDING = G4_L4_TI005_TEXT_PRESENTATION.binding;
