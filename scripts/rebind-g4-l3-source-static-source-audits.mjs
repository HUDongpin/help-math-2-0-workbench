#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  link,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
  rmdir,
  stat,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCRIPT_RELATIVE_PATH =
  "scripts/rebind-g4-l3-source-static-source-audits.mjs";
const CANDIDATE_GENERATOR = Object.freeze({
  path: "scripts/build-g4-l3-source-static-candidate.mjs",
  bytes: 76_309,
  sha256: "f7f8c8b357bd0580eb1dbe6bb99e9fbe52aff15a1736d0179188637960f04821",
});
const SOURCE_AUDIT_MATERIALIZER =
  "scripts/materialize-g4-l3-workspace-source-audits.mjs";
const RECEIPT_PATH =
  "reports/g4-l3-source-static-source-audit-rebind-receipt.json";
const WORK_ROOT =
  "work/g4-l3-source-static-source-audit-rebind";
const LOCK_PATH = `${WORK_ROOT}/.rebind.lock`;
const TRANSACTIONS_PATH = `${WORK_ROOT}/transactions`;
const RECEIPT_ID =
  "g4-l3-source-static-source-audit-rebind-2026-07-27-v1";
const PROTECTED_PATHS = Object.freeze([
  "catalog/completion-ledger.json",
  "catalog/lesson-release-ledger.json",
  "catalog/lesson-releases.json",
  "reports/current-javascript-output-human-approval.json",
]);
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;

export const SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS = Object.freeze([
  Object.freeze({
    animationId: "course-g04-l03-fq-003",
    specPath: "migrations/course-g04-l03-fq-003/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-fq003-current-javascript-candidate.json",
    oldAudit: Object.freeze({path: "migrations/course-g04-l03-fq-003/audit/machine/g4-l3-source-audit.json", bytes: 67354, sha256: "bed7cc26a215ea0da42e8890dc0001159cfab1da0d34ac019de14aa6463b1d54"}),
    currentAudit: Object.freeze({path: "migrations/course-g04-l03-fq-003/audit/machine/g4-l3-source-audit.json", bytes: 67354, sha256: "d0619b3dd00210acad91748e3b4ae023aa4d33077bede0f1625b751ed6a22755"}),
    archivedCandidate: Object.freeze({path: "reports/g4-l3-fq003-current-javascript-candidate.json", bytes: 30617, sha256: "c84d309f52ccbc52555ee2835954f2cac40c3131c075892dca4ac1dab9014956"}),
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-004",
    specPath: "migrations/course-g04-l03-in-004/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-in004-current-javascript-candidate.json",
    oldAudit: Object.freeze({path: "migrations/course-g04-l03-in-004/audit/machine/g4-l3-source-audit.json", bytes: 35245, sha256: "cb828ee8fba695a6dee45d6cc51e7a11d45359615f35e7ff27bc4ec7f9fae900"}),
    currentAudit: Object.freeze({path: "migrations/course-g04-l03-in-004/audit/machine/g4-l3-source-audit.json", bytes: 35245, sha256: "4694e532c758d59e87878402c8e857fe9bd637f27253d5a16cd0d69e6bcf5db0"}),
    archivedCandidate: Object.freeze({path: "reports/g4-l3-in004-current-javascript-candidate.json", bytes: 58954, sha256: "5a6dd59b922e14baed24e0ab70f7dea8b62f8f180553d11b4253c67427cadc63"}),
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-005",
    specPath: "migrations/course-g04-l03-in-005/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-in005-current-javascript-candidate.json",
    oldAudit: Object.freeze({path: "migrations/course-g04-l03-in-005/audit/machine/g4-l3-source-audit.json", bytes: 27555, sha256: "b96894d6cf6b2ec28a0a63e2981136cfbdcdc045617d3ce6c3a89953af86dbab"}),
    currentAudit: Object.freeze({path: "migrations/course-g04-l03-in-005/audit/machine/g4-l3-source-audit.json", bytes: 27555, sha256: "9dc6d290559564f1208499656d29c816d05acfbc2b3caed784edd214757a37af"}),
    archivedCandidate: Object.freeze({path: "reports/g4-l3-in005-current-javascript-candidate.json", bytes: 59563, sha256: "72f6f83e1d6caddd3c2179e4a25cb87ef4724b701dcbd85a7017337013861a95"}),
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-012",
    specPath: "migrations/course-g04-l03-in-012/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-in012-current-javascript-candidate.json",
    oldAudit: Object.freeze({path: "migrations/course-g04-l03-in-012/audit/machine/g4-l3-source-audit.json", bytes: 33903, sha256: "5220ade21fd5d71ef166e94996c54c7e74a237f13d1efd76fadb5c92ac44feb6"}),
    currentAudit: Object.freeze({path: "migrations/course-g04-l03-in-012/audit/machine/g4-l3-source-audit.json", bytes: 33903, sha256: "4c59108274b1d674c312c43a32e4fe5b400fac329ca31611659fa52dfc1b13e6"}),
    archivedCandidate: Object.freeze({path: "reports/g4-l3-in012-current-javascript-candidate.json", bytes: 67698, sha256: "0634db4f72bf48da5fae106f41603e44af2cd504a474c00f7385e08aea84bd93"}),
  }),
  Object.freeze({
    animationId: "course-g04-l03-ti-002",
    specPath: "migrations/course-g04-l03-ti-002/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-ti002-current-javascript-candidate.json",
    oldAudit: Object.freeze({path: "migrations/course-g04-l03-ti-002/audit/machine/g4-l3-source-audit.json", bytes: 49529, sha256: "7cd7fadde37a23ee2011317849bc6b8de50ca604cfcf3eb4e427fba9f5484149"}),
    currentAudit: Object.freeze({path: "migrations/course-g04-l03-ti-002/audit/machine/g4-l3-source-audit.json", bytes: 49529, sha256: "9995b17de5a1b43db42a99fd3050ac8148887c391286877ae40ebbb3b84ae373"}),
    archivedCandidate: Object.freeze({path: "reports/g4-l3-ti002-current-javascript-candidate.json", bytes: 75903, sha256: "ffa9200251c24baf7298c773daa6f88ddb34a779285e21702b955a00506b0740"}),
  }),
  Object.freeze({
    animationId: "course-g04-l03-ti-003",
    specPath: "migrations/course-g04-l03-ti-003/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-ti003-current-javascript-candidate.json",
    oldAudit: Object.freeze({path: "migrations/course-g04-l03-ti-003/audit/machine/g4-l3-source-audit.json", bytes: 36841, sha256: "c9d6aec13bed3d2e7f23c2fe3bdfaa5a2e83b3202b77f6ad5db836adfb79fc83"}),
    currentAudit: Object.freeze({path: "migrations/course-g04-l03-ti-003/audit/machine/g4-l3-source-audit.json", bytes: 36841, sha256: "a81598f44df3f38f74ef96fc32b52d828a4d6c94086d27b95498f4b774f8362b"}),
    archivedCandidate: Object.freeze({path: "reports/g4-l3-ti003-current-javascript-candidate.json", bytes: 49137, sha256: "3c83a3c47452b4727db7affe9799cb0228a432382bcfbd35780d1141e7bc3f29"}),
  }),
  Object.freeze({
    animationId: "course-g04-l03-ti-004",
    specPath: "migrations/course-g04-l03-ti-004/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-ti004-current-javascript-candidate.json",
    oldAudit: Object.freeze({path: "migrations/course-g04-l03-ti-004/audit/machine/g4-l3-source-audit.json", bytes: 48962, sha256: "867f9045016ce8439c658b6c2b8fa161f856c91195283e9ae370ec435576dbf0"}),
    currentAudit: Object.freeze({path: "migrations/course-g04-l03-ti-004/audit/machine/g4-l3-source-audit.json", bytes: 48962, sha256: "d279d9e6273acbf0c16a82b8e0b98a47f69dd014f331e23d8c296bf80cdb989a"}),
    archivedCandidate: Object.freeze({path: "reports/g4-l3-ti004-current-javascript-candidate.json", bytes: 47409, sha256: "d6f3ae72e3350a11192d0c03e4b6d784bfd6df6fda2eef38d4e8d1a2fb6626e5"}),
  }),
  Object.freeze({
    animationId: "course-g04-l03-ti-006",
    specPath: "migrations/course-g04-l03-ti-006/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-ti006-current-javascript-candidate.json",
    oldAudit: Object.freeze({path: "migrations/course-g04-l03-ti-006/audit/machine/g4-l3-source-audit.json", bytes: 42397, sha256: "3a2cc7fffc4377a9b3e82b7b5648cfef906891121c7b9a8f489d9c2d3ec940ca"}),
    currentAudit: Object.freeze({path: "migrations/course-g04-l03-ti-006/audit/machine/g4-l3-source-audit.json", bytes: 42397, sha256: "1d3de7a4123eb554027d5b5775bbaf9a25aadae6985db0d1b499ca124f32d346"}),
    archivedCandidate: Object.freeze({path: "reports/g4-l3-ti006-current-javascript-candidate.json", bytes: 54421, sha256: "fba372e68cc271f1d01656a95a26d602b8116fa6ed6e3b43525cea07d46cbe8d"}),
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-007",
    specPath: "migrations/course-g04-l03-ts-007/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-ts007-current-javascript-candidate.json",
    oldAudit: Object.freeze({path: "migrations/course-g04-l03-ts-007/audit/machine/g4-l3-source-audit.json", bytes: 53999, sha256: "b4476a53617b639f0eae018cbfc37430e9b2b67f995003f0a1818e301e42f8d3"}),
    currentAudit: Object.freeze({path: "migrations/course-g04-l03-ts-007/audit/machine/g4-l3-source-audit.json", bytes: 53999, sha256: "1864141c4ec5ed092dea76f2718b1a10f8088cb981583d6b063c9eb2c1ab160c"}),
    archivedCandidate: Object.freeze({path: "reports/g4-l3-ts007-current-javascript-candidate.json", bytes: 161104, sha256: "12c6b627c368c7ab18cbb3d191da72c3c32163b8ad007b0e9903ea3a74ac61e1"}),
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-008",
    specPath: "migrations/course-g04-l03-ts-008/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-ts008-current-javascript-candidate.json",
    oldAudit: Object.freeze({path: "migrations/course-g04-l03-ts-008/audit/machine/g4-l3-source-audit.json", bytes: 49046, sha256: "837e537e2b9f7dd11362250f37e6b44242280b4aa15d93785ffc1151da7be5b9"}),
    currentAudit: Object.freeze({path: "migrations/course-g04-l03-ts-008/audit/machine/g4-l3-source-audit.json", bytes: 49046, sha256: "98522b152d7ec9cc41ce8ae613c12d99b446bc8926157f69649b2a33ed9113a4"}),
    archivedCandidate: Object.freeze({path: "reports/g4-l3-ts008-current-javascript-candidate.json", bytes: 179403, sha256: "8068e10e0b839898233e62131cd34dbb5029b2ff9c3b9e65cb3bb26c56e97a17"}),
  }),
  Object.freeze({
    animationId: "course-g04-l03-vb-003",
    specPath: "migrations/course-g04-l03-vb-003/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-vb003-current-javascript-candidate.json",
    oldAudit: Object.freeze({path: "migrations/course-g04-l03-vb-003/audit/machine/g4-l3-source-audit.json", bytes: 24445, sha256: "6246767f8ffe86497c1865d6ff08ec23bf644d8bdee771792b4824bfda388a62"}),
    currentAudit: Object.freeze({path: "migrations/course-g04-l03-vb-003/audit/machine/g4-l3-source-audit.json", bytes: 24445, sha256: "ea2e52c9519e3a8ced60572aba892b418980c81d5198dd87b1b5bc84859c060b"}),
    archivedCandidate: Object.freeze({path: "reports/g4-l3-vb003-current-javascript-candidate.json", bytes: 49772, sha256: "cd37ec771c2ceaf22e29989b5fea874c51dcca73b382fa0d7fb12d82f0b5ac53"}),
  }),
  Object.freeze({
    animationId: "course-g04-l03-vb-007",
    specPath: "migrations/course-g04-l03-vb-007/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-vb007-current-javascript-candidate.json",
    oldAudit: Object.freeze({path: "migrations/course-g04-l03-vb-007/audit/machine/g4-l3-source-audit.json", bytes: 25442, sha256: "28de921cc532c8e62530c531de1b01c91dad654c7dfe94e37ef509bb5249aab7"}),
    currentAudit: Object.freeze({path: "migrations/course-g04-l03-vb-007/audit/machine/g4-l3-source-audit.json", bytes: 25442, sha256: "84fd0c7631f19af72b180f9732319cd352bbd696b797090d8d961bbc1ccd6136"}),
    archivedCandidate: Object.freeze({path: "reports/g4-l3-vb007-current-javascript-candidate.json", bytes: 37107, sha256: "626cc5017f7181a694656761475bdac144eac315e90e55a57f120f7c24a39cd0"}),
  }),
  Object.freeze({
    animationId: "course-g04-l03-vb-008",
    specPath: "migrations/course-g04-l03-vb-008/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-vb008-current-javascript-candidate.json",
    oldAudit: Object.freeze({path: "migrations/course-g04-l03-vb-008/audit/machine/g4-l3-source-audit.json", bytes: 23917, sha256: "01c7b05963a9695b4c7e27bbb1a78a9009497c5b21c3e6e56039ab29ea2dd548"}),
    currentAudit: Object.freeze({path: "migrations/course-g04-l03-vb-008/audit/machine/g4-l3-source-audit.json", bytes: 23917, sha256: "2cb8b3af5d4049e6f0f3c0135e5fef577aee9491812a41291e34c7e2dcb0639a"}),
    archivedCandidate: Object.freeze({path: "reports/g4-l3-vb008-current-javascript-candidate.json", bytes: 35244, sha256: "ef20c31a451a8858cb799dae440dd3954be5c3282779dd74f5ddd5d8ae96db94"}),
  }),
]);

const AUTHORITY_BOUNDARY = Object.freeze({
  acceptanceNeutral: true,
  currentJavaScriptCandidateOnly: true,
  originalRuntimeAuthorityCreated: false,
  audioAcceptanceCreated: false,
  humanReviewCreated: false,
  ownerAcceptanceCreated: false,
  strictCompletionCreated: false,
  completionLedgerWriteAuthorized: false,
  lessonReleaseWriteAuthorized: false,
  approvalOrPinWriteAuthorized: false,
  publicReleaseAuthorized: false,
  sourceAssetWriteAuthorized: false,
  strictAcceptanceEffect: "none",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function fingerprint(value) {
  return sha256(Buffer.from(stableJson(value)));
}

function publicBinding(binding) {
  return {
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
  };
}

function sameBinding(left, right) {
  return left?.path === right?.path &&
    left?.bytes === right?.bytes &&
    left?.sha256 === right?.sha256;
}

function assertPinned(binding, expected, label) {
  invariant(sameBinding(binding, expected),
    `${label} differs from its pinned identity`);
  return binding;
}

export function safeProjectRelative(relativePath, label = "path") {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      relativePath !== "." &&
      path.posix.normalize(relativePath) === relativePath &&
      !relativePath.startsWith("../") &&
      !relativePath.includes("/../") &&
      !relativePath.includes("\0"),
    `${label} is not a normalized project-relative path: ${relativePath}`,
  );
  return relativePath;
}

async function exists(absolutePath) {
  return lstat(absolutePath).then(() => true, (error) => {
    if (error.code === "ENOENT") return false;
    throw error;
  });
}

async function assertRealDirectoryChain(root, relativeDirectory) {
  const rootReal = await realpath(root);
  let cursor = rootReal;
  if (relativeDirectory === "." || relativeDirectory === "") return cursor;
  safeProjectRelative(relativeDirectory, "directory");
  for (const segment of relativeDirectory.split("/")) {
    cursor = path.join(cursor, segment);
    const metadata = await lstat(cursor);
    invariant(metadata.isDirectory() && !metadata.isSymbolicLink(),
      `directory component must be real: ${relativeDirectory}`);
  }
  return cursor;
}

async function secureReadBinding(root, relativePath, {require0444 = false} = {}) {
  safeProjectRelative(relativePath);
  const rootReal = await realpath(root);
  const parent = await assertRealDirectoryChain(
    rootReal,
    path.posix.dirname(relativePath),
  );
  const absolutePath = path.join(parent, path.posix.basename(relativePath));
  const handle = await open(absolutePath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const metadata = await handle.stat({bigint: true});
    invariant(metadata.isFile(), `${relativePath} must be a regular file`);
    invariant(metadata.nlink === 1n,
      `${relativePath} must not have multiple hard links`);
    if (require0444) {
      invariant(Number(metadata.mode & 0o777n) === 0o444,
        `${relativePath} must have mode 0444`);
    }
    const contents = await handle.readFile();
    return {
      path: relativePath,
      bytes: contents.length,
      sha256: sha256(contents),
      stat: {
        dev: metadata.dev.toString(),
        ino: metadata.ino.toString(),
        size: metadata.size.toString(),
        mtimeNs: metadata.mtimeNs.toString(),
        ctimeNs: metadata.ctimeNs.toString(),
      },
      contents,
    };
  } finally {
    await handle.close();
  }
}

function sameIdentity(left, right) {
  return sameBinding(left, right) &&
    left?.stat?.dev === right?.stat?.dev &&
    left?.stat?.ino === right?.stat?.ino &&
    left?.stat?.size === right?.stat?.size &&
    left?.stat?.mtimeNs === right?.stat?.mtimeNs &&
    left?.stat?.ctimeNs === right?.stat?.ctimeNs;
}

async function writeNoReplace(
  root,
  relativePath,
  contents,
  {mode = 0o444, createParents = true} = {},
) {
  safeProjectRelative(relativePath);
  const absolutePath = path.join(await realpath(root), relativePath);
  if (createParents) await mkdir(path.dirname(absolutePath), {recursive: true});
  await assertRealDirectoryChain(root, path.posix.dirname(relativePath));
  const handle = await open(
    absolutePath,
    fsConstants.O_WRONLY |
      fsConstants.O_CREAT |
      fsConstants.O_EXCL |
      NOFOLLOW,
    0o600,
  );
  try {
    await handle.writeFile(contents);
    await handle.sync();
    await handle.chmod(mode);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const observed = await secureReadBinding(root, relativePath, {
    require0444: mode === 0o444,
  });
  invariant(observed.contents.equals(contents),
    `no-replace verification failed: ${relativePath}`);
  return observed;
}

function validateFingerprint(document, field, label) {
  const projected = structuredClone(document);
  delete projected[field];
  invariant(document[field] === fingerprint(projected),
    `${label} fingerprint is stale`);
}

function validateNeutralCandidate(candidate, item) {
  invariant(candidate?.schemaVersion === 1 &&
    candidate.reportType === "current-javascript-engineering-candidate" &&
    candidate.animationId === item.animationId,
  `${item.animationId}: archived candidate identity is invalid`);
  validateFingerprint(candidate, "reportFingerprintSha256",
    `${item.animationId}: archived candidate`);
  invariant(candidate.evidence?.sourceAudit?.path === item.oldAudit.path &&
    candidate.evidence.sourceAudit.bytes === item.oldAudit.bytes &&
    candidate.evidence.sourceAudit.sha256 === item.oldAudit.sha256,
  `${item.animationId}: archived candidate does not bind the old audit`);
  invariant(candidate.disposition?.currentJavaScriptCandidate === true &&
    candidate.disposition?.strictMigrationComplete === false &&
    candidate.disposition?.publicLibraryAdmitted === false &&
    candidate.disposition?.productionAdmission === false &&
    Object.values(candidate.acceptance ?? {}).every((value) => value === false) &&
    candidate.strictAcceptanceEffect === "none",
  `${item.animationId}: archived candidate crossed an authority boundary`);
  const generatorBindings = candidate.integrationBindings?.filter(
    ({path: bindingPath}) => bindingPath === CANDIDATE_GENERATOR.path,
  ) ?? [];
  invariant(generatorBindings.length === 1 &&
    sameBinding(generatorBindings[0], CANDIDATE_GENERATOR),
  `${item.animationId}: archived candidate generator binding changed`);
  return candidate;
}

function findProtectedBinding(candidate, expectedPath, label) {
  const files = candidate.writeScope?.protectedBefore?.files ?? [];
  const matches = files.filter(({path: bindingPath}) =>
    bindingPath === expectedPath);
  invariant(matches.length === 1, `${label} protected binding is missing`);
  return matches[0];
}

function candidateConsumedProjection(spec, candidate) {
  const boundary = spec.sourceBehaviorBoundary;
  return {
    animationId: spec.animationId,
    sourceSwfSha256: candidate.source.swf.sha256,
    runtime: {
      stage: {
        width: candidate.timeline.stage.width,
        height: candidate.timeline.stage.height,
      },
      fps: candidate.timeline.fps,
      rootFrameCount: candidate.timeline.root.frameCount,
    },
    scripts: {
      random: boundary?.random ?? {occurrences: 0, files: []},
      externalApiCandidateCount:
        boundary?.externalApiCandidateCount ?? 0,
      externalControlEventFiles:
        boundary?.mainFrameDisposition ===
          "source-external-api-confined-to-disabled-control-main-drawing-static-only"
          ? boundary.externalControlEventFiles
          : null,
    },
    evidenceLimits: {
      authoritativeRuntimeLaunched: false,
      visualBaselineEstablished: false,
    },
  };
}

export function currentSourceAuditProjection(spec, audit) {
  const boundary = spec.sourceBehaviorBoundary;
  const external = audit.machineFindings?.scripts?.externalApiCandidates ?? [];
  const externalControlEventFiles =
    boundary?.mainFrameDisposition ===
      "source-external-api-confined-to-disabled-control-main-drawing-static-only"
      ? external
        .flatMap((candidate) => candidate.files ?? [])
        .sort((left, right) => left.path.localeCompare(right.path, "en"))
      : null;
  return {
    animationId: audit.identity.animationId,
    sourceSwfSha256: audit.provenance.source.swf.sha256,
    runtime: {
      stage: {
        width: audit.machineFindings.runtime.stage.width,
        height: audit.machineFindings.runtime.stage.height,
      },
      fps: audit.machineFindings.runtime.fps,
      rootFrameCount: audit.machineFindings.runtime.rootFrameCount,
    },
    scripts: {
      random: {
        occurrences: audit.machineFindings.scripts.random.occurrences,
        files: audit.machineFindings.scripts.random.files,
      },
      externalApiCandidateCount: external.length,
      externalControlEventFiles,
    },
    evidenceLimits: {
      authoritativeRuntimeLaunched:
        audit.machineFindings.evidenceLimits.authoritativeRuntimeLaunched,
      visualBaselineEstablished:
        audit.machineFindings.evidenceLimits.visualBaselineEstablished,
    },
  };
}

function resolveJsonPointer(document, pointer, label) {
  invariant(typeof pointer === "string" && pointer.startsWith("/"),
    `${label} JSON pointer is invalid`);
  return pointer.slice(1).split("/").reduce((value, token) => {
    const key = token.replaceAll("~1", "/").replaceAll("~0", "~");
    invariant(value !== null && value !== undefined &&
      Object.hasOwn(value, key), `${label} JSON pointer does not resolve`);
    return value[key];
  }, document);
}

function assertCurrentAuditNeutral(audit, item) {
  invariant(audit?.schemaVersion === 1 &&
    audit.artifactType === "g4-l3-workspace-source-audit" &&
    audit.identity?.animationId === item.animationId,
  `${item.animationId}: current source audit identity is invalid`);
  validateFingerprint(audit, "artifactFingerprintSha256",
    `${item.animationId}: current source audit`);
  invariant(audit.acceptance?.acceptanceNeutral === true &&
    audit.acceptance?.acceptanceEffect === "none" &&
    audit.acceptance?.migrationStatusChanges === 0 &&
    audit.acceptance?.reviewOrApprovalChanges === 0 &&
    audit.acceptance?.completionLedgerChanges === 0 &&
    audit.acceptance?.lessonPublicationChanges === 0 &&
    audit.acceptance?.originalRuntimeSessions === 0 &&
    Object.values(audit.machineFindings.evidenceLimits)
      .every((value) => value === false),
  `${item.animationId}: current source audit is not acceptance-neutral`);
}

async function readCurrentAuditEvidence(root, item, spec) {
  const auditBinding = assertPinned(
    await secureReadBinding(root, item.currentAudit.path),
    item.currentAudit,
    `${item.animationId}: current source audit`,
  );
  const audit = JSON.parse(auditBinding.contents.toString("utf8"));
  assertCurrentAuditNeutral(audit, item);
  const [
    materializer,
    upstream,
    releaseManifest,
    sourceSwf,
    sourceFla,
  ] = await Promise.all([
    secureReadBinding(root, audit.provenance.materializer.path),
    secureReadBinding(root, audit.provenance.upstreamMachineAudit.path),
    secureReadBinding(root, audit.provenance.lessonReleaseManifest.path),
    secureReadBinding(root, spec.source.swf.path),
    spec.source.fla
      ? secureReadBinding(root, spec.source.fla.path)
      : Promise.resolve(null),
  ]);
  invariant(audit.provenance.materializer.path ===
      SOURCE_AUDIT_MATERIALIZER &&
    audit.provenance.materializer.sha256 === materializer.sha256,
  `${item.animationId}: source-audit materializer binding is stale`);
  invariant(audit.provenance.upstreamMachineAudit.bytes === upstream.bytes &&
    audit.provenance.upstreamMachineAudit.sha256 === upstream.sha256,
  `${item.animationId}: upstream machine-audit binding is stale`);
  invariant(audit.provenance.lessonReleaseManifest.bytes ===
      releaseManifest.bytes &&
    audit.provenance.lessonReleaseManifest.sha256 === releaseManifest.sha256,
  `${item.animationId}: lesson-release binding is stale`);
  const upstreamDocument = JSON.parse(upstream.contents.toString("utf8"));
  const upstreamItem = resolveJsonPointer(
    upstreamDocument,
    audit.provenance.upstreamMachineAudit.itemJsonPointer,
    `${item.animationId}: upstream item`,
  );
  invariant(upstreamItem.animationId === item.animationId &&
    upstreamItem.auditFingerprintSha256 ===
      audit.provenance.upstreamMachineAudit.itemFingerprintSha256,
  `${item.animationId}: upstream item fingerprint is stale`);
  const releaseDocument = JSON.parse(
    releaseManifest.contents.toString("utf8"),
  );
  const releaseMember = resolveJsonPointer(
    releaseDocument,
    audit.provenance.lessonReleaseManifest.memberJsonPointer,
    `${item.animationId}: release member`,
  );
  invariant(releaseMember.animationId === item.animationId &&
    releaseMember.assetId === audit.identity.assetId,
  `${item.animationId}: release member identity is stale`);
  assertPinned(sourceSwf, spec.source.swf,
    `${item.animationId}: physical SWF`);
  invariant(audit.provenance.source.swf.path === sourceSwf.path &&
    audit.provenance.source.swf.bytes === sourceSwf.bytes &&
    audit.provenance.source.swf.sha256 === sourceSwf.sha256 &&
    audit.provenance.source.swf.physicalHashVerified === true,
  `${item.animationId}: current audit SWF projection is stale`);
  if (spec.source.fla) {
    assertPinned(sourceFla, spec.source.fla,
      `${item.animationId}: physical FLA`);
    invariant(audit.provenance.source.fla.path === sourceFla.path &&
      audit.provenance.source.fla.bytes === sourceFla.bytes &&
      audit.provenance.source.fla.sha256 === sourceFla.sha256 &&
      audit.provenance.source.fla.physicalHashVerified === true,
    `${item.animationId}: current audit FLA projection is stale`);
  }
  return {
    audit,
    auditBinding,
    materializer,
    upstream,
    releaseManifest,
    sourceSwf,
    sourceFla,
  };
}

function archivedRelative(transactionId, kind, relativePath) {
  safeProjectRelative(relativePath);
  return `${TRANSACTIONS_PATH}/${transactionId}/${kind}/${relativePath}`;
}

function transactionIdFor(scriptBinding) {
  return fingerprint({
    receiptId: RECEIPT_ID,
    writer: publicBinding(scriptBinding),
    transitions: SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS.map((item) => ({
      animationId: item.animationId,
      specPath: item.specPath,
      oldAudit: item.oldAudit,
      currentAudit: item.currentAudit,
      archivedCandidate: item.archivedCandidate,
    })),
  });
}

async function inspectHistoricalItem(root, item, generatorBinding) {
  const [specBinding, candidateBinding] = await Promise.all([
    secureReadBinding(root, item.specPath),
    secureReadBinding(root, item.reportPath),
  ]);
  const spec = JSON.parse(specBinding.contents.toString("utf8"));
  invariant(spec.animationId === item.animationId &&
    sameBinding(spec.evidence?.sourceAudit, item.oldAudit),
  `${item.animationId}: source-static spec is not at its exact old preimage`);
  invariant(!(spec.integrationBindings ?? []).includes(RECEIPT_PATH),
    `${item.animationId}: receipt binding already exists`);
  const candidate = validateNeutralCandidate(
    assertPinned(candidateBinding, item.archivedCandidate,
      `${item.animationId}: archived candidate`) &&
      JSON.parse(candidateBinding.contents.toString("utf8")),
    item,
  );
  assertPinned(
    findProtectedBinding(candidate, item.specPath,
      `${item.animationId}: archived spec`),
    publicBinding(specBinding),
    `${item.animationId}: archived spec`,
  );
  assertPinned(
    findProtectedBinding(candidate, item.oldAudit.path,
      `${item.animationId}: archived source audit`),
    item.oldAudit,
    `${item.animationId}: archived source audit`,
  );
  assertPinned(generatorBinding, CANDIDATE_GENERATOR,
    "source-static candidate generator");
  const current = await readCurrentAuditEvidence(root, item, spec);
  const historicalProjection = candidateConsumedProjection(spec, candidate);
  const currentProjection = currentSourceAuditProjection(spec, current.audit);
  invariant(fingerprint(historicalProjection) ===
    fingerprint(currentProjection),
  `${item.animationId}: candidate-consumed source-audit projection changed`);
  return {
    item,
    spec,
    specBinding,
    candidate,
    candidateBinding,
    current,
    historicalProjection,
    currentProjection,
  };
}

function commonCurrentProvenance(inspections) {
  const fields = inspections.map(({current}) => ({
    materializer: publicBinding(current.materializer),
    upstreamMachineAudit: publicBinding(current.upstream),
    upstreamAuditSetSha256:
      current.audit.provenance.upstreamMachineAudit.auditSetSha256,
    lessonReleaseManifest: publicBinding(current.releaseManifest),
  }));
  invariant(fields.every((field) =>
    fingerprint(field) === fingerprint(fields[0])),
  "13 source audits do not share one current derived-provenance chain");
  return fields[0];
}

function buildReceipt({
  scriptBinding,
  generatorBinding,
  protectedBindings,
  inspections,
}) {
  const transactionId = transactionIdFor(scriptBinding);
  const commonProvenance = commonCurrentProvenance(inspections);
  const receipt = {
    schemaVersion: 1,
    receiptType: "g4-l3-source-static-source-audit-rebind-receipt",
    receiptId: RECEIPT_ID,
    transactionId,
    status:
      "verified-acceptance-neutral-batch-source-audit-rebind-with-bounded-historical-delta",
    reason:
      "Thirteen artifact-only workspace source audits were rematerialized against one current derived-provenance chain. Their physical source identities and the exact source-audit semantic projection consumed by the hash-bound archived source-static candidate generator remain unchanged.",
    historicalBoundary: {
      oldSourceAuditCompleteBytesAvailable: false,
      oldSourceAuditFullByteDiffPerformed: false,
      limitation:
        "The thirteen old source-audit byte preimages are not retained. Equal byte lengths and equal candidate-consumed semantic projections do not prove that only provenance fields changed. This receipt authorizes only the bounded descriptor rebind recorded below.",
    },
    commonDriftAssessment: {
      classification:
        "common-derived-provenance-rematerialization-with-no-candidate-consumed-semantic-drift-observed",
      transitionCount: inspections.length,
      allAuditByteLengthsUnchanged: inspections.every(
        ({item}) => item.oldAudit.bytes === item.currentAudit.bytes,
      ),
      allAuditSha256ValuesChanged: inspections.every(
        ({item}) => item.oldAudit.sha256 !== item.currentAudit.sha256,
      ),
      exactOldFieldDeltaProven: false,
      commonCurrentProvenance: commonProvenance,
    },
    candidateGenerator: publicBinding(generatorBinding),
    items: inspections.map((inspection) => ({
      animationId: inspection.item.animationId,
      specPath: inspection.item.specPath,
      transition: {
        from: inspection.item.oldAudit,
        to: inspection.item.currentAudit,
        bytesUnchanged:
          inspection.item.oldAudit.bytes ===
            inspection.item.currentAudit.bytes,
        sha256Changed:
          inspection.item.oldAudit.sha256 !==
            inspection.item.currentAudit.sha256,
      },
      historicalEvidence: {
        candidateReport: publicBinding(inspection.candidateBinding),
        candidateReportFingerprintSha256:
          inspection.candidate.reportFingerprintSha256,
        archivedCandidatePath: archivedRelative(
          transactionId,
          "historical-candidates",
          inspection.item.reportPath,
        ),
        specPreimage: publicBinding(inspection.specBinding),
        archivedSpecPath: archivedRelative(
          transactionId,
          "spec-preimages",
          inspection.item.specPath,
        ),
      },
      currentEvidence: {
        sourceAudit: publicBinding(inspection.current.auditBinding),
        sourceAuditArtifactFingerprintSha256:
          inspection.current.audit.artifactFingerprintSha256,
        physicalSources: {
          swf: publicBinding(inspection.current.sourceSwf),
          fla: inspection.current.sourceFla
            ? publicBinding(inspection.current.sourceFla)
            : null,
        },
      },
      semanticProjection: {
        encoding: "two-space-indented JSON plus LF",
        scope:
          "The fields consumed by validateEvidence in the exact hash-bound source-static candidate generator: animation identity, source SWF hash, stage width/height, FPS, root frame count, random/external-API declarations, and negative original-runtime/visual-baseline limits.",
        historical: inspection.historicalProjection,
        current: inspection.currentProjection,
        historicalSha256: fingerprint(inspection.historicalProjection),
        currentSha256: fingerprint(inspection.currentProjection),
        equal: true,
      },
    })),
    protectedBefore: protectedBindings.map(publicBinding),
    specMutationBoundary: {
      allowed:
        "Replace only evidence.sourceAudit with the current descriptor plus this receipt binding, and append this receipt path once to integrationBindings.",
      receiptDoesNotBindPostSpecWholeFileSha256: true,
      reason:
        "The post-spec contains the receipt SHA-256; omitting the post-spec whole-file SHA from the receipt prevents a self-referential hash cycle.",
    },
    authorityBoundary: AUTHORITY_BOUNDARY,
    generatedBy: publicBinding(scriptBinding),
  };
  receipt.receiptFingerprintSha256 = fingerprint(receipt);
  return receipt;
}

export function validateSourceStaticSourceAuditRebindReceipt(receipt) {
  invariant(receipt?.schemaVersion === 1 &&
    receipt.receiptType ===
      "g4-l3-source-static-source-audit-rebind-receipt" &&
    receipt.receiptId === RECEIPT_ID &&
    /^[a-f0-9]{64}$/.test(receipt.transactionId ?? ""),
  "source-static source-audit rebind receipt identity is invalid");
  validateFingerprint(receipt, "receiptFingerprintSha256",
    "source-static source-audit rebind receipt");
  invariant(receipt.items?.length ===
      SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS.length &&
    receipt.commonDriftAssessment?.transitionCount ===
      SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS.length &&
    receipt.commonDriftAssessment?.allAuditByteLengthsUnchanged === true &&
    receipt.commonDriftAssessment?.allAuditSha256ValuesChanged === true &&
    receipt.commonDriftAssessment?.exactOldFieldDeltaProven === false &&
    receipt.historicalBoundary?.oldSourceAuditCompleteBytesAvailable === false &&
    receipt.historicalBoundary?.oldSourceAuditFullByteDiffPerformed === false,
  "source-static source-audit historical boundary is invalid");
  invariant(Object.entries(receipt.authorityBoundary ?? {})
    .filter(([key]) => ![
      "acceptanceNeutral",
      "currentJavaScriptCandidateOnly",
      "strictAcceptanceEffect",
    ].includes(key))
    .every(([, value]) => value === false) &&
    receipt.authorityBoundary.acceptanceNeutral === true &&
    receipt.authorityBoundary.currentJavaScriptCandidateOnly === true &&
    receipt.authorityBoundary.strictAcceptanceEffect === "none",
  "source-static source-audit receipt crossed an authority boundary");
  invariant(receipt.specMutationBoundary
    ?.receiptDoesNotBindPostSpecWholeFileSha256 === true,
  "source-static source-audit receipt introduced a hash cycle");
  for (const [index, item] of receipt.items.entries()) {
    const expected = SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS[index];
    invariant(item.animationId === expected.animationId &&
      item.specPath === expected.specPath &&
      sameBinding(item.transition?.from, expected.oldAudit) &&
      sameBinding(item.transition?.to, expected.currentAudit) &&
      item.transition.bytesUnchanged === true &&
      item.transition.sha256Changed === true &&
      sameBinding(
        item.historicalEvidence?.candidateReport,
        expected.archivedCandidate,
      ) &&
      item.semanticProjection?.equal === true &&
      item.semanticProjection.historicalSha256 ===
        item.semanticProjection.currentSha256 &&
      item.semanticProjection.historicalSha256 ===
        fingerprint(item.semanticProjection.historical) &&
      item.semanticProjection.currentSha256 ===
        fingerprint(item.semanticProjection.current),
    `${expected.animationId}: receipt item is invalid`);
  }
  return receipt;
}

function receiptDescriptor(receiptBytes) {
  return {
    path: RECEIPT_PATH,
    bytes: receiptBytes.length,
    sha256: sha256(receiptBytes),
    authority: "acceptance-neutral-source-audit-descriptor-rebind-only",
    strictAcceptanceEffect: "none",
  };
}

function buildPostSpec(spec, item, receiptBinding) {
  const next = structuredClone(spec);
  next.evidence.sourceAudit = {
    ...item.currentAudit,
    rebindReceipt: receiptBinding,
  };
  invariant(!next.integrationBindings.includes(RECEIPT_PATH),
    `${item.animationId}: receipt integration binding already exists`);
  next.integrationBindings.push(RECEIPT_PATH);
  validateAllowedSpecMutation(spec, next, item, receiptBinding);
  return next;
}

function validateAllowedSpecMutation(before, after, item, receiptBinding) {
  const beforeProjection = structuredClone(before);
  const afterProjection = structuredClone(after);
  delete beforeProjection.evidence.sourceAudit;
  delete afterProjection.evidence.sourceAudit;
  beforeProjection.integrationBindings =
    beforeProjection.integrationBindings.filter((value) =>
      value !== RECEIPT_PATH);
  afterProjection.integrationBindings =
    afterProjection.integrationBindings.filter((value) =>
      value !== RECEIPT_PATH);
  invariant(fingerprint(beforeProjection) === fingerprint(afterProjection),
    `${item.animationId}: spec mutation exceeded the rebind boundary`);
  invariant(sameBinding(after.evidence.sourceAudit, item.currentAudit) &&
    sameBinding(
      after.evidence.sourceAudit.rebindReceipt,
      receiptBinding,
    ) &&
    after.evidence.sourceAudit.rebindReceipt.authority ===
      receiptBinding.authority &&
    after.evidence.sourceAudit.rebindReceipt.strictAcceptanceEffect === "none",
  `${item.animationId}: post-spec sourceAudit descriptor is invalid`);
  invariant(after.integrationBindings.filter((value) =>
    value === RECEIPT_PATH).length === 1,
  `${item.animationId}: post-spec must bind the receipt exactly once`);
}

async function prepareHistoricalState(root) {
  const [scriptBinding, generatorBinding, ...protectedBindings] =
    await Promise.all([
      secureReadBinding(root, SCRIPT_RELATIVE_PATH),
      secureReadBinding(root, CANDIDATE_GENERATOR.path),
      ...PROTECTED_PATHS.map((relativePath) =>
        secureReadBinding(root, relativePath)),
    ]);
  assertPinned(generatorBinding, CANDIDATE_GENERATOR,
    "source-static candidate generator");
  const inspections = [];
  for (const item of SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS) {
    inspections.push(await inspectHistoricalItem(
      root,
      item,
      generatorBinding,
    ));
  }
  const receipt = validateSourceStaticSourceAuditRebindReceipt(buildReceipt({
    scriptBinding,
    generatorBinding,
    protectedBindings,
    inspections,
  }));
  const receiptBytes = Buffer.from(stableJson(receipt));
  const binding = receiptDescriptor(receiptBytes);
  const postSpecs = inspections.map((inspection) => {
    const document = buildPostSpec(
      inspection.spec,
      inspection.item,
      binding,
    );
    return {
      item: inspection.item,
      before: inspection.specBinding,
      document,
      bytes: Buffer.from(stableJson(document)),
    };
  });
  return {
    scriptBinding,
    generatorBinding,
    protectedBindings,
    inspections,
    receipt,
    receiptBytes,
    receiptBinding: binding,
    postSpecs,
  };
}

async function acquireLock(root, transactionId) {
  const absolute = path.join(await realpath(root), LOCK_PATH);
  await mkdir(path.dirname(absolute), {recursive: true});
  await assertRealDirectoryChain(root, WORK_ROOT);
  try {
    await mkdir(absolute, {recursive: false});
  } catch (error) {
    if (error.code === "EEXIST") {
      throw new Error("source-audit rebind lock is already held");
    }
    throw error;
  }
  await writeNoReplace(
    root,
    `${LOCK_PATH}/owner.json`,
    Buffer.from(stableJson({
      schemaVersion: 1,
      transactionId,
      pid: process.pid,
    })),
    {mode: 0o444, createParents: false},
  );
  return {absolute, transactionId};
}

async function releaseLock(root, lock) {
  if (!lock) return;
  const ownerPath = `${LOCK_PATH}/owner.json`;
  const owner = JSON.parse(
    (await secureReadBinding(root, ownerPath)).contents.toString("utf8"),
  );
  invariant(owner.transactionId === lock.transactionId &&
    owner.pid === process.pid,
  "refusing to release a lock whose owner changed");
  await unlink(path.join(root, ownerPath));
  await rmdir(lock.absolute);
}

async function copyArchived(root, source, destination) {
  return writeNoReplace(root, destination, source.contents, {mode: 0o444});
}

async function installSpecCas(root, transactionRoot, postSpec, ordinal) {
  const observed = await secureReadBinding(root, postSpec.item.specPath);
  invariant(sameIdentity(observed, postSpec.before),
    `${postSpec.item.animationId}: spec CAS precondition failed`);
  const temporary =
    `${postSpec.item.specPath}.source-audit-rebind-${process.pid}-${ordinal}`;
  await writeNoReplace(root, temporary, postSpec.bytes, {mode: 0o644});
  const quarantine =
    `${transactionRoot}/quarantine/${String(ordinal).padStart(2, "0")}.json`;
  await mkdir(path.dirname(path.join(root, quarantine)), {recursive: true});
  await assertRealDirectoryChain(root, path.posix.dirname(quarantine));
  await rename(
    path.join(root, postSpec.item.specPath),
    path.join(root, quarantine),
  );
  try {
    await link(
      path.join(root, temporary),
      path.join(root, postSpec.item.specPath),
    );
    await unlink(path.join(root, temporary));
    const installed = await secureReadBinding(root, postSpec.item.specPath);
    invariant(installed.contents.equals(postSpec.bytes),
      `${postSpec.item.animationId}: installed spec differs`);
    await chmod(path.join(root, quarantine), 0o444);
    return {quarantine, installed};
  } catch (error) {
    if (await exists(path.join(root, temporary))) {
      await unlink(path.join(root, temporary));
    }
    if (!await exists(path.join(root, postSpec.item.specPath))) {
      await rename(
        path.join(root, quarantine),
        path.join(root, postSpec.item.specPath),
      );
    }
    throw error;
  }
}

async function rollbackApplied(root, transactionRoot, applied, receiptBinding) {
  const conflicts = [];
  const receiptAbsolute = path.join(root, RECEIPT_PATH);
  if (await exists(receiptAbsolute)) {
    const observed = await secureReadBinding(root, RECEIPT_PATH);
    if (sameBinding(observed, receiptBinding)) {
      const destination = `${transactionRoot}/rollback/canonical-receipt.json`;
      await mkdir(path.dirname(path.join(root, destination)), {recursive: true});
      await rename(receiptAbsolute, path.join(root, destination));
      await chmod(path.join(root, destination), 0o444);
    } else {
      conflicts.push({path: RECEIPT_PATH, reason: "foreign receipt drift"});
    }
  }
  for (const entry of [...applied].reverse()) {
    const target = path.join(root, entry.postSpec.item.specPath);
    const quarantine = path.join(root, entry.quarantine);
    try {
      const current = await secureReadBinding(
        root,
        entry.postSpec.item.specPath,
      );
      if (!current.contents.equals(entry.postSpec.bytes)) {
        conflicts.push({
          path: entry.postSpec.item.specPath,
          reason: "foreign post-spec drift",
        });
        continue;
      }
      const failedPost =
        `${transactionRoot}/rollback/post/${entry.postSpec.item.specPath}`;
      await mkdir(path.dirname(path.join(root, failedPost)), {recursive: true});
      await rename(target, path.join(root, failedPost));
      await rename(quarantine, target);
      const restored = await secureReadBinding(
        root,
        entry.postSpec.item.specPath,
      );
      invariant(restored.contents.equals(entry.postSpec.before.contents),
        `${entry.postSpec.item.animationId}: rollback verification failed`);
    } catch (error) {
      conflicts.push({
        path: entry.postSpec.item.specPath,
        reason: error.message,
      });
    }
  }
  return conflicts;
}

async function verifyProtected(root, protectedBindings) {
  for (const expected of protectedBindings) {
    const observed = await secureReadBinding(root, expected.path);
    invariant(sameBinding(observed, expected),
      `protected file changed: ${expected.path}`);
  }
}

async function verifyPostSpecs(root, receipt, receiptBytes) {
  const receiptBinding = receiptDescriptor(receiptBytes);
  for (const item of SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS) {
    const spec = JSON.parse(
      (await secureReadBinding(root, item.specPath)).contents.toString("utf8"),
    );
    invariant(sameBinding(spec.evidence?.sourceAudit, item.currentAudit) &&
      sameBinding(
        spec.evidence.sourceAudit.rebindReceipt,
        receiptBinding,
      ) &&
      spec.integrationBindings.filter((value) =>
        value === RECEIPT_PATH).length === 1,
    `${item.animationId}: post-spec receipt binding is stale`);
  }
  const observedReceipt = await secureReadBinding(root, RECEIPT_PATH);
  invariant(observedReceipt.contents.equals(receiptBytes),
    "canonical source-audit rebind receipt is stale");
  validateSourceStaticSourceAuditRebindReceipt(
    JSON.parse(observedReceipt.contents.toString("utf8")),
  );
}

async function validateArchivedPreimages(root, receipt) {
  for (const item of receipt.items) {
    const [candidate, spec] = await Promise.all([
      secureReadBinding(
        root,
        item.historicalEvidence.archivedCandidatePath,
        {require0444: true},
      ),
      secureReadBinding(
        root,
        item.historicalEvidence.archivedSpecPath,
        {require0444: true},
      ),
    ]);
    invariant(sameBinding(
      {...candidate, path: item.historicalEvidence.candidateReport.path},
      item.historicalEvidence.candidateReport,
    ), `${item.animationId}: archived candidate preimage is stale`);
    invariant(sameBinding(
      {...spec, path: item.historicalEvidence.specPreimage.path},
      item.historicalEvidence.specPreimage,
    ), `${item.animationId}: archived spec preimage is stale`);
  }
}

function validateCurrentCandidate(candidate, item, receiptBinding) {
  invariant(candidate?.schemaVersion === 1 &&
    candidate.reportType === "current-javascript-engineering-candidate" &&
    candidate.animationId === item.animationId,
  `${item.animationId}: rebuilt candidate identity is invalid`);
  validateFingerprint(candidate, "reportFingerprintSha256",
    `${item.animationId}: rebuilt candidate`);
  invariant(sameBinding(
    candidate.evidence?.sourceAudit,
    item.currentAudit,
  ), `${item.animationId}: rebuilt candidate sourceAudit binding is stale`);
  const receiptBindings = candidate.integrationBindings?.filter(
    ({path: bindingPath}) => bindingPath === RECEIPT_PATH,
  ) ?? [];
  invariant(receiptBindings.length === 1 &&
    sameBinding(receiptBindings[0], receiptBinding),
  `${item.animationId}: rebuilt candidate receipt binding is stale`);
  invariant(candidate.disposition?.currentJavaScriptCandidate === true &&
    candidate.disposition?.strictMigrationComplete === false &&
    candidate.disposition?.publicLibraryAdmitted === false &&
    candidate.disposition?.productionAdmission === false &&
    Object.values(candidate.acceptance ?? {}).every((value) => value === false) &&
    candidate.strictAcceptanceEffect === "none",
  `${item.animationId}: rebuilt candidate crossed an authority boundary`);
}

export async function checkSourceStaticSourceAuditRebind({
  root = PROJECT_ROOT,
  requireRebuiltCandidates = true,
} = {}) {
  const [receiptFile, scriptBinding] = await Promise.all([
    secureReadBinding(root, RECEIPT_PATH),
    secureReadBinding(root, SCRIPT_RELATIVE_PATH),
  ]);
  const receipt = validateSourceStaticSourceAuditRebindReceipt(
    JSON.parse(receiptFile.contents.toString("utf8")),
  );
  invariant(receipt.transactionId === transactionIdFor(scriptBinding) &&
    sameBinding(receipt.generatedBy, scriptBinding),
  "source-audit rebind receipt writer binding is stale");
  await verifyProtected(root, receipt.protectedBefore);
  await verifyPostSpecs(root, receipt, receiptFile.contents);
  await validateArchivedPreimages(root, receipt);
  for (const [index, transition] of
    SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS.entries()) {
    const spec = JSON.parse(
      (await secureReadBinding(root, transition.specPath))
        .contents.toString("utf8"),
    );
    const current = await readCurrentAuditEvidence(root, transition, spec);
    invariant(fingerprint(currentSourceAuditProjection(spec, current.audit)) ===
      receipt.items[index].semanticProjection.currentSha256,
    `${transition.animationId}: current semantic projection drifted`);
    if (requireRebuiltCandidates) {
      const candidate = JSON.parse(
        (await secureReadBinding(root, transition.reportPath))
          .contents.toString("utf8"),
      );
      validateCurrentCandidate(
        candidate,
        transition,
        receiptDescriptor(receiptFile.contents),
      );
    }
  }
  return {
    mode: "check",
    itemCount: SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS.length,
    transactionId: receipt.transactionId,
    receipt: publicBinding(receiptFile),
    rebuiltCandidatesRequired: requireRebuiltCandidates,
    strictAcceptanceEffect: "none",
  };
}

export async function applySourceStaticSourceAuditRebind({
  root = PROJECT_ROOT,
  hooks = {},
  leaveInterruptedForTest = false,
} = {}) {
  const initialScriptBinding = await secureReadBinding(
    root,
    SCRIPT_RELATIVE_PATH,
  );
  const initialTransactionId = transactionIdFor(initialScriptBinding);
  if (await exists(path.join(
    root,
    TRANSACTIONS_PATH,
    initialTransactionId,
  )) || await exists(path.join(root, RECEIPT_PATH))) {
    throw new Error(
      `transaction replay detected: ${initialTransactionId}`,
    );
  }
  const preview = await prepareHistoricalState(root);
  const transactionId = preview.receipt.transactionId;
  const transactionRoot = `${TRANSACTIONS_PATH}/${transactionId}`;
  const lock = await acquireLock(root, transactionId);
  const applied = [];
  let committed = false;
  try {
    invariant(!await exists(path.join(root, transactionRoot)),
      `transaction replay detected: ${transactionId}`);
    invariant(!await exists(path.join(root, RECEIPT_PATH)),
      "canonical source-audit rebind receipt already exists");
    const locked = await prepareHistoricalState(root);
    invariant(locked.receiptBinding.sha256 === preview.receiptBinding.sha256,
      "rebind inputs changed between preview and locked preflight");
    await mkdir(path.join(root, TRANSACTIONS_PATH), {recursive: true});
    await assertRealDirectoryChain(root, TRANSACTIONS_PATH);
    await mkdir(path.join(root, transactionRoot), {recursive: false});
    for (const inspection of locked.inspections) {
      await copyArchived(
        root,
        inspection.specBinding,
        archivedRelative(
          transactionId,
          "spec-preimages",
          inspection.item.specPath,
        ),
      );
      await copyArchived(
        root,
        inspection.candidateBinding,
        archivedRelative(
          transactionId,
          "historical-candidates",
          inspection.item.reportPath,
        ),
      );
    }
    const plan = {
      schemaVersion: 1,
      reportType:
        "g4-l3-source-static-source-audit-rebind-transaction-plan",
      transactionId,
      receipt: locked.receiptBinding,
      specPreimages: locked.postSpecs.map(({before}) =>
        publicBinding(before)),
      specPostimages: locked.postSpecs.map(({item, bytes}) => ({
        path: item.specPath,
        bytes: bytes.length,
        sha256: sha256(bytes),
      })),
      protectedBefore: locked.protectedBindings.map(publicBinding),
      authorityBoundary: AUTHORITY_BOUNDARY,
    };
    await writeNoReplace(
      root,
      `${transactionRoot}/plan.json`,
      Buffer.from(stableJson(plan)),
      {mode: 0o444},
    );
    for (const [index, postSpec] of locked.postSpecs.entries()) {
      if (hooks.beforeSpecWrite) {
        await hooks.beforeSpecWrite({index, postSpec});
      }
      const installed = await installSpecCas(
        root,
        transactionRoot,
        postSpec,
        index + 1,
      );
      applied.push({...installed, postSpec});
      if (hooks.afterSpecWrite) {
        await hooks.afterSpecWrite({index, postSpec});
      }
    }
    await writeNoReplace(
      root,
      RECEIPT_PATH,
      locked.receiptBytes,
      {mode: 0o444, createParents: false},
    );
    await verifyProtected(root, locked.protectedBindings);
    await verifyPostSpecs(root, locked.receipt, locked.receiptBytes);
    await validateArchivedPreimages(root, locked.receipt);
    await writeNoReplace(
      root,
      `${transactionRoot}/commit.json`,
      Buffer.from(stableJson({
        schemaVersion: 1,
        transactionId,
        specCount: locked.postSpecs.length,
        receipt: locked.receiptBinding,
        authorityBoundary: AUTHORITY_BOUNDARY,
      })),
      {mode: 0o444},
    );
    committed = true;
    return {
      mode: "apply",
      itemCount: locked.postSpecs.length,
      transactionId,
      receipt: locked.receiptBinding,
      candidateReportsRebuilt: 0,
      strictAcceptanceEffect: "none",
    };
  } catch (error) {
    if (leaveInterruptedForTest) throw error;
    const conflicts = await rollbackApplied(
      root,
      transactionRoot,
      applied,
      preview.receiptBinding,
    );
    if (conflicts.length > 0) {
      throw new AggregateError(
        [error, ...conflicts.map(({path: conflictPath, reason}) =>
          new Error(`${conflictPath}: ${reason}`))],
        "source-audit rebind failed and rollback preserved conflicts",
      );
    }
    throw error;
  } finally {
    if (!committed && leaveInterruptedForTest) {
      // Test-only crash simulation intentionally retains the lock and journal.
    } else {
      await releaseLock(root, lock);
    }
  }
}

export async function dryRunSourceStaticSourceAuditRebind({
  root = PROJECT_ROOT,
} = {}) {
  const preview = await prepareHistoricalState(root);
  return {
    mode: "dry-run",
    itemCount: preview.inspections.length,
    transactionId: preview.receipt.transactionId,
    receipt: preview.receiptBinding,
    allAuditByteLengthsUnchanged:
      preview.receipt.commonDriftAssessment.allAuditByteLengthsUnchanged,
    semanticProjectionSha256: preview.receipt.items.map((item) => ({
      animationId: item.animationId,
      sha256: item.semanticProjection.currentSha256,
    })),
    writesPerformed: 0,
    strictAcceptanceEffect: "none",
  };
}

export function parseArguments(argv) {
  const options = {mode: "dry-run", root: PROJECT_ROOT};
  let explicitMode = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (["--dry-run", "--apply", "--check", "--check-specs"].includes(argument)) {
      invariant(!explicitMode, "choose exactly one mode");
      options.mode = argument.slice(2);
      explicitMode = true;
    } else if (argument === "--root") {
      invariant(argv[index + 1], "--root requires a value");
      options.root = path.resolve(argv[index + 1]);
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

function help() {
  return "Usage: node scripts/rebind-g4-l3-source-static-source-audits.mjs [--dry-run|--apply|--check-specs|--check] [--root PATH]\n";
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(help());
    return;
  }
  let result;
  if (options.mode === "apply") {
    result = await applySourceStaticSourceAuditRebind(options);
  } else if (options.mode === "check") {
    result = await checkSourceStaticSourceAuditRebind({
      root: options.root,
      requireRebuiltCandidates: true,
    });
  } else if (options.mode === "check-specs") {
    result = await checkSourceStaticSourceAuditRebind({
      root: options.root,
      requireRebuiltCandidates: false,
    });
  } else {
    result = await dryRunSourceStaticSourceAuditRebind(options);
  }
  process.stdout.write(stableJson(result));
}

if (process.argv[1] &&
  path.resolve(process.argv[1]) === SCRIPT_PATH) {
  await main();
}
