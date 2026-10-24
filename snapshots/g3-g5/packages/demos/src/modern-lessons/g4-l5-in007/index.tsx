'use client';
import {COURSE_G04_L05_IN_007_RENDERER as Fallback,getCourseG04L05In007FrameState} from '../../modules/course-g04-l05-in-007';
import {createIn007Presentation} from './renderer';
import {IN007_SOURCE_AUDIO} from './audio.generated';
export const G4_L5_IN007_TEXT_PRESENTATION=createIn007Presentation(getCourseG04L05In007FrameState,Fallback,IN007_SOURCE_AUDIO);
export const G4_L5_IN007_TEXT_BINDING=G4_L5_IN007_TEXT_PRESENTATION.binding;
