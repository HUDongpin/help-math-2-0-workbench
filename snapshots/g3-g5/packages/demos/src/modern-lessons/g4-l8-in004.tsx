'use client';
import {CourseG04L08In004Renderer,getCourseG04L08In004FrameState}from'../modules/course-g04-l08-in-004';
import {createIn004VocabularyPresentation,type In004Config}from'./g4-l8-in004-presentation';
import data from'./g4-l8-in004/source.generated.json';
export const G4_L8_IN004_TEXT_PRESENTATION=createIn004VocabularyPresentation(data.pages[0] as unknown as In004Config,getCourseG04L08In004FrameState,CourseG04L08In004Renderer);
export const G4_L8_IN004_TEXT_BINDING=G4_L8_IN004_TEXT_PRESENTATION.binding;
