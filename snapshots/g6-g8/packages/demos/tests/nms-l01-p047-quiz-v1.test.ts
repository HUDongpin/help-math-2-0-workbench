import assert from 'node:assert/strict';
import {test} from 'node:test';
import {P047_SOURCE} from '../src/nms-l01-p047-source-data-v1';
import {p047TextSnapshot, P047_TEXT_BINDING} from '../src/nms-l01-p047-text-v1';
import {P047SessionV1} from '../src/nms-l01-p047-session-v1';
import {createP047Quiz, p047InputIdentity, p047Question, p047Results, p047Review, p047SourceFrame,
  reduceP047Quiz, p047AudioAsset, type P047Choice, type P047QuizState} from '../src/nms-l01-p047-quiz-v1';

// Independent transcription of the complete source arrayAnswer, not a second
// computation from the generated module's correct flags.
const sourceAnswers = ['A','A','B','C','A','C','C','B','A','D','D','C','B','C','B','D','C','C','A','D','B','B','A','D','D','B','B'];
function answer(state: P047QuizState, choice?: P047Choice) {
  const identity = p047InputIdentity(state);
  return reduceP047Quiz(state, {type: 'answer', identity, choice: choice ?? sourceAnswers[identity.questionId! - 1] as P047Choice,
    elapsedMs: (state.responses.length + 1) * 1234});
}
function completed(seed: number, correctCount = 10) {
  let state = createP047Quiz(seed);
  for (let index = 0; index < 10; index++) {
    const correct = sourceAnswers[p047InputIdentity(state).questionId! - 1] as P047Choice;
    state = answer(state, index < correctCount ? correct : correct === 'A' ? 'B' : 'A');
  }
  return state;
}

test('source bank has27 exact keys, semantic fractions and temperature tables', () => {
  assert.equal(P047_SOURCE.questions.length, 27);
  for (const question of P047_SOURCE.questions) {
    assert.equal(question.correctLetter, sourceAnswers[question.id - 1]);
    assert.equal(question.options.filter(option => option.correct).length, 1);
    assert.equal(question.questionFrame, question.id + 1);
    assert.equal(question.reviewFrame, question.id + 46);
  }
  assert.deepEqual(p047Question(6).options.map(option => option.value), ['−1/0', '−1', '0', '1/0']);
  assert.deepEqual([7, 8, 9].map(id => p047Question(id).figure?.kind), ['temperature-table', 'temperature-table', 'temperature-table']);
  assert.match(p047Question(19).prompt, /115° F/);
  assert.match(p047Question(19).prompt, /3° every/);
  assert.match(p047Question(20).prompt, /15° F/);
  assert.match(p047Question(21).prompt, /85° F/);
  assert.ok(Object.isFrozen(P047_SOURCE.questions[0]!.options[0]));
});

test('512 deterministic sessions each draw exactly10 distinct source questions', () => {
  const seen = new Set<number>();
  for (let seed = 0; seed < 512; seed++) {
    const first = completed(seed);
    assert.deepEqual(first, completed(seed));
    assert.equal(first.phase, 'result');
    assert.equal(first.order.length, 10);
    assert.equal(first.remaining.length, 17);
    assert.equal(new Set([...first.order, ...first.remaining]).size, 27);
    assert.equal(first.responses.length, 10);
    assert.equal(first.revision, 10);
    first.order.forEach(id => seen.add(id));
  }
  assert.equal(seen.size, 27);
  assert.notDeepEqual(completed(0).order, completed(1).order);
});

test('all108 question-option combinations preserve actual source instances and final review feedback', () => {
  const covered = new Set<string>();
  for (let seed = 0; seed < 100; seed++) for (const choice of ['A', 'B', 'C', 'D'] as const) {
    let state = createP047Quiz(seed);
    while (state.phase === 'question') state = answer(state, choice);
    state = reduceP047Quiz(state, {type: 'review', identity: p047InputIdentity(state)});
    for (let ordinal = 1; ordinal <= 10; ordinal++) {
      const review = p047Review(state)!;
      const expected = sourceAnswers[review.question.id - 1];
      assert.equal(review.response.choice, choice);
      assert.equal(review.response.ordinal, ordinal);
      assert.equal(review.response.correct, choice === expected);
      assert.equal(review.options.find(option => option.letter === expected)!.feedback, 'Correct');
      assert.equal(review.options.filter(option => option.feedback === 'Correct').length, 1);
      assert.equal(review.options.filter(option => option.feedback === 'Incorrect').length, choice === expected ? 0 : 1);
      assert.equal(p047SourceFrame(state).frame, review.question.id + 46);
      covered.add(`${review.question.id}:${choice}`);
      if (review.question.id === 23 && choice === 'C') {
        assert.equal(review.response.sourceInstance, 'A231Opt3');
        assert.equal(review.options.find(option => option.letter === 'C')!.sourceInstance, 'R23Opt3');
      }
      if (review.question.id === 21 && choice === 'C') assert.equal(review.options.find(option => option.letter === 'C')!.sourceInstance, 'R210Opt3');
      state = reduceP047Quiz(state, {type: 'review-next', identity: p047InputIdentity(state)});
    }
    assert.equal(state.phase, 'result');
    assert.equal(state.responses.length, 10);
    assert.equal(state.reviewIndex, null);
  }
  assert.equal(covered.size, 108);
});

test('source grade boundaries and completion elapsed snapshot cover scores0 through10', () => {
  const grades = ['Unsatisfactory','Unsatisfactory','Unsatisfactory','Unsatisfactory',
    'Partially Proficient','Partially Proficient','Partially Proficient','Proficient','Proficient','Advanced','Advanced'];
  assert.equal(p047Results(createP047Quiz(7)), null);
  for (let correct = 0; correct <= 10; correct++) {
    const state = completed(7, correct);
    assert.deepEqual(p047Results(state), {correct, wrong: 10 - correct, total: 10, grade: grades[correct], elapsedMs: 12340});
    assert.ok(p047SourceFrame(state).finishVisible);
  }
});

test('old answer and replay identities cannot consume the next question', () => {
  const initial = createP047Quiz(3), identity = p047InputIdentity(initial);
  const event = {type: 'answer' as const, identity, choice: 'A' as const, elapsedMs: 100};
  const next = reduceP047Quiz(initial, event);
  assert.equal(next.responses.length, 1);
  assert.equal(reduceP047Quiz(next, event), next);
  for (const patch of [{seed: 4}, {replay: 1}, {revision: 2}, {ordinal: 8}, {questionId: 999}, {phase: 'review' as const}]) {
    assert.equal(reduceP047Quiz(initial, {...event, identity: {...identity, ...patch}}), initial);
  }
  const replayed = reduceP047Quiz(next, {type: 'replay', identity: p047InputIdentity(next)});
  assert.equal(replayed.replay, 1);
  assert.equal(replayed.responses.length, 0);
  assert.equal(replayed.elapsedMs, 0);
  assert.equal(replayed.finishedElapsedMs, null);
  assert.deepEqual(replayed.order, initial.order);
  assert.equal(reduceP047Quiz(replayed, event), replayed);
});

test('invalid actions and time values leave unanswered questions and completed scores intact', () => {
  const initial = createP047Quiz(8);
  for (const type of ['review','review-next','close'] as const) assert.equal(reduceP047Quiz(initial, {type, identity: p047InputIdentity(initial)}), initial);
  for (const elapsedMs of [-1, NaN, Infinity]) assert.equal(reduceP047Quiz(initial, {type: 'answer', identity: p047InputIdentity(initial), choice: 'A', elapsedMs}), initial);
  const next = answer(initial);
  assert.equal(reduceP047Quiz(next, {type: 'answer', identity: p047InputIdentity(next), choice: 'A', elapsedMs: 1}), next);
  assert.equal(reduceP047Quiz(initial, {type: 'answer', identity: p047InputIdentity(initial), choice: 'E' as P047Choice, elapsedMs: 1}), initial);
  const result = completed(8), closed = reduceP047Quiz(result, {type: 'close', identity: p047InputIdentity(result)});
  assert.equal(closed.phase, 'closed');
  assert.deepEqual(p047Results(closed), p047Results(result));
  assert.equal(reduceP047Quiz(result, {type: 'answer', identity: p047InputIdentity(result), choice: 'A', elapsedMs: 100000}), result);
  assert.equal(reduceP047Quiz(closed, {type: 'review', identity: p047InputIdentity(closed)}), closed);
  for (const seed of [-1, 1.5, NaN, 0x100000000]) assert.throws(() => createP047Quiz(seed));
  assert.throws(() => p047Question(0));
});

test('all270 audio identities bind question/choice/language without changing quiz state', () => {
  const state = createP047Quiz(1), snapshot = JSON.stringify(state), ids = new Set<string>();
  for (let question = 1; question <= 27; question++) for (const language of ['en', 'es'] as const) for (const choice of [null, 'A', 'B', 'C', 'D'] as const) {
    const audio = p047AudioAsset(question, language, choice);
    assert.equal(audio.path, `G6-G8-shared/NMS002/L1/FQ/${language === 'es' ? 'SA' : 'EA'}/Q${question}${choice ?? ''}.mp3`);
    assert.match(audio.sha256, /^[a-f0-9]{64}$/);
    assert.ok(audio.bytes > 0);
    ids.add(audio.id);
  }
  assert.equal(ids.size, 270);
  assert.equal(JSON.stringify(state), snapshot);
  assert.throws(() => p047AudioAsset(28, 'en', null));
});

test('native text snapshots bind each visible question and figure to the same quiz state in EN and ES', () => {
  const seen = new Set<number>();
  const ids = P047_TEXT_BINDING.blocks.map(block => block.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(P047_TEXT_BINDING.blocks.map(block => block.readingOrder)).size, ids.length);
  for (let seed = 0; seed < 100; seed++) {
    let state = createP047Quiz(seed);
    for (let ordinal = 1; ordinal <= 10; ordinal++) {
      const questionId = p047InputIdentity(state).questionId!;
      seen.add(questionId);
      const english = p047TextSnapshot(state, 'en'), spanish = p047TextSnapshot(state, 'es');
      assert.equal(english.status, 'ready');assert.equal(spanish.status, 'ready');
      assert.deepEqual(english.blocks, spanish.blocks);
      const visible = english.blocks.filter(block => block.visible);
      assert.equal(visible.filter(block => block.role === 'question').length, 1);
      assert.equal(visible.filter(block => block.role === 'answer').length, 4);
      assert.equal(visible.find(block => block.id === 'progress')!.text, `${ordinal} / 10`);
      assert.ok(visible.filter(block => block.id.startsWith('q')).every(block => block.id.startsWith(`q${questionId}-`)));
      if (questionId <= 3) assert.equal(visible.filter(block => block.id.includes('-tick-')).length, 19);
      if ([7,8,9].includes(questionId)) assert.equal(visible.filter(block => /^q\d+-temperature-\d+$/.test(block.id)).length, 12);
      state = answer(state);
    }
    const result = p047TextSnapshot(state, 'en');
    assert.deepEqual(result.blocks.filter(block => block.visible).map(block => block.id), ['finish-score', 'finish-message', 'finish-score-label', 'source-quiz-title']);
    assert.equal(result.blocks.find(block => block.id === 'finish-score')!.text, '10 / 10.');
  }
  assert.equal(seen.size, 27);
});

test('mounted session owns elapsed time and preserves quiz state across pause, volume and audio-language changes', async () => {
  let now = 1000;
  const session = new P047SessionV1(7, 'en', {now: () => now, changed: () => {}, readAudio: async () => {throw Error('unexpected read');}});
  now = 1500; assert.equal(session.elapsedMs(), 500);
  session.setPaused(true); now = 9000; assert.equal(session.elapsedMs(), 500);
  const held = session.snapshot().quiz;
  assert.equal(session.dispatch({type: 'answer', identity: p047InputIdentity(held), choice: 'A', elapsedMs: 0}), false);
  session.setAudioLanguage('es');session.setVolume(.4);assert.equal(session.snapshot().quiz, held);
  session.setPaused(false);now = 9500;
  assert.equal(session.dispatch({type: 'answer', identity: p047InputIdentity(held), choice: 'A', elapsedMs: 999999}), true);
  assert.equal(session.snapshot().quiz.responses[0]!.elapsedMs, 1000);
  assert.equal(session.dispatch({type: 'answer', identity: p047InputIdentity(held), choice: 'A', elapsedMs: 0}), false);
  for (let index = 1; index < 10; index++) {
    now += 100;session.dispatch({type: 'answer', identity: p047InputIdentity(session.snapshot().quiz), choice: 'A', elapsedMs: 0});
  }
  assert.equal(session.elapsedMs(), 1900);now += 10000;assert.equal(session.elapsedMs(), 1900);
  session.setPaused(true);session.replay();assert.equal(session.elapsedMs(), 0);assert.equal(session.snapshot().paused, false);
  assert.equal(session.snapshot().quiz.responses.length, 0);assert.equal(session.snapshot().audioLanguage, 'es');
  await session.close();assert.equal(session.snapshot().closed, true);assert.equal(session.snapshot().audio.phase, 'closed');
  assert.equal(session.replay(), false);
});
