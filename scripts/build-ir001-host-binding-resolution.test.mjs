import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {
  IR001,
  buildIr001HostBindingResolution,
  deriveChildBindingFacts,
  deriveStructuralProof,
  parseArguments,
  parseFfdecScriptBundle,
  validateAuthoringAudit,
} from "./build-ir001-host-binding-resolution.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), "..");

async function readJson(relative) {
  return JSON.parse(await readFile(path.join(root, relative), "utf8"));
}

test("argument parser exposes deterministic pinned-tool overrides and check mode", () => {
  assert.deepEqual(parseArguments([]), {
    check: false,
    ffdec: "ffdec",
    swfmill: "swfmill",
    python: "python3",
    root,
  });
  assert.deepEqual(parseArguments([
    "--check",
    "--ffdec", "/tmp/ffdec",
    "--swfmill", "/tmp/swfmill",
    "--python", "/tmp/python3",
    "--root", "/tmp/project",
  ]), {
    check: true,
    ffdec: "/tmp/ffdec",
    swfmill: "/tmp/swfmill",
    python: "/tmp/python3",
    root: "/tmp/project",
  });
  assert.throws(() => parseArguments(["--ffdec"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("FFDec bundle parser preserves empty scripts and rejects duplicate headings", () => {
  const parsed = parseFfdecScriptBundle(Buffer.from([
    "===== empty.as =====",
    "",
    "",
    "===== frame_1/DoAction.as =====",
    "stop();",
    "",
  ].join("\r\n")));
  assert.equal(parsed.get("empty.as"), "");
  assert.equal(parsed.get("frame_1/DoAction.as"), "stop();");
  assert.throws(() => parseFfdecScriptBundle([
    "===== duplicate.as =====",
    "one();",
    "",
    "===== duplicate.as =====",
    "two();",
  ].join("\n")), /duplicate FFDec script heading/);
});

test("current saved child scripts resolve exactly four parent-value names and preserve the real preloader request", async () => {
  const raw = gunzipSync(await readFile(path.join(root, IR001.savedFfdec)));
  const scripts = parseFfdecScriptBundle(raw);
  const facts = deriveChildBindingFacts(scripts);
  assert.deepEqual(facts.referenceCounts, {
    bareGlobal: 1,
    globalFStyleFormat: 2,
    globalTempRandomSoundMc: 2,
    parent: 2,
    level0InternalPreloader: 1,
  });
  assert.deepEqual(facts.componentAttachTargets, ["ScrollThumb", "UpArrow", "DownArrow"]);
  assert.deepEqual(facts.locations.parent.map(({script}) => script).sort(), [
    "FScrollBarSymbol.as",
    "FUIComponentSymbol.as",
  ]);

  const mutated = new Map(scripts);
  mutated.set("frame_6/DoAction.as", `${mutated.get("frame_6/DoAction.as")}\ntrace(_parent);`);
  assert.throws(() => deriveChildBindingFacts(mutated), /expected two intrinsic _parent references; observed 3/);
});

function structuralFixtures() {
  return {
    child: {
      header: {frames: "10", framerate: "12"},
      definitions: {"1": 1, "5": 1, "58": 142},
      exports: [
        {objectId: "1", name: "FUIComponentSymbol"},
        {objectId: "5", name: "FScrollBarSymbol"},
      ],
      initActionSpriteIds: ["1", "5"],
      timelines: [
        {
          timelineId: "root",
          declaredFrameCount: 10,
          observedShowFrameCount: 10,
          labels: [{frame: 6, label: "begin"}],
          placements: [{frame: 6, tag: "PlaceObject2", objectId: "58", depth: "1", name: "animation"}],
        },
        {
          timelineId: "sprite-58",
          declaredFrameCount: 142,
          observedShowFrameCount: 142,
          labels: [],
          placements: [
            {frame: 1, tag: "PlaceObject2", objectId: "7", depth: "234", name: "Mc_Sound_0"},
            {frame: 1, tag: "PlaceObject2", objectId: "8", depth: "236", name: "Mc_Sound_1"},
          ],
        },
      ],
    },
    shell: {
      header: {frames: "55", framerate: "12"},
      definitions: {"176": 28},
      exports: [],
      initActionSpriteIds: [],
      timelines: [
        {
          timelineId: "root",
          declaredFrameCount: 55,
          observedShowFrameCount: 55,
          labels: [],
          placements: [
            {frame: 38, tag: "PlaceObject2", objectId: "170", depth: "47", name: "animation_mc"},
            {frame: 38, tag: "PlaceObject2", objectId: "176", depth: "508", name: "InternalPreloader"},
          ],
        },
        {
          timelineId: "sprite-176",
          declaredFrameCount: 28,
          observedShowFrameCount: 28,
          labels: [
            {frame: 1, label: "inactive"},
            {frame: 11, label: "jump_check"},
            {frame: 20, label: "done"},
          ],
          placements: [],
        },
      ],
    },
  };
}

test("source structure proof binds child entry/random clips and the same-lesson preloader without scenario inventory", () => {
  const {child, shell} = structuralFixtures();
  const proof = deriveStructuralProof(child, shell);
  assert.equal(proof.child.entryPlacement.objectId, "58");
  assert.deepEqual(proof.child.randomSoundPlacements.map(({name}) => name), ["Mc_Sound_0", "Mc_Sound_1"]);
  assert.equal(proof.shell.preloader.objectId, 176);
  assert.equal(proof.shell.coPlacementFrame, 38);

  const moved = structuredClone(child);
  moved.timelines.find(({timelineId}) => timelineId === "root").placements[0].frame = 7;
  assert.throws(() => deriveStructuralProof(moved, shell), /animation entry placement.*observed 0/);

  const ambiguousShell = structuredClone(shell);
  ambiguousShell.timelines[0].placements.push({...ambiguousShell.timelines[0].placements[1], depth: "509"});
  assert.throws(() => deriveStructuralProof(child, ambiguousShell), /InternalPreloader.*not unique.*observed 2/);
});

test("current schema-v2 authoring audit independently corroborates entry, component provenance, and random sound placements", async () => {
  const audit = await readJson(IR001.authoringAudit);
  const proof = validateAuthoringAudit(audit);
  assert.equal(proof.schemaVersion, 2);
  assert.deepEqual(proof.entry, {flashFrame: 6, instanceName: "animation", libraryItemName: "Animation03"});
  assert.deepEqual(proof.animation03.actionFrames, [
    {flashFrame: 1, actionScriptLength: 74},
    {flashFrame: 5, actionScriptLength: 47},
    {flashFrame: 142, actionScriptLength: 7},
  ]);
  assert.deepEqual(proof.components.map(({linkageClassName}) => linkageClassName), [
    "FScrollBarSymbol",
    "FUIComponentSymbol",
  ]);

  const schemaDowngrade = structuredClone(audit);
  schemaDowngrade.schemaVersion = 1;
  assert.throws(() => validateAuthoringAudit(schemaDowngrade), /schema must be 2/);
  const incompleteRecursiveAudit = structuredClone(audit);
  incompleteRecursiveAudit.protocol.recursiveLibraryTimelineAuditVerified = false;
  assert.throws(() => validateAuthoringAudit(incompleteRecursiveAudit), /recursive library audit is not fully verified/);
});

test("checked-in report is a repeatable direct derivation with four accepted dispositions and one adapter requirement", {timeout: 180_000}, async () => {
  const {report} = await buildIr001HostBindingResolution({root, check: true});
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.status, "binding-names-resolved-runtime-scenarios-pending");
  assert.deepEqual(report.bindings.map(({binding, disposition, fixturePolicy}) => ({binding, disposition, fixturePolicy})), [
    {binding: "_global", disposition: "intrinsic-avm1-global-namespace", fixturePolicy: "do-not-inject-or-override"},
    {binding: "_global.FStyleFormat", disposition: "child-embedded-component-bootstrap", fixturePolicy: "do-not-inject-or-override"},
    {binding: "_global.tempRandomSoundMc", disposition: "child-self-initialized-before-use", fixturePolicy: "do-not-inject-or-override"},
    {binding: "_parent", disposition: "intrinsic-display-list-parent", fixturePolicy: "do-not-inject-or-override"},
  ]);
  assert.equal(report.resolvedParentValueBindingCount, 4);
  assert.equal(report.unresolvedParentValueBindingCount, 0);
  assert.equal(report.remainingAdapterRequirementCount, 1);
  assert.equal(report.remainingAdapterRequirements[0].binding, "_level0.InternalPreloader");
  assert.equal(report.strictAcceptanceEffect.startsWith("none;"), true);

  const evidencePaths = report.evidenceArtifacts.map(({path: artifactPath}) => artifactPath);
  assert.equal(evidencePaths.some((artifactPath) => artifactPath.includes("scenario-inventory")), false);
  assert.equal(evidencePaths.some((artifactPath) => artifactPath.includes("same-lesson-shell-host-entry-binding")), false);
  assert.deepEqual(report.authority.circularDependenciesExcluded, [
    "audit/scenario-inventory.json",
    "audit/same-lesson-shell-host-entry-binding.json",
  ]);
});
