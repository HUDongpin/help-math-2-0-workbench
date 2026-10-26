import assert from 'node:assert/strict';
import {Script} from 'node:vm';

export function validateP004Runtime(runtime) {
  assert.deepEqual([...new Set([...runtime.matchAll(/document\.([\w$]+)/g)].map(m => m[1]))], ['createElement']);
  assert.deepEqual([...runtime.matchAll(/document\.createElement\("([a-z]+)"\)/g)].map(m => m[1]), ['canvas', 'canvas']);
  assert.equal((runtime.match(/document\.createElement/g) || []).length, 2);
  for (const pattern of [
    /\beval\s*\(/, /\bFunction\s*\(/,
    /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB)\b/,
    /\b(?:Worker|SharedWorker)\s*\(/, /\b(?:location|postMessage|open)\s*(?:\.|\()/,
    /\bimport\s*\(/, /document\.body/, /\b(?:addEventListener|removeEventListener)\s*\(/,
  ]) assert(!pattern.test(runtime), `blocked primitive: ${pattern}`);
  new Script(runtime, {filename: 'shared-alg001-l12-p004-canvas-renderer.js'});
}
