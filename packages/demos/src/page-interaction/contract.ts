export const PAGE_INTERACTION_CONTRACT_ID = 'helpmath-page-interaction-stage-v1' as const;
export const PAGE_INTERACTION_POINTER_CONTRACT_ID = 'helpmath-page-interaction-pointer-v1' as const;
export const NATIVE_STAGE = Object.freeze({width: 800, height: 600});

export type AnimationLanguage = 'en' | 'es';

export type LocalizedText = Readonly<{en: string; es: string}>;

export type NativeRect = Readonly<{x: number; y: number; width: number; height: number}>;

export type PageInteractionKind = 'drag-drop-key-terms' | 'selectable-targets';

export type PointerLifecyclePolicy = Readonly<{
  contractId: typeof PAGE_INTERACTION_POINTER_CONTRACT_ID;
  primaryPointerOnly: true;
  primaryButtonOnly: true;
  captureRequiredForPress: true;
  pressMustStartInside: true;
  releaseMustEndInside: true;
  hitStateIsDiagnosticOnly: true;
  originalFlashPointerLifecycleEstablished: boolean;
  originalRuntimeAccepted: boolean;
}>;

export const UNPROVEN_FLASH_POINTER_POLICY: PointerLifecyclePolicy = Object.freeze({
  contractId: PAGE_INTERACTION_POINTER_CONTRACT_ID,
  primaryPointerOnly: true,
  primaryButtonOnly: true,
  captureRequiredForPress: true,
  pressMustStartInside: true,
  releaseMustEndInside: true,
  hitStateIsDiagnosticOnly: true,
  originalFlashPointerLifecycleEstablished: false,
  originalRuntimeAccepted: false
});

export type DragDropToken = Readonly<{
  id: string;
  label: LocalizedText;
  correctTargetIds: readonly string[];
}>;

export type DropTarget = Readonly<{
  id: string;
  label: LocalizedText;
  rect: NativeRect;
}>;

export type SelectableChoice = Readonly<{
  id: string;
  label: LocalizedText;
  correct: boolean;
}>;

export type PageInteractionEvidence = Readonly<{
  sourceSwfPath: string;
  sourceSwfSha256?: string;
  reconstruction: 'catalog-vocabulary-pending-swf-hit-test';
  notes: string;
}>;

export type PageInteractionSpec = Readonly<{
  animationId: string;
  kind: PageInteractionKind;
  stageTargetIdSuffix: string;
  frameCount: number;
  pointerLifecycle: PointerLifecyclePolicy;
  prompt: LocalizedText;
  problem: LocalizedText;
  tokens?: readonly DragDropToken[];
  targets?: readonly DropTarget[];
  choices?: readonly SelectableChoice[];
  evidence: PageInteractionEvidence;
}>;

export function localized(text: LocalizedText, lang: AnimationLanguage): string {
  return lang === 'es' ? text.es : text.en;
}

export function assertNever(value: never, message: string): never {
  throw new Error(message);
}
