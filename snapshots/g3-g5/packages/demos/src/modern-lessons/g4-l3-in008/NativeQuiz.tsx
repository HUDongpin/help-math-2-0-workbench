'use client';

import React, {useEffect, useId, useRef, type Dispatch, type ReactNode} from 'react';
import {
  reduceCourseG04L03In008Interaction,
  type CourseG04L03In008InteractionAction as Action,
  type CourseG04L03In008InteractionState as State,
} from '../../timelines/course-g04-l03-in-008-interaction';

export interface In008Demonstration {
  readonly firstValue: string;
  readonly prefix: readonly string[];
  readonly caretVisible: boolean;
  readonly checkVisible: boolean;
  readonly newVisible: boolean;
  readonly newFlashing: boolean;
  /** Parent maps source pointer geometry to the actual target, without a clock. */
  readonly firstPointer?: ReactNode;
  readonly checkPointer?: ReactNode;
}
export interface In008NativeQuizProps {
  readonly interaction: State;
  readonly dispatch: Dispatch<Action>;
  readonly interactive: boolean;
  readonly displayQuiz?: boolean;
  readonly paused?: boolean;
  readonly demonstration?: In008Demonstration;
  /** Called once per admitted check, including repeated correct checks. Audio belongs to the host. */
  readonly onCheck?: (next: State) => void;
  readonly onClose?: (next: State) => void;
  readonly onClosePress?: (token: string) => void;
  readonly onCloseRelease?: (token: string) => void;
  readonly onNew?: (next: State) => void;
}

/** One controlled form survives layout changes. The canonical reducer owns all answer rules. */
export function In008NativeQuiz(props: In008NativeQuizProps) {
  const {interaction, dispatch, interactive, paused = false, demonstration: demo} = props;
  const displayQuiz = props.displayQuiz ?? interactive;
  const uid = useId();
  const firstInput = useRef<HTMLInputElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const newButton = useRef<HTMLButtonElement>(null);
  const closePressSequence = useRef(0);
  const closePress = useRef<{token: string; release?: (token: string) => void} | null>(null);
  const endClosePress = () => {
    const active = closePress.current;
    closePress.current = null;
    if (active) active.release?.(active.token);
  };
  const beginClosePress = () => {
    if (closePress.current || paused || !interactive || !interaction.feedbackVisible) return;
    const token = `${uid}-close-${++closePressSequence.current}`;
    closePress.current = {token, release: props.onCloseRelease};
    props.onClosePress?.(token);
  };
  useEffect(() => {if (!interaction.feedbackVisible || paused || !interactive) endClosePress();}, [interaction.feedbackVisible, paused, interactive]);
  useEffect(() => () => endClosePress(), []);
  const focusNext = useRef<'first' | 'close' | 'new' | null>(null);
  useEffect(() => {
    if (!interactive || paused) return;
    const target = focusNext.current;
    focusNext.current = null;
    if (target === 'close') closeButton.current?.focus();
    if (target === 'new') newButton.current?.focus();
    if (target === 'first') firstInput.current?.focus();
  }, [interaction, interactive, paused]);
  const act = (action: Action) => {
    if (!interactive || paused) return;
    const next = reduceCourseG04L03In008Interaction(interaction, action);
    if (next === interaction) return;
    if (action.type === 'check') {
      focusNext.current = next.outcome === 'wrong' ? 'close' : 'new';
      props.onCheck?.(next);
    } else if (action.type === 'close-feedback') {
      focusNext.current = 'first';
      props.onClose?.(next);
    } else if (action.type === 'new-problem') {
      focusNext.current = 'first';
      props.onNew?.(next);
    }
    dispatch(action);
  };
  const feedback = displayQuiz && interaction.feedbackVisible;
  const prefix = displayQuiz ? interaction.currentQuestion.label.replaceAll('-', '−').split(',').filter(term => term.trim()) : demo?.prefix ?? [];
  return <form className="in008-native-quiz" lang="en" aria-label="Complete the number pattern"
    data-interaction-outcome={displayQuiz ? interaction.outcome : 'demonstration'}
    onSubmit={event => {event.preventDefault(); act({type: 'check'});}}>
    <p className="in008-native-quiz__pattern" data-lesson-text-block={displayQuiz ? "question" : "demonstration-prefix"}>{prefix.map((term, index) => <React.Fragment key={index}><span className="in008-native-quiz__item"><span className="in008-native-quiz__term">{term.trim()}</span>{","}</span>{" "}</React.Fragment>)}</p>
    <div className="in008-native-quiz__answers">
      {(['first', 'second'] as const).map((field, index) => <label key={field} className="in008-native-quiz__answer">
        <span>{index === 0 ? 'First missing number' : 'Second missing number'}</span>
        <span className="in008-native-quiz__input-wrap">
          <input data-in008-anchor={index === 0 ? "first" : undefined} ref={index === 0 ? firstInput : undefined} type="text" inputMode="text" autoCapitalize="none"
            autoComplete="off" spellCheck={false} enterKeyHint={index === 0 ? 'next' : 'done'}
            aria-label={index === 0 ? "First missing number" : "Second missing number"}
            aria-describedby={feedback ? `${uid}-feedback` : undefined}
            readOnly={!interactive || paused || interaction.inputsLocked}
            data-lesson-text-block={index === 0 ? "first-answer" : "second-answer"}
            value={displayQuiz ? (index === 0 ? interaction.answerFirst : interaction.answerSecond) : (index === 0 ? demo?.firstValue ?? '' : '')}
            onChange={event => act({type: 'set-input', field, value: event.currentTarget.value})}/>
          {!displayQuiz && index === 0 && demo?.caretVisible && <span aria-hidden="true" className="in008-native-quiz__caret"/>}
          {!displayQuiz && index === 0 && demo?.firstPointer}
        </span>
        <span className="in008-native-quiz__source-punctuation" data-lesson-text-block={index === 0 ? "between-answers" : "after-answers"}>{index === 0 ? ',' : ', ....'}</span>
      </label>)}
    </div>
    <div className="in008-native-quiz__actions">
      {(displayQuiz || demo?.checkVisible) && <button data-lesson-text-block="check-answer" data-in008-anchor="check" type="submit" disabled={!interactive || paused || !interaction.checkEnabled}>Check Answer{!interactive && demo?.checkPointer}</button>}
      {(displayQuiz || demo?.newVisible) && <button data-lesson-text-block="new-problem" data-in008-anchor="new" type="button" ref={newButton} data-demo-flash={!interactive && demo?.newFlashing ? 'true' : undefined}
        disabled={!interactive || paused || !interaction.newProblemEnabled} onClick={() => act({type: 'new-problem'})}>New Problem</button>}
    </div>
    <p role="status" aria-live="polite" className="in008-native-quiz__status">{displayQuiz && interaction.outcome === 'correct' ? 'Correct. Choose New Problem to continue.' : ''}</p>
    {feedback && <div className="in008-native-quiz__feedback" role="alertdialog" aria-modal="false" aria-label="Incorrect answer feedback" aria-describedby={`${uid}-feedback`}>
      <p data-lesson-text-block="feedback" id={`${uid}-feedback`}>{interaction.feedbackText}</p>
      <button type="button" data-lesson-text-block="close-feedback" ref={closeButton} disabled={paused || !interactive}
        onPointerDown={event => {if(event.button === 0) {beginClosePress(); event.currentTarget.setPointerCapture(event.pointerId);}}}
        onPointerUp={endClosePress} onPointerCancel={endClosePress} onLostPointerCapture={endClosePress} onBlur={endClosePress}
        onKeyDown={event => {if(!event.repeat && (event.key === 'Enter' || event.key === ' ')) beginClosePress();}}
        onKeyUp={event => {if(event.key === 'Enter' || event.key === ' ') endClosePress();}}
        onClick={() => act({type: 'close-feedback'})}>Close</button>
    </div>}
  </form>;
}
