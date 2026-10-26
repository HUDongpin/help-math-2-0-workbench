import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {mapRootRuntimeToHeldChild} from
  './build-g678-nms-l09-p003-root-canvas-candidate.mjs';

const ir = JSON.parse(readFileSync(
  'migrations/shared-nms002-l09-p003/audit/ROOT_HELD_NESTED_DRAWING_V1.json'));
const metadata = {sourceRootTimeline: {frameCount: 10},
  deterministicContentTimeline: {timelineId: 'sprite-246', frameCount: 10}};
const original = `function resolveFrameState(request) {
    var frame = request.frame;
    if (!Number.isSafeInteger(frame) || frame < 1 || frame > 10) {
        throw new Error("frame must be a safe integer within 1..10");
    }
    return {exportFrame: frame - 1, localFrame: frame};
}
function render(ctx, state) {
    main(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);
}
var METADATA = deepFreeze(${JSON.stringify(metadata, null, 2)});`;

test('held root frame 6 maps all 635 child frames without off-by-one', () => {
  const mapped = mapRootRuntimeToHeldChild(original, metadata, ir);
  assert.match(mapped, /frame > 635/u);
  assert.match(mapped, /exportFrame: 5/u);
  assert.match(mapped,
    /state\.exportFrame, 0, state\.localFrame - 1/u);
  assert.match(mapped, /"sourceTerminalStopFrame": 635/u);
  assert.match(mapped, /"placementName": "Animation"/u);
  assert.match(mapped, /"nativeTypographyImplemented": false/u);
});

test('changed source projection or generated markers fail closed', () => {
  assert.throws(() => mapRootRuntimeToHeldChild(original, metadata,
    {...ir, ffdec: {...ir.ffdec, rootExportFrame: 6}}));
  assert.throws(() => mapRootRuntimeToHeldChild(
    original.replace('frame > 10', 'frame > 11'), metadata, ir),
  /exact generated marker changed/u);
  assert.throws(() => mapRootRuntimeToHeldChild(
    original.replace('state.exportFrame, 0, 0',
      'state.exportFrame, 0, 1'), metadata, ir),
  /exact generated marker changed/u);
});
