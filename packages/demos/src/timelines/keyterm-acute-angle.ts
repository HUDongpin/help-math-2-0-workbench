import type {RuntimeContext} from '../contract';

export const ACUTE_ANGLE_MOVIE = Object.freeze({
  stage: Object.freeze({width: 225, height: 225}),
  fps: 12,
  frameCount: 60,
  durationMs: 5_000
});

export const ACUTE_ANGLE_SOURCE = Object.freeze({
  swfSha256: 'dbc56af636e5551c582977f9230be2ae530874a05c901f0cf44dd5e2d5f2a347',
  titleEnglish: 'Acute Angle',
  titleSpanish: 'Ángulo agudo'
});

/**
 * The MP3 is a catalog-level basename association, not an embedded SWF sound.
 * Its start frame remains deliberately unresolved until the original key-term
 * host or another authoritative runtime establishes the cue.
 */
export const ACUTE_ANGLE_AUDIO_EVIDENCE = Object.freeze({
  language: 'en' as const,
  sourceArchivePath:
    'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/EAD/acute_angle.mp3',
  sha256: '8b150d56158690d70c8f9891a72c13fdb62719b973bf970dcdeadaed612dc97f',
  startFrame: null,
  status: 'unresolved-host-cue' as const
});

export interface AcuteAngleFrameState {
  readonly frame: number;
  readonly frameAsset: string;
  readonly language: 'en' | 'es';
  readonly accessibleTitle: string;
  readonly isFirstFrame: boolean;
  readonly isLastFrame: boolean;
}

export function normalizeAcuteAngleFrame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(ACUTE_ANGLE_MOVIE.frameCount, Math.max(1, Math.trunc(frame)));
}

export function getAcuteAngleFrameState(
  frame: number,
  context: Pick<RuntimeContext, 'lang'>
): AcuteAngleFrameState {
  const normalized = normalizeAcuteAngleFrame(frame);
  return Object.freeze({
    frame: normalized,
    frameAsset: `/flash-assets/keyterms/acute-angle/frames/${normalized}.png`,
    language: context.lang,
    accessibleTitle:
      context.lang === 'es' ? 'Demostración de ángulo agudo' : 'Acute angle demonstration',
    isFirstFrame: normalized === 1,
    isLastFrame: normalized === ACUTE_ANGLE_MOVIE.frameCount
  });
}
