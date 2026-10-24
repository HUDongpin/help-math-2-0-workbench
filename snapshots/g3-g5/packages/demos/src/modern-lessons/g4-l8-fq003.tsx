"use client";
import {G4_L8_FINAL_QUIZ_AUDIO_ASSETS} from './generated/g4-l8-final-quiz-audio';
import {CourseG04L08Fq003Renderer,getCourseG04L08Fq003FrameState} from '../modules/course-g04-l08-fq-003';
import {createFinalQuizPresentation} from './g4-l4-final-quiz-presentation';
import {createCourseG04L08Fq003Config} from './course-g04-l08-fq-003-native-content';
import type {SourceQuizAudioAsset} from './g4-l4-final-quiz-audio';
import {G4_L8_FQ003_TEXT_BINDING} from './g4-l8-fq003/source.generated';

export {G4_L8_FQ003_TEXT_BINDING};

/** Own-source My Lesson adapter; the registered presentation below binds the
 * exact source-derived L8 assets also declared by its source module. */
export function createG4L8Fq003TextPresentation(assets:readonly SourceQuizAudioAsset[]) {
 return createFinalQuizPresentation({
  ...createCourseG04L08Fq003Config(assets),
  animationId:'course-g04-l08-fq-003',
  sourceSha256:'31804ffb5124aeb1ff975c5e96ad0a040532571d16467414efd53eb4823f43fd',
  mode:'sequential-twenty-four',frameDomain:'sprite-727',frameCount:68,
  binding:G4_L8_FQ003_TEXT_BINDING,
 },getCourseG04L08Fq003FrameState,CourseG04L08Fq003Renderer);
}

export const G4_L8_FQ003_TEXT_PRESENTATION = createG4L8Fq003TextPresentation(G4_L8_FINAL_QUIZ_AUDIO_ASSETS);
