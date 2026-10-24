import type {ComponentProps, ComponentType} from 'react';
import type {AnimationRuntimeCoreV1} from '@/components/animation-runtime-loader-core-v1.generated';

export interface LessonRuntimeAdapterControls {
  setPaused(paused:boolean):void;
  replay():boolean;
  narration(action:'play'|'stop'):void;
  stop():void;
}
export type LessonRuntimeAdapterProps=Omit<ComponentProps<typeof AnimationRuntimeCoreV1>, 'loadAnimationModule'>&{
  rendererLessonSession?: import('../../../packages/demos/src/contract').RendererLessonSessionScope;
  onSourceExit?:()=>void;
  onRuntimePausedChange:(paused:boolean)=>void;
  connectRuntimeControls:(controls:LessonRuntimeAdapterControls)=>()=>void;
};
/** An exact unregistered source candidate may be shown only by the private development reviewer host. */
export interface UnregisteredPrivateRuntimeBinding {
  readonly kind: 'source-bound-unregistered-candidate-v1';
  readonly sourceSha256: string;
  readonly moduleKey: string;
  readonly runtimeQuery: Readonly<{
    frameDomain: string;
    language: 'route-locale' | 'fixed-en';
    scenario: string;
    seed: string;
  }>;
}

/** Explicit private calibration extension; the ordinary player remains the default. */
export interface PrivateLessonRuntimeAdapter {
  readonly animationId:string;
  readonly audioEnabled:boolean;
  readonly candidateBinding?: UnregisteredPrivateRuntimeBinding;
  readonly Component:ComponentType<LessonRuntimeAdapterProps>;
}
