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
  "reports/g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1-review-input.json";
export const MARKDOWN_OUTPUT_RELATIVE =
  "reports/g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1-review-input.md";
export const TEST_RELATIVE =
  "scripts/build-g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1-review-input.test.mjs";

const XATTR_TOOL = "/usr/bin/xattr";
const STAT_TOOL = "/usr/bin/stat";
const SHA256 = /^[a-f0-9]{64}$/u;
const HEX_BYTE_STREAM = /^(?:[A-F0-9]{2})(?: [A-F0-9]{2})*$/u;
const ALLOWED_XATTRS = new Set(["com.apple.provenance"]);

export const INPUTS = Object.freeze([
  {
    role: "partial-order-graph",
    path: "reports/g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1.json",
    bytes: 47214,
    sha256: "8a9e5711ebb14c2acab46013772214c1be79d73fae10d9ecaaf011b5ea96b819",
    mode: "0444",
  },
  {
    role: "partial-order-graph-builder",
    path: "scripts/build-g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1.mjs",
    bytes: 48641,
    sha256: "7f291baaf2ccb6b1204bdafd77f2cd78818add1c6202f077410921da8faaf24e",
    mode: "0644",
  },
  {
    role: "partial-order-graph-builder-test",
    path: "scripts/build-g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1.test.mjs",
    bytes: 9634,
    sha256: "1c2fc0ee4650b7548e1c90060a37c3e148dfab440d867ddca117c013e4ca237d",
    mode: "0644",
  },
  {
    role: "host-entry-antecedent",
    path: "reports/g4-l10-vb003-host-entry-antecedent.json",
    bytes: 38497,
    sha256: "9c64d146c8560551beac47fd493c0a9a35135e3d4dc756363f3ac643525c595d",
    mode: "0644",
  },
  {
    role: "language-audio-technical-binding",
    path: "migrations/course-g04-l10-vb-003/audit/language-audio-technical-binding.json",
    bytes: 17024,
    sha256: "ac87d1db72a799b8ec58a451051dc7d1e9cfe3d104c1722058b36769dc44081e",
    mode: "0644",
  },
  {
    role: "original-runtime-baseline-gap-matrix",
    path: "reports/g4-l10-vb003-original-runtime-baseline-acquisition-gap-matrix-v1.json",
    bytes: 16324,
    sha256: "9bfa425bbc79feec945985358aa79d60bc9d2565a6571b44f55eee14443ce603",
    mode: "0444",
  },
  {
    role: "scenario-inventory",
    path: "migrations/course-g04-l10-vb-003/audit/scenario-inventory.json",
    bytes: 134836,
    sha256: "55a149952185c0f45e5843f6018288f7036269807cca1264e41905038a08b44a",
    mode: "0644",
  },
  {
    role: "latest-native-helper-security-review-failure",
    path: "reports/g4-l10-native-helper-v2-14-independent-review-batch-4d05187e-failed-v1.json",
    bytes: 9999,
    sha256: "de1bfbf4323a44360932851772bf35db09f8bc3e4310f65eac28b976aa002ea2",
    mode: "0444",
  },
]);

const GRAPH_SET_IDENTITIES = Object.freeze({
  sourceStaticObligationAtomSet: Object.freeze({
    count: 10,
    sha256: "19c1b88dc34b6623de13964d145a3238f5ad5ff0264bff1d8b730338812595b3",
  }),
  verifiedStaticNodeSet: Object.freeze({
    count: 37,
    sha256: "986360d84d88982dc7e24abca6d770ec7bdc8c4fd7623b85bd3eded176d5bb66",
  }),
  verifiedStaticEdgeSet: Object.freeze({
    count: 28,
    sha256: "a3d1115500501abfd387759f04239e8ebf72c897e0a0faf07312f2f90ede311f",
  }),
  unresolvedCausalityEdgeSet: Object.freeze({
    count: 17,
    sha256: "d6b938ce5cee972ab6a22d33257b54c44558709e9cd6f954b9e12ade27e05efc",
  }),
  unresolvedRuntimeClaimSet: Object.freeze({
    count: 10,
    sha256: "e1918d0c7950f5b49fc0cce356cfbb6ca77f3d744ee32fe73decef8af273eb5b",
  }),
  candidateBranchSurfaceSet: Object.freeze({
    count: 11,
    sha256: "fd01c88fa69e5457c48406785ebd0fbbc1097f1e4b56a52a2ca2826bf60ae609",
  }),
});

const AUTHORITY_EFFECT_KEYS = Object.freeze([
  "reviewTaskAuthorization",
  "reviewVerdict",
  "securityReviewAcceptance",
  "successorSecurityContract",
  "productionHelperImplementation",
  "productionHelperTesting",
  "protectedInstallation",
  "helperExecution",
  "originalRuntimeLaunch",
  "authoritativeOriginalRuntimeEvidence",
  "naturalTraceRequirementAdoption",
  "formalTraceSpecificationCreation",
  "captureKitCreation",
  "baselineAdoption",
  "specificationAdoption",
  "rendererImplementation",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "lessonBatchAdmission",
  "wholeLessonIntegration",
  "wholeCourseIntegration",
  "sourcePromotion",
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
    `Duplicate xattr names: ${absolute}`);
  assert.equal(names.includes("com.apple.quarantine"), false,
    `Quarantine xattr is forbidden: ${absolute}`);
  for (const name of names) {
    assert.ok(ALLOWED_XATTRS.has(name),
      `Unexpected xattr is fail-closed: ${name} on ${absolute}`);
  }
  const rows = [];
  for (const name of names.sort(compareText)) {
    const observed = await execFile(XATTR_TOOL, ["-px", name, absolute], {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    });
    const compact = observed.stdout.trim().split(/\s+/u).join("").toUpperCase();
    assert.match(compact, /^(?:[A-F0-9]{2})+$/u,
      `Invalid xattr hex observation: ${name} on ${absolute}`);
    const hex = compact.match(/.{2}/gu).join(" ");
    assert.match(hex, HEX_BYTE_STREAM);
    const bytes = Buffer.from(compact, "hex");
    rows.push({
      name,
      valueBytes: bytes.length,
      valueHex: hex,
      valueSha256: sha256(bytes),
      authorityEffect: false,
    });
  }
  return rows;
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
    `Review input must end in LF for exact native sed extraction: ${relativePath}`);
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
      assert.notEqual(lf, -1,
        `Unterminated line in review input: ${relativePath}`);
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
  const xattrsBefore = await xattrSnapshot(absolute);
  const content = await readFile(absolute);
  const flags = await nativeFlags(absolute);
  const xattrsAfter = await xattrSnapshot(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `Input changed while observed: ${expected.path}`);
  assert.deepEqual(xattrsAfter, xattrsBefore,
    `Input xattrs changed while observed: ${expected.path}`);
  assert.equal(content.length, expected.bytes,
    `Input byte count drifted: ${expected.path}`);
  assert.equal(sha256(content), expected.sha256,
    `Input SHA-256 drifted: ${expected.path}`);
  assert.equal(modeString(before), expected.mode,
    `Input mode drifted: ${expected.path}`);
  assertUtf8RoundTrip(content, expected.path);
  const chunks = buildLineChunks(content, expected.path);
  return {
    content,
    record: {
      role: expected.role,
      path: expected.path,
      bytes: content.length,
      sha256: expected.sha256,
      mode: expected.mode,
      finalLf: 1,
      lfCount: content.reduce((count, byte) =>
        count + Number(byte === 0x0a), 0),
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
    },
  };
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
      `${item.path}\0${xattr.name}\0${xattr.valueHex}\0${xattr.valueSha256}\n`));
  return sha256(records.sort(compareText).join(""));
}

function parseJsonInput(contents, role) {
  const content = contents.get(role);
  assert.ok(content, `Missing stable content for ${role}`);
  return JSON.parse(content.toString("utf8"));
}

function validateGraph(graph) {
  assert.equal(graph.status,
    "SOURCE_STATIC_PARTIAL_ORDER_ONLY_RUNTIME_CAUSALITY_AND_TRACE_SCHEDULE_UNRESOLVED");
  assert.equal(graph.decision,
    "DO_NOT_CREATE_FORMAL_NATURAL_TRACE_OR_CAPTURE_KIT_DO_NOT_LAUNCH");
  assert.equal(graph.graphFingerprintSha256,
    "f599dfa3ad1c2ebb24b79fba0fc529fd145481968bee11077a30e670f47fe11a");
  for (const [key, identity] of Object.entries(GRAPH_SET_IDENTITIES)) {
    assert.equal(graph.scope[key].count, identity.count,
      `Graph count drifted: ${key}`);
    assert.equal(graph.scope[key].sha256, identity.sha256,
      `Graph set SHA-256 drifted: ${key}`);
  }
  assert.equal(graph.nodes.length, 37);
  assert.equal(graph.verifiedStaticEdges.length, 28);
  assert.equal(graph.unresolvedRuntimeCausalityEdges.length, 17);
  assert.equal(graph.unresolvedRuntimeClaims.length, 10);
  assert.equal(graph.candidateBranchSurfaces.length, 11);
  assert.ok(Object.values(graph.orderingSemantics).every((value) =>
    value === false));
  assert.deepEqual({
    graphIsFormalTraceSpecification:
      graph.formalizationBoundary.graphIsFormalTraceSpecification,
    candidateBranchesAreFormalRequirements:
      graph.formalizationBoundary.candidateBranchesAreFormalRequirements,
    coverageRequirementsCreated:
      graph.formalizationBoundary.coverageRequirementsCreated,
    orderedNaturalTraceStepsCreated:
      graph.formalizationBoundary.orderedNaturalTraceStepsCreated,
    traceSpecsCreated: graph.formalizationBoundary.traceSpecsCreated,
    captureKitsCreated: graph.formalizationBoundary.captureKitsCreated,
    reviewVerdictPresent: graph.formalizationBoundary.reviewVerdictPresent,
  }, {
    graphIsFormalTraceSpecification: false,
    candidateBranchesAreFormalRequirements: false,
    coverageRequirementsCreated: 0,
    orderedNaturalTraceStepsCreated: 0,
    traceSpecsCreated: 0,
    captureKitsCreated: 0,
    reviewVerdictPresent: false,
  });
  assert.deepEqual(graph.currentEvidenceState, {
    currentRootVisualKitCount: 2,
    currentNaturalTraceKitCount: 0,
    authoritativeOriginalRuntimeSessions: 0,
    authoritativeOriginalRuntimeFrames: 0,
    namedHumanListeningSessions: 0,
    spokenLanguageEstablishedCueCount: 0,
    runtimeReachabilityEstablishedCueCount: 0,
    synchronizedCueCount: 0,
    acceptedCueCount: 0,
    replayResetEstablished: false,
    vb003BaselineComplete: false,
  });
  assert.ok(Object.values(graph.authorityEffects).every((value) =>
    value === false));
}

function validateLatestSecurityFailure(receipt) {
  assert.equal(receipt.status,
    "FAILED_TWO_TASK_SYSTEM_INCOMPLETE_ONE_P1_NONREUSABLE_NO_IMPLEMENTATION_AUTHORITY");
  assert.equal(receipt.batch.hmg4rb4,
    "4d05187e1306c9d1da49fd5ba9a0501f2fce4a8bd165e4cb4953ec5273c1efc4");
  assert.equal(receipt.batchResult.allThreeQualifyingIndependentReviews, false);
  assert.equal(receipt.batchResult.allThreeP0P1P2Zero, false);
  assert.equal(receipt.batchResult.specReviewQualified, false);
  assert.equal(receipt.batchResult.productionHelperImplementationEligible, false);
  assert.equal(receipt.batchResult.reusable, false);
  assert.deepEqual(receipt.tasks.map((task) => [
    task.scope,
    task.P0,
    task.P1,
    task.P2,
  ]), [
    ["schema", "UNEVALUATED_NOT_ZERO", "UNEVALUATED_NOT_ZERO",
      "UNEVALUATED_NOT_ZERO"],
    ["adversarial", "UNEVALUATED_NOT_ZERO", "UNEVALUATED_NOT_ZERO",
      "UNEVALUATED_NOT_ZERO"],
    ["whole", 0, 1, 0],
  ]);
  assert.equal(receipt.tasks[0].originalFinalOutputAvailable, false);
  assert.equal(receipt.tasks[1].originalFinalOutputAvailable, false);
  assert.ok(receipt.tasks[2].originalFinalOutputUtf8Bytes > 0);
  assert.ok(Object.values(receipt.authorityEffects).every((value) =>
    value === false));
}

function renderMarkdown(document) {
  const inputRows = document.reviewUniverse.inputs.map((input) =>
    `| \`${input.role}\` | \`${input.path}\` | ${input.bytes} | \`${input.sha256}\` | \`${input.mode}\` | ${input.chunks.length} | ${input.maximumLineChunkBytes} |`).join("\n");
  const setRows = Object.entries(document.graphBinding.exactSets).map(
    ([name, value]) => `| \`${name}\` | ${value.count} | \`${value.sha256}\` |`)
    .join("\n");
  return `# G4 L10 VB003 source-static natural-trace partial-order graph v1 review input\n\n` +
    `Status: \`${document.status}\`\n\n` +
    `This is a frozen, acceptance-neutral review input. It is not an independent-review verdict, formal natural-trace specification, capture kit, original-runtime authority, security acceptance, helper implementation, baseline, renderer, or release decision.\n\n` +
    `## Exact closure\n\n` +
    `- Review-universe files: ${document.reviewUniverse.fileCount}\n` +
    `- Review-universe bytes: ${document.reviewUniverse.totalBytes}\n` +
    `- Review-universe set SHA-256: \`${document.reviewUniverse.setSha256}\`\n` +
    `- Chunk count: ${document.chunkTransport.chunkCount}\n` +
    `- Maximum chunk bytes: ${document.chunkTransport.maximumObservedChunkBytes}\n` +
    `- Chunk-set SHA-256: \`${document.chunkTransport.chunkSetSha256}\`\n` +
    `- Xattr-set SHA-256: \`${document.xattrPolicy.observedSetSha256}\`\n` +
    `- Review-input fingerprint SHA-256: \`${document.reviewInputFingerprintSha256}\`\n\n` +
    `## Inputs\n\n` +
    `| Role | Path | Bytes | SHA-256 | Mode | Chunks | Max chunk |\n` +
    `|---|---|---:|---|---:|---:|---:|\n${inputRows}\n\n` +
    `The JSON companion freezes every native \`sed -n\` line range. A reviewer must emit at most one declared content chunk per terminal result, verify that private temporary chunk with native \`wc\` and \`shasum\`, and reconstruct each file without emitting any whole file or aggregate.\n\n` +
    `## Graph sets\n\n` +
    `| Set | Count | SHA-256 |\n|---|---:|---|\n${setRows}\n\n` +
    `These are source-static sets only. The 17 unresolved causal edges, 10 unresolved runtime claims, and 11 candidate branch surfaces are not formal requirements or runtime facts.\n\n` +
    `## Review scopes\n\n` +
    document.reviewScopes.map((scope) =>
      `- **${scope.scope}:** ${scope.requirements.join("; ")}.`).join("\n") +
    `\n\n## Closed authority\n\n` +
    `No reviewer task is authorized or created by this artifact. The latest v2.14 helper-security batch is failed, nonreusable, and not specification-review-qualified; it grants no production-helper or runtime authority. Every authority and acceptance effect remains false.\n`;
}

async function builderIdentity(root) {
  const currentScriptRelative = path.relative(root, scriptPath)
    .split(path.sep).join("/");
  const script = await readFile(scriptPath);
  const test = await readFile(resolveInside(root, TEST_RELATIVE));
  return {
    generator: {
      path: currentScriptRelative,
      bytes: script.length,
      sha256: sha256(script),
    },
    test: {
      path: TEST_RELATIVE,
      bytes: test.length,
      sha256: sha256(test),
    },
  };
}

export async function buildReviewInput(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const observed = [];
  for (const expected of INPUTS) observed.push(await stableFile(root, expected));
  const inputs = observed.map(({record}) => record);
  const contents = new Map(observed.map(({record, content}) =>
    [record.role, content]));
  const graph = parseJsonInput(contents, "partial-order-graph");
  const latestSecurityFailure = parseJsonInput(contents,
    "latest-native-helper-security-review-failure");
  validateGraph(graph);
  validateLatestSecurityFailure(latestSecurityFailure);
  const totalBytes = inputs.reduce((sum, input) => sum + input.bytes, 0);
  const allChunks = inputs.flatMap((input) => input.chunks);
  const authorityEffects = Object.fromEntries(AUTHORITY_EFFECT_KEYS.map((key) =>
    [key, false]));
  const documentWithoutFingerprint = {
    schemaVersion: 1,
    artifactType:
      "g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1-review-input",
    status: "REVIEW_INPUT_FROZEN_NO_REVIEW_TASK_NO_VERDICT_NO_RUNTIME_AUTHORITY",
    decision:
      "DO_NOT_TREAT_GRAPH_AS_INDEPENDENTLY_REVIEWED_DO_NOT_FORMALIZE_DO_NOT_LAUNCH",
    evidenceClass:
      "acceptance-neutral-review-input-of-source-static-analysis-not-runtime-evidence",
    animationId: "course-g04-l10-vb-003",
    releaseId: "lesson-g04-l10-perimeter-area",
    builder: await builderIdentity(root),
    reviewUniverse: {
      fileCount: inputs.length,
      totalBytes,
      setSha256: reviewUniverseSetSha256(inputs),
      inputs,
    },
    chunkTransport: {
      algorithm: "ordered-contiguous-LF-boundary-chunks-v1",
      maximumChunkBytes: MAX_CHUNK_BYTES,
      chunkCount: allChunks.length,
      maximumObservedChunkBytes:
        Math.max(...allChunks.map((chunk) => chunk.bytes)),
      chunkSetSha256: chunkSetSha256(inputs),
      freezeOccursBeforeAnyFutureTaskCreation: true,
      terminalRule:
        "display exactly one declared content chunk per terminal result",
      truncationControl:
        "each declared content chunk is at most 3072 bytes and must be the only content chunk emitted in that terminal result",
      reconstructionRule:
        "explicit ordered concatenation must equal each original input SHA-256 and byte count",
      predeclaredNativeTools: {
        shasum: "/usr/bin/shasum",
        wc: "/usr/bin/wc",
        iconv: "/usr/bin/iconv",
        stat: "/usr/bin/stat",
        xattr: "/usr/bin/xattr",
        ls: "/bin/ls",
        sed: "/usr/bin/sed",
        tr: "/usr/bin/tr",
      },
      nonEvidenceDiagnosticRule:
        "before reading evidence, a future reviewer must confirm each predeclared native tool is executable; that diagnostic is not evidence",
      nativeExtractionTemplate:
        "/usr/bin/sed -n '<firstLine>,<lastLine>p' '<absolute-input>' > '<reviewer-private-/tmp/chunk>'",
      privateChunkVerificationTemplate:
        "/usr/bin/wc -c -l '<reviewer-private-/tmp/chunk>' && /usr/bin/shasum -a 256 '<reviewer-private-/tmp/chunk>'",
      forbidden: [
        "whole-file terminal emission",
        "multiple content chunks in one terminal result",
        "aggregate reconstruction terminal emission",
        "wildcard concatenation",
        "heredoc byte or LF accounting",
        "Python os.listxattr",
        "workspace evidence scratch files",
      ],
    },
    xattrPolicy: {
      nativeTool: XATTR_TOOL,
      allowedAmbientNames: [...ALLOWED_XATTRS].sort(compareText),
      prohibitedNames: ["com.apple.quarantine"],
      unexpectedNameDisposition: "fail-closed",
      provenanceAuthorityEffect: false,
      observedSetSha256: xattrSetSha256(inputs),
    },
    graphBinding: {
      graphFingerprintSha256: graph.graphFingerprintSha256,
      graphStatus: graph.status,
      graphDecision: graph.decision,
      exactSets: GRAPH_SET_IDENTITIES,
      orderingSemanticsAllFalse: true,
      sourceStaticEdgesEstablishRuntimeCausality: false,
      historicalSecurityBoundary: graph.currentGateBoundary,
      historicalSecurityBoundaryIsCurrentAuthority: false,
      latestSecurityFailure: {
        hmg4rb4: latestSecurityFailure.batch.hmg4rb4,
        status: latestSecurityFailure.status,
        specReviewQualified:
          latestSecurityFailure.batchResult.specReviewQualified,
        productionHelperImplementationEligible:
          latestSecurityFailure.batchResult.productionHelperImplementationEligible,
        reusable: latestSecurityFailure.batchResult.reusable,
        wholeP0P1P2: [0, 1, 0],
      },
    },
    formalizationBoundary: {
      graphIsFormalTraceSpecification: false,
      candidateBranchesAreFormalRequirements: false,
      authorizedRuntimeEntryEstablished: false,
      exactOrderedNaturalActionsEstablished: false,
      branchSchedulingEstablished: false,
      replaySchedulingEstablished: false,
      interactionCloseOrResumeSchedulingEstablished: false,
      exactAdditionalKitCount: null,
      exactAdditionalSessionCount: null,
      coverageRequirementsCreated: 0,
      orderedNaturalTraceStepsCreated: 0,
      traceSpecsCreated: 0,
      captureKitsCreated: 0,
      originalRuntimeSessionsCreated: 0,
      originalRuntimeFramesCreated: 0,
      migrationFilesModified: false,
      staticSpecificationApplied: false,
      reviewVerdictPresent: false,
    },
    runtimeEvidenceState: {
      currentRootVisualKitCount: 2,
      currentNaturalTraceKitCount: 0,
      authoritativeOriginalRuntimeSessions: 0,
      authoritativeOriginalRuntimeFrames: 0,
      namedHumanListeningSessions: 0,
      spokenLanguageEstablishedCueCount: 0,
      runtimeReachabilityEstablishedCueCount: 0,
      synchronizedCueCount: 0,
      acceptedCueCount: 0,
      replayResetEstablished: false,
      vb003BaselineComplete: false,
    },
    reviewScopes: [
      {
        scope: "schema-lineage",
        requirements: [
          "validate all eight exact file identities and their source lineage",
          "validate the six graph set counts and SHA-256 identities",
          "validate graph builder, test, antecedent, audio, gap and scenario bindings",
        ],
      },
      {
        scope: "causality-adversarial",
        requirements: [
          "attack every promotion from source-static order to runtime causality",
          "attack promotion of branch surfaces into formal requirements or capture schedules",
          "confirm the historical graph security boundary plus the latest failed batch fail closed",
        ],
      },
      {
        scope: "whole",
        requirements: [
          "read every byte of all eight inputs through the bounded chunk transport",
          "reconcile the 37, 28, 17, 10, 11 and 10 set cardinalities",
          "confirm all formalization, runtime, helper, acceptance, integration and publication gates remain zero or false",
        ],
      },
    ],
    reviewTasks: {
      authorized: false,
      created: false,
      taskIds: [],
      batchId: null,
      verdictPresent: false,
      independentReviewRequiredBeforeAnyFormalization: true,
    },
    authorityEffects,
  };
  assert.equal(inputs.length, 8);
  assert.equal(totalBytes, 322169);
  assert.ok(Object.values(authorityEffects).every((value) => value === false));
  assert.equal(documentWithoutFingerprint.reviewTasks.authorized, false);
  assert.equal(documentWithoutFingerprint.reviewTasks.created, false);
  assert.equal(documentWithoutFingerprint.reviewTasks.verdictPresent, false);
  const reviewInputFingerprintSha256 = sha256(Buffer.from(
    canonicalJson(documentWithoutFingerprint), "utf8"));
  assert.match(reviewInputFingerprintSha256, SHA256);
  const document = {...documentWithoutFingerprint, reviewInputFingerprintSha256};
  const json = `${JSON.stringify(document, null, 2)}\n`;
  const markdown = renderMarkdown(document);
  return {root, document, json, markdown};
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

async function assertInputsCurrent(bundle) {
  const current = await buildReviewInput(bundle.root);
  assert.equal(current.json, bundle.json,
    "Review inputs changed after derivation");
  assert.equal(current.markdown, bundle.markdown,
    "Review Markdown changed after derivation");
}

export async function checkReviewInput(bundle, outputRoot = bundle.root) {
  const root = await canonicalRoot(outputRoot);
  await assertInputsCurrent(bundle);
  for (const [relative, expected] of [
    [JSON_OUTPUT_RELATIVE, bundle.json],
    [MARKDOWN_OUTPUT_RELATIVE, bundle.markdown],
  ]) {
    await stableFile(root, {
      role: "generated-review-input",
      path: relative,
      bytes: Buffer.byteLength(expected),
      sha256: sha256(Buffer.from(expected)),
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
    reviewInputFingerprintSha256:
      bundle.document.reviewInputFingerprintSha256,
    reviewTaskAuthorized: false,
    verdictPresent: false,
    originalRuntimeAuthority: false,
    productionHelperAuthority: false,
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
  await writeFile(jsonState.absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(jsonState.absolute, 0o444);
  await assertInputsCurrent(bundle);
  await (options.beforeMarkdown ?? (async () => {}))();
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
    maximumObservedChunkBytes:
      bundle.document.chunkTransport.maximumObservedChunkBytes,
    reviewInputFingerprintSha256:
      bundle.document.reviewInputFingerprintSha256,
    reviewTaskAuthorized: false,
    verdictPresent: false,
    originalRuntimeAuthority: false,
    productionHelperAuthority: false,
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
