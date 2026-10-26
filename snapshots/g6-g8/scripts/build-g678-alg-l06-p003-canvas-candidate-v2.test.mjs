import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildP003PlacementCandidate} from './build-g678-alg-l06-p003-canvas-candidate-v2.mjs';

test('P003 successor registers the exact placement identity without changing source drawing',
  {skip: !process.env.HELP_MATH_G678_SOURCE_ROOT}, () => {
    const built = buildP003PlacementCandidate(process.env.HELP_MATH_G678_SOURCE_ROOT);
    const spec = JSON.parse(built.spec), manifest = JSON.parse(built.manifest);
    assert.equal(spec.animationId, 'shared-alg001-l06-p003');
    assert.equal(spec.finalAnimationId, spec.animationId);
    assert.equal(spec.source.swfSha256, 'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766');
    assert.equal(spec.timeline.local.frameCount, 719);
    assert.equal(manifest.acceptance.currentJsRegistered, false);
    assert(built.preview.includes(Buffer.from("HELP_MATH_CANVAS_ASSETS?.['shared-alg001-l06-p003']")));
  });
