'use client';
import type {ComponentProps} from 'react';
import {DescriptorDrivenWholeLessonPlayer} from './descriptor-driven-whole-lesson-player';
import {G678TerminalSourceRuntimeV1} from './g678-terminal-source-runtime-v1';
const adapter = Object.freeze({animationId: 'shared-alg001-l01-p006', audioEnabled: true, Component: G678TerminalSourceRuntimeV1});
export function G678AlgL1P006Lesson(props: Omit<ComponentProps<typeof DescriptorDrivenWholeLessonPlayer>, 'privateRuntimeAdapter'>) {
  return <DescriptorDrivenWholeLessonPlayer {...props} privateRuntimeAdapter={adapter}/>;
}
