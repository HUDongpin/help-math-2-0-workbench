import assert from 'node:assert/strict';
import {Script} from 'node:vm';

export function validateP003Runtime(runtime) {
  assert.deepEqual([...new Set([...runtime.matchAll(/document\.([\w$]+)/g)].map(m=>m[1]))],['createElement']);
  assert.deepEqual([...runtime.matchAll(/document\.createElement\("([a-z]+)"\)/g)].map(m=>m[1]),['canvas','img','canvas']);
  assert.equal((runtime.match(/document\.createElement/g)||[]).length,3);
  const images = [...runtime.matchAll(/imageObj9\.src="([^"]+)";/g)].map(m=>m[1]);
  assert.equal(images.length,1);
  assert(/^data:image\/JPEG;base64,[A-Za-z0-9+/=]+$/.test(images[0]));
  for(const pattern of [/\beval\s*\(/,/\bFunction\s*\(/,/\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB)\b/,
    /\b(?:Worker|SharedWorker)\s*\(/,/\b(?:location|postMessage|open)\s*(?:\.|\()/,/\bimport\s*\(/,
    /document\.body/,/\b(?:addEventListener|removeEventListener)\s*\(/]) assert(!pattern.test(runtime),`blocked primitive: ${pattern}`);
  new Script(runtime,{filename:'shared-alg001-l12-p003-canvas-renderer.js'});
}
