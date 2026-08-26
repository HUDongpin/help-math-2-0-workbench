import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  applyRendererDriftSuccessor,
  checkRendererDriftSuccessor,
  dryRunRendererDriftSuccessor,
  parseArguments,
} from "./build-g4-l3-renderer-drift-successor-package.mjs";

const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const PROTECTED_PATHS = [
  "catalog/completion-ledger.json",
  "catalog/lesson-release-ledger.json",
  "catalog/lesson-releases.json",
  "reports/g4-l3-source-static-source-audit-wave2b-derived-refresh-receipt.json",
  ".gitignore",
  ".vercelignore",
];
const IR_PATH =
  "migrations/course-g04-l03-ir-001-341242cc/audit/renderer-frame-domain-support.json";
const TI_PATH =
  "migrations/course-g04-l03-ti-003/audit/renderer-frame-domain-support.json";
const INDEX_PATH = "reports/g4-l3-renderer-frame-domain-support-index.json";
const GAP_PATH = "reports/g4-l3-renderer-gap-closure.json";
const OUTPUT_PATH =
  "reports/g4-l3-renderer-live-drift-successor-fixture.json";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function pretty(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function fileBinding(bytes) {
  return {bytes: bytes.length, mode: 0o644, sha256: sha256(bytes)};
}

async function writeRelative(root, relativePath, bytes) {
  const absolutePath = path.join(root, ...relativePath.split("/"));
  await mkdir(path.dirname(absolutePath), {recursive: true});
  await writeFile(absolutePath, bytes, {flag: "wx"});
}

function auditDocument(animationId, generatorToken) {
  return {
    schemaVersion: 1,
    evidenceType: "renderer-frame-domain-support-audit",
    animationId,
    status: "renderer-frame-domain-support-incomplete",
    generatedFrom: {fixtureGeneratorToken: generatorToken},
    summary: {
      declaredFrameDomainCount: 1,
      fullyRenderableFrameDomainCount: 0,
      probeCount: 2,
      exactIdentityCount: 2,
      blockedCount: 1,
      renderableCount: 1,
      outcomeCounts: {
        "renderable-exact": 1,
        "blocked-not-renderable": 1,
      },
    },
    strictAcceptanceEffect:
      "none; fixture audit cannot advance strict acceptance",
  };
}

function indexDocument(irSha256, tiSha256) {
  const reports = [
    {
      animationId: "course-g04-l03-ir-001-341242cc",
      path: IR_PATH,
      sha256: irSha256,
      status: "renderer-frame-domain-support-incomplete",
      declaredFrameDomainCount: 4,
      fullyRenderableFrameDomainCount: 0,
      probeCount: 16,
      renderableCount: 2,
      blockedCount: 14,
    },
    {
      animationId: "course-g04-l03-ti-003",
      path: TI_PATH,
      sha256: tiSha256,
      status: "renderer-frame-domain-support-incomplete",
      declaredFrameDomainCount: 7,
      fullyRenderableFrameDomainCount: 0,
      probeCount: 28,
      renderableCount: 2,
      blockedCount: 26,
    },
  ];
  for (let index = 0; index < 38; index += 1) {
    reports.push({
      animationId: `fixture-member-${String(index + 1).padStart(2, "0")}`,
      path: `migrations/fixture-member-${String(index + 1).padStart(2, "0")}/audit/renderer-frame-domain-support.json`,
      sha256: sha256(`fixture-member-${index + 1}`),
      status:
        index < 2
          ? "fully-renderable"
          : "renderer-frame-domain-support-incomplete",
      declaredFrameDomainCount: 1,
      fullyRenderableFrameDomainCount: index < 2 ? 1 : 0,
      probeCount: 1,
      renderableCount: index < 2 ? 1 : 0,
      blockedCount: index < 2 ? 0 : 1,
    });
  }
  return {
    schemaVersion: 1,
    evidenceType:
      "course-shell-pilot-renderer-frame-domain-support-index",
    scope: "explicit-animation-id-selection",
    status: "renderer-frame-domain-support-incomplete",
    pilotCount: 40,
    fullyRenderablePilotCount: 2,
    totalProbeCount: 1046,
    totalRenderableCount: 232,
    totalBlockedCount: 814,
    reports,
    strictAcceptanceEffect:
      "none; index status is an engineering audit result, not a fidelity or acceptance claim",
  };
}

function gapDocument(indexBinding, releaseBinding, generationToken) {
  return {
    schemaVersion: 1,
    reportType: "g4-l3-renderer-gap-closure",
    generatedBy: {fixtureGenerationToken: generationToken},
    scope: {
      releaseId: RELEASE_ID,
      releaseMembers: 40,
      publicationMode: "atomic",
    },
    bindings: {
      lessonRelease: {
        path: "catalog/lesson-releases.json",
        ...releaseBinding,
      },
      rendererSupportIndex: {path: INDEX_PATH, ...indexBinding},
    },
    summary: {
      declaredFrameDomains: 261,
      fullyRenderableFrameDomains: 36,
      partiallyRenderableFrameDomains: 38,
      nonRenderableFrameDomains: 187,
      notFullyRenderableFrameDomains: 225,
      fullyRenderableMembers: 2,
      renderableExactProbes: 232,
      blockedOrMismatchedProbes: 814,
      safeRendererOnlyImplementationDomainsNow: 0,
    },
    categoryCounts: {
      "fully-renderable-current-js": 36,
      "spanish-visual-audio-evidence-gated": 38,
      "authoritative-root-runtime-evidence-gated": 38,
      "natural-trace-parent-composition-and-renderer-gated": 149,
    },
    decision: {
      safeRendererOnlyImplementationAvailable: false,
      nextExecutableMilestone:
        "authorized-ts006-en-es-original-runtime-vertical-slice",
      runtimeLaunchAuthorized: false,
    },
    members: [],
    acceptance: {
      authoritativeRuntimeAccepted: false,
      visualFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
    strictAcceptanceEffect:
      "none; fixture report cannot advance acceptance",
  };
}

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "renderer-successor-root-"));
  const postimageRoot = await mkdtemp(
    path.join(os.tmpdir(), "renderer-successor-post-"),
  );
  await mkdir(path.join(root, "reports"), {recursive: true});

  const releaseMembers = Array.from({length: 40}, (_, index) => ({
    ordinal: index + 1,
    animationId:
      index === 0
        ? "course-g04-l03-ir-001-341242cc"
        : index === 1
          ? "course-g04-l03-ti-003"
          : `fixture-member-${String(index - 1).padStart(2, "0")}`,
  }));
  const completionBytes = pretty({
    summary: {declaredComplete: 0, strictComplete: 0},
    entries: [],
  });
  const releaseLedgerBytes = pretty({
    summary: {publishedReleaseCount: 0, strictCompleteMemberCount: 0},
    releases: [
      {
        releaseId: RELEASE_ID,
        expectedMemberCount: 40,
        strictCompleteCount: 0,
        published: false,
        gate: {open: false},
      },
    ],
  });
  const releasesBytes = pretty({
    schemaVersion: 1,
    releases: [
      {
        releaseId: RELEASE_ID,
        publicationMode: "atomic",
        members: releaseMembers,
      },
    ],
  });
  const predecessorBytes = pretty({
    schemaVersion: 1,
    authorityBoundary: {
      strictAcceptanceEffect: "none",
      releaseEffect: "none",
    },
    semanticState: {
      completionLedger: {strictComplete: 0},
      lessonReleaseLedger: {published: false},
    },
  });
  const protectedContents = new Map([
    ["catalog/completion-ledger.json", completionBytes],
    ["catalog/lesson-release-ledger.json", releaseLedgerBytes],
    ["catalog/lesson-releases.json", releasesBytes],
    [
      "reports/g4-l3-source-static-source-audit-wave2b-derived-refresh-receipt.json",
      predecessorBytes,
    ],
    [".gitignore", Buffer.from("artifacts/\nprivate-archive/\n")],
    [".vercelignore", Buffer.from("artifacts/\nprivate-archive/\n")],
  ]);
  for (const [relativePath, bytes] of protectedContents) {
    await writeRelative(root, relativePath, bytes);
  }

  const preIrBytes = pretty(
    auditDocument("course-g04-l03-ir-001-341242cc", "before"),
  );
  const postIrBytes = pretty(
    auditDocument("course-g04-l03-ir-001-341242cc", "after"),
  );
  const preTiBytes = pretty(
    auditDocument("course-g04-l03-ti-003", "before"),
  );
  const postTiBytes = pretty(
    auditDocument("course-g04-l03-ti-003", "after"),
  );
  const preIndexBytes = pretty(
    indexDocument(sha256(preIrBytes), sha256(preTiBytes)),
  );
  const postIndexBytes = pretty(
    indexDocument(sha256(postIrBytes), sha256(postTiBytes)),
  );
  const releaseBinding = fileBinding(releasesBytes);
  const preGapBytes = pretty(
    gapDocument(fileBinding(preIndexBytes), releaseBinding, "before"),
  );
  const postGapBytes = pretty(
    gapDocument(fileBinding(postIndexBytes), releaseBinding, "after"),
  );

  const transitionFiles = [
    {
      role: "renderer-member-audit",
      animationId: "course-g04-l03-ir-001-341242cc",
      path: IR_PATH,
      preimage: fileBinding(preIrBytes),
      postimage: fileBinding(postIrBytes),
    },
    {
      role: "renderer-member-audit",
      animationId: "course-g04-l03-ti-003",
      path: TI_PATH,
      preimage: fileBinding(preTiBytes),
      postimage: fileBinding(postTiBytes),
    },
    {
      role: "renderer-support-index",
      path: INDEX_PATH,
      preimage: fileBinding(preIndexBytes),
      postimage: fileBinding(postIndexBytes),
    },
    {
      role: "renderer-gap-report",
      path: GAP_PATH,
      preimage: fileBinding(preGapBytes),
      postimage: fileBinding(postGapBytes),
    },
  ];
  const preimageBytes = [preIrBytes, preTiBytes, preIndexBytes, preGapBytes];
  const postimageBytes = [
    postIrBytes,
    postTiBytes,
    postIndexBytes,
    postGapBytes,
  ];
  for (let index = 0; index < transitionFiles.length; index += 1) {
    await writeRelative(root, transitionFiles[index].path, preimageBytes[index]);
    await writeRelative(
      postimageRoot,
      transitionFiles[index].path,
      postimageBytes[index],
    );
  }
  const transition = {
    transitionId: `fixture-renderer-drift-${sha256(root).slice(0, 16)}`,
    outputRelative: OUTPUT_PATH,
    transactionRootRelative:
      "work/g4-l3-renderer-live-drift-successor-transactions",
    predecessor: {
      path:
        "reports/g4-l3-source-static-source-audit-wave2b-derived-refresh-receipt.json",
      ...fileBinding(predecessorBytes),
    },
    files: transitionFiles,
    protectedPaths: PROTECTED_PATHS,
  };
  return {root, postimageRoot, transition};
}

async function snapshotCanonical(fixture) {
  return Promise.all(
    fixture.transition.files.map(async ({path: relativePath}) => ({
      path: relativePath,
      bytes: await readFile(path.join(fixture.root, relativePath)),
    })),
  );
}

async function assertCanonicalUnchanged(fixture, snapshot) {
  for (const item of snapshot) {
    assert.deepEqual(
      await readFile(path.join(fixture.root, item.path)),
      item.bytes,
      `${item.path} was modified`,
    );
  }
}

test("CLI is dry-run by default and keeps check separate from postimage input", () => {
  assert.equal(
    parseArguments(["--postimage-root", "/tmp/postimages"]).mode,
    "dry-run",
  );
  assert.equal(parseArguments(["--check"]).mode, "check");
  assert.throws(
    () =>
      parseArguments([
        "--check",
        "--postimage-root",
        "/tmp/postimages",
      ]),
    /does not accept/,
  );
  assert.throws(
    () =>
      parseArguments([
        "--apply",
        "--dry-run",
        "--postimage-root",
        "/tmp/postimages",
      ]),
    /mutually exclusive/,
  );
});

test("dry-run verifies the exact transition without writing package or reports", async () => {
  const fixture = await createFixture();
  const snapshot = await snapshotCanonical(fixture);
  const result = await dryRunRendererDriftSuccessor(fixture);
  assert.equal(result.status, "verified-no-write");
  assert.equal(result.changedFileCount, 4);
  assert.equal(result.strictComplete, 0);
  assert.equal(result.published, false);
  await assert.rejects(
    lstat(path.join(fixture.root, OUTPUT_PATH)),
    /ENOENT/,
  );
  await assertCanonicalUnchanged(fixture, snapshot);
});

test("tampered postimage fails before output or canonical mutation", async () => {
  const fixture = await createFixture();
  const snapshot = await snapshotCanonical(fixture);
  await writeFile(
    path.join(fixture.postimageRoot, IR_PATH),
    Buffer.from("tampered postimage\n"),
  );
  await assert.rejects(
    applyRendererDriftSuccessor(fixture),
    /exact binding drifted/,
  );
  await assert.rejects(
    lstat(path.join(fixture.root, OUTPUT_PATH)),
    /ENOENT/,
  );
  await assertCanonicalUnchanged(fixture, snapshot);
});

test("same-byte preimage inode replacement fails the final prepublish recheck", async () => {
  const fixture = await createFixture();
  const irPath = path.join(fixture.root, IR_PATH);
  const originalBytes = await readFile(irPath);
  await assert.rejects(
    applyRendererDriftSuccessor({
      ...fixture,
      hooks: {
        async beforePublish() {
          await rename(irPath, `${irPath}.superseded-by-test`);
          await writeFile(irPath, originalBytes, {flag: "wx"});
        },
      },
    }),
    /inputs changed/,
  );
  assert.deepEqual(await readFile(irPath), originalBytes);
  await assert.rejects(
    lstat(path.join(fixture.root, OUTPUT_PATH)),
    /ENOENT/,
  );
});

test("existing output is never overwritten", async () => {
  const fixture = await createFixture();
  const snapshot = await snapshotCanonical(fixture);
  const sentinel = Buffer.from("existing immutable owner data\n");
  await writeFile(path.join(fixture.root, OUTPUT_PATH), sentinel, {flag: "wx"});
  await assert.rejects(
    applyRendererDriftSuccessor(fixture),
    /already exists/,
  );
  assert.deepEqual(await readFile(path.join(fixture.root, OUTPUT_PATH)), sentinel);
  await assertCanonicalUnchanged(fixture, snapshot);
});

test("injected pre-publish failure leaves canonical reports and output untouched", async () => {
  const fixture = await createFixture();
  const snapshot = await snapshotCanonical(fixture);
  await assert.rejects(
    applyRendererDriftSuccessor({
      ...fixture,
      hooks: {
        beforePublish() {
          throw new Error("injected pre-publish failure");
        },
      },
    }),
    /injected pre-publish failure/,
  );
  await assert.rejects(
    lstat(path.join(fixture.root, OUTPUT_PATH)),
    /ENOENT/,
  );
  await assertCanonicalUnchanged(fixture, snapshot);
  const transactionRoot = path.join(
    fixture.root,
    fixture.transition.transactionRootRelative,
  );
  const transactions = await readdir(transactionRoot);
  assert.equal(transactions.length, 1);
  assert.equal(
    (await lstat(path.join(transactionRoot, transactions[0], "plan.json")))
      .mode &
      0o777,
    0o444,
  );
  assert.equal(
    (
      await lstat(
        path.join(transactionRoot, transactions[0], "journal.jsonl"),
      )
    ).mode & 0o777,
    0o444,
  );
});

test("successful apply publishes only one immutable package and check verifies it", async () => {
  const fixture = await createFixture();
  const snapshot = await snapshotCanonical(fixture);
  const applied = await applyRendererDriftSuccessor(fixture);
  assert.equal(
    applied.status,
    "published-no-replace-candidate-package-only",
  );
  assert.equal(applied.canonicalReportsReplaced, false);
  assert.equal(applied.strictComplete, 0);
  assert.equal(applied.published, false);
  await assertCanonicalUnchanged(fixture, snapshot);

  const outputPath = path.join(fixture.root, OUTPUT_PATH);
  const metadata = await lstat(outputPath);
  assert.equal(metadata.mode & 0o777, 0o444);
  const packageDocument = JSON.parse(await readFile(outputPath, "utf8"));
  assert.equal(
    packageDocument.receipt.securityBoundary
      .prepublishExactContentAndIdentityRecheck,
    true,
  );
  assert.equal(
    packageDocument.receipt.securityBoundary.externalWriterAtomicity,
    false,
  );
  assert.equal(
    packageDocument.receipt.securityBoundary.ancestorPathRaceClosed,
    false,
  );
  assert.equal(
    packageDocument.receipt.securityBoundary
      .canonicalReportWriteCapability,
    false,
  );
  assert.equal(packageDocument.receipt.output.postimagesInstalled, false);
  assert.equal(
    packageDocument.receipt.output.canonicalReportsReplaced,
    false,
  );
  assert.equal(
    Object.hasOwn(
      packageDocument.receipt.securityBoundary,
      "exactPreimageContentAndIdentityCas",
    ),
    false,
  );
  const checked = await checkRendererDriftSuccessor({
    root: fixture.root,
    transition: fixture.transition,
  });
  assert.equal(checked.status, "verified-no-replace-package");
  assert.equal(checked.canonicalReportsReplaced, false);
  assert.equal(checked.strictComplete, 0);
  assert.equal(checked.published, false);

  await assert.rejects(
    applyRendererDriftSuccessor(fixture),
    /already exists/,
  );
  await assertCanonicalUnchanged(fixture, snapshot);
});

test("same-byte and same-mode independent replacement of published output fails check", async () => {
  const fixture = await createFixture();
  await applyRendererDriftSuccessor(fixture);
  const outputPath = path.join(fixture.root, OUTPUT_PATH);
  const packageBytes = await readFile(outputPath);
  await unlink(outputPath);
  await writeFile(outputPath, packageBytes, {flag: "wx", mode: 0o600});
  await chmod(outputPath, 0o444);
  await assert.rejects(
    checkRendererDriftSuccessor({
      root: fixture.root,
      transition: fixture.transition,
    }),
    /does not share the exact prepared package inode and two-link identity/,
  );
});

test("tampered published package fails immutable check", async () => {
  const fixture = await createFixture();
  await applyRendererDriftSuccessor(fixture);
  const outputPath = path.join(fixture.root, OUTPUT_PATH);
  await chmod(outputPath, 0o644);
  const packageDocument = JSON.parse(await readFile(outputPath, "utf8"));
  packageDocument.status = "tampered";
  await writeFile(outputPath, pretty(packageDocument));
  await chmod(outputPath, 0o444);
  await assert.rejects(
    checkRendererDriftSuccessor({
      root: fixture.root,
      transition: fixture.transition,
    }),
    /identity drifted|fingerprint drifted/,
  );
});
