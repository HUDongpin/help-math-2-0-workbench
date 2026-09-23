import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildShellCurrentJavascriptContract,
  parseArguments,
  renderMarkdown,
  validateShellCurrentJavascriptContract,
} from "./build-g4-l3-shell-current-js-contract.mjs";

const checkedInPath = new URL("../migrations/shell-course-g04-l03-index-local/audit/source-local-current-javascript-shell-contract.json", import.meta.url);

test("G4 L3 shell contract reproduces source-bound 39-page projection", async () => {
  const [built, checkedIn] = await Promise.all([
    buildShellCurrentJavascriptContract(),
    readFile(checkedInPath, "utf8").then(JSON.parse),
  ]);
  validateShellCurrentJavascriptContract(checkedIn);
  assert.deepEqual(checkedIn, built);
  assert.deepEqual(checkedIn.sections.map(({code, pageCount}) => [code, pageCount]), [
    ["IR", 1], ["RW", 3], ["VB", 8], ["IN", 11], ["TI", 5], ["GS", 1], ["TS", 7], ["FQ", 3],
  ]);
  assert.equal(checkedIn.pages[0].animationId, "course-g04-l03-ir-001-341242cc");
  assert.equal(checkedIn.pages.at(-1).animationId, "course-g04-l03-fq-003");
  assert.equal(checkedIn.pages.filter(({titleSpanish}) => titleSpanish !== null).length, 15);
  assert.equal(checkedIn.pages.filter(({strictRoute}) => strictRoute !== null).length, 0);
  assert.equal(checkedIn.sourceEvidence.staticSequenceConflict.pageCount, 44);
  assert.equal(checkedIn.sourceEvidence.staticSequenceConflict.conflictStatus, "unresolved");
});

test("shell renderer contract separates source scripts from product projection", async () => {
  const contract = await buildShellCurrentJavascriptContract();
  assert.deepEqual(contract.rendererContract.framePhases.map(({id}) => id), [
    "source-root-pre-initialization-unresolved",
    "source-initialization-stop",
    "current-javascript-lesson-map-projection",
  ]);
  assert.deepEqual(contract.rendererContract.framePhases.map(({renderState}) => renderState), [
    "blocked", "blocked", "ready",
  ]);
  assert.equal(contract.sourceBindings.migrationManifest.path, "migrations/shell-course-g04-l03-index-local/migration.json");
  assert.equal(contract.sourceBindings.implementationModule.path, "packages/demos/src/modules/shell-course-g04-l03-index-local.tsx");
  assert.deepEqual(contract.rendererContract.scenarios, [
    "default", "section-ir", "section-rw", "section-vb", "section-in", "section-ti", "section-gs", "section-ts", "section-fq", "quit-confirmation",
  ]);
  assert(contract.rendererContract.externalEffects.every(({enabled}) => enabled === false));
  assert(Object.values(contract.acceptance).every((value) => value === false));
  assert.match(renderMarkdown(contract), /safe structural product candidate/);
});

test("shell contract CLI is explicit", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.throws(() => parseArguments(["--wat"]), /Unknown option/);
});
