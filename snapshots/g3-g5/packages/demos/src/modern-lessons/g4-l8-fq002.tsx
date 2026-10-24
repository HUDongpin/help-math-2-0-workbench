"use client";
import {G4_L8_FINAL_QUIZ_AUDIO_ASSETS} from './generated/g4-l8-final-quiz-audio';
import {CourseG04L08Fq002Renderer,getCourseG04L08Fq002FrameState} from '../modules/course-g04-l08-fq-002';
import {createFinalQuizPresentation} from './g4-l4-final-quiz-presentation';
import {createCourseG04L08Fq002Config} from './course-g04-l08-fq-002-native-content';
import type {SourceQuizAudioAsset} from './g4-l4-final-quiz-audio';
import {G4_L8_FQ002_TEXT_BINDING} from './g4-l8-fq002/source.generated';

export {G4_L8_FQ002_TEXT_BINDING};

/** Own-source My Lesson adapter; the registered presentation below binds the
 * exact source-derived L8 assets also declared by its source module. */
export function createG4L8Fq002TextPresentation(assets:readonly SourceQuizAudioAsset[]) {
 return createFinalQuizPresentation({
  ...createCourseG04L08Fq002Config(assets),
  animationId:'course-g04-l08-fq-002',
  sourceSha256:'058e0440f906153d77937a318ea45bc1e45dcb43a4902467dff1e47587720f6f',
  mode:'random-ten',frameDomain:'sprite-727',frameCount:68,
  binding:G4_L8_FQ002_TEXT_BINDING,
 },getCourseG04L08Fq002FrameState,CourseG04L08Fq002Renderer);
}

export const G4_L8_FQ002_TEXT_PRESENTATION = createG4L8Fq002TextPresentation(G4_L8_FINAL_QUIZ_AUDIO_ASSETS);
