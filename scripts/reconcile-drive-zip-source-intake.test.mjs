import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  calculateChecksumSetSha256,
  parseCanonicalCatalog,
  parseZipHashManifest,
  reconcileZipManifest,
  scanHistoricalRoot,
  serializePlanCsv,
  validateCanonicalPrefix,
  validateContainerDriveId,
  validateOutputPaths,
} from "./reconcile-drive-zip-source-intake.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function generatedManifestContent(files, overrides = {}) {
  const normalized = files
    .map((file) => ({
      path: file.path,
      bytes: file.bytes,
      sha256: file.sha256,
    }))
    .sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
  const checksumRecords = normalized.map((file) => ({
    manifestRelativePath: file.path,
    bytes: file.bytes,
    sha256: file.sha256,
  }));
  const manifest = {
    schemaVersion: 1,
    generatedAt: "2026-08-02T00:00:00.000Z",
    sourceDirectory: "ELMGR4",
    algorithm: "sha256",
    fileCount: normalized.length,
    totalBytes: normalized.reduce((total, file) => total + file.bytes, 0),
    checksumSetSha256: calculateChecksumSetSha256(checksumRecords),
    files: normalized,
    ...overrides,
  };
  return JSON.stringify(manifest);
}

function catalogFixture() {
  return parseCanonicalCatalog(
    JSON.stringify({
      schemaVersion: 1,
      files: [
        {
          path: "HELP_COURSES/ELMGR4/L1/IN/L1IN01.swf",
          bytes: 10,
          sha256: "a".repeat(64),
        },
        {
          path: "HELP_COURSES/ELMGR4/L2/IN/L2IN01.swf",
          bytes: 20,
          sha256: "b".repeat(64),
        },
        {
          path: "HELP_COURSES/ELMGR4/L8/VB/CaseFile.swf",
          bytes: 30,
          sha256: "c".repeat(64),
        },
      ],
    }),
  );
}

test("reconciles a generated ELMGR4 ZIP hash manifest without inventing entry Drive IDs", () => {
  const manifestContent = generatedManifestContent([
    { path: ".DS_Store", bytes: 8, sha256: "f".repeat(64) },
    { path: "L1/IN/L1IN01.swf", bytes: 10, sha256: "a".repeat(64) },
    { path: "L2/IN/L2IN01.swf", bytes: 21, sha256: "d".repeat(64) },
    { path: "L3/IN/L3IN01.fla", bytes: 22, sha256: "b".repeat(64) },
    { path: "L4/FQ/Audio/E/L4FQ01.mp3", bytes: 23, sha256: "e".repeat(64) },
    { path: "L8/VB/casefile.swf", bytes: 30, sha256: "c".repeat(64) },
  ]);
  const manifest = parseZipHashManifest(manifestContent);
  const plan = reconcileZipManifest(manifest, catalogFixture(), {
    containerDriveId: "real_ELMGR4-folder-id",
    manifestSha256: digest(manifestContent),
    catalogSha256: "9".repeat(64),
  });

  assert.equal(plan.mode, "hash-manifest-plan-only-no-source-mutation");
  assert.deepEqual(plan.driveProvenance, {
    containerDriveId: "real_ELMGR4-folder-id",
    canonicalPrefix: "HELP_COURSES/ELMGR4",
    entryDriveIds: "unavailable-in-folder-zip-export",
    syntheticEntryDriveIds: "prohibited",
  });
  assert.equal(plan.counts.manifestRows, 6);
  assert.equal(plan.counts.selectedTechnicalRows, 5);
  assert.equal(plan.counts.excludedNonTechnicalRows, 1);
  assert.deepEqual(plan.counts.byIntakeDecision, { candidate: 1, hold: 3, skip: 1 });
  assert.deepEqual(plan.counts.bySourceType, {
    audio: 1,
    "flash-authoring-source": 1,
    "shipped-flash-runtime": 3,
  });

  const exact = plan.records.find((record) => record.manifestRelativePath === "L1/IN/L1IN01.swf");
  assert.equal(exact.pathStatus, "canonical-exact-path-present");
  assert.equal(exact.byteIdentityStatus, "canonical-exact-path-byte-identical");
  assert.equal(exact.byteDuplicateStatus, "same-canonical-path");
  assert.equal(exact.intakeDecision, "skip");

  const conflict = plan.records.find((record) => record.manifestRelativePath === "L2/IN/L2IN01.swf");
  assert.equal(conflict.conflictStatus, "canonical-exact-path-content-conflict");
  assert.equal(conflict.intakeDecision, "hold");

  const duplicate = plan.records.find((record) => record.manifestRelativePath === "L3/IN/L3IN01.fla");
  assert.equal(duplicate.pathStatus, "canonical-exact-path-missing");
  assert.equal(duplicate.byteIdentityStatus, "canonical-byte-duplicate-at-other-path");
  assert.equal(duplicate.byteDuplicateStatus, "different-canonical-path");
  assert.equal(duplicate.disposition, "hold-placement-alias-review");

  const candidate = plan.records.find(
    (record) => record.manifestRelativePath === "L4/FQ/Audio/E/L4FQ01.mp3",
  );
  assert.equal(candidate.sourceType, "audio");
  assert.equal(candidate.pathStatus, "canonical-exact-path-missing");
  assert.equal(candidate.isByteDuplicate, false);
  assert.equal(candidate.intakeDecision, "candidate");

  const caseConflict = plan.records.find(
    (record) => record.manifestRelativePath === "L8/VB/casefile.swf",
  );
  assert.equal(caseConflict.pathStatus, "canonical-path-case-variant");
  assert.equal(caseConflict.conflictStatus, "canonical-path-case-conflict");

  for (const record of plan.records) {
    assert.equal(record.containerDriveId, "real_ELMGR4-folder-id");
    assert.equal(record.canonicalPrefix, "HELP_COURSES/ELMGR4");
    assert.equal(record.driveEntryId, null);
    assert.equal(record.driveEntryIdStatus, "unavailable-in-folder-zip-export");
  }
  assert.doesNotMatch(JSON.stringify(plan), /synthetic-[A-Za-z0-9_-]+/);

  const csv = serializePlanCsv(plan);
  assert.match(
    csv,
    /^container_drive_id,canonical_prefix,drive_entry_id,drive_entry_id_status,/,
  );
  assert.match(
    csv,
    /real_ELMGR4-folder-id,HELP_COURSES\/ELMGR4,,unavailable-in-folder-zip-export,L1\/IN\/L1IN01\.swf/,
  );

  const repeated = reconcileZipManifest(manifest, catalogFixture(), {
    containerDriveId: "real_ELMGR4-folder-id",
    manifestSha256: plan.inputs.manifestSha256,
    catalogSha256: plan.inputs.canonicalCatalogSha256,
  });
  assert.equal(JSON.stringify(repeated), JSON.stringify(plan));
});

test("maps a DIG-root ZIP manifest to the explicit elementary KeyTerms canonical prefix", () => {
  const keytermHash = "7".repeat(64);
  const manifest = parseZipHashManifest(
    generatedManifestContent(
      [{ path: "Acute_Angle.swf", bytes: 44, sha256: keytermHash }],
      { sourceDirectory: "DIG" },
    ),
  );
  const catalog = parseCanonicalCatalog(
    JSON.stringify({
      schemaVersion: 1,
      files: [
        {
          path: "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Acute_Angle.swf",
          bytes: 44,
          sha256: keytermHash,
        },
      ],
    }),
  );
  const plan = reconcileZipManifest(manifest, catalog, {
    containerDriveId: "real-DIG-container-id",
    canonicalPrefix: "HELP_KEYTERMS/KT/ELEMENTARY/DIG",
  });

  assert.equal(plan.driveProvenance.containerDriveId, "real-DIG-container-id");
  assert.equal(
    plan.driveProvenance.canonicalPrefix,
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG",
  );
  assert.equal(plan.policy.manifestPathsRelativeTo, "DIG");
  assert.equal(plan.policy.canonicalPrefix, "HELP_KEYTERMS/KT/ELEMENTARY/DIG");
  assert.equal(
    plan.records[0].canonicalPath,
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Acute_Angle.swf",
  );
  assert.equal(
    plan.records[0].canonicalPrefix,
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG",
  );
  assert.equal(plan.records[0].driveEntryId, null);
  assert.equal(plan.records[0].intakeDecision, "skip");
  assert.match(
    serializePlanCsv(plan),
    /real-DIG-container-id,HELP_KEYTERMS\/KT\/ELEMENTARY\/DIG,,unavailable-in-folder-zip-export/,
  );
});

test("maps ELMGR3 and ELMGR5 manifests only to their explicitly bound canonical roots", () => {
  const grade3FolderId = "1w0Tm8Rb1r5lRshVU84wtKfFTf5Y55za8";
  const grade5FolderId = "10ggpIi3YFCRx5qqH6FBuFgxldBFDM8BC";
  const grade3Hash = "3".repeat(64);
  const grade5Hash = "5".repeat(64);
  const catalog = parseCanonicalCatalog(
    JSON.stringify({
      schemaVersion: 1,
      files: [
        {
          path: "HELP_COURSES/ELMGR3/L1/index.xml",
          bytes: 33,
          sha256: grade3Hash,
        },
      ],
    }),
  );
  const grade3Manifest = parseZipHashManifest(
    generatedManifestContent(
      [{ path: "L1/index.xml", bytes: 33, sha256: grade3Hash }],
      { sourceDirectory: "ELMGR3" },
    ),
  );
  const grade5Manifest = parseZipHashManifest(
    generatedManifestContent(
      [{ path: "L12/VB/L12VB01.swf", bytes: 55, sha256: grade5Hash }],
      { sourceDirectory: "ELMGR5" },
    ),
  );

  const grade3Plan = reconcileZipManifest(grade3Manifest, catalog, {
    containerDriveId: grade3FolderId,
    canonicalPrefix: "HELP_COURSES/ELMGR3",
  });
  const grade5Plan = reconcileZipManifest(grade5Manifest, catalog, {
    containerDriveId: grade5FolderId,
    canonicalPrefix: "HELP_COURSES/ELMGR5",
  });

  assert.equal(grade3Plan.driveProvenance.containerDriveId, grade3FolderId);
  assert.equal(grade3Plan.driveProvenance.canonicalPrefix, "HELP_COURSES/ELMGR3");
  assert.equal(grade3Plan.policy.manifestPathsRelativeTo, "ELMGR3");
  assert.equal(grade3Plan.records[0].canonicalPath, "HELP_COURSES/ELMGR3/L1/index.xml");
  assert.equal(grade3Plan.records[0].intakeDecision, "skip");
  assert.equal(grade3Plan.records[0].driveEntryId, null);

  assert.equal(grade5Plan.driveProvenance.containerDriveId, grade5FolderId);
  assert.equal(grade5Plan.driveProvenance.canonicalPrefix, "HELP_COURSES/ELMGR5");
  assert.equal(grade5Plan.policy.manifestPathsRelativeTo, "ELMGR5");
  assert.equal(
    grade5Plan.records[0].canonicalPath,
    "HELP_COURSES/ELMGR5/L12/VB/L12VB01.swf",
  );
  assert.equal(grade5Plan.records[0].intakeDecision, "candidate");
  assert.equal(grade5Plan.records[0].driveEntryId, null);
  assert.equal(
    grade5Plan.records[0].driveEntryIdStatus,
    "unavailable-in-folder-zip-export",
  );

  assert.throws(
    () =>
      reconcileZipManifest(grade3Manifest, catalog, {
        containerDriveId: grade3FolderId,
        canonicalPrefix: "HELP_COURSES/ELMGR5",
      }),
    /sourceDirectory ELMGR3 does not match canonical prefix root ELMGR5/,
  );
  assert.throws(
    () =>
      reconcileZipManifest(grade5Manifest, catalog, {
        containerDriveId: grade5FolderId,
        canonicalPrefix: "HELP_COURSES/ELMGR3",
      }),
    /sourceDirectory ELMGR5 does not match canonical prefix root ELMGR3/,
  );
});

test("matches an optional historical byte duplicate without emitting historical paths", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-drive-zip-history-"));
  try {
    const nested = path.join(root, "private", "legacy");
    await mkdir(nested, { recursive: true });
    const bytes = "historical-grade-four-swf";
    const historicalPath = path.join(nested, "Recovered Name.swf");
    await writeFile(historicalPath, bytes);
    await symlink(historicalPath, path.join(root, "ignored-link.swf"));
    const manifest = parseZipHashManifest(
      generatedManifestContent([
        {
          path: "L5/TS/L5TS01.swf",
          bytes: Buffer.byteLength(bytes),
          sha256: digest(bytes),
        },
      ]),
    );
    const historical = await scanHistoricalRoot(root, manifest.records);
    const plan = reconcileZipManifest(manifest, catalogFixture(), {
      containerDriveId: "real-container-id",
      historicalBySha256: historical.bySha256,
      historicalScan: historical.summary,
    });

    assert.equal(plan.records[0].byteIdentityStatus, "historical-byte-duplicate");
    assert.equal(plan.records[0].byteDuplicateStatus, "historical-evidence");
    assert.equal(plan.records[0].disposition, "hold-historical-custody-review");
    assert.match(plan.records[0].historicalHashMatchRefs[0], /^historical-[a-f0-9]{20}$/);
    assert.equal(plan.inputs.historicalScan.skippedSymlinkCount, 1);
    assert.doesNotMatch(JSON.stringify(plan), /private|Recovered Name|help-math-drive-zip-history/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects invalid generated manifests, embedded roots, and case collisions", () => {
  const valid = {
    path: "L1/IN/L1IN01.swf",
    bytes: 10,
    sha256: "a".repeat(64),
  };
  const checksumMismatch = generatedManifestContent([valid], {
    checksumSetSha256: "0".repeat(64),
  });
  assert.throws(() => parseZipHashManifest(checksumMismatch), /checksumSetSha256 does not match/);

  const embedded = generatedManifestContent([
    {
      ...valid,
      path: "HELP_COURSES/ELMGR4/L1/IN/L1IN01.swf",
    },
  ]);
  assert.throws(
    () => parseZipHashManifest(embedded),
    /paths must be relative to the selected ZIP container root/,
  );

  const embeddedDig = generatedManifestContent([
    {
      ...valid,
      path: "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Acute_Angle.swf",
    },
  ]);
  assert.throws(
    () => parseZipHashManifest(embeddedDig),
    /paths must be relative to the selected ZIP container root/,
  );

  const embeddedLowercase = generatedManifestContent([
    {
      ...valid,
      path: "help_keyterms/kt/elementary/dig/Acute_Angle.swf",
    },
  ]);
  assert.throws(
    () => parseZipHashManifest(embeddedLowercase),
    /paths must be relative to the selected ZIP container root/,
  );

  const caseCollision = generatedManifestContent([
    valid,
    { ...valid, path: "L1/IN/l1in01.swf" },
  ]);
  assert.throws(() => parseZipHashManifest(caseCollision), /case-colliding path/);

  const traversal = generatedManifestContent([{ ...valid, path: "../outside.swf" }]);
  assert.throws(() => parseZipHashManifest(traversal), /traversal/);
});

test("requires a real-looking container Drive ID and protects output locations", async () => {
  assert.equal(validateContainerDriveId("1gI3vJx7HRwE5HHGR8VcCakWISUwc16U_"), "1gI3vJx7HRwE5HHGR8VcCakWISUwc16U_");
  assert.throws(() => validateContainerDriveId("https://drive.google.com/folder"), /invalid/);
  assert.throws(() => validateContainerDriveId(" synthetic id "), /invalid/);
  assert.equal(validateCanonicalPrefix(), "HELP_COURSES/ELMGR4");
  assert.equal(validateCanonicalPrefix("HELP_COURSES/ELMGR3"), "HELP_COURSES/ELMGR3");
  assert.equal(validateCanonicalPrefix("HELP_COURSES/ELMGR5"), "HELP_COURSES/ELMGR5");
  assert.equal(
    validateCanonicalPrefix("HELP_KEYTERMS/KT/ELEMENTARY/DIG"),
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG",
  );
  assert.throws(
    () => validateCanonicalPrefix("HELP_FORMULAS"),
    /Unsupported canonical prefix/,
  );
  assert.throws(
    () => validateCanonicalPrefix("HELP_COURSES/ELMGR6"),
    /Unsupported canonical prefix/,
  );
  const mismatchedManifest = parseZipHashManifest(
    generatedManifestContent(
      [{ path: "Acute_Angle.swf", bytes: 1, sha256: "a".repeat(64) }],
      { sourceDirectory: "ELMGR4" },
    ),
  );
  assert.throws(
    () =>
      reconcileZipManifest(mismatchedManifest, catalogFixture(), {
        containerDriveId: "real-DIG-container-id",
        canonicalPrefix: "HELP_KEYTERMS/KT/ELEMENTARY/DIG",
      }),
    /sourceDirectory ELMGR4 does not match canonical prefix root DIG/,
  );

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-drive-zip-output-"));
  try {
    const manifestPath = path.join(tempRoot, "manifest.json");
    const catalogPath = path.join(tempRoot, "catalog.json");
    const historicalRoot = path.join(tempRoot, "historical");
    await mkdir(historicalRoot);
    assert.throws(
      () =>
        validateOutputPaths({
          manifestPath,
          catalogPath,
          historicalRoot,
          outputJson: path.join(scriptDirectory, "unsafe-plan.json"),
          outputCsv: path.join(tempRoot, "safe.csv"),
        }),
      /outside the HELP Math repository/,
    );
    assert.throws(
      () =>
        validateOutputPaths({
          manifestPath,
          catalogPath,
          historicalRoot,
          outputJson: path.join(historicalRoot, "unsafe.json"),
          outputCsv: path.join(tempRoot, "safe.csv"),
        }),
      /historical root/,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
