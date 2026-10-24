/** Source-owned DAT L5 transitions. This successor is not registered or accepted. */
import type {DatSourceId, DatTargetId} from './g678-advanced-manual/dat001-l05-p040';
export type DatFeedbackKind = 'wrong' | 'right';
export const DAT_L05_SOURCE_IDS = ['Src_1', 'Src_2', 'Src_3', 'Src_4', 'Src_5'] as const;
const TARGETS = ['Tar_1', 'Tar_2', 'Tar_3', 'Tar_4', 'Tar_5'] as const;
const FEEDBACK = {wrong: [202, 214, 226], right: [314, 258, 294, 266]} as const;
export interface DatL05SourceInteraction {
  readonly phase: 'selecting' | 'dragging' | 'feedback' | 'resumed';
  readonly locked: readonly DatSourceId[];
  readonly activeSource: DatSourceId | null;
  readonly feedback: Readonly<{kind: DatFeedbackKind; objectId: number; sourceId: DatSourceId; epoch: number}> | null;
  readonly epoch: number;
  readonly correctDrops: number;
  readonly finishedWrongFeedback: number;
  readonly modernQuizTryCountReset: true;
  readonly sourceMainFrame: 238 | 239;
  readonly originalRuntimeAccepted: false;
}
export type DatL05SourceEvent =
  | Readonly<{type: 'press'; sourceId: DatSourceId}>
  | Readonly<{type: 'drop'; targetId: DatTargetId | null; seed: number}>
  | Readonly<{type: 'feedback-finished'; epoch: number}>
  | Readonly<{type: 'replay'}>;
export interface DatL05SourceTransition {readonly accepted: boolean; readonly state: DatL05SourceInteraction; readonly retireFeedback: boolean; readonly reason?: string;}
export function createDatL05SourceInteraction(epoch = 0): DatL05SourceInteraction {
  if (!Number.isSafeInteger(epoch) || epoch < 0) throw Error('Invalid DAT epoch');
  return {phase: 'selecting', locked: [], activeSource: null, feedback: null, epoch, correctDrops: 0,
    finishedWrongFeedback: 0, modernQuizTryCountReset: true, sourceMainFrame: 238, originalRuntimeAccepted: false};
}
/** Seed mapping preserves the exact 3/4 host cardinalities; it does not reproduce Adobe random state. */
export function selectDatL05Feedback(kind: DatFeedbackKind, seed: number): number {
  if (!['wrong', 'right'].includes(kind) || !Number.isSafeInteger(seed) || seed < 0) throw Error('Invalid DAT feedback selector');
  const choices = FEEDBACK[kind];
  return choices[(seed >>> 0) % choices.length];
}
export function reduceDatL05SourceInteraction(state: DatL05SourceInteraction, event: DatL05SourceEvent): DatL05SourceTransition {
  const blocked = (reason: string): DatL05SourceTransition => ({accepted: false, state, retireFeedback: false, reason});
  const accept = (next: DatL05SourceInteraction, retireFeedback = false): DatL05SourceTransition => ({accepted: true, state: next, retireFeedback});
  switch (event.type) {
    case 'press': {
      if (!DAT_L05_SOURCE_IDS.includes(event.sourceId)) return blocked('unknown-source');
      if (state.phase === 'resumed' || state.phase === 'dragging') return blocked('source-not-available');
      if (state.locked.includes(event.sourceId)) return blocked('source-locked');
      // The source press handler resets every feedback clip, including one still playing.
      // Host enable/disable helpers enumerate AnsBtn, not these Src_ movie clips.
      return accept({...state, phase: 'dragging', activeSource: event.sourceId, feedback: null, epoch: state.epoch + 1}, true);
    }
    case 'drop': {
      if (state.phase !== 'dragging' || !state.activeSource) return blocked('no-source-dragging');
      if (event.targetId !== null && !TARGETS.includes(event.targetId)) return blocked('unknown-target');
      if (!Number.isSafeInteger(event.seed) || event.seed < 0) return blocked('invalid-feedback-seed');
      const sourceId = state.activeSource, correct = TARGETS[DAT_L05_SOURCE_IDS.indexOf(sourceId)] === event.targetId;
      const kind = correct ? 'right' : 'wrong', objectId = selectDatL05Feedback(kind, event.seed);
      return accept({...state, phase: 'feedback', activeSource: null,
        locked: correct ? [...state.locked, sourceId] : state.locked,
        correctDrops: state.correctDrops + (correct ? 1 : 0),
        feedback: {kind, objectId, sourceId, epoch: state.epoch}});
    }
    case 'feedback-finished': {
      if (state.phase !== 'feedback' || !state.feedback || event.epoch !== state.feedback.epoch) return blocked('stale-feedback-completion');
      const resume = state.feedback.kind === 'right' && state.correctDrops >= 5;
      return accept({...state, phase: resume ? 'resumed' : 'selecting', feedback: null,
        sourceMainFrame: resume ? 239 : 238,
        finishedWrongFeedback: state.finishedWrongFeedback + (state.feedback.kind === 'wrong' ? 1 : 0)});
    }
    case 'replay':
      return accept(createDatL05SourceInteraction(state.epoch + 1), true);
  }
}
