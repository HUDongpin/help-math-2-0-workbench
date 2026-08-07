import assert from "node:assert/strict";
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PROJECT_ROOT,
  REPORT_RELATIVE,
  buildTriage,
  checkTriage,
  parseArguments,
  publishTriageNoClobber,
} from "./build-g4-l10-scripted-one-frame-control-triage-v1.mjs";

test("CLI is report-only and rejects mutation, helper, and runtime modes", () => {
  assert.equal(parseArguments(["--dry-run"]), "--dry-run");
  assert.equal(parseArguments(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseArguments(["--check"]), "--check");
  for (const forbidden of ["--apply", "--recover", "--rollback", "--write",
    "--force", "--launch", "--execute-helper", "--install", "--promote"]) {
    assert.throws(() => parseArguments([forbidden]), /Only --dry-run/u);
  }
  assert.throws(() => parseArguments([]), /Choose exactly one/u);
  assert.throws(() => parseArguments(["--check", "--dry-run"]),
    /Choose exactly one/u);
});

test("triage freezes the exact 41 residual pairs across 20 members", async () => {
  const {document} = await buildTriage(PROJECT_ROOT);
  assert.equal(document.status,
    "all-41-scripted-one-frame-pairs-hash-clustered-and-routed-current-dispositions-unresolved");
  assert.equal(document.decision,
    "FREEZE_41_SCRIPTED_ONE_FRAME_ROUTES_KEEP_ALL_41_UNRESOLVED");
  assert.deepEqual(document.exactScriptedPairSet, {
    count: 41,
    sha256: "0dc88548e9669900cbee9e07f79f701234d6fd3eb7d59154f0678046b3c29f68",
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  });
  assert.deepEqual(document.scope, {
    affectedMembers: 20,
    exactPairs: 41,
    exactLocalFrames: 41,
    flaBackedPairs: 21,
    swfOnlyPairs: 20,
    distinctScriptBodyGroups: 15,
    evidenceRoutes: 5,
    directDoActionTagCount: 41,
    ffdecFrameScriptCount: 41,
    attributedDoInitActionCount: 1,
  });
  assert.equal(document.workspaceInputSet.fileCount, 120);
  assert.equal(document.workspaceInputSet.memberCount, 20);
});

test("15 complete script-body hashes are frozen without embedding raw bodies", async () => {
  const {document} = await buildTriage(PROJECT_ROOT);
  const actual = Object.fromEntries(document.bodyGroupSummaries.map((group) =>
    [group.bodySha256, {
      pairs: group.exactPairSet.count,
      bytes: group.bodyBytes,
      lines: group.bodyLines,
      route: group.routeId,
    }]));
  assert.deepEqual(actual, {
    "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db":
      {pairs: 10, bytes: 7, lines: 1, route: "stop-only-one-frame-control"},
    "c25439ba4c079127c9866f139daa22f9a45aa30546e399796f170ddd05991ff0":
      {pairs: 10, bytes: 804, lines: 31, route: "on-enter-frame-geometry-controller"},
    "39593fc8139eef2a1dc9d751fc6a580e07a8ad89a13eb8c8c370ed7d34cb1007":
      {pairs: 7, bytes: 258, lines: 9, route: "wrong-feedback-hyperlink-popup"},
    "e1120288ec6519b2399f6d773ebf3b51ba5a244ed919813aabcf768f3cfa14b1":
      {pairs: 3, bytes: 799, lines: 31, route: "on-enter-frame-geometry-controller"},
    "478b875c921596123bc88792bf5c570ef5e629084e0fb37cdea7bed323d5877d":
      {pairs: 1, bytes: 81, lines: 4, route: "shell-runtime-components"},
    "6174d3022387ced5658f41add6d19c4ba28db7cd7c759e3e4a5af496cf38588f":
      {pairs: 1, bytes: 424, lines: 15, route: "shell-runtime-components"},
    "7ed98c51c4db7d18eedd10fcbdde12bf576e288a7425b21641ec3cc1e9e7fd3c":
      {pairs: 1, bytes: 628, lines: 25, route: "shell-runtime-components"},
    "8f2b2b29f23fce08134cba110f9840a32f4839459d11019a24cceeef420169b1":
      {pairs: 1, bytes: 79, lines: 2, route: "shell-runtime-components"},
    "964a46cbfad0f3abc2a319b0482bb76853784d4e0ab91ffda9993bfb430b044d":
      {pairs: 1, bytes: 40, lines: 2, route: "shell-runtime-components"},
    "96d9453318383cab3051bbb84ebe821ad2e1880805bfb131742a74b41e52ec8c":
      {pairs: 1, bytes: 896, lines: 35, route: "game-dynamic-grid-and-drop"},
    "a23a2606ba75f048a065875895330c456a20cf955af474f8d53f6e58dcb97992":
      {pairs: 1, bytes: 35, lines: 2, route: "shell-runtime-components"},
    "c399086775dd29b859b3b5c52634d3cfc528075f68ad49f5669fedb3bd3ff8e6":
      {pairs: 1, bytes: 766, lines: 49, route: "shell-runtime-components"},
    "c596cb5415dafd8fb0bf52d9d77c2a9412567494c5040e3ffe72300a3553d62d":
      {pairs: 1, bytes: 2030, lines: 52, route: "game-dynamic-grid-and-drop"},
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
      {pairs: 1, bytes: 0, lines: 0, route: "shell-runtime-components"},
    "f57bb0f972842cb82e181db766bee135816ec50f5e34e29eb9541a84b04cc364":
      {pairs: 1, bytes: 3201, lines: 146, route: "shell-runtime-components"},
  });
  assert.ok(document.bodyGroupSummaries.every(({rawScriptBodyIncludedInReport}) =>
    rawScriptBodyIncludedInReport === false));
});

test("five routes preserve exact pair counts and all dispositions", async () => {
  const {document} = await buildTriage(PROJECT_ROOT);
  assert.deepEqual(Object.fromEntries(document.routeSummaries.map(({id,
    exactPairSet, bodyGroupCount}) => [id, {
    pairs: exactPairSet.count,
    bodyGroups: bodyGroupCount,
  }])), {
    "stop-only-one-frame-control": {pairs: 10, bodyGroups: 1},
    "on-enter-frame-geometry-controller": {pairs: 13, bodyGroups: 2},
    "wrong-feedback-hyperlink-popup": {pairs: 7, bodyGroups: 1},
    "game-dynamic-grid-and-drop": {pairs: 2, bodyGroups: 2},
    "shell-runtime-components": {pairs: 9, bodyGroups: 9},
  });
  const timelines = document.members.flatMap(({timelines}) => timelines);
  assert.ok(timelines.every(({currentDisposition,
    canonicalDispositionChangedByThisReport, authoritativeRuntimeEntryEstablished,
    strictAcceptanceEffect}) => currentDisposition === "unresolved"
      && canonicalDispositionChangedByThisReport === false
      && authoritativeRuntimeEntryEstablished === false
      && strictAcceptanceEffect === "none"));
  assert.equal(timelines.filter(({tagAndScriptAudit}) =>
    tagAndScriptAudit.attributedDoInitActionCount === 1)[0].timelineId,
  "sprite-86");
});

test("70 remains current, projections remain unapplied, and authority is absent", async () => {
  const {document} = await buildTriage(PROJECT_ROOT);
  assert.deepEqual(document.residualBoundary, {
    currentRawResidualCountBefore: 70,
    currentRawResidualCountAfter: 70,
    scriptedPairsRemovedFromResidualByThisReport: 0,
    dynamicPlanProjectionNotApplied: {
      selectedPairs: 21,
      projectedResidualIfSeparatelyAuthorizedAndApplied: 49,
      currentResidualAfterThisReport: 70,
    },
    formalRequirementProjectionResidualCount: 74,
    downstream114OutputTransactionInvoked: false,
    downstream114OutputTransactionModesStillProhibited:
      ["--apply", "--dry-run", "--check"],
  });
  assert.ok(Object.values(document.authorityEffects).every((value) =>
    value === false));
  assert.deepEqual(document.implementationBoundary, {
    reportPublicationOnly: true,
    migrationWorkspaceWriteSupported: false,
    dispositionSuccessorGenerated: false,
    applySupported: false,
    recoverSupported: false,
    rollbackSupported: false,
    helperExecutionSupported: false,
    protectedInstallationSupported: false,
    originalRuntimeLaunchSupported: false,
    productionHelperImplementationAuthorized: false,
  });
});

test("report publication is no-clobber and check rejects tamper", async () => {
  const bundle = await buildTriage(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-scripted-one-frame-triage-")));
  await mkdir(path.join(temporaryRoot, "reports"), {recursive: true});
  const result = await publishTriageNoClobber(bundle,
    {outputRoot: temporaryRoot});
  assert.equal(result.disposition, "checked");
  assert.equal(result.exactPairs, 41);
  assert.equal(result.scriptBodyGroups, 15);
  assert.equal(result.evidenceRoutes, 5);
  assert.equal(result.currentResidualCount, 70);
  await assert.rejects(() => publishTriageNoClobber(bundle,
    {outputRoot: temporaryRoot}), /Target must be absent/u);
  const reportPath = path.join(temporaryRoot, REPORT_RELATIVE);
  await chmod(reportPath, 0o644);
  await writeFile(reportPath, "tampered\n", "utf8");
  await chmod(reportPath, 0o444);
  await assert.rejects(() => checkTriage(bundle, temporaryRoot),
    /Input byte count drifted|Input SHA-256 drifted/u);
});

test("a pre-publication failure leaves no report", async () => {
  const bundle = await buildTriage(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-scripted-one-frame-triage-fail-")));
  await mkdir(path.join(temporaryRoot, "reports"), {recursive: true});
  await assert.rejects(() => publishTriageNoClobber(bundle, {
    outputRoot: temporaryRoot,
    beforeWrite: async () => { throw new Error("simulated report stop"); },
  }), /simulated report stop/u);
  await assert.rejects(() => readFile(path.join(temporaryRoot, REPORT_RELATIVE)),
    /ENOENT/u);
});
