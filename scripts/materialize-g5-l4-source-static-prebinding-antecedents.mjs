#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  link,
  lstat,
  mkdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const G5_L4_SOURCE_STATIC_ANTECEDENT_IDS = Object.freeze([
  "course-g05-l04-vb-002",
  "course-g05-l04-vb-005",
  "course-g05-l04-vb-006",
  "course-g05-l04-in-009",
  "course-g05-l04-in-015",
  "course-g05-l04-ts-006",
  "course-g05-l04-ts-002",
  "course-g05-l04-ts-005",
  "course-g05-l04-vb-008",
  "course-g05-l04-vb-009",
  "course-g05-l04-in-020",
  "course-g05-l04-in-012",
  "course-g05-l04-ts-003",
  "course-g05-l04-ts-004",
  "course-g05-l04-rw-003",
  "course-g05-l04-rw-004",
  "course-g05-l04-in-002",
  "course-g05-l04-in-007",
  "course-g05-l04-rw-002",
  "course-g05-l04-in-004",
  "course-g05-l04-in-018",
  "course-g05-l04-in-017",
  "course-g05-l04-in-016",
  "course-g05-l04-in-014",
  "course-g05-l04-in-013",
  "course-g05-l04-in-010",
  "course-g05-l04-in-005",
  "course-g05-l04-in-003",
  "course-g05-l04-vb-007",
  "course-g05-l04-vb-010",
  "course-g05-l04-vb-011",
  "course-g05-l04-ts-008",
  "course-g05-l04-ts-007",
  "course-g05-l04-vb-003",
  "course-g05-l04-vb-004",
  "course-g05-l04-in-006",
  "course-g05-l04-in-008",
  "course-g05-l04-in-011",
  "course-g05-l04-in-019",
  "course-g05-l04-in-021",
  "course-g05-l04-in-022",
  "course-g05-l04-ti-002",
  "course-g05-l04-ti-003",
  "course-g05-l04-ti-004",
  "course-g05-l04-ti-005",
  "course-g05-l04-ti-006",
  "course-g05-l04-ti-007",
  "course-g05-l04-ti-008",
  "course-g05-l04-ti-009",
  "course-g05-l04-gs-002",
  "course-g05-l04-ir-001-a662633d",
]);

const SHA256 = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

async function readOrdinaryFile(filePath, label) {
  const information = await lstat(filePath);
  invariant(information.isFile() && !information.isSymbolicLink(),
    `${label} must be an ordinary non-symlink file`);
  invariant(information.nlink === 1, `${label} must have exactly one hard link`);
  const bytes = await readFile(filePath);
  return {
    bytes,
    device: information.dev,
    inode: information.ino,
    sha256: digest(bytes),
    text: bytes.toString("utf8"),
  };
}

async function readOptionalOrdinaryFile(filePath, label) {
  try {
    return await readOrdinaryFile(filePath, label);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function parseJson(artifact, label) {
  try {
    return JSON.parse(artifact.text);
  } catch (error) {
    throw new Error(`${label} is not valid JSON`, {cause: error});
  }
}

function antecedentPaths(animationId) {
  const evidenceRoot =
    `migrations/${animationId}/evidence/source-static-prebinding-antecedents`;
  return {
    scenario: `${evidenceRoot}/scenario-inventory.json`,
    disposition: `${evidenceRoot}/frame-domain-disposition.json`,
  };
}

function legacyAntecedentPaths(animationId) {
  const auditRoot = `migrations/${animationId}/audit`;
  return {
    scenario:
      `${auditRoot}/source-static-prebinding-scenario-inventory.json`,
    disposition:
      `${auditRoot}/source-static-prebinding-frame-domain-disposition.json`,
  };
}

function livePaths(animationId) {
  const auditRoot = `migrations/${animationId}/audit`;
  return {
    scenario: `${auditRoot}/scenario-inventory.json`,
    disposition: `${auditRoot}/frame-domain-disposition.json`,
  };
}

function absolute(relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required");
  invariant(!path.isAbsolute(relativePath),
    `absolute path is forbidden: ${relativePath}`);
  const resolved = path.resolve(projectRoot, relativePath);
  const relative = path.relative(projectRoot, resolved);
  invariant(relative && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative), `path escapes project root: ${relativePath}`);
  return resolved;
}

function validateAntecedentContent({
  animationId,
  disposition,
  dispositionScenarioSha256,
  scenario,
  scenarioSha256,
  spec,
  targetTimelineId,
}) {
  invariant(scenario.schemaVersion === 1 &&
    scenario.animationId === animationId,
  `${animationId}: scenario antecedent identity drifted`);
  invariant(disposition.schemaVersion === 1 &&
    disposition.animationId === animationId,
  `${animationId}: frame-domain antecedent identity drifted`);
  invariant(
    disposition.status ===
      "structurally-enumerated-dispositions-unresolved",
    `${animationId}: antecedent disposition must remain unresolved`,
  );
  invariant(
    disposition.summary?.dispositionCounts?.unresolved > 0,
    `${animationId}: antecedent must retain unresolved timelines`,
  );
  const target = disposition.timelines?.find(
    ({timelineId}) => timelineId === targetTimelineId,
  );
  invariant(target?.disposition === "unresolved",
    `${animationId}: antecedent target timeline was not unresolved`);
  const root = disposition.timelines?.find(
    ({timelineId}) => timelineId === "root",
  );
  invariant(root?.frameCount === spec.timeline.root.frameCount &&
    target.frameCount === spec.timeline.local.frameCount,
  `${animationId}: antecedent frame counts differ from the specification`);
  invariant(
    disposition.generatedFrom?.scenarioInventory?.sha256 === scenarioSha256 &&
    dispositionScenarioSha256 === scenarioSha256 &&
    root.sourceEvidence?.scenarioInventorySha256 === scenarioSha256 &&
    target.sourceEvidence?.scenarioInventorySha256 === scenarioSha256,
    `${animationId}: frame-domain antecedent is not bound to the scenario antecedent`,
  );
  invariant(
    disposition.generatedFrom?.sourceSwf?.sha256 ===
      spec.source.swfSha256 &&
    scenario.source?.swfSha256 === spec.source.swfSha256 &&
    scenario.source?.pairedFlaStatus ===
      (spec.source.pairedFlaStatus ?? "present") &&
    scenario.source?.fla === spec.source.fla &&
    scenario.source?.flaSha256 === spec.source.flaSha256,
    `${animationId}: antecedent source hashes differ from the specification`,
  );
  invariant(
    scenario.source?.stage?.width === spec.timeline.stage.width &&
    scenario.source?.stage?.height === spec.timeline.stage.height &&
    scenario.source?.fps === spec.timeline.fps &&
    scenario.source?.rootFrameCount === spec.timeline.root.frameCount,
    `${animationId}: antecedent stage or root timing differs from the specification`,
  );
  const scenarioRoot = scenario.timelineInventory?.find(
    ({timelineId}) => timelineId === "root",
  );
  const scenarioTarget = scenario.timelineInventory?.find(
    ({timelineId}) => timelineId === targetTimelineId,
  );
  invariant(
    scenarioRoot?.frameCount === spec.timeline.root.frameCount &&
    scenarioTarget?.frameCount === spec.timeline.local.frameCount,
    `${animationId}: scenario antecedent frame counts differ from the specification`,
  );
}

export function buildAntecedentBoundSpec(spec, {
  dispositionPath,
  dispositionSha256,
  scenarioPath,
  scenarioSha256,
}) {
  const animationId = spec?.animationId;
  invariant(G5_L4_SOURCE_STATIC_ANTECEDENT_IDS.includes(animationId),
    "candidate specification is outside the bounded G5 L4 set");
  invariant(SHA256.test(dispositionSha256) && SHA256.test(scenarioSha256),
    `${animationId}: antecedent SHA-256 is invalid`);
  const {
    scenarioInventory: _scenarioInventory,
    scenarioInventorySha256: _scenarioInventorySha256,
    frameDomainDisposition: _frameDomainDisposition,
    frameDomainDispositionSha256: _frameDomainDispositionSha256,
    prebindingScenarioInventory: _prebindingScenarioInventory,
    prebindingScenarioInventorySha256: _prebindingScenarioInventorySha256,
    prebindingFrameDomainDisposition: _prebindingFrameDomainDisposition,
    prebindingFrameDomainDispositionSha256:
      _prebindingFrameDomainDispositionSha256,
    ...otherEvidence
  } = spec.evidence ?? {};
  return {
    ...spec,
    evidence: {
      prebindingScenarioInventory: scenarioPath,
      prebindingScenarioInventorySha256: scenarioSha256,
      prebindingFrameDomainDisposition: dispositionPath,
      prebindingFrameDomainDispositionSha256: dispositionSha256,
      ...otherEvidence,
    },
    runtimeContract: {
      ...spec.runtimeContract,
      prebindingTargetFrameDomainDisposition: "unresolved",
      currentCanonicalFrameDomainDispositionAsserted: false,
    },
  };
}

function isLegacyLiveBoundSpec(spec, animationId) {
  const live = livePaths(animationId);
  return spec.evidence?.scenarioInventory === live.scenario &&
    SHA256.test(spec.evidence?.scenarioInventorySha256 ?? "") &&
    spec.evidence?.frameDomainDisposition === live.disposition &&
    SHA256.test(spec.evidence?.frameDomainDispositionSha256 ?? "") &&
    spec.evidence?.prebindingScenarioInventory === undefined &&
    spec.evidence?.prebindingFrameDomainDisposition === undefined;
}

function isAntecedentBoundSpecAtPaths(spec, antecedent) {
  return spec.evidence?.prebindingScenarioInventory === antecedent.scenario &&
    SHA256.test(spec.evidence?.prebindingScenarioInventorySha256 ?? "") &&
    spec.evidence?.prebindingFrameDomainDisposition ===
      antecedent.disposition &&
    SHA256.test(
      spec.evidence?.prebindingFrameDomainDispositionSha256 ?? "",
    ) &&
    spec.evidence?.scenarioInventory === undefined &&
    spec.evidence?.scenarioInventorySha256 === undefined &&
    spec.evidence?.frameDomainDisposition === undefined &&
    spec.evidence?.frameDomainDispositionSha256 === undefined &&
    spec.runtimeContract?.prebindingTargetFrameDomainDisposition ===
      "unresolved" &&
    spec.runtimeContract?.currentCanonicalFrameDomainDispositionAsserted ===
      false;
}

function isAntecedentBoundSpec(spec, animationId) {
  return isAntecedentBoundSpecAtPaths(spec, antecedentPaths(animationId));
}

function isLegacyAntecedentBoundSpec(spec, animationId) {
  return isAntecedentBoundSpecAtPaths(
    spec,
    legacyAntecedentPaths(animationId),
  );
}

function renderedJson(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

async function prepare(animationId) {
  const specPath =
    `migrations/${animationId}/audit/source-static-current-js-candidate-spec.json`;
  const specAbsolute = absolute(specPath);
  const specArtifact = await readOrdinaryFile(
    specAbsolute,
    `${animationId}: candidate specification`,
  );
  const spec = parseJson(specArtifact, `${animationId}: candidate specification`);
  invariant(spec.animationId === animationId,
    `${animationId}: candidate specification identity drifted`);
  invariant(/^sprite-\d+$/.test(spec.timeline?.local?.timelineId ?? ""),
    `${animationId}: candidate target timeline is missing`);

  const antecedent = antecedentPaths(animationId);
  const legacyAntecedent = legacyAntecedentPaths(animationId);
  const scenarioAbsolute = absolute(antecedent.scenario);
  const dispositionAbsolute = absolute(antecedent.disposition);
  const legacyScenarioAbsolute = absolute(legacyAntecedent.scenario);
  const legacyDispositionAbsolute = absolute(legacyAntecedent.disposition);
  const [
    existingScenario,
    existingDisposition,
    legacyScenario,
    legacyDisposition,
  ] = await Promise.all([
    readOptionalOrdinaryFile(
      scenarioAbsolute,
      `${animationId}: immutable scenario antecedent`,
    ),
    readOptionalOrdinaryFile(
      dispositionAbsolute,
      `${animationId}: immutable frame-domain antecedent`,
    ),
    readOptionalOrdinaryFile(
      legacyScenarioAbsolute,
      `${animationId}: legacy scenario antecedent`,
    ),
    readOptionalOrdinaryFile(
      legacyDispositionAbsolute,
      `${animationId}: legacy frame-domain antecedent`,
    ),
  ]);

  let scenarioArtifact;
  let dispositionArtifact;
  let createAntecedents = false;
  const removals = [];
  if (isLegacyLiveBoundSpec(spec, animationId)) {
    invariant(
      existingScenario === null && existingDisposition === null &&
      legacyScenario === null && legacyDisposition === null,
      `${animationId}: partial or unbound antecedent files already exist`);
    const live = livePaths(animationId);
    [scenarioArtifact, dispositionArtifact] = await Promise.all([
      readOrdinaryFile(
        absolute(live.scenario),
        `${animationId}: live prebinding scenario inventory`,
      ),
      readOrdinaryFile(
        absolute(live.disposition),
        `${animationId}: live prebinding frame-domain disposition`,
      ),
    ]);
    invariant(
      scenarioArtifact.sha256 === spec.evidence.scenarioInventorySha256,
      `${animationId}: live scenario inventory no longer matches the specification`,
    );
    invariant(
      dispositionArtifact.sha256 ===
        spec.evidence.frameDomainDispositionSha256,
      `${animationId}: live frame-domain disposition no longer matches the specification`,
    );
    createAntecedents = true;
  } else if (isLegacyAntecedentBoundSpec(spec, animationId)) {
    invariant(existingScenario === null && existingDisposition === null,
      `${animationId}: relocated antecedent targets already exist`);
    invariant(legacyScenario && legacyDisposition,
      `${animationId}: legacy antecedent-bound spec is missing its inputs`);
    invariant(
      legacyScenario.sha256 ===
        spec.evidence.prebindingScenarioInventorySha256 &&
      legacyDisposition.sha256 ===
        spec.evidence.prebindingFrameDomainDispositionSha256,
      `${animationId}: legacy antecedent inputs drifted`,
    );
    scenarioArtifact = legacyScenario;
    dispositionArtifact = legacyDisposition;
    createAntecedents = true;
    removals.push(
      {
        path: legacyScenarioAbsolute,
        relativePath: legacyAntecedent.scenario,
        before: legacyScenario,
      },
      {
        path: legacyDispositionAbsolute,
        relativePath: legacyAntecedent.disposition,
        before: legacyDisposition,
      },
    );
  } else {
    invariant(isAntecedentBoundSpec(spec, animationId),
      `${animationId}: specification is neither legacy-live nor antecedent-bound`);
    invariant(existingScenario && existingDisposition,
      `${animationId}: antecedent-bound specification is missing immutable inputs`);
    invariant(legacyScenario === null && legacyDisposition === null,
      `${animationId}: obsolete antecedent paths still exist`);
    scenarioArtifact = existingScenario;
    dispositionArtifact = existingDisposition;
    invariant(
      scenarioArtifact.sha256 ===
        spec.evidence.prebindingScenarioInventorySha256,
      `${animationId}: immutable scenario antecedent drifted`,
    );
    invariant(
      dispositionArtifact.sha256 ===
        spec.evidence.prebindingFrameDomainDispositionSha256,
      `${animationId}: immutable frame-domain antecedent drifted`,
    );
  }

  const scenario = parseJson(
    scenarioArtifact,
    `${animationId}: immutable scenario antecedent`,
  );
  const disposition = parseJson(
    dispositionArtifact,
    `${animationId}: immutable frame-domain antecedent`,
  );
  validateAntecedentContent({
    animationId,
    disposition,
    dispositionScenarioSha256:
      disposition.generatedFrom?.scenarioInventory?.sha256,
    scenario,
    scenarioSha256: scenarioArtifact.sha256,
    spec,
    targetTimelineId: spec.timeline.local.timelineId,
  });
  const updatedSpec = buildAntecedentBoundSpec(spec, {
    dispositionPath: antecedent.disposition,
    dispositionSha256: dispositionArtifact.sha256,
    scenarioPath: antecedent.scenario,
    scenarioSha256: scenarioArtifact.sha256,
  });
  invariant(isAntecedentBoundSpec(updatedSpec, animationId),
    `${animationId}: updated specification is not antecedent-bound`);

  const outputs = [
    {
      path: specAbsolute,
      relativePath: specPath,
      before: specArtifact,
      bytes: renderedJson(updatedSpec),
    },
  ];
  if (createAntecedents) {
    outputs.unshift(
      {
        path: scenarioAbsolute,
        relativePath: antecedent.scenario,
        before: null,
        bytes: scenarioArtifact.bytes,
      },
      {
        path: dispositionAbsolute,
        relativePath: antecedent.disposition,
        before: null,
        bytes: dispositionArtifact.bytes,
      },
    );
  }
  return {animationId, outputs, removals};
}

async function removeIfPresent(filePath) {
  await unlink(filePath).catch((error) => {
    if (error?.code !== "ENOENT") throw error;
  });
}

async function assertPreimage(output) {
  const current = await readOptionalOrdinaryFile(
    output.path,
    `${output.relativePath}: transaction preimage`,
  );
  if (output.before === null) {
    invariant(current === null,
      `${output.relativePath}: target appeared after preflight`);
  } else {
    invariant(current?.sha256 === output.before.sha256,
      `${output.relativePath}: target changed after preflight`);
  }
}

async function applyBatch(prepared) {
  const transaction = randomUUID();
  const outputs = prepared.flatMap(({animationId, outputs: itemOutputs}) =>
    itemOutputs.map((output) => ({
      ...output,
      animationId,
      temporary: `${output.path}.tmp-${process.pid}-${transaction}`,
    })));
  const removals = prepared.flatMap(
    ({animationId, removals: itemRemovals}) =>
      itemRemovals.map((removal) => ({...removal, animationId})),
  );
  invariant(new Set(outputs.map(({path: outputPath}) => outputPath)).size ===
    outputs.length, "antecedent transaction contains duplicate outputs");
  invariant(new Set(removals.map(({path: removalPath}) => removalPath)).size ===
    removals.length, "antecedent transaction contains duplicate removals");
  const installed = [];
  const removed = [];
  try {
    for (const output of outputs) {
      await mkdir(path.dirname(output.path), {recursive: true});
      await writeFile(output.temporary, output.bytes, {flag: "wx"});
    }
    for (const output of outputs) await assertPreimage(output);
    for (const removal of removals) {
      const current = await readOrdinaryFile(
        removal.path,
        `${removal.relativePath}: relocation preimage`,
      );
      invariant(current.sha256 === removal.before.sha256 &&
        current.device === removal.before.device &&
        current.inode === removal.before.inode,
      `${removal.relativePath}: relocation source changed after preflight`);
    }
    for (const output of outputs) {
      if (output.before === null) {
        await link(output.temporary, output.path);
        const information = await lstat(output.path);
        output.installedIdentity = {
          device: information.dev,
          inode: information.ino,
          sha256: digest(output.bytes),
        };
        await unlink(output.temporary);
      } else {
        await rename(output.temporary, output.path);
      }
      installed.push(output);
    }
    for (const removal of removals) {
      const current = await readOrdinaryFile(
        removal.path,
        `${removal.relativePath}: relocation source before removal`,
      );
      invariant(current.sha256 === removal.before.sha256 &&
        current.device === removal.before.device &&
        current.inode === removal.before.inode,
      `${removal.relativePath}: relocation source changed during commit`);
      await unlink(removal.path);
      removed.push(removal);
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const removal of [...removed].reverse()) {
      const rollback =
        `${removal.path}.rollback-${process.pid}-${transaction}`;
      try {
        await writeFile(rollback, removal.before.bytes, {flag: "wx"});
        await link(rollback, removal.path);
        await unlink(rollback);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
        await removeIfPresent(rollback).catch((cleanupError) => {
          rollbackErrors.push(cleanupError);
        });
      }
    }
    for (const output of [...installed].reverse()) {
      try {
        if (output.before === null) {
          const current = await readOrdinaryFile(
            output.path,
            `${output.relativePath}: rollback ownership check`,
          );
          invariant(
            current.sha256 === output.installedIdentity.sha256 &&
            current.device === output.installedIdentity.device &&
            current.inode === output.installedIdentity.inode,
            `${output.relativePath}: refusing to remove a non-transaction file`,
          );
          await unlink(output.path);
        } else {
          const rollback =
            `${output.path}.rollback-${process.pid}-${transaction}`;
          await writeFile(rollback, output.before.bytes, {flag: "wx"});
          await rename(rollback, output.path);
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    await Promise.all(outputs.map(({temporary}) =>
      removeIfPresent(temporary)));
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        "G5 L4 antecedent transaction failed and rollback was incomplete",
      );
    }
    throw error;
  } finally {
    await Promise.all(outputs.map(({temporary}) =>
      removeIfPresent(temporary)));
  }
}

export function parseArguments(argv) {
  const options = {
    mode: "dry-run",
    ids: [...G5_L4_SOURCE_STATIC_ANTECEDENT_IDS],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") {
      invariant(options.mode === "dry-run",
        "--apply cannot be combined with another mode");
      options.mode = "apply";
    } else if (argument === "--check") {
      invariant(options.mode === "dry-run",
        "--check cannot be combined with another mode");
      options.mode = "check";
    } else if (argument === "--id") {
      const value = argv[++index];
      invariant(value, "--id requires a value");
      invariant(G5_L4_SOURCE_STATIC_ANTECEDENT_IDS.includes(value),
        `unsupported animation ID: ${value}`);
      if (options.ids.length === G5_L4_SOURCE_STATIC_ANTECEDENT_IDS.length) {
        options.ids = [];
      }
      invariant(!options.ids.includes(value), `duplicate --id: ${value}`);
      options.ids.push(value);
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

export async function materialize(options = parseArguments([])) {
  const prepared = [];
  for (const animationId of options.ids) {
    prepared.push(await prepare(animationId));
  }
  if (options.mode === "check") {
    for (const {animationId, outputs, removals} of prepared) {
      invariant(outputs.length === 1 && removals.length === 0,
        `${animationId}: antecedent snapshot has not been applied`);
      const [specOutput] = outputs;
      invariant(specOutput.before.text === specOutput.bytes.toString("utf8"),
        `${animationId}: antecedent-bound specification is stale`);
    }
  } else if (options.mode === "apply") {
    await applyBatch(prepared);
  }
  return {
    schemaVersion: 1,
    operation: options.mode,
    memberCount: prepared.length,
    members: prepared.map(({animationId, outputs, removals}) => ({
      animationId,
      outputs: outputs.map((output) => ({
        path: portable(path.relative(projectRoot, output.path)),
        created: output.before === null,
        changed: output.before?.text !== output.bytes.toString("utf8"),
      })),
      relocatedFrom: removals.map((removal) =>
        portable(path.relative(projectRoot, removal.path))),
    })),
    currentCanonicalScenarioInventoryChanged: false,
    currentCanonicalFrameDomainDispositionChanged: false,
    strictAcceptanceEffect: "none",
  };
}

function usage() {
  return [
    "Usage: node scripts/materialize-g5-l4-source-static-prebinding-antecedents.mjs [options]",
    "",
    "Options:",
    "  --apply      Atomically snapshot the bounded immutable prebinding inputs",
    "  --check      Verify immutable inputs and antecedent-bound specs",
    "  --id <id>    Select one bounded candidate; repeatable",
    "  --help       Show this help",
    "",
    "Default is a read-only dry run. Once written, antecedents are never",
    "reconstructed from live scenario or frame-domain artifacts.",
  ].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    process.stdout.write(
      `${JSON.stringify(await materialize(options), null, 2)}\n`,
    );
  }
}
