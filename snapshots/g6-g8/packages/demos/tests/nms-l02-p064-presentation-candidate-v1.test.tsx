import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P064_PRESENTATION_DATA as data} from '../src/nms-l02-p064-presentation-data-v1';
import {P064QuestionView, P064QuizCandidate, P064ReviewSourceRiskNotice, answerP064Candidate,
  createP064CandidateSession} from '../src/nms-l02-p064-quiz-candidate';
import {advanceP064Review, p064CurrentReview} from '../src/nms-l02-p064-quiz-state-candidate';
import {P064_Q5_DYNAMIC_FIELD_DEFAULTS, P064_SOURCE_REVIEW_LOOKUP_MISSES,
  p064ReviewLookupMiss, p064ReviewTargetMiss} from '../src/nms-l02-p064-source-risk-candidate';

test('35 question prompts, 140 choices, source IDs, and keyed answers survive extraction', () => {
  assert.equal(data.semanticStatus, 'static-visual-candidate-not-original-runtime-or-human-reviewed');
  assert.equal(data.questions.length, 35);
  assert.equal(data.questions.reduce((sum, question) => sum + question.options.length, 0), 140);
  for (const [index, question] of data.questions.entries()) {
    assert.equal(question.id, index + 1);
    assert.equal(question.questionFrame, index + 2);
    assert.equal(question.reviewFrame, index + 55);
    assert.match(question.prompt, /\?/);
    assert.deepEqual(question.options.map(option => option.letter), ['A', 'B', 'C', 'D']);
    assert.equal(question.options.filter(option => option.correct).length, 1);
    assert.equal(question.options.find(option => option.correct)?.letter, question.correctLetter);
  }
  assert.equal(data.questions[9].options[3].sourceInstance, 'A10Opt4 ');
  assert.equal(data.questions[22].options[2].sourceInstance, 'A231Opt3');
});

test('picture choices bind A-D by source option, not sorted SVG symbol ID', () => {
  assert.deepEqual(data.questions[8].options.map(option => option.sourceSpriteId), [185, 188, 194, 191]);
  assert.deepEqual(data.questions[9].options.map(option => option.sourceSpriteId), [202, 205, 211, 208]);
  for (const question of data.questions.slice(6, 10)) {
    for (const option of question.options) {
      assert.equal(option.value, null);
      assert.ok('picture' in option && option.picture?.source.startsWith('data:image/svg+xml;base64,'));
      assert.ok(typeof option.pictureAlt === 'string' && option.pictureAlt.length > 15);
    }
  }
});

test('embedded source vectors have a one-to-one asset inventory with exact export hashes', () => {
  const csv = readFileSync(new URL('../../../migrations/shared-nms002-l02-p064/asset-inventory.csv',
    import.meta.url), 'utf8').trim().split('\n');
  assert.equal(csv.length, 29);
  const rows = csv.slice(1).map(line => line.split(','));
  assert.ok(rows.every(row => row.length === 15));
  const indexed = new Map(rows.map(row => [row[0], row]));
  for (const question of data.questions) {
    const prefix = `p064-q${String(question.id).padStart(2, '0')}`;
    const illustration = question.illustration;
    if (illustration?.kind === 'source-illustration') {
      const row = indexed.get(`${prefix}-figure`);
      assert.equal(row?.[1], String(illustration.sourceShapeId));
      assert.equal(row?.[7], illustration.sha256);
    }
    for (const option of question.options) {
      if (!option.picture) continue;
      const row = indexed.get(`${prefix}-option-${option.letter.toLowerCase()}`);
      assert.equal(row?.[1], String(option.sourceSpriteId));
      assert.equal(row?.[7], option.picture.sha256);
    }
  }
});

test('native question views expose source diagrams and keyboard-native answer buttons', () => {
  const q1 = renderToStaticMarkup(<P064QuestionView question={data.questions[0]} ordinal={1} onAnswer={() => {}}/>);
  assert.match(q1, /data-source-shape="23"/);
  assert.match(q1, /<h3[^>]*tabindex="-1"[^>]*data-p064-focus/);
  assert.match(q1, /<img[^>]+alt="Circle divided into five equal parts/);
  assert.equal((q1.match(/<button/g) ?? []).length, 4);
  assert.match(q1, /<math aria-label="1\/5"/);
  const q9 = renderToStaticMarkup(<P064QuestionView question={data.questions[8]} ordinal={4} onAnswer={() => {}}/>);
  assert.match(q9, /data-source-sprite="194"/);
  assert.match(q9, /Two of three circle sectors shaded/);
  assert.equal((q9.match(/<audio /g) ?? []).length, 10);
  assert.match(q9, /question-audio\/EA\/9/);
  assert.match(q9, /question-audio\/SA\/9/);
  assert.match(q9, /option-audio\/EA\/9\/B/);
  assert.match(q9, /option-audio\/SA\/9\/D/);
  assert.match(q9, /original controls, and synchronization are not accepted/);
  const q30 = renderToStaticMarkup(<P064QuestionView question={data.questions[29]} ordinal={7} onAnswer={() => {}}/>);
  assert.match(q30, /Number line from 0 to 2/);
  assert.match(q30, /data-source-shape="477"/);
  const q5 = renderToStaticMarkup(<P064QuestionView question={data.questions[4]} ordinal={5} onAnswer={() => {}}/>);
  assert.match(q5, /data-p064-source-risk="q5-dynamic-fields"/);
  assert.match(q5, /ten editable fields initially set to 0/);
  const q5Spanish = renderToStaticMarkup(<P064QuestionView question={data.questions[4]} ordinal={5}
    uiLanguage="es" onAnswer={() => {}}/>);
  assert.match(q5Spanish, /diez campos editables con valor inicial 0/);
  const initial = renderToStaticMarkup(<P064QuizCandidate seed={0} uiLanguage="es"/>);
  assert.match(initial, /data-source-alignment="candidate-not-accepted"/);
  assert.equal((initial.match(/data-p064-focus/g) ?? []).length, 1);
  assert.match(initial, /Audio y revisión de traducción pendientes/i);
  assert.match(initial, /aria-label="Opciones de respuesta"/);
  assert.match(initial, /<button type="button" lang="en"/);
  assert.match(initial, /audio de origen sin aprobar/);
});

test('visible source-risk markers match frozen Q5 fields and three review lookup misses', () => {
  const ir = JSON.parse(readFileSync(new URL(
    '../../../migrations/shared-nms002-l02-p064/audit/question-content-ir-v1.json', import.meta.url), 'utf8'));
  const display = JSON.parse(readFileSync(new URL(
    '../../../migrations/shared-nms002-l02-p064/audit/active-display-list-v1.json', import.meta.url), 'utf8'));
  assert.deepEqual(P064_SOURCE_REVIEW_LOOKUP_MISSES, ir.sourceDerivedReviewLookupMisses);
  assert.deepEqual(ir.questions[4].frameDeltaPlacements.filter((item: {name: string | null}) =>
    item.name && /^Txt\d+$/.test(item.name)).map((item: {name: string; rawText: string}) =>
    [item.name, item.rawText]), P064_Q5_DYNAMIC_FIELD_DEFAULTS.map(name => [name, '0']));
  for (const miss of P064_SOURCE_REVIEW_LOOKUP_MISSES) {
    const option = data.questions[miss.questionId - 1].options[miss.option - 1];
    assert.equal(option.sourceInstance, miss.clickedInstanceName);
    assert.equal(option.correct, false);
    assert.deepEqual(p064ReviewLookupMiss(miss.questionId, miss.option), miss);
    const risk = p064ReviewTargetMiss(miss.questionId, miss.option)!;
    const active = display.questions.find((item: {questionId: number}) => item.questionId === miss.questionId);
    const sourceNames = new Set(active.reviewActivePlacements.map((item: {name: string | null}) => item.name));
    assert.equal(sourceNames.has(risk.computedReviewName), false);
    assert.equal(risk.computedFeedbackName,
      `TxtFeed${miss.clickedInstanceName.slice(miss.clickedInstanceName.indexOf('Opt') + 3)}`);
    assert.equal(risk.feedbackFieldLookupMiss, !sourceNames.has(risk.computedFeedbackName));
  }
  assert.deepEqual(P064_SOURCE_REVIEW_LOOKUP_MISSES.map(miss =>
    p064ReviewTargetMiss(miss.questionId, miss.option)?.computedFeedbackName),
  ['TxtFeed4 ', 'TxtFeed3', 'TxtFeed3']);
  assert.deepEqual(P064_SOURCE_REVIEW_LOOKUP_MISSES.map(miss =>
    p064ReviewTargetMiss(miss.questionId, miss.option)?.feedbackFieldLookupMiss), [true, false, false]);
  const q10 = renderToStaticMarkup(<P064ReviewSourceRiskNotice questionId={10} option={4}/>);
  assert.match(q10, /data-p064-feedback-instance="TxtFeed4 "/);
  assert.match(q10, /data-p064-feedback-lookup="missing"/);
  assert.match(q10, /review sprite and feedback text field lookups have no match/);
  assert.match(q10, /modern candidate; original behavior is unverified/);
  const q21 = renderToStaticMarkup(<P064ReviewSourceRiskNotice questionId={21} option={3}/>);
  assert.match(q21, /data-p064-feedback-instance="TxtFeed3"/);
  assert.match(q21, /data-p064-feedback-lookup="matched"/);
  assert.match(q21, /feedback text field name still matches/);
  const q23 = renderToStaticMarkup(<P064ReviewSourceRiskNotice questionId={23} option={3} uiLanguage="es"/>);
  assert.match(q23, /data-p064-feedback-lookup="matched"/);
  assert.match(q23, /campo de texto de retroalimentación sí coincide/);
  assert.equal(renderToStaticMarkup(<P064ReviewSourceRiskNotice questionId={10} option={2}/>), '');
  assert.equal(p064ReviewLookupMiss(10, 2), undefined);
  assert.equal(p064ReviewLookupMiss(21, 4), undefined);
  assert.equal(p064ReviewLookupMiss(23, 2), undefined);
});

test('all 35 source questions expose the host-mapped A–D audio candidates without file bytes', () => {
  for (const question of data.questions) {
    const html = renderToStaticMarkup(<P064QuestionView question={question} ordinal={1} onAnswer={() => {}}/>);
    assert.equal((html.match(/<audio /g) ?? []).length, 10);
    for (const folder of ['EA', 'SA']) {
      assert.match(html, new RegExp(`question-audio/${folder}/${question.id}(?:"|\\?)`));
      for (const option of ['A', 'B', 'C', 'D']) {
        assert.match(html, new RegExp(`option-audio/${folder}/${question.id}/${option}(?:"|\\?)`));
      }
    }
    assert.doesNotMatch(html, /\.mp3/);
  }
});

test('ten seeded answers are unique, stale clicks cannot answer the next item, and review remains local', () => {
  let session = createP064CandidateSession(42);
  const selected: number[] = [];
  for (let ordinal = 0; ordinal < 10; ordinal++) {
    const questionId = session.quiz.currentQuestionId!;
    selected.push(questionId);
    session = answerP064Candidate(session, questionId, 1);
    assert.equal(answerP064Candidate(session, questionId, 1), session);
  }
  assert.equal(new Set(selected).size, 10);
  assert.equal(session.quiz.phase, 'finish');
  const first = advanceP064Review(session.quiz);
  assert.equal(first.phase, 'review');
  assert.equal(p064CurrentReview(first)?.questionId, selected[0]);
  assert.deepEqual(createP064CandidateSession(42).quiz.currentQuestionId, selected[0]);
});
