'use client';
import React, {useRef, type ReactNode} from 'react';
import {In008NativePointer} from './NativePointer';
import {In008NativeQuiz, type In008NativeQuizProps} from './NativeQuiz';

export interface In008SourceState {
  readonly frame: number;
  readonly phase: 'demonstration' | 'quiz' | 'post-stop-inspection';
  readonly prose: readonly {readonly characterId: number; readonly text: string; readonly sourceTextIds: readonly string[]; readonly visible: boolean}[];
  readonly demonstration: {
    readonly visible: boolean;
    readonly prefix: readonly string[];
    readonly firstAnswer: string;
    readonly secondAnswer: string;
    readonly caret: boolean;
    readonly pointer: null | {readonly x: number; readonly y: number; readonly alpha: number};
    readonly patternEmphasis: boolean;
    readonly newProblemEmphasis: boolean;
  };
  readonly keywordVisible: boolean;
  readonly quizEnabled: boolean;
}
export interface In008NativeSurfaceProps extends Omit<In008NativeQuizProps, 'interactive' | 'demonstration' | 'displayQuiz'> {
  readonly source: In008SourceState;
  readonly title: string;
  readonly onKeyTerm?: (term: string, trigger: HTMLElement) => void;
  readonly pointerAtFirst?: ReactNode;
  readonly pointerAtCheck?: ReactNode;
}
/** Parent selects the source frame and owns Replay/audio. No time or hidden question state here. */
export function In008NativeSurface({source, title, onKeyTerm, pointerAtFirst, pointerAtCheck, ...quiz}: In008NativeSurfaceProps) {
  const surface = useRef<HTMLElement>(null);
  const demo = source.demonstration;
  const interactive = source.frame === 216 && source.phase === 'quiz' && source.quizEnabled;
  function prose(text: string) {
    const index = text.indexOf('pattern');
    if (index < 0 || !source.keywordVisible) return text;
    const emphasis = source.phase === 'demonstration' && demo.patternEmphasis;
    if (!onKeyTerm) return <>{text.slice(0, index)}<span className="in008-native-surface__pattern-word" data-demo-emphasis={emphasis ? 'true' : undefined}>pattern</span>{text.slice(index + 7)}</>;
    return <>{text.slice(0, index)}<button type="button" className="in008-native-surface__keyterm" data-demo-emphasis={emphasis ? "true" : undefined} onClick={event => onKeyTerm('pattern', event.currentTarget)}>pattern</button>{text.slice(index + 7)}</>;
  }
  return <section ref={surface} className="in008-native-surface" lang="en" data-source-frame={source.frame} data-source-phase={source.phase}>
    <h2 data-lesson-text-block="title">{title}</h2>
    <div className="in008-native-surface__prose">
      {source.prose.map((block, index) => block.visible && <p key={block.characterId} data-lesson-text-block={index === 0 ? "prompt" : `instruction-${index - 1}`} data-source-text-ids={block.sourceTextIds.join(' ')}>{prose(block.text)}</p>)}
    </div>
    <In008NativeQuiz {...quiz} interactive={interactive} displayQuiz={source.phase !== "demonstration"} demonstration={{prefix: demo.prefix, firstValue: demo.firstAnswer, caretVisible: demo.caret, checkVisible: demo.visible, newVisible: demo.visible, newFlashing: demo.newProblemEmphasis, firstPointer: pointerAtFirst, checkPointer: pointerAtCheck}}/>
    <In008NativePointer surface={surface} pointer={source.phase === "demonstration" ? demo.pointer : null}/>
  </section>;
}
