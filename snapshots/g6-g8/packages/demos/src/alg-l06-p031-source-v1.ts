import model from '../../../migrations/shared-alg001-l06-p031/native-v1/source-model-v1.json';

export const P031_SOURCE_SHA256 = model.sourceSha256;
export const P031_RUNTIME = Object.freeze(model.runtime);
export type P031Choice = 'A' | 'B' | 'C' | 'D' | 'E';
const texts: Readonly<Record<string, {text: string}>> = model.texts;

function checkedFrame(frame: number) {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 1611) throw Error('P031_INVALID_FRAME');
  return frame;
}

/** Visible glyph records retain source alpha and placement boundaries. */
export function p031NativeTextAt(frame: number, textId: number) {
  checkedFrame(frame);
  return model.mainNativeInstances.filter(instance => instance.objectId === textId)
    .flatMap(instance => instance.runs.filter(run => frame >= run.firstFrame && frame <= run.lastFrame &&
      run.color.factor.Alpha + run.color.offset.Alpha > 0).map(run => ({instanceId: instance.instanceId, textId,
      text: texts[String(textId)]?.text ?? '', matrixTwips: run.matrixTwips, color: run.color})));
}

export function p031SourceState(frame: number) {
  checkedFrame(frame);
  const shown = (id: number) => p031NativeTextAt(frame, id).length > 0;
  return {
    frame, frameDomain: 'sprite-363' as const, rootFrame: 6, sourceSha256: P031_SOURCE_SHA256,
    narrative: [6, 8, 10, 14, 15, 16, 18].filter(shown).map(textId => ({textId, text: texts[String(textId)]!.text})),
    options: model.answerPlacements.filter(row => shown(row.textId)).map(row => ({...row,
      letter: row.letter as P031Choice, sourceButtonPresent: frame === 1610})),
    glossary: model.glossary.filter(row => frame >= row.firstFrame && frame <= row.lastFrame),
    emphasis: {
      equation: [35, 36, 37, 38].some(shown), variableF: shown(39),
      B: shown(41), D: shown(46), E: shown(67), C: shown(70),
    },
    sourceHasStopAtFrame: false,
    terminal: frame === 1611,
    hostFeedbackResolved: false,
    lessonCompleted: false,
  };
}

export interface P031Globals {quizTryCount: number; wrongFeed: string | null;}
export interface P031AnswerRequest {
  sourceFrame: 1610;
  choice: P031Choice;
  buttonId: number;
  globals: P031Globals;
  calls: readonly ['disableQuizButton', 'showRightFeed' | 'showWrongFeed'];
  status: 'unresolved-host-request';
  selectedFeedback: null;
  parentStopRequested: false;
}

/** Page-owned effects only. A pending host request does not choose or start a feedback clip. */
export function p031AnswerRequest(frame: number, choice: P031Choice, globals: P031Globals): P031AnswerRequest {
  checkedFrame(frame);
  if (frame !== 1610) throw Error('P031_ANSWER_INSTANCE_ABSENT');
  const row = model.answerPlacements.find(option => option.letter === choice);
  if (!row || !Number.isSafeInteger(globals.quizTryCount) || globals.quizTryCount < 0 ||
      globals.quizTryCount >= Number.MAX_SAFE_INTEGER ||
      globals.wrongFeed !== null && typeof globals.wrongFeed !== 'string') throw Error('P031_INVALID_ANSWER_STATE');
  const next = {...globals};
  if (row.branch === 'wrong') {
    next.quizTryCount++;
    if (next.quizTryCount === 1) next.wrongFeed = model.sourceBehavior.wrongText;
  }
  return {sourceFrame: 1610, choice, buttonId: row.buttonId, globals: next,
    calls: ['disableQuizButton', row.branch === 'right' ? 'showRightFeed' : 'showWrongFeed'],
    status: 'unresolved-host-request', selectedFeedback: null, parentStopRequested: false};
}
