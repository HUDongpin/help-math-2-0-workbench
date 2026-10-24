"use client";
import {COURSE_G04_L05_FQ_001_RENDERER as Fallback,getCourseG04L05Fq001FrameState}from'../modules/course-g04-l05-fq-001';
import{createReferencePresentation,type ReferenceConfig}from'./g4-l5-reference/presentation';
import source from'./g4-l5-fq001/source.generated.json';
export const FQ001_CONFIG=source as unknown as ReferenceConfig;
export const G4_L5_FQ001_TEXT_PRESENTATION=createReferencePresentation(FQ001_CONFIG,getCourseG04L05Fq001FrameState,Fallback);
export const G4_L5_FQ001_TEXT_BINDING=G4_L5_FQ001_TEXT_PRESENTATION.binding;
