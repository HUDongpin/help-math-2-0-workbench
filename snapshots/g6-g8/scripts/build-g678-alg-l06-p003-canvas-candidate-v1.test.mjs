import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildCandidate} from './build-g678-alg-l06-p003-canvas-candidate-v1.mjs';

test('P003 drawing candidate retains source frame identity and corrects the source clip-mask geometry', () => {
  const built = buildCandidate(process.env.HELP_MATH_G678_SOURCE_ROOT);
  const spec = JSON.parse(built.spec), manifest = JSON.parse(built.manifest);
  assert.equal(spec.finalAnimationId, 'shared-alg001-l06-p003');
  assert.equal(spec.source.swfSha256, 'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766');
  assert.equal(spec.timeline.local.frameCount, 719);
  assert.equal(spec.timeline.local.timelineId, 'sprite-154');
  assert.equal(spec.runtimeContract.supportedLanguages.join(','), 'en');
  assert.equal(manifest.status, 'unregistered-drawing-only-candidate');
  assert.equal(manifest.acceptance.currentJsRegistered, false);
  const runtime = built.runtime.toString();
  assert(runtime.includes('ctx.fillStyle="rgba(0,0,0,1)";'));
  assert(!runtime.includes('ctx.fillStyle=tocolor(ctrans.apply([0,102,255,0.2509804]));'));
  assert(manifest.outputs.some(output => output.name === 'canvas-renderer.js' && output.bytes === built.runtime.length));
});

test('P003 candidate rejects a missing real source root before opening source evidence', () => {
  assert.throws(() => buildCandidate(undefined), /real source root/u);
});
