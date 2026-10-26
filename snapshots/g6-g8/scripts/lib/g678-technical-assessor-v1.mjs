/** Offline assessment of retained browser observations. No registration or product writes. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {PNG} from 'pngjs';
import {sourceVmOwnerChanged, sourceVmReplayCause, sourceVmRetired} from './g678-source-vm-lifecycle-v1.mjs';

export const DEFAULT_CELLS = Object.freeze(['en', 'es'].flatMap(locale => [
  {cellId: `${locale}-desktop`, locale, width: 1440, height: 900, rootFontPx: 16, dpr: 1, touch: false, reducedMotion: false},
  {cellId: `${locale}-mobile`, locale, width: 390, height: 844, rootFontPx: 16, dpr: 2, touch: true, reducedMotion: false},
  {cellId: `${locale}-narrow-enlarged`, locale, width: 320, height: 844, rootFontPx: 32, dpr: 2, touch: true, reducedMotion: false},
]));
export const REQUIRED_SUPPLEMENT_IDS = Object.freeze(['viewport-320', 'viewport-390', 'viewport-768', 'viewport-1280', 'viewport-1440',
  'text-200-percent', 'dpr-1', 'dpr-2', 'dpr-3', 'rotation', 'sidebar', 'reduced-motion', 'font-loading', 'font-fallback']);
const GATES = ['integrity', 'playback', 'interactions', 'audio', 'layout'];
const LOG_KEYS = ['errors', 'consoleErrors', 'networkErrors', 'cleanupErrors'];
const INPUT_TYPES = new Set(['pointerdown', 'pointerup', 'pointermove', 'pointercancel', 'keydown', 'keyup', 'click', 'input', 'change']);
const text = value => typeof value === 'string' && value.trim().length > 0;
const number = value => typeof value === 'number' && Number.isFinite(value);
const integer = value => Number.isSafeInteger(value) && value >= 0;
const positive = value => number(value) && value > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const rows = value => Array.isArray(value) ? value : [];
// A retained input can be an empty log. Source/content pins still require bytes.
const artifactPinValid = pin => object(pin) && text(pin.path) && integer(pin.bytes) && /^[a-f0-9]{64}$/u.test(pin.sha256 ?? '');
const pinValid = pin => artifactPinValid(pin) && pin.bytes > 0;
const pinShape = pin => ({path: pin?.path, bytes: pin?.bytes, sha256: pin?.sha256});
const samePin = (a, b) => artifactPinValid(a) && artifactPinValid(b) && same(pinShape(a), pinShape(b));
const pinsEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every(p => b.some(q => samePin(p, q))) && new Set(a.map(p => p.path)).size === a.length;
const atPath = (value, key) => {
  if (!text(key) || key.split('.').some(k => ['__proto__', 'prototype', 'constructor'].includes(k))) return undefined;
  for (const field of key.split('.')) {if (!object(value) || !Object.hasOwn(value, field)) return undefined; value = value[field];}
  return value;
};
const stateMapValid = expected => object(expected) && Object.keys(expected).length > 0 && Object.entries(expected).every(([k, v]) =>
  text(k) && v !== undefined && (v === null || typeof v === 'boolean' || number(v) || text(v) || Array.isArray(v)));
const stateMatches = (sample, expected) => stateMapValid(expected) && Object.entries(expected).every(([k, v]) => same(atPath(sample, k), v));
const outcome = issues => issues.some(i => i.status === 'fail') ? 'fail' : issues.some(i => i.status === 'unsupported') ? 'unsupported' : issues.length ? 'not-run' : 'pass';
const unique = values => Array.isArray(values) && new Set(values).size === values.length;
const timeRange = (start, end) => text(start) && text(end) && Number.isFinite(Date.parse(start)) && Number.isFinite(Date.parse(end)) && Date.parse(end) > Date.parse(start);
const owner = sample => sample?.identity?.playerId;
const ownerToken = sample => sample?.identity?.ownerKind === 'surface-run' ? sample.identity.runToken : sample?.identity?.leaseToken;
const sameOwner = (a, b) => text(owner(a)) && owner(a) === owner(b) && ownerToken(a) === ownerToken(b) && a.identity.replay === b.identity.replay;
// The scalar output count can be unmeasured while native owned contexts
// already prove silence. Unknown ownership still stays unsupported.
export function assessPausedOwnedAudio({paused, held, htmlMedia, htmlRequired = false, documentId,
  sourceUrls = [], sampleRate = 48000}) {
  const issues = [], add = (code, status = 'fail') => issues.push({code, status});
  const sameIdentity = (a, b) => object(a) && object(b) && text(a.animationId) &&
    /^[a-f0-9]{64}$/u.test(a.sourceSha256 ?? '') && text(a.playerId) && integer(a.replay) &&
    ['source-vm', 'surface-run'].includes(a.ownerKind) && ['animationId', 'sourceSha256', 'playerId', 'ownerKind', 'replay'].every(k => a[k] === b[k]) &&
    (a.ownerKind === 'surface-run' ? text(a.runToken) && a.runToken === b.runToken :
      (text(a.leaseToken) || positive(a.leaseToken) && integer(a.leaseToken)) && a.leaseToken === b.leaseToken);
  const a = paused?.media, b = held?.media;
  const supportedReasons = media => ['ready', 'unsupported'].includes(media?.status) && Array.isArray(media?.unsupported) &&
    media.unsupported.every(reason => ['timer-ownership-unqualified', 'async-ownership-unqualified'].includes(reason));
  const contextsSilent = sameIdentity(paused?.identity, held?.identity) && text(owner(paused)) &&
    a?.playerId === owner(paused) && b?.playerId === owner(held) && supportedReasons(a) && supportedReasons(b) &&
    [a, b].every(m => m.runningOwnedOutputs === null || m.runningOwnedOutputs === undefined || m.runningOwnedOutputs === 0) &&
    rows(a.contexts).length > 0 && rows(a.contexts).length === rows(b.contexts).length &&
    unique(a.contexts.map(c => c?.contextId)) && unique(b.contexts.map(c => c?.contextId)) &&
    a.contexts.every(c => text(c?.contextId) && number(c.currentTime) && ['suspended', 'closed'].includes(c.state) &&
      b.contexts.some(d => d?.contextId === c.contextId && number(d.currentTime) &&
        ['suspended', 'closed'].includes(d.state) && d.currentTime === c.currentTime));
  const counted = (media, sample) => sameIdentity(paused?.identity, held?.identity) &&
    media?.playerId === owner(sample) && media.status === 'ready' &&
    Array.isArray(media.unsupported) && media.unsupported.length === 0 && integer(media.runningOwnedOutputs);
  const explicitZero = counted(a, paused) && counted(b, held) && a.runningOwnedOutputs === 0 && b.runningOwnedOutputs === 0;
  if ([[a, paused], [b, held]].some(([m, sample]) => counted(m, sample) && m.runningOwnedOutputs > 0)) add('pause-did-not-suppress-owned-audio');
  else if (!explicitZero && !contextsSilent) add('pause-owned-audio-unmeasured', 'unsupported');

  const sameNativeOwner = row => sameIdentity(row?.owner, paused?.identity);
  const nativeRows = rows(htmlMedia?.samples).filter(sameNativeOwner);
  if (htmlRequired || nativeRows.length || rows(htmlMedia?.unsupported).length || rows(htmlMedia?.errors).length) {
    if (htmlMedia?.kind !== 'source-vm-html-media-observations-v1' || !text(documentId) || !text(htmlMedia.documentId) || htmlMedia.documentId !== documentId ||
        !Array.isArray(htmlMedia.samples) || !Array.isArray(htmlMedia.operations) || !Array.isArray(htmlMedia.events) ||
        !Array.isArray(htmlMedia.errors) || htmlMedia.errors.length ||
        !Array.isArray(htmlMedia.unsupported) || htmlMedia.unsupported.length ||
        !number(paused?.atMs) || !number(held?.atMs) || held.atMs <= paused.atMs ||
        !positive(sampleRate) || !sameIdentity(paused.identity, held.identity)) {
      add('pause-owned-html-audio-unmeasured', 'unsupported');
    } else {
      const ids = [...new Set(nativeRows.filter(r => number(r.atMs) && r.atMs <= held.atMs).map(r => r.mediaElementId))];
      if (!ids.length || ids.some(id => !text(id))) add('pause-owned-html-audio-unmeasured', 'unsupported');
      const seenUrls = new Set();
      for (const id of ids) {
        // Reuse the existing native lifecycle check's 50ms control-boundary
        // join. Never move timestamps or borrow a retired owner's element.
        const latest = boundary => nativeRows.filter(r => r.mediaElementId === id && number(r.atMs) &&
          r.atMs <= boundary.atMs && boundary.atMs - r.atMs <= 50).sort((x, y) => y.atMs - x.atMs || y.sequence - x.sequence)[0];
        const p = latest(paused), h = latest(held);
        if (!p || !h) {add('pause-owned-html-audio-unmeasured', 'unsupported'); continue;}
        const between = nativeRows.filter(r => r.mediaElementId === id && r.atMs >= p.atMs && r.atMs <= h.atMs);
        const src = p.state?.currentSrc || p.state?.src;
        const activity = between.some(r => r.state?.paused === false || r.state?.seeking === true ||
          r.state?.error !== undefined && r.state.error !== null ||
          text(src) && text(r.state?.currentSrc || r.state?.src) && (r.state.currentSrc || r.state.src) !== src ||
          number(p.state?.currentTime) && number(r.state?.currentTime) && Math.abs(r.state.currentTime - p.state.currentTime) > 1 / sampleRate) ||
          rows(htmlMedia.operations).some(r => sameNativeOwner(r) && r.mediaElementId === id && r.method === 'play' && r.atMs >= p.atMs && r.atMs <= h.atMs) ||
          rows(htmlMedia.events).some(r => sameNativeOwner(r) && r.mediaElementId === id && ['playing', 'seeking', 'seeked'].includes(r.type) && r.atMs >= p.atMs && r.atMs <= h.atMs);
        if (activity) add('pause-did-not-suppress-owned-html-audio');
        if (!text(src) || !number(p.state?.currentTime) || !number(h.state?.currentTime) ||
            between.some(r => !number(r.state?.currentTime) || typeof r.state?.paused !== 'boolean' ||
              typeof r.state?.seeking !== 'boolean' || !text(r.state?.currentSrc || r.state?.src) ||
              !object(r.state) || !Object.hasOwn(r.state, 'error') || r.state.error === undefined)) {
          add('pause-owned-html-audio-unmeasured', 'unsupported'); continue;
        }
        seenUrls.add(src);
      }
      if (htmlRequired && !sourceUrls.length || sourceUrls.some(url => !text(url) || !seenUrls.has(url))) add('pause-owned-html-source-unmeasured', 'unsupported');
    }
  }
  return {issues, webAudioBasis: contextsSilent ? 'same-owned-native-contexts-suspended-or-closed-with-frozen-clocks' :
    explicitZero ? 'measured-zero-owned-outputs' : 'unmeasured-or-running'};
}
const replayOwnerChanged = (a, b) => a?.identity?.ownerKind === 'source-vm'
  ? sourceVmOwnerChanged(a.identity, b?.identity)
  : a?.identity?.ownerKind === 'surface-run' && b?.identity?.ownerKind === 'surface-run' &&
    owner(a) !== owner(b) && ownerToken(a) !== ownerToken(b) && b.identity.replay === a.identity.replay + 1;
const retiredOwner = (retired, sample) => retired?.playerId === owner(sample) && (sample?.identity?.ownerKind === 'surface-run'
  ? retired.kind === 'surface-run' && retired.runEpoch === sample.identity.runEpoch && Array.isArray(retired.sourceNodeIds) && unique(retired.sourceNodeIds) &&
    retired.sourceNodeIds.every(text) && retired.activeSourceNodes === 0 && retired.pendingMediaStarts === 0
  : sourceVmRetired(retired, sample));
const statePredicate = (C, id) => id === 'initial' ? C.terminal?.initialState : id === 'terminal' ? C.terminal?.expectedState :
  rows(C.interactions?.cases).find(b => b?.stateId === id)?.expectedState ?? C.layout?.statePredicates?.[id];
const reachable = (target, viewport) => {
  const r = target?.rect;
  return object(r) && [r.left, r.top, r.right, r.bottom, r.width, r.height].every(number) && r.width > 0 && r.height > 0 &&
    r.left >= -1 && r.top >= -1 && r.right <= viewport.width + 1 && r.bottom <= viewport.height + 1 &&
    target.clippedPixels === 0 && target.obscuredPixels === 0 && target.hitTargetId === target.id;
};

// A viewport includes classic scrollbars; root client width excludes them.
// Require fresh geometry instead of interpreting every width gap as a gutter.
const documentLayoutStatus = (layout, viewport) => {
  const g = layout?.documentGeometry, r = g?.rootRect;
  // Existing equal-width observations already establish the no-gutter case.
  // A legacy width gap still needs fresh geometry; never infer its cause.
  if (g === undefined) {
    if (!positive(layout?.rootClientWidth) || !positive(layout?.rootScrollWidth)) return 'not-run';
    if (layout.rootScrollWidth > layout.rootClientWidth + 1) return 'fail';
    return layout.rootClientWidth === viewport?.width ? 'pass' : 'not-run';
  }
  if (![layout?.rootScrollWidth, layout?.rootClientWidth, g?.viewportWidth, g?.viewportHeight,
      g?.rootClientHeight, g?.rootScrollHeight, r?.left, r?.right, r?.width].every(number) ||
      !text(g?.overflowY) || !text(g?.scrollbarGutter)) return 'not-run';
  if (g.scrollbarGutter === 'stable both-edges') return 'unsupported';
  if (![layout.rootClientWidth, g.viewportWidth, g.viewportHeight, g.rootClientHeight, r.width].every(positive) ||
      g.viewportWidth !== viewport?.width || g.viewportHeight !== viewport?.height ||
      layout.rootClientWidth > g.viewportWidth || g.rootClientHeight > g.viewportHeight || g.rootScrollHeight < g.rootClientHeight ||
      layout.rootScrollWidth < layout.rootClientWidth || layout.rootScrollWidth > layout.rootClientWidth + 1 ||
      Math.abs(r.left) > 1 || Math.abs(r.right - r.left - r.width) > 1 || Math.abs(r.width - layout.rootClientWidth) > 1) return 'fail';
  const reservesGutter = g.scrollbarGutter === 'stable' && g.overflowY !== 'clip';
  const scrollsVertically = g.overflowY === 'scroll' || ['auto', 'visible'].includes(g.overflowY) && g.rootScrollHeight > g.rootClientHeight;
  return layout.rootClientWidth < g.viewportWidth && !reservesGutter && !scrollsVertically ? 'fail' : 'pass';
};

function reader(root, issue) {
  const cache = new Map();
  return pin => {
    if (!artifactPinValid(pin)) {issue('integrity', 'invalid-artifact-pin', 'fail', pin?.path); return null;}
    if (!text(root) || !path.isAbsolute(root)) {issue('integrity', 'evidence-root-required', 'unsupported'); return null;}
    const file = path.isAbsolute(pin.path) ? pin.path : path.resolve(root, pin.path);
    if (!path.isAbsolute(pin.path) && (pin.path.split('/').includes('..') || file === root || !file.startsWith(root + path.sep))) {
      issue('integrity', 'artifact-path-outside-root', 'fail', pin.path); return null;
    }
    const prior = cache.get(file);
    if (prior) {if (prior.pin.bytes !== pin.bytes || prior.pin.sha256 !== pin.sha256) issue('integrity', 'conflicting-artifact-pins', 'fail', pin.path); return prior.bytes;}
    try {
      if (fs.realpathSync(file) !== file) throw Error('symlink evidence path');
      const before = fs.statSync(file, {bigint: true});
      if (!before.isFile() || before.size !== BigInt(pin.bytes)) throw Error('file size or type differs');
      const bytes = fs.readFileSync(file), after = fs.statSync(file, {bigint: true});
      if (['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs'].some(k => before[k] !== after[k])) throw Error('file changed while reading');
      if (createHash('sha256').update(bytes).digest('hex') !== pin.sha256) throw Error('SHA-256 differs');
      cache.set(file, {pin, bytes}); return bytes;
    } catch (error) {issue('integrity', 'artifact-read-or-hash-failed', 'fail', `${pin.path}: ${error.message}`); return null;}
  };
}

/** These are stage-crop pixels, read from the retained PNG, never a raw passed flag. */
function imageFacts(bytes) {
  const png = PNG.sync.read(bytes, {checkCRC: true});
  const colors = new Set(), first = png.data.subarray(0, 4).toString('hex'); let nonBackgroundPixels = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    const color = png.data.subarray(i, i + 4).toString('hex');
    if (colors.size < 1024) colors.add(color);
    if (png.data[i + 3] > 0 && color !== first) nonBackgroundPixels++;
  }
  return {width: png.width, height: png.height, distinctColors: colors.size, nonBackgroundPixels};
}

export function assessPage({contract, contractPin, raw, root} = {}) {
  const issues = [], localeGaps = [], cellResults = [];
  const issue = (gate, code, status = 'fail', detail, cellId) => issues.push({gate, code, status, ...(cellId ? {cellId} : {}), ...(detail === undefined ? {} : {detail})});
  const read = reader(root, issue);
  const contentMethod = assertion => assertion?.method ?? 'innerText';
  const checkContent = (assertion, check, sample, add) => {
    const method = contentMethod(assertion), bounds = check?.rect, style = check?.computed;
    if (!sample || check?.method !== method || !object(bounds) || !positive(bounds.width) || !positive(bounds.height) ||
        !text(style?.display) || style.display === 'none' || style.visibility !== 'visible' || !positive(style.opacity)) {
      add('layout', 'required-source-content-mismatch-or-hidden', 'fail', assertion.id); return;
    }
    if (method === 'innerText' || method === 'svg-text') {
      const expected=assertion.textByLocale?.[sample.viewport?.locale]??assertion.text;
      if (!text(expected) || !text(check.text) || !check.text.includes(expected) || method === 'svg-text' && check.namespaceURI !== 'http://www.w3.org/2000/svg') {
        add('layout', 'required-source-content-mismatch-or-hidden', 'fail', assertion.id);
      }
      return;
    }
    if (check.observation !== 'committed-render-object' || check.surfaceKind !== assertion.surfaceKind || check.objectId !== assertion.objectId ||
        !stateMatches(check.objectState, assertion.expectedState) || check.playerId !== owner(sample) || check.surfaceId !== sample.render?.surfaceId ||
        !text(check.commitId) || check.commitId !== sample.render?.commitId || !positive(sample.render?.commitSequence)) {
      add('layout', 'source-object-or-committed-render-binding-mismatch', 'fail', assertion.id);
    }
    if (![bounds.left, bounds.top, bounds.right, bounds.bottom].every(number) || bounds.left < -1 || bounds.top < -1 ||
        bounds.right > sample.viewport?.width + 1 || bounds.bottom > sample.viewport?.height + 1 ||
        check.clippedPixels !== 0 || check.obscuredPixels !== 0) add('layout', 'source-content-object-clipped-or-obscured', 'fail', assertion.id);
    const shot = check.screenshot;
    if (shot?.scope !== 'content-object' || shot.objectId !== assertion.objectId || shot.sampleSequence !== sample.sequence || shot.surfaceId !== sample.render?.surfaceId) {
      add('layout', 'source-content-object-image-unbound', 'not-run', assertion.id); return;
    }
    const bytes = read(shot.pin);
    if (bytes) try {
      const facts = imageFacts(bytes), dpr = sample.viewport?.dpr;
      if (facts.width < 2 || facts.height < 2 || facts.distinctColors < 2 || facts.nonBackgroundPixels < 4 ||
          !positive(dpr) || Math.abs(facts.width - bounds.width * dpr) > 2 || Math.abs(facts.height - bounds.height * dpr) > 2) {
        add('layout', 'source-content-object-image-blank-or-wrong-region', 'fail', assertion.id);
      }
    } catch {add('layout', 'source-content-object-image-invalid', 'fail', assertion.id);}
  };
  if (!object(contract) || !/^shared-(alg001|dat001|geo001|nms002)-l\d{2}-p\d{3}$/u.test(contract.animationId ?? '')) {
    issue('integrity', 'source-contract-identity-required', 'unsupported');
  }
  const C = object(contract) ? contract : {};
  const inspectStatePixels = (facts, sample, stateId, scope, add, gate, ordinaryBlankCode) => {
    if (scope === 'stage' && stateId === 'initial' && C.layout?.expectedBlankStates?.initial) {
      const declaration = C.layout.expectedBlankStates.initial;
      if (!samePin(declaration.sourcePin, C.source) || !text(declaration.reason) || !stateMatches(sample, C.terminal?.initialState)) {
        add(gate, 'expected-blank-initial-source-state-unbound'); return;
      }
      const render = sample?.render;
      if (!text(render?.commitId) || !positive(render?.commitSequence) || !number(render?.committedAtMs) || render.committedAtMs > sample?.atMs ||
          render?.sourceFrame !== sample?.source?.frame || render?.sourceFrameDomain !== sample?.source?.frameDomain || render?.sourceTick !== sample?.source?.tick) {
        add(gate, 'expected-blank-initial-real-commit-required');
      }
      if (facts.width < 2 || facts.height < 2 || facts.distinctColors !== 1 || facts.nonBackgroundPixels !== 0) add(gate, 'source-blank-initial-has-unexpected-drawing');
      return;
    }
    if (facts.width < 2 || facts.height < 2 || facts.distinctColors < 2 || facts.nonBackgroundPixels < 4) add(gate, ordinaryBlankCode, 'fail', stateId);
  };
  if (!pinValid(contractPin)) issue('integrity', 'contract-file-pin-required', 'unsupported');
  else {
    const bytes = read(contractPin);
    try {const parsed = bytes && JSON.parse(bytes), bound = Array.isArray(parsed?.contracts) ? parsed.contracts.filter(c => c.animationId === C.animationId) : [parsed];
      if (bound.length !== 1 || !same(bound[0], C)) issue('integrity', 'contract-file-content-mismatch');
    } catch {issue('integrity', 'contract-file-invalid-json');}
  }
  if (!pinValid(C.source)) issue('integrity', 'exact-source-required', 'unsupported'); else read(C.source);
  if (!Array.isArray(C.inputPins) || C.inputPins.length === 0 || !unique(C.inputPins.map(p => p?.path)) || C.inputPins.some(p => !artifactPinValid(p))) {
    issue('integrity', 'complete-unique-input-pins-required', 'unsupported');
  } else C.inputPins.forEach(read);
  if (!text(C.rendererFamily) || !text(C.behaviorFamily)) issue('integrity', 'renderer-and-behavior-family-required', 'unsupported');
  if (!Array.isArray(C.unresolved) || C.unresolved.length) issue('integrity', 'unresolved-source-contract', 'unsupported', C.unresolved);
  const known = (section, gate, allowNone = false) => {
    const value = C[section];
    if (!object(value) || !['known', ...(allowNone ? ['not-required'] : [])].includes(value.status)) {
      issue(gate, `${section}-contract-unsupported`, 'unsupported'); return false;
    }
    if (!pinValid(value.sourcePin)) issue(gate, `${section}-source-provenance-required`, 'unsupported'); else read(value.sourcePin);
    if (!Array.isArray(value.unknowns) || value.unknowns.length) issue(gate, `${section}-unknowns`, 'unsupported', value.unknowns);
    if (value.status === 'not-required' && (!text(value.reason) || !samePin(value.sourcePin, C.source))) issue(gate, `${section}-not-required-needs-exact-source`, 'unsupported');
    return value.status === 'known';
  };
  const terminalKnown = known('terminal', 'playback');
  if (terminalKnown && (!['timeline', 'activity', 'loop', 'static'].includes(C.terminal.kind) || !text(C.terminal.frameDomain) ||
      !positive(C.terminal.frame) || !positive(C.terminal.minimumDurationMs) || !stateMapValid(C.terminal.expectedState) || !stateMapValid(C.terminal.initialState))) {
    issue('playback', 'source-terminal-predicate-required', 'unsupported');
  }
  const interactionsKnown = known('interactions', 'interactions', true);
  if (interactionsKnown && (!Array.isArray(C.interactions.cases) || !C.interactions.cases.length || !unique(C.interactions.cases.map(c => c?.id)))) {
    issue('interactions', 'complete-unique-branch-inventory-required', 'unsupported');
  }
  for (const branch of rows(C.interactions?.cases)) {
    if (!object(branch) || !text(branch.id) || !stateMapValid(branch.beforeState) || !stateMapValid(branch.expectedState) || !Array.isArray(branch.inputTypes) || !branch.inputTypes.length ||
        branch.inputTypes.some(t => !INPUT_TYPES.has(t)) || !text(branch.stateId) || !pinValid(branch.sourcePin)) issue('interactions', 'source-branch-predicate-required', 'unsupported', branch?.id);
    else read(branch.sourcePin);
  }
  const inputVariants = rows(C.interactions?.inputVariants);
  if (C.interactions?.inputVariantsRequired && !inputVariants.length) issue('interactions', 'declared-input-variants-need-executable-contract', 'unsupported');
  if (!unique(inputVariants.map(v => v?.id)) || inputVariants.some(v => !object(v) || !text(v.id) || !Array.isArray(v.inputTypes) || !v.inputTypes.length || v.inputTypes.some(t => !INPUT_TYPES.has(t)) ||
      (v.key !== undefined && !['Enter', ' ', 'Space', 'Escape'].includes(v.key)))) issue('interactions', 'input-variant-contract-invalid', 'unsupported');
  const audioKnown = known('audio', 'audio', true);
  if (audioKnown && (!Array.isArray(C.audio.cues) || !C.audio.cues.length || !unique(C.audio.cues.map(c => `${c?.locale}:${c?.id}`)))) issue('audio', 'complete-unique-audio-inventory-required', 'unsupported');
  for (const cue of rows(C.audio?.cues)) {
    if (!object(cue) || !text(cue.id) || !['en', 'es'].includes(cue.locale) || !pinValid(cue.source) || !positive(cue.minimumDurationMs) ||
        !positive(cue.minimumRms) || !positive(cue.matchThreshold) || cue.matchThreshold > 1) issue('audio', 'source-audio-predicate-required', 'unsupported', cue?.id);
    else read(cue.source);
    if (cue?.triggerCaseId !== undefined && !rows(C.interactions?.cases).some(c => c?.id === cue.triggerCaseId)) issue('audio', 'audio-trigger-branch-not-in-source-contract', 'unsupported', cue.id);
    if (cue?.sourcePCM) {
      if (!pinValid(cue.sourcePCM)) issue('audio', 'nonempty-source-pcm-required', 'unsupported', cue.id); else read(cue.sourcePCM);
      if (!integer(cue.sourceFirstDecodedSample) || !positive(cue.sourceEndDecodedSample) || cue.sourceEndDecodedSample <= cue.sourceFirstDecodedSample || !positive(cue.sampleRate) || !positive(cue.channels)) issue('audio', 'source-pcm-subrange-required', 'unsupported', cue.id);
    }
  }
  for (const window of rows(C.audio?.expectedSilentWindows)) if (!text(window?.id) || !number(window.startPlaybackSeconds) || !number(window.endPlaybackSeconds) || window.startPlaybackSeconds < 0 ||
      window.endPlaybackSeconds <= window.startPlaybackSeconds || !number(window.maximumRms) || window.maximumRms < 0) issue('audio', 'source-silence-window-contract-invalid', 'unsupported');
  const stateIds = C.layout?.requiredStateIds, targetIds = C.layout?.targetIds;
  if (C.layout?.expectedBlankStates !== undefined) {
    const declarations = C.layout.expectedBlankStates;
    if (!object(declarations) || Object.keys(declarations).length !== 1 || !Object.hasOwn(declarations, 'initial') ||
        !samePin(declarations.initial?.sourcePin, C.source) || !text(declarations.initial?.reason)) issue('layout', 'source-blank-exception-must-bind-exact-initial-source', 'unsupported');
    else read(declarations.initial.sourcePin);
    if (!positive(C.terminal?.initialState?.['source.frame']) || !text(C.terminal?.initialState?.['source.frameDomain'])) issue('layout', 'source-blank-initial-frame-predicate-required', 'unsupported');
  }
  if (!Array.isArray(stateIds) || !stateIds.length || !unique(stateIds) || stateIds.some(id => !text(id)) ||
      !Array.isArray(targetIds) || !targetIds.length || !unique(targetIds) || targetIds.some(id => !text(id))) issue('layout', 'source-layout-inventory-required', 'unsupported');
  for (const branch of rows(C.interactions?.cases)) if (!rows(stateIds).includes(branch?.stateId)) issue('layout', 'branch-state-missing-from-layout-inventory', 'unsupported', branch?.id);
  if (!rows(stateIds).includes('initial') || !rows(stateIds).includes('terminal')) issue('layout', 'initial-and-terminal-layout-required', 'unsupported');
  if (!Array.isArray(C.contentAssertions) || !C.contentAssertions.length || !unique(C.contentAssertions.map(a => a?.id))) {
    issue('layout', 'nonempty-unique-source-content-inventory-required', 'unsupported');
  }
  for (const assertion of rows(C.contentAssertions)) {
    const method = contentMethod(assertion);
    if (!text(assertion?.id) || !rows(stateIds).includes(assertion.stateId) || !text(assertion.selector) || !pinValid(assertion.sourcePin) ||
        !['innerText', 'svg-text', 'rendered-object'].includes(method) ||
        (method === 'rendered-object' ? !['canvas', 'svg', 'dom'].includes(assertion.surfaceKind) || !text(assertion.objectId) || !stateMapValid(assertion.expectedState) :
          assertion.textByLocale!==undefined ? !object(assertion.textByLocale)||!same(Object.keys(assertion.textByLocale).sort(),['en','es'])||!['en','es'].every(locale=>text(assertion.textByLocale[locale])) : !text(assertion.text))) issue('layout', 'source-content-assertion-invalid', 'unsupported');
    else read(assertion.sourcePin);
  }
  const hostControls = rows(C.interactions?.hostControlsAdditional);
  if (hostControls.some(c => !['pause', 'play', 'replay', 'next', 'previous'].includes(c))) issue('interactions', 'unsupported-host-control-contract', 'unsupported');
  for (const action of ['next', 'previous'].filter(a => hostControls.includes(a))) {
    if (!text(C.navigation?.[action]?.animationId) || !pinValid(C.navigation?.[action]?.sourcePin)) issue('interactions', 'source-navigation-target-required', 'unsupported', action);
    else read(C.navigation[action].sourcePin);
  }
  const fallback = C.authorizedEnglishFallback;
  if (fallback) {
    if (fallback.locale !== 'es' || !text(fallback.reason) || !pinValid(fallback.authorizationPin) || !Array.isArray(fallback.channels) ||
        !fallback.channels.length || fallback.channels.some(c => !['visual', 'audio'].includes(c))) issue('integrity', 'explicit-fallback-authorization-required', 'unsupported');
    else read(fallback.authorizationPin);
  }
  if (!raw) issue('integrity', 'browser-run-not-recorded', 'not-run');
  else {
    if (raw.kind !== 'g678-full-technical-raw-v1' || raw.animationId !== C.animationId || !samePin(raw.source, C.source)) issue('integrity', 'raw-source-identity-mismatch');
    if (!samePin(raw.contractPin, contractPin)) issue('integrity', 'raw-contract-pin-mismatch');
    if (!timeRange(raw.startedAt, raw.finishedAt)) issue('integrity', 'run-start-and-finish-required');
    if (!pinsEqual(C.inputPins, raw.preflightPins) || !pinsEqual(C.inputPins, raw.postflightPins)) issue('integrity', 'input-drift-or-incomplete-preflight-postflight');
    if (!Array.isArray(raw.cells)) issue('integrity', 'cell-records-required', 'not-run');
    else {
      if (!unique(raw.cells.map(c => c?.cellId))) issue('integrity', 'duplicate-cell-record');
      for (const cell of raw.cells) if (!DEFAULT_CELLS.some(c => c.cellId === cell?.cellId)) issue('integrity', 'unexpected-cell', 'fail', cell?.cellId);
    }
  }
  const globalIssues = [...issues];
  for (const expected of DEFAULT_CELLS) {
    const {cellId, ...config} = expected, beforeIssues = issues.length;
    const add = (gate, code, status = 'fail', detail) => issue(gate, code, status, detail, cellId);
    const cell = rows(raw?.cells).find(c => c?.cellId === cellId);
    if (!cell) {add('integrity', 'required-cell-not-run', 'not-run'); cellResults.push({cellId, status: 'not-run', gates: Object.fromEntries(GATES.map(g => [g, 'not-run']))}); continue;}
    if (!same(cell.config, config)) add('integrity', 'actual-cell-configuration-mismatch');
    if (!timeRange(cell.startedAt, cell.finishedAt) || Date.parse(cell.startedAt) < Date.parse(raw.startedAt) || Date.parse(cell.finishedAt) > Date.parse(raw.finishedAt)) add('integrity', 'cell-run-interval-invalid');
    for (const key of LOG_KEYS) if (!Array.isArray(cell[key]) || cell[key].length) add('integrity', `${key}-missing-or-nonempty`);
    const logBytes = read(cell.logPin);
    if (logBytes) {try {if (!same(JSON.parse(logBytes), Object.fromEntries(LOG_KEYS.map(k => [k, cell[k]])))) add('integrity', 'retained-logs-differ-from-observations');} catch {add('integrity', 'retained-logs-invalid-json');}}
    if (!Array.isArray(cell.documents) || cell.documents.length !== 1) {add('integrity', 'one-complete-document-required'); cellResults.push({cellId, status: 'fail', gates: Object.fromEntries(GATES.map(g => [g, 'fail']))}); continue;}
    const d = cell.documents[0] ?? {}, samples = rows(d.samples), events = rows(d.events);
    if (samples.some(s => !object(s)) || events.some(e => !object(e))) {add('integrity', 'malformed-observer-record'); cellResults.push({cellId, status: 'fail', gates: Object.fromEntries(GATES.map(g => [g, 'fail']))}); continue;}
    if (!text(d.documentId) || samples.length < 2 || !Array.isArray(d.errors) || d.errors.length || !Array.isArray(d.events)) add('integrity', 'complete-document-observer-required');
    if (!unique(samples.map(s => s.sequence)) || samples.some((s, i) => !positive(s.sequence) || !number(s.atMs) || (i > 0 && (s.sequence <= samples[i - 1].sequence || s.atMs < samples[i - 1].atMs)))) add('integrity', 'sample-order-invalid');
    if (!unique(events.map(e => e.sequence)) || events.some((e, i) => !positive(e.sequence) || !number(e.atMs) || !text(e.type) || (i > 0 && (e.sequence <= events[i - 1].sequence || e.atMs < events[i - 1].atMs)))) add('integrity', 'event-order-invalid');
    const byId = new Map(samples.map(s => [s.sequence, s]));
    const at = sequence => {const s = byId.get(sequence); if (!s) add('integrity', 'referenced-sample-missing', 'fail', sequence); return s;};
    for (const s of samples) {
      if (s.identity?.animationId !== C.animationId || s.identity?.sourceSha256 !== C.source?.sha256 || !text(owner(s)) ||
          !['source-vm', 'surface-run'].includes(s.identity?.ownerKind) || !(text(ownerToken(s)) || positive(ownerToken(s)) && integer(ownerToken(s))) || !integer(s.identity?.replay)) add('integrity', 'renderer-owner-or-source-identity-missing');
      if (s.identity?.ownerKind === 'surface-run' && (!integer(s.identity.runEpoch) || s.identity.runEpoch !== s.identity.replay || s.identity.surfaceId !== s.render?.surfaceId)) add('integrity', 'native-surface-run-identity-invalid');
      if (!same(s.viewport, config)) add('integrity', 'sample-viewport-not-measured-or-mismatched');
      if (!object(s.observer) || s.observer.sourceActionsCalled !== false || s.observer.sourceStateWritten !== false || s.observer.syntheticInput !== false) add('integrity', 'nonpassive-or-unknown-observer');
      if (!object(s.source) || !['source-runtime', 'renderer-state'].includes(s.source.observedFrom) || s.source.clockOwnerId !== owner(s) ||
          !text(s.source.frameDomain) || !positive(s.source.frame) || !integer(s.source.tick)) add('playback', 'real-source-state-required');
      if (s.source?.tickKind !== (s.identity?.ownerKind === 'surface-run' ? 'observed-committed-paint' : 'source-tick') ||
          s.source?.observedFrom !== (s.identity?.ownerKind === 'surface-run' ? 'renderer-state' : 'source-runtime')) add('playback', 'source-observation-kind-mismatch');
      if (!Array.isArray(s.source?.errors) || s.source.errors.length || !Array.isArray(s.source?.missing) || s.source.missing.length) add('playback', 'source-runtime-errors-or-missing-resources');
      if (s.render?.status !== 'ready' || !text(s.render.surfaceId) || s.render.rendererFamily !== C.rendererFamily || s.render.animationId !== C.animationId) add('playback', 'actual-current-renderer-not-ready');
    }
    if (!Array.isArray(cell.flows) || cell.flows.some(f => !object(f))) add('integrity', 'complete-flow-records-required');
    const flows = rows(cell.flows).filter(object);
    const span = flow => {const a = at(flow.before), b = at(flow.after); if (!a || !b || a.sequence >= b.sequence || a.atMs >= b.atMs) {add('integrity', 'flow-order-invalid'); return null;} return [a, b];};
    const trusted = (flow, a, b, types, key) => Array.isArray(flow.eventSequences) && flow.eventSequences.length > 0 && types.every(type => flow.eventSequences.some(seq => {
      const e = events.find(v => v.sequence === seq); return e && e.type === type && e.trusted === true && e.forced === false && e.synthetic === false &&
        (!type.startsWith('pointer') || e.pointerType === (config.touch ? 'touch' : 'mouse')) && (!key || !type.startsWith('key') || e.key === key) && e.playerId === owner(a) && e.atMs >= a.atMs && e.atMs <= b.atMs;
    }));
    const natural = flows.filter(f => f.kind === 'natural-playback');
    if (!natural.length) add('playback', 'natural-playback-not-run', 'not-run');
    for (const f of natural) {
      const range = span(f); if (!range) continue; const [a, b] = range;
      if (!sameOwner(a, b) || !stateMatches(a, C.terminal?.initialState) || !stateMatches(b, C.terminal?.expectedState) || b.source?.frameDomain !== C.terminal?.frameDomain || b.source?.frame !== C.terminal?.frame) add('playback', 'source-terminal-or-initial-state-mismatch');
      if (!positive(C.terminal?.minimumDurationMs) || b.atMs - a.atMs < C.terminal.minimumDurationMs ||
          (C.terminal?.kind === 'static' ? b.source?.tick !== a.source?.tick : b.source?.tick <= a.source?.tick)) add('playback', 'natural-duration-or-source-ticks-missing');
      if (C.terminal?.kind !== 'static') {
        let publicStart = false;
        if (f.startKind === 'replay') {
          const replay = flows.find(r => r.kind === 'replay' && r.before === f.replayFlowBefore && r.after === f.replayFlowAfter);
          const old = replay && byId.get(replay.before), initial = replay && byId.get(replay.after);
          publicStart = Boolean(replay && old && initial && f.before === replay.after &&
            sameOwner(initial, a) && replayOwnerChanged(old, a) &&
            stateMatches(initial, C.terminal?.initialState) && same(f.eventSequences, replay.eventSequences) &&
            retiredOwner(replay.retired, old) &&
            (trusted(replay, old, initial, ['click']) || trusted(replay, old, initial, ['keydown'])) &&
            replay.eventSequences.some(seq => {const e = events.find(e => e.sequence === seq); return (e?.action ?? e?.control) === 'replay' &&
              (e.type === 'click' || e.type === 'keydown' && ['Enter', ' ', 'Space'].includes(e.key));}));
        } else if (f.startKind === 'normal-entry' && C.terminal?.startPolicy === 'normal-course-entry-or-play') {
          const entry = cell.entry, nav = entry?.navigation;
          const entryBytes = read(cell.entryPin);
          const match = /^shared-([a-z0-9]+)-l(\d{2})-p\d{3}$/.exec(C.animationId);
          let routeMatches = false;
          try {const url = new URL(entry?.committedUrl); routeMatches = url.protocol === 'http:' && ['127.0.0.1','localhost','[::1]'].includes(url.hostname) &&
            !url.username && !url.password && !url.search && !url.hash && url.pathname === `/${config.locale}/migration-status/g678-course/${match?.[1]}/${Number(match?.[2])}`;} catch {}
          let entryBound = false; try {entryBound = Boolean(entryBytes && same(JSON.parse(entryBytes), entry));} catch {}
          publicStart = Boolean(entryBound && routeMatches && entry.requestedUrl === entry.committedUrl && entry.responseStatus === 200 &&
            nav?.name === entry.committedUrl && nav.type === 'navigate' && nav.startTime === 0 && positive(nav.responseEnd) && nav.responseEnd <= a.atMs &&
            entry.sourceActionsCalled === false && entry.sourceStateWritten === false && a.identity.replay === 0 && a.host?.paused === false &&
            Array.isArray(f.eventSequences) && f.eventSequences.length === 0);
        } else if (f.startKind === 'play') {
          publicStart = (trusted(f, a, b, ['click']) || trusted(f, a, b, ['keydown'])) &&
            f.eventSequences.some(seq => {const e = events.find(e => e.sequence === seq); return (e?.action ?? e?.control) === 'play' &&
              (e.type === 'click' || e.type === 'keydown' && ['Enter', ' ', 'Space'].includes(e.key)) &&
              e.playerId === owner(a) && e.trusted === true && e.forced === false && e.synthetic === false && e.atMs >= a.atMs && e.atMs <= b.atMs;});
        }
        if (!publicStart) add('playback', 'trusted-public-start-required');
      }
      if (events.some(e => e.atMs >= a.atMs && e.atMs <= b.atMs && (['seek', 'capture', 'set-state', 'synthetic-tick'].includes(e.type) || e.synthetic === true || e.forced === true))) add('playback', 'seek-or-synthetic-completion');
      const middle = samples.filter(s => s.sequence > a.sequence && s.sequence < b.sequence && sameOwner(a, s));
      if (C.terminal?.kind !== 'static' && !middle.some(s => s.source?.tick > a.source?.tick && s.source?.tick < b.source?.tick)) add('playback', 'natural-intermediate-state-missing');
    }
    const branchRanges = new Map();
    for (const branch of rows(C.interactions?.cases).filter(object)) for (const variant of inputVariants.length ? inputVariants.filter(object) : [{id: null, inputTypes: branch.inputTypes}]) {
      const found = flows.filter(f => f.kind === 'interaction' && f.caseId === branch.id && (variant.id === null || f.variantId === variant.id));
      if (!found.length) {add('interactions', 'required-branch-not-run', 'not-run', variant.id ? `${branch.id}/${variant.id}` : branch.id); continue;}
      for (const f of found) {
        const range = span(f); if (!range) continue; const [a, b] = range;
        const key = `${branch.id}:${f.before}:${f.after}`;
        if (branchRanges.has(key) && branchRanges.get(key) !== variant.id) add('interactions', 'input-variants-reuse-one-outcome', 'fail', branch.id);
        branchRanges.set(key, variant.id);
        if (!sameOwner(a, b) || !stateMatches(b, branch.expectedState) || (branch.beforeState && !stateMatches(a, branch.beforeState))) add('interactions', 'source-branch-outcome-mismatch', 'fail', branch.id);
        if (!trusted(f, a, b, rows(variant.inputTypes), variant.key)) add('interactions', 'trusted-branch-input-missing', 'fail', branch.id);
      }
    }
    const replays = flows.filter(f => f.kind === 'replay');
    if (!replays.length) add('playback', 'replay-not-run', 'not-run');
    for (const f of replays) {
      const range = span(f); if (!range) continue; const [a, b] = range;
      if (!trusted(f, a, b, ['click']) && !trusted(f, a, b, ['keydown'])) add('playback', 'trusted-replay-required');
      const sourceReplay = a.identity?.ownerKind === 'source-vm';
      const freshReplay = sourceReplay ? rows(f.eventSequences).some(sequence => sourceVmReplayCause({before:a,after:b,
        event:events.find(event => event.sequence === sequence),retired:f.retired,initialState:C.terminal?.initialState}))
        : replayOwnerChanged(a,b) && stateMatches(b,C.terminal?.initialState);
      if (!freshReplay) add('playback', 'replay-did-not-reset-with-fresh-owner');
      if (!retiredOwner(f.retired, a)) add('playback', 'replay-old-owner-not-retired');
      if (!natural.some(n => owner(byId.get(n.before)) === owner(b) && n.before >= b.sequence)) add('playback', 'fresh-replay-natural-playback-not-run', 'not-run');
    }
    if (hostControls.includes('pause') || hostControls.includes('play')) {
      let htmlMedia;
      if (cell.htmlMedia) {
        const bytes = read(cell.htmlMedia);
        if (bytes) try {htmlMedia = JSON.parse(bytes.toString());} catch {add('integrity', 'html-media-observations-invalid-json');}
      }
      const pauseCues = rows(C.audio?.cues).filter(c => c.locale === cell.languages?.audio && c.transport === 'html-media');
      const pauses = flows.filter(f => f.kind === 'pause-resume');
      if (!pauses.length) add('interactions', 'public-pause-resume-not-run', 'not-run');
      for (const f of pauses) {
        const a = at(f.before), p = at(f.paused), h = at(f.held), r = at(f.resumed); if (!a || !p || !h || !r) continue;
        if (!(a.sequence < p.sequence && p.sequence < h.sequence && h.sequence < r.sequence) || !sameOwner(a, p) || !sameOwner(a, h) || !sameOwner(a, r) ||
            p.host?.paused !== true || h.host?.paused !== true || r.host?.paused !== false || h.atMs - p.atMs < 200 ||
            p.source?.tick !== h.source?.tick || p.source?.frame !== h.source?.frame || r.source?.tick <= h.source?.tick ||
            !trusted(f, a, p, ['click']) && !trusted(f, a, p, ['keydown']) || !trusted(f, h, r, ['click']) && !trusted(f, h, r, ['keydown'])) add('interactions', 'public-pause-resume-state-failed');
        if (audioKnown) for (const issue of assessPausedOwnedAudio({paused:p, held:h, htmlMedia,
          htmlRequired:pauseCues.length > 0, documentId:d.documentId,
          sourceUrls:pauseCues.map(c => c.sourceUrl).filter(text), sampleRate:pauseCues[0]?.sampleRate ?? 48000}).issues) add('audio', issue.code, issue.status);
      }
    }
    for (const action of ['next', 'previous'].filter(a => hostControls.includes(a))) {
      const checks = rows(cell.navigationChecks).filter(n => n?.action === action);
      if (!checks.length) {add('interactions', 'public-navigation-not-run', 'not-run', action); continue;}
      for (const n of checks) {
        const a = at(n.before), e = events.find(e => e.sequence === n.eventSequence); if (!a) continue;
        const destination = C.navigation?.[action]?.animationId;
        if (!text(destination) || n.actualDestinationAnimationId !== destination || n.renderer?.animationId !== destination || n.renderer?.status !== 'ready' || !text(n.renderer?.surfaceId) ||
            !e || !['click', 'keydown'].includes(e.type) || e.action !== action || e.trusted !== true || e.forced !== false || e.synthetic !== false || e.playerId !== owner(a) ||
            e.atMs < a.atMs || !number(n.observedAtMs) || n.observedAtMs < e.atMs) add('interactions', 'navigation-destination-or-trusted-input-failed', 'fail', action);
        if (!retiredOwner(n.retired, a)) add('interactions', 'navigation-old-owner-not-retired', 'fail', action);
        if (n.screenshot?.scope !== 'stage' || n.screenshot?.surfaceId !== n.renderer?.surfaceId) add('interactions', 'navigation-destination-image-missing', 'not-run', action);
        else {const bytes = read(n.screenshot.pin); if (bytes) try {const facts = imageFacts(bytes); if (facts.distinctColors < 2 || facts.nonBackgroundPixels < 4) add('interactions', 'navigation-destination-blank', 'fail', action);} catch {add('interactions', 'navigation-destination-image-invalid');}}
      }
    }
    const retirements = [
      ...replays.map(f => ({playerId: owner(byId.get(f.before)), atMs: byId.get(f.after)?.atMs, sourceNodeIds: f.retired?.sourceNodeIds})),
      ...rows(cell.navigationChecks).filter(object).map(n => ({playerId: n.retired?.playerId, atMs: n.observedAtMs, sourceNodeIds: n.retired?.sourceNodeIds})),
    ].filter(r => text(r.playerId) && number(r.atMs));
    for (const retired of retirements) if (samples.some(s => owner(s) === retired.playerId && s.atMs > retired.atMs) ||
        events.some(e => e.playerId === retired.playerId && e.atMs > retired.atMs && e.trusted === true)) add('integrity', 'retired-owner-observed-as-current');
    const language = cell.languages;
    for (const channel of ['visual', 'audio']) {
      const actual = language?.[channel];
      if (actual === config.locale || (channel === 'audio' && C.audio?.status === 'not-required' && actual === null)) continue;
      if (config.locale === 'es' && actual === 'en' && fallback?.locale === 'es' && rows(fallback.channels).includes(channel) && pinValid(fallback.authorizationPin)) localeGaps.push({cellId, locale: 'es', channel, actualLanguage: 'en', status: 'authorized-english-fallback', authorizationPin: fallback.authorizationPin});
      else add(channel === 'audio' ? 'audio' : 'integrity', 'language-mismatch-or-unapproved-fallback');
    }
    if (!Array.isArray(cell.mediaChecks)) add('audio', 'media-observation-records-required', 'not-run');
    if (C.audio?.status === 'not-required' && rows(cell.mediaChecks).length) add('audio', 'unexpected-audio-on-source-silent-page');
    if (audioKnown) {
      const cueLocale = language?.audio, cues = rows(C.audio.cues).filter(c => c?.locale === cueLocale);
      const audioFlows = cue => cue.triggerCaseId ? flows.filter(f => f.kind === 'interaction' && f.caseId === cue.triggerCaseId) : natural;
      if (!cues.length) add('audio', 'requested-locale-audio-inventory-missing', 'unsupported');
      for (const m of rows(cell.mediaChecks)) {
        const cue = cues.find(c => c.id === m?.cueId && samePin(c.source, m?.source));
        if (!object(m) || !cue || !audioFlows(cue).some(n => {
          const a = byId.get(n.before), b = byId.get(n.after); return a && b && m.playerId === owner(a) && m.replay === a.identity.replay && number(m.startMs) && number(m.endMs) && m.startMs >= a.atMs && m.endMs <= b.atMs;
        })) add('audio', 'unbound-stale-or-outside-playback-audio');
      }
      for (const cue of cues) for (const n of audioFlows(cue)) {
        const a = byId.get(n.before), b = byId.get(n.after); if (!a || !b) continue;
        const windows = rows(cell.mediaChecks).filter(m => m?.cueId === cue.id && m.playerId === owner(a) && m.replay === a.identity.replay && m.startMs >= a.atMs && m.endMs <= b.atMs);
        if (!windows.length) {add('audio', 'actual-output-window-not-recorded', 'not-run', `${cue.id}/replay-${a.identity.replay}`); continue;}
        for (const m of windows) {
          if (a.identity.ownerKind === 'surface-run' && (!Array.isArray(m.sourceNodeIds) || !m.sourceNodeIds.length || !unique(m.sourceNodeIds) || m.sourceNodeIds.some(id => !text(id)) ||
              retirements.some(r => r.atMs <= m.startMs && rows(r.sourceNodeIds).some(id => m.sourceNodeIds.includes(id))))) add('audio', 'native-replay-audio-source-node-ownership-missing-or-stale');
          if (!samePin(m.source, cue.source) || !pinValid(m.capture)) add('audio', 'audio-source-or-capture-binding-mismatch'); else read(m.capture);
          if (!number(m.startMs) || !number(m.endMs) || m.endMs - m.startMs < cue.minimumDurationMs || !positive(m.sampleRate) || !positive(m.sampleCount) || !positive(m.channels) ||
              m.sampleCount / m.sampleRate * 1000 < cue.minimumDurationMs || Math.abs(m.sampleCount / m.sampleRate * 1000 - (m.endMs - m.startMs)) > 20 || !number(m.rms) || m.rms <= cue.minimumRms) add('audio', 'audible-duration-samples-or-rms-insufficient');
          const match = m.match;
          if (!['normalized-cross-correlation', 'aligned-pcm-similarity'].includes(match?.method) || match.sourceSha256 !== cue.source?.sha256 || match.captureSha256 !== m.capture?.sha256 ||
              !number(match.score) || match.score < cue.matchThreshold || match.score > 1 || !positive(match.comparedSamples) || match.comparedSamples > m.sampleCount ||
              match.comparedSamples / m.sampleRate * 1000 < cue.minimumDurationMs || !number(match.lagMs)) add('audio', 'actual-output-source-match-missing-or-insufficient');
          if (cue.sourcePCM && !same(match?.sourceWindow, {pcmSha256: cue.sourcePCM.sha256, firstDecodedSample: cue.sourceFirstDecodedSample,
              endDecodedSample: cue.sourceEndDecodedSample, sampleRate: cue.sampleRate, channels: cue.channels})) add('audio', 'source-pcm-subrange-mismatch');
          if (!text(m.analysis?.tool) || !pinValid(m.analysis?.report)) add('audio', 'retained-audio-analysis-required');
          else {const bytes = read(m.analysis.report); try {const report = bytes && JSON.parse(bytes); if (!report || !same(report, {capture: m.capture, source: m.source, startMs: m.startMs, endMs: m.endMs, sampleRate: m.sampleRate, sampleCount: m.sampleCount, channels: m.channels, rms: m.rms, match: m.match})) add('audio', 'audio-analysis-report-mismatch');} catch {add('audio', 'audio-analysis-report-invalid');}}
        }
      }
      for (const window of rows(C.audio.expectedSilentWindows)) for (const n of natural) {
        const a = byId.get(n.before), b = byId.get(n.after); if (!a || !b || !object(window)) continue;
        const candidates = rows(cell.silenceChecks).filter(m => m?.windowId === window.id && m.playerId === owner(a) && m.replay === a.identity.replay);
        if (!candidates.length) {add('audio', 'required-silence-window-not-recorded', 'not-run', window.id); continue;}
        for (const m of candidates) {
          const durationMs = (window.endPlaybackSeconds - window.startPlaybackSeconds) * 1000;
          if (!pinValid(m.capture)) add('audio', 'nonempty-silence-capture-required'); else read(m.capture);
          if (!samePin(m.source, C.source) || m.sourcePlaybackStartSeconds !== window.startPlaybackSeconds || m.sourcePlaybackEndSeconds !== window.endPlaybackSeconds ||
              !number(m.startMs) || !number(m.endMs) || m.startMs < a.atMs || m.endMs > b.atMs || m.endMs - m.startMs + 0.001 < durationMs ||
              !positive(m.sampleRate) || !positive(m.sampleCount) || !positive(m.channels) || m.sampleCount / m.sampleRate * 1000 + 0.001 < durationMs ||
              Math.abs(m.sampleCount / m.sampleRate * 1000 - (m.endMs - m.startMs)) > 20 || !number(m.rms) || m.rms < 0 || m.rms > window.maximumRms) add('audio', 'source-silence-output-window-failed');
          if (!text(m.analysis?.tool) || !pinValid(m.analysis?.report)) add('audio', 'retained-silence-analysis-required');
          else {const bytes = read(m.analysis.report); try {const report = bytes && JSON.parse(bytes), {windowId, playerId, replay, analysis, ...expectedReport} = m;
              if (!same(report, expectedReport)) add('audio', 'silence-analysis-report-mismatch');} catch {add('audio', 'silence-analysis-report-invalid');}}
        }
      }
    }
    const screenshots = Array.isArray(cell.screenshots) ? cell.screenshots : [];
    for (const assertion of rows(C.contentAssertions).filter(object)) {
      const checks = rows(cell.contentChecks).filter(c => c?.assertionId === assertion.id && c.stateId === assertion.stateId && c.selector === assertion.selector);
      if (!checks.length) {add('layout', 'required-source-content-not-observed', 'not-run', assertion.id); continue;}
      for (const check of checks) {
        const sample = at(check.sampleSequence);
        checkContent(assertion, check, sample, add);
        if (!rows(cell.layoutChecks).some(l => l?.stateId === assertion.stateId && l.sampleSequence === check.sampleSequence)) add('layout', 'source-content-not-bound-to-state-layout', 'fail', assertion.id);
      }
    }
    for (const stateId of rows(stateIds)) {
      const layouts = rows(cell.layoutChecks).filter(l => l?.stateId === stateId);
      if (!layouts.length) {add('layout', 'required-state-layout-not-run', 'not-run', stateId); continue;}
      const coveredTargets = new Set(), firstLayoutSample = byId.get(layouts[0]?.sampleSequence);
      const stateTargets = C.layout?.targetIdsByState?.[stateId] ?? targetIds;
      if (!Array.isArray(stateTargets) || !stateTargets.length || !unique(stateTargets) || stateTargets.some(id => !text(id))) add('layout', 'state-layout-target-contract-invalid', 'unsupported', stateId);
      for (const l of layouts) {
        const s = at(l.sampleSequence);
        const predicate = statePredicate(C, stateId);
        if (!stateMapValid(predicate)) add('layout', 'layout-state-predicate-unsupported', 'unsupported', stateId);
        else if (!stateMatches(s, predicate)) add('layout', 'layout-labelled-state-mismatch', 'fail', stateId);
        if (firstLayoutSample && s && !sameOwner(firstLayoutSample, s)) add('layout', 'scroll-layout-reset-page-owner', 'fail', stateId);
        const documentStatus = documentLayoutStatus(l, config);
        if (!s || documentStatus !== 'pass') add('layout', 'document-overflow-or-unmeasured-layout', !s ? 'fail' : documentStatus);
        if (!rows(l.targets).length) add('layout', 'layout-target-observations-missing', 'not-run', stateId);
        for (const target of rows(l.targets)) {
          if (!rows(stateTargets).includes(target?.id) || !reachable(target, {...config, width: l.rootClientWidth})) add('layout', 'target-unreachable-clipped-or-obscured', 'fail', `${stateId}/${target?.id}`);
          else coveredTargets.add(target.id);
        }
        const shots = screenshots.filter(p => p.stateId === stateId && p.sampleSequence === l.sampleSequence &&
          (p.scope === 'stage' && p.surfaceId === s?.render?.surfaceId || p.scope === 'target' && rows(l.targets).some(t => t.id === p.targetId)));
        if (!shots.length) add('layout', 'actual-state-stage-image-missing', 'not-run', stateId);
        for (const shot of shots) {const bytes = read(shot.pin); if (!bytes) continue; try {inspectStatePixels(imageFacts(bytes), s, stateId, shot.scope, add, 'playback', 'stage-image-blank-or-insufficient');} catch {add('playback', 'stage-image-not-decodable-png');}}
      }
      for (const id of rows(stateTargets)) if (!coveredTargets.has(id)) add('layout', 'state-target-coverage-incomplete', 'not-run', `${stateId}/${id}`);
      for (const group of rows(C.layout?.simultaneousGroups?.[stateId])) if (!Array.isArray(group) || !group.length || !layouts.some(l => group.every(id => rows(l.targets).some(t => t.id === id && reachable(t, {...config, width: l.rootClientWidth}))))) add('layout', 'source-relation-group-not-simultaneously-visible', 'not-run', stateId);
      if ((C.layout?.stageStateIds ?? ['initial', 'terminal']).includes(stateId) && !screenshots.some(p => p.stateId === stateId && p.scope === 'stage' && layouts.some(l => l.sampleSequence === p.sampleSequence && p.surfaceId === byId.get(l.sampleSequence)?.render?.surfaceId))) add('playback', 'required-stage-state-image-missing', 'not-run', stateId);
    }
    const own = issues.slice(beforeIssues), global = globalIssues;
    cellResults.push({cellId, status: outcome([...global, ...own]), gates: Object.fromEntries(GATES.map(g => [g, outcome([...global, ...own].filter(i => i.gate === g))]))});
  }
  const supplementResults = [];
  for (const locale of ['en', 'es']) for (const stateId of rows(stateIds)) for (const id of REQUIRED_SUPPLEMENT_IDS) {
    const start = issues.length, label = `${locale}/${stateId}/${id}`, add = (gate, code, status = 'fail', detail) => issue(gate, code, status, detail ?? label);
    let matches = rows(raw?.supplements).filter(s => s?.id === id && s.locale === locale && s.stateId === stateId);
    if (!matches.length) {add('layout', 'required-supplement-not-run', 'not-run'); supplementResults.push({locale, stateId, id, status: 'not-run'}); continue;}
    for (let s of matches) {
      if (s.reuse) {const bytes = read(s.reuse.recordPin); try {s = bytes && JSON.parse(bytes);} catch {s = null;}}
      if (!object(s) || s.kind !== 'g678-supplement-observation-v1' || s.id !== id || s.locale !== locale || s.stateId !== stateId || s.animationId !== C.animationId ||
          !samePin(s.contractPin, contractPin) || !pinsEqual(s.inputPins, C.inputPins)) {add('integrity', 'supplement-claim-or-input-binding-mismatch'); continue;}
      const a = s.before, b = s.after, v = b?.viewport;
      if (!sameOwner(a, b) || a?.identity?.animationId !== C.animationId || b?.identity?.animationId !== C.animationId || a?.identity?.sourceSha256 !== C.source?.sha256 || b?.identity?.sourceSha256 !== C.source?.sha256 ||
          !stateMatches(a, statePredicate(C, stateId)) || !stateMatches(b, statePredicate(C, stateId)) || !number(a?.atMs) || !number(b?.atMs) || b.atMs <= a.atMs ||
          a.source?.frame !== b.source?.frame || a.source?.frameDomain !== b.source?.frameDomain || (a.identity?.ownerKind === 'source-vm' && a.source?.tick !== b.source?.tick)) add('playback', 'supplement-source-continuity-failed');
      for (const sample of [a, b]) if (!sample || sample.render?.status !== 'ready' || sample.render?.animationId !== C.animationId || sample.render?.rendererFamily !== C.rendererFamily ||
          sample.observer?.sourceActionsCalled !== false || sample.observer?.sourceStateWritten !== false || sample.observer?.syntheticInput !== false ||
          sample.source?.observedFrom !== (sample.identity?.ownerKind === 'surface-run' ? 'renderer-state' : 'source-runtime') || sample.source?.tickKind !== (sample.identity?.ownerKind === 'surface-run' ? 'observed-committed-paint' : 'source-tick') ||
          !Array.isArray(sample.source?.errors) || sample.source.errors.length || !Array.isArray(sample.source?.missing) || sample.source.missing.length) add('integrity', 'supplement-real-renderer-or-passive-observation-missing');
      if (!object(v) || v.locale !== locale || !positive(v.width) || !positive(v.height) || !positive(v.rootFontPx) || !positive(v.dpr) || typeof v.touch !== 'boolean' || typeof v.reducedMotion !== 'boolean') add('layout', 'supplement-actual-configuration-required');
      if (a?.media?.runningOwnedOutputs !== 0 || b?.media?.runningOwnedOutputs !== 0 || !Array.isArray(a?.media?.sourceNodeIds) || !same(a.media.sourceNodeIds, b?.media?.sourceNodeIds)) add('audio', 'supplement-media-continuity-failed');
      const width = /^viewport-(\d+)$/u.exec(id), dpr = /^dpr-(\d+)$/u.exec(id);
      if (width && v?.width !== Number(width[1]) || dpr && v?.dpr !== Number(dpr[1]) || id === 'text-200-percent' && !(a?.viewport?.rootFontPx === 16 && v?.rootFontPx === 32) ||
          id === 'rotation' && !(a?.viewport?.width === v?.height && a?.viewport?.height === v?.width && v?.width !== v?.height) ||
          id === 'sidebar' && !(a?.dom?.sidebarExpanded === false && b?.dom?.sidebarExpanded === true) ||
          id === 'reduced-motion' && !(a?.viewport?.reducedMotion === false && v?.reducedMotion === true)) add('layout', 'supplement-required-transition-missing');
      if (id === 'font-loading' || id === 'font-fallback') {
        const targets = C.layout?.fontTargetIds;
        if (!Array.isArray(targets) || !targets.length) add('layout', 'page-font-target-contract-unsupported', 'unsupported');
        for (const targetId of rows(targets)) {
          const f = rows(s.fontObservations).find(f => f?.targetId === targetId);
          if (!f || !positive(f.glyphCount) || !Array.isArray(f.familyNames) || !f.familyNames.length || f.familyNames.some(n => !text(n)) || !text(f.visibleText)) add('layout', 'actual-page-font-observation-missing');
        }
        if (id === 'font-loading' && (!rows(s.pendingFontRequests).length || !rows(s.pendingFontRequests).every(url => text(url) && rows(s.loadedFontRequests).includes(url)))) add('layout', 'font-load-transition-unobserved');
        if (id === 'font-fallback' && (!rows(s.failedFontRequests).length || rows(s.failedFontRequests).some(url => !text(url)))) add('layout', 'font-fallback-transition-unobserved');
      }
      for (const key of LOG_KEYS) if (!Array.isArray(s[key]) || s[key].length) add('integrity', 'supplement-logs-missing-or-nonempty');
      const logBytes = read(s.logPin); if (logBytes) try {if (!same(JSON.parse(logBytes), Object.fromEntries(LOG_KEYS.map(k => [k, s[k]])))) add('integrity', 'supplement-log-binding-mismatch');} catch {add('integrity', 'supplement-log-json-invalid');}
      const targets = C.layout?.targetIdsByState?.[stateId] ?? targetIds, covered = new Set();
      for (const l of rows(s.layoutChecks)) {
        if (!sameOwner(l.sample, b) || !stateMatches(l.sample, statePredicate(C, stateId)) || !same(l.sample?.viewport, v)) add('layout', 'supplement-scrolled-layout-state-unbound');
        const documentStatus = documentLayoutStatus(l, v);
        if (documentStatus !== 'pass') add('layout', 'supplement-document-overflow', documentStatus);
        for (const target of rows(l.targets)) {if (!rows(targets).includes(target?.id) || !reachable(target, {...v, width: l.rootClientWidth})) add('layout', 'supplement-target-clipped-or-obscured'); else covered.add(target.id);}
      }
      for (const assertion of rows(C.contentAssertions).filter(c => c?.stateId === stateId)) {
        const content = rows(s.contentChecks).find(c => c?.assertionId === assertion.id && c.selector === assertion.selector);
        const sample = rows(s.layoutChecks).find(l => l.sample?.sequence === content?.sampleSequence)?.sample;
        if (!content || !sample) add('layout', 'supplement-source-content-missing-or-unbound');
        else checkContent(assertion, content, sample, add);
      }
      for (const targetId of rows(targets)) if (!covered.has(targetId)) add('layout', 'supplement-page-target-not-observed', 'not-run', `${label}/${targetId}`);
      if (!rows(s.screenshots).length) add('layout', 'supplement-page-image-missing', 'not-run');
      for (const shot of rows(s.screenshots)) {
        if (!rows(s.layoutChecks).some(l => l.sample?.sequence === shot?.sampleSequence && (shot.scope === 'stage' && shot.surfaceId === b?.render?.surfaceId || shot.scope === 'target' && rows(l.targets).some(t => t.id === shot.targetId)))) add('layout', 'supplement-image-state-or-scope-unbound');
        const bytes = read(shot?.pin); if (bytes) try {const sample = rows(s.layoutChecks).find(l => l.sample?.sequence === shot?.sampleSequence)?.sample;
          inspectStatePixels(imageFacts(bytes), sample, stateId, shot.scope, add, 'layout', 'supplement-page-image-blank');} catch {add('layout', 'supplement-page-image-invalid');}
      }
    }
    supplementResults.push({locale, stateId, id, status: outcome(issues.slice(start))});
  }
  const status = outcome(issues);
  return {kind: 'g678-full-technical-assessment-v1', animationId: C.animationId ?? null, status, passed: status === 'pass',
    gates: Object.fromEntries(GATES.map(g => [g, outcome(issues.filter(i => i.gate === g))])), cellResults, supplementResults, localeGaps, issues,
    acceptanceEffects: {registration: false, originalFlashFidelity: false, humanListening: false, ownerAcceptance: false, publication: false}};
}

/** Reassess raw pages; never aggregate caller-supplied passed/status summaries. */
export function assessCatalog({expectedAnimationIds, pages, root} = {}) {
  const issues = [], results = [];
  if (!Array.isArray(expectedAnimationIds) || !expectedAnimationIds.length || !unique(expectedAnimationIds)) issues.push('Exact nonempty unique catalog denominator required');
  if (!Array.isArray(pages)) issues.push('Page contract/raw records required');
  const ids = rows(pages).map(p => p?.contract?.animationId);
  if (!unique(ids)) issues.push('Duplicate placement records');
  for (const id of ids) if (!rows(expectedAnimationIds).includes(id)) issues.push(`Unexpected placement: ${id}`);
  for (const id of rows(expectedAnimationIds)) {
    const entry = rows(pages).find(p => p?.contract?.animationId === id);
    if (!entry) {results.push({animationId: id, status: 'not-run', passed: false}); continue;}
    results.push(assessPage({...entry, root}));
  }
  const counts = Object.fromEntries(['pass', 'fail', 'not-run', 'unsupported'].map(status => [status, results.filter(r => r.status === status).length]));
  const passed = issues.length === 0 && results.length === expectedAnimationIds?.length && counts.pass === results.length && results.length > 0;
  return {kind: 'g678-full-technical-catalog-assessment-v1', status: passed ? 'pass' : 'fail', passed, exitCode: passed ? 0 : 1,
    expected: expectedAnimationIds?.length ?? 0, counts, issues, results, localeGaps: results.flatMap(r => r.localeGaps ?? [])};
}
