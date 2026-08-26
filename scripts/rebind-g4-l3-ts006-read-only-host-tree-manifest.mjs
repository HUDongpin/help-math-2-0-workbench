#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rmdir,
} from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

const HASH = /^[a-f0-9]{64}$/;
const MANIFEST_NAME = "staging-manifest.json";
const CONTRACT_POINTER = "/sourceBindings/runtimeAcquisitionContract/sha256";
const FINGERPRINT_POINTER = "/manifestFingerprintSha256";
const ALLOWED_DIFFERENCE_POINTERS = Object.freeze(
  [FINGERPRINT_POINTER, CONTRACT_POINTER].sort((left, right) =>
    left.localeCompare(right, "en"),
  ),
);

const PRODUCTION_AUTHORIZED_TRANSITIONS = Object.freeze([
  Object.freeze({
    sequence: 1,
    historicalContractSha256:
      "a2596b59a530aa97dc8e6ef32162b0a57863ace12747dff852619e17560ff49c",
    currentContractSha256:
      "753745f4bcabf0b3369272390b4aa2e4486e5116901bb5e457cb5e44210313ba",
    historicalManifestSha256:
      "96c06c16661875d43877b32fb9b4c44827d02fc8d0119532022bd17f0dbb2c48",
    expectedManifestSha256:
      "ffcefa89cfe8f08c4da6a351e52bfbe1b9221aca3ef9071a819b2f7733780a25",
    historicalManifestFingerprintSha256:
      "eee05e6b32ceb3f69fbc99107c4c812dcbe795ed03cb62f58fde69e860700126",
    expectedManifestFingerprintSha256:
      "7d3b2d38c706a7e9656d2ab04f66268a419efd43ece20ff442558e04503f2473",
  }),
  Object.freeze({
    sequence: 2,
    historicalContractSha256:
      "753745f4bcabf0b3369272390b4aa2e4486e5116901bb5e457cb5e44210313ba",
    currentContractSha256:
      "73a9c95cb4e2a7772458885f6488afc93212a70e0be12263dff82615ce173948",
    historicalManifestSha256:
      "ffcefa89cfe8f08c4da6a351e52bfbe1b9221aca3ef9071a819b2f7733780a25",
    expectedManifestSha256:
      "d312e9d194281b2208af7bb74c090fe28dbf3f1493c53ab424b01c6453191c58",
    historicalManifestFingerprintSha256:
      "7d3b2d38c706a7e9656d2ab04f66268a419efd43ece20ff442558e04503f2473",
    expectedManifestFingerprintSha256:
      "0ca91a8649207e1baa8d47324b51fb15a38799f11b3d58178a39c01018ff455c",
  }),
]);

export const PRODUCTION_CONFIGURATION = Object.freeze({
  projectRoot: PROJECT_ROOT,
  hostRootRelative:
    "work/original-runtime-host-trees/course-g04-l03-ts-006/root",
  sourceArchiveRelative: "source-assets/flash/HELP MATH_ORIGINAL FILES",
  contractRelative:
    "reports/g4-l3-authoritative-runtime-acquisition-contract.json",
  materializerRelative:
    "scripts/materialize-g4-l3-ts006-read-only-host-tree.mjs",
  transactionRootRelative:
    "work/original-runtime-host-trees/course-g04-l03-ts-006/manifest-rebind-transactions",
  lockRelative:
    "work/original-runtime-host-trees/course-g04-l03-ts-006/.manifest-rebind.lock",
  animationId: "course-g04-l03-ts-006",
  authorizedTransitions: PRODUCTION_AUTHORIZED_TRANSITIONS,
  historicalContractSha256:
    "753745f4bcabf0b3369272390b4aa2e4486e5116901bb5e457cb5e44210313ba",
  currentContractSha256:
    "73a9c95cb4e2a7772458885f6488afc93212a70e0be12263dff82615ce173948",
  historicalManifestSha256:
    "ffcefa89cfe8f08c4da6a351e52bfbe1b9221aca3ef9071a819b2f7733780a25",
  expectedManifestSha256:
    "d312e9d194281b2208af7bb74c090fe28dbf3f1493c53ab424b01c6453191c58",
  historicalManifestFingerprintSha256:
    "7d3b2d38c706a7e9656d2ab04f66268a419efd43ece20ff442558e04503f2473",
  expectedManifestFingerprintSha256:
    "0ca91a8649207e1baa8d47324b51fb15a38799f11b3d58178a39c01018ff455c",
  manifestBytes: 156_481,
  stagedFileCount: 657,
  stagedBytes: 35_469_789,
  fileSetSha256:
    "b6b92f1e95f29117084150d8d0e278e5516514bb1306223d6ac667677aa90a28",
  filesByExtension: Object.freeze({ mp3: 146, swf: 508, xml: 3 }),
  includedRoots: Object.freeze([
    "HELP_COURSES/ELMGR4/L3",
    "HELP_KEYTERMS/KT/ELEMENTARY",
  ]),
  includedExtensions: Object.freeze([".mp3", ".swf", ".xml"]),
  materializer: Object.freeze({
    bytes: 17_156,
    sha256: "d2bfc941d8b52efcee2b0a40d7f47134c000badef01ad046e1bd861b3a8f8cbf",
  }),
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function escapedPointerToken(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

export function jsonDifferencePointers(left, right, pointer = "") {
  if (Object.is(left, right)) return [];
  const leftObject = left !== null && typeof left === "object";
  const rightObject = right !== null && typeof right === "object";
  if (
    !leftObject ||
    !rightObject ||
    Array.isArray(left) !== Array.isArray(right)
  ) {
    return [pointer || "/"];
  }
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort(
    (a, b) => a.localeCompare(b, "en"),
  );
  const differences = [];
  for (const key of keys) {
    const child = `${pointer}/${escapedPointerToken(key)}`;
    if (!Object.hasOwn(left, key) || !Object.hasOwn(right, key)) {
      differences.push(child);
    } else {
      differences.push(...jsonDifferencePointers(left[key], right[key], child));
    }
  }
  return differences;
}

function projectPath(configuration, relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath),
    `invalid project-relative path: ${relativePath}`,
  );
  const resolved = path.resolve(configuration.projectRoot, relativePath);
  const relative = path.relative(configuration.projectRoot, resolved);
  invariant(
    relative &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`,
  );
  return resolved;
}

function normalizedAssetPath(relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `invalid staged asset path: ${relativePath}`,
  );
  const normalized = path.posix.normalize(relativePath);
  invariant(
    normalized === relativePath &&
      normalized !== "." &&
      !normalized.startsWith("../"),
    `staged asset path escapes its allowlist: ${relativePath}`,
  );
  return relativePath;
}

async function lstatOrNull(file) {
  return lstat(file).catch((error) =>
    error.code === "ENOENT" ? null : Promise.reject(error),
  );
}

async function assertRealpathWithin(
  file,
  allowedRoot,
  label,
  { equal = false } = {},
) {
  const [fileReal, rootReal] = await Promise.all([
    realpath(file),
    realpath(allowedRoot),
  ]);
  invariant(
    equal
      ? fileReal === rootReal
      : fileReal.startsWith(`${rootReal}${path.sep}`),
    `${label} escapes its realpath allowlist`,
  );
  return fileReal;
}

async function readRegularSingleLink(
  file,
  label,
  { mode = null, allowedRoot = null } = {},
) {
  const metadata = await lstat(file);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${label} must be one regular non-symlink, single-link file`,
  );
  if (mode !== null) {
    invariant(
      (metadata.mode & 0o777) === mode,
      `${label} mode must be ${mode.toString(8).padStart(4, "0")}`,
    );
  }
  if (allowedRoot) await assertRealpathWithin(file, allowedRoot, label);
  const bytes = await readFile(file);
  return {
    bytes,
    binding: {
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
    metadata: {
      dev: String(metadata.dev),
      ino: String(metadata.ino),
      mode: metadata.mode & 0o777,
      nlink: metadata.nlink,
      size: metadata.size,
    },
  };
}

function withoutFingerprint(manifest) {
  const clone = structuredClone(manifest);
  delete clone.manifestFingerprintSha256;
  return clone;
}

function withContractSha(manifest, contractSha256) {
  const clone = structuredClone(manifest);
  clone.sourceBindings.runtimeAcquisitionContract.sha256 = contractSha256;
  delete clone.manifestFingerprintSha256;
  clone.manifestFingerprintSha256 = sha256(stableJson(clone));
  return clone;
}

const TRANSITION_FIELDS = Object.freeze([
  "historicalContractSha256",
  "currentContractSha256",
  "historicalManifestSha256",
  "expectedManifestSha256",
  "historicalManifestFingerprintSha256",
  "expectedManifestFingerprintSha256",
]);

function activeTransitionFromConfiguration(configuration) {
  return Object.fromEntries(
    TRANSITION_FIELDS.map((field) => [field, configuration[field]]),
  );
}

function authorizedTransitions(configuration) {
  const configured = configuration.authorizedTransitions;
  const transitions = Array.isArray(configured)
    ? configured.map((transition) => ({ ...transition }))
    : [{ sequence: 1, ...activeTransitionFromConfiguration(configuration) }];
  invariant(transitions.length > 0, "authorized transition chain is empty");

  for (const [index, transition] of transitions.entries()) {
    invariant(
      transition.sequence === index + 1,
      "authorized transition sequence must be contiguous and one-indexed",
    );
    for (const field of TRANSITION_FIELDS) {
      invariant(
        HASH.test(transition[field]),
        `authorized transition ${transition.sequence} has invalid ${field}`,
      );
    }
    if (index > 0) {
      const prior = transitions[index - 1];
      invariant(
        transition.historicalContractSha256 === prior.currentContractSha256 &&
          transition.historicalManifestSha256 ===
            prior.expectedManifestSha256 &&
          transition.historicalManifestFingerprintSha256 ===
            prior.expectedManifestFingerprintSha256,
        `authorized transition ${transition.sequence} is not an append-only continuation`,
      );
    }
  }

  const active = transitions.at(-1);
  for (const field of TRANSITION_FIELDS) {
    invariant(
      configuration[field] === active[field],
      `active configuration ${field} is not the final authorized transition`,
    );
  }
  return transitions;
}

function assertAuthorityNeutral(manifest, configuration) {
  invariant(
    manifest.schemaVersion === 1 &&
      manifest.reportType ===
        "g4-l3-ts006-read-only-original-runtime-host-tree" &&
      manifest.selectedCandidate?.animationId === configuration.animationId,
    "host-tree manifest identity drifted",
  );
  invariant(
    manifest.ownership?.sourceAssetsModified === false &&
      manifest.ownership?.sourceFilesHardLinked === false &&
      manifest.ownership?.runtimeExecuted === false &&
      manifest.ownership?.acceptanceEffect === "none" &&
      manifest.executionGate?.cr02TechnicalArtifactPrepared === true &&
      manifest.executionGate?.cr02Approved === false &&
      manifest.executionGate?.originalRuntimeExecutionReady === false &&
      manifest.executionGate?.launchesRuntimeByThisMaterializer === false &&
      manifest.executionGate?.launchesAnimateByThisMaterializer === false &&
      manifest.executionGate?.legacyEndpointsExecutedByThisMaterializer ===
        false &&
      manifest.acceptance?.acceptanceNeutral === true &&
      manifest.acceptance?.readOnlyHostTreeMaterialized === true &&
      manifest.acceptance?.containmentApproved === false &&
      manifest.acceptance?.runtimeApproved === false &&
      manifest.acceptance?.authoritativeOriginalRuntimeAccepted === false &&
      manifest.acceptance?.implementationAuthorized === false &&
      manifest.acceptance?.ownerAccepted === false &&
      manifest.acceptance?.strictMigrationComplete === false,
    "host-tree manifest crossed an authority or acceptance boundary",
  );
}

function validateManifestTransition(
  currentManifest,
  currentBytes,
  configuration,
) {
  invariant(
    Buffer.from(stableJson(currentManifest)).equals(currentBytes),
    "staging manifest is not exact stable JSON",
  );
  invariant(
    HASH.test(currentManifest.manifestFingerprintSha256) &&
      currentManifest.manifestFingerprintSha256 ===
        sha256(stableJson(withoutFingerprint(currentManifest))),
    "staging manifest fingerprint is invalid",
  );
  assertAuthorityNeutral(currentManifest, configuration);

  const historicalManifest = withContractSha(
    currentManifest,
    configuration.historicalContractSha256,
  );
  const expectedManifest = withContractSha(
    currentManifest,
    configuration.currentContractSha256,
  );
  const historicalBytes = Buffer.from(stableJson(historicalManifest));
  const expectedBytes = Buffer.from(stableJson(expectedManifest));
  const historicalSha256 = sha256(historicalBytes);
  const expectedSha256 = sha256(expectedBytes);
  const differences = jsonDifferencePointers(
    historicalManifest,
    expectedManifest,
  ).sort((left, right) => left.localeCompare(right, "en"));

  invariant(
    differences.length === ALLOWED_DIFFERENCE_POINTERS.length &&
      differences.every(
        (pointer, index) => pointer === ALLOWED_DIFFERENCE_POINTERS[index],
      ),
    `manifest transition contains non-allowlisted drift: ${differences.join(", ")}`,
  );
  invariant(
    historicalBytes.length === configuration.manifestBytes &&
      expectedBytes.length === configuration.manifestBytes,
    "historical or expected manifest byte length drifted",
  );
  invariant(
    historicalSha256 === configuration.historicalManifestSha256 &&
      historicalManifest.manifestFingerprintSha256 ===
        configuration.historicalManifestFingerprintSha256,
    "exact historical staging-manifest hash cannot be reconstructed",
  );
  invariant(
    expectedSha256 === configuration.expectedManifestSha256 &&
      expectedManifest.manifestFingerprintSha256 ===
        configuration.expectedManifestFingerprintSha256,
    "exact expected staging-manifest hash drifted",
  );

  const currentSha256 = sha256(currentBytes);
  invariant(
    currentSha256 === historicalSha256 || currentSha256 === expectedSha256,
    "staging manifest is neither the exact historical nor expected CAS state",
  );
  return {
    state: currentSha256 === historicalSha256 ? "historical" : "expected",
    currentSha256,
    historicalManifest,
    historicalBytes,
    historicalSha256,
    expectedManifest,
    expectedBytes,
    expectedSha256,
    changedJsonPointers: differences,
  };
}

function countsByExtension(files) {
  const counts = {};
  for (const file of files) {
    counts[file.extension] = (counts[file.extension] || 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) =>
      left.localeCompare(right, "en"),
    ),
  );
}

function identityFingerprint(rows) {
  return sha256(stableJson(rows));
}

async function verifyContractAndGenerator(
  manifest,
  configuration,
  projectRootReal,
) {
  const contractPath = projectPath(
    configuration,
    configuration.contractRelative,
  );
  const materializerPath = projectPath(
    configuration,
    configuration.materializerRelative,
  );
  const [contractFile, materializerFile] = await Promise.all([
    readRegularSingleLink(contractPath, "runtime acquisition contract", {
      allowedRoot: configuration.projectRoot,
    }),
    readRegularSingleLink(materializerPath, "host-tree materializer", {
      allowedRoot: configuration.projectRoot,
    }),
  ]);
  invariant(
    (await realpath(configuration.projectRoot)) === projectRootReal,
    "project root realpath changed during verification",
  );
  const contract = JSON.parse(contractFile.bytes);
  invariant(
    contractFile.binding.sha256 === configuration.currentContractSha256 &&
      contract.reportType ===
        "g4-l3-authoritative-runtime-acquisition-contract" &&
      contract.schemaVersion === 1 &&
      contract.summary?.canonicalItems === 40,
    "current runtime acquisition contract identity drifted",
  );
  const binding = manifest.sourceBindings?.runtimeAcquisitionContract;
  invariant(
    binding?.file === configuration.contractRelative &&
      binding.bytes === contractFile.binding.bytes &&
      binding.reportType === contract.reportType &&
      binding.schemaVersion === contract.schemaVersion &&
      [
        configuration.historicalContractSha256,
        configuration.currentContractSha256,
      ].includes(binding.sha256),
    "manifest runtime-acquisition binding changed outside its SHA transition",
  );
  invariant(
    materializerFile.binding.bytes === configuration.materializer.bytes &&
      materializerFile.binding.sha256 === configuration.materializer.sha256 &&
      manifest.generator?.file === configuration.materializerRelative &&
      manifest.generator?.bytes === materializerFile.binding.bytes &&
      manifest.generator?.sha256 === materializerFile.binding.sha256,
    "manifest is not compatible with the pinned current materializer",
  );

  const selected = contract.items?.filter(
    (item) => item.animationId === configuration.animationId,
  );
  invariant(
    selected?.length === 1 &&
      manifest.selectedCandidate?.sourceSwf?.path ===
        selected[0].source.swf.path &&
      manifest.selectedCandidate?.sourceSwf?.bytes ===
        selected[0].source.swf.bytes &&
      manifest.selectedCandidate?.sourceSwf?.sha256 ===
        selected[0].source.swf.sha256 &&
      manifest.selectedCandidate?.sourceFlaSha256 ===
        selected[0].source.fla.sha256 &&
      selected[0].authoringGate?.authoringAuditEstablished === true &&
      selected[0].runtimeContainmentPrerequisite
        ?.exactExternalOperationCount === 0 &&
      selected[0].runtimeContainmentPrerequisite
        ?.sideEffectContainmentApproved === false,
    "TS006 candidate or current contract semantics drifted",
  );
  return {
    contract: {
      path: configuration.contractRelative,
      ...contractFile.binding,
      reportType: contract.reportType,
      schemaVersion: contract.schemaVersion,
    },
    materializer: {
      path: configuration.materializerRelative,
      ...materializerFile.binding,
    },
  };
}

async function walkStagedTree(hostRoot, manifestPath) {
  const directories = [];
  const files = [];
  async function visit(directory) {
    const metadata = await lstat(directory);
    invariant(
      metadata.isDirectory() &&
        !metadata.isSymbolicLink() &&
        (metadata.mode & 0o777) === 0o555,
      `${portable(path.relative(hostRoot, directory)) || "."}: staged directory must be real 0555`,
    );
    directories.push({
      path: portable(path.relative(hostRoot, directory)) || ".",
      dev: String(metadata.dev),
      ino: String(metadata.ino),
      mode: metadata.mode & 0o777,
    });
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) =>
      left.name.localeCompare(right.name, "en"),
    )) {
      const child = path.join(directory, entry.name);
      const childMetadata = await lstat(child);
      invariant(
        !childMetadata.isSymbolicLink(),
        `${portable(path.relative(hostRoot, child))}: symlinks are forbidden`,
      );
      if (childMetadata.isDirectory()) {
        await visit(child);
      } else {
        invariant(
          childMetadata.isFile() && childMetadata.nlink === 1,
          `${portable(path.relative(hostRoot, child))}: staged entry must be one regular single-link file`,
        );
        const relative = portable(path.relative(hostRoot, child));
        files.push({
          absolute: child,
          path: relative,
          isManifest: child === manifestPath,
          metadata: childMetadata,
        });
      }
    }
  }
  await visit(hostRoot);
  return { directories, files };
}

async function verifyStagedAssets(
  manifest,
  configuration,
  hostRoot,
  sourceRoot,
  manifestPath,
) {
  invariant(
    manifest.stagedRoot?.path === configuration.hostRootRelative &&
      manifest.stagedRoot?.directoryMode === "0555" &&
      manifest.stagedRoot?.fileMode === "0444" &&
      manifest.stagedRoot?.regularCopiedFilesOnly === true &&
      manifest.stagedRoot?.symbolicLinks === 0 &&
      manifest.stagedRoot?.hardLinks === 0,
    "manifest staged-root controls drifted",
  );
  invariant(
    manifest.sourceBindings?.archiveRoot ===
      configuration.sourceArchiveRelative &&
      stableJson(manifest.sourceBindings?.includedRoots) ===
        stableJson(configuration.includedRoots) &&
      stableJson(manifest.sourceBindings?.includedExtensions) ===
        stableJson(configuration.includedExtensions),
    "manifest source archive allowlist drifted",
  );
  invariant(
    Array.isArray(manifest.files) &&
      manifest.files.length === configuration.stagedFileCount,
    "manifest staged file count drifted",
  );

  const manifestRows = [];
  const stagedIdentities = [];
  const sourceIdentities = [];
  const seen = new Set();
  let stagedByteTotal = 0;
  for (const row of manifest.files) {
    const relative = normalizedAssetPath(row.path);
    invariant(!seen.has(relative), `duplicate staged asset path: ${relative}`);
    seen.add(relative);
    const extension = path.posix.extname(relative).slice(1).toLowerCase();
    invariant(
      row.extension === extension &&
        configuration.includedExtensions.includes(`.${extension}`) &&
        row.stagedMode === "0444" &&
        Number.isSafeInteger(row.bytes) &&
        row.bytes >= 0 &&
        HASH.test(row.sha256),
      `${relative}: manifest file descriptor drifted`,
    );

    const stagedPath = path.join(hostRoot, ...relative.split("/"));
    const sourcePath = path.join(sourceRoot, ...relative.split("/"));
    const [staged, source] = await Promise.all([
      readRegularSingleLink(stagedPath, `${relative}: staged asset`, {
        mode: 0o444,
        allowedRoot: hostRoot,
      }),
      readRegularSingleLink(sourcePath, `${relative}: canonical source`, {
        allowedRoot: sourceRoot,
      }),
    ]);
    invariant(
      staged.binding.bytes === row.bytes &&
        staged.binding.sha256 === row.sha256 &&
        source.binding.bytes === row.bytes &&
        source.binding.sha256 === row.sha256,
      `${relative}: staged or canonical source bytes drifted`,
    );
    stagedByteTotal += row.bytes;
    manifestRows.push({
      path: relative,
      bytes: row.bytes,
      sha256: row.sha256,
      extension: row.extension,
      stagedMode: row.stagedMode,
    });
    stagedIdentities.push({
      path: relative,
      ...staged.metadata,
      sha256: staged.binding.sha256,
    });
    sourceIdentities.push({
      path: relative,
      ...source.metadata,
      sha256: source.binding.sha256,
    });
  }
  const sortedRows = [...manifestRows].sort((left, right) =>
    left.path.localeCompare(right.path, "en"),
  );
  invariant(
    stableJson(sortedRows) === stableJson(manifestRows),
    "manifest staged files are not in canonical path order",
  );
  const fileSetSha256 = sha256(
    Buffer.from(
      manifestRows
        .map(
          (file) =>
            `${file.path}\t${file.bytes}\t${file.sha256}\t${file.stagedMode}`,
        )
        .join("\n"),
    ),
  );
  invariant(
    fileSetSha256 === manifest.fileSetSha256 &&
      fileSetSha256 === configuration.fileSetSha256,
    "manifest staged file-set fingerprint drifted",
  );
  invariant(
    stagedByteTotal === configuration.stagedBytes &&
      manifest.summary?.files === configuration.stagedFileCount &&
      manifest.summary?.bytes === configuration.stagedBytes &&
      stableJson(manifest.summary?.filesByExtension) ===
        stableJson(configuration.filesByExtension) &&
      stableJson(countsByExtension(manifestRows)) ===
        stableJson(configuration.filesByExtension) &&
      manifest.summary?.sourceFlasCopied === 0 &&
      manifest.summary?.sourceActionScriptFilesCopied === 0 &&
      manifest.summary?.runtimeSessionsExecuted === 0 &&
      manifest.summary?.containmentControlsApproved === 0 &&
      manifest.summary?.strictCompletions === 0,
    "manifest staged summary or authority counters drifted",
  );

  const walked = await walkStagedTree(hostRoot, manifestPath);
  const walkedAssets = walked.files
    .filter((file) => !file.isManifest)
    .map((file) => file.path)
    .sort((left, right) => left.localeCompare(right, "en"));
  const expectedAssets = [...seen].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  invariant(
    stableJson(walkedAssets) === stableJson(expectedAssets) &&
      walked.files.filter((file) => file.isManifest).length === 1,
    "staged root contains a missing, extra, or misplaced entry",
  );
  return {
    fileSetSha256,
    stagedAssetsSha256: identityFingerprint(stagedIdentities),
    canonicalSourcesSha256: identityFingerprint(sourceIdentities),
    stagedDirectoriesSha256: identityFingerprint(walked.directories),
    stagedIdentities,
    sourceIdentities,
    directories: walked.directories,
  };
}

async function defaultProcessInspector(pid) {
  const { stdout } = await execFileAsync("/bin/ps", [
    "-p",
    String(pid),
    "-o",
    "command=",
  ]);
  return stdout.trim();
}

async function verifyActiveFlashPid(
  activeFlashPid,
  processInspector = defaultProcessInspector,
) {
  if (activeFlashPid === null || activeFlashPid === undefined) {
    return {
      supplied: false,
      pid: null,
      verifiedFlashPlayer: false,
      affectsAuthority: false,
    };
  }
  invariant(
    Number.isSafeInteger(activeFlashPid) && activeFlashPid > 1,
    "active Flash PID must be a positive integer greater than one",
  );
  const command = await processInspector(activeFlashPid);
  invariant(
    typeof command === "string" &&
      command.includes(
        "/Applications/Adobe Animate 2021/Players/Flash Player.app/Contents/MacOS/Flash Player",
      ),
    `PID ${activeFlashPid} is not the expected Flash Player`,
  );
  return {
    supplied: true,
    pid: activeFlashPid,
    verifiedFlashPlayer: true,
    commandSha256: sha256(command),
    affectsAuthority: false,
  };
}

export async function inspectHostTreeManifestRebind({
  configuration = PRODUCTION_CONFIGURATION,
  activeFlashPid = null,
  processInspector = defaultProcessInspector,
} = {}) {
  authorizedTransitions(configuration);
  const projectRootReal = await realpath(configuration.projectRoot);
  const hostRoot = projectPath(configuration, configuration.hostRootRelative);
  const hostParent = path.dirname(hostRoot);
  const sourceRoot = projectPath(
    configuration,
    configuration.sourceArchiveRelative,
  );
  const manifestPath = path.join(hostRoot, MANIFEST_NAME);

  const [hostMetadata, manifestFile] = await Promise.all([
    lstat(hostRoot),
    readRegularSingleLink(manifestPath, "staging manifest", {
      mode: 0o444,
      allowedRoot: hostRoot,
    }),
  ]);
  invariant(
    hostMetadata.isDirectory() &&
      !hostMetadata.isSymbolicLink() &&
      (hostMetadata.mode & 0o777) === 0o555,
    "host-tree root must be one real 0555 directory",
  );
  await assertRealpathWithin(hostRoot, hostParent, "host-tree root");
  await assertRealpathWithin(
    sourceRoot,
    configuration.projectRoot,
    "source archive",
  );

  const manifest = JSON.parse(manifestFile.bytes);
  const transition = validateManifestTransition(
    manifest,
    manifestFile.bytes,
    configuration,
  );
  const [bindings, tree, activeProcess, transitionHistory] = await Promise.all([
    verifyContractAndGenerator(manifest, configuration, projectRootReal),
    verifyStagedAssets(
      manifest,
      configuration,
      hostRoot,
      sourceRoot,
      manifestPath,
    ),
    verifyActiveFlashPid(activeFlashPid, processInspector),
    verifyAppliedTransitionHistory(configuration),
  ]);
  return {
    configuration,
    paths: {
      hostRoot,
      manifestPath,
      sourceRoot,
    },
    manifest,
    manifestMetadata: manifestFile.metadata,
    transition,
    bindings,
    tree,
    activeProcess,
    transitionHistory,
    authorityBoundary: {
      runtimeExecuted: false,
      runtimeAuthorityCreated: false,
      strictCompletionCreated: false,
      ownerAcceptanceCreated: false,
      publicReleaseAuthorized: false,
      acceptanceEffect: "none",
    },
  };
}

function resultFromInspection(inspection, mode, changed = false) {
  return {
    mode,
    state: inspection.transition.state,
    changed,
    manifest: {
      path: inspection.configuration.hostRootRelative + `/${MANIFEST_NAME}`,
      bytes: inspection.transition.expectedBytes.length,
      historicalSha256: inspection.transition.historicalSha256,
      expectedSha256: inspection.transition.expectedSha256,
      historicalFingerprintSha256:
        inspection.transition.historicalManifest.manifestFingerprintSha256,
      expectedFingerprintSha256:
        inspection.transition.expectedManifest.manifestFingerprintSha256,
    },
    transition: {
      sequence: inspection.transitionHistory.activeSequence,
      authorizedTransitionCount:
        inspection.transitionHistory.authorizedTransitions,
      historicalContractSha256:
        inspection.configuration.historicalContractSha256,
      currentContractSha256: inspection.configuration.currentContractSha256,
      changedJsonPointers: inspection.transition.changedJsonPointers,
      exactHistoricalHashReconstructed: true,
      expectedStableJsonCompatibleWithMaterializer: true,
    },
    transitionHistory: inspection.transitionHistory,
    tree: {
      files: inspection.configuration.stagedFileCount,
      bytes: inspection.configuration.stagedBytes,
      fileSetSha256: inspection.tree.fileSetSha256,
      allDirectoriesMode0555: true,
      allStagedFilesMode0444: true,
      stagedAssetsSha256: inspection.tree.stagedAssetsSha256,
      canonicalSourcesSha256: inspection.tree.canonicalSourcesSha256,
      stagedDirectoriesSha256: inspection.tree.stagedDirectoriesSha256,
      stagedAssetPathsOrInodesChanged: false,
    },
    activeProcess: inspection.activeProcess,
    authorityBoundary: inspection.authorityBoundary,
  };
}

async function writeExclusiveImmutable(file, bytes) {
  const descriptor = await open(
    file,
    fsConstants.O_WRONLY |
      fsConstants.O_CREAT |
      fsConstants.O_EXCL |
      fsConstants.O_NOFOLLOW,
    0o444,
  );
  try {
    await descriptor.writeFile(bytes);
    await descriptor.sync();
    await descriptor.chmod(0o444);
    await descriptor.sync();
  } finally {
    await descriptor.close();
  }
}

function fingerprinted(document, field = "receiptFingerprintSha256") {
  const result = structuredClone(document);
  delete result[field];
  result[field] = sha256(stableJson(result));
  return result;
}

async function acquireTransactionLock(configuration) {
  const lockPath = projectPath(configuration, configuration.lockRelative);
  const lockParent = path.dirname(lockPath);
  await mkdir(lockParent, { recursive: true });
  await assertRealpathWithin(
    lockParent,
    configuration.projectRoot,
    "lock parent",
  );
  try {
    await mkdir(lockPath, { mode: 0o700 });
  } catch (error) {
    if (error.code === "EEXIST") {
      throw new Error(
        `manifest rebind transaction lock already exists: ${configuration.lockRelative}`,
      );
    }
    throw error;
  }
  const lockMetadata = await lstat(lockPath);
  invariant(
    lockMetadata.isDirectory() && !lockMetadata.isSymbolicLink(),
    "manifest rebind lock is not a real directory",
  );
  return async () => {
    const current = await lstat(lockPath);
    invariant(
      current.dev === lockMetadata.dev && current.ino === lockMetadata.ino,
      "manifest rebind lock identity changed",
    );
    await rmdir(lockPath);
  };
}

async function inPlaceManifestCas({
  manifestPath,
  expectedCurrentBytes,
  replacementBytes,
  expectedMetadata,
}) {
  invariant(
    expectedCurrentBytes.length === replacementBytes.length,
    "in-place manifest CAS requires equal-length old and new bytes",
  );
  let descriptor;
  let modeMadeWritable = false;
  try {
    const before = await lstat(manifestPath);
    invariant(
      before.isFile() &&
        !before.isSymbolicLink() &&
        before.nlink === 1 &&
        (before.mode & 0o777) === 0o444 &&
        String(before.dev) === expectedMetadata.dev &&
        String(before.ino) === expectedMetadata.ino,
      "manifest CAS path identity or mode drifted before write",
    );
    await chmod(manifestPath, 0o644);
    modeMadeWritable = true;
    descriptor = await open(
      manifestPath,
      fsConstants.O_RDWR | fsConstants.O_NOFOLLOW,
    );
    const opened = await descriptor.stat();
    invariant(
      opened.isFile() &&
        opened.nlink === 1 &&
        String(opened.dev) === expectedMetadata.dev &&
        String(opened.ino) === expectedMetadata.ino,
      "manifest CAS descriptor identity drifted",
    );
    const current = Buffer.alloc(expectedCurrentBytes.length);
    const { bytesRead } = await descriptor.read(current, 0, current.length, 0);
    invariant(
      bytesRead === current.length && current.equals(expectedCurrentBytes),
      "manifest CAS preimage drifted",
    );
    const pathBeforeWrite = await lstat(manifestPath);
    invariant(
      String(pathBeforeWrite.dev) === expectedMetadata.dev &&
        String(pathBeforeWrite.ino) === expectedMetadata.ino,
      "manifest CAS path changed after descriptor open",
    );
    const { bytesWritten } = await descriptor.write(
      replacementBytes,
      0,
      replacementBytes.length,
      0,
    );
    invariant(
      bytesWritten === replacementBytes.length,
      "manifest CAS produced a partial write",
    );
    await descriptor.sync();
    const written = Buffer.alloc(replacementBytes.length);
    const reread = await descriptor.read(written, 0, written.length, 0);
    invariant(
      reread.bytesRead === written.length && written.equals(replacementBytes),
      "manifest CAS write verification failed",
    );
    await descriptor.chmod(0o444);
    modeMadeWritable = false;
    await descriptor.sync();
    const after = await lstat(manifestPath);
    invariant(
      String(after.dev) === expectedMetadata.dev &&
        String(after.ino) === expectedMetadata.ino &&
        after.nlink === 1 &&
        (after.mode & 0o777) === 0o444,
      "manifest CAS path or inode changed after write",
    );
    return {
      dev: String(after.dev),
      ino: String(after.ino),
      inodePreserved: true,
      pathPreserved: true,
    };
  } catch (error) {
    if (descriptor) {
      const opened = await descriptor.stat().catch(() => null);
      if (
        opened &&
        String(opened.dev) === expectedMetadata.dev &&
        String(opened.ino) === expectedMetadata.ino
      ) {
        await descriptor
          .write(expectedCurrentBytes, 0, expectedCurrentBytes.length, 0)
          .catch(() => {});
        await descriptor.sync().catch(() => {});
        await descriptor.chmod(0o444).catch(() => {});
        modeMadeWritable = false;
      }
    }
    if (modeMadeWritable) {
      const currentPath = await lstat(manifestPath).catch(() => null);
      if (
        currentPath &&
        String(currentPath.dev) === expectedMetadata.dev &&
        String(currentPath.ino) === expectedMetadata.ino
      ) {
        await chmod(manifestPath, 0o444).catch(() => {});
      }
    }
    throw error;
  } finally {
    await descriptor?.close().catch(() => {});
  }
}

function assertNonManifestTreeUnchanged(before, after) {
  invariant(
    before.tree.stagedAssetsSha256 === after.tree.stagedAssetsSha256 &&
      before.tree.canonicalSourcesSha256 ===
        after.tree.canonicalSourcesSha256 &&
      before.tree.stagedDirectoriesSha256 ===
        after.tree.stagedDirectoriesSha256,
    "non-manifest host-tree or canonical-source identity changed",
  );
}

function validateFingerprint(document, field = "receiptFingerprintSha256") {
  const fingerprint = document[field];
  const clone = structuredClone(document);
  delete clone[field];
  invariant(
    HASH.test(fingerprint) && fingerprint === sha256(stableJson(clone)),
    `${field} is invalid`,
  );
}

function receiptMatchesTransition(receipt, transition) {
  return (
    receipt.transition?.historicalManifestSha256 ===
      transition.historicalManifestSha256 &&
    receipt.transition?.expectedManifestSha256 ===
      transition.expectedManifestSha256
  );
}

function assertReceiptTransition(receipt, transition, configuration) {
  invariant(
    receipt.schemaVersion === 1 &&
      receipt.recordType ===
        "g4-l3-ts006-read-only-host-tree-manifest-rebind-receipt" &&
      receipt.transition?.historicalContractSha256 ===
        transition.historicalContractSha256 &&
      receipt.transition?.currentContractSha256 ===
        transition.currentContractSha256 &&
      receipt.transition?.historicalManifestSha256 ===
        transition.historicalManifestSha256 &&
      receipt.transition?.expectedManifestSha256 ===
        transition.expectedManifestSha256 &&
      receipt.transition?.historicalManifestFingerprintSha256 ===
        transition.historicalManifestFingerprintSha256 &&
      receipt.transition?.expectedManifestFingerprintSha256 ===
        transition.expectedManifestFingerprintSha256 &&
      receipt.transition?.exactHistoricalHashReconstructed === true &&
      stableJson(receipt.transition?.changedJsonPointers) ===
        stableJson(ALLOWED_DIFFERENCE_POINTERS) &&
      receipt.operation?.scope === "staging-manifest-only-in-place-cas" &&
      receipt.operation?.stagedAssetBytesModified === false &&
      receipt.operation?.stagedAssetPathsModified === false &&
      receipt.operation?.stagedAssetInodesModified === false &&
      receipt.operation?.canonicalSourcesModified === false &&
      receipt.operation?.ledgerModified === false &&
      receipt.operation?.releaseStateModified === false &&
      receipt.before?.fileSetSha256 === configuration.fileSetSha256 &&
      receipt.before?.manifestMetadata?.nlink === 1 &&
      receipt.before?.manifestMetadata?.mode === 0o444 &&
      receipt.verification?.manifestPathPreserved === true &&
      receipt.verification?.manifestInodePreserved === true &&
      receipt.verification?.stagedAssetPathsOrInodesChanged === false &&
      receipt.activeProcess?.affectsAuthority === false &&
      receipt.authorityBoundary?.runtimeAuthorityCreated === false &&
      receipt.authorityBoundary?.strictCompletionCreated === false &&
      receipt.authorityBoundary?.ownerAcceptanceCreated === false &&
      receipt.authorityBoundary?.publicReleaseAuthorized === false &&
      receipt.authorityBoundary?.acceptanceEffect === "none",
    `manifest rebind receipt for transition ${transition.sequence} is invalid`,
  );
}

async function locateAppliedReceipt(configuration, transition) {
  const transactionRoot = projectPath(
    configuration,
    configuration.transactionRootRelative,
  );
  const rootInfo = await lstatOrNull(transactionRoot);
  if (!rootInfo) return null;
  invariant(
    rootInfo.isDirectory() && !rootInfo.isSymbolicLink(),
    "manifest rebind transaction root is not a real directory",
  );
  const entries = await readdir(transactionRoot, { withFileTypes: true });
  for (const entry of entries.sort((left, right) =>
    right.name.localeCompare(left.name, "en"),
  )) {
    invariant(
      !entry.isSymbolicLink(),
      "symlink entry is forbidden in the transaction root",
    );
    if (!entry.isDirectory()) continue;
    const transactionDirectory = path.join(transactionRoot, entry.name);
    const receiptPath = path.join(transactionDirectory, "receipt.json");
    if (!(await lstatOrNull(receiptPath))) continue;
    const transactionInfo = await lstat(transactionDirectory);
    invariant(
      (transactionInfo.mode & 0o777) === 0o555,
      "completed transaction directory must be immutable 0555",
    );
    const receiptFile = await readRegularSingleLink(
      receiptPath,
      "manifest rebind receipt",
      { mode: 0o444, allowedRoot: transactionRoot },
    );
    const receipt = JSON.parse(receiptFile.bytes);
    validateFingerprint(receipt);
    if (receiptMatchesTransition(receipt, transition)) {
      assertReceiptTransition(receipt, transition, configuration);
      invariant(
        receipt.transactionId === entry.name,
        "manifest rebind receipt transaction identity drifted",
      );
      const preimagePath = path.join(
        transactionDirectory,
        "staging-manifest.preimage.json",
      );
      const preimage = await readRegularSingleLink(
        preimagePath,
        "manifest rebind preimage",
        { mode: 0o444, allowedRoot: transactionRoot },
      );
      invariant(
        preimage.binding.bytes === configuration.manifestBytes &&
          preimage.binding.sha256 === transition.historicalManifestSha256,
        "manifest rebind preimage is invalid",
      );
      return {
        transactionId: entry.name,
        receiptPath,
        receipt,
        receiptBinding: receiptFile.binding,
        receiptMetadata: receiptFile.metadata,
        preimagePath,
        preimageBinding: preimage.binding,
        preimageMetadata: preimage.metadata,
      };
    }
  }
  return null;
}

async function verifyAppliedTransitionHistory(configuration) {
  const transitions = authorizedTransitions(configuration);
  const receipts = [];
  for (const transition of transitions.slice(0, -1)) {
    const receipt = await locateAppliedReceipt(configuration, transition);
    invariant(
      receipt,
      `authorized transition ${transition.sequence} lacks its immutable applied receipt`,
    );
    receipts.push({
      sequence: transition.sequence,
      transactionId: receipt.transactionId,
      receiptPath: portable(
        path.relative(configuration.projectRoot, receipt.receiptPath),
      ),
      receiptSha256: receipt.receiptBinding.sha256,
      receiptBytes: receipt.receiptBinding.bytes,
      receiptDev: receipt.receiptMetadata.dev,
      receiptIno: receipt.receiptMetadata.ino,
      preimagePath: portable(
        path.relative(configuration.projectRoot, receipt.preimagePath),
      ),
      preimageSha256: receipt.preimageBinding.sha256,
      preimageBytes: receipt.preimageBinding.bytes,
      immutableDirectoryMode: "0555",
      immutableFileMode: "0444",
      authorityEffect: "none",
    });
  }
  return {
    authorizedTransitions: transitions.length,
    activeSequence: transitions.at(-1).sequence,
    priorReceiptsRequired: Math.max(0, transitions.length - 1),
    priorReceiptsValidated: receipts.length,
    receipts,
  };
}

function transactionRecord({
  transactionId,
  inspection,
  activeProcess,
  phase,
  cas = null,
  rollback = null,
}) {
  const record = {
    schemaVersion: 1,
    recordType: `g4-l3-ts006-read-only-host-tree-manifest-rebind-${phase}`,
    transactionId,
    operation: {
      scope: "staging-manifest-only-in-place-cas",
      hostRoot: inspection.configuration.hostRootRelative,
      manifestPath:
        inspection.configuration.hostRootRelative + `/${MANIFEST_NAME}`,
      transactionArtifactsOutsideStagedRoot: true,
      stagedAssetBytesModified: false,
      stagedAssetPathsModified: false,
      stagedAssetInodesModified: false,
      canonicalSourcesModified: false,
      ledgerModified: false,
      releaseStateModified: false,
    },
    transition: {
      historicalContractSha256:
        inspection.configuration.historicalContractSha256,
      currentContractSha256: inspection.configuration.currentContractSha256,
      historicalManifestSha256:
        inspection.transition.historicalManifestSha256 ??
        inspection.transition.historicalSha256,
      expectedManifestSha256: inspection.transition.expectedSha256,
      historicalManifestFingerprintSha256:
        inspection.transition.historicalManifest.manifestFingerprintSha256,
      expectedManifestFingerprintSha256:
        inspection.transition.expectedManifest.manifestFingerprintSha256,
      changedJsonPointers: inspection.transition.changedJsonPointers,
      exactHistoricalHashReconstructed: true,
    },
    before: {
      manifestMetadata: inspection.manifestMetadata,
      fileSetSha256: inspection.tree.fileSetSha256,
      stagedAssetsSha256: inspection.tree.stagedAssetsSha256,
      canonicalSourcesSha256: inspection.tree.canonicalSourcesSha256,
      stagedDirectoriesSha256: inspection.tree.stagedDirectoriesSha256,
    },
    activeProcess,
    verification: {
      manifestPathPreserved: cas?.pathPreserved ?? null,
      manifestInodePreserved: cas?.inodePreserved ?? null,
      stagedAssetPathsOrInodesChanged: false,
      rollback,
    },
    authorityBoundary: inspection.authorityBoundary,
  };
  return fingerprinted(record);
}

async function createTransactionDirectory(configuration, transactionId) {
  const transactionRoot = projectPath(
    configuration,
    configuration.transactionRootRelative,
  );
  await mkdir(transactionRoot, { recursive: true });
  const hostRoot = projectPath(configuration, configuration.hostRootRelative);
  const transactionRootReal = await assertRealpathWithin(
    transactionRoot,
    configuration.projectRoot,
    "transaction root",
  );
  const hostRootReal = await realpath(hostRoot);
  invariant(
    transactionRootReal !== hostRootReal &&
      !transactionRootReal.startsWith(`${hostRootReal}${path.sep}`),
    "transaction evidence must stay outside the staged root",
  );
  const transactionDirectory = path.join(transactionRoot, transactionId);
  await mkdir(transactionDirectory, { mode: 0o755 });
  return { transactionRoot, transactionDirectory };
}

async function applyManifestRebind({
  configuration,
  activeFlashPid,
  processInspector,
  hooks,
}) {
  const releaseLock = await acquireTransactionLock(configuration);
  try {
    const before = await inspectHostTreeManifestRebind({
      configuration,
      activeFlashPid,
      processInspector,
    });
    if (before.transition.state === "expected") {
      const activeTransition = authorizedTransitions(configuration).at(-1);
      const prior = await locateAppliedReceipt(configuration, activeTransition);
      invariant(
        prior,
        "expected manifest exists without a valid immutable applied receipt",
      );
      return {
        ...resultFromInspection(before, "apply", false),
        transactionId: prior.transactionId,
        receiptPath: portable(
          path.relative(configuration.projectRoot, prior.receiptPath),
        ),
        idempotent: true,
      };
    }

    const transactionId = `${new Date()
      .toISOString()
      .replaceAll(":", "")
      .replaceAll(".", "")}-${randomUUID()}`;
    const { transactionDirectory } = await createTransactionDirectory(
      configuration,
      transactionId,
    );
    const preimagePath = path.join(
      transactionDirectory,
      "staging-manifest.preimage.json",
    );
    const preparedPath = path.join(transactionDirectory, "prepared.json");
    const writeStartedPath = path.join(
      transactionDirectory,
      "write-started.json",
    );
    const receiptPath = path.join(transactionDirectory, "receipt.json");
    const rollbackPath = path.join(transactionDirectory, "rolled-back.json");

    await writeExclusiveImmutable(
      preimagePath,
      before.transition.historicalBytes,
    );
    const prepared = transactionRecord({
      transactionId,
      inspection: before,
      activeProcess: before.activeProcess,
      phase: "prepared",
    });
    await writeExclusiveImmutable(
      preparedPath,
      Buffer.from(stableJson(prepared)),
    );
    await hooks?.afterPrepared?.({ before, transactionDirectory });

    const immediatelyBefore = await inspectHostTreeManifestRebind({
      configuration,
      activeFlashPid,
      processInspector,
    });
    invariant(
      immediatelyBefore.transition.state === "historical" &&
        immediatelyBefore.transition.currentSha256 ===
          before.transition.currentSha256 &&
        stableJson(immediatelyBefore.manifestMetadata) ===
          stableJson(before.manifestMetadata),
      "manifest CAS drifted after immutable preimage preparation",
    );
    assertNonManifestTreeUnchanged(before, immediatelyBefore);
    const writeStarted = fingerprinted({
      schemaVersion: 1,
      recordType:
        "g4-l3-ts006-read-only-host-tree-manifest-rebind-write-started",
      transactionId,
      expectedPreimageSha256: before.transition.historicalSha256,
      expectedReplacementSha256: before.transition.expectedSha256,
      expectedManifestDev: before.manifestMetadata.dev,
      expectedManifestIno: before.manifestMetadata.ino,
      authorityEffect: "none",
    });
    await writeExclusiveImmutable(
      writeStartedPath,
      Buffer.from(stableJson(writeStarted)),
    );

    let cas;
    let wroteExpectedManifest = false;
    try {
      cas = await inPlaceManifestCas({
        manifestPath: before.paths.manifestPath,
        expectedCurrentBytes: before.transition.historicalBytes,
        replacementBytes: before.transition.expectedBytes,
        expectedMetadata: before.manifestMetadata,
      });
      wroteExpectedManifest = true;
      await hooks?.afterWrite?.({ before, transactionDirectory });
      const after = await inspectHostTreeManifestRebind({
        configuration,
        activeFlashPid,
        processInspector,
      });
      invariant(
        after.transition.state === "expected" &&
          after.transition.currentSha256 === before.transition.expectedSha256,
        "post-CAS manifest is not the exact expected state",
      );
      assertNonManifestTreeUnchanged(before, after);
      invariant(
        after.manifestMetadata.dev === before.manifestMetadata.dev &&
          after.manifestMetadata.ino === before.manifestMetadata.ino,
        "manifest path or inode changed during CAS",
      );
      const receipt = transactionRecord({
        transactionId,
        inspection: before,
        activeProcess: before.activeProcess,
        phase: "receipt",
        cas,
      });
      await writeExclusiveImmutable(
        receiptPath,
        Buffer.from(stableJson(receipt)),
      );
      await chmod(transactionDirectory, 0o555);
      return {
        ...resultFromInspection(after, "apply", true),
        transactionId,
        receiptPath: portable(
          path.relative(configuration.projectRoot, receiptPath),
        ),
        preimagePath: portable(
          path.relative(configuration.projectRoot, preimagePath),
        ),
        idempotent: false,
      };
    } catch (error) {
      let rollback = {
        attempted: false,
        restoredHistoricalManifest: false,
        reason: error.message,
      };
      if (wroteExpectedManifest) {
        rollback.attempted = true;
        const currentPath = await lstat(before.paths.manifestPath).catch(
          () => null,
        );
        const currentBytes = currentPath
          ? await readFile(before.paths.manifestPath).catch(() => null)
          : null;
        if (
          currentPath &&
          currentBytes &&
          String(currentPath.dev) === before.manifestMetadata.dev &&
          String(currentPath.ino) === before.manifestMetadata.ino &&
          sha256(currentBytes) === before.transition.expectedSha256
        ) {
          await inPlaceManifestCas({
            manifestPath: before.paths.manifestPath,
            expectedCurrentBytes: before.transition.expectedBytes,
            replacementBytes: before.transition.historicalBytes,
            expectedMetadata: before.manifestMetadata,
          });
          rollback = {
            ...rollback,
            restoredHistoricalManifest: true,
          };
        }
      }
      const rolledBack = transactionRecord({
        transactionId,
        inspection: before,
        activeProcess: before.activeProcess,
        phase: "rolled-back",
        rollback,
      });
      await writeExclusiveImmutable(
        rollbackPath,
        Buffer.from(stableJson(rolledBack)),
      ).catch(() => {});
      await chmod(transactionDirectory, 0o555).catch(() => {});
      const wrapped = new Error(
        `${error.message}; manifest rollback attempted=${rollback.attempted} restored=${rollback.restoredHistoricalManifest}`,
      );
      wrapped.cause = error;
      throw wrapped;
    }
  } finally {
    await releaseLock();
  }
}

export async function runHostTreeManifestRebind({
  mode = "dry-run",
  activeFlashPid = null,
  configuration = PRODUCTION_CONFIGURATION,
  processInspector = defaultProcessInspector,
  hooks = null,
} = {}) {
  invariant(
    ["dry-run", "apply", "check"].includes(mode),
    `unknown manifest rebind mode: ${mode}`,
  );
  if (mode === "apply") {
    return applyManifestRebind({
      configuration,
      activeFlashPid,
      processInspector,
      hooks,
    });
  }
  const inspection = await inspectHostTreeManifestRebind({
    configuration,
    activeFlashPid,
    processInspector,
  });
  if (mode === "check") {
    invariant(
      inspection.transition.state === "expected",
      "staging manifest still has the historical contract binding; run explicit --apply only after review",
    );
    const activeTransition = authorizedTransitions(configuration).at(-1);
    const receipt = await locateAppliedReceipt(configuration, activeTransition);
    invariant(
      receipt,
      "expected manifest lacks a valid immutable applied receipt",
    );
    return {
      ...resultFromInspection(inspection, "check", false),
      receiptPath: portable(
        path.relative(configuration.projectRoot, receipt.receiptPath),
      ),
      transactionId: receipt.transactionId,
    };
  }
  return {
    ...resultFromInspection(inspection, "dry-run", false),
    applyRequired: inspection.transition.state === "historical",
    writesPerformed: 0,
  };
}

export function parseArguments(argv) {
  const options = {
    mode: "dry-run",
    activeFlashPid: null,
    help: false,
  };
  let explicitMode = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (["--dry-run", "--apply", "--check"].includes(argument)) {
      invariant(
        !explicitMode,
        "choose exactly one of --dry-run, --apply, or --check",
      );
      options.mode = argument.slice(2);
      explicitMode = true;
    } else if (argument === "--active-flash-pid") {
      const value = argv[index + 1];
      invariant(value !== undefined, "--active-flash-pid requires a PID");
      options.activeFlashPid = Number(value);
      invariant(
        Number.isSafeInteger(options.activeFlashPid) &&
          options.activeFlashPid > 1,
        "--active-flash-pid must be an integer greater than one",
      );
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

function usage() {
  return [
    "Usage: node scripts/rebind-g4-l3-ts006-read-only-host-tree-manifest.mjs",
    "       [--dry-run | --apply | --check] [--active-flash-pid <pid>]",
    "",
    "--dry-run is the default and performs no writes.",
    "--apply performs an in-place, equal-length CAS of staging-manifest.json only.",
    "--check requires the exact expected manifest plus its immutable transaction receipt.",
    "",
    "The operation never rebuilds or replaces the 657 staged SWF/MP3/XML files,",
    "never edits source-assets, ledgers, or release state, and creates no runtime authority.",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await runHostTreeManifestRebind(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
