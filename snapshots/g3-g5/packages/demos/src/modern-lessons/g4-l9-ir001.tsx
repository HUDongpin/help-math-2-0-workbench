'use client';
import {createTitleCollagePresentation} from './g4-l4-title-collage';
import {G4_L9_IR001_CONFIG} from './generated/g4-l9-ir001-source';
import {getCourseG04L09Ir001FrameState} from '../modules/course-g04-l09-ir-001';
export const G4_L9_IR001_PRESENTATION = createTitleCollagePresentation(G4_L9_IR001_CONFIG,getCourseG04L09Ir001FrameState);
