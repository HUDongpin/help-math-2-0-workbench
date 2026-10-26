/**
 * Small observations shared by the existing HFR browser cases.
 * Browser callbacks are self-contained so Playwright can serialize them.
 * These helpers do not seek a timeline, focus a node, toggle audio, or accept a page.
 */

/** Run with page.evaluate on a separate about:blank page, before product playback. */
export function observeCssomOpacity(values) {
  if (location.href !== 'about:blank') throw Error('CSSOM qualification requires an isolated about:blank page');
  if (!Array.isArray(values) || values.length === 0 ||
      values.some((value, index) => !Number.isFinite(value) || value < 0 || value > 1 ||
        (index > 0 && value <= values[index - 1]))) {
    throw Error('CSSOM source values must be unique, sorted finite opacities');
  }
  return values.map(sourceOpacity => {
    const node = document.createElement('div');
    try {
      node.style.opacity = String(sourceOpacity);
      document.body.append(node);
      const specified = node.style.opacity;
      const computed = getComputedStyle(node).opacity;
      if (!computed || !Number.isFinite(Number(computed))) throw Error('CSSOM returned no finite opacity');
      return {sourceOpacity, specified, computed,
        serializedReadback: Number(Number(computed).toFixed(6)),
        originalToFixed6: Number(sourceOpacity.toFixed(6))};
    } finally {
      node.remove();
    }
  });
}

/**
 * Qualify the browser against an already reviewed exact map. Never learn a new
 * expected value from a product node or silently accept another browser version.
 */
export function qualifyCssomOpacity({browserVersion, expectedBrowserVersion, sourceValues, expectedMapping, rows}) {
  const must = (value, message) => { if (!value) throw Error(message); };
  must(typeof expectedBrowserVersion === 'string' && expectedBrowserVersion.length > 0 &&
    browserVersion === expectedBrowserVersion, 'Exact qualified CSSOM browser version');
  must(Array.isArray(sourceValues) && sourceValues.length > 0 && sourceValues.every((value, index) =>
    Number.isFinite(value) && value >= 0 && value <= 1 && (index === 0 || value > sourceValues[index - 1])),
  'Exact sorted source opacity set');
  must(expectedMapping && Object.keys(expectedMapping).length === sourceValues.length &&
    sourceValues.every(value => Object.hasOwn(expectedMapping, String(value))), 'Complete reviewed CSSOM opacity map');
  must(Array.isArray(rows) && rows.length === sourceValues.length, 'Complete CSSOM observation rows');
  for (const [index, sourceOpacity] of sourceValues.entries()) {
    const expected = expectedMapping[String(sourceOpacity)], row = rows[index];
    must(Number.isFinite(expected) && expected >= 0 && expected <= 1 && row?.sourceOpacity === sourceOpacity,
      'Exact CSSOM source identity');
    must(row.specified === String(expected) && row.computed === String(expected) &&
      row.serializedReadback === expected && row.originalToFixed6 === Number(sourceOpacity.toFixed(6)),
    'Exact CSSOM serialization differs at ' + sourceOpacity);
  }
  return {kind: 'measured-CSSOM-exact-map', browserVersion, mapping: {...expectedMapping}, tolerance: 0, rows};
}

/** Run with page.evaluate; allow the real Close focus callback and its next paint. */
export function afterTwoAnimationFrames() {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))));
}

/** Run with page.evaluate. The caller keeps its existing focus/reachability assertions. */
export function observeActiveFocus() {
  const element = document.activeElement;
  const style = element ? getComputedStyle(element) : null;
  const rect = element?.getBoundingClientRect();
  const hit = rect ? document.elementFromPoint((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2) : null;
  return {tag: element?.tagName, entry: element?.getAttribute('data-hfr-glossary-entry'),
    inDialog: !!element?.closest('[role="dialog"]'), focusVisible: element?.matches(':focus-visible'),
    outline: style?.outlineStyle, outlineWidth: style?.outlineWidth, shadow: style?.boxShadow,
    unobstructed: !!element && !!hit && (element === hit || element.contains(hit)),
    bounds: rect ? {left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom} : null};
}

/** Run with the original ElementHandle.evaluate, never a re-selected replacement. */
export function observeOriginalFocus(element) {
  return element.isConnected && document.activeElement === element;
}

/** Preserve the case adapters' cumulative CDP WebAudio reduction. */
export function webAudioContexts(records) {
  const contexts = new Map();
  for (const record of records) {
    if (record.type.startsWith('WebAudio.') && record.payload.context) {
      contexts.set(record.payload.context.contextId, {...record.payload.context, destroyed: false, seq: record.seq});
    }
    if (record.type === 'WebAudio.contextWillBeDestroyed') {
      contexts.set(record.payload.contextId, {...(contexts.get(record.payload.contextId) ?? {}),
        contextId: record.payload.contextId, contextState: 'closed', destroyed: true, seq: record.seq});
    }
  }
  return [...contexts.values()];
}

/**
 * Poll this after a trusted Replay. A running old instance or an unbound
 * contextChanged event must not satisfy the current Replay's audio assertion.
 */
export function currentReplayAudioContext(records, replayMarker) {
  if (!Number.isSafeInteger(replayMarker?.seq) || replayMarker.seq < 0) throw Error('Actual Replay sequence marker required');
  const active = webAudioContexts(records).filter(context => !context.destroyed && context.contextState !== 'closed');
  if (active.length !== 1 || active[0].contextState !== 'running') return null;
  const context = active[0];
  if (typeof context.contextId !== 'string' || context.contextId.length === 0) return null;
  const created = records.some(record => record.type === 'WebAudio.contextCreated' &&
    record.seq > replayMarker.seq && record.payload.context?.contextId === context.contextId);
  return created ? context : null;
}
