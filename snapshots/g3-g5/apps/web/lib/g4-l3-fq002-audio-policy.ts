/** Exact server-authorized controlled Preview scope; no other page receives audio capability. */
export function g4L3Fq002AudioEnabled(animationId:string,serverPreviewAudioEnabled:boolean) {
 return serverPreviewAudioEnabled && animationId==='course-g04-l03-fq-002';
}
export function g4L3PageHostCapabilities(animationId:string,serverPreviewAudioEnabled:boolean) {
 return g4L3Fq002AudioEnabled(animationId,serverPreviewAudioEnabled) ? ['keyterm','audio'] as const : ['keyterm'] as const;
}

export interface G4L3InteractiveAudioLifecycleInput {
 readonly animationId: string;
 readonly audioEnabled: boolean;
 readonly portalTarget: string | undefined;
 readonly capture: boolean;
 readonly captureFrame: number | undefined;
 readonly paused: boolean;
}

export function g4L3InteractiveAudioLifecycle(input: G4L3InteractiveAudioLifecycleInput) {
 const preservesPosition = g4L3Fq002AudioEnabled(input.animationId, input.audioEnabled)
  && Boolean(input.portalTarget);
 return {
  disabled: !input.audioEnabled || input.capture || input.captureFrame !== undefined
   || (!preservesPosition && input.paused),
  paused: preservesPosition && input.paused,
 };
}
