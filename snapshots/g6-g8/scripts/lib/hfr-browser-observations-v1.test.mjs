import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {observeCssomOpacity, qualifyCssomOpacity, afterTwoAnimationFrames, observeActiveFocus,
  observeOriginalFocus, webAudioContexts, currentReplayAudioContext} from './hfr-browser-observations-v1.mjs';

// Exact problematic values retained from the qualified P007 Chrome 155 readback.
const sourceValues = [0.5703125, 0.6015625, 1];
const expectedMapping = {'0.5703125': 0.570312, '0.6015625': 0.601562, '1': 1};
const rows = sourceValues.map(sourceOpacity => ({sourceOpacity,
  specified: String(expectedMapping[sourceOpacity]), computed: String(expectedMapping[sourceOpacity]),
  serializedReadback: expectedMapping[sourceOpacity], originalToFixed6: Number(sourceOpacity.toFixed(6))}));
const qualification = () => ({browserVersion: '155.0.8059.39', expectedBrowserVersion: '155.0.8059.39',
  sourceValues, expectedMapping, rows: structuredClone(rows)});
const inBrowser = (fn, globals, argument) => vm.runInNewContext(`(${fn.toString()})(argument)`, {...globals, argument});

test('CSSOM qualification fixes the two rounding false negatives without an epsilon', () => {
  assert.equal(Number(sourceValues[0].toFixed(6)), 0.570313);
  assert.equal(Number(sourceValues[1].toFixed(6)), 0.601563);
  assert.notEqual(Number(sourceValues[0].toFixed(6)), rows[0].serializedReadback);
  const result = qualifyCssomOpacity(qualification());
  assert.deepEqual(result.mapping, expectedMapping);
  assert.equal(result.tolerance, 0);
  assert.deepEqual(sourceValues, [0.5703125, 0.6015625, 1]);
});

test('CSSOM qualification rejects browser drift, source drift, holes, duplicates and altered serialization', () => {
  for (const mutate of [
    value => { value.browserVersion = '155.0.8059.40'; },
    value => { value.sourceValues = [0.570312, 0.6015625, 1]; },
    value => { value.rows.pop(); },
    value => { value.rows[1] = {...value.rows[0]}; },
    value => { value.rows[0].computed = '0.570313'; },
    value => { value.rows[0].specified = '0.570313'; },
    value => { value.rows[0].serializedReadback = 0.570313; },
    value => { value.expectedMapping = {'0.5703125': 0.570312, '1': 1}; },
    value => { value.expectedMapping = {...expectedMapping, '0.5': 0.5}; },
  ]) {
    const value = qualification(); mutate(value); assert.throws(() => qualifyCssomOpacity(value));
  }
});

function cssDom({fail = false, url = 'about:blank'} = {}) {
  const attached = new Set();
  const document = {createElement() {
    const style = {};
    Object.defineProperty(style, 'opacity', {get() {return this.value;}, set(value) {this.value = String(expectedMapping[value]);}});
    const node = {style, remove() {attached.delete(node);}};
    return node;
  }, body: {append(node) {attached.add(node);}}};
  return {attached, globals: {location: {href: url}, document, getComputedStyle(node) {
    assert(attached.has(node)); if (fail) throw Error('synthetic CSSOM read failure'); return {opacity: node.style.opacity};
  }}};
}

test('serialized CSSOM callback observes an isolated DOM and removes every temporary node', () => {
  const dom = cssDom();
  const observed = JSON.parse(JSON.stringify(inBrowser(observeCssomOpacity, dom.globals, sourceValues)));
  assert.deepEqual(observed, rows);
  assert.equal(dom.attached.size, 0);
  assert.deepEqual(qualifyCssomOpacity({...qualification(), rows: observed}).mapping, expectedMapping);
});

test('CSSOM callback refuses a product page and cleans up after a browser read error', () => {
  const product = cssDom({url: 'http://127.0.0.1:3331/en/migration-status/g678-hfr/example/registered'});
  assert.throws(() => inBrowser(observeCssomOpacity, product.globals, sourceValues), /isolated about:blank/);
  assert.equal(product.attached.size, 0);
  const broken = cssDom({fail: true});
  assert.throws(() => inBrowser(observeCssomOpacity, broken.globals, sourceValues), /synthetic CSSOM/);
  assert.equal(broken.attached.size, 0);
  for (const values of [[], [1, 1], [1, 0], [NaN], [-0.1], [1.1]]) {
    assert.throws(() => inBrowser(observeCssomOpacity, cssDom().globals, values));
  }
});

function focusDom() {
  const document = {activeElement: null, elementFromPoint() {return document.hit;}};
  const element = {tagName: 'BUTTON', isConnected: true, getAttribute() {return 'fraction';},
    closest() {return null;}, matches() {return true;}, contains(other) {return other === this;},
    getBoundingClientRect() {return {left: 20, right: 120, top: 30, bottom: 60};}};
  document.activeElement = element; document.hit = element;
  return {document, element, globals: {document, getComputedStyle() {
    return {outlineStyle: 'solid', outlineWidth: '2px', boxShadow: 'none'};
  }}};
}

test('two real RAF boundaries permit the scheduled Close restoration, without focusing anything', async () => {
  const dom = focusDom(), queue = [];
  dom.document.activeElement = {tagName: 'BODY'};
  const globals = {...dom.globals, requestAnimationFrame(callback) {queue.push(callback);}};
  queue.push(() => {dom.document.activeElement = dom.element;});
  assert.equal(inBrowser(observeOriginalFocus, globals, dom.element), false, 'old immediate check races Close');
  let settled = false;
  const promise = inBrowser(afterTwoAnimationFrames, globals).then(() => {settled = true;});
  for (const callback of queue.splice(0)) callback();
  await Promise.resolve(); assert.equal(settled, false, 'one RAF is not the two-RAF contract');
  assert.equal(inBrowser(observeOriginalFocus, globals, dom.element), true);
  for (const callback of queue.splice(0)) callback();
  await promise; assert.equal(settled, true);
  const observed = inBrowser(observeActiveFocus, globals);
  assert.equal(observed.entry, 'fraction'); assert.equal(observed.focusVisible, true); assert.equal(observed.unobstructed, true);
});

test('waiting does not rescue missing restoration or a same-label replacement node', async () => {
  const dom = focusDom(), queue = [];
  const replacement = {...dom.element}; dom.document.activeElement = replacement;
  const globals = {...dom.globals, requestAnimationFrame(callback) {queue.push(callback);}};
  const promise = inBrowser(afterTwoAnimationFrames, globals);
  for (const callback of queue.splice(0)) callback();
  for (const callback of queue.splice(0)) callback(); await promise;
  assert.equal(inBrowser(observeOriginalFocus, globals, dom.element), false);
  dom.document.activeElement = dom.element; dom.element.isConnected = false;
  assert.equal(inBrowser(observeOriginalFocus, globals, dom.element), false);
});

test('passive focus observation preserves occlusion and focus-visible failures', () => {
  const dom = focusDom(); dom.document.hit = {tagName: 'DIV'};
  dom.element.matches = () => false;
  const observed = inBrowser(observeActiveFocus, dom.globals);
  assert.equal(observed.unobstructed, false); assert.equal(observed.focusVisible, false);
  assert.equal(dom.document.activeElement, dom.element);
});

const contextEvent = (seq, contextId, contextState = 'running', type = 'WebAudio.contextCreated') =>
  ({seq, type, payload: {context: {contextId, contextState}}});
const destroy = (seq, contextId) => ({seq, type: 'WebAudio.contextWillBeDestroyed', payload: {contextId}});

test('Replay binds the new context, while a stale first-running-context lookup is wrong', () => {
  const records = [contextEvent(1, 'first'), destroy(9, 'first'), contextEvent(11, 'replay')];
  assert.equal(records.find(record => record.payload.context?.contextState === 'running').payload.context.contextId, 'first');
  assert.equal(currentReplayAudioContext(records, {seq: 10}).contextId, 'replay');
  assert.deepEqual(webAudioContexts(records).map(context => [context.contextId, context.contextState, context.destroyed]),
    [['first', 'closed', true], ['replay', 'running', false]]);
});

test('Replay refuses old, unbound, overlapping, suspended or destroyed contexts', () => {
  for (const records of [
    [contextEvent(1, 'old'), contextEvent(11, 'old', 'running', 'WebAudio.contextChanged')],
    [contextEvent(11, 'unbound', 'running', 'WebAudio.contextChanged')],
    [contextEvent(1, 'old'), contextEvent(11, 'new')],
    [contextEvent(11, 'new', 'suspended')],
    [contextEvent(11, 'new'), destroy(12, 'new')],
  ]) assert.equal(currentReplayAudioContext(records, {seq: 10}), null);
  assert.throws(() => currentReplayAudioContext([], {seq: '10'}), /Actual Replay/);
});

test('the same Replay context must suspend then resume, without manufacturing a new creation', () => {
  const records = [contextEvent(11, 'replay')], marker = {seq: 10};
  const current = currentReplayAudioContext(records, marker);
  records.push(contextEvent(12, 'replay', 'suspended', 'WebAudio.contextChanged'));
  assert.equal(currentReplayAudioContext(records, marker), null);
  assert.equal(webAudioContexts(records)[0].contextState, 'suspended');
  records.push(contextEvent(13, 'replay', 'running', 'WebAudio.contextChanged'));
  assert.equal(currentReplayAudioContext(records, marker).contextId, current.contextId);
  assert.equal(records.filter(record => record.type === 'WebAudio.contextCreated').length, 1);
});
