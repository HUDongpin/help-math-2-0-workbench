export const SMOKE_GATE = 'renderer-ready-smoke';

export function selectSmokeLessons(catalogLessons, requested) {
  if (requested.length === 0) throw new Error('No lessons requested');
  const all = requested.length === 1 && requested[0] === 'all';
  const known = new Set(catalogLessons.map((lesson) => `${lesson.module}/${lesson.lesson}`));
  const unknown = all ? [] : requested.filter((key) => !known.has(key));
  if (unknown.length) throw new Error(`Unknown lesson selection: ${unknown.join(', ')}`);
  const lessons = catalogLessons.filter((lesson) => all || requested.includes(`${lesson.module}/${lesson.lesson}`));
  if (lessons.length === 0 || lessons.some((lesson) => lesson.ids.length === 0)) {
    throw new Error('A renderer-ready smoke walk requires nonempty lessons');
  }
  return lessons;
}

export function assessRendererReady(expectedAnimationId, state, consoleErrors = []) {
  const reasons = [];
  if (!expectedAnimationId || state.animationId !== expectedAnimationId) reasons.push('CURRENT_PAGE_ID_MISMATCH');
  if (state.clockError) reasons.push('RUNTIME_CLOCK_ERROR');
  if (state.sessionError) reasons.push('HFR_SESSION_ERROR');
  if (state.rendererError) reasons.push('RENDERER_ERROR');
  if (state.observationError) reasons.push('OBSERVATION_ERROR');
  if (state.availability === 'unavailable') reasons.push('RENDERER_UNAVAILABLE');
  if (consoleErrors.length) reasons.push('BROWSER_ERROR');
  if (!state.rendererSignalFound) {
    reasons.push('UNSUPPORTED_RENDERER_READY_SIGNAL');
    return {status: reasons.length === 1 ? 'unsupported' : 'failed', rendererReady: false, failed: true, reasons};
  }
  if (state.rendererAnimationId !== expectedAnimationId) reasons.push('RENDERER_ID_MISMATCH');
  if (state.rendererSignalCount !== 1) reasons.push('AMBIGUOUS_RENDERER_READY_SIGNAL');
  if (state.settleTimedOut) reasons.push('RENDERER_WAIT_TIMEOUT');
  if (state.canvas !== 'ready') reasons.push(`RENDERER_NOT_READY:${state.canvas || 'missing'}`);
  return {status: reasons.length ? 'failed' : 'ready', rendererReady: reasons.length === 0, failed: reasons.length > 0, reasons};
}

export function summarizeRendererReady(expectedIds, observations) {
  const readyIds = [];
  const failedIds = [];
  const unsupportedIds = [];
  const notRunIds = [];
  for (const id of expectedIds) {
    const rows = observations.filter((row) => row.expectedAnimationId === id);
    if (rows.length === 0) notRunIds.push(id);
    else if (rows.every((row) => row.rendererReady === true && row.failed === false)) readyIds.push(id);
    else if (rows.every((row) => row.status === 'unsupported')) unsupportedIds.push(id);
    else failedIds.push(id);
  }
  const unexpectedIds = observations.filter((row) => !expectedIds.includes(row.expectedAnimationId)).map((row) => row.expectedAnimationId);
  return {
    gate: SMOKE_GATE, expected: expectedIds.length, visited: expectedIds.length - notRunIds.length,
    rendererReady: readyIds.length, readyIds, failedIds, unsupportedIds, notRunIds, unexpectedIds,
    complete: expectedIds.length > 0 && new Set(expectedIds).size === expectedIds.length &&
      readyIds.length === expectedIds.length && unexpectedIds.length === 0,
  };
}

export function allSmokeWalksComplete(summaries, expectedWalks) {
  return expectedWalks > 0 && summaries.length === expectedWalks && summaries.every((summary) => summary.complete === true);
}

// This function is serialized into the browser. Capture every field in the
// same JavaScript turn that decides whether the renderer has settled.
function rendererReadyObservation({expectedId, includePending = false}) {
  const signals = [...document.querySelectorAll('[data-canvas-status]')].map((node) => {
    const owner = node.closest('[data-hfr-page], [data-animation-id]');
    return {id: owner?.getAttribute('data-hfr-page') ?? owner?.getAttribute('data-animation-id') ?? '', status: node.getAttribute('data-canvas-status') ?? ''};
  });
  const matching = signals.filter((signal) => signal.id === expectedId);
  const signal = matching[0] ?? signals[0];
  const firstError = (attribute) => [...document.querySelectorAll(`[${attribute}]`)].map((node) => node.getAttribute(attribute)).find(Boolean) ?? '';
  const state = {
    animationId: document.querySelector('[data-current-animation-id]')?.getAttribute('data-current-animation-id') ?? '',
    rendererAnimationId: signal?.id ?? '',
    rendererSignalFound: Boolean(signal),
    rendererSignalCount: matching.length || signals.length,
    canvas: signal?.status ?? 'missing',
    clockError: firstError('data-runtime-clock-error'),
    sessionError: firstError('data-hfr-session-error'),
    rendererError: firstError('data-canvas-error') || firstError('data-renderer-error'),
    availability: document.querySelector('[data-renderer-availability="unavailable"]') ? 'unavailable'
      : document.querySelector('[data-renderer-availability]')?.getAttribute('data-renderer-availability') ?? '',
    // Parent frames remain diagnostic and never establish renderer readiness.
    frame: document.querySelector('[data-flash-frame]')?.getAttribute('data-flash-frame') ?? '',
  };
  if (includePending) return state;
  if (state.animationId !== expectedId) return false;
  if (state.clockError || state.sessionError || state.rendererError || state.availability === 'unavailable') return state;
  return matching.some((row) => ['ready', 'failed', 'error', 'blocked'].includes(row.status)) ? state : false;
}

export async function waitForRendererReady(page, expectedAnimationId, timeout = 20000) {
  let handle;
  try {
    handle = await page.waitForFunction(rendererReadyObservation, {expectedId: expectedAnimationId}, {timeout});
    return {...await handle.jsonValue(), settleTimedOut: false};
  } catch {
    const state = await page.evaluate(rendererReadyObservation, {expectedId: expectedAnimationId, includePending: true});
    return {...state, settleTimedOut: true};
  } finally {
    if (handle) await handle.dispose();
  }
}
