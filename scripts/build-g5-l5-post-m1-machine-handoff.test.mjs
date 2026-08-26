import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  G5_L5_POST_M1_HANDOFF_JSON,
  G5_L5_POST_M1_HANDOFF_MARKDOWN,
  buildG5L5PostM1MachineHandoff,
  commitG5L5PostM1HandoffBatch,
  parseArguments,
  readHandoffInput,
  renderG5L5PostM1MachineHandoffMarkdown,
  stableJson,
  validateG5L5PostM1MachineHandoff,
} from "./build-g5-l5-post-m1-machine-handoff.mjs";

const testPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(testPath), "..");
let canonicalDryRunPromise;

function canonicalDryRun() {
  canonicalDryRunPromise ??= buildG5L5PostM1MachineHandoff({
    projectRoot,
    mode: "dry-run",
  });
  return canonicalDryRunPromise;
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function clone(value) {
  return structuredClone(value);
}

function refingerprint(report) {
  const copy = clone(report);
  delete copy.reportFingerprintSha256;
  copy.reportFingerprintSha256 = hash(Buffer.from(stableJson(copy)));
  return copy;
}

function refingerprintBStage(report, stageKey) {
  const binding = report.staticFrameDomainBStageBindings;
  if (stageKey) {
    const stage = binding.stages[stageKey];
    stage.outputSetSha256 = hash(Buffer.from(stableJson(stage.outputs)));
  }
  binding.sourceSetSha256 = hash(Buffer.from(stableJson(
    Object.entries(binding.stages).map(([key, stage]) => ({key, stage})),
  )));
}

function ownedOutputs({
  json = {
    generatedBy: {
      path: "scripts/build-g5-l5-post-m1-machine-handoff.mjs",
    },
  },
  markdown = "# Fixture\n",
} = {}) {
  return [
    {
      path: G5_L5_POST_M1_HANDOFF_JSON,
      contents: `${JSON.stringify(json)}\n`,
    },
    {
      path: G5_L5_POST_M1_HANDOFF_MARKDOWN,
      contents:
        "<!-- generated-by: scripts/build-g5-l5-post-m1-machine-handoff.mjs -->\n" +
        markdown,
    },
  ];
}

async function snapshot(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  try {
    const [contents, information] = await Promise.all([
      readFile(absolutePath),
      lstat(absolutePath),
    ]);
    return {
      exists: true,
      bytes: contents.length,
      sha256: hash(contents),
      mode: information.mode & 0o777,
    };
  } catch (error) {
    if (error?.code === "ENOENT") return {exists: false};
    throw error;
  }
}

test("CLI requires one explicit mode", () => {
  assert.deepEqual(parseArguments(["--dry-run"]), {mode: "dry-run"});
  assert.deepEqual(parseArguments(["--apply"]), {mode: "apply"});
  assert.deepEqual(parseArguments(["--check"]), {mode: "check"});
  assert.throws(() => parseArguments([]), /usage:/);
  assert.throws(
    () => parseArguments(["--dry-run", "--check"]),
    /usage:/,
  );
  assert.throws(() => parseArguments(["--help"]), /usage:/);
});

test("canonical dry-run binds eight current groups plus five B-stage groups and changes no output", async () => {
  const before = await Promise.all([
    snapshot(G5_L5_POST_M1_HANDOFF_JSON),
    snapshot(G5_L5_POST_M1_HANDOFF_MARKDOWN),
  ]);
  const result = await canonicalDryRun();
  const after = await Promise.all([
    snapshot(G5_L5_POST_M1_HANDOFF_JSON),
    snapshot(G5_L5_POST_M1_HANDOFF_MARKDOWN),
  ]);
  assert.deepEqual(after, before);
  assert.equal(result.action, "planned");
  assert.equal(result.report.release.memberCount, 57);
  assert.equal(result.report.release.pageCount, 56);
  assert.equal(result.report.release.shellCount, 1);
  assert.equal(result.report.inputBindings.currentGroupCount, 8);
  assert.equal(
    result.report.staticFrameDomainBStageBindings.currentStageCount,
    5,
  );
  assert.equal(
    result.report.staticFrameDomainBStageBindings.stages.candidate
      .outputCount,
    2,
  );
  assert.equal(
    result.report.staticFrameDomainBStageBindings.stages.selection
      .outputCount,
    2,
  );
  assert.equal(
    result.report.staticFrameDomainBStageBindings.stages.evidence
      .outputCount,
    28,
  );
  assert.equal(
    result.report.staticFrameDomainBStageBindings.stages.disposition
      .outputCount,
    57,
  );
  assert.equal(
    result.report.staticFrameDomainBStageBindings.stages.coverage
      .outputCount,
    59,
  );
  assert.deepEqual(
    result.report.staticFrameDomainBStageBindings.partition,
    {
      reachableChildTimelineCount: 1047,
      evidenceBoundCompositeChildCount: 696,
      unresolvedReachableChildCount: 351,
      excludedNotProvenCount: 185,
      nestedDefinitionCount: 1232,
    },
  );
  assert.ok(
    result.report.inputBindings.requiredTargetedCheckCommands.includes(
      "npm run verify:g5:l5:static-frame-domain-b-stage",
    ),
  );
  assert.equal(result.report.staticFoundation.definitionCandidateCount, 9767);
  assert.equal(result.report.staticFoundation.scriptCandidateCount, 2456);
  assert.equal(
    result.report.staticFoundation.dependencyCandidateCount,
    6,
  );
  assert.equal(
    result.report.staticFoundation.dependencyOccurrenceCount,
    17,
  );
  assert.equal(
    result.report.staticFoundation
      .structurallyReachableChildTimelineCount,
    1047,
  );
  assert.equal(
    result.report.staticFoundation
      .evidenceBoundCompositeChildDispositionCount,
    696,
  );
  assert.equal(
    result.report.staticFoundation.unresolvedChildDispositionCount,
    351,
  );
  assert.equal(
    result.report.blankHumanBudgetAndSessionState.perSessionNullLeafCount,
    12878,
  );
  assert.equal(
    result.report.blankHumanBudgetAndSessionState.reviewNullLeafCount,
    1848,
  );
  assert.deepEqual(
    Object.values(result.report.executionAndAcceptance),
    Array(Object.keys(result.report.executionAndAcceptance).length).fill(0),
  );
  assert.ok(
    [0, 55].includes(
      result.report.sharedWorktreeValidationException
        .changedG5L4DiagnosticCount,
    ),
  );
  assert.equal(
    result.report.sharedWorktreeValidationException
      .changedG5L5DiagnosticCount,
    0,
  );
  validateG5L5PostM1MachineHandoff(result.report, {
    expectedBindings: result.expectedBindings,
  });
  const markdown = renderG5L5PostM1MachineHandoffMarkdown(
    result.report,
    {expectedBindings: result.expectedBindings},
  );
  assert.match(
    markdown,
    /1,232 = 696 exact proof-bound one-frame composites \+ 351 runtime-unresolved reachable children \+ 185 not-proven\/excluded definitions/,
  );
  assert.match(markdown, /\*\*1,232 = 696 \+ 351 \+ 185\*\*/);
  assert.match(
    markdown,
    /not runtime execution evidence, a visual or audio fidelity\s+finding/,
  );
});

test("aggregate validator requires a trusted current binding anchor", async () => {
  const {report} = await canonicalDryRun();
  assert.throws(
    () => validateG5L5PostM1MachineHandoff(report),
    /trusted current input bindings are required/,
  );
});

test("aggregate validator rejects semantic and descriptor attacks after a valid refingerprint", async () => {
  const {report, expectedBindings} = await canonicalDryRun();
  const cases = [
    {
      label: "M1 implementation authority",
      mutate(candidate) {
        candidate.m1Foundation.implementationAuthorized = true;
      },
      pattern: /widened M1 authority/,
    },
    {
      label: "historical override",
      mutate(candidate) {
        candidate.historicalAuthorityBoundary.overrideAuthorized = true;
      },
      pattern: /historical report authority was promoted/,
    },
    {
      label: "static candidate drift",
      mutate(candidate) {
        candidate.staticFoundation.definitionCandidateCount = 999999;
      },
      pattern: /static candidate totals drifted/,
    },
    {
      label: "per-session template count shrink",
      mutate(candidate) {
        candidate.reviewAndAuthorizationPreparation.perSessionTemplateCount = 1;
      },
      pattern: /unsigned template or review boundary drifted/,
    },
    {
      label: "coverage obligation inflation",
      mutate(candidate) {
        candidate.staticFoundation.scenarioStaticObligations
          .buttonTargetObligations = 999999;
      },
      pattern: /scenario obligation totals drifted/,
    },
    {
      label: "reachable child partition inflation",
      mutate(candidate) {
        candidate.staticFoundation
          .evidenceBoundCompositeChildDispositionCount = 697;
      },
      pattern: /static candidate totals drifted|reachable child partition/,
    },
    {
      label: "B-stage package check removed",
      mutate(candidate) {
        candidate.inputBindings.requiredTargetedCheckCommands =
          candidate.inputBindings.requiredTargetedCheckCommands.filter(
            (command) =>
              command !==
                "npm run verify:g5:l5:static-frame-domain-b-stage",
          );
      },
      pattern: /targeted checks/,
    },
    {
      label: "B-stage partition forged",
      mutate(candidate) {
        candidate.staticFrameDomainBStageBindings.partition
          .evidenceBoundCompositeChildCount = 697;
      },
      pattern: /B-stage exact .* partition drifted/,
    },
    {
      label: "B-stage candidate output descriptor forged",
      mutate(candidate) {
        candidate.staticFrameDomainBStageBindings.stages.candidate
          .outputs[0].sha256 = "1".repeat(64);
        refingerprintBStage(candidate, "candidate");
      },
      pattern: /B-stage candidate output 1: descriptor is not bound/,
    },
    {
      label: "B-stage selection artifact removed",
      mutate(candidate) {
        candidate.staticFrameDomainBStageBindings.stages.selection
          .outputs.pop();
        candidate.staticFrameDomainBStageBindings.stages.selection
          .outputCount = 1;
        refingerprintBStage(candidate, "selection");
      },
      pattern: /B-stage selection contract drifted/,
    },
    {
      label: "B-stage evidence output descriptor forged",
      mutate(candidate) {
        candidate.staticFrameDomainBStageBindings.stages.evidence
          .outputs[0].sha256 = "2".repeat(64);
        refingerprintBStage(candidate, "evidence");
      },
      pattern: /B-stage evidence output 1: descriptor is not bound/,
    },
    {
      label: "B-stage disposition facts promoted",
      mutate(candidate) {
        candidate.staticFrameDomainBStageBindings.stages.disposition
          .facts.evidenceBoundCompositeChildCount = 697;
      },
      pattern: /B-stage disposition contract drifted/,
    },
    {
      label: "B-stage coverage report descriptor forged",
      mutate(candidate) {
        const reportBinding =
          candidate.staticFrameDomainBStageBindings.stages.coverage
            .outputs.find(({path: outputPath}) =>
              outputPath.endsWith(
                "g5-l5-coverage-trace-obligation-matrix.json",
              ));
        reportBinding.sha256 = "3".repeat(64);
        refingerprintBStage(candidate, "coverage");
      },
      pattern: /B-stage coverage output .*descriptor is not bound/,
    },
    {
      label: "B-stage source binding deleted",
      mutate(candidate) {
        delete candidate.staticFrameDomainBStageBindings;
      },
      pattern: /post-M1 handoff: keys drifted/,
    },
    {
      label: "filled person",
      mutate(candidate) {
        candidate.blankHumanBudgetAndSessionState.m1NamedPersonCount = 1;
      },
      pattern: /promoted m1NamedPersonCount/,
    },
    {
      label: "runtime execution",
      mutate(candidate) {
        candidate.executionAndAcceptance.runtimeSessionCount = 1;
      },
      pattern: /execution or acceptance count advanced/,
    },
    {
      label: "review acceptance",
      mutate(candidate) {
        candidate.executionAndAcceptance.reviewAcceptedCount = 1;
      },
      pattern: /execution or acceptance count advanced/,
    },
    {
      label: "Owner acceptance",
      mutate(candidate) {
        candidate.acceptanceEffects.ownerAccepted = true;
      },
      pattern: /acceptance effects/,
    },
    {
      label: "strict completion",
      mutate(candidate) {
        candidate.executionAndAcceptance.strictCompleteCount = 1;
      },
      pattern: /execution or acceptance count advanced/,
    },
    {
      label: "publication",
      mutate(candidate) {
        candidate.executionAndAcceptance.publishedCount = 1;
      },
      pattern: /execution or acceptance count advanced/,
    },
    {
      label: "misclassified shared-worktree exception",
      mutate(candidate) {
        candidate.sharedWorktreeValidationException
          .changedG5L5DiagnosticCount = 1;
      },
      pattern: /shared-worktree ledger exception drifted/,
    },
    {
      label: "all eight upstream report fingerprints forged",
      mutate(candidate) {
        for (const binding of Object.values(candidate.inputBindings.reports)) {
          binding.reportFingerprintSha256 = "a".repeat(64);
        }
        const projection = Object.entries(candidate.inputBindings.reports)
          .map(([key, reportBinding]) => ({
            key,
            report: reportBinding,
            generator: candidate.inputBindings.generators[key],
          }));
        candidate.inputBindings.inputSetSha256 =
          hash(Buffer.from(stableJson(projection)));
      },
      pattern: /aggregate source binding drifted/,
    },
    {
      label: "handoff generator descriptor forged",
      mutate(candidate) {
        candidate.generatedBy.sha256 = "b".repeat(64);
      },
      pattern: /trusted current input/,
    },
    {
      label: "release catalog descriptor forged",
      mutate(candidate) {
        candidate.release.catalog.sha256 = "c".repeat(64);
      },
      pattern: /trusted current input/,
    },
    {
      label: "M1 descriptor and identity forged",
      mutate(candidate) {
        candidate.m1Foundation.report.sha256 = "d".repeat(64);
        candidate.m1Foundation.report.reportType = "forged-m1";
        candidate.m1Foundation.report.reportFingerprintSha256 =
          "e".repeat(64);
      },
      pattern: /trusted current input|M1 authority/,
    },
    {
      label: "completion-ledger descriptor and validator identity forged",
      mutate(candidate) {
        candidate.sharedWorktreeValidationException.currentLedger.sha256 =
          "f".repeat(64);
        candidate.sharedWorktreeValidationException.freshValidator = {
          path: "scripts/forged-validator.mjs",
          sha256: "0".repeat(64),
          version: "999.0.0",
        };
      },
      pattern: /trusted current input|fresh completion-ledger validator/,
    },
    {
      label: "execution object deleted to vacuous truth",
      mutate(candidate) {
        candidate.executionAndAcceptance = {};
      },
      pattern: /execution and acceptance: keys drifted/,
    },
    {
      label: "acceptance object deleted to vacuous truth",
      mutate(candidate) {
        candidate.acceptanceEffects = {};
      },
      pattern: /acceptance effects: keys drifted/,
    },
    {
      label: "release descriptor deleted",
      mutate(candidate) {
        delete candidate.release.catalog;
      },
      pattern: /handoff release: keys drifted/,
    },
    {
      label: "M1 descriptor deleted",
      mutate(candidate) {
        delete candidate.m1Foundation.report;
      },
      pattern: /M1 foundation: keys drifted/,
    },
    {
      label: "completion-ledger descriptor deleted",
      mutate(candidate) {
        delete candidate.sharedWorktreeValidationException.currentLedger;
      },
      pattern: /ledger exception: keys drifted/,
    },
  ];
  for (const entry of cases) {
    const candidate = clone(report);
    entry.mutate(candidate);
    assert.throws(
      () => validateG5L5PostM1MachineHandoff(
        refingerprint(candidate),
        {expectedBindings},
      ),
      entry.pattern,
      entry.label,
    );
  }
});

test("transaction writes exact 0644 outputs under a restrictive umask", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-post-m1-handoff-mode-"),
  );
  await mkdir(path.join(root, "reports"));
  const previousUmask = process.umask(0o077);
  try {
    await commitG5L5PostM1HandoffBatch({
      root,
      outputs: ownedOutputs(),
    });
  } finally {
    process.umask(previousUmask);
  }
  try {
    for (const relativePath of [
      G5_L5_POST_M1_HANDOFF_JSON,
      G5_L5_POST_M1_HANDOFF_MARKDOWN,
    ]) {
      const information = await lstat(path.join(root, relativePath));
      assert.equal(information.isFile(), true);
      assert.equal(information.isSymbolicLink(), false);
      assert.equal(information.nlink, 1);
      assert.equal(information.mode & 0o777, 0o644);
    }
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("transaction rolls back installed output and cleans stage files", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-post-m1-handoff-rollback-"),
  );
  await mkdir(path.join(root, "reports"));
  try {
    await assert.rejects(
      commitG5L5PostM1HandoffBatch({
        root,
        outputs: ownedOutputs(),
        hooks: {
          async afterCommit({index}) {
            if (index === 0) throw new Error("injected commit failure");
          },
        },
      }),
      /injected commit failure/,
    );
    await assert.rejects(
      lstat(path.join(root, G5_L5_POST_M1_HANDOFF_JSON)),
      {code: "ENOENT"},
    );
    await assert.rejects(
      lstat(path.join(root, G5_L5_POST_M1_HANDOFF_MARKDOWN)),
      {code: "ENOENT"},
    );
    const residue = (await readdir(path.join(root, "reports")))
      .filter((name) =>
        name.endsWith(".stage") || name.endsWith(".backup"));
    assert.deepEqual(residue, []);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("transaction refuses a linked output target", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-post-m1-handoff-link-"),
  );
  await mkdir(path.join(root, "reports"));
  await symlink(
    path.join(root, "foreign.json"),
    path.join(root, G5_L5_POST_M1_HANDOFF_JSON),
  );
  try {
    await assert.rejects(
      commitG5L5PostM1HandoffBatch({
        root,
        outputs: ownedOutputs(),
      }),
      /ordinary non-linked 0644 file/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("transaction rejects protected, historical, partial, duplicate, and reordered output sets", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-post-m1-handoff-allowlist-"),
  );
  await mkdir(path.join(root, "reports"));
  await mkdir(path.join(root, "catalog"));
  try {
    const cases = [
      {
        label: "protected and historical paths",
        outputs: [
          {
            path: "catalog/completion-ledger.json",
            contents: "{\"pwned\":true}\n",
          },
          {
            path: "reports/g5-l5-risk-calibration.json",
            contents: "{\"pwned\":true}\n",
          },
        ],
        pattern: /output allowlist/,
      },
      {
        label: "partial output set",
        outputs: ownedOutputs().slice(0, 1),
        pattern: /exactly two outputs/,
      },
      {
        label: "duplicate output",
        outputs: [ownedOutputs()[0], ownedOutputs()[0]],
        pattern: /output allowlist/,
      },
      {
        label: "reordered output set",
        outputs: ownedOutputs().reverse(),
        pattern: /output allowlist/,
      },
    ];
    for (const entry of cases) {
      await assert.rejects(
        commitG5L5PostM1HandoffBatch({
          root,
          outputs: entry.outputs,
        }),
        entry.pattern,
        entry.label,
      );
    }
    await assert.rejects(
      lstat(path.join(root, "catalog/completion-ledger.json")),
      {code: "ENOENT"},
    );
    await assert.rejects(
      lstat(path.join(root, "reports/g5-l5-risk-calibration.json")),
      {code: "ENOENT"},
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("input reader uses a no-follow descriptor and rejects a path swapped after open", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-post-m1-handoff-input-race-"),
  );
  await mkdir(path.join(root, "inputs"));
  const inputPath = path.join(root, "inputs/source.json");
  const movedPath = path.join(root, "inputs/source.moved.json");
  const foreignPath = path.join(root, "inputs/foreign.json");
  await writeFile(inputPath, "{\"trusted\":true}\n", {mode: 0o644});
  await writeFile(foreignPath, "{\"trusted\":false}\n", {mode: 0o644});
  try {
    await assert.rejects(
      readHandoffInput(root, "inputs/source.json", {
        json: true,
        testHooks: {
          async afterOpen() {
            await rename(inputPath, movedPath);
            await symlink(foreignPath, inputPath);
          },
        },
      }),
      /path identity changed during descriptor read/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("transaction compare-and-swap never overwrites a target occupied before install", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-post-m1-handoff-cas-"),
  );
  await mkdir(path.join(root, "reports"));
  const jsonPath = path.join(root, G5_L5_POST_M1_HANDOFF_JSON);
  const foreign = "{\"foreign\":true}\n";
  try {
    await assert.rejects(
      commitG5L5PostM1HandoffBatch({
        root,
        outputs: ownedOutputs(),
        hooks: {
          async beforeInstall({index}) {
            if (index === 0) {
              await writeFile(jsonPath, foreign, {
                flag: "wx",
                mode: 0o644,
              });
            }
          },
        },
      }),
      /EEXIST|exist/i,
    );
    assert.equal((await readFile(jsonPath)).toString("utf8"), foreign);
    await assert.rejects(
      lstat(path.join(root, G5_L5_POST_M1_HANDOFF_MARKDOWN)),
      {code: "ENOENT"},
    );
    const residue = (await readdir(path.join(root, "reports")))
      .filter((name) =>
        name.endsWith(".stage") || name.endsWith(".backup"));
    assert.deepEqual(residue, []);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("materialized report and Markdown are exact ordinary 0644 outputs", async () => {
  const result = await buildG5L5PostM1MachineHandoff({
    projectRoot,
    mode: "check",
  });
  assert.equal(result.action, "verified");
  for (const relativePath of [
    G5_L5_POST_M1_HANDOFF_JSON,
    G5_L5_POST_M1_HANDOFF_MARKDOWN,
  ]) {
    const information = await lstat(path.join(projectRoot, relativePath));
    assert.equal(information.isFile(), true);
    assert.equal(information.isSymbolicLink(), false);
    assert.equal(information.nlink, 1);
    assert.equal(information.mode & 0o777, 0o644);
  }
});
