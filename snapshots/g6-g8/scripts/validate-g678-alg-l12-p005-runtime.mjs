import assert from 'node:assert/strict';
import {Script} from 'node:vm';

// Source characters 2, 99, 204 are the three P005 embedded bitmaps.
// JPEG3 alpha is decoded by FFDec into an embedded PNG; no remote image is allowed.
export function validateP005Runtime(runtime) {
  assert.deepEqual([...new Set([...runtime.matchAll(/document\.([\w$]+)/g)].map(m => m[1]))], ['createElement']);
  assert.deepEqual([...runtime.matchAll(/document\.createElement\("([a-z]+)"\)/g)].map(m => m[1]),
    ['canvas', 'img', 'img', 'img', 'canvas']);
  assert.equal((runtime.match(/document\.createElement/g) || []).length, 5);
  const images = [...runtime.matchAll(/var (imageObj\d+) = document\.createElement\("img"\);\s*\1\.src="([^"]+)";/g)];
  assert.deepEqual(images.map(m => m[1]), ['imageObj2', 'imageObj99', 'imageObj204']);
  for (const [, , url] of images) assert.match(url, /^data:image\/(?:JPEG|PNG);base64,[A-Za-z0-9+/=]+$/);
  for (const pattern of [/\beval\s*\(/, /\bFunction\s*\(/,
    /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB)\b/,
    /\b(?:Worker|SharedWorker)\s*\(/, /\b(?:location|postMessage|open)\s*(?:\.|\()/,
    /\bimport\s*\(/, /document\.body/, /\b(?:addEventListener|removeEventListener)\s*\(/]) {
    assert(!pattern.test(runtime), `blocked primitive: ${pattern}`);
  }
  new Script(runtime, {filename: 'shared-alg001-l12-p005-canvas-renderer.js'});
}
