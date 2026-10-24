'use client';
import {createTitleCollagePresentation} from './g4-l4-title-collage';
import {G4_L9_FQ001_SOURCE_DATA} from './g4-l9-fq001/source.generated';
import {getCourseG04L09Fq001FrameState} from '../modules/course-g04-l09-fq-001';
export const G4_L9_FQ001_PRESENTATION = createTitleCollagePresentation(G4_L9_FQ001_SOURCE_DATA,getCourseG04L09Fq001FrameState);
