import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";

import {
  SOURCE_PROVEN_INDEPENDENT_PROOF_TYPE,
  bindSwfmillDoActionFrameSequences,
  canonicalIndependentPairSet,
  deriveSourceProvenIndependentRequiredAudit,
  validateSourceProvenIndependentEvidenceDocument,
} from "./source-proven-independent-frame-domain-evidence.mjs";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function timeline(
  timelineId,
  objectId,
  frames,
  tagCounts = {},
  doActionFrames = [],
) {
  return {
    timelineId,
    objectId,
    declaredFrames: frames,
    observedShowFrames: frames,
    tagCounts: {ShowFrame: frames, End: 1, ...tagCounts},
    doActions: doActionFrames.map((frame, index) => ({
      tag: "DoAction",
      frame,
      ordinal: index + 1,
    })),
    events: [],
  };
}

function fixture() {
  const root = timeline("root", null, 10);
  root.events = ["1", "2", "3"].map((objectId, index) => ({
    kind: "placement",
    placement: {
      objectId,
      depth: String(index + 1),
    },
  }));
  const timelines = new Map([
    ["root", root],
    ["sprite-1", timeline("sprite-1", "1", 3, {DoAction: 1}, [2])],
    ["sprite-2", timeline("sprite-2", "2", 1, {DoAction: 1}, [1])],
    ["sprite-3", timeline("sprite-3", "3", 5)],
  ]);
  const body = "stop();";
  const scripts = {
    blocks: [
      {
        script: "DefineSprite_1/frame_2/DoAction.as",
        scope: {kind: "sprite", objectId: "1", frame: 2},
        body,
        bodySha256: sha256(body),
        lineStart: 2,
        lineEnd: 2,
      },
      {
        script: "DefineSprite_2/frame_1/DoAction.as",
        scope: {kind: "sprite", objectId: "2", frame: 1},
        body,
        bodySha256: sha256(body),
        lineStart: 4,
        lineEnd: 4,
      },
    ],
  };
  const inventory = {
    animationId: "fixture",
    timelineInventory: [
      {timelineId: "root", objectId: null, frameCount: 10, structuralReachability: "root"},
      ...[["1", 3], ["2", 1], ["3", 5]].map(([objectId, frameCount]) => ({
        timelineId: `sprite-${objectId}`,
        objectId,
        frameCount,
        structuralReachability: "reachable-from-root-placement-graph",
      })),
    ],
  };
  return {
    structure: {timelines},
    scripts,
    inventory,
    manifest: {animationId: "fixture", implementation: {frameDomains: [{sourceTimelineId: "root"}]}},
  };
}

test("classifies only an exact multi-frame local-action export as independent-required", () => {
  const audit = deriveSourceProvenIndependentRequiredAudit({
    animationId: "fixture",
    ...fixture(),
    remainingTimelineIds: ["sprite-1", "sprite-2", "sprite-3"],
    priorDisqualifiersByTimeline: new Map([
      ["sprite-1", ["swfmill-do-action-present", "ffdec-frame-script-present"]],
      ["sprite-2", ["swfmill-do-action-present", "ffdec-frame-script-present"]],
      ["sprite-3", ["named-incoming-instance-requires-target-control-proof"]],
    ]),
  });
  assert.deepEqual(audit.acceptedTimelineIds, ["sprite-1"]);
  assert.deepEqual(audit.rejectedTimelineIds, ["sprite-2", "sprite-3"]);
  assert.equal(audit.accepted[0].role, SOURCE_PROVEN_INDEPENDENT_PROOF_TYPE);
  assert.equal(audit.accepted[0].sourceProof.directDoActionTagCount, 1);
  assert.equal(audit.accepted[0].sourceProof.ffdecFrameScriptCount, 1);
  assert.deepEqual(audit.accepted[0].sourceProof.swfmillDoActionFrames, [2]);
  assert.deepEqual(audit.accepted[0].sourceProof.ffdecFrameScriptFrames, [2]);
  assert.equal(
    audit.accepted[0].sourceProof.swfmillDoActionFrameSequenceSha256,
    audit.accepted[0].sourceProof.ffdecFrameScriptFrameSequenceSha256,
  );
  assert.equal(
    audit.rejected[0].blockerClass,
    "scripted-one-frame-domain-semantics-unproved",
  );
  assert.equal(
    audit.rejected[1].blockerClass,
    "scriptless-direct-root-local-playhead-needs-runtime-continuation-proof",
  );
});

test("extracts only direct timeline DoAction frames with order and multiplicity", () => {
  const xml = `<swf><Header frames="3"><tags><DoAction><actions><Action code="1"/></actions></DoAction><ShowFrame/><DoAction/><DoAction/><ShowFrame/><ShowFrame/></tags><DefineSprite objectID="7" frames="2"><tags><ShowFrame/><DoAction/><ShowFrame/></tags></DefineSprite></Header></swf>`;
  const structure = {
    timelines: new Map([
      ["root", {tagCounts: {DoAction: 3}}],
      ["sprite-7", {tagCounts: {DoAction: 1}}],
    ]),
  };
  bindSwfmillDoActionFrameSequences(structure, xml);
  assert.deepEqual(
    structure.timelines.get("root").doActions.map(({frame}) => frame),
    [1, 2, 2],
  );
  assert.deepEqual(
    structure.timelines.get("sprite-7").doActions.map(({frame}) => frame),
    [2],
  );
});

test("a DoAction/FFDec count mismatch remains unresolved", () => {
  const input = fixture();
  input.structure.timelines.get("sprite-1").tagCounts.DoAction = 2;
  const audit = deriveSourceProvenIndependentRequiredAudit({
    animationId: "fixture",
    ...input,
    remainingTimelineIds: ["sprite-1"],
  });
  assert.equal(audit.accepted.length, 0);
  assert.equal(audit.rejected.length, 1);
  assert.equal(
    audit.rejected[0].blockerClass,
    "local-action-export-parity-incomplete",
  );
});

test("equal DoAction/FFDec counts at shifted local frames remain unresolved", () => {
  const input = fixture();
  input.structure.timelines.get("sprite-1").doActions[0].frame = 3;
  const audit = deriveSourceProvenIndependentRequiredAudit({
    animationId: "fixture",
    ...input,
    remainingTimelineIds: ["sprite-1"],
  });
  assert.equal(audit.accepted.length, 0);
  assert.equal(audit.rejected.length, 1);
  assert.equal(
    audit.rejected[0].blockerClass,
    "local-action-frame-sequence-parity-incomplete",
  );
  assert.deepEqual(audit.rejected[0].sourceProof.swfmillDoActionFrames, [3]);
  assert.deepEqual(audit.rejected[0].sourceProof.ffdecFrameScriptFrames, [2]);
  assert.notEqual(
    audit.rejected[0].sourceProof.swfmillDoActionFrameSequenceSha256,
    audit.rejected[0].sourceProof.ffdecFrameScriptFrameSequenceSha256,
  );
});

test("validator rejects authority promotion and incomplete local-action claims", () => {
  const input = fixture();
  const audit = deriveSourceProvenIndependentRequiredAudit({
    animationId: "fixture",
    ...input,
    remainingTimelineIds: ["sprite-1", "sprite-2", "sprite-3"],
  });
  const generatedFrom = {
    sourceSwf: {path: "source.swf", sha256: "1".repeat(64)},
    scenarioInventory: {path: "inventory.json", sha256: "2".repeat(64)},
    migrationTechnicalProjection: {
      path: "migration.json",
      sha256: "3".repeat(64),
      projection: "projection-v1",
    },
    swfmillStructure: {
      path: "swfmill.xml.gz",
      sha256: "4".repeat(64),
      uncompressedSha256: "5".repeat(64),
    },
    ffdecScripts: {
      path: "ffdec-scripts.txt.gz",
      sha256: "6".repeat(64),
      uncompressedSha256: "7".repeat(64),
    },
  };
  const document = {
    schemaVersion: 1,
    evidenceType: "source-proven-independent-frame-domain-evidence",
    status: "verified-source-obligation",
    animationId: "fixture",
    migrationStatusChanged: false,
    generatedBy: {
      proofEngine: {
        path: "scripts/source-proven-independent-frame-domain-evidence.mjs",
        sha256: "8".repeat(64),
      },
    },
    generatedFrom,
    summary: {
      remainingBefore: 3,
      independentRequired: 1,
      unresolvedAfter: 2,
    },
    exactPairSets: {
      accepted: canonicalIndependentPairSet([
        {animationId: "fixture", timelineId: "sprite-1"},
      ]),
      rejected: canonicalIndependentPairSet([
        {animationId: "fixture", timelineId: "sprite-2"},
        {animationId: "fixture", timelineId: "sprite-3"},
      ]),
    },
    claims: audit.accepted,
    rejected: audit.rejected,
    acceptanceEffects: {
      authoritativeRuntimeAccepted: false,
      behaviorAccepted: false,
    },
    strictAcceptanceEffect: "none; source obligation only",
  };
  assert.equal(
    validateSourceProvenIndependentEvidenceDocument(document, {
      animationId: "fixture",
      ...generatedFrom,
    }),
    true,
  );
  assert.throws(
    () => validateSourceProvenIndependentEvidenceDocument({
      ...document,
      strictAcceptanceEffect: "strict-complete",
    }, {animationId: "fixture", ...generatedFrom}),
    /strict acceptance boundary was crossed/,
  );
  const weakened = structuredClone(document);
  weakened.claims[0].sourceProof.exactDoActionToFfdecFrameScriptCount = false;
  assert.throws(
    () => validateSourceProvenIndependentEvidenceDocument(
      weakened,
      {animationId: "fixture", ...generatedFrom},
    ),
    /independent-required proof is incomplete/,
  );
});
