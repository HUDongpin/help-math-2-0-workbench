import assert from 'node:assert/strict';
import {Script} from 'node:vm';

// Page-specific final-artifact guard: the shared FFDec adapter permits one
// mask canvas; Origin adds precisely one fresh drawing surface for Replay.
export function validateOriginRuntime(runtime) {
  const members = [...new Set([...runtime.matchAll(/document\.([A-Za-z_$][A-Za-z0-9_$]*)/g)].map(match => match[1]))];
  assert.deepEqual(members, ['createElement'], 'blocked document member');
  const elements = [...runtime.matchAll(/document\.createElement\("([a-z]+)"\)/g)].map(match => match[1]);
  assert.deepEqual(elements, ['canvas', 'canvas'], 'exact two-canvas construction allowlist');
  assert.equal((runtime.match(/document\.createElement/g) || []).length, 2, 'unrecognized construction');
  const blocked = [
    /\beval\s*\(/, /\bFunction\s*\(/,
    /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/,
    /\b(?:Worker|SharedWorker)\s*\(/,
    /\b(?:localStorage|sessionStorage|indexedDB)\b/,
    /\b(?:location|postMessage|open)\s*(?:\.|\()/,
    /\bimport\s*\(/, /document\.body/,
    /\b(?:addEventListener|removeEventListener)\s*\(/,
  ];
  for (const pattern of blocked) assert(!pattern.test(runtime), `blocked runtime primitive: ${pattern}`);
  new Script(runtime, {filename: 'shared-alg001-l12-p011-canvas-renderer.js'});
}
