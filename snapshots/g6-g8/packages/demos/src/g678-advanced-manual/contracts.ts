export type ActivationInput = 'mouse' | 'Enter' | ' ';

export const ACTIVATION_INPUTS = Object.freeze([
  'mouse',
  'Enter',
  ' ',
] as const satisfies readonly ActivationInput[]);

export function isActivationInput(value: unknown): value is ActivationInput {
  return ACTIVATION_INPUTS.some((candidate) => candidate === value);
}

export interface EvidenceFile {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface FeedbackAudioDomain<Kind extends 'right' | 'wrong'> {
  readonly id: string;
  readonly kind: Kind;
  readonly instanceName: string;
  readonly objectId: number;
  readonly frameCount: number;
  readonly soundStreamHeadCount: 1;
  readonly soundStreamBlockCount: number;
  readonly audioAccepted: false;
}

/**
 * Engineering behavior specifications cannot advance any acceptance or
 * publication authority. Keep this object broad and explicit so an imported
 * config cannot be mistaken for a registry or release record.
 */
export const ADVANCED_MANUAL_ACCEPTANCE_EFFECTS = Object.freeze({
  currentJavaScriptRegistered: false,
  authoritativeOriginalRuntime: false,
  originalRuntimeAccepted: false,
  behaviorAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
} as const);

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
