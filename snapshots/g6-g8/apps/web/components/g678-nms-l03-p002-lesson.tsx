'use client';
import type {ComponentProps} from 'react';
import {DescriptorDrivenWholeLessonPlayer} from './descriptor-driven-whole-lesson-player';
import {G678NmsL3P002Runtime} from './g678-nms-l03-p002-runtime';
const adapter = Object.freeze({animationId: 'shared-nms002-l03-p002', audioEnabled: true, Component: G678NmsL3P002Runtime});
export function G678NmsL3P002Lesson(props: Omit<ComponentProps<typeof DescriptorDrivenWholeLessonPlayer>, 'privateRuntimeAdapter'>) {
  return <DescriptorDrivenWholeLessonPlayer {...props} privateRuntimeAdapter={adapter}/>;
}
