import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {validateRealWorldRuntime} from './validate-g678-alg-l12-p002-runtime.mjs';

const source = readFileSync(new URL('../migrations/shared-alg001-l12-p002/candidate/canvas-renderer.js', import.meta.url), 'utf8');
test('P002 final generated composition has only its five audited element sites', () => {
  validateRealWorldRuntime(source);
  for (const suffix of ['document.body;', 'document.cookie;', 'document.createElement("img");', 'document.createElement("canvas");']) {
    assert.throws(() => validateRealWorldRuntime(source + suffix));
  }
});
test('P002 post-injection validator rejects the shared forbidden primitive families', () => {
  for (const suffix of ['eval("")', 'Function("")', 'setTimeout(f)', 'requestAnimationFrame(f)',
    'fetch("")', 'new XMLHttpRequest()', 'new WebSocket()', 'new EventSource()', 'sendBeacon("")',
    'new Worker()', 'new SharedWorker()', 'localStorage', 'sessionStorage', 'indexedDB',
    'location.href', 'postMessage("")', 'open("")', 'import("")',
    'addEventListener("x",f)', 'removeEventListener("x",f)']) {
    assert.throws(() => validateRealWorldRuntime(source + suffix), suffix);
  }
});
