'use client';
import {createTitleCollagePresentation} from './g4-l4-title-collage';
import {G4_L4_TITLE_COLLAGE_CONFIGS} from './generated/g4-l4-title-collage-source';
import {getCourseG04L04Fq001FrameState} from '../modules/course-g04-l04-fq-001';
export const G4_L4_FQ001_PRESENTATION = createTitleCollagePresentation(G4_L4_TITLE_COLLAGE_CONFIGS[1],getCourseG04L04Fq001FrameState);
