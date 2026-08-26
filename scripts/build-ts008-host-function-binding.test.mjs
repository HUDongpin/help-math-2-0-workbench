import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildTs008HostFunctionBinding,
  deriveTs008HostBinding,
  parseArguments,
} from "./build-ts008-host-function-binding.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), "..");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

test("argument parser is explicit and fail closed", () => {
  assert.deepEqual(parseArguments([]), {root, ffdec: "ffdec", check: false});
  assert.deepEqual(
    parseArguments(["--check", "--root", "/tmp/project", "--ffdec", "/tmp/ffdec"]),
    {root: "/tmp/project", ffdec: "/tmp/ffdec", check: true},
  );
  assert.throws(() => parseArguments(["--ffdec"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("checked-in TS008 host function binding re-extracts deterministically", async () => {
  const result = await buildTs008HostFunctionBinding({root, check: true});
  assert.equal(result.path, "migrations/course-g03-l01-ts-008/audit/host-function-binding.json");
  assert.equal(result.report.status, "source-contract-proven-runtime-state-unresolved");
  assert.deepEqual(result.report.qualificationIssues, []);
});

test("report binds current source bytes and preserves every unresolved authority boundary", async () => {
  const report = await readJson(
    "migrations/course-g03-l01-ts-008/audit/host-function-binding.json",
  );
  assert.equal(report.animationId, "course-g03-l01-ts-008");
  assert.equal(report.sources.child.sha256, "9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b");
  assert.equal(report.sources.host.sha256, "69d0f39b3e7b4e93f7354f7096a2c38f2335277aec116b8d9bf35d740a571a8f");
  assert.equal(report.sourceContracts.correctAnswer.feedbackVariantCount, 4);
  assert.equal(report.sourceContracts.wrongAnswer.feedbackVariantCount, 3);
  assert.equal(report.sourceContracts.correctAnswer.deterministicVariantMappingResolved, false);
  assert.equal(report.sourceContracts.wrongAnswer.deterministicVariantMappingResolved, false);
  assert.equal(report.sourceContracts.glossary.hostSuffixObserved, "~English");
  assert.equal(report.sourceContracts.glossary.spanishGlossaryProtocolResolved, false);
  assert.equal(report.sourceContracts.replay.observedOperation, "_root.loadSWFMovie()");
  assert.equal(report.sourceContracts.replay.fullStateResetResolved, false);
  assert.equal(report.sourceContracts.spanishAudio.siblingSaPathConstructionSourceProven, true);
  assert.equal(report.sourceContracts.spanishAudio.naturalPlaybackAndSynchronizationResolved, false);
  assert.equal(report.authority.originalRuntimeExecutionObserved, false);
  assert.equal(report.authority.scoringResolved, false);
  assert.equal(report.authority.audioExecutedOrAccepted, false);
  assert.equal(report.authority.humanOrOwnerAcceptance, false);
  assert.equal(report.authority.strictAcceptanceEffect, "none");
  assert.equal(report.authority.migrationStatusChanged, false);
  assert.match(report.limitations.join("\n"), /No JavaScript renderer scenario is unblocked/);

  const scriptRaw = await readFile(path.join(root, "scripts/build-ts008-host-function-binding.mjs"));
  assert.equal(report.generatedBy.sha256, sha256(scriptRaw));
});

test("missing host tokens make the derived binding blocked instead of weakening requirements", async () => {
  const report = await readJson(
    "migrations/course-g03-l01-ts-008/audit/host-function-binding.json",
  );
  const inventoryRaw = await readFile(
    path.join(root, "migrations/course-g03-l01-ts-008/audit/scenario-inventory.json"),
  );
  const childScriptBundle = await readFile(
    path.join(root, "migrations/course-g03-l01-ts-008/audit/machine/ffdec-scripts.txt.gz"),
  );
  const hostExport = structuredClone(report.hostActionScript);
  hostExport.functions[0].missingTokens = ["random(3)"];
  hostExport.functions[0].exact = false;
  const derived = deriveTs008HostBinding({
    inventory: JSON.parse(inventoryRaw),
    inventoryRaw,
    childScriptBundle,
    hostExport,
    sources: report.sources,
    sourceCatalog: report.sourceCatalog,
    ffdec: report.generatedBy.ffdec,
    scriptRaw: await readFile(path.join(root, "scripts/build-ts008-host-function-binding.mjs")),
  });
  assert.equal(derived.status, "blocked-source-contract-drift");
  assert.match(derived.qualificationIssues.join("\n"), /random\(3\)/);
  assert.equal(derived.authority.childToHostFunctionNamesSourceProven, false);
  assert.equal(derived.authority.strictAcceptanceEffect, "none");
});
