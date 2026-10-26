#!/usr/bin/env node
/** Local, unregistered browser probe for the exact two-run P003 source clock. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIT = '/Volumes/American Dream/hudongpin/g678-p003-audit.11qugt';
const OUTPUT = '/Volumes/American Dream/hudongpin/g678-p003-candidate.AXwt5X';
const CANVAS_SHA = '12dd005081028a24f968036996b69baae98401e0d39ff6bdb221330a4062f487';
const RUNS = Object.freeze([
  {name: 'source-run-01.mp3', sha256: 'f7e602316da5d728766a59bcbb375341beb75e904a43cd8dad051fb7f97efc70', bytes: 190580},
  {name: 'source-run-02.mp3', sha256: '582fbcd80677d9f58cf4ba41929dc5b57bf77aae7ef193a2a3f447ab0da459db', bytes: 73060},
]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

function pinned(file, expectedSha, expectedBytes) {
  assert.equal(realpathSync(file), file, `physical file: ${file}`);
  const before = lstatSync(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n, `ordinary file: ${file}`);
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'nlink']) assert.equal(before[key], after[key], `stable file: ${file}`);
  assert.equal(sha(bytes), expectedSha, `hash drift: ${file}`);
  if (expectedBytes !== undefined) assert.equal(bytes.length, expectedBytes, `size drift: ${file}`);
  return bytes;
}

function html() {
  return Buffer.from(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" href="data:,"><title>P003 two-run clock — unregistered browser probe</title>
<style>body{margin:0;background:#192836;color:white;font:16px system-ui}main{max-width:800px;margin:auto;padding:12px}canvas{display:block;width:100%;height:auto}button,input{font:inherit}button{min-width:80px;margin:8px 8px 8px 0;padding:8px}#status{white-space:pre-wrap}</style></head>
<body><main><h1>P003 source-clock browser probe</h1><p>Unregistered engineering candidate. No original-runtime, audio-listening or My Lesson acceptance.</p>
<canvas id="stage" width="800" height="600" aria-label="Source drawing candidate"></canvas>
<div><button id="play" disabled>Play</button><button id="pause" disabled>Pause</button><button id="replay" disabled>Replay</button>
<label for="frame">Frame</label> <input id="frame" type="number" min="1" max="719" value="502"><button id="seek" disabled>Inspect frame</button></div>
<output id="status" role="status">Loading exact source runs…</output></main>
<script src="./canvas-renderer.js"></script><script src="./p003-source-clock-bundle.js"></script><script>
const ID='course-shared-alg001-l06-p003', canvas=document.getElementById('stage'), status=document.getElementById('status');
const controls=['play','pause','replay','seek'].map(id=>document.getElementById(id));
let clock, asset, error=null;
function paint(frame){if(!asset)return false;const state=asset.render(canvas,{frame,scenario:'source-static-frame',lang:'en',seed:0});
  return state.localFrame===frame&&state.frameDomain==='sprite-154'&&canvas.getAttribute('data-flash-frame')===String(frame);}
function show(){if(!clock)return;const snapshot=clock.snapshot();
  if(snapshot.phase==='playing'&&canvas.getAttribute('data-flash-frame')!==String(snapshot.frame))paint(snapshot.frame);
  status.textContent=JSON.stringify({phase:snapshot.phase,frame:snapshot.frame,run:snapshot.audio.runId,
    audioPhase:snapshot.audio.phase,activeSegments:snapshot.activeSegmentIndex,error:error||snapshot.failure},null,2);
  document.body.dataset.clockPhase=snapshot.phase;document.body.dataset.clockFrame=String(snapshot.frame);
  requestAnimationFrame(show);}
async function main(){try{asset=window.HELP_MATH_CANVAS_ASSETS?.[ID];if(!asset)throw Error('canvas-asset-missing');
  await asset.ready();const runs=await Promise.all(['source-run-01.mp3','source-run-02.mp3'].map(async name=>{
    const response=await fetch('./'+name,{cache:'no-store'});if(!response.ok)throw Error('run-fetch-'+response.status);return response.arrayBuffer();}));
  clock=new P003Source.AlgL06P003SourceClockV1({commitHeldFrame:paint});window.p003Clock=clock;
  const prepared=await clock.prepare(runs);if(!prepared.accepted)throw Error(prepared.reason);
  for(const control of controls)control.disabled=false;
  document.getElementById('play').onclick=async()=>{const result=await clock.play({activation:'user',reducedMotion:false});if(!result.accepted)error=result.reason;};
  document.getElementById('pause').onclick=()=>{const result=clock.pause();if(!result.accepted)error=result.reason;};
  document.getElementById('replay').onclick=()=>{clock.replay();};
  document.getElementById('seek').onclick=()=>{const result=clock.seekCandidateFrame(Number(document.getElementById('frame').value));if(!result.accepted)error=result.reason;};
  show();
}catch(cause){error=String(cause);document.body.dataset.clockError=error;status.textContent=error;void clock?.close();}}
void main();addEventListener('pagehide',()=>{void clock?.close();});
</script></body></html>
`);
}

async function main() {
  assert.equal(realpathSync(OUTPUT), OUTPUT);
  assert(lstatSync(OUTPUT).isDirectory());
  pinned(path.join(OUTPUT, 'canvas-renderer.js'), CANVAS_SHA);
  const bundled = await build({entryPoints: [path.join(ROOT, 'packages/demos/src/alg-l06-p003-source-clock-v1.ts')],
    bundle: true, platform: 'browser', format: 'iife', globalName: 'P003Source', write: false});
  const files = RUNS.map(run => [run.name, pinned(path.join(AUDIT, run.name), run.sha256, run.bytes)]);
  files.push(['p003-source-clock-bundle.js', Buffer.from(bundled.outputFiles[0].contents)]);
  files.push(['p003-source-clock-harness.html', html()]);
  const manifest = Buffer.from(JSON.stringify({schemaVersion: 1, status: 'unregistered-local-browser-probe',
    animationId: 'shared-alg001-l06-p003', canvasSha256: CANVAS_SHA,
    files: files.map(([name, bytes]) => ({name, bytes: bytes.length, sha256: sha(bytes)})),
    acceptance: {currentJsRegistered: false, originalRuntimeAccepted: false, audioAccepted: false,
      humanAccepted: false, ownerAccepted: false, strictComplete: false, published: false}}, null, 2) + '\n');
  files.push(['p003-source-clock-harness-manifest.json', manifest]);
  for (const [name, bytes] of files) {
    const target = path.join(OUTPUT, name);
    try {writeFileSync(target, bytes, {flag: 'wx'});}
    catch (cause) {if (cause.code !== 'EEXIST') throw cause; assert(readFileSync(target).equals(bytes), `${name} drifted`);}
  }
  console.log(JSON.stringify({status: 'verified', output: OUTPUT,
    files: files.map(([name, bytes]) => ({name, bytes: bytes.length, sha256: sha(bytes)}))}));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main();
