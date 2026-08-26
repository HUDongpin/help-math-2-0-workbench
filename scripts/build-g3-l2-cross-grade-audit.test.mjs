import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeBehaviorScripts,
  parseDirectRootAnimationPlacement,
} from "./build-g3-l2-cross-grade-audit.mjs";

test("direct root Animation parsing ignores nested placements and preserves one-indexed frame", () => {
  const xml = `<?xml version="1.0"?>
<swf><Header frames="10"><tags>
  <ShowFrame/><ShowFrame/><ShowFrame/><ShowFrame/><ShowFrame/>
  <DefineSprite objectID="7" frames="2"><tags>
    <PlaceObject2 replace="0" depth="9" objectID="8" name="Animation"><transform><Transform transX="1" transY="2"/></transform></PlaceObject2>
  </tags></DefineSprite>
  <DefineSprite objectID="42" frames="117"><tags><ShowFrame/></tags></DefineSprite>
  <FrameLabel label="begin"><flags/></FrameLabel>
  <PlaceObject2 replace="0" depth="3" objectID="42" morph="5" name="Animation"><transform><Transform transX="8248" transY="5666"/></transform></PlaceObject2>
  <ShowFrame/><ShowFrame/><ShowFrame/><ShowFrame/><ShowFrame/>
</tags></Header></swf>`;
  assert.deepEqual(parseDirectRootAnimationPlacement(xml), {
    frame: 6,
    objectId: 42,
    depth: 3,
    instanceName: "Animation",
    replace: "0",
    morph: 5,
    placementTwips: {x: 8248, y: 5666},
    placementPixels: {x: 412.4, y: 283.3},
    frameCount: 117,
    rootFrameCount: 10,
    rootLabels: [{frame: 6, label: "begin"}],
  });
});

test("behavior triage keeps glossary-only and legacy reporting pages distinct", () => {
  const glossary = analyzeBehaviorScripts({
    targetObjectId: 10,
    pcodeRecords: [
      {
        path: "DefineButton2_9/BUTTONCONDACTION on(release).pcode",
        text: 'Push "DoHyperLinks"\nCallMethod',
        bytes: 31,
      },
    ],
    asRecords: [
      {
        path: "DefineButton2_9/BUTTONCONDACTION on(release).as",
        text: '_global.KeyAttribute = "Number"; _root.DoHyperLinks();',
        bytes: 57,
      },
    ],
  });
  assert.equal(glossary.machineTriageLane, "interaction-contract-review");
  assert.deepEqual(glossary.keyAttributes, ["Number"]);
  assert.deepEqual(glossary.rootMethodCalls, ["DoHyperLinks"]);

  const reporting = analyzeBehaviorScripts({
    targetObjectId: 10,
    pcodeRecords: [
      {
        path: "DefineButton2_9/BUTTONCONDACTION on(release).pcode",
        text: "If\nGetUrl2\nRandom",
        bytes: 20,
      },
    ],
    asRecords: [
      {
        path: "DefineButton2_9/BUTTONCONDACTION on(release).as",
        text: "_root.doCloseApp();",
        bytes: 19,
      },
    ],
  });
  assert.equal(reporting.machineTriageLane, "behavior-heavy-review");
  assert.equal(reporting.externalOrNetworkOpcodeCount, 1);
  assert.equal(reporting.randomOpcodeCount, 1);
});
