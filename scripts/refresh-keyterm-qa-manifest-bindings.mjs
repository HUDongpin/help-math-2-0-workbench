#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
  stat,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const KEYTERM_QA_PILOT_IDS = Object.freeze([
  "keyterm-elementary-acute-angle",
  "keyterm-elementary-computeghgh",
]);

export const KEYTERM_QA_BINDINGS = Object.freeze([
  Object.freeze({
    artifactPath: "evidence/keyterm-engineering-qa.json",
    evidenceFileField: "engineeringQaFile",
    hashField: "engineeringQa",
    kind: "engineering",
  }),
  Object.freeze({
    artifactPath: "evidence/behavior-qa.json",
    evidenceFileField: "behaviorQaFile",
    hashField: "behaviorQa",
    kind: "behavior",
  }),
  Object.freeze({
    artifactPath: "evidence/product-qa.json",
    evidenceFileField: "productQaFile",
    hashField: "productQa",
    kind: "product",
  }),
]);

const allowedManifestChangePaths = new Set(
  KEYTERM_QA_BINDINGS.map(({hashField}) => `evidence.evidenceHashes.${hashField}`),
);
const sha256Pattern = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(candidate) {
  return candidate.split(path.sep).join("/");
}

function within(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

async function resolveRegularFile(root, relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, `${label}: path is required`);
  invariant(!path.isAbsolute(relativePath), `${label}: absolute paths are forbidden`);
  const rootReal = await realpath(root);
  const candidate = path.resolve(rootReal, relativePath);
  invariant(within(rootReal, candidate), `${label}: path escapes the project root`);
  const linkInfo = await lstat(candidate);
  invariant(!linkInfo.isSymbolicLink(), `${label}: symbolic links are forbidden`);
  const fileInfo = await stat(candidate);
  invariant(fileInfo.isFile(), `${label}: expected a regular file`);
  const actual = await realpath(candidate);
  invariant(actual === candidate, `${label}: resolved path drifted`);
  return {file: candidate, mode: fileInfo.mode & 0o777};
}

function jsonDiffPaths(before, after, prefix = "") {
  if (Object.is(before, after)) return [];
  const beforeObject = before !== null && typeof before === "object";
  const afterObject = after !== null && typeof after === "object";
  if (!beforeObject || !afterObject || Array.isArray(before) !== Array.isArray(after)) return [prefix];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].flatMap((key) => {
    const child = prefix ? `${prefix}.${key}` : key;
    if (!Object.hasOwn(before, key) || !Object.hasOwn(after, key)) return [child];
    return jsonDiffPaths(before[key], after[key], child);
  });
}

function validateAuthorityBoundary(value, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label}: authorityBoundary is required`);
  invariant(Object.values(value).every((claim) => claim === false), `${label}: authorityBoundary must remain all-false`);
}

function validateQaArtifact(value, binding, animationId, digest) {
  const label = `${animationId}:${binding.artifactPath}`;
  invariant(value?.animationId === animationId, `${label}: animationId mismatch`);
  invariant(value?.acceptanceEffect === "none", `${label}: acceptanceEffect must remain none`);
  invariant(value?.strictAcceptanceEffect === false, `${label}: strictAcceptanceEffect must remain false`);
  validateAuthorityBoundary(value.authorityBoundary, label);
  if (binding.kind === "engineering") {
    invariant(value.schemaVersion === 2, `${label}: engineering schemaVersion must be 2`);
    invariant(
      value.evidenceKind === "keyterm-engineering-candidate-product-qa",
      `${label}: engineering evidenceKind mismatch`,
    );
    invariant(value.generatedBy?.script === "scripts/qa-keyterm-pilots.mjs", `${label}: producer script mismatch`);
  } else {
    invariant(value.schemaVersion === 1, `${label}: derived QA schemaVersion must be 1`);
    invariant(Array.isArray(value.checks) && value.checks.length > 0, `${label}: checks are required`);
    for (const check of value.checks) {
      invariant(Array.isArray(check.evidence) && check.evidence.length > 0, `${label}:${check.id}: evidence is required`);
      for (const item of check.evidence) {
        if (item.path === "evidence/keyterm-engineering-qa.json") {
          invariant(item.sha256 === digest.engineeringQa, `${label}:${check.id}: engineering QA hash is stale`);
        }
      }
    }
  }
}

async function readArtifact(projectRoot, migrationRoot, binding, animationId) {
  const relative = portable(path.relative(projectRoot, path.join(migrationRoot, binding.artifactPath)));
  const resolved = await resolveRegularFile(projectRoot, relative, `${animationId}:${binding.hashField}`);
  const bytes = await readFile(resolved.file);
  return {
    ...binding,
    ...resolved,
    bytes,
    sha256: sha256(bytes),
    value: JSON.parse(bytes.toString("utf8")),
  };
}

function buildUpdatedManifest(manifest, artifacts, animationId) {
  const updated = structuredClone(manifest);
  invariant(updated?.evidence?.evidenceHashes && typeof updated.evidence.evidenceHashes === "object",
    `${animationId}: migration evidenceHashes object is required`);
  for (const artifact of artifacts) {
    invariant(
      updated.evidence[artifact.evidenceFileField] === artifact.artifactPath,
      `${animationId}: ${artifact.evidenceFileField} must equal ${artifact.artifactPath}`,
    );
    invariant(
      typeof updated.evidence.evidenceHashes[artifact.hashField] === "string"
        && sha256Pattern.test(updated.evidence.evidenceHashes[artifact.hashField]),
      `${animationId}: existing ${artifact.hashField} must be a lowercase SHA-256`,
    );
    updated.evidence.evidenceHashes[artifact.hashField] = artifact.sha256;
  }
  const changes = jsonDiffPaths(manifest, updated);
  for (const changed of changes) {
    invariant(allowedManifestChangePaths.has(changed), `${animationId}: unrelated manifest mutation attempted at ${changed}`);
  }
  return {updated, changes};
}

export async function planKeytermQaManifestBinding({
  projectRoot = defaultProjectRoot,
  animationId,
} = {}) {
  invariant(KEYTERM_QA_PILOT_IDS.includes(animationId), `Unsupported key-term QA pilot: ${animationId}`);
  const rootReal = await realpath(projectRoot);
  const migrationRoot = path.join(rootReal, "migrations", animationId);
  const manifestRelative = portable(path.relative(rootReal, path.join(migrationRoot, "migration.json")));
  const manifestFile = await resolveRegularFile(rootReal, manifestRelative, `${animationId}:migration.json`);
  const manifestBytes = await readFile(manifestFile.file);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const canonicalManifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  invariant(
    manifestBytes.equals(canonicalManifestBytes),
    `${animationId}: migration.json is not canonical two-space JSON; refusing a broad formatting rewrite`,
  );
  invariant(manifest.animationId === animationId && manifest.id === animationId,
    `${animationId}: migration identity mismatch`);

  const artifacts = [];
  for (const binding of KEYTERM_QA_BINDINGS) {
    artifacts.push(await readArtifact(rootReal, migrationRoot, binding, animationId));
  }
  const digest = Object.fromEntries(artifacts.map(({hashField, sha256: hash}) => [hashField, hash]));
  for (const artifact of artifacts) validateQaArtifact(artifact.value, artifact, animationId, digest);

  const engineering = artifacts.find(({kind}) => kind === "engineering");
  const producer = await resolveRegularFile(
    rootReal,
    engineering.value.generatedBy.script,
    `${animationId}:engineering producer`,
  );
  const producerBytes = await readFile(producer.file);
  invariant(
    sha256(producerBytes) === engineering.value.generatedBy.scriptSha256,
    `${animationId}: engineering QA producer script hash is stale`,
  );

  const {updated, changes} = buildUpdatedManifest(manifest, artifacts, animationId);
  const updatedBytes = changes.length === 0
    ? manifestBytes
    : Buffer.from(`${JSON.stringify(updated, null, 2)}\n`);
  return {
    animationId,
    projectRoot: rootReal,
    migrationRoot,
    manifestFile: manifestFile.file,
    manifestMode: manifestFile.mode,
    beforeManifestBytes: manifestBytes,
    beforeManifestSha256: sha256(manifestBytes),
    updatedManifestBytes: updatedBytes,
    updatedManifestSha256: sha256(updatedBytes),
    artifacts,
    bindings: artifacts.map(({artifactPath, hashField, sha256: hash}) => ({artifactPath, hashField, sha256: hash})),
    changed: !manifestBytes.equals(updatedBytes),
    changedPaths: changes,
    approvalEffect: "none; current-JavaScript approval is neither renewed nor promoted",
  };
}

async function writeExclusive(candidate, bytes, mode) {
  const handle = await open(candidate, "wx", mode);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function atomicReplace(candidate, bytes, mode) {
  await mkdir(path.dirname(candidate), {recursive: true});
  const temporary = `${candidate}.keyterm-qa-binding-${process.pid}-${randomUUID()}.tmp`;
  try {
    await writeExclusive(temporary, bytes, mode);
    await chmod(temporary, mode);
    await rename(temporary, candidate);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}

async function verifyPlanCurrent(plan, expectedManifestSha256 = plan.beforeManifestSha256) {
  const manifestBytes = await readFile(plan.manifestFile);
  invariant(
    sha256(manifestBytes) === expectedManifestSha256,
    `${plan.animationId}: migration.json drifted after preflight; CAS refused the write`,
  );
  for (const artifact of plan.artifacts) {
    const linkInfo = await lstat(artifact.file);
    const fileInfo = await stat(artifact.file);
    const actual = await realpath(artifact.file);
    const bytes = await readFile(artifact.file);
    invariant(!linkInfo.isSymbolicLink(), `${plan.animationId}:${artifact.hashField}: artifact became a symbolic link`);
    invariant(fileInfo.isFile() && actual === artifact.file,
      `${plan.animationId}:${artifact.hashField}: artifact path drifted after preflight`);
    invariant(
      sha256(bytes) === artifact.sha256,
      `${plan.animationId}:${artifact.hashField}: QA bytes drifted after preflight; CAS refused the write`,
    );
  }
}

async function acquireLock(projectRoot) {
  const lockPath = path.join(projectRoot, "migrations", ".keyterm-qa-manifest-bindings.lock");
  let handle;
  try {
    handle = await open(lockPath, "wx", 0o600);
    await handle.writeFile(`${JSON.stringify({pid: process.pid, script: path.basename(scriptPath)})}\n`);
    await handle.sync();
  } catch (error) {
    if (error.code === "EEXIST") throw new Error("Another key-term QA manifest binding transaction is active");
    throw error;
  }
  return {
    async release() {
      await handle.close();
      await unlink(lockPath);
    },
  };
}

export async function commitKeytermQaManifestBindingPlans(plans, {testHooks = {}} = {}) {
  invariant(Array.isArray(plans) && plans.length > 0, "At least one key-term QA binding plan is required");
  invariant(new Set(plans.map(({animationId}) => animationId)).size === plans.length, "Duplicate binding plans are forbidden");
  const projectRoot = plans[0].projectRoot;
  invariant(plans.every((plan) => plan.projectRoot === projectRoot), "All binding plans must share one project root");
  const lock = await acquireLock(projectRoot);
  const committed = [];
  try {
    for (const plan of plans) await verifyPlanCurrent(plan);
    for (const plan of plans) {
      if (!plan.changed) continue;
      await verifyPlanCurrent(plan);
      await testHooks.beforeReplace?.({animationId: plan.animationId, committedCount: committed.length});
      await atomicReplace(plan.manifestFile, plan.updatedManifestBytes, plan.manifestMode);
      committed.push(plan);
      await verifyPlanCurrent(plan, plan.updatedManifestSha256);
    }
    for (const plan of plans) {
      await verifyPlanCurrent(plan, plan.changed ? plan.updatedManifestSha256 : plan.beforeManifestSha256);
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const plan of [...committed].reverse()) {
      try {
        const current = await readFile(plan.manifestFile);
        invariant(
          sha256(current) === plan.updatedManifestSha256,
          `${plan.animationId}: committed migration drifted before rollback`,
        );
        await atomicReplace(plan.manifestFile, plan.beforeManifestBytes, plan.manifestMode);
        const restored = await readFile(plan.manifestFile);
        invariant(restored.equals(plan.beforeManifestBytes), `${plan.animationId}: rollback byte verification failed`);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length) {
      throw new AggregateError([error, ...rollbackErrors], "Key-term QA binding transaction failed and rollback was incomplete");
    }
    throw error;
  } finally {
    await lock.release();
  }
  return plans;
}

export async function refreshKeytermQaManifestBindings({
  projectRoot = defaultProjectRoot,
  ids = KEYTERM_QA_PILOT_IDS,
  mode = "dry-run",
  testHooks,
} = {}) {
  invariant(["dry-run", "check", "write"].includes(mode), `Unsupported mode: ${mode}`);
  invariant(Array.isArray(ids) && ids.length > 0, "At least one --id is required");
  invariant(new Set(ids).size === ids.length, "Duplicate --id values are forbidden");
  const plans = [];
  for (const animationId of ids) plans.push(await planKeytermQaManifestBinding({projectRoot, animationId}));
  if (mode === "check") {
    const stale = plans.filter(({changed}) => changed);
    invariant(stale.length === 0, `Key-term QA manifest bindings are stale: ${stale.map(({animationId}) => animationId).join(", ")}`);
  } else if (mode === "write") {
    await commitKeytermQaManifestBindingPlans(plans, {testHooks});
  }
  return plans;
}

export function parseArguments(argv) {
  const options = {ids: [], mode: "dry-run", help: false};
  let explicitMode = null;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (["--dry-run", "--check", "--write"].includes(value)) {
      const mode = value.slice(2);
      invariant(explicitMode === null || explicitMode === mode, "--dry-run, --check, and --write are mutually exclusive");
      explicitMode = mode;
      options.mode = mode;
    } else if (value === "--id") {
      const next = argv[index + 1];
      invariant(next && !next.startsWith("--"), "--id requires a value");
      options.ids.push(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  if (options.ids.length === 0) options.ids = [...KEYTERM_QA_PILOT_IDS];
  invariant(new Set(options.ids).size === options.ids.length, "Duplicate --id values are forbidden");
  return options;
}

function usage() {
  return `Usage:
  node scripts/refresh-keyterm-qa-manifest-bindings.mjs --check [--id <keyterm-id>]
  node scripts/refresh-keyterm-qa-manifest-bindings.mjs --write [--id <keyterm-id>]

Reads the existing keyterm-engineering-qa.json, behavior-qa.json, and
product-qa.json bytes and updates only their three migration evidence hashes.
The write is locked, CAS-guarded, atomic per manifest, and rolled back across
the selected pilot set on failure. It does not run browser QA or renew review.`;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const plans = await refreshKeytermQaManifestBindings(options);
    for (const plan of plans) {
      console.log(`${plan.animationId}: ${options.mode === "write" && plan.changed ? "updated" : plan.changed ? "stale" : "current"}`);
      for (const binding of plan.bindings) console.log(`  ${binding.hashField} ${binding.sha256}`);
    }
    if (options.mode === "dry-run" && plans.some(({changed}) => changed)) process.exitCode = 2;
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
