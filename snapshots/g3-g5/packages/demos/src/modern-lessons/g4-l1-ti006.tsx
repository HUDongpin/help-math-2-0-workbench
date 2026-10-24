'use client';

import React from 'react';
import type {LessonTextActivityDefinition, LessonTextBinding} from '../lesson-text-contract';
import {getCourseG04L01Ti006FrameState} from '../modules/course-g04-l01-ti-006';
import {G4_L1_TI006_SOURCE_DATA as SOURCE} from './generated/g4-l1-ti006-source-v1';
import {createSourceSixQuestionChoice, SourceChoiceText, type SixQuestionChoiceConfig, type SixQuestionChoiceHelpProps} from './source-six-question-choice';

const ID = SOURCE.animationId;
const textIds = (characterId: number) => SOURCE.sourceText.find(d => d.characterId === characterId)!.runs.map(r => r.id);
const runIds = (...runs: number[]) => runs.map(run => `character-20/run-${run}`);
const sourceRuns = (...runs: number[]) => runs.map(run => SOURCE.helpRuns[run].text).join('').replace(/\s+/g, ' ').trim();
export const G4_L1_TI006_KEY_TERMS = Object.freeze({
  Tenth: {entryId: 'en-0689-54a015fcae02', buttonCharacter: 22},
  Round: {entryId: 'en-0590-a3b0d2491c13', buttonCharacter: 23},
  'Millions place': {entryId: 'en-0384-8726651807e4', buttonCharacter: 24},
});
export const G4_L1_TI006_KEY_TERMS_CAPABILITY = Object.freeze({indexLanguage: 'en' as const, sourceAssetId: 'ELKTEG4.xml',
  sourceSha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749', entryIds: Object.values(G4_L1_TI006_KEY_TERMS).map(t => t.entryId)});
const helpDefinitions = [
  {id:'help-example1-title',sourceTextIds:runIds(0),role:'heading' as const,text:sourceRuns(0)},
  {id:'help-example1-prompt',sourceTextIds:runIds(1,2,3),role:'body' as const,text:sourceRuns(1,2,3)},
  {id:'help-example1-number',sourceTextIds:runIds(4,5,6,7,8,10),role:'label' as const,text:'123,456,789'},
  {id:'help-example1-down',sourceTextIds:runIds(11),role:'body' as const,text:sourceRuns(11)},
  {id:'help-example1-up',sourceTextIds:runIds(12),role:'body' as const,text:sourceRuns(12)},
  {id:'help-example1-check',sourceTextIds:runIds(13,14,15,17),role:'label' as const,text:'123,456,789'},
  {id:'help-example1-explanation',sourceTextIds:runIds(18),role:'body' as const,text:sourceRuns(18)},
  {id:'help-example1-answer',sourceTextIds:runIds(19),role:'label' as const,text:sourceRuns(19)},
  {id:'help-example2-title',sourceTextIds:runIds(20),role:'heading' as const,text:sourceRuns(20)},
  {id:'help-example2-prompt',sourceTextIds:runIds(21,22,23,24),role:'body' as const,text:'Round 4.56 to the nearest tenth.'},
  {id:'help-example2-number',sourceTextIds:runIds(24,25,27),role:'label' as const,text:'4.56'},
  {id:'help-example2-down',sourceTextIds:runIds(28),role:'body' as const,text:sourceRuns(28)},
  {id:'help-example2-up',sourceTextIds:runIds(29),role:'body' as const,text:'If 5, 6, 7, 8, 9, then round up (add 1).'},
  {id:'help-example2-check',sourceTextIds:runIds(29,30,31),role:'label' as const,text:'4.56'},
  {id:'help-example2-explanation',sourceTextIds:runIds(32),role:'body' as const,text:sourceRuns(32)},
];
const definitions = [
  {id:'root-title',sourceTextIds:textIds(30),role:'title' as const,text:SOURCE.sourceText.find(t=>t.characterId===30)!.runs.map(r=>r.text).join('')},
  {id:'exercise-number',sourceTextIds:textIds(34),sourceShapeIds:[33],role:'label' as const,text:SOURCE.sourceText.find(t=>t.characterId===34)!.runs.map(r=>r.text).join('')},
  {id:'instruction',sourceTextIds:textIds(35),role:'body' as const,text:'Click the correct answer.'},
  ...SOURCE.questions.flatMap(q => [
    {id:`question-${q.id}`,sourceTextIds:textIds(q.questionCharacter),role:'question' as const,text:q.prompt},
    ...q.answers.map(a=>({id:`answer-${q.id}-${a.id}`,sourceTextIds:textIds(a.characterId),role:'answer' as const,text:a.text})),
    {id:`wrong-explanation-${q.id}`,sourceTextIds:['character-56'],role:'feedback' as const,text:q.wrongExplanation},
  ]),
  ...SOURCE.feedback.map(branch=>({id:`feedback-${branch.id}`,sourceTextIds:branch.characters.flatMap(textIds),role:'feedback' as const,text:branch.text})),
  {id:'help-button',sourceTextIds:[...textIds(4),...textIds(5)],role:'label' as const,text:'Need More Help'},
  {id:'close',sourceTextIds:textIds(10),role:'label' as const,text:'Close'},
  ...helpDefinitions,
];
export const G4_L1_TI006_TEXT_BINDING: LessonTextBinding = Object.freeze({schemaVersion:1,version:'g04-l01-placement-069-modern-six-choice-v2',
  placementId:SOURCE.placementId,animationId:ID,sourceSwfSha256:SOURCE.sourceSha256,template:'exercise',
  blocks:definitions.map((definition,readingOrder)=>({id:definition.id,sourceTextIds:definition.sourceTextIds,...('sourceShapeIds' in definition?{sourceShapeIds:definition.sourceShapeIds}:{}),role:definition.role,language:'en' as const,readingOrder,valueSource:'maintained-page-state' as const}))});
export const G4_L1_TI006_TEXT = Object.freeze(Object.fromEntries(definitions.map(d=>[d.id,d.text])));
function HelpContent({runtime}: SixQuestionChoiceHelpProps) {
  const term = (name: keyof typeof G4_L1_TI006_KEY_TERMS, label: string) => <button type="button" className="six-choice-modern__term" data-source-keyterm={name}
    data-source-button={G4_L1_TI006_KEY_TERMS[name].buttonCharacter} disabled={!runtime.onLessonHostRequest}
    onClick={event=>runtime.onLessonHostRequest?.({type:'open-keyterm',entryId:G4_L1_TI006_KEY_TERMS[name].entryId,sourceAnimationId:ID,
      playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget,keyTermIndexLanguage:'en'})}>{label}</button>;
  const p = (id:string) => <p data-lesson-text-block={id}>{G4_L1_TI006_TEXT[id]}</p>;
  const digit = (value:string) => <span className="six-choice-modern__digit">{value}<span aria-hidden="true">↑</span></span>;
  return <>
    <article className="six-choice-modern__help-example">
      <h3 data-lesson-text-block="help-example1-title">{G4_L1_TI006_TEXT['help-example1-title']}</h3>
      <p data-lesson-text-block="help-example1-prompt">{term('Round','Round')} <SourceChoiceText text="123,456,789 to the nearest "/>{term('Millions place','million')}.</p>
      <p className="six-choice-modern__number" role="img" tabIndex={0} data-lesson-text-block="help-example1-number" aria-label="123,456,789. Round at 3 in the millions place and inspect the next digit, 4.">12<strong>3</strong>,{digit('4')}56,789</p>
      {p('help-example1-down')}{p('help-example1-up')}
      <p className="six-choice-modern__number" role="img" tabIndex={0} data-lesson-text-block="help-example1-check" aria-label="123,456,789. Inspect the digit 4.">123,{digit('4')}56,789</p>
      {p('help-example1-explanation')}
      <p data-lesson-text-block="help-example1-answer"><SourceChoiceText text={G4_L1_TI006_TEXT['help-example1-answer']}/></p>
    </article>
    <article className="six-choice-modern__help-example">
      <h3 data-lesson-text-block="help-example2-title">{G4_L1_TI006_TEXT['help-example2-title']}</h3>
      <p data-lesson-text-block="help-example2-prompt">{term('Round','Round')} <SourceChoiceText text="4.56 to the nearest "/>{term('Tenth','tenth')}.</p>
      <p className="six-choice-modern__number" role="img" tabIndex={0} data-lesson-text-block="help-example2-number" aria-label="4.56. Inspect the digit 6.">4.5{digit('6')}</p>
      {p('help-example2-down')}{p('help-example2-up')}
      <p className="six-choice-modern__number" role="img" tabIndex={0} data-lesson-text-block="help-example2-check" aria-label="4.56. Inspect the digit 6.">4.5{digit('6')}</p>
      {p('help-example2-explanation')}
    </article>
  </>;
}
const sourcePlacementPath = (id: string) => id.replace(/\/depth-(\d+)\/generation-(\d+)$/, '/depth-$1-generation-$2');
export const G4_L1_TI006_HELP_CLOSE_IDS = Object.freeze(Object.fromEntries(SOURCE.questions.map(q=>[q.id,`help-close-${q.id}`])));
export const G4_L1_TI006_WRONG_CLOSE_IDS = Object.freeze(Object.fromEntries(SOURCE.feedback.filter(b=>b.kind==='wrong').map(b=>[b.id,`${b.id}-close`])));
export const G4_L1_TI006_BUTTON_ACTIVITIES: readonly LessonTextActivityDefinition[] = Object.freeze([
  ...SOURCE.questions.map(q=>({id:G4_L1_TI006_HELP_CLOSE_IDS[q.id],sourceInstanceId:`${sourcePlacementPath(q.popupSourceCatalogInstanceId)}/depth-3-generation-1/button-17/record-10`,
    buttonPress:{sourceButtonId:17},parentLifetime:{firstFrame:q.frame,lastFrameExclusive:q.frame+1},parentFrames:[q.frame],frameDomain:'sprite-16',startFrame:1,endFrame:5,fps:12,
    audio:{...SOURCE.audio.find(a=>a.id==='help-close-click')!,language:'shared' as const,spokenLanguage:'undetermined' as const}})),
  ...SOURCE.feedback.filter(b=>b.kind==='wrong').map(b=>({id:G4_L1_TI006_WRONG_CLOSE_IDS[b.id],sourceInstanceId:`${b.sourceInstanceId}/${sourcePlacementPath(b.popupSourceCatalogInstanceId!).replace(/^sprite-\d+\//,'')}/depth-3-generation-1/button-62/record-10`,
    buttonPress:{sourceButtonId:62},parentLifetime:b.parentLifetime,parentFrames:SOURCE.sourceStops,frameDomain:'sprite-61',startFrame:1,endFrame:5,fps:12,
    audio:{...SOURCE.audio.find(a=>a.id==='wrong-close-click')!,language:'shared' as const,spokenLanguage:'undetermined' as const}})),
]);
export const G4_L1_TI006_CONFIG: SixQuestionChoiceConfig = Object.freeze({...SOURCE,binding:G4_L1_TI006_TEXT_BINDING,text:G4_L1_TI006_TEXT,
  // Native presence mapping for source text34/circle33 at10..90, not a source alpha animation.
  // The complete readable digit replaces its slight introductory mask crop.
  exerciseNumber:{blockId:'exercise-number',alphaFrames:[{frame:1,alpha:0},{frame:10,alpha:256},{frame:91,alpha:0}]},
  helpBlockIds:helpDefinitions.map(d=>d.id),HelpContent,buttonActivities:G4_L1_TI006_BUTTON_ACTIVITIES,helpCloseActivityIds:G4_L1_TI006_HELP_CLOSE_IDS,wrongCloseActivityIds:G4_L1_TI006_WRONG_CLOSE_IDS,keyTerms:G4_L1_TI006_KEY_TERMS_CAPABILITY,getFrameState:getCourseG04L01Ti006FrameState});
export const G4_L1_TI006_TEXT_PRESENTATION = createSourceSixQuestionChoice(G4_L1_TI006_CONFIG);
export const G4L1Ti006ModernRenderer = G4_L1_TI006_TEXT_PRESENTATION.Renderer;
