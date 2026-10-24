import type {LessonHostDecision, LessonHostRequest} from './lesson-host-contract';
import type {P064QuizState} from './nms-l02-p064-quiz-state-candidate';

const ID = 'shared-nms002-l02-p064';
export type P064HostRequest = (request: LessonHostRequest) => LessonHostDecision | void;

export function p064HostQuestionId(questionId: number): string {
  if (!Number.isInteger(questionId) || questionId < 1 || questionId > 35) {
    throw new Error('P064 source question is outside Q1–Q35');
  }
  return `${ID}-q${questionId}`;
}

export function p064HostScoreMatches(decision: LessonHostDecision | void, quiz: P064QuizState): boolean {
  if (decision?.status !== 'allowed' || decision.capability !== 'fq-scoring' ||
    decision.state.currentAnimationId !== ID || decision.state.storage !== 'memory-only' ||
    decision.state.storesPersonalData !== false) return false;
  const score = decision.state.fqScore;
  const ids = quiz.responses.map(response => p064HostQuestionId(response.questionId));
  const correct = quiz.responses.filter(response => response.correct).length;
  return score.attempted === ids.length && score.correct === correct &&
    score.pointsAwarded === correct && score.pointsPossible === ids.length &&
    JSON.stringify(score.scoredQuestionIds) === JSON.stringify(ids);
}

export function resetP064HostScore(request: P064HostRequest, quiz: P064QuizState): boolean {
  try { return p064HostScoreMatches(request({type: 'reset-fq-score'}), quiz); }
  catch { return false; }
}

export function recordP064HostScore(request: P064HostRequest, quiz: P064QuizState): boolean {
  const response = quiz.responses.at(-1);
  if (!response || quiz.responses.length > 10) return false;
  try {
    return p064HostScoreMatches(request({type: 'record-fq-score',
      questionId: p064HostQuestionId(response.questionId), correct: response.correct,
      pointsAwarded: response.correct ? 1 : 0, pointsPossible: 1}), quiz);
  } catch { return false; }
}
