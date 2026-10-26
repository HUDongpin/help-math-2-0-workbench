import assert from 'node:assert/strict';
import {Script} from 'node:vm';

export function validateRealWorldRuntime(runtime) {
  const members = [...new Set([...runtime.matchAll(/document\.([A-Za-z_$][A-Za-z0-9_$]*)/g)].map(match => match[1]))];
  assert.deepEqual(members, ['createElement'], 'blocked document member');
  const elements = [...runtime.matchAll(/document\.createElement\("([a-z]+)"\)/g)].map(match => match[1]);
  assert.deepEqual(elements, ['canvas', 'img', 'img', 'img', 'canvas'], 'exact mask, three embedded images and fresh surface');
  assert.equal((runtime.match(/document\.createElement/g) || []).length, 5, 'unrecognized construction');
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
  new Script(runtime, {filename: 'shared-alg001-l12-p002-canvas-renderer.js'});
}
