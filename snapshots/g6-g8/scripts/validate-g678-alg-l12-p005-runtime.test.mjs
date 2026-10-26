import assert from 'node:assert/strict';
import test from 'node:test';
import {validateP005Runtime} from './validate-g678-alg-l12-p005-runtime.mjs';

const fixture = `function surface(){return document.createElement("canvas");}
var imageObj2 = document.createElement("img"); imageObj2.src="data:image/JPEG;base64,AA==";
var imageObj99 = document.createElement("img"); imageObj99.src="data:image/PNG;base64,AA==";
var imageObj204 = document.createElement("img"); imageObj204.src="data:image/PNG;base64,AA==";
function output(){return document.createElement("canvas");}`;

test('P005 syntax/surface validator permits only exact source bitmap identities', () => {
  validateP005Runtime(fixture);
  for (const bad of [fixture.replaceAll('imageObj204', 'imageObj205'),
    fixture.replace('data:image/PNG;base64,AA==', 'https://example.invalid/image.png'),
    fixture.replace('createElement("img")', 'createElement("iframe")'),
    fixture + '\ndocument.createElement("canvas");']) {
    assert.throws(() => validateP005Runtime(bad));
  }
});

test('P005 rejects active runtime primitives and invalid JavaScript', () => {
  for (const extra of ['fetch("/")', 'eval("1")', 'new Function("return 1")',
    'setTimeout(()=>{},1)', 'requestAnimationFrame(()=>{})', 'document.body',
    'localStorage.getItem("x")', 'new Worker("/")', 'window.postMessage("x")',
    'import("x")', 'addEventListener("click",()=>{})', 'const =']) {
    assert.throws(() => validateP005Runtime(fixture + '\n' + extra), extra);
  }
});
