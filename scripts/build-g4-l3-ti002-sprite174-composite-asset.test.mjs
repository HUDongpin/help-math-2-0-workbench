import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTi002CompositeContract,
  parseArguments,
} from "./build-g4-l3-ti002-sprite174-composite-asset.mjs";

const framesHtml = `
function sprite174(ctx,ctrans,frame,ratio,time){
  var frame_cnt = 10;
}
function sprite175(ctx,ctrans,frame,ratio,time){
  var frame_cnt = 2;
  place("sprite174",canvas,ctx,[],ctrans,1,0,1,time);
}
function sprite272(ctx,ctrans,frame,ratio,time){
  var frame_cnt = 254;
  place("sprite175",canvas,ctx,[],ctrans,1,0,237,time);
}
`;

test("builds ten exact child-frame states plus fail-closed visibility probes", () => {
  const contract = buildTi002CompositeContract(framesHtml);
  assert.equal(contract.contractId, "g04-l03-ti-002-parent-composite-observability-v1");
  assert.equal(contract.states.length, 12);
  assert.deepEqual(contract.states[0].frameOverrides, {sprite174: 0, sprite175: 1});
  assert.deepEqual(contract.states[9].frameOverrides, {sprite174: 9, sprite175: 1});
  assert.deepEqual(contract.states[10].hiddenFunctions, ["sprite174"]);
  assert.deepEqual(contract.states[11].translationOverrides, {sprite174: {x: 200, y: 200}});
  assert.deepEqual(contract.functionEvidence, {
    sprite174: {objectId: 174, frameCount: 10, expectedPlacementCount: 1},
    sprite175: {objectId: 175, frameCount: 2, expectedPlacementCount: 1},
  });
  assert.match(contract.sourceContractFingerprintSha256, /^[a-f0-9]{64}$/);
});

test("CLI is check-by-default and write is explicit", () => {
  assert.deepEqual(parseArguments([]), {write: false});
  assert.deepEqual(parseArguments(["--write"]), {write: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});
