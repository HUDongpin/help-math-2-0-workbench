#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import {
  access,
  lstat,
  open,
  readFile,
  readdir,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SELF = fileURLToPath(import.meta.url);
const DEFAULT_TARGET = path.join(
  ROOT,
  "docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md",
);
const V213 = path.join(
  ROOT,
  "docs/G4_L10_NATIVE_HELPER_V2_13_SECURITY_CONTRACT_SUCCESSOR.md",
);
const V212 = path.join(
  ROOT,
  "docs/G4_L10_NATIVE_HELPER_V2_12_SECURITY_CONTRACT_SUCCESSOR.md",
);
const DEFAULT_PROTOCOL = path.join(
  ROOT,
  "docs/G4_L10_NATIVE_HELPER_V2_15_REVIEW_PROTOCOL_SUCCESSOR.md",
);
const DEFAULT_HISTORY = path.join(
  ROOT,
  "reports/g4-l10-native-helper-strict-v2-14-history-closure-v1.json",
);
const DEFAULT_TEST = path.join(
  ROOT,
  "scripts/g4-l10-native-helper-v2_15-review-verifier.test.mjs",
);

const REQUIRED_TOOLS = Object.freeze([
  "/usr/bin/shasum",
  "/usr/bin/wc",
  "/usr/bin/iconv",
  "/usr/bin/stat",
  "/usr/bin/xattr",
  "/bin/ls",
  "/usr/bin/sed",
  "/usr/bin/tr",
]);
const SCOPES = Object.freeze(["schema", "adversarial", "whole"]);

const EXPECTED = Object.freeze({
  target: {
    bytes: 50310,
    lfCount: 173,
    finalLf: true,
    mode: "0444",
    sha256: "a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510",
  },
  v213: {
    bytes: 19964,
    lfCount: 322,
    finalLf: true,
    mode: "0444",
    sha256: "e8395f34d83b4a9e12fbe426473a7f97afd1b35dfcb20b613813351c21e0e123",
  },
  v212: {
    bytes: 22002,
    lfCount: 435,
    finalLf: true,
    mode: "0444",
    sha256: "7874c4dee7f66203f6485bcac73dd8112a962ca258d63eb15e13001dd7d81a4b",
  },
  hmg4gl4: {
    rowCount: 57,
    bytes: 2811,
    sha256: "088ffbf94d7fc0c32c59af1575d3d2d393ff62475487b71a34fc9aa4e5fa7a3b",
    domainSha256: "2bb9189a08cc95b0690cac14d7b95a8750d99799d9e53f5cdf4cf8413a3a47a9",
  },
  hmg4al3: {
    rowCount: 21,
    edgeCount: 23,
    targetCount: 12,
    bytes: 5064,
    sha256: "2ff22afbae318ee9dad10ed2cad0a28f55479fff4c05ae194febd200473409ad",
    domainSha256: "276023765967427a64c110e53ef119a8f557df4409749d866cc3812c1014484e",
  },
  hmg4pe1: {
    rowCount: 21,
    paragraphCount: 42,
    bytes: 33705,
    sha256: "f4cdd9d5d2ee797e05fc3a63d32af0281ebd19e4e07f58dc2c485235f4aa099d",
    domainSha256: "1c8fbfc16a57e294a4824b3388c6d396fcb2369105c4006815addbbbabca8851",
  },
  hmg4fr3: {
    rowCount: 3,
    bytes: 587,
    sha256: "477d9d3375fd579bb9c5cdd8ee38ff4947b218234395f20a7c1ab72ead22e9bb",
    domainSha256: "ecfefa4e0426805a5baa22fc7a47d929cfd7891a18cbd7e2f41cafebd9e68e54",
  },
});

const HISTORY_PREFIX = "g4-l10-native-helper-v2-14-";
const PROTOCOL_MARKERS = Object.freeze([
  "V2.14 history status: STRICT_BUT_NONQUALIFYING_CLOSED",
  "No new HMG4RB4 batch may be created.",
  "PREFLIGHT_RETRYABLE_NOT_EVIDENCE",
  "MECHANICAL_ERROR_RETRYABLE_SAME_REVIEWER",
  "TARGET_OR_PROTOCOL_CHANGE_REQUIRES_SCOPE_REFRESH_NOT_NEW_TASKS",
  "spec-review-qualified has no implementation or runtime authority.",
]);

class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageError";
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sortedValue(value) {
  if (Array.isArray(value)) return value.map(sortedValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortedValue(value[key])]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(sortedValue(value));
}

function receiptBytes(value) {
  return Buffer.from(`${JSON.stringify(sortedValue(value), null, 2)}\n`, "utf8");
}

function addReceiptId(kind, value) {
  const receiptId = sha256(
    Buffer.from(`HMG4V215-${kind}\n${canonicalJson(value)}\n`, "utf8"),
  );
  return { ...value, receiptId };
}

function validReceiptId(kind, value) {
  if (!value || typeof value !== "object" || typeof value.receiptId !== "string") {
    return false;
  }
  const { receiptId, ...body } = value;
  return addReceiptId(kind, body).receiptId === receiptId;
}

function countLf(bytes) {
  let count = 0;
  for (const byte of bytes) if (byte === 0x0a) count += 1;
  return count;
}

function decodeUtf8(bytes) {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function relativeOrAbsolute(absolutePath) {
  const relative = path.relative(ROOT, absolutePath);
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
    return relative.split(path.sep).join("/");
  }
  return absolutePath;
}

async function facts(absolutePath) {
  const stat = await lstat(absolutePath);
  if (stat.isSymbolicLink()) throw new Error(`symbolic link rejected: ${absolutePath}`);
  const bytes = await readFile(absolutePath);
  return {
    path: relativeOrAbsolute(absolutePath),
    bytes: bytes.length,
    lfCount: countLf(bytes),
    finalLf: bytes.length > 0 && bytes[bytes.length - 1] === 0x0a,
    mode: (stat.mode & 0o7777).toString(8).padStart(4, "0"),
    nlink: stat.nlink,
    regularFile: stat.isFile(),
    sha256: sha256(bytes),
  };
}

function sameIdentity(actual, expected) {
  return ["bytes", "lfCount", "finalLf", "mode", "sha256"].every(
    (key) => actual[key] === expected[key],
  ) && actual.regularFile === true && actual.nlink === 1;
}

function codeBlocks(text) {
  return [...text.matchAll(/```text\n([\s\S]*?)```/g)].map((match) => match[1]);
}

function codeBlocksAfter(text, anchor, label) {
  const offset = text.indexOf(anchor);
  if (offset < 0) throw new Error(`${label} anchor not found`);
  return codeBlocks(text.slice(offset + anchor.length));
}

function linesFromBlock(block, label) {
  if (!block.endsWith("\n")) throw new Error(`${label} lacks final LF`);
  if (block.includes("\r")) throw new Error(`${label} contains CR`);
  const lines = block.slice(0, -1).split("\n");
  if (lines.some((line) => line.length === 0)) throw new Error(`${label} has blank row`);
  return lines;
}

function findBlock(blocks, predicate, label) {
  const matches = blocks.filter((block) => {
    try {
      return predicate(linesFromBlock(block, label));
    } catch {
      return false;
    }
  });
  if (matches.length !== 1) {
    throw new Error(`${label} expected one code block, found ${matches.length}`);
  }
  return matches[0];
}

function pushCheck(errors, id, condition, expected, actual) {
  if (condition) return;
  errors.push({ id, expected, actual });
}

function summarizeError(error) {
  return {
    code: typeof error?.code === "string" ? error.code : "UNCLASSIFIED",
    message: String(error?.message ?? error).slice(0, 1000),
  };
}

function exactStringArray(a, b) {
  return Array.isArray(a)
    && a.length === b.length
    && a.every((entry, index) => entry === b[index]);
}

function parseCli(argv) {
  if (argv.length === 0) throw new UsageError("expected preflight or evidence");
  const command = argv[0];
  if (command !== "preflight" && command !== "evidence") {
    throw new UsageError("first argument must be preflight or evidence");
  }

  const values = new Map();
  const requiredTools = [];
  const allowed = new Set(
    command === "preflight"
      ? ["--output", "--required-tool"]
      : ["--output", "--scope", "--preflight-receipt", "--target"],
  );

  for (let index = 1; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!allowed.has(key)) throw new UsageError(`unknown option: ${key}`);
    if (value === undefined || value.startsWith("--")) {
      throw new UsageError(`missing value for ${key}`);
    }
    if (key === "--required-tool") {
      requiredTools.push(value);
    } else {
      if (values.has(key)) throw new UsageError(`duplicate option: ${key}`);
      values.set(key, value);
    }
  }

  for (const required of command === "preflight"
    ? ["--output"]
    : ["--output", "--scope", "--preflight-receipt"]) {
    if (!values.has(required)) throw new UsageError(`missing ${required}`);
  }

  const output = path.resolve(values.get("--output"));
  const scope = values.get("--scope");
  if (command === "evidence" && !SCOPES.includes(scope)) {
    throw new UsageError(`scope must be one of ${SCOPES.join(",")}`);
  }

  return {
    command,
    output,
    scope,
    preflightReceipt: values.has("--preflight-receipt")
      ? path.resolve(values.get("--preflight-receipt"))
      : null,
    target: values.has("--target") ? path.resolve(values.get("--target")) : DEFAULT_TARGET,
    requiredTools: requiredTools.length > 0 ? requiredTools : [...REQUIRED_TOOLS],
  };
}

async function assertExternalOutput(output) {
  if (!path.isAbsolute(output)) throw new UsageError("output must be absolute");
  const relative = path.relative(ROOT, output);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
    throw new UsageError("output must be outside the workspace");
  }
  const parentReal = await realpath(path.dirname(output));
  const parentRelative = path.relative(ROOT, parentReal);
  if (!parentRelative.startsWith("..") && !path.isAbsolute(parentRelative)) {
    throw new UsageError("physical output parent must be outside the workspace");
  }
}

async function writeNoClobber(output, value) {
  await assertExternalOutput(output);
  const handle = await open(output, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL, 0o600);
  try {
    await handle.writeFile(receiptBytes(value));
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function syntaxCheck(file) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
    timeout: 60000,
  });
  return {
    ok: result.status === 0 && result.signal === null,
    exitCode: result.status,
    signal: result.signal,
    stdout: String(result.stdout ?? "").slice(0, 2000),
    stderr: String(result.stderr ?? "").slice(0, 2000),
  };
}

function embeddedSelfTests() {
  const checks = [];
  const add = (id, fn) => {
    try {
      fn();
      checks.push({ id, ok: true });
    } catch (error) {
      checks.push({ id, ok: false, error: summarizeError(error) });
    }
  };

  add("utf8-fatal-decoder", () => {
    if (decodeUtf8(Buffer.from("Aπ文", "utf8")) !== "Aπ文") throw new Error("valid UTF-8 changed");
    let rejected = false;
    try {
      decodeUtf8(Buffer.from([0xc3, 0x28]));
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error("invalid UTF-8 accepted");
  });
  add("lf-and-extraction", () => {
    const sample = "α\nβ\n";
    const rows = linesFromBlock(sample, "self-test");
    if (rows.length !== 2 || rows[0] !== "α" || countLf(Buffer.from(sample)) !== 2) {
      throw new Error("strict extraction mismatch");
    }
  });
  add("canonical-base64", () => {
    const source = Buffer.from("deterministic-π", "utf8");
    const encoded = source.toString("base64");
    if (Buffer.from(encoded, "base64").toString("base64") !== encoded) {
      throw new Error("Base64 round trip mismatch");
    }
  });
  add("sha256-known-answer", () => {
    if (sha256(Buffer.from("abc")) !== "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad") {
      throw new Error("SHA-256 known answer mismatch");
    }
  });
  add("stable-json-and-receipt", () => {
    const left = canonicalJson({ z: 1, a: { y: 2, x: 3 } });
    const right = canonicalJson({ a: { x: 3, y: 2 }, z: 1 });
    if (left !== right) throw new Error("object-key order changed canonical JSON");
    const receipt = addReceiptId("SELFTEST", { b: 2, a: 1 });
    if (!validReceiptId("SELFTEST", receipt)) throw new Error("receipt ID did not validate");
  });

  return checks;
}

async function safeFacts(file) {
  try {
    return { ok: true, value: await facts(file) };
  } catch (error) {
    return { ok: false, error: summarizeError(error), path: relativeOrAbsolute(file) };
  }
}

async function buildPreflight(options) {
  const checks = [];
  const add = (id, ok, detail = undefined) => {
    checks.push(detail === undefined ? { id, ok } : { id, ok, detail });
  };

  add("platform-darwin", process.platform === "darwin", process.platform);
  const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
  add("node-major-at-least-24", Number.isInteger(nodeMajor) && nodeMajor >= 24, process.versions.node);

  const canonicalToolSet = exactStringArray(options.requiredTools, REQUIRED_TOOLS);
  add("canonical-eight-tool-set", canonicalToolSet, options.requiredTools);
  for (const tool of options.requiredTools) {
    try {
      await access(tool, fsConstants.X_OK);
      add(`tool-executable:${tool}`, true);
    } catch (error) {
      add(`tool-executable:${tool}`, false, summarizeError(error));
    }
  }

  const selfTests = embeddedSelfTests();
  for (const check of selfTests) add(`self-test:${check.id}`, check.ok, check.error);

  const syntax = {
    verifier: syntaxCheck(SELF),
    focusedTest: syntaxCheck(DEFAULT_TEST),
  };
  add("syntax:verifier", syntax.verifier.ok, syntax.verifier);
  add("syntax:focused-test", syntax.focusedTest.ok, syntax.focusedTest);

  const anchors = {
    verifier: await safeFacts(SELF),
    focusedTest: await safeFacts(DEFAULT_TEST),
    protocol: await safeFacts(DEFAULT_PROTOCOL),
    historyClosure: await safeFacts(DEFAULT_HISTORY),
    target: await safeFacts(DEFAULT_TARGET),
  };
  for (const [name, result] of Object.entries(anchors)) add(`read:${name}`, result.ok, result);
  if (anchors.target.ok) {
    add("target:frozen-v2.14-identity", sameIdentity(anchors.target.value, EXPECTED.target), anchors.target.value);
  } else {
    add("target:frozen-v2.14-identity", false, anchors.target);
  }

  const ready = checks.every((check) => check.ok);
  return addReceiptId("PREFLIGHT", {
    schemaVersion: 1,
    artifactType: "g4-l10-native-helper-v2-15-review-preflight",
    command: "preflight",
    status: ready ? "READY_FOR_FORMAL_EVIDENCE" : "PREFLIGHT_RETRYABLE_NOT_EVIDENCE",
    canonicalToolSet,
    requiredTools: options.requiredTools,
    node: {
      executable: process.execPath,
      version: process.versions.node,
      platform: process.platform,
      arch: process.arch,
    },
    anchors,
    syntax,
    selfTests,
    checks,
    authorityEffects: closedAuthority(),
  });
}

function closedAuthority() {
  return {
    implementation: false,
    helperTest: false,
    helperExecution: false,
    runtimeLaunch: false,
    v28Transition: false,
    acceptance: false,
    strictCompletion: false,
    sourcePromotion: false,
    integration: false,
    release: false,
    publication: false,
  };
}

function validateProtocol(text, errors) {
  for (const marker of PROTOCOL_MARKERS) {
    pushCheck(errors, `protocol-marker:${marker}`, text.includes(marker), true, false);
  }
  pushCheck(
    errors,
    "protocol-three-scopes",
    SCOPES.every((scope) => text.includes(`\`${scope}\``)),
    SCOPES,
    "one or more scope markers missing",
  );
}

async function validateHistory(errors) {
  const raw = await readFile(DEFAULT_HISTORY);
  let manifest;
  try {
    manifest = JSON.parse(decodeUtf8(raw));
  } catch (error) {
    pushCheck(errors, "history-json", false, "valid UTF-8 JSON", summarizeError(error));
    return { manifest: null, verifiedArtifactCount: 0 };
  }

  pushCheck(errors, "history-status", manifest.status === "STRICT_BUT_NONQUALIFYING_CLOSED", "STRICT_BUT_NONQUALIFYING_CLOSED", manifest.status);
  pushCheck(errors, "history-artifact-count", Array.isArray(manifest.artifacts) && manifest.artifacts.length === 17, 17, manifest.artifacts?.length);
  pushCheck(errors, "history-summary-count", manifest.summary?.artifactCount === 17, 17, manifest.summary?.artifactCount);
  pushCheck(errors, "history-failed-count", manifest.summary?.failedBatchReceiptCount === 6, 6, manifest.summary?.failedBatchReceiptCount);
  pushCheck(errors, "history-activation-count", manifest.summary?.activationReceiptCount === 4, 4, manifest.summary?.activationReceiptCount);
  pushCheck(errors, "history-plan-count", manifest.summary?.chunkPlanCount === 6, 6, manifest.summary?.chunkPlanCount);
  pushCheck(errors, "history-qualifying-count", manifest.summary?.qualifyingReviewCount === 0, 0, manifest.summary?.qualifyingReviewCount);

  const falseRules = [
    "newHMG4RB4BatchesAllowed",
    "newV214PrefixedArtifactsAllowed",
    "historicalResultCanBecomePass",
    "historicalTaskOrOutputReuseAllowed",
    "implementationAuthority",
    "runtimeAuthority",
    "v28TransitionAuthority",
    "acceptanceAuthority",
    "releaseAuthority",
    "publicationAuthority",
  ];
  for (const rule of falseRules) {
    pushCheck(errors, `history-rule:${rule}`, manifest.rules?.[rule] === false, false, manifest.rules?.[rule]);
  }

  const failedIds = [
    "487d5f85f7cd3be759a8863dcbde09d4675ab68e00b91c77e415234692d0a20c",
    "4b098db0605790fa05066d55e3d3da102661be90c9b5a7191b35ec2b7bed1b08",
    "4d05187e1306c9d1da49fd5ba9a0501f2fce4a8bd165e4cb4953ec5273c1efc4",
    "ab155b63e1ffd8bdf588b0e5b69072e42542dabe99c936adbc1ad8caff289e0a",
    "ae013cdb3b78751a0d23a7699c7d054555e928b174ddfd216a4410bf99208c6f",
    "c9f781b1cc093b74af16916fa226432aa222aeafed5d18bbd8c5a0d9678522f3",
  ];
  pushCheck(errors, "history-six-failed-domain-ids", exactStringArray(manifest.failedHMG4RB4, failedIds), failedIds, manifest.failedHMG4RB4);

  const artifacts = Array.isArray(manifest.artifacts) ? manifest.artifacts : [];
  const paths = artifacts.map((entry) => entry.path);
  pushCheck(errors, "history-unique-paths", new Set(paths).size === paths.length, paths.length, new Set(paths).size);

  const reportNames = (await readdir(path.join(ROOT, "reports")))
    .filter((name) => name.startsWith(HISTORY_PREFIX))
    .sort();
  const discovered = [
    "docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md",
    ...reportNames.map((name) => `reports/${name}`),
  ];
  pushCheck(errors, "history-exact-discovery-allowlist", exactStringArray(paths, discovered), paths, discovered);

  let verifiedArtifactCount = 0;
  const failedReceiptTexts = [];
  for (const entry of artifacts) {
    const absolute = path.join(ROOT, entry.path);
    try {
      const identity = await facts(absolute);
      const matches = identity.bytes === entry.bytes
        && identity.lfCount === entry.lfCount
        && identity.mode === entry.mode
        && identity.sha256 === entry.sha256
        && identity.regularFile
        && identity.nlink === 1;
      pushCheck(errors, `history-member:${entry.path}`, matches, entry, identity);
      if (matches) verifiedArtifactCount += 1;
      if (entry.role === "failed-batch-receipt") {
        failedReceiptTexts.push(decodeUtf8(await readFile(absolute)));
      }
    } catch (error) {
      pushCheck(errors, `history-member:${entry.path}`, false, entry, summarizeError(error));
    }
  }
  for (const failedId of failedIds) {
    const containing = failedReceiptTexts.filter((text) => text.includes(failedId)).length;
    pushCheck(errors, `history-failed-domain-present:${failedId}`, containing === 1, 1, containing);
  }

  return { manifest, verifiedArtifactCount };
}

function validateHmgStructures(v214Text, v213Text, v212Text, errors) {
  const b214 = codeBlocks(v214Text);
  const b213 = codeBlocks(v213Text);
  const b212 = codeBlocks(v212Text);

  const gl2 = findBlock(
    codeBlocksAfter(v212Text, "## 1. Exact HMG4GL2 historical finding ledger", "HMG4GL2"),
    (rows) => rows.length === 52 && rows[0] === "P1 GATE-A-A1-ABI-BINDING-ROW-COUNT",
    "HMG4GL2",
  );
  const gd3 = findBlock(
    codeBlocksAfter(v213Text, "## 1. Exact HMG4GL3 historical ledger extension", "HMG4GD3"),
    (rows) => rows.length === 3 && rows[0] === "P1 V212-V211-ALIAS-CONSOLIDATION-CROSSWALK-UNBOUND",
    "HMG4GD3",
  );
  const gd4 = findBlock(
    codeBlocksAfter(v214Text, "## 1. Exact HMG4GL4 historical-ledger extension", "HMG4GD4"),
    (rows) => rows.length === 2 && rows[0] === "P1 V213-HMG4AL3-HISTORICAL-OUTPUT-PROVENANCE-UNBOUND",
    "HMG4GD4",
  );
  const gl4 = `${gl2}${gd3}${gd4}`;
  const gl4Rows = linesFromBlock(gl4, "HMG4GL4");
  const gl4Ascii = Buffer.from(gl4, "ascii").equals(Buffer.from(gl4, "utf8"));
  pushCheck(errors, "hmg4gl4-ascii", gl4Ascii, true, gl4Ascii);
  pushCheck(errors, "hmg4gl4-row-count", gl4Rows.length === EXPECTED.hmg4gl4.rowCount, EXPECTED.hmg4gl4.rowCount, gl4Rows.length);
  pushCheck(errors, "hmg4gl4-unique", new Set(gl4Rows).size === gl4Rows.length, gl4Rows.length, new Set(gl4Rows).size);
  pushCheck(errors, "hmg4gl4-bytes", Buffer.byteLength(gl4) === EXPECTED.hmg4gl4.bytes, EXPECTED.hmg4gl4.bytes, Buffer.byteLength(gl4));
  pushCheck(errors, "hmg4gl4-sha256", sha256(Buffer.from(gl4)) === EXPECTED.hmg4gl4.sha256, EXPECTED.hmg4gl4.sha256, sha256(Buffer.from(gl4)));
  pushCheck(errors, "hmg4gl4-domain-sha256", sha256(Buffer.concat([Buffer.from("HMG4GL4\n"), Buffer.from(gl4)])) === EXPECTED.hmg4gl4.domainSha256, EXPECTED.hmg4gl4.domainSha256, sha256(Buffer.concat([Buffer.from("HMG4GL4\n"), Buffer.from(gl4)])));

  const al3 = findBlock(
    b213,
    (rows) => rows.length === 21 && rows.every((row) => row.split("|").length === 6) && rows[0].startsWith("F|P1|V211-SEVEN-BYTE"),
    "HMG4AL3",
  );
  const alRows = linesFromBlock(al3, "HMG4AL3").map((row) => row.split("|"));
  const alBytes = Buffer.from(al3);
  const idPattern = /^[A-Z0-9_-]+$/;
  const hashPattern = /^[0-9a-f]{64}$/;
  let alGrammar = true;
  const localIds = new Set();
  const targets = new Set();
  let edges = 0;
  const contributors = new Map();
  const unitPosition = { F: 0, A: 0, W: 0 };
  for (const row of alRows) {
    const [unit, priority, localId, problemHash, remediationHash, canonicalIds] = row;
    unitPosition[unit] = (unitPosition[unit] ?? 0) + 1;
    const contributor = `${unit}${unitPosition[unit]}`;
    const canonical = canonicalIds.split(",");
    alGrammar &&= ["F", "A", "W"].includes(unit)
      && priority === "P1"
      && idPattern.test(localId)
      && hashPattern.test(problemHash)
      && hashPattern.test(remediationHash)
      && canonical.length >= 1
      && canonical.length <= 2
      && canonical.every((id) => idPattern.test(id));
    localIds.add(`${unit}:${localId}`);
    edges += canonical.length;
    for (const target of canonical) {
      targets.add(target);
      if (!contributors.has(target)) contributors.set(target, []);
      contributors.get(target).push(contributor);
    }
  }
  pushCheck(errors, "hmg4al3-grammar", alGrammar, true, alGrammar);
  pushCheck(errors, "hmg4al3-local-unique", localIds.size === alRows.length, alRows.length, localIds.size);
  pushCheck(errors, "hmg4al3-row-count", alRows.length === EXPECTED.hmg4al3.rowCount, EXPECTED.hmg4al3.rowCount, alRows.length);
  pushCheck(errors, "hmg4al3-edge-count", edges === EXPECTED.hmg4al3.edgeCount, EXPECTED.hmg4al3.edgeCount, edges);
  pushCheck(errors, "hmg4al3-target-count", targets.size === EXPECTED.hmg4al3.targetCount, EXPECTED.hmg4al3.targetCount, targets.size);
  pushCheck(errors, "hmg4al3-bytes", alBytes.length === EXPECTED.hmg4al3.bytes, EXPECTED.hmg4al3.bytes, alBytes.length);
  pushCheck(errors, "hmg4al3-sha256", sha256(alBytes) === EXPECTED.hmg4al3.sha256, EXPECTED.hmg4al3.sha256, sha256(alBytes));
  pushCheck(errors, "hmg4al3-domain-sha256", sha256(Buffer.concat([Buffer.from("HMG4AL3\n"), alBytes])) === EXPECTED.hmg4al3.domainSha256, EXPECTED.hmg4al3.domainSha256, sha256(Buffer.concat([Buffer.from("HMG4AL3\n"), alBytes])));

  const reverseBlock = findBlock(
    b213,
    (rows) => rows.length === 12 && rows.every((row) => /^[A-Z0-9_-]+=([FAW][0-9]+)(,[FAW][0-9]+)*$/.test(row)),
    "HMG4AL3 reverse coverage",
  );
  const reverse = new Map(linesFromBlock(reverseBlock, "HMG4AL3 reverse coverage").map((row) => {
    const [target, csv] = row.split("=");
    return [target, csv.split(",")];
  }));
  let reverseMatches = reverse.size === contributors.size;
  for (const [target, expectedContributors] of contributors) {
    reverseMatches &&= exactStringArray(reverse.get(target), expectedContributors);
  }
  pushCheck(errors, "hmg4al3-reverse-coverage", reverseMatches, Object.fromEntries(contributors), Object.fromEntries(reverse));

  const pe1 = findBlock(
    b214,
    (rows) => rows.length === 21 && rows.every((row) => row.split("|").length === 8) && rows[0].startsWith("F|P1|V211-SEVEN-BYTE"),
    "HMG4PE1",
  );
  const peRows = linesFromBlock(pe1, "HMG4PE1").map((row) => row.split("|"));
  const peBytes = Buffer.from(pe1);
  const base64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  let paragraphCount = 0;
  let peGrammar = true;
  let paragraphHashesMatch = true;
  for (let index = 0; index < peRows.length; index += 1) {
    const [unit, priority, localId, problemLength, problemBase64, remediationLength, remediationBase64, canonicalIds] = peRows[index];
    const al = alRows[index];
    peGrammar &&= unit === al[0] && priority === al[1] && localId === al[2] && canonicalIds === al[5];
    const encodedFields = [
      [problemLength, problemBase64, al[3]],
      [remediationLength, remediationBase64, al[4]],
    ];
    for (const [lengthText, encoded, expectedHash] of encodedFields) {
      paragraphCount += 1;
      const canonicalLength = /^(0|[1-9][0-9]*)$/.test(lengthText);
      const canonicalBase64 = base64Pattern.test(encoded);
      let decoded = Buffer.alloc(0);
      let decodedText = null;
      try {
        decoded = Buffer.from(encoded, "base64");
        decodedText = decodeUtf8(decoded);
      } catch {
        peGrammar = false;
      }
      peGrammar &&= canonicalLength
        && canonicalBase64
        && decoded.length === Number(lengthText)
        && decoded.toString("base64") === encoded
        && decodedText !== null
        && !/[\u0000\r\n]/.test(decodedText);
      paragraphHashesMatch &&= sha256(decoded) === expectedHash;
    }
  }
  pushCheck(errors, "hmg4pe1-grammar-and-crosswalk", peGrammar, true, peGrammar);
  pushCheck(errors, "hmg4pe1-all-paragraph-hashes", paragraphHashesMatch, true, paragraphHashesMatch);
  pushCheck(errors, "hmg4pe1-row-count", peRows.length === EXPECTED.hmg4pe1.rowCount, EXPECTED.hmg4pe1.rowCount, peRows.length);
  pushCheck(errors, "hmg4pe1-paragraph-count", paragraphCount === EXPECTED.hmg4pe1.paragraphCount, EXPECTED.hmg4pe1.paragraphCount, paragraphCount);
  pushCheck(errors, "hmg4pe1-bytes", peBytes.length === EXPECTED.hmg4pe1.bytes, EXPECTED.hmg4pe1.bytes, peBytes.length);
  pushCheck(errors, "hmg4pe1-sha256", sha256(peBytes) === EXPECTED.hmg4pe1.sha256, EXPECTED.hmg4pe1.sha256, sha256(peBytes));
  pushCheck(errors, "hmg4pe1-domain-sha256", sha256(Buffer.concat([Buffer.from("HMG4PE1\n"), peBytes])) === EXPECTED.hmg4pe1.domainSha256, EXPECTED.hmg4pe1.domainSha256, sha256(Buffer.concat([Buffer.from("HMG4PE1\n"), peBytes])));

  const fr3 = findBlock(
    b214,
    (rows) => rows.length === 3 && rows[0].startsWith("schema|") && rows[1].startsWith("adversarial|") && rows[2].startsWith("whole|"),
    "HMG4FR3",
  );
  const frRows = linesFromBlock(fr3, "HMG4FR3").map((row) => row.split("|"));
  const frBytes = Buffer.from(fr3);
  const frGrammar = frRows.every((row) => row.length === 11)
    && exactStringArray(frRows.map((row) => row[0]), SCOPES)
    && frRows.every((row) => /^[0-9a-f]{64}$/.test(row[5]));
  pushCheck(errors, "hmg4fr3-grammar", frGrammar, true, frGrammar);
  pushCheck(errors, "hmg4fr3-row-count", frRows.length === EXPECTED.hmg4fr3.rowCount, EXPECTED.hmg4fr3.rowCount, frRows.length);
  pushCheck(errors, "hmg4fr3-bytes", frBytes.length === EXPECTED.hmg4fr3.bytes, EXPECTED.hmg4fr3.bytes, frBytes.length);
  pushCheck(errors, "hmg4fr3-sha256", sha256(frBytes) === EXPECTED.hmg4fr3.sha256, EXPECTED.hmg4fr3.sha256, sha256(frBytes));
  pushCheck(errors, "hmg4fr3-domain-sha256", sha256(Buffer.concat([Buffer.from("HMG4FR3\n"), frBytes])) === EXPECTED.hmg4fr3.domainSha256, EXPECTED.hmg4fr3.domainSha256, sha256(Buffer.concat([Buffer.from("HMG4FR3\n"), frBytes])));
  pushCheck(errors, "hmg4fr3-failure-interpretation", v214Text.includes("HMG4FR3 is a failure receipt, not a review result for v2.14."), true, false);

  return {
    hmg4gl4: { ...EXPECTED.hmg4gl4, verified: errors.every((error) => !error.id.startsWith("hmg4gl4")) },
    hmg4al3: { ...EXPECTED.hmg4al3, verified: errors.every((error) => !error.id.startsWith("hmg4al3")) },
    hmg4pe1: { ...EXPECTED.hmg4pe1, verified: errors.every((error) => !error.id.startsWith("hmg4pe1")) },
    hmg4fr3: { ...EXPECTED.hmg4fr3, interpretation: "failed-v2.13-batch-output-identity-receipt-not-v2.14-review-result", verified: errors.every((error) => !error.id.startsWith("hmg4fr3")) },
  };
}

function validateOrderedSections(text, errors) {
  const headings = [
    "## 0. Direct predecessor, failed v2.13 batch, and retained scope",
    "## 1. Exact HMG4GL4 historical-ledger extension",
    "## 2. HMG4PE1 self-contained paragraph-preimage envelope",
    "## 3. New user-owned v2.14 independent-review batch",
    "## 4. Retained clean-room and V28 operational boundary",
    "## 5. Closed no-authority and Grade 4 boundary",
  ];
  const positions = headings.map((heading) => text.indexOf(heading));
  const ordered = positions.every((position) => position >= 0)
    && positions.every((position, index) => index === 0 || position > positions[index - 1]);
  pushCheck(errors, "v2.14-section-order", ordered, headings, positions);
}

function validateRetainedBoundaries(text, errors) {
  const markers = [
    "Operational freeze is false.",
    "57 writable mode-`0644` files",
    "48 native members",
    "nine non-Gate-A top-level runners",
    "553,897 total bytes",
    "cfa98f5fd9a101c35944b4ef59a8b5db36f3a799ee7821ca4e286476acea3200",
    "native-root mode `0755`",
    "The sixteen missing MP3s remain unresolved.",
    "does not itself authorize a permission transition, helper implementation, helper test, helper execution",
    "No repository-local PASS, receipt, controller, companion, publisher, or generated artifact can self-authorize.",
  ];
  for (const marker of markers) {
    pushCheck(errors, `retained-boundary:${marker}`, text.includes(marker), true, false);
  }
}

async function parsePreflightReceipt(file, errors) {
  let raw;
  try {
    raw = await readFile(file);
  } catch (error) {
    pushCheck(errors, "preflight-receipt-readable", false, true, summarizeError(error));
    return { raw: null, value: null };
  }
  let value;
  try {
    value = JSON.parse(decodeUtf8(raw));
  } catch (error) {
    pushCheck(errors, "preflight-receipt-json", false, "valid UTF-8 JSON", summarizeError(error));
    return { raw, value: null };
  }
  pushCheck(errors, "preflight-receipt-id", validReceiptId("PREFLIGHT", value), true, value.receiptId);
  pushCheck(errors, "preflight-receipt-status", value.status === "READY_FOR_FORMAL_EVIDENCE", "READY_FOR_FORMAL_EVIDENCE", value.status);
  pushCheck(errors, "preflight-receipt-tool-set", value.canonicalToolSet === true && exactStringArray(value.requiredTools, REQUIRED_TOOLS), REQUIRED_TOOLS, value.requiredTools);
  pushCheck(errors, "preflight-receipt-checks", Array.isArray(value.checks) && value.checks.every((check) => check.ok === true), "all true", value.checks);
  return { raw, value };
}

async function buildEvidence(options) {
  const errors = [];
  const parsedPreflight = await parsePreflightReceipt(options.preflightReceipt, errors);
  const currentAnchorFacts = {
    verifier: await facts(SELF),
    focusedTest: await facts(DEFAULT_TEST),
    protocol: await facts(DEFAULT_PROTOCOL),
    historyClosure: await facts(DEFAULT_HISTORY),
  };

  if (parsedPreflight.value) {
    for (const [name, current] of Object.entries(currentAnchorFacts)) {
      const recorded = parsedPreflight.value.anchors?.[name];
      pushCheck(
        errors,
        `preflight-anchor-current:${name}`,
        recorded?.ok === true && canonicalJson(recorded.value) === canonicalJson(current),
        current,
        recorded,
      );
    }
    const recordedTarget = parsedPreflight.value.anchors?.target;
    pushCheck(
      errors,
      "preflight-target-path",
      recordedTarget?.ok === true && recordedTarget.value.path === relativeOrAbsolute(options.target),
      relativeOrAbsolute(options.target),
      recordedTarget?.value?.path,
    );
  }

  const currentSelfTests = embeddedSelfTests();
  pushCheck(errors, "formal-verifier-self-tests", currentSelfTests.every((check) => check.ok), "all true", currentSelfTests);

  const targetBefore = await facts(options.target);
  pushCheck(errors, "target-original-path", path.resolve(options.target) === DEFAULT_TARGET, DEFAULT_TARGET, path.resolve(options.target));
  pushCheck(errors, "target-before-identity", sameIdentity(targetBefore, EXPECTED.target), EXPECTED.target, targetBefore);

  const v213Facts = await facts(V213);
  const v212Facts = await facts(V212);
  pushCheck(errors, "v2.13-predecessor-identity", sameIdentity(v213Facts, EXPECTED.v213), EXPECTED.v213, v213Facts);
  pushCheck(errors, "v2.12-ledger-source-identity", sameIdentity(v212Facts, EXPECTED.v212), EXPECTED.v212, v212Facts);

  const [targetBytes, v213Bytes, v212Bytes, protocolBytes] = await Promise.all([
    readFile(options.target),
    readFile(V213),
    readFile(V212),
    readFile(DEFAULT_PROTOCOL),
  ]);
  const targetText = decodeUtf8(targetBytes);
  const v213Text = decodeUtf8(v213Bytes);
  const v212Text = decodeUtf8(v212Bytes);
  const protocolText = decodeUtf8(protocolBytes);

  validateProtocol(protocolText, errors);
  validateOrderedSections(targetText, errors);
  validateRetainedBoundaries(targetText, errors);
  const history = await validateHistory(errors);
  const structures = validateHmgStructures(targetText, v213Text, v212Text, errors);

  const targetAfter = await facts(options.target);
  pushCheck(errors, "target-before-after-identity", canonicalJson(targetBefore) === canonicalJson(targetAfter), targetBefore, targetAfter);

  const status = errors.length === 0
    ? "VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW"
    : "EVIDENCE_INPUT_MISMATCH";
  const scopeFocus = {
    schema: ["production grammar", "HMG4GL4", "HMG4AL3", "all 42 HMG4PE1 paragraphs", "HMG4FR3"],
    adversarial: ["ownership and replay", "root and input spoofing", "encoding aliases", "error disclosure", "V28 and authority escape"],
    whole: ["byte 1 through EOF", "full lineage", "all structures and paragraphs", "retained exclusions", "no authority expansion"],
  }[options.scope];

  return addReceiptId("EVIDENCE", {
    schemaVersion: 1,
    artifactType: "g4-l10-native-helper-v2-15-deterministic-evidence",
    command: "evidence",
    scope: options.scope,
    status,
    conclusion: "NOT_A_HUMAN_REVIEW_CONCLUSION",
    scopeFocus,
    supportingPreflight: {
      path: options.preflightReceipt,
      bytes: parsedPreflight.raw?.length ?? null,
      sha256: parsedPreflight.raw ? sha256(parsedPreflight.raw) : null,
      receiptId: parsedPreflight.value?.receiptId ?? null,
    },
    anchors: currentAnchorFacts,
    targetBefore,
    targetAfter,
    predecessors: {
      v213: v213Facts,
      v212: v212Facts,
    },
    history: {
      status: history.manifest?.status ?? null,
      declaredArtifactCount: history.manifest?.artifacts?.length ?? null,
      verifiedArtifactCount: history.verifiedArtifactCount,
      newHMG4RB4BatchesAllowed: false,
    },
    structures,
    retainedState: {
      v28OperationalFreeze: false,
      v28WritableFiles: 57,
      v28NativeMembers: 48,
      v28NonGateATopLevelRunners: 9,
      v28Bytes: 553897,
      v28ChecksumSetSha256: "cfa98f5fd9a101c35944b4ef59a8b5db36f3a799ee7821ca4e286476acea3200",
      v28NativeRootMode: "0755",
      grade4MissingMp3: 16,
    },
    errors,
    reviewerMustStillEvaluate: true,
    qualifyingReviewPass: false,
    authorityEffects: closedAuthority(),
  });
}

async function main() {
  const options = parseCli(process.argv.slice(2));
  let receipt;
  let exitCode;
  if (options.command === "preflight") {
    receipt = await buildPreflight(options);
    exitCode = receipt.status === "READY_FOR_FORMAL_EVIDENCE" ? 0 : 2;
  } else {
    receipt = await buildEvidence(options);
    exitCode = receipt.status === "VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW" ? 0 : 3;
  }
  await writeNoClobber(options.output, receipt);
  process.stdout.write(receiptBytes(receipt));
  process.exitCode = exitCode;
}

main().catch((error) => {
  const command = process.argv[2] === "evidence" ? "evidence" : "preflight";
  const usage = error instanceof UsageError;
  const status = usage
    ? "USAGE_ERROR"
    : command === "evidence"
      ? "MECHANICAL_ERROR_RETRYABLE_SAME_REVIEWER"
      : "PREFLIGHT_RETRYABLE_NOT_EVIDENCE";
  const report = addReceiptId("ERROR", {
    schemaVersion: 1,
    artifactType: "g4-l10-native-helper-v2-15-verifier-error",
    command,
    status,
    error: summarizeError(error),
    evidenceConclusion: false,
    authorityEffects: closedAuthority(),
  });
  process.stdout.write(receiptBytes(report));
  process.exitCode = usage ? 64 : command === "evidence" ? 70 : 2;
});
