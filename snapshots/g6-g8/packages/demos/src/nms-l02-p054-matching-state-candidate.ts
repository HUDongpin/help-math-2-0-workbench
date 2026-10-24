/** Source-script model only. Not a registered renderer or a runtime trace. */
export type P054Level = 1 | 2;
export type P054Card = {level: P054Level; sourceInstanceName: string; pairId: number; side: 1 | 2};
export type P054Phase = 'selecting' | 'feedback-correct' | 'feedback-wrong' | 'terminal-unresolved';

export type P054State = {
  level: P054Level;
  phase: P054Phase;
  selected: string | null;
  feedbackPairId: number | null;
  score: number;
  matchedPairIds: readonly number[];
  sourceCompletedPairCounter: number;
  quizSection: boolean;
};

export function validateP054Cards(cards: readonly P054Card[], expectedLevel?: P054Level): void {
  if (cards.length !== 12) throw new Error('P054 level needs exactly 12 source cards');
  const names = new Set<string>();
  const level = expectedLevel ?? cards[0]?.level;
  if (level !== 1 && level !== 2) throw new Error('Invalid P054 card level');
  for (const card of cards) {
    if (card.level !== level || !Number.isInteger(card.pairId) || card.pairId < 1 || card.pairId > 6 ||
        ![1, 2].includes(card.side) ||
        card.sourceInstanceName !== `Mc${card.pairId}_${card.side}` ||
        names.has(card.sourceInstanceName)) {
      throw new Error('Invalid P054 source card identity');
    }
    names.add(card.sourceInstanceName);
  }
}

export function initialP054State(level: P054Level): P054State {
  if (level !== 1 && level !== 2) throw new Error('Invalid P054 level');
  return {
    level, phase: 'selecting', selected: null, feedbackPairId: null,
    score: 0, matchedPairIds: [], sourceCompletedPairCounter: 0,
    quizSection: true,
  };
}

export function selectP054Card(
  state: P054State, cards: readonly P054Card[], sourceInstanceName: string,
): P054State {
  validateP054Cards(cards, state.level);
  const card = cards.find(item => item.sourceInstanceName === sourceInstanceName);
  if (!card) throw new Error('Unknown P054 source card');
  if (state.phase !== 'selecting' || state.matchedPairIds.includes(card.pairId)) return state;
  if (!state.selected) return {...state, selected: sourceInstanceName};
  const first = cards.find(item => item.sourceInstanceName === state.selected);
  if (!first) throw new Error('Invalid P054 selected card');
  const correct = first.pairId === card.pairId && first.side !== card.side;
  return {
    ...state,
    phase: correct ? 'feedback-correct' : 'feedback-wrong',
    selected: null,
    feedbackPairId: correct ? card.pairId : null,
    score: state.score + (correct ? 10 : -2),
  };
}

/** Called only after source feedback sprite 194/208 reaches its terminal frame. */
export function finishP054Feedback(state: P054State): P054State {
  if (state.phase === 'feedback-wrong') return {...state, phase: 'selecting'};
  if (state.phase !== 'feedback-correct' || state.feedbackPairId === null) return state;
  if (state.matchedPairIds.includes(state.feedbackPairId)) {
    throw new Error('P054 pair was already matched');
  }
  const matchedPairIds = [...state.matchedPairIds, state.feedbackPairId];
  const sourceCompletedPairCounter = state.sourceCompletedPairCounter + 1;
  if (sourceCompletedPairCounter >= 6) {
    // The source clears quizSection inside feedback sprite 194. Its nextFrame()
    // does not prove a parent-game/result or My Lesson completion transition.
    return {...state, phase: 'terminal-unresolved', feedbackPairId: null,
      matchedPairIds, sourceCompletedPairCounter: 0, quizSection: false};
  }
  return {...state, phase: 'selecting', feedbackPairId: null,
    matchedPairIds, sourceCompletedPairCounter};
}
