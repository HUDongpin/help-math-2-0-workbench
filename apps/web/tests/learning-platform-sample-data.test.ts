import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  G4_L3_PAGE_TITLES,
  LEARNER_POWER_SAMPLE,
  LEARNER_SUMMARY_SAMPLE,
  LEARNING_HELPER_SAMPLE,
  LEARNING_PLATFORM_SAMPLE_BOUNDARY,
  LEARNING_SECTIONS,
  NOVA_CONTROL_SAMPLE,
  TEACHER_ATTENTION_SAMPLE,
  TEACHER_ROSTER_SAMPLE,
  WORDS_CONTEXT_SAMPLE,
  WORDS_G4_L3,
  WORDS_G5_L4,
  WORDS_WITH_SOURCE_GAPS,
} from '../lib/learning-platform-sample-data';

const SAMPLE_FIXTURE_SHA256 =
  '4027247412aa018ee5361a4d36cc50664d3f12f50e3b281789df2d13b813bd68';

function sampleFixtureSha256() {
  const fixture = {
    LEARNING_SECTIONS,
    WORDS_G4_L3,
    WORDS_G5_L4,
    WORDS_CONTEXT_SAMPLE,
    WORDS_WITH_SOURCE_GAPS,
    LEARNER_POWER_SAMPLE,
    LEARNER_SUMMARY_SAMPLE,
    TEACHER_ROSTER_SAMPLE,
    TEACHER_ATTENTION_SAMPLE,
    LEARNING_HELPER_SAMPLE,
    NOVA_CONTROL_SAMPLE,
    G4_L3_PAGE_TITLES,
    LEARNING_PLATFORM_SAMPLE_BOUNDARY,
  };
  return createHash('sha256').update(JSON.stringify(fixture)).digest('hex');
}

test('the design transcription retains its 8-step and 39-page lesson sample data', () => {
  assert.equal(LEARNING_SECTIONS.length, 8);
  assert.equal(
    LEARNING_SECTIONS.reduce((total, section) => total + section.pages, 0),
    39,
  );
  assert.equal(new Set(LEARNING_SECTIONS.map((section) => section.code)).size, 8);

  assert.equal(G4_L3_PAGE_TITLES.length, 39);
});

test('invented learner and teacher values remain present and explicitly classified as samples', () => {
  assert.deepEqual(LEARNER_SUMMARY_SAMPLE, {
    name: 'Maria',
    streakDays: 4,
    stickers: 5,
    currentPage: 21,
    totalPages: 39,
    currentStep: 4,
    totalSteps: 8,
  });
  assert.equal(LEARNER_POWER_SAMPLE.length, 4);
  assert.equal(TEACHER_ROSTER_SAMPLE.length, 8);
  assert.equal(TEACHER_ATTENTION_SAMPLE.length, 4);
  assert.equal(LEARNING_HELPER_SAMPLE.length, 6);
  assert.equal(NOVA_CONTROL_SAMPLE.length, 4);

  assert.equal(LEARNING_PLATFORM_SAMPLE_BOUNDARY.isProductionData, false);
  assert.equal(
    LEARNING_PLATFORM_SAMPLE_BOUNDARY.dataClassifications.learnerSummary,
    'invented-sample',
  );
  assert.equal(
    LEARNING_PLATFORM_SAMPLE_BOUNDARY.dataClassifications.teacherRoster,
    'invented-sample',
  );
  assert.ok(LEARNING_PLATFORM_SAMPLE_BOUNDARY.inventedPrototypeData.includes('stickers'));
});

test('current-JavaScript evidence remains visible without expanding publication claims', () => {
  const {grade4Lesson3, grade5Lesson4} =
    LEARNING_PLATFORM_SAMPLE_BOUNDARY.lessonEvidenceBoundary;

  assert.deepEqual(
    LEARNING_PLATFORM_SAMPLE_BOUNDARY.prototypeUi.openLessonKeys,
    ['4-3', '5-4'],
  );
  assert.equal(grade4Lesson3.role, 'current-javascript-showcase-and-evidence');
  assert.equal(grade4Lesson3.strictCompletionClaim, false);
  assert.equal(grade4Lesson3.publicationClaim, false);
  assert.equal(grade5Lesson4.role, 'prototype-and-audit-evidence-only');
  assert.equal(grade5Lesson4.publicRunnable, false);
  assert.equal(grade5Lesson4.publicationClaim, false);
  assert.equal(LEARNING_PLATFORM_SAMPLE_BOUNDARY.acceptanceClaims.release, false);
  assert.equal(LEARNING_PLATFORM_SAMPLE_BOUNDARY.acceptanceClaims.publication, false);
});

test('all preserved prototype fixtures remain byte-for-byte stable', () => {
  assert.equal(sampleFixtureSha256(), SAMPLE_FIXTURE_SHA256);
});

test('workspace keeps ordinary learning clean while retaining fixtures behind designer tools', async () => {
  const [workspaceSource, workspaceCss, homeSource] = await Promise.all([
    readFile(
      new URL('../components/learning-platform-workspace.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/learning-platform-workspace.module.css', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../app/[locale]/page.tsx', import.meta.url), 'utf8'),
  ]);

  for (const removedText of [
    'LEARNING + SAMPLE STATE',
    'SAMPLE TEACHER DATA',
    'Changes learner/teacher previews and their links',
  ]) {
    assert.equal(workspaceSource.includes(removedText), false);
  }
  assert.doesNotMatch(workspaceSource, /LEARNER_POWER_SAMPLE/u);
  assert.doesNotMatch(workspaceSource, /LEARNER_SUMMARY_SAMPLE/u);
  assert.doesNotMatch(workspaceSource, /Hi Maria|Hola María|21 \/ 39/u);
  assert.match(workspaceSource, /data-browser-progress-summary/u);
  assert.match(workspaceSource, /data-publication-tier=\{publicationTier\}/u);
  assert.match(workspaceSource, /publicationTier === 'preview'[\s\S]*'Preview'/u);
  assert.match(workspaceSource, /publicationTier === 'released'/u);
  assert.match(workspaceSource, /screen === 'notes'[\s\S]*>EVIDENCE<\/span>/);
  assert.match(workspaceSource, /designerToolsVisible \? <>[\s\S]*Design notes[\s\S]*Migration status/);
  assert.match(workspaceSource, /designerToolsVisible && screen === 'notes'/);
  assert.match(workspaceSource, /aria-label=\{spanish \? 'Rol del espacio de aprendizaje' : 'Learning workspace role'\}/);
  assert.doesNotMatch(workspaceSource, /designerToolsVisible \? <div aria-label=[\s\S]*role/);
  assert.match(workspaceSource, /designerToolsVisible[\s\S]*WORDS_G5_L4[\s\S]*WORDS_CONTEXT_SAMPLE[\s\S]*WORDS_WITH_SOURCE_GAPS/);
  assert.match(workspaceSource, /: \[currentLessonGroup\]/);
  assert.match(workspaceSource, /Workspace language/);
  assert.match(workspaceSource, /data-brand-word="help">HELP/);
  assert.match(workspaceSource, /data-brand-word="math">Math/);
  assert.doesNotMatch(workspaceSource, /LESSON_CATALOG_SAMPLE/);
  assert.match(homeSource, /lessonCatalog=\{publicLessonCatalog\(\)\}/u);
  assert.match(homeSource,
    /teacherAvailable = !production \|\| publicFeatureEnabled\('teacher'\)/u);
  assert.match(homeSource,
    /publicAuthAvailable = !production \|\| publicFeatureEnabled\('auth'\)/u);
  assert.match(homeSource,
    /novaTutorAvailable = !production \|\| publicFeatureEnabled\('novaTutor'\)/u);
  assert.match(workspaceSource,
    /\{novaTutorAvailable \? <article[\s\S]*className=\{`\$\{styles\.card\} \$\{styles\.novaCard\}`\}[\s\S]*<\/article> : null\}/u);
  assert.match(workspaceCss, /--brand-help: #14213d;/);
  assert.match(workspaceCss, /--brand-math: #1768d4;/);
  assert.match(workspaceCss, /--brand-help: #f5f3fc;/);
  assert.match(workspaceCss, /--brand-math: #7891f5;/);
});
