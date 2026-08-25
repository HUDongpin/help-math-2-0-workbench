const ANIMATION_ID = /^course-g(?:03|04|05)-l\d{2}-/u;
const PLACEMENT_ID = /^[A-Za-z0-9._-]+$/u;

export interface CanvasPerformanceTarget {
  readonly animationId: string;
  readonly grade: 3 | 4 | 5;
  readonly lesson: number;
  readonly ordinal: number;
  readonly placementId: string | null;
  readonly sourceFps: number;
  readonly v1FirstReadyMs: number;
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function canonicalTarget(target: CanvasPerformanceTarget) {
  return JSON.stringify({
    animationId: target.animationId,
    grade: target.grade,
    lesson: target.lesson,
    ordinal: target.ordinal,
    placementId: target.placementId,
    sourceFps: target.sourceFps,
    v1FirstReadyMs: target.v1FirstReadyMs,
  });
}

function validateTarget(target: CanvasPerformanceTarget, label: string) {
  invariant(target && typeof target === 'object', `${label} must be an object`);
  invariant(ANIMATION_ID.test(target.animationId),
    `${label}.animationId is invalid`);
  invariant(target.grade === 3 || target.grade === 4 || target.grade === 5,
    `${label}.grade is invalid`);
  invariant(Number.isSafeInteger(target.lesson) && target.lesson > 0,
    `${label}.lesson is invalid`);
  invariant(Number.isSafeInteger(target.ordinal) && target.ordinal > 0,
    `${label}.ordinal is invalid`);
  invariant(target.placementId === null ||
    (typeof target.placementId === 'string' &&
      PLACEMENT_ID.test(target.placementId)),
  `${label}.placementId is invalid`);
  invariant(Number.isFinite(target.sourceFps) && target.sourceFps > 0,
    `${label}.sourceFps is invalid`);
  invariant(Number.isFinite(target.v1FirstReadyMs) &&
    target.v1FirstReadyMs >= 0,
  `${label}.v1FirstReadyMs is invalid`);
}

export function validatePerformanceBaselineCoverage({
  profileRendererIds,
  renderers,
  pilots,
  requiredPilotIds,
}: {
  readonly profileRendererIds: readonly string[];
  readonly renderers: readonly CanvasPerformanceTarget[];
  readonly pilots: readonly CanvasPerformanceTarget[];
  readonly requiredPilotIds: readonly string[];
}) {
  invariant(profileRendererIds.length === 283,
    'v2 profile must contain exactly 283 renderer IDs');
  invariant(new Set(profileRendererIds).size === 283,
    'v2 profile renderer IDs must be unique');
  invariant(profileRendererIds.every((id) => ANIMATION_ID.test(id)),
    'v2 profile renderer ID is invalid');
  invariant(requiredPilotIds.length > 0 &&
    new Set(requiredPilotIds).size === requiredPilotIds.length &&
    requiredPilotIds.every((id) => ANIMATION_ID.test(id)),
  'required performance pilot IDs are invalid or duplicated');
  invariant(renderers.length === 283,
    'v1 full performance baseline must contain exactly 283 renderers');

  const rendererById = new Map<string, CanvasPerformanceTarget>();
  renderers.forEach((renderer, index) => {
    validateTarget(renderer, `renderers[${index}]`);
    invariant(!rendererById.has(renderer.animationId),
      `${renderer.animationId} appears twice in the full performance baseline`);
    rendererById.set(renderer.animationId, renderer);
  });
  invariant(
    [...rendererById.keys()].sort().join('\n') ===
      [...profileRendererIds].sort().join('\n'),
    'v1 full performance baseline renderer set differs from v2 profile',
  );

  invariant(pilots.length === requiredPilotIds.length,
    'v1 pilot baseline count differs from the fixed pilot contract');
  const pilotById = new Map<string, CanvasPerformanceTarget>();
  pilots.forEach((pilot, index) => {
    validateTarget(pilot, `pilots[${index}]`);
    invariant(!pilotById.has(pilot.animationId),
      `${pilot.animationId} appears twice in the pilot baseline`);
    pilotById.set(pilot.animationId, pilot);
    const full = rendererById.get(pilot.animationId);
    invariant(full !== undefined,
      `${pilot.animationId} is absent from the full performance baseline`);
    invariant(canonicalTarget(full) === canonicalTarget(pilot),
      `${pilot.animationId} pilot identity differs from its full baseline row`);
  });
  invariant(
    [...pilotById.keys()].sort().join('\n') ===
      [...requiredPilotIds].sort().join('\n'),
    'v1 pilot baseline ID set differs from the fixed pilot contract',
  );

  return {
    rendererCount: rendererById.size,
    pilotCount: pilotById.size,
  };
}
