import assert from "node:assert/strict";
import test from "node:test";

import {
  buildParentCompositeContract,
  PARENT_COMPOSITE_ASSET_CONFIGS,
  parseArguments,
} from "./build-g4-l3-parent-composite-assets.mjs";

const framesHtml = `
function sprite74(ctx,ctrans,frame,ratio,time){
  var frame_cnt = 22;
}
function sprite98(ctx,ctrans,frame,ratio,time){
  var frame_cnt = 19;
}
function sprite108(ctx,ctrans,frame,ratio,time){
  var frame_cnt = 27;
  place("sprite74",canvas,ctx,[],ctrans,1,0,1,time);
  place("sprite98",canvas,ctx,[],ctrans,1,0,1,time);
}
function sprite228(ctx,ctrans,frame,ratio,time){
  var frame_cnt = 215;
  place("sprite108",canvas,ctx,[],ctrans,1,0,173,time);
}
`;

test("freezes four assets, ten paths, and 366 target-frame identities", () => {
  assert.equal(PARENT_COMPOSITE_ASSET_CONFIGS.length, 4);
  assert.equal(
    PARENT_COMPOSITE_ASSET_CONFIGS.reduce(
      (sum, config) => sum + config.paths.length,
      0,
    ),
    10,
  );
  assert.equal(
    PARENT_COMPOSITE_ASSET_CONFIGS.reduce(
      (sum, config) => sum + config.paths.reduce(
        (pathSum, candidatePath) =>
          pathSum + candidatePath.targetFrameCount,
        0,
      ),
      0,
    ),
    366,
  );
});

test("builds path-qualified multi-target states without conflating placements", () => {
  const config = PARENT_COMPOSITE_ASSET_CONFIGS[1];
  const contract = buildParentCompositeContract(framesHtml, config);
  assert.equal(
    contract.contractId,
    "g04-l03-in-012-parent-composite-observability-v1",
  );
  assert.equal(contract.states.length, 66);
  assert.deepEqual(contract.states[0].frameOverrides, {
    sprite108: 11,
    sprite74: 0,
  });
  assert.equal(contract.states[0].stateId, "sprite74-p02-target-frame-001");
  assert.equal(contract.states[21].stateId, "sprite74-p02-target-frame-022");
  assert.deepEqual(contract.states[22].hiddenFunctions, ["sprite74"]);
  assert.deepEqual(contract.states[23].translationOverrides, {
    sprite74: {x: 200, y: 200},
  });
  assert.equal(contract.states[24].stateId, "sprite98-p01-target-frame-001");
  assert.deepEqual(contract.states[24].frameOverrides, {
    sprite108: 5,
    sprite98: 0,
  });
  assert.equal(contract.states[45].stateId, "sprite98-p02-target-frame-001");
  assert.deepEqual(contract.states[45].frameOverrides, {
    sprite108: 8,
    sprite98: 0,
  });
  assert.deepEqual(contract.functionEvidence, {
    sprite108: {objectId: 108, frameCount: 27, expectedPlacementCount: 1},
    sprite74: {objectId: 74, frameCount: 22, expectedPlacementCount: 1},
    sprite98: {objectId: 98, frameCount: 19, expectedPlacementCount: 1},
  });
  assert.match(contract.sourceContractFingerprintSha256, /^[a-f0-9]{64}$/);
});

test("CLI is check-by-default and write is explicit", () => {
  assert.deepEqual(parseArguments([]), {write: false});
  assert.deepEqual(parseArguments(["--write"]), {write: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});
