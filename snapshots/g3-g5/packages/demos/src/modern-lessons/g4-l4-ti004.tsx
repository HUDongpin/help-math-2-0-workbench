'use client';
import {CourseG04L04Ti004Renderer, getCourseG04L04Ti004FrameState} from '../modules/course-g04-l04-ti-004';
import {createNinePairPresentation} from './g4-l4-nine-pair';
import {G4_L4_NINE_PAIR_CONFIGS} from './generated/g4-l4-nine-pair-config';
export const G4_L4_TI004_TEXT_PRESENTATION = createNinePairPresentation(G4_L4_NINE_PAIR_CONFIGS[0], getCourseG04L04Ti004FrameState, CourseG04L04Ti004Renderer);
export const G4_L4_TI004_TEXT_BINDING = G4_L4_TI004_TEXT_PRESENTATION.binding;
