#!/usr/bin/env node

import {constants} from "node:fs";
import {createHash, randomBytes} from "node:crypto";
import {
  link,
  lstat,
  open,
  readFile,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH,
  buildStaticCompositeEvidenceDocument,
} from "./build-static-frame-domain-disposition-evidence.mjs";
import {
  G5_L5_STATIC_SELECTION_RECEIPT_RELATIVE_PATH,
  validateG5L5StaticFrameDomainDispositionSelection,
  validateG5L5StaticSelectionReceiptShape,
} from "./build-g5-l5-static-frame-domain-disposition-selection.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_MIGRATIONS_ROOT = path.join(DEFAULT_PROJECT_ROOT, "migrations");
const SCRIPT_RELATIVE =
  "scripts/build-g5-l5-static-frame-domain-disposition-evidence.mjs";
const CANDIDATE_REPORT_RELATIVE =
  "reports/g5-l5-static-frame-domain-disposition-candidates.json";
const EXPECTED_SELECTED_MEMBER_COUNT = 28;
const EXPECTED_CLAIM_COUNT = 696;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!path.isAbsolute(relative) &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`));
}

function resolveProjectPath(projectRoot, relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${relativePath || "path"} must be portable and project-relative`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(
    isWithin(projectRoot, absolutePath) &&
      portable(path.relative(projectRoot, absolutePath)) === relativePath,
    `${relativePath} escapes the project root or is not normalized`,
  );
  return absolutePath;
}

function directoryIdentity(information) {
  return {
    dev: String(information.dev),
    ino: String(information.ino),
    mode: String(information.mode),
  };
}

async function assertOrdinaryAncestorTree(
  projectRoot,
  absolutePath,
  label,
) {
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedPath = path.resolve(absolutePath);
  invariant(
    isWithin(resolvedRoot, resolvedPath),
    `${label} escapes the project root`,
  );
  const rootInformation = await lstat(resolvedRoot, {bigint: true});
  invariant(
    rootInformation.isDirectory() && !rootInformation.isSymbolicLink(),
    `${label} project root must be an ordinary directory`,
  );
  const realRoot = await realpath(resolvedRoot);
  let cursor = resolvedRoot;
  for (const component of path.relative(
    resolvedRoot,
    path.dirname(resolvedPath),
  ).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    const information = await lstat(cursor, {bigint: true});
    invariant(
      information.isDirectory() && !information.isSymbolicLink(),
      `${label} ancestor must be an ordinary directory`,
    );
    invariant(
      isWithin(realRoot, await realpath(cursor)),
      `${label} ancestor resolves outside the project root`,
    );
  }
  const parentInformation = await lstat(
    path.dirname(resolvedPath),
    {bigint: true},
  );
  return {
    parentPath: path.dirname(resolvedPath),
    parentIdentity: directoryIdentity(parentInformation),
  };
}

async function readStableOrdinaryAbsolute(
  projectRoot,
  absolutePath,
  label,
) {
  await assertOrdinaryAncestorTree(
    projectRoot,
    absolutePath,
    label,
  );
  const information = await lstat(absolutePath, {bigint: true});
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n,
    `${label} must be an ordinary single-link file`,
  );
  const handle = await open(
    absolutePath,
    constants.O_RDONLY | (constants.O_NOFOLLOW || 0),
  );
  let bytes;
  let descriptorBefore;
  let descriptorAfter;
  try {
    descriptorBefore = await handle.stat({bigint: true});
    invariant(
      descriptorBefore.isFile() &&
        descriptorBefore.nlink === 1n &&
        sameIdentity(
          fileIdentity(information),
          fileIdentity(descriptorBefore),
        ),
      `${label} changed before it was read`,
    );
    bytes = await handle.readFile();
    descriptorAfter = await handle.stat({bigint: true});
  } finally {
    await handle.close();
  }
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    descriptorAfter.isFile() &&
      descriptorAfter.nlink === 1n &&
      after.nlink === 1n &&
      sameIdentity(
        fileIdentity(descriptorBefore),
        fileIdentity(descriptorAfter),
      ) &&
      sameIdentity(
        fileIdentity(descriptorAfter),
        fileIdentity(after),
      ) &&
      BigInt(bytes.length) === after.size,
    `${label} changed while it was read`,
  );
  return {
    absolutePath,
    bytes,
    byteCount: bytes.length,
    sha256: sha256(bytes),
    identity: fileIdentity(after),
  };
}

async function readOrdinaryFile(projectRoot, relativePath, {json = false} = {}) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath);
  const record = await readStableOrdinaryAbsolute(
    projectRoot,
    absolutePath,
    relativePath,
  );
  return {
    ...record,
    path: relativePath,
    ...(json
      ? {document: JSON.parse(record.bytes.toString("utf8"))}
      : {}),
  };
}

function descriptor(record) {
  return {
    path: record.path,
    bytes: record.byteCount,
    sha256: record.sha256,
  };
}

function validateBinding(record, binding, label) {
  invariant(
    binding?.path === record.path &&
      binding.bytes === record.byteCount &&
      binding.sha256 === record.sha256,
    `${label} physical bytes differ from the candidate binding`,
  );
}

function compareTimelineIds(left, right) {
  const leftNumber = Number(String(left).replace(/^sprite-/, ""));
  const rightNumber = Number(String(right).replace(/^sprite-/, ""));
  return leftNumber - rightNumber || String(left).localeCompare(String(right));
}

function selectionEvidenceBinding({
  receiptRecord,
  receipt,
  candidateRecord,
  candidateReport,
  memberSelection,
  materializerRecord,
}) {
  return {
    selection: {
      path: receiptRecord.path,
      sha256: receiptRecord.sha256,
      schemaVersion: receipt.schemaVersion,
      decision: receipt.decision.decision,
      reviewerKind: receipt.decision.reviewerKind,
      humanReviewer: false,
      ownerAcceptance: false,
      artifactFingerprintSha256:
        receipt.artifactFingerprintSha256,
    },
    candidateReport: {
      path: candidateRecord.path,
      sha256: candidateRecord.sha256,
      schemaVersion: candidateReport.schemaVersion,
      reportType: candidateReport.reportType,
      reportFingerprintSha256:
        candidateReport.reportFingerprintSha256,
      acceptedPairSetSha256:
        receipt.acceptedSet.canonicalPairSetSha256,
      excludedPairSetSha256:
        receipt.excludedSet.canonicalPairSetSha256,
    },
    materializer: descriptor(materializerRecord),
    memberSelection: {
      animationId: memberSelection.animationId,
      expectedTimelineCount:
        memberSelection.expectedTimelineCount,
      expectedTimelineIds:
        [...memberSelection.expectedTimelineIds],
    },
  };
}

function validateEvidenceDocument(document, {
  animationId,
  expectedTimelineIds,
  selectionBinding,
}) {
  const sortedExpected = [...expectedTimelineIds].sort(compareTimelineIds);
  const contract = document.claimSetContracts?.[0];
  const sortedClaims = (document.claims || [])
    .map(({timelineId}) => timelineId)
    .sort(compareTimelineIds);
  invariant(
    document.schemaVersion === 2 &&
      document.evidenceType ===
        "static-frame-domain-disposition-evidence" &&
      document.animationId === animationId &&
      document.status === "verified-static-composite-claims" &&
      document.migrationStatusChanged === false &&
      document.claimSetContracts?.length === 1 &&
      contract?.proofType ===
        "single-frame-scriptless-structural-child" &&
      contract.exactMatch === true &&
      contract.expectedTimelineCount === sortedExpected.length &&
      contract.verifiedTimelineCount === sortedExpected.length &&
      JSON.stringify(
        [...(contract.expectedTimelineIds || [])].sort(compareTimelineIds),
      ) === JSON.stringify(sortedExpected) &&
      JSON.stringify(
        [...(contract.verifiedTimelineIds || [])].sort(compareTimelineIds),
      ) === JSON.stringify(sortedExpected) &&
      JSON.stringify(sortedClaims) === JSON.stringify(sortedExpected),
    `${animationId}: static evidence does not pin the exact selected timeline set`,
  );
  invariant(
    document.claims.every((claim) =>
      claim.disposition === "composite-child-with-parent" &&
      claim.role === "single-frame-scriptless-structural-child" &&
      claim.claimScope === "independent-local-playhead-only" &&
      claim.frameCount === 1),
    `${animationId}: static evidence broadened the selected proof class`,
  );
  invariant(
    document.generatedFrom?.reviewedSingleFrameSelection?.selection?.sha256 ===
        selectionBinding.selection.sha256 &&
      document.generatedFrom.reviewedSingleFrameSelection.candidateReport
        ?.sha256 === selectionBinding.candidateReport.sha256 &&
      document.generatedFrom.reviewedSingleFrameSelection.memberSelection
        ?.animationId === animationId &&
      document.generatedFrom.reviewedSingleFrameSelection.selection
        ?.humanReviewer === false &&
      document.generatedFrom.reviewedSingleFrameSelection.selection
        ?.ownerAcceptance === false,
    `${animationId}: static evidence lost the engineering-only selection binding`,
  );
  invariant(
    Object.values(document.acceptanceEffects || {}).length > 0 &&
      Object.values(document.acceptanceEffects).every((value) =>
        value === false) &&
      String(document.strictAcceptanceEffect || "").startsWith("none;"),
    `${animationId}: static evidence advanced acceptance`,
  );
  return true;
}

async function loadContext(projectRoot) {
  const [receiptRecord, candidateRecord, materializerRecord] =
    await Promise.all([
      readOrdinaryFile(
        projectRoot,
        G5_L5_STATIC_SELECTION_RECEIPT_RELATIVE_PATH,
        {json: true},
      ),
      readOrdinaryFile(
        projectRoot,
        CANDIDATE_REPORT_RELATIVE,
        {json: true},
      ),
      readOrdinaryFile(projectRoot, SCRIPT_RELATIVE),
    ]);
  const receipt = receiptRecord.document;
  const candidateReport = candidateRecord.document;
  validateG5L5StaticSelectionReceiptShape(receipt);
  await validateG5L5StaticFrameDomainDispositionSelection(
    receipt,
    {projectRoot},
  );
  invariant(
    receipt.inputs?.candidateReport?.path === candidateRecord.path &&
      receipt.inputs.candidateReport.sha256 === candidateRecord.sha256 &&
      receipt.inputs.candidateReport.reportFingerprintSha256 ===
        candidateReport.reportFingerprintSha256 &&
      receipt.materializers?.evidence?.path === materializerRecord.path &&
      receipt.materializers.evidence.sha256 === materializerRecord.sha256 &&
      receipt.acceptedSet?.memberCount === EXPECTED_SELECTED_MEMBER_COUNT &&
      receipt.acceptedSet?.candidateCount === EXPECTED_CLAIM_COUNT,
    "G5 L5 evidence materializer has stale selection/candidate/self bindings",
  );
  return {
    receiptRecord,
    receipt,
    candidateRecord,
    candidateReport,
    materializerRecord,
    inputRecords: [
      receiptRecord,
      candidateRecord,
      materializerRecord,
    ],
  };
}

async function buildOne(animationId, {
  projectRoot,
  migrationsRoot,
  context,
}) {
  const memberSelection = context.receipt.acceptedSet.members.find(
    (member) => member.animationId === animationId,
  );
  invariant(
    memberSelection,
    `${animationId}: no exact G5 L5 static selection exists`,
  );
  const candidateMember = context.candidateReport.members.find(
    (member) => member.animationId === animationId,
  );
  invariant(
    candidateMember &&
      candidateMember.assetId === memberSelection.assetId &&
      candidateMember.releaseOrdinal === memberSelection.releaseOrdinal &&
      candidateMember.oneFrame.eligibleCandidateCount ===
        memberSelection.expectedTimelineCount &&
      JSON.stringify(
        candidateMember.oneFrame.eligibleCandidates
          .map(({timelineId}) => timelineId)
          .sort(compareTimelineIds),
      ) === JSON.stringify(
        [...memberSelection.expectedTimelineIds].sort(compareTimelineIds),
      ),
    `${animationId}: selected member differs from the candidate report`,
  );
  const binding = candidateMember.bindings;
  const records = {};
  for (const [key, candidateBinding] of Object.entries({
    manifest: binding.migrationManifest,
    inventory: binding.scenarioInventory,
    sourceSwf: binding.physicalSourceSwf,
    swfmill: binding.swfmillStructure,
    scripts: binding.ffdecScripts,
  })) {
    records[key] = await readOrdinaryFile(
      projectRoot,
      candidateBinding.path,
      {json: key === "manifest" || key === "inventory"},
    );
    validateBinding(
      records[key],
      candidateBinding,
      `${animationId}: ${key}`,
    );
  }
  const selectionBinding = selectionEvidenceBinding({
    ...context,
    memberSelection,
  });
  const base = buildStaticCompositeEvidenceDocument({
    animationId,
    manifest: records.manifest.document,
    inventory: records.inventory.document,
    inventorySha256: records.inventory.sha256,
    sourceSwfBytes: records.sourceSwf.bytes,
    swfmillGzip: records.swfmill.bytes,
    scriptsGzip: records.scripts.bytes,
    claimSpecs: [],
    singleFrameClaimSpec: {
      proofType: "single-frame-scriptless-structural-child",
      expectedTimelineCount:
        memberSelection.expectedTimelineCount,
      timelineIds: [...memberSelection.expectedTimelineIds],
    },
    multiFrameClaimSpec: null,
  });
  const document = {
    ...base,
    authorityStatement: [
      ...base.authorityStatement.filter((statement) =>
        !statement.startsWith(
          "A composite-child-with-parent claim is emitted only when",
        )),
      "For this G5 L5 member, the exact eligible ID/count set is additionally bound to the engineering-only lesson-wide selection receipt, trusted candidate-report bytes, physical generator/proof-engine/materializer bytes, release catalog, and canonical accepted/excluded pair-set digests.",
      "The selection supplies no human review, human signature, Owner acceptance, runtime reachability, visual fidelity, audio fidelity, behavior acceptance, strict completion, or publication authority.",
    ],
    generatedFrom: {
      ...base.generatedFrom,
      reviewedSingleFrameSelection: selectionBinding,
    },
  };
  validateEvidenceDocument(document, {
    animationId,
    expectedTimelineIds: memberSelection.expectedTimelineIds,
    selectionBinding,
  });
  const rendered = `${JSON.stringify(document, null, 2)}\n`;
  const outputPath = path.join(
    path.resolve(migrationsRoot),
    animationId,
    STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH,
  );
  invariant(
    isWithin(path.resolve(migrationsRoot), outputPath),
    `${animationId}: evidence output escapes migrations root`,
  );
  return {
    animationId,
    outputPath,
    document,
    rendered,
    sha256: sha256(rendered),
    inputRecords: Object.values(records),
  };
}

async function exists(candidate) {
  return Boolean(await lstat(candidate).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  }));
}

function fileIdentity(information) {
  if (!information) return null;
  return {
    dev: String(information.dev),
    ino: String(information.ino),
    mode: String(information.mode),
    size: String(information.size),
    mtimeNs: String(information.mtimeNs),
    ctimeNs: String(information.ctimeNs),
    nlink: String(information.nlink),
  };
}

function sameIdentity(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sameInodeIdentity(left, right) {
  return left?.dev === right?.dev && left?.ino === right?.ino;
}

function sameDisplacedIdentity(left, right) {
  return [
    "dev",
    "ino",
    "mode",
    "size",
    "mtimeNs",
    "nlink",
  ].every((key) => left?.[key] === right?.[key]);
}

async function snapshotEvidenceOutput(
  projectRoot,
  outputPath,
  animationId,
) {
  const ancestor = await assertOrdinaryAncestorTree(
    projectRoot,
    outputPath,
    `${animationId}: evidence output`,
  );
  const parent = path.dirname(outputPath);
  const parentInformation = await lstat(parent, {bigint: true});
  invariant(
    parentInformation.isDirectory() && !parentInformation.isSymbolicLink(),
    `${animationId}: evidence output parent must be an ordinary directory`,
  );
  const information = await lstat(outputPath, {bigint: true}).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!information) return {exists: false, outputPath, ...ancestor};
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n,
    `${animationId}: evidence output must be an ordinary single-link file`,
  );
  const stable = await readStableOrdinaryAbsolute(
    projectRoot,
    outputPath,
    `${animationId}: evidence output`,
  );
  return {
    exists: true,
    outputPath,
    identity: stable.identity,
    byteCount: stable.byteCount,
    sha256: stable.sha256,
    ...ancestor,
  };
}

async function assertEvidenceParentUnchanged(projectRoot, snapshot, label) {
  const current = await assertOrdinaryAncestorTree(
    projectRoot,
    snapshot.outputPath,
    label,
  );
  invariant(
    current.parentPath === snapshot.parentPath &&
      JSON.stringify(current.parentIdentity) ===
        JSON.stringify(snapshot.parentIdentity),
    `${label}: evidence output parent identity changed after preflight`,
  );
}

async function verifyBoundRecords(projectRoot, records) {
  for (const record of records) {
    const current = await readOrdinaryFile(projectRoot, record.path);
    invariant(
      current.byteCount === record.byteCount &&
        current.sha256 === record.sha256,
      `${record.path}: evidence input changed after preflight`,
    );
  }
}

async function removeExpectedEvidence(
  projectRoot,
  outputPath,
  expectedSha256,
  expectedIdentity,
  label,
) {
  await assertOrdinaryAncestorTree(projectRoot, outputPath, label);
  const information = await lstat(outputPath, {bigint: true}).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!information) return;
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n &&
      sameIdentity(fileIdentity(information), expectedIdentity) &&
      sha256(await readFile(outputPath)) === expectedSha256,
    `${label}: refusing to remove a foreign file`,
  );
  await unlink(outputPath);
}

async function removeOwnedEvidence(
  projectRoot,
  outputPath,
  expectedIdentity,
  label,
) {
  await assertOrdinaryAncestorTree(projectRoot, outputPath, label);
  const information = await lstat(outputPath, {bigint: true}).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!information) return;
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      sameInodeIdentity(fileIdentity(information), expectedIdentity),
    `${label}: refusing to remove a foreign file`,
  );
  await unlink(outputPath);
}

export async function commitG5L5StaticEvidenceOutputs({
  projectRoot,
  results,
  inputRecords,
  hooks = {},
}) {
  const entries = [];
  for (const result of results) {
    const snapshot = await snapshotEvidenceOutput(
      projectRoot,
      result.outputPath,
      result.animationId,
    );
    const nonce = `${process.pid}-${randomBytes(12).toString("hex")}`;
    entries.push({
      ...result,
      snapshot,
      stagePath: `${result.outputPath}.stage-${nonce}`,
      backupPath: `${result.outputPath}.backup-${nonce}`,
      displaced: false,
      installed: false,
      stageIdentity: null,
      stageOwnerIdentity: null,
      backupIdentity: null,
      installedIdentity: null,
      installedOwnerIdentity: null,
    });
  }
  try {
    for (const [index, entry] of entries.entries()) {
      await assertEvidenceParentUnchanged(
        projectRoot,
        entry.snapshot,
        `${entry.animationId}: evidence stage`,
      );
      const handle = await open(
        entry.stagePath,
        constants.O_WRONLY |
          constants.O_CREAT |
          constants.O_EXCL |
          (constants.O_NOFOLLOW || 0),
        0o644,
      );
      try {
        entry.stageOwnerIdentity = fileIdentity(
          await handle.stat({bigint: true}),
        );
        await handle.writeFile(entry.rendered, "utf8");
        await handle.sync();
      } finally {
        await handle.close();
      }
      const staged = await snapshotEvidenceOutput(
        projectRoot,
        entry.stagePath,
        entry.animationId,
      );
      invariant(
        staged.sha256 === entry.sha256 &&
          staged.byteCount === Buffer.byteLength(entry.rendered),
        `${entry.animationId}: staged evidence bytes drifted`,
      );
      entry.stageIdentity = staged.identity;
      await hooks.afterStage?.({entry, index});
    }
    await verifyBoundRecords(projectRoot, inputRecords);
    for (const [index, entry] of entries.entries()) {
      await assertEvidenceParentUnchanged(
        projectRoot,
        entry.snapshot,
        `${entry.animationId}: evidence install`,
      );
      const current = await snapshotEvidenceOutput(
        projectRoot,
        entry.outputPath,
        entry.animationId,
      );
      invariant(
        current.exists === entry.snapshot.exists &&
          (!current.exists ||
            (
              current.sha256 === entry.snapshot.sha256 &&
              sameIdentity(current.identity, entry.snapshot.identity)
            )),
        `${entry.animationId}: evidence output changed before install`,
      );
      if (entry.snapshot.exists) {
        await rename(entry.outputPath, entry.backupPath);
        entry.displaced = true;
        const backup = await snapshotEvidenceOutput(
          projectRoot,
          entry.backupPath,
          entry.animationId,
        );
        invariant(
          backup.sha256 === entry.snapshot.sha256 &&
            backup.byteCount === entry.snapshot.byteCount &&
            sameDisplacedIdentity(
              backup.identity,
              entry.snapshot.identity,
            ),
          `${entry.animationId}: displaced evidence failed CAS verification`,
        );
        entry.backupIdentity = backup.identity;
      }
      await hooks.afterDisplace?.({entry, index});
      const stage = await snapshotEvidenceOutput(
        projectRoot,
        entry.stagePath,
        entry.animationId,
      );
      invariant(
        stage.sha256 === entry.sha256 &&
          stage.byteCount === Buffer.byteLength(entry.rendered) &&
          sameIdentity(stage.identity, entry.stageIdentity),
        `${entry.animationId}: staged evidence changed before install`,
      );
      await link(entry.stagePath, entry.outputPath);
      entry.installed = true;
      entry.installedOwnerIdentity = fileIdentity(
        await lstat(entry.outputPath, {bigint: true}),
      );
      await unlink(entry.stagePath);
      const installed = await snapshotEvidenceOutput(
        projectRoot,
        entry.outputPath,
        entry.animationId,
      );
      invariant(
        installed.sha256 === entry.sha256 &&
          installed.byteCount === Buffer.byteLength(entry.rendered),
        `${entry.animationId}: installed evidence bytes drifted`,
      );
      entry.installedIdentity = installed.identity;
      if (index === 0) await hooks.afterFirstInstall?.({entries});
    }
    await verifyBoundRecords(projectRoot, inputRecords);
    for (const entry of entries) {
      await assertEvidenceParentUnchanged(
        projectRoot,
        entry.snapshot,
        `${entry.animationId}: final evidence CAS`,
      );
      const installed = await snapshotEvidenceOutput(
        projectRoot,
        entry.outputPath,
        entry.animationId,
      );
      invariant(
        installed.sha256 === entry.sha256 &&
          installed.byteCount === Buffer.byteLength(entry.rendered) &&
          sameIdentity(
            installed.identity,
            entry.installedIdentity,
          ),
        `${entry.animationId}: installed evidence changed before commit`,
      );
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const entry of [...entries].reverse()) {
      try {
        await assertEvidenceParentUnchanged(
          projectRoot,
          entry.snapshot,
          `${entry.animationId}: evidence rollback`,
        );
        if (entry.installed) {
          if (entry.installedIdentity) {
            await removeExpectedEvidence(
              projectRoot,
              entry.outputPath,
              entry.sha256,
              entry.installedIdentity,
              `${entry.animationId}: evidence rollback target`,
            );
          } else {
            await removeOwnedEvidence(
              projectRoot,
              entry.outputPath,
              entry.installedOwnerIdentity,
              `${entry.animationId}: evidence rollback linked target`,
            );
          }
          entry.installed = false;
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
      try {
        await assertEvidenceParentUnchanged(
          projectRoot,
          entry.snapshot,
          `${entry.animationId}: evidence rollback`,
        );
        if (entry.displaced) {
          const backup = await snapshotEvidenceOutput(
            projectRoot,
            entry.backupPath,
            entry.animationId,
          );
          invariant(
            backup.sha256 === entry.snapshot.sha256 &&
              sameIdentity(
                backup.identity,
                entry.backupIdentity,
              ),
            `${entry.animationId}: refusing to restore a foreign evidence backup`,
          );
          invariant(
            !(await exists(entry.outputPath)),
            `${entry.animationId}: refusing to overwrite a target occupied during evidence rollback`,
          );
          await link(entry.backupPath, entry.outputPath);
          await unlink(entry.backupPath);
          entry.displaced = false;
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
      if (entry.stagePath) {
        await removeOwnedEvidence(
          projectRoot,
          entry.stagePath,
          entry.stageIdentity || entry.stageOwnerIdentity,
          `${entry.animationId}: evidence stage`,
        ).catch((rollbackError) => rollbackErrors.push(rollbackError));
      }
    }
    if (rollbackErrors.length) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        "static evidence transaction failed and rollback was incomplete",
      );
    }
    throw error;
  }
  const cleanupErrors = [];
  try {
    await hooks.beforeCleanup?.({entries});
  } catch (error) {
    cleanupErrors.push(error);
  }
  for (const entry of entries) {
    if (!entry.displaced) continue;
    try {
      await assertEvidenceParentUnchanged(
        projectRoot,
        entry.snapshot,
        `${entry.animationId}: evidence cleanup`,
      );
      await removeExpectedEvidence(
        projectRoot,
        entry.backupPath,
        entry.snapshot.sha256,
        entry.backupIdentity,
        `${entry.animationId}: evidence backup`,
      );
      entry.displaced = false;
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (cleanupErrors.length) {
    throw new AggregateError(
      cleanupErrors,
      "static evidence transaction committed, but backup cleanup was incomplete",
    );
  }
  return entries;
}

export async function buildG5L5StaticFrameDomainDispositionEvidence(
  options = {},
) {
  invariant(
    !options.ids?.length ||
      new Set(options.ids).size === options.ids.length,
    "G5 L5 static evidence animation IDs must not be repeated",
  );
  invariant(
    options.ids?.length || options.allowFullSelection === true,
    "Full G5 L5 evidence materialization requires internal allowFullSelection: true or explicit unique IDs",
  );
  const projectRoot = path.resolve(
    options.projectRoot || DEFAULT_PROJECT_ROOT,
  );
  const migrationsRoot = path.resolve(
    options.migrationsRoot ||
      (
        projectRoot === DEFAULT_PROJECT_ROOT
          ? DEFAULT_MIGRATIONS_ROOT
          : path.join(projectRoot, "migrations")
      ),
  );
  const context = await loadContext(projectRoot);
  const selectedIds = context.receipt.acceptedSet.members.map(
    ({animationId}) => animationId,
  );
  const ids = options.ids?.length ? options.ids : selectedIds;
  const unknown = ids.filter((animationId) =>
    !selectedIds.includes(animationId));
  invariant(
    unknown.length === 0,
    `No selected G5 L5 static composite claim for: ${unknown.join(", ")}`,
  );
  const results = [];
  for (const animationId of ids) {
    const built = await buildOne(animationId, {
      projectRoot,
      migrationsRoot,
      context,
    });
    if (options.check) {
      const existing = await readStableOrdinaryAbsolute(
        projectRoot,
        built.outputPath,
        `${animationId}: ${STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH}`,
      );
      invariant(
        existing.bytes.equals(Buffer.from(built.rendered, "utf8")),
        `${animationId}: ${STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH} is stale`,
      );
      results.push({...built, action: "verified"});
    } else results.push({...built, action: "pending-write"});
  }
  invariant(
    options.ids?.length ||
      (
        ids.length === EXPECTED_SELECTED_MEMBER_COUNT &&
        JSON.stringify(ids) === JSON.stringify(selectedIds) &&
        results.reduce(
        (total, {document}) => total + document.claims.length,
        0,
        ) === EXPECTED_CLAIM_COUNT
      ),
    "G5 L5 full evidence build did not materialize exactly 696 claims",
  );
  if (!options.check) {
    const inputRecords = [
      ...context.inputRecords,
      ...results.flatMap(({inputRecords}) => inputRecords),
    ];
    const uniqueInputRecords = [...new Map(
      inputRecords.map((record) => [record.path, record]),
    ).values()];
    await commitG5L5StaticEvidenceOutputs({
      projectRoot,
      results,
      inputRecords: uniqueInputRecords,
      hooks: options.transactionHooks || {},
    });
    return results.map((result) => ({...result, action: "written"}));
  }
  return results;
}

export async function verifyG5L5StaticFrameDomainDispositionEvidence(
  animationId,
  options = {},
) {
  const projectRoot = path.resolve(
    options.projectRoot || DEFAULT_PROJECT_ROOT,
  );
  const context = await loadContext(projectRoot);
  if (!context.receipt.acceptedSet.members.some(
    (member) => member.animationId === animationId,
  )) return null;
  const migrationsRoot = path.resolve(
    options.migrationsRoot ||
      (
        projectRoot === DEFAULT_PROJECT_ROOT
          ? DEFAULT_MIGRATIONS_ROOT
          : path.join(projectRoot, "migrations")
      ),
  );
  const built = await buildOne(animationId, {
    projectRoot,
    migrationsRoot,
    context,
  });
  const existing = await readStableOrdinaryAbsolute(
    projectRoot,
    built.outputPath,
    `${animationId}: ${STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH}`,
  );
  invariant(
    existing.bytes.equals(Buffer.from(built.rendered, "utf8")),
    `${animationId}: ${STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH} is stale`,
  );
  return {...built, action: "verified"};
}

export function parseArguments(argv) {
  const options = {
    check: false,
    apply: false,
    allSelected: false,
    ids: [],
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--apply") options.apply = true;
    else if (argument === "--all-selected") options.allSelected = true;
    else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument === "--id") {
      const value = argv[index + 1];
      invariant(
        value && !value.startsWith("--"),
        "--id requires a value",
      );
      options.ids.push(value);
      index += 1;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  if (!options.help) {
    invariant(
      Number(options.check) + Number(options.apply) === 1,
      "choose exactly one explicit mode: --apply or --check",
    );
    invariant(
      options.allSelected !== (options.ids.length > 0),
      "choose exactly one scope: --all-selected or one or more unique --id values",
    );
    invariant(
      new Set(options.ids).size === options.ids.length,
      "G5 L5 static evidence animation IDs must not be repeated",
    );
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      `Usage: node ${SCRIPT_RELATIVE} --apply|--check (--all-selected|--id <animation-id>...)\n`,
    );
    return;
  }
  const results =
    await buildG5L5StaticFrameDomainDispositionEvidence({
      ...options,
      allowFullSelection: options.allSelected,
    });
  process.stdout.write(`${JSON.stringify({
    action: options.check ? "verified" : "written",
    memberCount: results.length,
    claimCount: results.reduce(
      (total, {document}) => total + document.claims.length,
      0,
    ),
    outputs: results.map((result) => ({
      animationId: result.animationId,
      path: portable(path.relative(DEFAULT_PROJECT_ROOT, result.outputPath)),
      bytes: Buffer.byteLength(result.rendered),
      sha256: result.sha256,
    })),
    acceptanceEffect: "none",
  })}\n`);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === SCRIPT_PATH
) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
