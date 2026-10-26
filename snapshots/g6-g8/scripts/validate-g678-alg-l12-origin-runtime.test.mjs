import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {validateOriginRuntime} from './validate-g678-alg-l12-origin-runtime.mjs';

const runtime = readFileSync(new URL('../migrations/shared-alg001-l12-p011/candidate-v2/canvas-renderer.js', import.meta.url), 'utf8');
test('final Origin artifact retains the exact two-canvas DOM inventory', () => {
  validateOriginRuntime(runtime);
  for (const suffix of ['document.body;', 'document.cookie;', 'document.createElement("img");', 'document.createElement("canvas");']) {
    assert.throws(() => validateOriginRuntime(runtime + suffix));
  }
});
test('final Origin artifact rejects every shared forbidden primitive family', () => {
  for (const suffix of ['eval("")', 'Function("")', 'setTimeout(f)', 'requestAnimationFrame(f)',
    'fetch("")', 'new XMLHttpRequest()', 'new WebSocket()', 'new EventSource()', 'sendBeacon("")',
    'new Worker()', 'new SharedWorker()', 'localStorage', 'sessionStorage', 'indexedDB',
    'location.href', 'postMessage("")', 'open("")', 'import("")',
    'addEventListener("x",f)', 'removeEventListener("x",f)']) {
    assert.throws(() => validateOriginRuntime(runtime + suffix), suffix);
  }
});
