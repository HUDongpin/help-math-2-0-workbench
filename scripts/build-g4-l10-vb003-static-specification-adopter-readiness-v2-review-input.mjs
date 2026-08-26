#!/usr/bin/env node

import assert from "node:assert/strict";
import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const MAX_CHUNK_BYTES = 3072;
export const JSON_OUTPUT_RELATIVE =
  "reports/g4-l10-vb003-static-specification-adopter-readiness-v2-review-input.json";
export const MARKDOWN_OUTPUT_RELATIVE =
  "reports/g4-l10-vb003-static-specification-adopter-readiness-v2-review-input.md";
export const TEST_RELATIVE =
  "scripts/build-g4-l10-vb003-static-specification-adopter-readiness-v2-review-input.test.mjs";

const STAT_TOOL = "/usr/bin/stat";
const XATTR_TOOL = "/usr/bin/xattr";
const SHA256 = /^[a-f0-9]{64}$/u;
const ALLOWED_XATTRS = new Set(["com.apple.provenance"]);
const CANDIDATE_DIRECTORY_RELATIVE =
  "migrations/course-g04-l10-vb-003/audit/vb003-static-specification-candidate-v1";

export const INPUTS = Object.freeze([
  {role: "source-plan", path: "reports/g4-l10-vb003-static-specification-gap-closure-v1.json", bytes: 43111, sha256: "7150708ad2686e95b058b1a3400fc20563779bc6d9b2114378d6f0c321a62f65", mode: "0644"},
  {role: "candidate-package-builder", path: "scripts/build-g4-l10-vb003-static-specification-candidate-package-v1.mjs", bytes: 28603, sha256: "0154c24adac6a03e5f1c79909a399dc4cab88e279d1e35cd1a1b0da025caa265", mode: "0644"},
  {role: "candidate-package-builder-test", path: "scripts/build-g4-l10-vb003-static-specification-candidate-package-v1.test.mjs", bytes: 6533, sha256: "9edd0e6ae7b897383ae0234e8b0a2cd81fc8a85e947652062151da2b58454d8f", mode: "0644"},
  {role: "candidate-brief", path: `${CANDIDATE_DIRECTORY_RELATIVE}/MIGRATION_BRIEF.candidate.md`, bytes: 19780, sha256: "40e684f0e373875bc2e5e85ebad62dae8c873f7427ec9d998c80fc8cf1d24c27", mode: "0444"},
  {role: "candidate-receipt", path: `${CANDIDATE_DIRECTORY_RELATIVE}/candidate-receipt.json`, bytes: 4300, sha256: "389299f633cdbcfff3317396ba9a059978308d1538931216ee51a67f58c73a26", mode: "0444"},
  {role: "candidate-migration", path: `${CANDIDATE_DIRECTORY_RELATIVE}/migration.candidate.json`, bytes: 12195, sha256: "3460532e5f2ff4c4b1d2fd5a6e8e2fc37188fcc186cca704c6701440a92dc5a1", mode: "0444"},
  {role: "candidate-nested-keyframes", path: `${CANDIDATE_DIRECTORY_RELATIVE}/nested-structural-keyframes.candidate.csv`, bytes: 5594, sha256: "99b123ab80b4cd487e04973a0d9833d87dbefe65936540cc7276a26800686c24", mode: "0444"},
  {role: "candidate-definition-inventory", path: `${CANDIDATE_DIRECTORY_RELATIVE}/swf-definition-inventory.candidate.csv`, bytes: 40819, sha256: "63eb03f9398a708d59950dba0d0b51ceaa9fdb645b5c616162896d34cb90ccb1", mode: "0444"},
  {role: "prior-review-input-json-no-verdict", path: "reports/g4-l10-vb003-static-specification-candidate-v1-review-input.json", bytes: 35790, sha256: "7f3f3cad3c6d08f5b78a7be37effad11f638bbbefcd9483fe3d37f3009023108", mode: "0444"},
  {role: "prior-review-input-markdown-no-verdict", path: "reports/g4-l10-vb003-static-specification-candidate-v1-review-input.md", bytes: 4016, sha256: "456aaa117a15d00bd8a430623efb3a094412a1f561702b6e4efb6f24747ace51", mode: "0444"},
  {role: "adopter-readiness-builder", path: "scripts/build-g4-l10-vb003-static-specification-adopter-readiness-v1.mjs", bytes: 24934, sha256: "c5003b1a50b94650f893077888c11d8b25f9a41e3b6e54c90cd2900fcadfa118", mode: "0644"},
  {role: "adopter-readiness-builder-test", path: "scripts/build-g4-l10-vb003-static-specification-adopter-readiness-v1.test.mjs", bytes: 5491, sha256: "aa01ac09859fac74135f71d91a49503cd638ddff7abccc7bc432e9d1622ce139", mode: "0644"},
  {role: "adopter-readiness-report", path: "reports/g4-l10-vb003-static-specification-adopter-readiness-v1.json", bytes: 8359, sha256: "e9d42b788a4cb0612872abd6e2b8478270618999eb07c66720a92d2c90d6d2b1", mode: "0444"},
]);

const AUTHORITY_EFFECT_KEYS = Object.freeze([
  "reviewTaskAuthorization",
  "reviewVerdict",
  "candidateAdoption",
  "specificationAcceptance",
  "canonicalWorkspaceMutation",
  "sourcePromotion",
  "sourceMutation",
  "productionHelperImplementation",
  "productionHelperTest",
  "protectedInstallation",
  "helperExecution",
  "originalRuntimeLaunch",
  "authoritativeOriginalRuntimeEvidence",
  "baselineAdoption",
  "rendererAdoption",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "lessonBatchAdmission",
  "wholeLessonIntegration",
  "remainingGrade4BatchStart",
  "wholeCourseIntegration",
  "release",
  "publication",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function compareText(left, right) {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}

function modeString(info) {
  const mode = typeof info.mode === "bigint" ? info.mode : BigInt(info.mode);
  return Number(mode & 0o777n).toString(8).padStart(4, "0");
}

function statIdentity(info) {
  return [
    info.dev,
    info.ino,
    info.mode,
    info.nlink,
    info.uid,
    info.gid,
    info.size,
    info.mtimeNs,
    info.ctimeNs,
  ].map(String).join(":");
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function canonicalRoot(projectRoot) {
  const lexical = path.resolve(projectRoot);
  const info = await lstat(lexical);
  assert.ok(info.isDirectory() && !info.isSymbolicLink(),
    `Project root must be an ordinary directory: ${lexical}`);
  assert.equal(await realpath(lexical), lexical,
    `Project root resolves through a symlink: ${lexical}`);
  return lexical;
}

function resolveInside(root, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  assert.equal(relativePath.includes("\\"), false,
    `Non-portable path is forbidden: ${relativePath}`);
  const absolute = path.resolve(root, relativePath);
  assert.ok(contained(root, absolute), `Path escapes root: ${relativePath}`);
  return absolute;
}

async function assertOrdinaryAncestors(root, absoluteParent) {
  assert.ok(absoluteParent === root || contained(root, absoluteParent));
  const relative = path.relative(root, absoluteParent);
  let cursor = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    assert.ok(info.isDirectory() && !info.isSymbolicLink(),
      `Path ancestor must be an ordinary directory: ${cursor}`);
    assert.equal(await realpath(cursor), cursor,
      `Path ancestor resolves through a symlink: ${cursor}`);
  }
}

async function nativeFlags(absolute) {
  const {stdout} = await execFile(STAT_TOOL, ["-f", "%Sf", absolute], {
    encoding: "utf8",
    maxBuffer: 64 * 1024,
  });
  const value = stdout.trimEnd();
  assert.match(value, /^(?:-|[A-Za-z,]+)$/u,
    `Unexpected native flags observation: ${absolute}`);
  return value;
}

async function xattrSnapshot(absolute) {
  const {stdout} = await execFile(XATTR_TOOL, [absolute], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
  const names = stdout === "" ? [] : stdout.trimEnd().split("\n");
  assert.equal(new Set(names).size, names.length,
    `Duplicate xattr names observed: ${absolute}`);
  const records = [];
  for (const name of names.sort(compareText)) {
    assert.equal(name.includes("\r") || name.includes("\n"), false,
      `Ambiguous xattr name observed: ${absolute}`);
    assert.ok(ALLOWED_XATTRS.has(name),
      `Unexpected xattr name observed: ${absolute}:${name}`);
    const {stdout: rawValue} = await execFile(XATTR_TOOL,
      ["-p", name, absolute], {encoding: null, maxBuffer: 1024 * 1024});
    const value = Buffer.from(rawValue);
    records.push({
      name,
      valueBytes: value.length,
      valueHex: value.toString("hex").toUpperCase(),
      valueSha256: sha256(value),
      authorityEffect: false,
    });
  }
  return records;
}

function assertUtf8RoundTrip(bytes, relativePath) {
  const text = new TextDecoder("utf-8", {fatal: true}).decode(bytes);
  assert.deepEqual(Buffer.from(text, "utf8"), bytes,
    `UTF-8 round trip drifted: ${relativePath}`);
}

export function buildLineChunks(bytes, relativePath,
  maximumBytes = MAX_CHUNK_BYTES) {
  assert.ok(Buffer.isBuffer(bytes), "Chunk source must be a Buffer");
  assert.ok(Number.isSafeInteger(maximumBytes) && maximumBytes > 0);
  assert.ok(bytes.length > 0, `Empty review input is forbidden: ${relativePath}`);
  assert.equal(bytes.at(-1), 0x0a,
    `Review input must end in LF: ${relativePath}`);
  assert.equal(bytes.includes(0x0d), false,
    `CR bytes are forbidden in review inputs: ${relativePath}`);
  const chunks = [];
  let offset = 0;
  let firstLine = 1;
  while (offset < bytes.length) {
    let cursor = offset;
    let acceptedEnd = -1;
    while (cursor < bytes.length) {
      const lf = bytes.indexOf(0x0a, cursor);
      assert.notEqual(lf, -1, `Unterminated line: ${relativePath}`);
      const candidateEnd = lf + 1;
      if (candidateEnd - offset > maximumBytes) break;
      acceptedEnd = candidateEnd;
      cursor = candidateEnd;
    }
    assert.notEqual(acceptedEnd, -1,
      `A single line exceeds ${maximumBytes} bytes: ${relativePath}:${firstLine}`);
    const chunkBytes = bytes.subarray(offset, acceptedEnd);
    const lfCount = chunkBytes.reduce((count, byte) =>
      count + Number(byte === 0x0a), 0);
    chunks.push({
      index: chunks.length + 1,
      firstLine,
      lastLine: firstLine + lfCount - 1,
      startOffset: offset,
      endOffsetExclusive: acceptedEnd,
      bytes: chunkBytes.length,
      lfCount,
      sha256: sha256(chunkBytes),
      sedExpression: `${firstLine},${firstLine + lfCount - 1}p`,
    });
    offset = acceptedEnd;
    firstLine += lfCount;
  }
  assert.equal(offset, bytes.length);
  assert.deepEqual(Buffer.concat(chunks.map((chunk) =>
    bytes.subarray(chunk.startOffset, chunk.endOffsetExclusive))), bytes);
  return chunks;
}

async function stableFile(root, expected) {
  const absolute = resolveInside(root, expected.path);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `Input must be an ordinary file: ${expected.path}`);
  assert.equal(await realpath(absolute), absolute,
    `Input resolves through a symlink: ${expected.path}`);
  assert.equal(before.nlink, 1n,
    `Input must have exactly one hard link: ${expected.path}`);
  const xattrsBefore = await xattrSnapshot(absolute);
  const bytes = await readFile(absolute);
  const flags = await nativeFlags(absolute);
  const xattrsAfter = await xattrSnapshot(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `Input changed while observed: ${expected.path}`);
  assert.deepEqual(xattrsAfter, xattrsBefore,
    `Input xattrs changed while observed: ${expected.path}`);
  assert.equal(bytes.length, expected.bytes,
    `Input byte count drifted: ${expected.path}`);
  assert.equal(sha256(bytes), expected.sha256,
    `Input SHA-256 drifted: ${expected.path}`);
  assert.equal(modeString(before), expected.mode,
    `Input mode drifted: ${expected.path}`);
  assertUtf8RoundTrip(bytes, expected.path);
  const chunks = buildLineChunks(bytes, expected.path);
  return {
    role: expected.role,
    path: expected.path,
    bytes: bytes.length,
    sha256: expected.sha256,
    mode: expected.mode,
    finalLf: 1,
    lfCount: bytes.reduce((count, byte) => count + Number(byte === 0x0a), 0),
    lineCount: chunks.at(-1).lastLine,
    maximumLineChunkBytes: Math.max(...chunks.map((chunk) => chunk.bytes)),
    type: "regular-file",
    stat: {
      device: String(before.dev),
      inode: String(before.ino),
      nlink: String(before.nlink),
      uid: String(before.uid),
      gid: String(before.gid),
      mtimeNs: String(before.mtimeNs),
      ctimeNs: String(before.ctimeNs),
      flags,
    },
    xattrs: xattrsBefore,
    chunks,
  };
}

async function currentFileIdentity(root, relativePath) {
  const absolute = resolveInside(root, relativePath);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink());
  assert.equal(await realpath(absolute), absolute);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `Builder input changed while read: ${relativePath}`);
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

function reviewUniverseSetSha256(inputs) {
  return sha256(inputs.map((input) =>
    `${input.path}\0${input.sha256}\0${input.bytes}\0${input.mode}\n`)
    .sort(compareText).join(""));
}

function chunkSetSha256(inputs) {
  return sha256(inputs.flatMap((input) => input.chunks.map((chunk) =>
    `${input.path}\0${chunk.index}\0${chunk.startOffset}\0${chunk.bytes}\0${chunk.lfCount}\0${chunk.sha256}\n`))
    .join(""));
}

function xattrSetSha256(inputs) {
  const records = inputs.flatMap((item) => item.xattrs.length === 0 ?
    [`${item.path}\0EMPTY\n`] : item.xattrs.map((xattr) =>
      `${item.path}\0${xattr.name}\0${xattr.valueBytes}\0${xattr.valueHex}\0${xattr.valueSha256}\n`));
  return sha256(records.sort(compareText).join(""));
}

function renderMarkdown(document) {
  const inputRows = document.reviewUniverse.inputs.map((input) =>
    `| \`${input.role}\` | \`${input.path}\` | ${input.bytes} | \`${input.sha256}\` | \`${input.mode}\` | ${input.chunks.length} | ${input.maximumLineChunkBytes} |`).join("\n");
  return `# G4 L10 VB003 static specification adopter-readiness v2 review input\n\n` +
    `Status: \`${document.status}\`\n\n` +
    `This freezes review evidence only. It is not a task authorization, review verdict, adopter, apply/recover mechanism, specification acceptance, helper implementation, original-runtime launch, renderer, acceptance, integration, release, or publication decision.\n\n` +
    `## Exact closure\n\n` +
    `- Review-universe files: ${document.reviewUniverse.fileCount}\n` +
    `- Review-universe bytes: ${document.reviewUniverse.totalBytes}\n` +
    `- Review-universe set SHA-256: \`${document.reviewUniverse.setSha256}\`\n` +
    `- Chunk count: ${document.chunkTransport.chunkCount}\n` +
    `- Maximum declared chunk bytes: ${document.chunkTransport.maximumChunkBytes}\n` +
    `- Maximum observed chunk bytes: ${document.chunkTransport.maximumObservedChunkBytes}\n` +
    `- Chunk-set SHA-256: \`${document.chunkTransport.chunkSetSha256}\`\n` +
    `- Xattr-set SHA-256: \`${document.identitySnapshot.xattrSetSha256}\`\n` +
    `- Review-input fingerprint SHA-256: \`${document.reviewInputFingerprintSha256}\`\n\n` +
    `## Inputs\n\n` +
    `| Role | Path | Bytes | SHA-256 | Mode | Chunks | Max chunk |\n` +
    `|---|---|---:|---|---:|---:|---:|\n${inputRows}\n\n` +
    `A future reviewer must first run the declared native-tool diagnostic as non-evidence. For evidence, read exactly one declared chunk per terminal result with native sed, write it to a reviewer-private temporary path, verify declared bytes/LF/SHA-256, and reconstruct each file through explicit ordered concatenation. Whole-file terminal emission, multi-chunk terminal output, heredoc byte accounting, wildcard concatenation, and Python os.listxattr are forbidden.\n\n` +
    `## Review scopes\n\n` + document.reviewScopes.map((scope) =>
      `- **${scope.scope}:** ${scope.requirements.join("; ")}.`).join("\n") +
    `\n\n## Closed authority\n\n` +
    `No reviewer task is authorized or created here. The prior v1 review input has no verdict. All authority effects are false. Any future task creation requires explicit user authorization; any later adoption requires a separate authorization after a valid independent review bound to this exact closure.\n`;
}

export async function buildReviewInput(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const inputs = [];
  for (const expected of INPUTS) inputs.push(await stableFile(root, expected));
  const priorReview = JSON.parse((await readFile(resolveInside(root,
    "reports/g4-l10-vb003-static-specification-candidate-v1-review-input.json"))).toString("utf8"));
  const readiness = JSON.parse((await readFile(resolveInside(root,
    "reports/g4-l10-vb003-static-specification-adopter-readiness-v1.json"))).toString("utf8"));
  assert.equal(priorReview.reviewTasks.authorized, false);
  assert.equal(priorReview.reviewTasks.verdictPresent, false);
  assert.equal(priorReview.reviewInputFingerprintSha256,
    "98eb757b566173d92e4a739557cadfd69150e9d884aed33bc2fc4b8538827811");
  assert.equal(readiness.readinessFingerprintSha256,
    "e6f42f9c1a649ff52785b50ed465defb5883a8aaf91cbc95458fe122de2a6a61");
  assert.equal(readiness.futureCanonicalPostimageSetSha256,
    "cb5563674f062a2780e8fea7d204debf16f11e4e3d656696a92743805e83e6f0");
  assert.equal(readiness.futureCanonicalTargets.length, 4);
  assert.equal(readiness.independentReviewGate.reviewerTasksAuthorized, false);
  assert.equal(readiness.independentReviewGate.verdictPresent, false);
  assert.equal(readiness.implementationBoundary.applySupported, false);

  const allChunks = inputs.flatMap((input) => input.chunks);
  const totalBytes = inputs.reduce((sum, input) => sum + input.bytes, 0);
  const authorityEffects = Object.fromEntries(
    AUTHORITY_EFFECT_KEYS.map((key) => [key, false]));
  const currentScriptRelative = path.relative(root, scriptPath)
    .split(path.sep).join("/");
  const documentWithoutFingerprint = {
    schemaVersion: 2,
    artifactType: "g4-l10-vb003-static-specification-adopter-readiness-v2-review-input",
    status: "review-input-frozen-no-task-authorization-no-review-verdict",
    animationId: "course-g04-l10-vb-003",
    releaseId: "lesson-g04-l10-perimeter-area",
    builder: {
      generator: await currentFileIdentity(root, currentScriptRelative),
      test: await currentFileIdentity(root, TEST_RELATIVE),
    },
    predecessor: {
      reviewInputFingerprintSha256:
        "98eb757b566173d92e4a739557cadfd69150e9d884aed33bc2fc4b8538827811",
      verdictPresent: false,
      reusableAsVerdict: false,
    },
    adopterReadiness: {
      reportSha256:
        "e9d42b788a4cb0612872abd6e2b8478270618999eb07c66720a92d2c90d6d2b1",
      readinessFingerprintSha256:
        "e6f42f9c1a649ff52785b50ed465defb5883a8aaf91cbc95458fe122de2a6a61",
      futureCanonicalPostimageSetSha256:
        "cb5563674f062a2780e8fea7d204debf16f11e4e3d656696a92743805e83e6f0",
      futureCanonicalTargets: 4,
      projectedCanonicalKeyframeRows: 20,
      artifactIsAdopter: false,
      applySupported: false,
    },
    reviewUniverse: {
      fileCount: inputs.length,
      totalBytes,
      setSha256: reviewUniverseSetSha256(inputs),
      inputs,
    },
    diagnosticPreflight: {
      evidenceStatus: "non-evidence-diagnostic-only",
      nativeAbsoluteTools: [
        "/usr/bin/shasum",
        "/usr/bin/wc",
        "/usr/bin/iconv",
        "/usr/bin/stat",
        "/usr/bin/xattr",
        "/bin/ls",
        "/usr/bin/sed",
        "/usr/bin/tr",
      ],
      requirement: "Confirm all declared executables are ordinary executable files before evidence collection; do not incorporate diagnostic stdout or stderr into evidence.",
    },
    identitySnapshot: {
      nativeOnly: true,
      lstatAndRealpathChecked: true,
      hardLinkCountOneRequired: true,
      flagsTool: STAT_TOOL,
      xattrTool: XATTR_TOOL,
      xattrValueTransport: "native xattr -p raw stdout bytes captured without text decoding",
      allowedAmbientNames: [...ALLOWED_XATTRS].sort(compareText),
      prohibitedNames: ["com.apple.quarantine"],
      unexpectedNameDisposition: "fail-closed",
      xattrSetSha256: xattrSetSha256(inputs),
      pythonOsListxattrForbidden: true,
    },
    chunkTransport: {
      algorithm: "ordered-contiguous-LF-boundary-chunks-v2",
      maximumChunkBytes: MAX_CHUNK_BYTES,
      chunkCount: allChunks.length,
      maximumObservedChunkBytes: Math.max(...allChunks.map((chunk) => chunk.bytes)),
      chunkSetSha256: chunkSetSha256(inputs),
      terminalRule: "display exactly one declared content chunk per terminal result; diagnostics and hash results must be separate terminal results",
      nativeExtractionTemplate: "/usr/bin/sed -n '<firstLine>,<lastLine>p' '<absolute-input>' > '<reviewer-private-/tmp/chunk>'",
      perChunkVerification: [
        "/usr/bin/wc -c '<reviewer-private-/tmp/chunk>' equals declared bytes",
        "/usr/bin/tr -cd '\\n' < '<reviewer-private-/tmp/chunk>' | /usr/bin/wc -c equals declared LF count",
        "/usr/bin/shasum -a 256 '<reviewer-private-/tmp/chunk>' equals declared SHA-256",
      ],
      reconstructionRule: "append each private chunk through explicit ordered no-wildcard reads and verify reconstructed byte count plus SHA-256 against the original input binding",
      truncationControl: "No command may emit more than one maximum-3072-byte content chunk to the terminal; content and verification outputs are never combined.",
      forbidden: [
        "whole-file terminal emission",
        "multiple content chunks in one terminal result",
        "aggregate reconstructed-file terminal emission",
        "wildcard concatenation",
        "heredoc byte or LF accounting",
        "LF or CR escaped shell-variable byte accounting",
        "Python os.listxattr",
        "workspace evidence scratch files",
      ],
    },
    reviewScopes: [
      {
        scope: "schema",
        requirements: [
          "read every byte assigned to schema through the declared chunks",
          "validate the 23-column canonical keyframe transformation, four postimages, set hashes, JSON/CSV/Markdown syntax and all cross-references",
          "confirm the eight root rows are byte-preserved and the twelve sprite-120 rows keep all runtime evidence fields empty",
        ],
      },
      {
        scope: "adversarial",
        requirements: [
          "read every byte assigned to adversarial through the declared chunks",
          "attack symlink, hardlink, xattr, identity-swap, no-clobber, preimage-drift, target-exists, partial-publication and tamper paths",
          "prove unsupported apply, recover, rollback, write, force and launch modes remain rejected and cannot reach canonical targets",
        ],
      },
      {
        scope: "whole",
        requirements: [
          "read every byte of all thirteen inputs through the declared chunks",
          "reconstruct and verify each input, then reconcile the prior no-verdict evidence, candidate package, readiness mapping and Grade 4 goal boundaries",
          "confirm neither a review PASS nor this package alone authorizes adoption, helper work, original runtime, acceptance, integration, release or publication",
        ],
      },
    ],
    reviewTasks: {
      authorized: false,
      created: false,
      taskIds: [],
      batchId: null,
      verdictPresent: false,
      exactTaskCountIfLaterAuthorized: 3,
      scopesIfLaterAuthorized: ["schema", "adversarial", "whole"],
      explicitUserAuthorizationRequired: true,
    },
    authorityEffects,
    decision: "DO_NOT_CREATE_TASKS_DO_NOT_APPLY_DO_NOT_IMPLEMENT_DO_NOT_LAUNCH",
  };
  assert.equal(inputs.length, 13);
  assert.ok(allChunks.every((chunk) => chunk.bytes <= MAX_CHUNK_BYTES));
  assert.ok(Object.values(authorityEffects).every((value) => value === false));
  const reviewInputFingerprintSha256 = sha256(Buffer.from(
    canonicalJson(documentWithoutFingerprint), "utf8"));
  assert.match(reviewInputFingerprintSha256, SHA256);
  const document = {...documentWithoutFingerprint, reviewInputFingerprintSha256};
  const json = `${JSON.stringify(document, null, 2)}\n`;
  const markdown = renderMarkdown(document);
  return {root, document, json, markdown};
}

async function assertInputsCurrent(bundle) {
  const current = await buildReviewInput(bundle.root);
  assert.equal(current.json, bundle.json,
    "Review inputs changed after derivation");
  assert.equal(current.markdown, bundle.markdown,
    "Review Markdown changed after derivation");
}

async function outputState(outputRoot, relativePath) {
  const absolute = resolveInside(outputRoot, relativePath);
  await assertOrdinaryAncestors(outputRoot, path.dirname(absolute));
  try {
    return {absolute, info: await lstat(absolute)};
  } catch (error) {
    if (error?.code === "ENOENT") return {absolute, info: null};
    throw error;
  }
}

export async function checkReviewInput(bundle, outputRoot = bundle.root) {
  const root = await canonicalRoot(outputRoot);
  await assertInputsCurrent(bundle);
  for (const [relative, expected] of [
    [JSON_OUTPUT_RELATIVE, bundle.json],
    [MARKDOWN_OUTPUT_RELATIVE, bundle.markdown],
  ]) {
    const bytes = Buffer.from(expected, "utf8");
    await stableFile(root, {
      role: "generated-review-input",
      path: relative,
      bytes: bytes.length,
      sha256: sha256(bytes),
      mode: "0444",
    });
  }
  return {
    disposition: "checked",
    status: bundle.document.status,
    json: JSON_OUTPUT_RELATIVE,
    markdown: MARKDOWN_OUTPUT_RELATIVE,
    reviewUniverseFiles: bundle.document.reviewUniverse.fileCount,
    reviewUniverseBytes: bundle.document.reviewUniverse.totalBytes,
    chunks: bundle.document.chunkTransport.chunkCount,
    maximumChunkBytes: bundle.document.chunkTransport.maximumObservedChunkBytes,
    reviewInputFingerprintSha256:
      bundle.document.reviewInputFingerprintSha256,
    reviewTaskAuthorized: false,
    verdictPresent: false,
    applySupported: false,
    acceptanceEffect: false,
  };
}

export async function publishReviewInputNoClobber(bundle, options = {}) {
  const outputRoot = await canonicalRoot(options.outputRoot ?? bundle.root);
  await assertInputsCurrent(bundle);
  const jsonState = await outputState(outputRoot, JSON_OUTPUT_RELATIVE);
  const markdownState = await outputState(outputRoot, MARKDOWN_OUTPUT_RELATIVE);
  assert.equal(jsonState.info, null,
    `Output already exists; refusing overwrite: ${JSON_OUTPUT_RELATIVE}`);
  assert.equal(markdownState.info, null,
    `Output already exists; refusing overwrite: ${MARKDOWN_OUTPUT_RELATIVE}`);
  await (options.beforeJson ?? (async () => {}))();
  await assertInputsCurrent(bundle);
  await writeFile(jsonState.absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(jsonState.absolute, 0o444);
  await (options.beforeMarkdown ?? (async () => {}))();
  await assertInputsCurrent(bundle);
  await writeFile(markdownState.absolute, bundle.markdown,
    {flag: "wx", mode: 0o600});
  await chmod(markdownState.absolute, 0o444);
  await assertInputsCurrent(bundle);
  return checkReviewInput(bundle, outputRoot);
}

export function parseArguments(argv) {
  assert.equal(argv.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(argv[0]),
    "Only --dry-run, --write-no-clobber, and --check are supported");
  return argv[0];
}

export async function runCli(argv = process.argv.slice(2),
  projectRoot = PROJECT_ROOT) {
  const mode = parseArguments(argv);
  const bundle = await buildReviewInput(projectRoot);
  if (mode === "--write-no-clobber") {
    return publishReviewInputNoClobber(bundle);
  }
  if (mode === "--check") return checkReviewInput(bundle);
  return {
    disposition: "dry-run",
    status: bundle.document.status,
    reviewUniverseFiles: bundle.document.reviewUniverse.fileCount,
    reviewUniverseBytes: bundle.document.reviewUniverse.totalBytes,
    chunks: bundle.document.chunkTransport.chunkCount,
    maximumChunkBytes: bundle.document.chunkTransport.maximumObservedChunkBytes,
    reviewInputFingerprintSha256:
      bundle.document.reviewInputFingerprintSha256,
    reviewTaskAuthorized: false,
    verdictPresent: false,
    applySupported: false,
    acceptanceEffect: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
