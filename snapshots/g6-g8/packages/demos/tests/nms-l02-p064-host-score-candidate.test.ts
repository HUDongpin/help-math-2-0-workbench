import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createMemoryOnlyLessonHost, type LessonHostRequest} from '../src/lesson-host-contract';
import {p064HostQuestionId, p064HostScoreMatches, recordP064HostScore,
  resetP064HostScore} from '../src/nms-l02-p064-host-score-candidate';
import {answerP064Candidate, createP064CandidateSession} from '../src/nms-l02-p064-quiz-candidate';

const ID = 'shared-nms002-l02-p064';
const host = (capabilities: ('fq-scoring')[] = ['fq-scoring']) => createMemoryOnlyLessonHost({
  releaseId: 'p064-host-score-test', releaseMemberIds: [ID], currentAnimationId: ID,
  enabledCapabilities: capabilities, mode: 'audit', releasePublished: false,
});

test('ten source-selected questions send only bounded aggregate score to a memory-only host', () => {
  const auditHost = host();
  const requests: LessonHostRequest[] = [];
  const dispatch = (request: LessonHostRequest) => {requests.push(request); return auditHost.dispatch(request);};
  let session = createP064CandidateSession(42);
  assert.equal(resetP064HostScore(dispatch, session.quiz), true);
  for (let ordinal = 0; ordinal < 10; ordinal++) {
    const questionId = session.quiz.currentQuestionId!;
    session = answerP064Candidate(session, questionId, ordinal % 2 ? 1 : 2);
    assert.equal(recordP064HostScore(dispatch, session.quiz), true);
  }
  assert.equal(session.quiz.phase, 'finish');
  assert.equal(auditHost.snapshot().fqScore.attempted, 10);
  assert.deepEqual(auditHost.snapshot().fqScore.scoredQuestionIds,
    session.quiz.responses.map(response => p064HostQuestionId(response.questionId)));
  for (const request of requests.slice(1)) {
    assert.equal(request.type, 'record-fq-score');
    assert.deepEqual(Object.keys(request), ['type', 'questionId', 'correct', 'pointsAwarded', 'pointsPossible']);
    assert.equal(JSON.stringify(request).includes('option'), false);
  }
  assert.equal(resetP064HostScore(dispatch, createP064CandidateSession(42).quiz), true);
  assert.equal(auditHost.snapshot().fqScore.attempted, 0);
  assert.equal(auditHost.snapshot().storage, 'memory-only');
  assert.equal(auditHost.snapshot().storesPersonalData, false);
});

test('blocked, duplicate, foreign, and inconsistent score acknowledgments fail closed', () => {
  const noScore = host([]);
  const initial = createP064CandidateSession(3);
  assert.equal(resetP064HostScore(request => noScore.dispatch(request), initial.quiz), false);
  const auditHost = host();
  assert.equal(resetP064HostScore(request => auditHost.dispatch(request), initial.quiz), true);
  const next = answerP064Candidate(initial, initial.quiz.currentQuestionId!, 1);
  const dispatch = (request: LessonHostRequest) => auditHost.dispatch(request);
  assert.equal(recordP064HostScore(dispatch, next.quiz), true);
  assert.equal(recordP064HostScore(dispatch, next.quiz), false);
  assert.equal(recordP064HostScore(() => undefined, next.quiz), false);
  assert.equal(recordP064HostScore(() => {throw Error('host unavailable');}, next.quiz), false);
  const allowed = auditHost.dispatch({type: 'reset-fq-score'});
  assert.equal(allowed.status, 'allowed');
  if (allowed.status !== 'allowed') throw Error('unreachable');
  assert.equal(p064HostScoreMatches({...allowed, state: {...allowed.state,
    currentAnimationId: 'another-page'}}, createP064CandidateSession(3).quiz), false);
  assert.equal(p064HostScoreMatches({...allowed, state: {...allowed.state, fqScore: {
    ...allowed.state.fqScore, attempted: 1}}}, createP064CandidateSession(3).quiz), false);
  assert.throws(() => p064HostQuestionId(0));
  assert.throws(() => p064HostQuestionId(36));
});
