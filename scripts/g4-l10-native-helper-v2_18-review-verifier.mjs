#!/usr/bin/env node

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { spawnSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import {
  access,
  lstat,
  open,
  readdir,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";

export const CANONICAL_ROOT = "/Volumes/WestWorld/HELP MATH 2.0";
export const SELF = `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_18-review-verifier.mjs`;
const TARGET = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_18_SECURITY_CONTRACT_SUCCESSOR.md`;
const PROTOCOL = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_18_REVIEW_PROTOCOL_SUCCESSOR.md`;
const FOCUSED_TEST = `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_18-review-verifier.test.mjs`;
const V217_TARGET = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_17_SECURITY_CONTRACT_SUCCESSOR.md`;
const V217_PROTOCOL = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_17_REVIEW_PROTOCOL_SUCCESSOR.md`;
const V217_VERIFIER = `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_17-review-verifier.mjs`;
const V217_TEST = `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_17-review-verifier.test.mjs`;
const V216_PROTOCOL = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_16_REVIEW_PROTOCOL_SUCCESSOR.md`;
const V216_VERIFIER = `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_16-review-verifier.mjs`;
const V216_TEST = `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_16-review-verifier.test.mjs`;
const V215_PROTOCOL = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_15_REVIEW_PROTOCOL_SUCCESSOR.md`;
const V215_VERIFIER = `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_15-review-verifier.mjs`;
const V215_TEST = `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_15-review-verifier.test.mjs`;
const V214 = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md`;
const V213 = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_13_SECURITY_CONTRACT_SUCCESSOR.md`;
const V212 = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_12_SECURITY_CONTRACT_SUCCESSOR.md`;
const V2_PRODUCTION = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md`;
const V21_PRODUCTION = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_1_SECURITY_CONTRACT_SUCCESSOR.md`;
const V22_PRODUCTION = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_2_SECURITY_CONTRACT_SUCCESSOR.md`;
const V23_PRODUCTION = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR.md`;
const V24_PRODUCTION = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_4_SECURITY_CONTRACT_SUCCESSOR.md`;
const V25_PRODUCTION = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_5_SECURITY_CONTRACT_SUCCESSOR.md`;
const V26_PRODUCTION = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_6_SECURITY_CONTRACT_SUCCESSOR.md`;
const HISTORY = `${CANONICAL_ROOT}/reports/g4-l10-native-helper-strict-v2-14-history-closure-v1.json`;
const SYSTEM_WRITER = "/usr/bin/python3";
const SYSTEM_ENV = "/usr/bin/env";
const EXPECTED_NODE = "/Users/peter/.local/share/node-v24.18.0-darwin-arm64/bin/node";
const SAFE_CHILD_CWD = "/var/empty";

const SCOPES = Object.freeze(["schema", "adversarial", "whole"]);
const EXPECTED_FOCUSED_TEST_COUNT = 33;
const REQUIRED_TOOLS = Object.freeze([
  "/usr/bin/shasum",
  "/usr/bin/wc",
  "/usr/bin/iconv",
  "/usr/bin/stat",
  "/usr/bin/xattr",
  "/bin/ls",
  "/usr/bin/sed",
  "/usr/bin/tr",
  SYSTEM_WRITER,
]);
const HISTORY_PREFIX = "g4-l10-native-helper-v2-14-";
const HEX64 = /^[0-9a-f]{64}$/;
const UINT = /^(0|[1-9][0-9]*)$/;

const CORE_INPUTS = Object.freeze([
  { role: "target", absolutePath: TARGET },
  { role: "protocol", absolutePath: PROTOCOL },
  { role: "verifier", absolutePath: SELF },
  { role: "focused-test", absolutePath: FOCUSED_TEST },
  { role: "v2.17-target", absolutePath: V217_TARGET },
  { role: "v2.17-protocol", absolutePath: V217_PROTOCOL },
  { role: "v2.17-verifier", absolutePath: V217_VERIFIER },
  { role: "v2.17-focused-test", absolutePath: V217_TEST },
  { role: "v2.16-protocol", absolutePath: V216_PROTOCOL },
  { role: "v2.16-verifier", absolutePath: V216_VERIFIER },
  { role: "v2.16-focused-test", absolutePath: V216_TEST },
  { role: "v2.15-protocol", absolutePath: V215_PROTOCOL },
  { role: "v2.15-verifier", absolutePath: V215_VERIFIER },
  { role: "v2.15-focused-test", absolutePath: V215_TEST },
  { role: "v2.14-predecessor", absolutePath: V214 },
  { role: "v2.13-predecessor", absolutePath: V213 },
  { role: "v2.12-ledger-source", absolutePath: V212 },
  { role: "v2-production", absolutePath: V2_PRODUCTION },
  { role: "v2.1-production", absolutePath: V21_PRODUCTION },
  { role: "v2.2-production", absolutePath: V22_PRODUCTION },
  { role: "v2.3-production", absolutePath: V23_PRODUCTION },
  { role: "v2.4-production", absolutePath: V24_PRODUCTION },
  { role: "v2.5-production", absolutePath: V25_PRODUCTION },
  { role: "v2.6-production", absolutePath: V26_PRODUCTION },
  { role: "history-closure", absolutePath: HISTORY },
]);

const EXPECTED = Object.freeze({
  target: {
    bytes: 19071,
    lfCount: 384,
    finalLf: true,
    mode: "0444",
    sha256: "9af094ee41340fa15620f3c03c6fe75c5f87bfeda503298b386d9763a01f778a",
  },
  protocol: {
    bytes: 24918,
    lfCount: 610,
    finalLf: true,
    mode: "0644",
    sha256: "7cac64b01ba7ec859647a4f57cec7d43fd874e6ec555be3b40040a4d3bf6fada",
  },
  fixedSha256: Object.freeze({
    "v2.17-target": "bbeb9bfb7a436e6144026b18b8c3629af192a0cf035f87bd0de26484bf346ef3",
    "v2.17-protocol": "7d4fd2861d53f57c1d1ee06b006784fbf1933739a92ec04733c4364723460f44",
    "v2.17-verifier": "20bdbd5e481f898d5c64c89b6487bd0c6ad125c547e96ff66ad8c6c6f6723bf0",
    "v2.17-focused-test": "f25d0b78eff61f9184baddf10da6fee467e69cc53be9b0c63a91b8d4897cf8d1",
    "v2.16-protocol": "64077e18264236f10c77414f049c00b585a3d7258a9a3c324ec616c399695736",
    "v2.16-verifier": "5ce0a5876ec86ffb9facef5c629c47634bcc43c1bb566a52bf319aee2e4b37a9",
    "v2.16-focused-test": "194f375333a7f9925349d39b3f268eb1c02297f16fde867389bae53b1376fd35",
    "v2.15-protocol": "2f3161f93209b8ec5ba87d36cd11557fee8790087af60984ca9eefc9923caea7",
    "v2.15-verifier": "99e6ec770a74e3a344ddd4138718bc8a04c5032314dc7402b1cd3b937d716b70",
    "v2.15-focused-test": "363783b17bcc04556e7121721f6115b8d87ed196a82e51537be3dd3733faf88b",
    "v2.14-predecessor": "a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510",
    "v2.13-predecessor": "e8395f34d83b4a9e12fbe426473a7f97afd1b35dfcb20b613813351c21e0e123",
    "v2.12-ledger-source": "7874c4dee7f66203f6485bcac73dd8112a962ca258d63eb15e13001dd7d81a4b",
    "v2-production": "77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583",
    "v2.1-production": "170bd54b031f1f6e693f152aef885a509b2d4328f5032cc620a41dcf49a884ab",
    "v2.2-production": "d7bb8755cbd8fb3a7f4d709d1ec2879f8aee4fa8b8ad4cbacfd7e5068a9eeb5c",
    "v2.3-production": "bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320",
    "v2.4-production": "28f01dbd89956d3331c603f3cb9918a53419c3eb84e1868b285ee5ed231019b9",
    "v2.5-production": "5c628191205083114eecd6645745d6a8621129069ededf2650049f68d2e800ce",
    "v2.6-production": "3ce5bf0d79c003a78115be85828b0d36ca8e182e65d4329c58ba9aa3393c436a",
  }),
  systemWriter: {
    bytes: 118928,
    mode: "0755",
    uid: 0,
    gid: 0,
    nlink: 78,
    sha256: "179301dcb41ea78accc3fa0048a7e6f6710d891945a751a34addd622020c1818",
  },
  runtimeExecutables: Object.freeze({
    env: Object.freeze({
      role: "env",
      absolutePath: "/usr/bin/env",
      resolvedPath: "/usr/bin/env",
      bytes: 102368,
      mode: "0755",
      uid: 0,
      gid: 0,
      nlink: 1,
      sha256: "6e506aec3c0cff703ac1e66cedc6f1945354ad41339a38db4425c7c88227128f",
    }),
    node: Object.freeze({
      role: "node",
      absolutePath: "/Users/peter/.local/share/node-v24.18.0-darwin-arm64/bin/node",
      resolvedPath: "/Users/peter/.local/share/node-v24.18.0-darwin-arm64/bin/node",
      bytes: 120965360,
      mode: "0755",
      uid: 501,
      gid: 20,
      nlink: 1,
      sha256: "ee6fb0e015284d83a91e8ec5213f43a157f8a392b58555301682892ba928c04a",
    }),
    python: Object.freeze({
      role: "python",
      absolutePath: "/usr/bin/python3",
      resolvedPath: "/usr/bin/python3",
      bytes: 118928,
      mode: "0755",
      uid: 0,
      gid: 0,
      nlink: 78,
      sha256: "179301dcb41ea78accc3fa0048a7e6f6710d891945a751a34addd622020c1818",
    }),
  }),
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
  history: {
    sha256: "67d10b77decee152a7a6ffeaa13c44708d81d49870dd24bd824afae599d9a6d1",
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

const PROTOCOL_MARKERS = Object.freeze([
  "Exact canonical JSON and HMAC domain",
  "Exact ordered fixed-input closure",
  "Exact sanitized formal invocation",
  "Local parent-state and two-leaf reservation; control-plane attempt spend",
  "Descriptor-relative receipt creation",
  "Retained inputs and publication revalidation",
  "Exact local capability state machine",
  "Exact failure taxonomy",
  "ATTEMPT_RECEIPT_UNPRESERVED_NO_VERDICT",
  "There is no retry in the same review set",
  "No authority expansion",
]);

class UsageFault extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageFault";
  }
}

export class AuthenticationFailure extends Error {
  constructor(message, details = undefined) {
    super(message);
    this.name = "AuthenticationFailure";
    this.details = details;
  }
}

export class AttemptStateMismatch extends Error {
  constructor(message, details = undefined) {
    super(message);
    this.name = "AttemptStateMismatch";
    this.details = details;
  }
}

export class EvidenceInputMismatch extends Error {
  constructor(message, details = undefined) {
    super(message);
    this.name = "EvidenceInputMismatch";
    this.details = details;
  }
}

export class MechanicalFailure extends Error {
  constructor(message, details = undefined) {
    super(message);
    this.name = "MechanicalFailure";
    this.details = details;
  }
}

function invariant(condition, message, details = undefined) {
  if (!condition) throw new EvidenceInputMismatch(message, details);
}

function authInvariant(condition, message, details = undefined) {
  if (!condition) throw new AuthenticationFailure(message, details);
}

function attemptInvariant(condition, message, details = undefined) {
  if (!condition) throw new AttemptStateMismatch(message, details);
}

function mechanicalInvariant(condition, message, details = undefined) {
  if (!condition) throw new MechanicalFailure(message, details);
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

const UNPAIRED_SURROGATE = /(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:^|[^\uD800-\uDBFF])[\uDC00-\uDFFF])/u;

export function validateCanonicalValue(value, seen = new Set()) {
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "string") {
    invariant(!UNPAIRED_SURROGATE.test(value), "canonical JSON string contains an unpaired surrogate");
    return true;
  }
  if (typeof value === "number") {
    invariant(Number.isSafeInteger(value) && !Object.is(value, -0), "canonical JSON number must be a safe integer other than negative zero");
    return true;
  }
  invariant(value && typeof value === "object", "value is outside the canonical JSON domain");
  invariant(!seen.has(value), "canonical JSON value contains a cycle");
  seen.add(value);
  if (Array.isArray(value)) {
    invariant(Object.keys(value).length === value.length, "canonical JSON arrays must be dense");
    for (const entry of value) validateCanonicalValue(entry, seen);
  } else {
    const prototype = Object.getPrototypeOf(value);
    invariant(prototype === Object.prototype || prototype === null, "canonical JSON objects must be plain objects");
    for (const key of Object.keys(value)) {
      invariant(!/[\u0000\r\n]/u.test(key) && !UNPAIRED_SURROGATE.test(key), "canonical JSON object key is invalid");
      validateCanonicalValue(value[key], seen);
    }
  }
  seen.delete(value);
  return true;
}

function sortedValue(value) {
  if (Array.isArray(value)) return value.map(sortedValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, sortedValue(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  validateCanonicalValue(value);
  return JSON.stringify(sortedValue(value));
}

function receiptBytes(value) {
  validateCanonicalValue(value);
  return Buffer.from(`${JSON.stringify(sortedValue(value), null, 2)}\n`, "utf8");
}

function decodeCapability(capability) {
  authInvariant(typeof capability === "string" && HEX64.test(capability), "phase capability must be 32-byte lowercase hex");
  return Buffer.from(capability, "hex");
}

function constantTimeHexEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  if (!/^[0-9a-f]+$/u.test(left) || !/^[0-9a-f]+$/u.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export function computeCapabilityCommitment({
  reviewSetNonce,
  taskSystemId,
  taskHostId,
  reviewerNonce,
  scope,
  phase,
  outputParent,
  successOutput,
  errorOutput,
  capability,
}) {
  decodeCapability(capability);
  return sha256(Buffer.from(
    `G4L10-V218-TASK-CAPABILITY\n${reviewSetNonce}\n${taskSystemId}\n${taskHostId}\n${reviewerNonce}\n${scope}\n${phase}\n${canonicalJson(outputParent)}\n${successOutput}\n${errorOutput}\n${capability}\n`,
    "utf8",
  ));
}

export function addReceiptMac(kind, value, capability) {
  const key = decodeCapability(capability);
  const receiptMac = createHmac("sha256", key)
    .update(`G4L10-V218-${kind}\n${canonicalJson(value)}\n`, "utf8")
    .digest("hex");
  return { ...value, receiptMac };
}

export function validReceiptMac(kind, value, capability) {
  if (!value || typeof value !== "object" || typeof value.receiptMac !== "string") return false;
  const { receiptMac, ...body } = value;
  const expected = addReceiptMac(kind, body, capability).receiptMac;
  return constantTimeHexEqual(receiptMac, expected);
}

export function computeReviewSetDigest(value) {
  const { reviewSetDigest: _ignored, ...body } = value;
  return sha256(Buffer.from(`G4L10-V218-REVIEW-SET\n${canonicalJson(body)}\n`, "utf8"));
}

function countLf(bytes) {
  let count = 0;
  for (const byte of bytes) if (byte === 0x0a) count += 1;
  return count;
}

function decodeUtf8(bytes) {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function exactKeys(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function exactStringArray(a, b) {
  return Array.isArray(a) && a.length === b.length && a.every((entry, index) => entry === b[index]);
}

function portableMode(stat) {
  return (Number(stat.mode) & 0o7777).toString(8).padStart(4, "0");
}

function decimal(value) {
  return String(value);
}

function stableStatProjection(stat) {
  return {
    dev: decimal(stat.dev),
    ino: decimal(stat.ino),
    uid: Number(stat.uid),
    gid: Number(stat.gid),
    mode: portableMode(stat),
    nlink: Number(stat.nlink),
    bytes: Number(stat.size),
    mtimeNs: decimal(stat.mtimeNs),
    ctimeNs: decimal(stat.ctimeNs),
    birthtimeNs: decimal(stat.birthtimeNs),
    regularFile: stat.isFile(),
    directory: stat.isDirectory(),
  };
}

function outputParentProjection(parent, physicalParent, stat) {
  return {
    declaredPath: parent,
    resolvedPath: physicalParent,
    dev: decimal(stat.dev),
    ino: decimal(stat.ino),
    uid: Number(stat.uid),
    gid: Number(stat.gid),
    mode: portableMode(stat),
    nlink: Number(stat.nlink),
    mtimeNs: decimal(stat.mtimeNs),
    ctimeNs: decimal(stat.ctimeNs),
    birthtimeNs: decimal(stat.birthtimeNs),
  };
}

function outputParentMatches(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function sameObject(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function sameStableStat(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function bindingMatches(actual, expected) {
  const keys = [
    "absolutePath",
    "resolvedPath",
    "dev",
    "ino",
    "mode",
    "nlink",
    "bytes",
    "lfCount",
    "finalLf",
    "sha256",
  ];
  return keys.every((key) => actual[key] === expected[key]);
}

export function closedAuthority() {
  return {
    permissionTransition: false,
    implementation: false,
    helperTest: false,
    helperExecution: false,
    flashAnimateExecution: false,
    ruffleExecution: false,
    protectedInstallation: false,
    originalRuntimeCapture: false,
    runtimeLaunch: false,
    runtimeAcceptance: false,
    currentJavaScriptAcceptance: false,
    flashFidelity: false,
    audioAcceptance: false,
    humanAcceptance: false,
    ownerAcceptance: false,
    apply: false,
    recover: false,
    reconstruction: false,
    discovery: false,
    v28Transition: false,
    acceptance: false,
    strictCompletion: false,
    sourcePromotion: false,
    integration: false,
    release: false,
    publication: false,
    deployment: false,
    publicAccess: false,
  };
}

function summarizeError(error) {
  return {
    name: String(error?.name ?? "Error").slice(0, 100),
    code: typeof error?.code === "string" ? error.code : "UNCLASSIFIED",
    message: String(error?.message ?? error).slice(0, 1000),
    details: error?.details === undefined ? null : error.details,
  };
}

function mechanicalExactKeys(value, keys, label) {
  mechanicalInvariant(exactKeys(value, keys), `${label} has invalid fields`, {
    expected: [...keys].sort(),
    actual: value && typeof value === "object" && !Array.isArray(value)
      ? Object.keys(value).sort()
      : null,
  });
}

function descriptorParentProjection(binding) {
  return {
    dev: binding.dev,
    ino: binding.ino,
    uid: binding.uid,
    gid: binding.gid,
    mode: binding.mode,
    nlink: binding.nlink,
    mtimeNs: binding.mtimeNs,
    ctimeNs: binding.ctimeNs,
  };
}

function validateMechanicalParentBinding(value, label) {
  mechanicalExactKeys(value, [
    "dev",
    "ino",
    "uid",
    "gid",
    "mode",
    "nlink",
    "mtimeNs",
    "ctimeNs",
  ], label);
  mechanicalInvariant(UINT.test(value.dev) && UINT.test(value.ino), `${label} device/inode invalid`);
  mechanicalInvariant(Number.isSafeInteger(value.uid) && value.uid >= 0, `${label}.uid invalid`);
  mechanicalInvariant(Number.isSafeInteger(value.gid) && value.gid >= 0, `${label}.gid invalid`);
  mechanicalInvariant(value.mode === "0700" && Number.isSafeInteger(value.nlink) && value.nlink >= 2, `${label} custody invalid`, value);
  mechanicalInvariant(UINT.test(value.mtimeNs) && UINT.test(value.ctimeNs), `${label} timestamps invalid`);
  return value;
}

function validateMechanicalLeafBinding(value, label) {
  mechanicalExactKeys(value, [
    "bytes",
    "dev",
    "gid",
    "ino",
    "mode",
    "nlink",
    "sha256",
    "uid",
  ], label);
  mechanicalInvariant(Number.isSafeInteger(value.bytes) && value.bytes >= 0, `${label}.bytes invalid`);
  mechanicalInvariant(UINT.test(value.dev) && UINT.test(value.ino), `${label} device/inode invalid`);
  mechanicalInvariant(Number.isSafeInteger(value.uid) && value.uid >= 0, `${label}.uid invalid`);
  mechanicalInvariant(Number.isSafeInteger(value.gid) && value.gid >= 0, `${label}.gid invalid`);
  mechanicalInvariant(value.mode === "0600" && value.nlink === 1, `${label} custody invalid`);
  mechanicalInvariant(HEX64.test(value.sha256), `${label}.sha256 invalid`);
  return value;
}

function mechanicalCanonicalEqual(actual, expected, message, details = undefined) {
  let matches = false;
  try {
    matches = canonicalJson(actual) === canonicalJson(expected);
  } catch (error) {
    throw new MechanicalFailure(`${message}: invalid mechanical metadata`, summarizeError(error));
  }
  mechanicalInvariant(matches, message, details ?? { expected, actual });
}

export function classifyFailure(command, error) {
  if (error instanceof AuthenticationFailure || error instanceof UsageFault) {
    return "UNAUTHENTICATED_INVOCATION_NO_VERDICT";
  }
  if (error instanceof AttemptStateMismatch) {
    return "ATTEMPT_STATE_MISMATCH_NO_VERDICT_NO_RETRY";
  }
  if (error instanceof EvidenceInputMismatch) {
    return command === "evidence"
      ? "EVIDENCE_INPUT_MISMATCH"
      : "PREFLIGHT_INPUT_MISMATCH_NO_VERDICT_NO_RETRY";
  }
  return "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY";
}

async function assertOutputParentStillHeld(custody, expectedBinding = null) {
  let heldStat;
  let pathStat;
  let resolved;
  try {
    heldStat = await custody.handle.stat({ bigint: true });
    pathStat = await lstat(custody.parent, { bigint: true });
    resolved = await realpath(custody.parent);
  } catch (error) {
    throw new MechanicalFailure("output parent revalidation failed", summarizeError(error));
  }
  const held = stableStatProjection(heldStat);
  const byPath = stableStatProjection(pathStat);
  mechanicalInvariant(held.directory && byPath.directory, "receipt parent is no longer a directory");
  mechanicalInvariant(sameObject(held, byPath), "receipt parent pathname detached from retained descriptor", {
    held,
    byPath,
  });
  mechanicalInvariant(resolved === custody.physicalParent, "receipt parent realpath changed", {
    expected: custody.physicalParent,
    actual: resolved,
  });
  mechanicalInvariant(Number(heldStat.uid) === process.getuid() && portableMode(heldStat) === "0700", "retained receipt parent custody changed");
  const binding = outputParentProjection(custody.parent, custody.physicalParent, heldStat);
  if (expectedBinding) {
    attemptInvariant(outputParentMatches(binding, expectedBinding), "output parent state differs from frozen phase prestate", {
      expected: expectedBinding,
      actual: binding,
    });
  }
  return { held, binding };
}

async function openOutputCustody(output, expectedParent = null) {
  if (!path.isAbsolute(output)) throw new UsageFault("receipt output must be absolute");
  if (path.normalize(output) !== output) throw new UsageFault("receipt output must be lexically normalized");
  const parent = path.dirname(output);
  const leaf = path.basename(output);
  if (!leaf || leaf === "." || leaf === "..") throw new UsageFault("receipt output leaf is invalid");
  const physicalTmp = await realpath("/tmp");
  const physicalParent = await realpath(parent);
  const relative = path.relative(physicalTmp, physicalParent);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new UsageFault("receipt parent must be one reviewer-unique directory below physical /tmp");
  }
  if (relative.includes(path.sep)) {
    throw new UsageFault("receipt parent must be directly below physical /tmp");
  }
  mechanicalInvariant(Number.isInteger(fsConstants.O_DIRECTORY) && Number.isInteger(fsConstants.O_NOFOLLOW), "required directory flags are unavailable");
  let handle;
  try {
    handle = await open(parent, fsConstants.O_RDONLY | fsConstants.O_DIRECTORY | fsConstants.O_NOFOLLOW);
  } catch (error) {
    throw new MechanicalFailure("output parent open failed", summarizeError(error));
  }
  const custody = { output, parent, leaf, physicalParent, handle };
  try {
    const { binding } = await assertOutputParentStillHeld(custody);
    if (expectedParent) {
      attemptInvariant(outputParentMatches(binding, expectedParent), "receipt parent differs from frozen attempt binding", {
        expectedParent,
        actual: binding,
      });
    }
    return custody;
  } catch (error) {
    await handle.close();
    throw error;
  }
}

async function safePhysicalTmpOutput(output, expectedParent = null) {
  const custody = await openOutputCustody(output, expectedParent);
  try {
    const { binding } = await assertOutputParentStillHeld(custody, expectedParent);
    return binding;
  } finally {
    await custody.handle.close();
  }
}

async function pathIsAbsent(absolutePath) {
  try {
    await lstat(absolutePath);
    return false;
  } catch (error) {
    if (error?.code === "ENOENT") return true;
    throw error;
  }
}

export async function assertAttemptLeavesUnused(successOutput, errorOutput, expectedParent = null) {
  invariant(successOutput !== errorOutput, "attempt success and error leaves must differ");
  const success = await openOutputCustody(successOutput, expectedParent);
  const error = await openOutputCustody(errorOutput, expectedParent);
  try {
    attemptInvariant(await pathIsAbsent(successOutput), "attempt success leaf is already occupied", { successOutput });
    attemptInvariant(await pathIsAbsent(errorOutput), "attempt error leaf is already occupied", { errorOutput });
    await assertOutputParentStillHeld(success, expectedParent);
    await assertOutputParentStillHeld(error, expectedParent);
    return true;
  } finally {
    await error.handle.close();
    await success.handle.close();
  }
}

export async function validateReviewSetOutputCustody(manifest) {
  validateReviewSetManifestShape(manifest);
  const reviewerParents = [];
  for (const reviewer of manifest.reviewers) {
    const outputs = [
      reviewer.preflight.successOutput,
      reviewer.preflight.errorOutput,
      reviewer.evidence.successOutput,
      reviewer.evidence.errorOutput,
    ];
    invariant(
      outputs.every((output) => path.dirname(output) === reviewer.outputParent.declaredPath),
      `reviewer ${reviewer.scope} outputs do not share one declared parent`,
      { outputs },
    );
    const custody = await openOutputCustody(outputs[0], reviewer.outputParent);
    try {
      const inspected = await inspectOutputParent(custody);
      attemptInvariant(
        inspected.inventory.length === 0,
        `reviewer ${reviewer.scope} output parent is not empty at manifest prestate`,
        inspected.inventory,
      );
      reviewerParents.push(`${inspected.binding.dev}:${inspected.binding.ino}`);
    } finally {
      await custody.handle.close();
    }
  }
  invariant(
    new Set(reviewerParents).size === reviewerParents.length,
    "reviewer output parents are not reviewer-unique",
    { reviewerParents },
  );
  return reviewerParents;
}

const SAFE_CHILD_ENV = Object.freeze({
  HOME: "/var/empty",
  LANG: "C",
  LC_ALL: "C",
  PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
  TMPDIR: "/tmp",
  __CF_USER_TEXT_ENCODING: "0x1F5:0x0:0x0",
});

function localTaskAuthenticationState() {
  return {
    taskIdentityAuthenticatedLocally: false,
    taskTransportAuthenticationRequired: true,
  };
}

export function localTaskAuthenticationStateForTest() {
  return localTaskAuthenticationState();
}

export function isolatedLaunchPolicyForTest() {
  return {
    environment: { ...SAFE_CHILD_ENV },
    cwd: SAFE_CHILD_CWD,
    node: EXPECTED_NODE,
    python: SYSTEM_WRITER,
    pythonFlags: ["-I", "-S", "-E"],
  };
}

export async function outputParentBindingForTest(parent) {
  return safePhysicalTmpOutput(path.join(parent, "binding-probe.json"));
}

const OPENAT_PARENT_INSPECTOR = String.raw`import json,os,stat,sys
pst=os.fstat(3)
names=sorted(os.listdir(3),key=os.fsencode)
parent={"dev":str(pst.st_dev),"ino":str(pst.st_ino),"uid":pst.st_uid,"gid":pst.st_gid,"mode":format(stat.S_IMODE(pst.st_mode),"04o"),"nlink":pst.st_nlink,"mtimeNs":str(pst.st_mtime_ns),"ctimeNs":str(pst.st_ctime_ns)}
sys.stdout.write(json.dumps({"inventory":names,"parent":parent},sort_keys=True,separators=(",",":")))
`;

const OPENAT_RESERVER = String.raw`import hashlib,json,os,stat,sys
expected=json.loads(sys.argv[1])
leaves=sys.argv[2:]
if len(leaves)!=2 or leaves[0]==leaves[1] or not isinstance(expected,list):
    raise OSError("expected inventory and two distinct reservation leaves")
before=sorted(os.listdir(3),key=os.fsencode)
if before!=expected:
    raise OSError("descriptor-relative pre-reservation inventory mismatch")
fds=[]
rows=[]
flags=os.O_RDWR|os.O_CREAT|os.O_EXCL|getattr(os,"O_NOFOLLOW",0)
try:
    for leaf in leaves:
        fd=os.open(leaf,flags,0o600,dir_fd=3)
        fds.append(fd)
        os.fchmod(fd,0o600)
        os.fsync(fd)
        st=os.fstat(fd)
        if not stat.S_ISREG(st.st_mode) or st.st_uid!=os.getuid() or st.st_nlink!=1 or stat.S_IMODE(st.st_mode)!=0o600 or st.st_size!=0:
            raise OSError("reserved leaf metadata mismatch")
        rows.append({"bytes":0,"dev":str(st.st_dev),"gid":st.st_gid,"ino":str(st.st_ino),"mode":"0600","nlink":st.st_nlink,"sha256":hashlib.sha256(b"").hexdigest(),"uid":st.st_uid})
    os.fsync(3)
    pst=os.fstat(3)
    after=sorted(os.listdir(3),key=os.fsencode)
    wanted=sorted(expected+leaves,key=os.fsencode)
    if after!=wanted:
        raise OSError("descriptor-relative post-reservation inventory mismatch")
    parent={"dev":str(pst.st_dev),"ino":str(pst.st_ino),"uid":pst.st_uid,"gid":pst.st_gid,"mode":format(stat.S_IMODE(pst.st_mode),"04o"),"nlink":pst.st_nlink,"mtimeNs":str(pst.st_mtime_ns),"ctimeNs":str(pst.st_ctime_ns)}
    result={"inventoryAfter":after,"inventoryBefore":before,"leaves":rows,"parent":parent}
finally:
    for fd in reversed(fds):
        os.close(fd)
sys.stdout.write(json.dumps(result,sort_keys=True,separators=(",",":")))
`;

const OPENAT_RESERVED_WRITER = String.raw`import hashlib,json,os,stat,sys
leaf,expected_dev,expected_ino,expected_gid,sibling,sibling_dev,sibling_ino,sibling_gid,sibling_bytes,sibling_sha=sys.argv[1:11]
data=sys.stdin.buffer.read()
def read_exact(fd,count):
    result=bytearray()
    while len(result)<count:
        chunk=os.read(fd,count-len(result))
        if not chunk:
            break
        result.extend(chunk)
    extra=os.read(fd,1)
    if len(result)!=count or extra:
        raise OSError("reserved sibling byte length mismatch")
    return bytes(result)
flags=os.O_RDWR|getattr(os,"O_NOFOLLOW",0)
fd=os.open(leaf,flags,dir_fd=3)
other=os.open(sibling,os.O_RDONLY|getattr(os,"O_NOFOLLOW",0),dir_fd=3)
try:
    before=os.fstat(fd)
    if not stat.S_ISREG(before.st_mode) or str(before.st_dev)!=expected_dev or str(before.st_ino)!=expected_ino or before.st_uid!=os.getuid() or before.st_gid!=int(expected_gid) or before.st_nlink!=1 or stat.S_IMODE(before.st_mode)!=0o600 or before.st_size!=0:
        raise OSError("reserved receipt preimage mismatch")
    sibling_before=os.fstat(other)
    sibling_data=read_exact(other,int(sibling_bytes))
    if not stat.S_ISREG(sibling_before.st_mode) or str(sibling_before.st_dev)!=sibling_dev or str(sibling_before.st_ino)!=sibling_ino or sibling_before.st_uid!=os.getuid() or sibling_before.st_gid!=int(sibling_gid) or sibling_before.st_nlink!=1 or stat.S_IMODE(sibling_before.st_mode)!=0o600 or sibling_before.st_size!=int(sibling_bytes) or hashlib.sha256(sibling_data).hexdigest()!=sibling_sha:
        raise OSError("reserved sibling preimage mismatch")
    view=memoryview(data)
    written=0
    while written<len(view):
        count=os.write(fd,view[written:])
        if count<=0:
            raise OSError("short receipt write")
        written+=count
    os.fchmod(fd,0o600)
    os.fsync(fd)
    os.lseek(fd,0,os.SEEK_SET)
    actual=bytearray()
    while True:
        chunk=os.read(fd,65536)
        if not chunk:
            break
        actual.extend(chunk)
    after=os.fstat(fd)
    if str(after.st_dev)!=expected_dev or str(after.st_ino)!=expected_ino or after.st_uid!=os.getuid() or after.st_gid!=int(expected_gid) or after.st_nlink!=1 or stat.S_IMODE(after.st_mode)!=0o600:
        raise OSError("written receipt metadata mismatch")
    if bytes(actual)!=data:
        raise OSError("written receipt bytes mismatch")
    os.lseek(other,0,os.SEEK_SET)
    sibling_after=os.fstat(other)
    sibling_actual=read_exact(other,int(sibling_bytes))
    if str(sibling_after.st_dev)!=sibling_dev or str(sibling_after.st_ino)!=sibling_ino or sibling_after.st_uid!=os.getuid() or sibling_after.st_gid!=int(sibling_gid) or sibling_after.st_nlink!=1 or stat.S_IMODE(sibling_after.st_mode)!=0o600 or sibling_after.st_size!=int(sibling_bytes) or sibling_actual!=sibling_data or hashlib.sha256(sibling_actual).hexdigest()!=sibling_sha:
        raise OSError("reserved sibling changed during receipt write")
    selected_result={"bytes":after.st_size,"dev":str(after.st_dev),"gid":after.st_gid,"ino":str(after.st_ino),"mode":"0600","nlink":after.st_nlink,"sha256":hashlib.sha256(actual).hexdigest(),"uid":after.st_uid}
    sibling_result={"bytes":sibling_after.st_size,"dev":str(sibling_after.st_dev),"gid":sibling_after.st_gid,"ino":str(sibling_after.st_ino),"mode":"0600","nlink":sibling_after.st_nlink,"sha256":hashlib.sha256(sibling_actual).hexdigest(),"uid":sibling_after.st_uid}
    result={"selected":selected_result,"sibling":sibling_result}
finally:
    os.close(other)
    os.close(fd)
os.fsync(3)
sys.stdout.write(json.dumps(result,sort_keys=True,separators=(",",":")))
`;

async function verifySystemWriter() {
  mechanicalInvariant(Number.isInteger(fsConstants.O_NOFOLLOW), "O_NOFOLLOW is unavailable");
  let handle;
  try {
    handle = await open(SYSTEM_WRITER, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  } catch (error) {
    throw new MechanicalFailure("system writer open failed", summarizeError(error));
  }
  try {
    const before = await handle.stat({ bigint: true });
    const byPath = await lstat(SYSTEM_WRITER, { bigint: true });
    mechanicalInvariant(before.isFile() && byPath.isFile() && sameObject(stableStatProjection(before), stableStatProjection(byPath)), "system writer path/descriptor identity mismatch");
    const bytes = await handle.readFile();
    const after = await handle.stat({ bigint: true });
    mechanicalInvariant(sameStableStat(stableStatProjection(before), stableStatProjection(after)), "system writer changed while hashing");
    const actual = {
      bytes: bytes.length,
      mode: portableMode(before),
      uid: Number(before.uid),
      gid: Number(before.gid),
      nlink: Number(before.nlink),
      sha256: sha256(bytes),
    };
    mechanicalInvariant(canonicalJson(actual) === canonicalJson(EXPECTED.systemWriter), "system writer identity mismatch", {
      expected: EXPECTED.systemWriter,
      actual,
    });
    return actual;
  } finally {
    await handle.close();
  }
}

function parseMechanicalChild(child, label) {
  mechanicalInvariant(!child.error && child.status === 0 && child.signal === null, `${label} failed`, {
    status: child.status,
    signal: child.signal,
    error: child.error ? summarizeError(child.error) : null,
    stderr: Buffer.isBuffer(child.stderr)
      ? child.stderr.toString("utf8").slice(0, 2000)
      : String(child.stderr ?? "").slice(0, 2000),
  });
  try {
    return JSON.parse(Buffer.from(child.stdout).toString("utf8"));
  } catch (error) {
    throw new MechanicalFailure(`${label} returned invalid metadata`, summarizeError(error));
  }
}

function childOptions(parentFd, input = undefined) {
  return {
    cwd: SAFE_CHILD_CWD,
    env: SAFE_CHILD_ENV,
    input,
    stdio: ["pipe", "pipe", "pipe", parentFd],
    timeout: 60000,
    maxBuffer: 4 * 1024 * 1024,
  };
}

async function inspectOutputParent(custody) {
  await verifySystemWriter();
  const child = spawnSync(
    SYSTEM_WRITER,
    ["-I", "-S", "-E", "-c", OPENAT_PARENT_INSPECTOR],
    childOptions(custody.handle.fd),
  );
  const writer = parseMechanicalChild(child, "descriptor-relative parent inspector");
  mechanicalExactKeys(writer, ["inventory", "parent"], "parent inspector result");
  mechanicalInvariant(
    Array.isArray(writer.inventory)
      && writer.inventory.every((name) => typeof name === "string" && name.length > 0 && !/[\u0000/]/u.test(name)),
    "parent inspector inventory is invalid",
  );
  validateMechanicalParentBinding(writer.parent, "parent inspector binding");
  const { binding } = await assertOutputParentStillHeld(custody);
  mechanicalCanonicalEqual(
    writer.parent,
    descriptorParentProjection(binding),
    "parent inspector descriptor differs from retained Node descriptor",
  );
  const expectedOrder = [...writer.inventory]
    .sort((left, right) => Buffer.from(left).compare(Buffer.from(right)));
  mechanicalInvariant(
    exactStringArray(writer.inventory, expectedOrder),
    "parent inspector inventory is not bytewise sorted",
  );
  return { binding, inventory: writer.inventory };
}

async function snapshotReservationLeaf(entry, { requireZero = false } = {}) {
  let handle;
  try {
    handle = await open(entry.path, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
    const beforeStat = await handle.stat({ bigint: true });
    const pathBefore = await lstat(entry.path, { bigint: true });
    const before = stableStatProjection(beforeStat);
    const byPath = stableStatProjection(pathBefore);
    mechanicalInvariant(before.regularFile && byPath.regularFile, "reservation leaf is not a regular file", { path: entry.path });
    mechanicalInvariant(sameObject(before, byPath), "reservation leaf pathname differs from descriptor", { path: entry.path });
    mechanicalInvariant(
      before.dev === entry.binding.dev
        && before.ino === entry.binding.ino
        && before.uid === process.getuid()
        && before.gid === entry.binding.gid
        && before.mode === "0600"
        && before.nlink === 1,
      "reservation leaf custody differs from frozen inode",
      { path: entry.path, before, expected: entry.binding },
    );
    const bytes = await handle.readFile();
    const after = stableStatProjection(await handle.stat({ bigint: true }));
    mechanicalInvariant(sameStableStat(before, after), "reservation leaf changed while reading", { path: entry.path });
    const result = {
      bytes: bytes.length,
      dev: before.dev,
      gid: before.gid,
      ino: before.ino,
      mode: before.mode,
      nlink: before.nlink,
      sha256: sha256(bytes),
      uid: before.uid,
    };
    validateMechanicalLeafBinding(result, "reservation leaf snapshot");
    if (requireZero) {
      mechanicalInvariant(
        result.bytes === 0 && result.sha256 === sha256(Buffer.alloc(0)),
        "selected reservation leaf is not the exact zero-byte preimage",
        result,
      );
    }
    return result;
  } catch (error) {
    if (
      error instanceof EvidenceInputMismatch
      || error instanceof AuthenticationFailure
      || error instanceof AttemptStateMismatch
      || error instanceof MechanicalFailure
    ) throw error;
    throw new MechanicalFailure("reservation leaf snapshot failed", {
      path: entry.path,
      error: summarizeError(error),
    });
  } finally {
    if (handle) {
      try {
        await handle.close();
      } catch (error) {
        throw new MechanicalFailure("reservation leaf descriptor close failed", summarizeError(error));
      }
    }
  }
}

export async function reserveAttemptLeaves(
  successOutput,
  errorOutput,
  expectedParent,
  expectedInventory = [],
) {
  if (successOutput === errorOutput) throw new UsageFault("attempt leaves must differ");
  const custody = await openOutputCustody(successOutput, expectedParent);
  const errorLeaf = path.basename(errorOutput);
  try {
    authInvariant(path.dirname(errorOutput) === custody.parent, "attempt leaves do not share one output parent");
    const expectedNames = [...expectedInventory].sort((a, b) => Buffer.from(a).compare(Buffer.from(b)));
    const inspectedBefore = await inspectOutputParent(custody);
    attemptInvariant(
      exactStringArray(inspectedBefore.inventory, expectedNames),
      "output parent inventory differs from phase prestate",
      { expectedInventory: expectedNames },
    );
    await verifySystemWriter();
    await assertOutputParentStillHeld(custody, expectedParent);
    const child = spawnSync(
      SYSTEM_WRITER,
      [
        "-I",
        "-S",
        "-E",
        "-c",
        OPENAT_RESERVER,
        JSON.stringify(expectedNames),
        custody.leaf,
        errorLeaf,
      ],
      childOptions(custody.handle.fd),
    );
    const writer = parseMechanicalChild(child, "descriptor-relative two-leaf reservation");
    mechanicalExactKeys(
      writer,
      ["inventoryAfter", "inventoryBefore", "leaves", "parent"],
      "two-leaf reserver result",
    );
    mechanicalInvariant(Array.isArray(writer.leaves) && writer.leaves.length === 2, "two-leaf reserver returned invalid leaves");
    mechanicalInvariant(Array.isArray(writer.inventoryBefore) && Array.isArray(writer.inventoryAfter), "two-leaf reserver returned invalid inventories");
    validateMechanicalParentBinding(writer.parent, "two-leaf reserver parent");
    const { binding: parentAfter } = await assertOutputParentStillHeld(custody);
    mechanicalCanonicalEqual(
      writer.parent,
      descriptorParentProjection(parentAfter),
      "post-reservation parent differs from writer descriptor",
    );
    const paths = [successOutput, errorOutput];
    const leaves = [];
    for (let index = 0; index < paths.length; index += 1) {
      const pathStat = await lstat(paths[index], { bigint: true });
      const actual = {
        bytes: Number(pathStat.size),
        dev: decimal(pathStat.dev),
        gid: Number(pathStat.gid),
        ino: decimal(pathStat.ino),
        mode: portableMode(pathStat),
        nlink: Number(pathStat.nlink),
        sha256: sha256(Buffer.alloc(0)),
        uid: Number(pathStat.uid),
      };
      validateMechanicalLeafBinding(writer.leaves[index], `two-leaf reserver leaves[${index}]`);
      mechanicalInvariant(
        pathStat.isFile()
          && actual.bytes === 0
          && actual.mode === "0600"
          && actual.nlink === 1
          && actual.uid === process.getuid(),
        "reserved leaf custody mismatch",
        actual,
      );
      mechanicalCanonicalEqual(
        actual,
        writer.leaves[index],
        "reserved leaf differs from writer descriptor",
      );
      leaves.push(actual);
    }
    const expectedAfterInventory = [...expectedNames, custody.leaf, errorLeaf]
      .sort((a, b) => Buffer.from(a).compare(Buffer.from(b)));
    mechanicalCanonicalEqual(writer.inventoryBefore, expectedNames, "reserver pre-inventory differs from expected prestate");
    mechanicalCanonicalEqual(writer.inventoryAfter, expectedAfterInventory, "reserver post-inventory differs from expected state");
    const inspectedAfter = await inspectOutputParent(custody);
    attemptInvariant(
      exactStringArray(inspectedAfter.inventory, expectedAfterInventory),
      "post-reservation inventory mismatch",
    );
    attemptInvariant(
      outputParentMatches(inspectedAfter.binding, parentAfter),
      "post-reservation parent binding drifted after descriptor-relative inspection",
    );
    await verifySystemWriter();
    return {
      custody,
      parentBefore: expectedParent,
      parentAfter,
      expectedInventory: expectedAfterInventory,
      success: { path: successOutput, leaf: custody.leaf, binding: leaves[0] },
      error: { path: errorOutput, leaf: errorLeaf, binding: leaves[1] },
    };
  } catch (error) {
    try {
      await custody.handle.close();
    } catch {
      // Any leaf already created remains as permanent spent-state evidence.
    }
    throw error;
  }
}

export async function writeReservedReceipt(
  reservation,
  output,
  value,
  { allowNonzeroSibling = false } = {},
) {
  const bytes = receiptBytes(value);
  const custody = reservation.custody;
  const selected = output === reservation.success.path
    ? reservation.success
    : output === reservation.error.path
      ? reservation.error
      : null;
  mechanicalInvariant(selected, "receipt output is not one of the reserved leaves", { output });
  const sibling = selected === reservation.success ? reservation.error : reservation.success;
  try {
    await verifySystemWriter();
    await assertOutputParentStillHeld(custody, reservation.parentAfter);
    const inspectedBefore = await inspectOutputParent(custody);
    attemptInvariant(
      exactStringArray(inspectedBefore.inventory, reservation.expectedInventory),
      "receipt parent inventory drifted before publication",
    );
    const selectedBefore = await snapshotReservationLeaf(selected, { requireZero: true });
    const siblingBefore = await snapshotReservationLeaf(sibling);
    if (!allowNonzeroSibling) {
      mechanicalInvariant(
        siblingBefore.bytes === 0 && siblingBefore.sha256 === sha256(Buffer.alloc(0)),
        "unused sibling is not the exact zero-byte reservation before publication",
        siblingBefore,
      );
    }
    const child = spawnSync(
      SYSTEM_WRITER,
      [
        "-I",
        "-S",
        "-E",
        "-c",
        OPENAT_RESERVED_WRITER,
        selected.leaf,
        selected.binding.dev,
        selected.binding.ino,
        String(selected.binding.gid),
        sibling.leaf,
        sibling.binding.dev,
        sibling.binding.ino,
        String(sibling.binding.gid),
        String(siblingBefore.bytes),
        siblingBefore.sha256,
      ],
      childOptions(custody.handle.fd, bytes),
    );
    const writer = parseMechanicalChild(child, "descriptor-relative reserved receipt writer");
    mechanicalExactKeys(writer, ["selected", "sibling"], "reserved receipt writer result");
    validateMechanicalLeafBinding(writer.selected, "reserved receipt writer selected");
    validateMechanicalLeafBinding(writer.sibling, "reserved receipt writer sibling");
    const actual = await snapshotReservationLeaf(selected);
    const siblingAfter = await snapshotReservationLeaf(sibling);
    mechanicalCanonicalEqual(actual, writer.selected, "created receipt pathname differs from writer descriptor");
    mechanicalCanonicalEqual(siblingAfter, writer.sibling, "reserved sibling pathname differs from writer descriptor");
    mechanicalCanonicalEqual(siblingAfter, siblingBefore, "reserved sibling changed during publication");
    mechanicalInvariant(
      actual.bytes === bytes.length && actual.sha256 === sha256(bytes),
      "created receipt byte binding mismatch",
    );
    mechanicalInvariant(
      actual.dev === selected.binding.dev && actual.ino === selected.binding.ino,
      "created receipt inode differs from reservation",
      { actual, selected: selected.binding },
    );
    mechanicalInvariant(
      actual.uid === process.getuid()
        && actual.gid === selected.binding.gid
        && actual.nlink === 1
        && actual.mode === "0600"
        && selectedBefore.bytes === 0,
      "created receipt custody mismatch",
      actual,
    );
    await assertOutputParentStillHeld(custody, reservation.parentAfter);
    const inspectedAfter = await inspectOutputParent(custody);
    attemptInvariant(
      exactStringArray(inspectedAfter.inventory, reservation.expectedInventory),
      "receipt parent inventory drifted after publication",
    );
    await verifySystemWriter();
    return actual;
  } catch (error) {
    if (
      error instanceof EvidenceInputMismatch
      || error instanceof AuthenticationFailure
      || error instanceof AttemptStateMismatch
      || error instanceof MechanicalFailure
    ) throw error;
    throw new MechanicalFailure("reserved receipt publication failed", summarizeError(error));
  }
}

export async function closeAttemptReservation(reservation) {
  try {
    await reservation.custody.handle.close();
  } catch (error) {
    throw new MechanicalFailure("retained output parent descriptor close failed", summarizeError(error));
  }
}

async function chooseErrorReceiptDestination(reservation) {
  const states = [];
  for (const entry of [reservation.success, reservation.error]) {
    const binding = await snapshotReservationLeaf(entry);
    states.push({
      entry,
      binding,
      zero: binding.bytes === 0 && binding.sha256 === sha256(Buffer.alloc(0)),
    });
  }
  const zero = states.filter((state) => state.zero);
  mechanicalInvariant(zero.length >= 1, "no exact zero-byte reserved leaf remains for the error receipt", {
    states: states.map((state) => ({ path: state.entry.path, binding: state.binding })),
  });
  const preferredError = zero.find((state) => state.entry === reservation.error);
  return {
    path: (preferredError ?? zero[0]).entry.path,
    allowNonzeroSibling: states.some((state) => !state.zero),
  };
}

export async function chooseErrorReceiptDestinationForTest(reservation) {
  return chooseErrorReceiptDestination(reservation);
}

async function assertRootStillHeld(rootHandle, expectedRoot, assertFn = authInvariant) {
  const held = stableStatProjection(await rootHandle.stat({ bigint: true }));
  const pathStat = stableStatProjection(await lstat(CANONICAL_ROOT, { bigint: true }));
  const resolved = await realpath(CANONICAL_ROOT);
  assertFn(resolved === CANONICAL_ROOT, "canonical root realpath changed", { resolved });
  assertFn(held.directory && pathStat.directory, "canonical root is not a directory");
  assertFn(sameObject(held, pathStat), "canonical root pathname detached from retained descriptor", { held, pathStat });
  assertFn(held.dev === expectedRoot.dev && held.ino === expectedRoot.ino, "canonical root device/inode differs from review-set binding", { held, expectedRoot });
  return held;
}

async function openCanonicalRoot(expectedRoot) {
  authInvariant(fileURLToPath(import.meta.url) === SELF, "verifier is not executing from its canonical absolute path", {
    actual: fileURLToPath(import.meta.url),
    expected: SELF,
  });
  authInvariant(process.cwd() === CANONICAL_ROOT, "current directory is not the exact canonical root", {
    actual: process.cwd(),
    expected: CANONICAL_ROOT,
  });
  authInvariant(await realpath(process.cwd()) === CANONICAL_ROOT, "current directory realpath is not canonical root");
  authInvariant(Number.isInteger(fsConstants.O_NOFOLLOW) && Number.isInteger(fsConstants.O_DIRECTORY), "required directory flags unavailable");
  const handle = await open(
    CANONICAL_ROOT,
    fsConstants.O_RDONLY | fsConstants.O_DIRECTORY | fsConstants.O_NOFOLLOW,
  );
  try {
    await assertRootStillHeld(handle, expectedRoot);
    return handle;
  } catch (error) {
    await handle.close();
    throw error;
  }
}

async function openOneSnapshot(absolutePath, expectedBinding, {
  rootHandle = null,
  expectedRoot = null,
  afterOpen = null,
  requireCanonicalPath = true,
  expectedNlink = 1,
} = {}) {
  invariant(Number.isInteger(fsConstants.O_NOFOLLOW), "O_NOFOLLOW is unavailable");
  invariant(Number.isSafeInteger(expectedNlink) && expectedNlink >= 1, "expected snapshot link count is invalid");
  if (rootHandle) await assertRootStillHeld(rootHandle, expectedRoot);
  if (requireCanonicalPath) {
    invariant(absolutePath.startsWith(`${CANONICAL_ROOT}/`), "input path escapes canonical root", { absolutePath });
    invariant(await realpath(absolutePath) === absolutePath, "input realpath differs from canonical absolute path", { absolutePath });
  }
  const handle = await open(absolutePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  try {
    const before = stableStatProjection(await handle.stat({ bigint: true }));
    const pathBefore = stableStatProjection(await lstat(absolutePath, { bigint: true }));
    invariant(before.regularFile && pathBefore.regularFile, "snapshot input is not a regular file", { absolutePath });
    invariant(
      before.nlink === expectedNlink && pathBefore.nlink === expectedNlink,
      "snapshot input link count differs from its exact expected binding",
      { absolutePath, expectedNlink, before, pathBefore },
    );
    invariant(sameObject(before, pathBefore), "snapshot pathname differs from retained descriptor before read", { absolutePath, before, pathBefore });
    if (afterOpen) await afterOpen({ handle, before, absolutePath });
    const bytes = await handle.readFile();
    const after = stableStatProjection(await handle.stat({ bigint: true }));
    const pathAfter = stableStatProjection(await lstat(absolutePath, { bigint: true }));
    invariant(sameStableStat(before, after), "retained descriptor identity changed during snapshot", { absolutePath, before, after });
    invariant(sameObject(after, pathAfter), "snapshot pathname differs from retained descriptor after read", { absolutePath, after, pathAfter });
    if (rootHandle) await assertRootStillHeld(rootHandle, expectedRoot);
    const resolvedPath = await realpath(absolutePath);
    if (requireCanonicalPath) invariant(resolvedPath === absolutePath, "input realpath changed after snapshot", { absolutePath, resolvedPath });
    const binding = {
      absolutePath,
      resolvedPath,
      dev: before.dev,
      ino: before.ino,
      mode: before.mode,
      nlink: before.nlink,
      bytes: bytes.length,
      lfCount: countLf(bytes),
      finalLf: bytes.length > 0 && bytes[bytes.length - 1] === 0x0a,
      sha256: sha256(bytes),
    };
    if (expectedBinding) {
      invariant(bindingMatches(binding, expectedBinding), "snapshot differs from review-set fixed input binding", {
        actual: binding,
        expected: expectedBinding,
      });
    }
    return {
      handle,
      bytes,
      binding,
      stable: before,
      requireCanonicalPath,
    };
  } catch (error) {
    await handle.close();
    throw error;
  }
}

async function readExactDescriptorBytes(handle, expectedSize) {
  const bytes = Buffer.alloc(expectedSize);
  let offset = 0;
  try {
    while (offset < expectedSize) {
      const { bytesRead } = await handle.read(bytes, offset, expectedSize - offset, offset);
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    const extra = Buffer.alloc(1);
    const { bytesRead: trailing } = await handle.read(extra, 0, 1, expectedSize);
    invariant(offset === expectedSize && trailing === 0, "retained descriptor byte length changed before publication", {
      expectedSize,
      actualSizeAtLeast: offset + trailing,
    });
    return bytes;
  } catch (error) {
    if (error instanceof EvidenceInputMismatch) throw error;
    throw new MechanicalFailure("retained descriptor positional reread failed", summarizeError(error));
  }
}

async function revalidateSnapshot(snapshot, rootHandle = null, expectedRoot = null) {
  let descriptorStat;
  let pathStat;
  let resolvedPath;
  try {
    descriptorStat = stableStatProjection(await snapshot.handle.stat({ bigint: true }));
    pathStat = stableStatProjection(await lstat(snapshot.binding.absolutePath, { bigint: true }));
    resolvedPath = await realpath(snapshot.binding.absolutePath);
  } catch (error) {
    throw new MechanicalFailure("retained snapshot metadata revalidation failed", {
      absolutePath: snapshot.binding.absolutePath,
      error: summarizeError(error),
    });
  }
  invariant(sameStableStat(descriptorStat, snapshot.stable), "retained descriptor stable stat changed before publication", {
    absolutePath: snapshot.binding.absolutePath,
    expected: snapshot.stable,
    actual: descriptorStat,
  });
  invariant(sameStableStat(pathStat, snapshot.stable), "retained pathname stable stat changed before publication", {
    absolutePath: snapshot.binding.absolutePath,
    expected: snapshot.stable,
    actual: pathStat,
  });
  invariant(sameObject(descriptorStat, pathStat), "retained pathname detached from descriptor before publication", {
    absolutePath: snapshot.binding.absolutePath,
  });
  invariant(resolvedPath === snapshot.binding.resolvedPath, "retained snapshot realpath changed before publication", {
    absolutePath: snapshot.binding.absolutePath,
    expected: snapshot.binding.resolvedPath,
    actual: resolvedPath,
  });
  const bytes = await readExactDescriptorBytes(snapshot.handle, snapshot.bytes.length);
  invariant(bytes.equals(snapshot.bytes), "retained descriptor bytes changed before publication", {
    absolutePath: snapshot.binding.absolutePath,
    expectedSha256: snapshot.binding.sha256,
    actualSha256: sha256(bytes),
  });
  invariant(sha256(bytes) === snapshot.binding.sha256, "retained descriptor SHA-256 changed before publication", {
    absolutePath: snapshot.binding.absolutePath,
  });
  if (rootHandle) await assertRootStillHeld(rootHandle, expectedRoot, invariant);
  return true;
}

export async function revalidateFixtureSnapshotForTest(absolutePath, hook = null) {
  const snapshot = await openOneSnapshot(absolutePath, null, { requireCanonicalPath: false });
  try {
    if (hook) await hook(snapshot);
    return await revalidateSnapshot(snapshot);
  } finally {
    await snapshot.handle.close();
  }
}

export async function snapshotFixtureFile(absolutePath, expectedBinding = null, options = {}) {
  const snapshot = await openOneSnapshot(absolutePath, expectedBinding, {
    ...options,
    requireCanonicalPath: false,
  });
  try {
    return { bytes: snapshot.bytes, binding: snapshot.binding };
  } finally {
    await snapshot.handle.close();
  }
}

export function validateParserBufferBinding(bytes, binding) {
  invariant(Buffer.isBuffer(bytes), "parser input must be a Buffer");
  invariant(bytes.length === binding.bytes, "parser buffer length differs from snapshot binding");
  invariant(sha256(bytes) === binding.sha256, "parser buffer digest differs from snapshot binding");
  return true;
}

function validateOutputPair(phase, label) {
  invariant(
    exactKeys(phase, ["attemptOrdinal", "phaseCapabilityCommitment", "successOutput", "errorOutput"]),
    `${label} has unexpected fields`,
  );
  invariant(phase.attemptOrdinal === 1, `${label}.attemptOrdinal must be 1`);
  invariant(HEX64.test(phase.phaseCapabilityCommitment), `${label}.phaseCapabilityCommitment is invalid`);
  invariant(typeof phase.successOutput === "string" && path.isAbsolute(phase.successOutput), `${label}.successOutput must be absolute`);
  invariant(typeof phase.errorOutput === "string" && path.isAbsolute(phase.errorOutput), `${label}.errorOutput must be absolute`);
  invariant(phase.successOutput !== phase.errorOutput, `${label} success/error outputs must differ`);
}

function validateOutputParentRow(row, label) {
  invariant(
    exactKeys(row, [
      "declaredPath",
      "resolvedPath",
      "dev",
      "ino",
      "uid",
      "gid",
      "mode",
      "nlink",
      "mtimeNs",
      "ctimeNs",
      "birthtimeNs",
    ]),
    `${label} has unexpected fields`,
  );
  invariant(path.isAbsolute(row.declaredPath) && path.normalize(row.declaredPath) === row.declaredPath, `${label}.declaredPath is invalid`);
  invariant(path.isAbsolute(row.resolvedPath) && path.normalize(row.resolvedPath) === row.resolvedPath, `${label}.resolvedPath is invalid`);
  invariant(UINT.test(row.dev) && UINT.test(row.ino), `${label} device/inode is invalid`);
  invariant(Number.isSafeInteger(row.uid) && row.uid >= 0 && Number.isSafeInteger(row.gid) && row.gid >= 0, `${label} owner is invalid`);
  invariant(row.mode === "0700" && Number.isSafeInteger(row.nlink) && row.nlink >= 2, `${label} must be a mode-0700 directory binding`);
  invariant(UINT.test(row.mtimeNs) && UINT.test(row.ctimeNs) && UINT.test(row.birthtimeNs), `${label} timestamps are invalid`);
}

function validateRuntimeExecutableRow(row, index) {
  const label = `runtimeExecutables[${index}]`;
  invariant(
    exactKeys(row, [
      "role",
      "absolutePath",
      "resolvedPath",
      "dev",
      "ino",
      "uid",
      "gid",
      "mode",
      "nlink",
      "bytes",
      "sha256",
    ]),
    `${label} has unexpected fields`,
  );
  invariant(row.role === ["env", "node", "python"][index], `${label}.role mismatch`);
  invariant(row.absolutePath === [SYSTEM_ENV, EXPECTED_NODE, SYSTEM_WRITER][index], `${label}.absolutePath mismatch`);
  invariant(path.isAbsolute(row.resolvedPath), `${label}.resolvedPath must be absolute`);
  invariant(UINT.test(row.dev) && UINT.test(row.ino), `${label} device/inode is invalid`);
  invariant(Number.isSafeInteger(row.uid) && row.uid >= 0 && Number.isSafeInteger(row.gid) && row.gid >= 0, `${label} owner is invalid`);
  invariant(/^0[0-7]{3}$/u.test(row.mode), `${label}.mode is invalid`);
  invariant(Number.isSafeInteger(row.nlink) && row.nlink >= 1, `${label}.nlink is invalid`);
  invariant(Number.isSafeInteger(row.bytes) && row.bytes > 0, `${label}.bytes is invalid`);
  invariant(HEX64.test(row.sha256), `${label}.sha256 is invalid`);
}

function validateFixedInputRow(row, index) {
  const label = `fixedInputs[${index}]`;
  invariant(
    exactKeys(row, [
      "role",
      "absolutePath",
      "resolvedPath",
      "dev",
      "ino",
      "mode",
      "nlink",
      "bytes",
      "lfCount",
      "finalLf",
      "sha256",
    ]),
    `${label} has unexpected fields`,
  );
  invariant(typeof row.role === "string" && row.role.length > 0 && !/[\u0000\r\n]/.test(row.role), `${label}.role is invalid`);
  invariant(path.isAbsolute(row.absolutePath) && row.absolutePath.startsWith(`${CANONICAL_ROOT}/`), `${label}.absolutePath is outside canonical root`);
  invariant(row.resolvedPath === row.absolutePath, `${label}.resolvedPath must equal absolutePath`);
  invariant(UINT.test(row.dev) && UINT.test(row.ino), `${label} device/inode must be canonical unsigned decimal`);
  invariant(/^0[0-7]{3}$/.test(row.mode), `${label}.mode is invalid`);
  invariant(row.nlink === 1, `${label}.nlink must be one`);
  invariant(Number.isSafeInteger(row.bytes) && row.bytes >= 0, `${label}.bytes is invalid`);
  invariant(Number.isSafeInteger(row.lfCount) && row.lfCount >= 0, `${label}.lfCount is invalid`);
  invariant(typeof row.finalLf === "boolean", `${label}.finalLf is invalid`);
  invariant(HEX64.test(row.sha256), `${label}.sha256 is invalid`);
}

export function validateReviewSetManifestShape(value) {
  invariant(
    exactKeys(value, [
      "schemaVersion",
      "artifactType",
      "authority",
      "protocolVersion",
      "attestationMode",
      "portableTaskSystemSignatureAvailable",
      "localFilesSelfAuthenticateTaskIdentity",
      "qualificationRequiresBoundThreadObservation",
      "attemptLedger",
      "sourceThreadId",
      "userAuthorizationTurnId",
      "userAuthorizationTextSha256",
      "reviewSetNonce",
      "canonicalRoot",
      "runtimeExecutables",
      "fixedInputs",
      "reviewers",
      "reviewSetDigest",
    ]),
    "review-set manifest has unexpected fields",
  );
  invariant(value.schemaVersion === 2, "review-set schemaVersion must be 2");
  invariant(value.artifactType === "g4-l10-native-helper-v2-18-live-control-plane-bound-review-set", "review-set artifactType mismatch");
  invariant(value.authority === "correlation-and-capability-only-never-self-authorizing", "review-set authority must remain correlation/capability only");
  invariant(value.protocolVersion === "v2.18", "review-set protocolVersion mismatch");
  invariant(value.attestationMode === "live-codex-control-plane", "review-set attestationMode mismatch");
  invariant(value.portableTaskSystemSignatureAvailable === false, "portable task-system signature must remain unavailable");
  invariant(value.localFilesSelfAuthenticateTaskIdentity === false, "local files must not self-authenticate task identity");
  invariant(value.qualificationRequiresBoundThreadObservation === true, "bound thread observation must be required");
  invariant(value.attemptLedger === "codex-task-history", "attempt ledger must be Codex task history");
  for (const key of ["sourceThreadId", "userAuthorizationTurnId"]) {
    invariant(typeof value[key] === "string" && value[key].length > 0 && !/[\u0000\r\n]/.test(value[key]), `${key} is invalid`);
  }
  invariant(HEX64.test(value.userAuthorizationTextSha256), "userAuthorizationTextSha256 is invalid");
  invariant(HEX64.test(value.reviewSetNonce), "reviewSetNonce is invalid");
  invariant(
    exactKeys(value.canonicalRoot, ["declared", "resolved", "dev", "ino"]),
    "canonicalRoot has unexpected fields",
  );
  invariant(value.canonicalRoot.declared === CANONICAL_ROOT, "canonicalRoot.declared mismatch");
  invariant(value.canonicalRoot.resolved === CANONICAL_ROOT, "canonicalRoot.resolved mismatch");
  invariant(UINT.test(value.canonicalRoot.dev) && UINT.test(value.canonicalRoot.ino), "canonicalRoot device/inode is invalid");

  invariant(Array.isArray(value.runtimeExecutables) && value.runtimeExecutables.length === 3, "runtimeExecutables must contain exactly three rows");
  value.runtimeExecutables.forEach(validateRuntimeExecutableRow);

  invariant(Array.isArray(value.fixedInputs) && value.fixedInputs.length === 41, "fixedInputs must contain exactly 41 rows");
  value.fixedInputs.forEach(validateFixedInputRow);
  const inputPaths = value.fixedInputs.map((row) => row.absolutePath);
  const inputRoles = value.fixedInputs.map((row) => row.role);
  invariant(new Set(inputPaths).size === inputPaths.length, "fixedInputs contains duplicate paths");
  invariant(new Set(inputRoles).size === inputRoles.length, "fixedInputs contains duplicate roles");
  for (let index = 0; index < CORE_INPUTS.length; index += 1) {
    invariant(value.fixedInputs[index].role === CORE_INPUTS[index].role, `fixedInputs core role order mismatch at ${index}`);
    invariant(value.fixedInputs[index].absolutePath === CORE_INPUTS[index].absolutePath, `fixedInputs core path order mismatch at ${index}`);
  }

  invariant(Array.isArray(value.reviewers) && value.reviewers.length === 3, "reviewers must contain exactly three rows");
  const outputPaths = [];
  const ids = [];
  const nonces = [];
  const capabilities = [];
  const parentObjects = [];
  const taskRoutes = [];
  for (let index = 0; index < value.reviewers.length; index += 1) {
    const reviewer = value.reviewers[index];
    invariant(
      exactKeys(reviewer, ["scope", "taskSystemId", "taskHostId", "reviewerNonce", "outputParent", "preflight", "evidence"]),
      `reviewers[${index}] has unexpected fields`,
    );
    invariant(reviewer.scope === SCOPES[index], `reviewers[${index}].scope must be ${SCOPES[index]}`);
    invariant(typeof reviewer.taskSystemId === "string" && reviewer.taskSystemId.length > 0 && !/[\u0000\r\n]/.test(reviewer.taskSystemId), `reviewers[${index}].taskSystemId is invalid`);
    invariant(typeof reviewer.taskHostId === "string" && reviewer.taskHostId.length > 0 && !/[\u0000\r\n]/.test(reviewer.taskHostId), `reviewers[${index}].taskHostId is invalid`);
    invariant(HEX64.test(reviewer.reviewerNonce), `reviewers[${index}].reviewerNonce is invalid`);
    validateOutputParentRow(reviewer.outputParent, `reviewers[${index}].outputParent`);
    invariant(reviewer.outputParent.nlink === 2, `reviewers[${index}].outputParent must have empty-directory link count two`);
    validateOutputPair(reviewer.preflight, `reviewers[${index}].preflight`);
    validateOutputPair(reviewer.evidence, `reviewers[${index}].evidence`);
    for (const phase of [reviewer.preflight, reviewer.evidence]) {
      invariant(path.dirname(phase.successOutput) === reviewer.outputParent.declaredPath, `reviewers[${index}] success output is outside its parent`);
      invariant(path.dirname(phase.errorOutput) === reviewer.outputParent.declaredPath, `reviewers[${index}] error output is outside its parent`);
      capabilities.push(phase.phaseCapabilityCommitment);
    }
    ids.push(reviewer.taskSystemId);
    taskRoutes.push(`${reviewer.taskHostId}\u0000${reviewer.taskSystemId}`);
    nonces.push(reviewer.reviewerNonce);
    parentObjects.push(`${reviewer.outputParent.dev}:${reviewer.outputParent.ino}`);
    outputPaths.push(
      reviewer.preflight.successOutput,
      reviewer.preflight.errorOutput,
      reviewer.evidence.successOutput,
      reviewer.evidence.errorOutput,
    );
  }
  invariant(new Set(ids).size === ids.length, "reviewer task IDs must be distinct");
  invariant(new Set(taskRoutes).size === taskRoutes.length, "reviewer task routes must be distinct");
  invariant(new Set(nonces).size === nonces.length, "reviewer nonces must be distinct");
  invariant(new Set(capabilities).size === capabilities.length, "phase capability commitments must be distinct");
  invariant(new Set(parentObjects).size === parentObjects.length, "output parent objects must be distinct");
  invariant(new Set(outputPaths).size === outputPaths.length, "all reviewer output paths must be distinct");
  invariant(HEX64.test(value.reviewSetDigest), "reviewSetDigest is invalid");
  invariant(computeReviewSetDigest(value) === value.reviewSetDigest, "reviewSetDigest does not match manifest body");
  return value;
}

export function validateInvocationBinding(manifest, {
  command,
  scope,
  reviewerTaskId,
  phaseCapability,
  successOutput,
  errorOutput,
}) {
  validateReviewSetManifestShape(manifest);
  authInvariant(command === "preflight" || command === "evidence", "command is invalid");
  authInvariant(SCOPES.includes(scope), "scope is invalid");
  const reviewer = manifest.reviewers.find((row) => row.taskSystemId === reviewerTaskId);
  authInvariant(reviewer, "reviewer task ID is not in the assigned review set");
  authInvariant(reviewer.scope === scope, "reviewer task ID is bound to a different scope", {
    expected: reviewer.scope,
    actual: scope,
  });
  const phase = reviewer[command];
  authInvariant(phase.successOutput === successOutput, "success output differs from assigned review-set binding");
  authInvariant(phase.errorOutput === errorOutput, "error output differs from assigned review-set binding");
  const actualCommitment = computeCapabilityCommitment({
    reviewSetNonce: manifest.reviewSetNonce,
    taskSystemId: reviewer.taskSystemId,
    taskHostId: reviewer.taskHostId,
    reviewerNonce: reviewer.reviewerNonce,
    scope: reviewer.scope,
    phase: command,
    outputParent: reviewer.outputParent,
    successOutput: phase.successOutput,
    errorOutput: phase.errorOutput,
    capability: phaseCapability,
  });
  authInvariant(
    constantTimeHexEqual(actualCommitment, phase.phaseCapabilityCommitment),
    "phase capability does not match the assigned task/scope/phase commitment",
  );
  return reviewer;
}

function recoverOption(argv, key) {
  const values = [];
  for (let index = 0; index < argv.length - 1; index += 1) {
    if (argv[index] === key) values.push(argv[index + 1]);
  }
  return values.length === 1 ? values[0] : null;
}

function recoverInvocation(argv) {
  const command = argv[0] === "evidence" ? "evidence" : "preflight";
  return {
    command,
    scope: recoverOption(argv, "--scope"),
    reviewerTaskId: recoverOption(argv, "--reviewer-task-id"),
    phaseCapability: null,
    preflightCapability: null,
    reviewSetManifest: recoverOption(argv, "--review-set-manifest"),
    reviewSetManifestSha256: recoverOption(argv, "--review-set-manifest-sha256"),
    preflightReceipt: recoverOption(argv, "--preflight-receipt"),
    successOutput: recoverOption(argv, "--success-output"),
    errorOutput: recoverOption(argv, "--error-output"),
  };
}

function parseCli(argv) {
  if (argv.length === 0) throw new UsageFault("expected preflight or evidence");
  const command = argv[0];
  if (command !== "preflight" && command !== "evidence") {
    throw new UsageFault("first argument must be preflight or evidence");
  }
  const allowed = new Set([
    "--scope",
    "--reviewer-task-id",
    "--phase-capability",
    "--review-set-manifest",
    "--review-set-manifest-sha256",
    "--success-output",
    "--error-output",
    ...(command === "evidence" ? ["--preflight-capability", "--preflight-receipt"] : []),
  ]);
  const values = new Map();
  for (let index = 1; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!allowed.has(key)) throw new UsageFault(`unknown option: ${key}`);
    if (value === undefined || value.startsWith("--")) throw new UsageFault(`missing value for ${key}`);
    if (values.has(key)) throw new UsageFault(`duplicate option: ${key}`);
    values.set(key, value);
  }
  const required = [
    "--scope",
    "--reviewer-task-id",
    "--phase-capability",
    "--review-set-manifest",
    "--review-set-manifest-sha256",
    "--success-output",
    "--error-output",
    ...(command === "evidence" ? ["--preflight-capability", "--preflight-receipt"] : []),
  ];
  for (const key of required) if (!values.has(key)) throw new UsageFault(`missing ${key}`);
  const scope = values.get("--scope");
  if (!SCOPES.includes(scope)) throw new UsageFault(`scope must be one of ${SCOPES.join(",")}`);
  const pathKeys = [
    "--review-set-manifest",
    "--success-output",
    "--error-output",
    ...(command === "evidence" ? ["--preflight-receipt"] : []),
  ];
  for (const key of pathKeys) {
    const raw = values.get(key);
    if (!path.isAbsolute(raw)) throw new UsageFault(`${key} must already be an absolute path literal`);
    if (path.normalize(raw) !== raw) throw new UsageFault(`${key} must already be lexically normalized`);
  }
  const options = {
    command,
    scope,
    reviewerTaskId: values.get("--reviewer-task-id"),
    phaseCapability: values.get("--phase-capability"),
    preflightCapability: command === "evidence" ? values.get("--preflight-capability") : null,
    reviewSetManifest: values.get("--review-set-manifest"),
    reviewSetManifestSha256: values.get("--review-set-manifest-sha256"),
    successOutput: values.get("--success-output"),
    errorOutput: values.get("--error-output"),
    preflightReceipt: command === "evidence" ? values.get("--preflight-receipt") : null,
  };
  if (!HEX64.test(options.reviewSetManifestSha256)) throw new UsageFault("review-set manifest SHA-256 must be lowercase hex");
  if (!HEX64.test(options.phaseCapability)) throw new UsageFault("phase capability must be 32-byte lowercase hex");
  if (command === "evidence" && !HEX64.test(options.preflightCapability)) throw new UsageFault("preflight capability must be 32-byte lowercase hex");
  if (options.successOutput === options.errorOutput) throw new UsageFault("success and error output paths must differ");
  return options;
}

export function parseCliForTest(argv) {
  return parseCli(argv);
}

async function loadReviewSet(options, heldHandles) {
  let manifestSnapshot;
  try {
    manifestSnapshot = await openOneSnapshot(options.reviewSetManifest, null, {
      requireCanonicalPath: false,
    });
  } catch (error) {
    if (error instanceof MechanicalFailure) throw error;
    if (error instanceof EvidenceInputMismatch) {
      throw new AuthenticationFailure("review-set manifest custody or bytes are invalid", summarizeError(error));
    }
    throw new AuthenticationFailure("review-set manifest could not be opened from the assigned path", summarizeError(error));
  }
  heldHandles.push(manifestSnapshot.handle);
  authInvariant(
    manifestSnapshot.binding.sha256 === options.reviewSetManifestSha256,
    "review-set manifest SHA-256 differs from assigned invocation",
    {
      expected: options.reviewSetManifestSha256,
      actual: manifestSnapshot.binding.sha256,
    },
  );
  authInvariant(
    ["0400", "0600"].includes(manifestSnapshot.binding.mode),
    "review-set manifest mode must be 0400 or 0600",
  );
  let manifest;
  try {
    manifest = JSON.parse(decodeUtf8(manifestSnapshot.bytes));
  } catch (error) {
    throw new AuthenticationFailure("review-set manifest is not canonical UTF-8 JSON", summarizeError(error));
  }
  try {
    validateReviewSetManifestShape(manifest);
    authInvariant(
      Buffer.from(`${JSON.stringify(sortedValue(manifest), null, 2)}\n`, "utf8").equals(manifestSnapshot.bytes),
      "review-set manifest bytes are not canonical pretty JSON with final LF",
    );
  } catch (error) {
    if (error instanceof AuthenticationFailure) throw error;
    throw new AuthenticationFailure("review-set manifest shape or digest is invalid", summarizeError(error));
  }
  const reviewer = validateInvocationBinding(manifest, options);
  return {
    manifest,
    reviewer,
    snapshot: manifestSnapshot,
    outputParentBinding: reviewer.outputParent,
    ...localTaskAuthenticationState(),
    phaseCapabilityVerified: true,
  };
}
function codeBlocks(text) {
  return [...text.matchAll(/```text\n([\s\S]*?)```/g)].map((match) => match[1]);
}

function codeBlocksAfter(text, anchor, label) {
  const offset = text.indexOf(anchor);
  if (offset < 0) throw new EvidenceInputMismatch(`${label} anchor not found`);
  return codeBlocks(text.slice(offset + anchor.length));
}

function linesFromBlock(block, label) {
  invariant(block.endsWith("\n"), `${label} lacks final LF`);
  invariant(!block.includes("\r"), `${label} contains CR`);
  const lines = block.slice(0, -1).split("\n");
  invariant(lines.every((line) => line.length > 0), `${label} has blank row`);
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
  invariant(matches.length === 1, `${label} expected one code block`, { count: matches.length });
  return matches[0];
}

function pushCheck(errors, id, condition, expected, actual) {
  if (!condition) errors.push({ id, expected, actual });
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
  pushCheck(errors, "protocol-no-usage-error-status", !text.includes("- `USAGE_ERROR`"), true, false);
}

function validateSuccessorTarget(text, errors) {
  const markers = [
    "ADV-01 remediation: routed task identity and locally keyed receipts",
    "ADV-02 remediation: control-plane spend plus manifest-bound parents",
    "ADV-03 remediation: all fixed inputs retained and revalidated",
    "ADV-04 remediation: isolated process startup",
    "ADV-05 remediation: delayed local capability-bound state",
    "ADV-06 remediation: exact failure taxonomy",
    "The verifier does not claim that Codex supplies a signed task attestation.",
    "Across the set there are exactly three output parents and twelve declared",
    "The v2.18 manifest must carry the exact closed, correlation-only `authority`",
    "Every v2.18 receipt class must carry",
    "the complete `authorityEffects` object with every effect set to `false`",
  ];
  for (const marker of markers) {
    pushCheck(errors, `successor-target-marker:${marker}`, text.includes(marker), true, false);
  }
  pushCheck(
    errors,
    "successor-no-result-inheritance",
    text.includes("No v2.14, v2.15, v2.16, or v2.17 result is carried forward as a v2.18"),
    true,
    false,
  );
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

function validateHmgStructures(v214Text, v213Text, v212Text, errors) {
  const b214 = codeBlocks(v214Text);
  const b213 = codeBlocks(v213Text);

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
  pushCheck(
    errors,
    "hmg4gl4-domain-sha256",
    sha256(Buffer.concat([Buffer.from("HMG4GL4\n"), Buffer.from(gl4)])) === EXPECTED.hmg4gl4.domainSha256,
    EXPECTED.hmg4gl4.domainSha256,
    sha256(Buffer.concat([Buffer.from("HMG4GL4\n"), Buffer.from(gl4)])),
  );

  const al3 = findBlock(
    b213,
    (rows) => rows.length === 21 && rows.every((row) => row.split("|").length === 6) && rows[0].startsWith("F|P1|V211-SEVEN-BYTE"),
    "HMG4AL3",
  );
  const alRows = linesFromBlock(al3, "HMG4AL3").map((row) => row.split("|"));
  const alBytes = Buffer.from(al3);
  const idPattern = /^[A-Z0-9_-]+$/;
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
      && HEX64.test(problemHash)
      && HEX64.test(remediationHash)
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
  pushCheck(
    errors,
    "hmg4al3-domain-sha256",
    sha256(Buffer.concat([Buffer.from("HMG4AL3\n"), alBytes])) === EXPECTED.hmg4al3.domainSha256,
    EXPECTED.hmg4al3.domainSha256,
    sha256(Buffer.concat([Buffer.from("HMG4AL3\n"), alBytes])),
  );

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
      let decoded = Buffer.alloc(0);
      let decodedText = null;
      try {
        decoded = Buffer.from(encoded, "base64");
        decodedText = decodeUtf8(decoded);
      } catch {
        peGrammar = false;
      }
      peGrammar &&= UINT.test(lengthText)
        && base64Pattern.test(encoded)
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
  pushCheck(
    errors,
    "hmg4pe1-domain-sha256",
    sha256(Buffer.concat([Buffer.from("HMG4PE1\n"), peBytes])) === EXPECTED.hmg4pe1.domainSha256,
    EXPECTED.hmg4pe1.domainSha256,
    sha256(Buffer.concat([Buffer.from("HMG4PE1\n"), peBytes])),
  );

  const fr3 = findBlock(
    b214,
    (rows) => rows.length === 3 && rows[0].startsWith("schema|") && rows[1].startsWith("adversarial|") && rows[2].startsWith("whole|"),
    "HMG4FR3",
  );
  const frRows = linesFromBlock(fr3, "HMG4FR3").map((row) => row.split("|"));
  const frBytes = Buffer.from(fr3);
  const frGrammar = frRows.every((row) => row.length === 11)
    && exactStringArray(frRows.map((row) => row[0]), SCOPES)
    && frRows.every((row) => HEX64.test(row[5]));
  pushCheck(errors, "hmg4fr3-grammar", frGrammar, true, frGrammar);
  pushCheck(errors, "hmg4fr3-row-count", frRows.length === EXPECTED.hmg4fr3.rowCount, EXPECTED.hmg4fr3.rowCount, frRows.length);
  pushCheck(errors, "hmg4fr3-bytes", frBytes.length === EXPECTED.hmg4fr3.bytes, EXPECTED.hmg4fr3.bytes, frBytes.length);
  pushCheck(errors, "hmg4fr3-sha256", sha256(frBytes) === EXPECTED.hmg4fr3.sha256, EXPECTED.hmg4fr3.sha256, sha256(frBytes));
  pushCheck(
    errors,
    "hmg4fr3-domain-sha256",
    sha256(Buffer.concat([Buffer.from("HMG4FR3\n"), frBytes])) === EXPECTED.hmg4fr3.domainSha256,
    EXPECTED.hmg4fr3.domainSha256,
    sha256(Buffer.concat([Buffer.from("HMG4FR3\n"), frBytes])),
  );
  pushCheck(errors, "hmg4fr3-failure-interpretation", v214Text.includes("HMG4FR3 is a failure receipt, not a review result for v2.14."), true, false);

  return {
    hmg4gl4: { ...EXPECTED.hmg4gl4, verified: errors.every((entry) => !entry.id.startsWith("hmg4gl4")) },
    hmg4al3: { ...EXPECTED.hmg4al3, verified: errors.every((entry) => !entry.id.startsWith("hmg4al3")) },
    hmg4pe1: { ...EXPECTED.hmg4pe1, verified: errors.every((entry) => !entry.id.startsWith("hmg4pe1")) },
    hmg4fr3: {
      ...EXPECTED.hmg4fr3,
      interpretation: "failed-v2.13-batch-output-identity-receipt-not-v2.14-review-result",
      verified: errors.every((entry) => !entry.id.startsWith("hmg4fr3")),
    },
  };
}

function hardcodedIdentityMatches(role, binding) {
  if (role === "target") return bindingMatches(binding, { ...binding, ...EXPECTED.target });
  if (role === "protocol") return bindingMatches(binding, { ...binding, ...EXPECTED.protocol });
  if (Object.hasOwn(EXPECTED.fixedSha256, role)) return binding.sha256 === EXPECTED.fixedSha256[role];
  if (role === "history-closure") return binding.sha256 === EXPECTED.history.sha256;
  return true;
}

export function hardcodedIdentityMatchesForTest(role, binding) {
  return hardcodedIdentityMatches(role, binding);
}

function expectedHistoryRows(historyManifest) {
  invariant(Array.isArray(historyManifest.artifacts), "history artifacts must be an array");
  const rows = [];
  for (let index = 0; index < historyManifest.artifacts.length; index += 1) {
    const artifact = historyManifest.artifacts[index];
    invariant(typeof artifact.path === "string" && !path.isAbsolute(artifact.path), "history artifact path must be project-relative");
    const absolutePath = path.resolve(CANONICAL_ROOT, artifact.path);
    invariant(absolutePath.startsWith(`${CANONICAL_ROOT}/`), "history artifact path escapes canonical root");
    if (absolutePath === V214) continue;
    rows.push({
      role: `history-member-${String(index + 1).padStart(2, "0")}`,
      absolutePath,
      artifact,
    });
  }
  return rows;
}

async function historyDiscoveryPaths() {
  const reportNames = (await readdir(`${CANONICAL_ROOT}/reports`))
    .filter((name) => name.startsWith(HISTORY_PREFIX))
    .sort();
  return [
    "docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md",
    ...reportNames.map((name) => `reports/${name}`),
  ];
}

export function validateIsolatedStartupEnvironmentForTest(environment = process.env, execArgv = process.execArgv, execPath = process.execPath) {
  authInvariant(execPath === EXPECTED_NODE, "formal verifier did not start from the manifest-specified absolute Node path", {
    expected: EXPECTED_NODE,
    actual: execPath,
  });
  authInvariant(Array.isArray(execArgv) && execArgv.length === 0, "formal verifier process.execArgv must be empty", execArgv);
  const environmentSnapshot = Object.fromEntries(Object.entries(environment));
  const environmentMatches = canonicalJson(environmentSnapshot) === canonicalJson(SAFE_CHILD_ENV);
  const expectedKeys = Object.keys(SAFE_CHILD_ENV).sort();
  const actualKeys = Object.keys(environmentSnapshot).sort();
  authInvariant(environmentMatches, "formal verifier startup environment is not the exact env -i allowlist", {
    expectedKeys,
    actualKeys,
    missingKeys: expectedKeys.filter((key) => !Object.hasOwn(environmentSnapshot, key)),
    extraKeys: actualKeys.filter((key) => !Object.hasOwn(SAFE_CHILD_ENV, key)),
    actualEnvironmentDigest: sha256(Buffer.from(canonicalJson(environmentSnapshot), "utf8")),
  });
  return true;
}

async function openRuntimeExecutableSnapshot(expected) {
  const snapshot = await openOneSnapshot(expected.absolutePath, null, {
    requireCanonicalPath: false,
    expectedNlink: expected.nlink,
  });
  const actual = {
    role: expected.role,
    absolutePath: snapshot.binding.absolutePath,
    resolvedPath: snapshot.binding.resolvedPath,
    dev: snapshot.binding.dev,
    ino: snapshot.binding.ino,
    uid: snapshot.stable.uid,
    gid: snapshot.stable.gid,
    mode: snapshot.binding.mode,
    nlink: snapshot.binding.nlink,
    bytes: snapshot.binding.bytes,
    sha256: snapshot.binding.sha256,
  };
  authInvariant(canonicalJson(actual) === canonicalJson(expected), "runtime executable differs from manifest binding", {
    expected,
    actual,
  });
  const { dev: _dev, ino: _ino, ...portableIdentity } = actual;
  authInvariant(
    canonicalJson(portableIdentity) === canonicalJson(EXPECTED.runtimeExecutables[expected.role]),
    "runtime executable differs from the v2.18 hardcoded identity",
    {
      expected: EXPECTED.runtimeExecutables[expected.role],
      actual: portableIdentity,
    },
  );
  return { ...snapshot, role: expected.role, runtimeBinding: actual };
}

function validateHistoryFromSnapshots(historyManifest, snapshots, discoveryBefore, discoveryAfter, errors) {
  pushCheck(errors, "history-status", historyManifest.status === "STRICT_BUT_NONQUALIFYING_CLOSED", "STRICT_BUT_NONQUALIFYING_CLOSED", historyManifest.status);
  pushCheck(errors, "history-artifact-count", Array.isArray(historyManifest.artifacts) && historyManifest.artifacts.length === 17, 17, historyManifest.artifacts?.length);
  pushCheck(errors, "history-summary-count", historyManifest.summary?.artifactCount === 17, 17, historyManifest.summary?.artifactCount);
  pushCheck(errors, "history-failed-count", historyManifest.summary?.failedBatchReceiptCount === 6, 6, historyManifest.summary?.failedBatchReceiptCount);
  pushCheck(errors, "history-activation-count", historyManifest.summary?.activationReceiptCount === 4, 4, historyManifest.summary?.activationReceiptCount);
  pushCheck(errors, "history-plan-count", historyManifest.summary?.chunkPlanCount === 6, 6, historyManifest.summary?.chunkPlanCount);
  pushCheck(errors, "history-qualifying-count", historyManifest.summary?.qualifyingReviewCount === 0, 0, historyManifest.summary?.qualifyingReviewCount);

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
    pushCheck(errors, `history-rule:${rule}`, historyManifest.rules?.[rule] === false, false, historyManifest.rules?.[rule]);
  }

  const failedIds = [
    "487d5f85f7cd3be759a8863dcbde09d4675ab68e00b91c77e415234692d0a20c",
    "4b098db0605790fa05066d55e3d3da102661be90c9b5a7191b35ec2b7bed1b08",
    "4d05187e1306c9d1da49fd5ba9a0501f2fce4a8bd165e4cb4953ec5273c1efc4",
    "ab155b63e1ffd8bdf588b0e5b69072e42542dabe99c936adbc1ad8caff289e0a",
    "ae013cdb3b78751a0d23a7699c7d054555e928b174ddfd216a4410bf99208c6f",
    "c9f781b1cc093b74af16916fa226432aa222aeafed5d18bbd8c5a0d9678522f3",
  ];
  pushCheck(errors, "history-six-failed-domain-ids", exactStringArray(historyManifest.failedHMG4RB4, failedIds), failedIds, historyManifest.failedHMG4RB4);

  const artifacts = Array.isArray(historyManifest.artifacts) ? historyManifest.artifacts : [];
  const paths = artifacts.map((entry) => entry.path);
  pushCheck(errors, "history-unique-paths", new Set(paths).size === paths.length, paths.length, new Set(paths).size);
  pushCheck(errors, "history-discovery-stable", exactStringArray(discoveryBefore, discoveryAfter), discoveryBefore, discoveryAfter);
  pushCheck(errors, "history-exact-discovery-allowlist", exactStringArray(paths, discoveryBefore), paths, discoveryBefore);

  let verifiedArtifactCount = 0;
  const failedReceiptTexts = [];
  for (const entry of artifacts) {
    const absolutePath = path.resolve(CANONICAL_ROOT, entry.path);
    const snapshot = snapshots.get(absolutePath);
    const identity = snapshot?.binding;
    const matches = identity
      && identity.bytes === entry.bytes
      && identity.lfCount === entry.lfCount
      && identity.mode === entry.mode
      && identity.sha256 === entry.sha256
      && identity.nlink === 1;
    pushCheck(errors, `history-member:${entry.path}`, Boolean(matches), entry, identity ?? null);
    if (matches) verifiedArtifactCount += 1;
    if (entry.role === "failed-batch-receipt" && snapshot) {
      try {
        failedReceiptTexts.push(decodeUtf8(snapshot.bytes));
      } catch (error) {
        pushCheck(errors, `history-member-utf8:${entry.path}`, false, "valid UTF-8", summarizeError(error));
      }
    }
  }
  for (const failedId of failedIds) {
    const containing = failedReceiptTexts.filter((text) => text.includes(failedId)).length;
    pushCheck(errors, `history-failed-domain-present:${failedId}`, containing === 1, 1, containing);
  }
  return { verifiedArtifactCount };
}

async function collectInputContext(options) {
  const handles = [];
  let rootHandle = null;
  let reviewSet = null;
  try {
    reviewSet = await loadReviewSet(options, handles);
    validateIsolatedStartupEnvironmentForTest();
    rootHandle = await openCanonicalRoot(reviewSet.manifest.canonicalRoot);
    handles.push(rootHandle);

    const runtimeSnapshots = [];
    for (const expected of reviewSet.manifest.runtimeExecutables) {
      const snapshot = await openRuntimeExecutableSnapshot(expected);
      handles.push(snapshot.handle);
      runtimeSnapshots.push(snapshot);
    }

    const snapshots = new Map();
    for (let index = 0; index < CORE_INPUTS.length; index += 1) {
      const descriptor = CORE_INPUTS[index];
      const expectedBinding = reviewSet.manifest.fixedInputs[index];
      invariant(expectedBinding.role === descriptor.role, "fixed input core role mismatch");
      invariant(expectedBinding.absolutePath === descriptor.absolutePath, "fixed input core path mismatch");
      const snapshot = await openOneSnapshot(descriptor.absolutePath, expectedBinding, {
        rootHandle,
        expectedRoot: reviewSet.manifest.canonicalRoot,
      });
      handles.push(snapshot.handle);
      snapshots.set(descriptor.absolutePath, { ...snapshot, role: descriptor.role });
      invariant(
        hardcodedIdentityMatches(descriptor.role, snapshot.binding),
        `hardcoded ${descriptor.role} identity mismatch`,
        snapshot.binding,
      );
    }

    let historyManifest;
    try {
      historyManifest = JSON.parse(decodeUtf8(snapshots.get(HISTORY).bytes));
    } catch (error) {
      throw new EvidenceInputMismatch("history closure is not valid UTF-8 JSON", summarizeError(error));
    }
    const historyRows = expectedHistoryRows(historyManifest);
    const requiredRows = [
      ...CORE_INPUTS,
      ...historyRows.map(({ role, absolutePath }) => ({ role, absolutePath })),
    ];
    invariant(
      reviewSet.manifest.fixedInputs.length === requiredRows.length,
      "fixedInputs does not match the exact unique input set",
      { expected: requiredRows.length, actual: reviewSet.manifest.fixedInputs.length },
    );
    for (let index = 0; index < requiredRows.length; index += 1) {
      invariant(
        reviewSet.manifest.fixedInputs[index].role === requiredRows[index].role,
        `fixedInputs role mismatch at ${index}`,
      );
      invariant(
        reviewSet.manifest.fixedInputs[index].absolutePath === requiredRows[index].absolutePath,
        `fixedInputs path mismatch at ${index}`,
      );
    }

    const discoveryBefore = await historyDiscoveryPaths();
    for (let offset = 0; offset < historyRows.length; offset += 1) {
      const row = historyRows[offset];
      const expectedBinding = reviewSet.manifest.fixedInputs[CORE_INPUTS.length + offset];
      const snapshot = await openOneSnapshot(row.absolutePath, expectedBinding, {
        rootHandle,
        expectedRoot: reviewSet.manifest.canonicalRoot,
      });
      handles.push(snapshot.handle);
      snapshots.set(row.absolutePath, { ...snapshot, role: row.role });
    }
    const discoveryAfter = await historyDiscoveryPaths();
    invariant(
      exactStringArray(discoveryBefore, discoveryAfter),
      "history discovery set changed during initial collection",
      { discoveryBefore, discoveryAfter },
    );
    await assertRootStillHeld(rootHandle, reviewSet.manifest.canonicalRoot, invariant);

    let closed = false;
    return {
      reviewSet,
      rootHandle,
      runtimeSnapshots,
      snapshots,
      historyManifest,
      discoveryBefore,
      discoveryAfter,
      async revalidateAllInputs(extraSnapshots = []) {
        await assertRootStillHeld(rootHandle, reviewSet.manifest.canonicalRoot, invariant);
        await revalidateSnapshot(reviewSet.snapshot);
        for (const snapshot of runtimeSnapshots) await revalidateSnapshot(snapshot);
        for (const snapshot of snapshots.values()) {
          await revalidateSnapshot(snapshot, rootHandle, reviewSet.manifest.canonicalRoot);
        }
        for (const snapshot of extraSnapshots) await revalidateSnapshot(snapshot);
        const discoveryNow = await historyDiscoveryPaths();
        invariant(
          exactStringArray(discoveryBefore, discoveryNow)
            && exactStringArray(discoveryAfter, discoveryNow),
          "history discovery set changed before publication",
          { discoveryBefore, discoveryAfter, discoveryNow },
        );
        await assertRootStillHeld(rootHandle, reviewSet.manifest.canonicalRoot, invariant);
        return true;
      },
      async close() {
        if (closed) return;
        closed = true;
        const reversed = [...handles].reverse();
        const failures = [];
        for (const handle of reversed) {
          try {
            await handle.close();
          } catch (error) {
            failures.push(summarizeError(error));
          }
        }
        if (failures.length > 0) {
          throw new MechanicalFailure("one or more retained descriptors failed checked close", failures);
        }
      },
    };
  } catch (error) {
    for (const handle of [...handles].reverse()) {
      try {
        await handle.close();
      } catch {
        // The original pre-authentication error remains primary.
      }
    }
    throw error;
  }
}
function snapshotText(context, absolutePath) {
  const snapshot = context.snapshots.get(absolutePath);
  invariant(snapshot, "required snapshot is absent", { absolutePath });
  validateParserBufferBinding(snapshot.bytes, snapshot.binding);
  return decodeUtf8(snapshot.bytes);
}

function structuralAssessment(context) {
  const errors = [];
  const targetText = snapshotText(context, TARGET);
  const protocolText = snapshotText(context, PROTOCOL);
  const v214Text = snapshotText(context, V214);
  const v213Text = snapshotText(context, V213);
  const v212Text = snapshotText(context, V212);
  validateProtocol(protocolText, errors);
  validateSuccessorTarget(targetText, errors);
  validateOrderedSections(v214Text, errors);
  validateRetainedBoundaries(v214Text, errors);
  const history = validateHistoryFromSnapshots(
    context.historyManifest,
    context.snapshots,
    context.discoveryBefore,
    context.discoveryAfter,
    errors,
  );
  const structures = validateHmgStructures(v214Text, v213Text, v212Text, errors);
  return { errors, history, structures };
}

function inputSetProjection(context) {
  return context.reviewSet.manifest.fixedInputs.map((expected) => {
    const snapshot = context.snapshots.get(expected.absolutePath);
    invariant(snapshot, "input set projection is missing a snapshot", expected);
    return { role: expected.role, ...snapshot.binding };
  });
}

function inputSetDigest(rows) {
  return sha256(Buffer.from(`G4L10-V218-INPUT-SET\n${canonicalJson(rows)}\n`, "utf8"));
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
  add("sha256-known-answer", () => {
    if (sha256(Buffer.from("abc")) !== "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad") {
      throw new Error("SHA-256 known answer mismatch");
    }
  });
  add("receipt-domain", () => {
    const capability = "ab".repeat(32);
    const receipt = addReceiptMac("SELFTEST", { b: 2, a: 1 }, capability);
    if (!validReceiptMac("SELFTEST", receipt, capability)) throw new Error("receipt MAC did not validate");
  });
  add("closed-authority", () => {
    if (!Object.values(closedAuthority()).every((value) => value === false)) {
      throw new Error("authority effect opened");
    }
  });
  return checks;
}

async function runRetainedModuleWorker(bytes, timeoutMs, maxBuffer) {
  invariant(Buffer.isBuffer(bytes), "worker module input must be a retained Buffer");
  const dataUrl = `data:text/javascript;base64,${bytes.toString("base64")}`;
  const bootstrap = `const { parentPort } = require("node:worker_threads");\nimport(${JSON.stringify(dataUrl)}).then(() => parentPort.postMessage({ importResolved: true })).catch((error) => { process.stderr.write(String(error?.stack ?? error)); process.exitCode = 1; });\n`;
  const worker = new Worker(bootstrap, {
    eval: true,
    env: { ...SAFE_CHILD_ENV },
    execArgv: [],
    stdout: true,
    stderr: true,
  });
  let stdout = Buffer.alloc(0);
  let stderr = Buffer.alloc(0);
  let importResolved = false;
  let timedOut = false;
  let outputOverflow = false;
  const append = (current, chunk) => {
    const next = Buffer.concat([current, Buffer.from(chunk)]);
    if (next.length > maxBuffer) {
      outputOverflow = true;
      void worker.terminate();
      return current;
    }
    return next;
  };
  worker.stdout.on("data", (chunk) => { stdout = append(stdout, chunk); });
  worker.stderr.on("data", (chunk) => { stderr = append(stderr, chunk); });
  worker.on("message", (message) => {
    if (message?.importResolved === true) importResolved = true;
  });
  const result = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      timedOut = true;
      void worker.terminate();
    }, timeoutMs);
    worker.once("error", (error) => {
      clearTimeout(timer);
      reject(new MechanicalFailure("retained module worker failed", summarizeError(error)));
    });
    worker.once("exit", (exitCode) => {
      clearTimeout(timer);
      resolve({ exitCode });
    });
  });
  mechanicalInvariant(!timedOut, "retained module worker timed out", { timeoutMs });
  mechanicalInvariant(!outputOverflow, "retained module worker exceeded output limit", { maxBuffer });
  return {
    exitCode: result.exitCode,
    importResolved,
    stdout,
    stderr,
  };
}

export async function syntaxCheckBufferForTest(bytes) {
  const result = await runRetainedModuleWorker(bytes, 60000, 4 * 1024 * 1024);
  const ok = result.importResolved && result.exitCode === 0;
  return {
    ok,
    importResolved: result.importResolved,
    exitCode: result.exitCode,
    diagnosticSha256: ok
      ? null
      : sha256(Buffer.concat([result.stdout, Buffer.from("\n---STDERR---\n"), result.stderr])),
  };
}

function transformFocusedTest(verifierBytes, testBytes) {
  validateParserBufferBinding(verifierBytes.bytes, verifierBytes.binding);
  validateParserBufferBinding(testBytes.bytes, testBytes.binding);
  const needle = 'from "./g4-l10-native-helper-v2_18-review-verifier.mjs";';
  const source = decodeUtf8(testBytes.bytes);
  const occurrences = source.split(needle).length - 1;
  invariant(occurrences === 1, "focused test must contain exactly one exact verifier import", { occurrences });
  const dataUrl = `data:text/javascript;base64,${verifierBytes.bytes.toString("base64")}`;
  const transformed = Buffer.from(source.replace(needle, `from "${dataUrl}";`), "utf8");
  return { transformed, occurrences };
}

async function runFocusedTestsFromBuffers(verifierBytes, testBytes) {
  const { transformed, occurrences } = transformFocusedTest(verifierBytes, testBytes);
  const result = await runRetainedModuleWorker(transformed, 120000, 8 * 1024 * 1024);
  const stdout = result.stdout.toString("utf8");
  const stderr = result.stderr.toString("utf8");
  const count = (label) => {
    const match = stdout.match(new RegExp(`(?:^|\\n)ℹ ${label} ([0-9]+)(?:\\n|$)`, "u"));
    return match ? Number(match[1]) : null;
  };
  const testCount = count("tests");
  const passCount = count("pass");
  const failCount = count("fail");
  const cancelledCount = count("cancelled");
  const skippedCount = count("skipped");
  const todoCount = count("todo");
  const ok = result.importResolved
    && result.exitCode === 0
    && testCount === EXPECTED_FOCUSED_TEST_COUNT
    && passCount === EXPECTED_FOCUSED_TEST_COUNT
    && failCount === 0
    && cancelledCount === 0
    && skippedCount === 0
    && todoCount === 0;
  return {
    ok,
    syntaxOk: result.importResolved,
    exitCode: result.exitCode,
    verifierSha256: verifierBytes.binding.sha256,
    focusedTestSha256: testBytes.binding.sha256,
    transformedSha256: sha256(transformed),
    importSubstitutionCount: occurrences,
    expectedTestCount: EXPECTED_FOCUSED_TEST_COUNT,
    testCount,
    passCount,
    failCount,
    cancelledCount,
    skippedCount,
    todoCount,
    diagnosticSha256: ok
      ? null
      : sha256(Buffer.from(`${stdout}\n---STDERR---\n${stderr}`, "utf8")),
  };
}

export async function runFocusedTestSourcesForTest(verifierSource, focusedTestSource) {
  const verifierBytes = Buffer.from(verifierSource);
  const testBytes = Buffer.from(focusedTestSource);
  return runFocusedTestsFromBuffers(
    { bytes: verifierBytes, binding: { bytes: verifierBytes.length, sha256: sha256(verifierBytes) } },
    { bytes: testBytes, binding: { bytes: testBytes.length, sha256: sha256(testBytes) } },
  );
}

function reviewBindingFromReviewSet(options, reviewSet) {
  const { manifest, reviewer, snapshot } = reviewSet;
  return {
    manifestBindingVerified: true,
    phaseCapabilityVerified: true,
    ...localTaskAuthenticationState(),
    reviewSetManifestAbsolutePath: options.reviewSetManifest,
    reviewSetManifestSha256: snapshot.binding.sha256,
    reviewSetDigest: manifest.reviewSetDigest,
    sourceThreadId: manifest.sourceThreadId,
    userAuthorizationTurnId: manifest.userAuthorizationTurnId,
    userAuthorizationTextSha256: manifest.userAuthorizationTextSha256,
    reviewSetNonce: manifest.reviewSetNonce,
    orderedTaskIds: manifest.reviewers.map((row) => row.taskSystemId),
    scope: options.scope,
    reviewerTaskId: options.reviewerTaskId,
    reviewerTaskHostId: reviewer.taskHostId,
    reviewerNonce: reviewer.reviewerNonce,
  };
}

function reviewBinding(options, context) {
  return reviewBindingFromReviewSet(options, context.reviewSet);
}

function attachCapabilityBinding(error, binding, reservation) {
  if (error && typeof error === "object" && !error.capabilityReviewBinding) {
    error.capabilityReviewBinding = binding;
    error.capabilityOutputParentBinding = reservation?.parentAfter ?? null;
  }
  return error;
}

function phaseBindingFromReservation(options, context, reservation) {
  const phase = context.reviewSet.reviewer[options.command];
  return {
    phase: options.command,
    attemptOrdinal: phase.attemptOrdinal,
    successOutput: options.successOutput,
    errorOutput: options.errorOutput,
    outputParentBefore: reservation.parentBefore,
    outputParentAfter: reservation.parentAfter,
    expectedInventory: reservation.expectedInventory,
    reservedLeaves: [
      {
        disposition: "success",
        path: reservation.success.path,
        leaf: reservation.success.leaf,
        ...reservation.success.binding,
      },
      {
        disposition: "error",
        path: reservation.error.path,
        leaf: reservation.error.leaf,
        ...reservation.error.binding,
      },
    ],
  };
}

function validateReservedLeafShape(value, disposition, pathValue, label) {
  invariant(
    exactKeys(value, [
      "disposition",
      "path",
      "leaf",
      "bytes",
      "dev",
      "gid",
      "ino",
      "mode",
      "nlink",
      "sha256",
      "uid",
    ]),
    `${label} has unexpected fields`,
  );
  invariant(value.disposition === disposition, `${label}.disposition mismatch`);
  invariant(value.path === pathValue, `${label}.path mismatch`);
  invariant(value.leaf === path.basename(pathValue), `${label}.leaf mismatch`);
  invariant(value.bytes === 0, `${label}.bytes must be zero at reservation`);
  invariant(UINT.test(value.dev) && UINT.test(value.ino), `${label} device/inode invalid`);
  invariant(Number.isSafeInteger(value.uid) && value.uid >= 0, `${label}.uid invalid`);
  invariant(Number.isSafeInteger(value.gid) && value.gid >= 0, `${label}.gid invalid`);
  invariant(value.mode === "0600" && value.nlink === 1, `${label} custody invalid`);
  invariant(value.sha256 === sha256(Buffer.alloc(0)), `${label}.sha256 must bind the empty reservation`);
}

function validatePhaseBindingShape(value, reviewer, command) {
  invariant(
    exactKeys(value, [
      "phase",
      "attemptOrdinal",
      "successOutput",
      "errorOutput",
      "outputParentBefore",
      "outputParentAfter",
      "expectedInventory",
      "reservedLeaves",
    ]),
    "phaseBinding has unexpected fields",
  );
  const phase = reviewer[command];
  invariant(value.phase === command, "phaseBinding.phase mismatch");
  invariant(value.attemptOrdinal === phase.attemptOrdinal, "phaseBinding.attemptOrdinal mismatch");
  invariant(value.successOutput === phase.successOutput, "phaseBinding.successOutput mismatch");
  invariant(value.errorOutput === phase.errorOutput, "phaseBinding.errorOutput mismatch");
  validateOutputParentRow(value.outputParentBefore, "phaseBinding.outputParentBefore");
  validateOutputParentRow(value.outputParentAfter, "phaseBinding.outputParentAfter");
  invariant(Array.isArray(value.expectedInventory), "phaseBinding.expectedInventory must be an array");
  const expectedNames = [
    path.basename(phase.successOutput),
    path.basename(phase.errorOutput),
  ];
  if (command === "evidence") {
    expectedNames.push(
      path.basename(reviewer.preflight.successOutput),
      path.basename(reviewer.preflight.errorOutput),
    );
  }
  expectedNames.sort((a, b) => Buffer.from(a).compare(Buffer.from(b)));
  invariant(exactStringArray(value.expectedInventory, expectedNames), "phaseBinding.expectedInventory mismatch");
  invariant(Array.isArray(value.reservedLeaves) && value.reservedLeaves.length === 2, "phaseBinding.reservedLeaves must have two rows");
  validateReservedLeafShape(value.reservedLeaves[0], "success", phase.successOutput, "phaseBinding.reservedLeaves[0]");
  validateReservedLeafShape(value.reservedLeaves[1], "error", phase.errorOutput, "phaseBinding.reservedLeaves[1]");
  return true;
}

async function buildPreflightChecks(context) {
  const checks = [];
  const add = (id, ok, detail = undefined) => {
    checks.push(detail === undefined ? { id, ok } : { id, ok, detail });
  };
  add("startup:isolated-env-i", true, {
    execPath: process.execPath,
    execArgvCount: process.execArgv.length,
    environment: SAFE_CHILD_ENV,
  });
  add("platform-darwin", process.platform === "darwin", process.platform);
  const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
  add("node-major-at-least-24", Number.isInteger(nodeMajor) && nodeMajor >= 24, process.versions.node);
  for (const runtime of context.runtimeSnapshots) {
    add(`runtime-executable:${runtime.role}`, true, runtime.runtimeBinding);
  }
  for (const tool of REQUIRED_TOOLS) {
    try {
      await access(tool, fsConstants.X_OK);
      add(`tool-executable:${tool}`, true);
    } catch (error) {
      throw new MechanicalFailure(`required tool access failed: ${tool}`, summarizeError(error));
    }
  }
  const systemWriter = await verifySystemWriter();
  add("system-writer:exact-identity", true, systemWriter);
  const selfTests = embeddedSelfTests();
  for (const check of selfTests) add(`self-test:${check.id}`, check.ok, check.error);
  const verifierSnapshot = context.snapshots.get(SELF);
  const focusedTestSnapshot = context.snapshots.get(FOCUSED_TEST);
  invariant(verifierSnapshot && focusedTestSnapshot, "retained verifier or focused-test snapshot is absent");
  const verifierSyntax = await syntaxCheckBufferForTest(verifierSnapshot.bytes);
  const focusedTestExecution = await runFocusedTestsFromBuffers(verifierSnapshot, focusedTestSnapshot);
  const syntax = {
    verifier: verifierSyntax,
    focusedTest: {
      ok: focusedTestExecution.syntaxOk,
      importResolved: focusedTestExecution.syntaxOk,
      exitCode: focusedTestExecution.syntaxOk ? 0 : focusedTestExecution.exitCode,
      diagnosticSha256: focusedTestExecution.syntaxOk
        ? null
        : focusedTestExecution.diagnosticSha256,
    },
  };
  add("syntax:verifier", syntax.verifier.ok, syntax.verifier);
  add("syntax:focused-test", syntax.focusedTest.ok, syntax.focusedTest);
  add("focused-test:retained-buffer-execution", focusedTestExecution.ok, focusedTestExecution);
  const structural = structuralAssessment(context);
  for (const error of structural.errors) add(`structural:${error.id}`, false, error);
  return {
    checks,
    systemWriter,
    selfTests,
    syntax,
    focusedTestExecution,
    structural,
  };
}

async function buildPreflightReceipt(options, context, phaseBinding, capability) {
  const result = await buildPreflightChecks(context);
  const rows = inputSetProjection(context);
  const ready = result.checks.every((check) => check.ok);
  const status = ready
    ? "READY_FOR_FORMAL_EVIDENCE"
    : "PREFLIGHT_INPUT_MISMATCH_NO_VERDICT_NO_RETRY";
  return addReceiptMac("PREFLIGHT", {
    schemaVersion: 2,
    artifactType: "g4-l10-native-helper-v2-18-review-preflight",
    status,
    conclusion: "DIAGNOSTIC_ONLY_NOT_A_HUMAN_REVIEW_CONCLUSION",
    reviewBinding: reviewBinding(options, context),
    phaseBinding,
    canonicalRoot: context.reviewSet.manifest.canonicalRoot,
    runtimeExecutables: context.reviewSet.manifest.runtimeExecutables,
    inputSetDigest: inputSetDigest(rows),
    fixedInputs: rows,
    startupEnvironment: {
      execPath: process.execPath,
      execArgv: process.execArgv,
      environment: SAFE_CHILD_ENV,
    },
    syntax: result.syntax,
    focusedTestExecution: result.focusedTestExecution,
    systemWriter: result.systemWriter,
    selfTests: result.selfTests,
    checks: result.checks,
    retainedState: {
      v28OperationalFreeze: false,
      v28WritableFiles: 57,
      v28NativeMembers: 48,
      v28NonGateATopLevelRunners: 9,
      grade4MissingMp3: 16,
    },
    reviewerMustStillEvaluate: true,
    qualifyingReviewPass: false,
    authorityEffects: closedAuthority(),
  }, capability);
}

export function validateExactPreflightReceiptForTest(actual, expected, capability) {
  invariant(validReceiptMac("PREFLIGHT", actual, capability), "preflight receipt HMAC is invalid");
  invariant(
    canonicalJson(actual) === canonicalJson(expected),
    "preflight receipt differs from complete deterministic recomputation",
  );
  invariant(
    receiptBytes(actual).equals(receiptBytes(expected)),
    "preflight receipt physical bytes differ from complete deterministic recomputation",
  );
  return true;
}

async function assertPreflightFilesystemState(context, preflightValue, preflightSnapshot) {
  const reviewer = context.reviewSet.reviewer;
  validatePhaseBindingShape(preflightValue.phaseBinding, reviewer, "preflight");
  invariant(
    outputParentMatches(preflightValue.phaseBinding.outputParentBefore, reviewer.outputParent),
    "Phase A output parent prestate differs from manifest",
  );
  const custody = await openOutputCustody(
    reviewer.preflight.successOutput,
    preflightValue.phaseBinding.outputParentAfter,
  );
  try {
    const inspected = await inspectOutputParent(custody);
    attemptInvariant(
      exactStringArray(
        inspected.inventory,
        preflightValue.phaseBinding.expectedInventory,
      ),
      "Phase A output parent inventory no longer matches its terminal binding",
    );
    const successStat = await lstat(reviewer.preflight.successOutput, { bigint: true });
    const errorStat = await lstat(reviewer.preflight.errorOutput, { bigint: true });
    const successReservation = preflightValue.phaseBinding.reservedLeaves[0];
    const errorReservation = preflightValue.phaseBinding.reservedLeaves[1];
    attemptInvariant(
      successStat.isFile()
        && decimal(successStat.dev) === successReservation.dev
        && decimal(successStat.ino) === successReservation.ino
        && Number(successStat.uid) === successReservation.uid
        && Number(successStat.gid) === successReservation.gid
        && Number(successStat.nlink) === 1
        && portableMode(successStat) === "0600"
        && decimal(successStat.dev) === preflightSnapshot.binding.dev
        && decimal(successStat.ino) === preflightSnapshot.binding.ino,
      "Phase A success receipt no longer occupies its reserved inode",
    );
    attemptInvariant(
      errorStat.isFile()
        && decimal(errorStat.dev) === errorReservation.dev
        && decimal(errorStat.ino) === errorReservation.ino
        && Number(errorStat.uid) === errorReservation.uid
        && Number(errorStat.gid) === errorReservation.gid
        && Number(errorStat.nlink) === 1
        && portableMode(errorStat) === "0600"
        && Number(errorStat.size) === 0,
      "Phase A error sibling is not the exact unused zero-byte reservation",
    );
    attemptInvariant(
      outputParentMatches(inspected.binding, preflightValue.phaseBinding.outputParentAfter),
      "Phase A output parent binding no longer matches its terminal binding",
    );
  } finally {
    try {
      await custody.handle.close();
    } catch (error) {
      throw new MechanicalFailure("Phase A parent descriptor close failed", summarizeError(error));
    }
  }
}

async function prepareEvidencePrestate(options, context) {
  const reviewer = context.reviewSet.reviewer;
  authInvariant(
    options.preflightReceipt === reviewer.preflight.successOutput,
    "preflight receipt path differs from assigned Phase A success leaf",
  );
  const expectedPreflightCommitment = computeCapabilityCommitment({
    reviewSetNonce: context.reviewSet.manifest.reviewSetNonce,
    taskSystemId: reviewer.taskSystemId,
    taskHostId: reviewer.taskHostId,
    reviewerNonce: reviewer.reviewerNonce,
    scope: reviewer.scope,
    phase: "preflight",
    outputParent: reviewer.outputParent,
    successOutput: reviewer.preflight.successOutput,
    errorOutput: reviewer.preflight.errorOutput,
    capability: options.preflightCapability,
  });
  authInvariant(
    constantTimeHexEqual(
      expectedPreflightCommitment,
      reviewer.preflight.phaseCapabilityCommitment,
    ),
    "preflight capability does not match the assigned Phase A commitment",
  );

  const preflightSnapshot = await openOneSnapshot(options.preflightReceipt, null, {
    requireCanonicalPath: false,
  });
  let errorSiblingSnapshot = null;
  try {
    invariant(preflightSnapshot.binding.mode === "0600", "preflight receipt mode must be 0600");
    let preflightValue;
    try {
      preflightValue = JSON.parse(decodeUtf8(preflightSnapshot.bytes));
    } catch (error) {
      throw new EvidenceInputMismatch("preflight receipt is not valid UTF-8 JSON", summarizeError(error));
    }
    invariant(
      Buffer.from(`${JSON.stringify(sortedValue(preflightValue), null, 2)}\n`, "utf8")
        .equals(preflightSnapshot.bytes),
      "preflight receipt bytes are not canonical pretty JSON with final LF",
    );
    invariant(
      validReceiptMac("PREFLIGHT", preflightValue, options.preflightCapability),
      "preflight receipt HMAC is invalid",
    );
    invariant(
      preflightValue.status === "READY_FOR_FORMAL_EVIDENCE",
      "preflight status is not READY_FOR_FORMAL_EVIDENCE",
      { actual: preflightValue.status },
    );
    await assertPreflightFilesystemState(context, preflightValue, preflightSnapshot);
    try {
      errorSiblingSnapshot = await openOneSnapshot(reviewer.preflight.errorOutput, null, {
        requireCanonicalPath: false,
      });
    } catch (error) {
      if (error instanceof EvidenceInputMismatch) {
        throw new AttemptStateMismatch("Phase A error sibling could not enter retained zero-byte state", summarizeError(error));
      }
      throw error;
    }
    const errorReservation = preflightValue.phaseBinding.reservedLeaves[1];
    attemptInvariant(
      errorSiblingSnapshot.binding.dev === errorReservation.dev
        && errorSiblingSnapshot.binding.ino === errorReservation.ino
        && errorSiblingSnapshot.stable.uid === errorReservation.uid
        && errorSiblingSnapshot.stable.gid === errorReservation.gid
        && errorSiblingSnapshot.binding.mode === "0600"
        && errorSiblingSnapshot.binding.nlink === 1
        && errorSiblingSnapshot.binding.bytes === 0
        && errorSiblingSnapshot.binding.sha256 === sha256(Buffer.alloc(0)),
      "Phase A error sibling retained binding is not the exact unused reservation",
      { actual: errorSiblingSnapshot.binding, expected: errorReservation },
    );

    const preflightOptions = {
      ...options,
      command: "preflight",
      phaseCapability: options.preflightCapability,
      successOutput: reviewer.preflight.successOutput,
      errorOutput: reviewer.preflight.errorOutput,
      preflightCapability: null,
      preflightReceipt: null,
    };
    const expected = await buildPreflightReceipt(
      preflightOptions,
      context,
      preflightValue.phaseBinding,
      options.preflightCapability,
    );
    invariant(
      canonicalJson(expected) === canonicalJson(preflightValue),
      "Phase A receipt differs from complete deterministic Phase A recomputation",
      {
        expectedSha256: sha256(receiptBytes(expected)),
        actualSha256: sha256(preflightSnapshot.bytes),
      },
    );
    invariant(
      receiptBytes(expected).equals(preflightSnapshot.bytes),
      "Phase A receipt physical bytes differ from complete deterministic recomputation",
    );
    return {
      snapshot: preflightSnapshot,
      errorSiblingSnapshot,
      value: preflightValue,
      expectedParent: preflightValue.phaseBinding.outputParentAfter,
      expectedInventory: preflightValue.phaseBinding.expectedInventory,
      supportingPreflight: {
        absolutePath: options.preflightReceipt,
        bytes: preflightSnapshot.binding.bytes,
        sha256: preflightSnapshot.binding.sha256,
        receiptMac: preflightValue.receiptMac,
        completeDeterministicRecomputation: true,
      },
    };
  } catch (error) {
    if (errorSiblingSnapshot) {
      try {
        await errorSiblingSnapshot.handle.close();
      } catch {
        // The Phase A verification error remains primary.
      }
    }
    try {
      await preflightSnapshot.handle.close();
    } catch {
      // The Phase A verification error remains primary.
    }
    throw error;
  }
}

async function buildEvidenceReceipt(
  options,
  context,
  phaseBinding,
  capability,
  supportingPreflight,
) {
  const structural = structuralAssessment(context);
  const errors = [...structural.errors];
  const rows = inputSetProjection(context);
  const status = errors.length === 0
    ? "VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW"
    : "EVIDENCE_INPUT_MISMATCH";
  const scopeFocus = {
    schema: [
      "exact recursive schemas",
      "capability commitments and receipt HMAC",
      "parent ctime state transitions",
      "production grammar",
      "HMG4GL4",
      "HMG4AL3",
      "all 42 HMG4PE1 paragraphs",
      "HMG4FR3",
    ],
    adversarial: [
      "ADV-01 task capability and complete Phase A recomputation",
      "ADV-02 parent replacement deletion replay and two-leaf race",
      "ADV-03 retained fixed-input publication revalidation",
      "ADV-04 isolated Node and Python startup",
      "ADV-05 delayed local capability-bound state",
      "ADV-06 typed mechanical and evidence failures",
      "authority escape",
    ],
    whole: [
      "byte 1 through EOF",
      "full v2.18 through production lineage",
      "all structures and paragraphs",
      "retained exclusions",
      "no authority expansion",
    ],
  }[options.scope];
  return addReceiptMac("EVIDENCE", {
    schemaVersion: 2,
    artifactType: "g4-l10-native-helper-v2-18-deterministic-evidence",
    status,
    conclusion: "NOT_A_HUMAN_REVIEW_CONCLUSION",
    reviewBinding: reviewBinding(options, context),
    phaseBinding,
    scopeFocus,
    supportingPreflight,
    canonicalRoot: context.reviewSet.manifest.canonicalRoot,
    runtimeExecutables: context.reviewSet.manifest.runtimeExecutables,
    inputSetDigest: inputSetDigest(rows),
    fixedInputs: rows,
    history: {
      status: context.historyManifest.status ?? null,
      declaredArtifactCount: context.historyManifest.artifacts?.length ?? null,
      verifiedArtifactCount: structural.history.verifiedArtifactCount,
      newHMG4RB4BatchesAllowed: false,
    },
    structures: structural.structures,
    errors,
    reviewerMustStillEvaluate: true,
    qualifyingReviewPass: false,
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
    authorityEffects: closedAuthority(),
  }, capability);
}

function exitCodeForStatus(status) {
  if (
    status === "READY_FOR_FORMAL_EVIDENCE"
    || status === "VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW"
  ) return 0;
  if (
    status === "PREFLIGHT_INPUT_MISMATCH_NO_VERDICT_NO_RETRY"
    || status === "EVIDENCE_INPUT_MISMATCH"
  ) return 3;
  if (status === "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY") return 70;
  if (status === "UNAUTHENTICATED_INVOCATION_NO_VERDICT") return 77;
  if (status === "ATTEMPT_STATE_MISMATCH_NO_VERDICT_NO_RETRY") return 78;
  return 74;
}

export function exitCodeForStatusForTest(status) {
  return exitCodeForStatus(status);
}

export function validateCanonicalRootLiteral(candidate) {
  invariant(candidate === CANONICAL_ROOT, "canonical root literal mismatch", {
    expected: CANONICAL_ROOT,
    actual: candidate,
  });
  return true;
}

function errorReceiptFrom(options, context, reservation, error, status, attemptedReceipt = null) {
  const binding = reviewBinding(options, context);
  return addReceiptMac("ERROR", {
    schemaVersion: 2,
    artifactType: "g4-l10-native-helper-v2-18-verifier-error",
    status,
    command: options.command,
    scope: binding.scope,
    reviewerTaskId: binding.reviewerTaskId,
    reviewerTaskHostId: binding.reviewerTaskHostId,
    reviewerNonce: binding.reviewerNonce,
    reviewSetDigest: binding.reviewSetDigest,
    manifestBindingVerified: true,
    phaseCapabilityVerified: true,
    ...localTaskAuthenticationState(),
    phaseBinding: phaseBindingFromReservation(options, context, reservation),
    reviewSetManifestAbsolutePath: options.reviewSetManifest,
    reviewSetManifestSha256: binding.reviewSetManifestSha256,
    preflightReceiptAbsolutePath: options.preflightReceipt,
    successOutput: options.successOutput,
    errorOutput: options.errorOutput,
    attemptOrdinal: 1,
    exitCode: exitCodeForStatus(status),
    failedCandidateReceiptMac: attemptedReceipt?.receiptMac ?? null,
    evidenceConclusion: false,
    error: summarizeError(error),
    authorityEffects: closedAuthority(),
  }, options.phaseCapability);
}

function unpreservedDiagnostic(recovered, error, originalStatus, persistenceError = null) {
  const body = {
    schemaVersion: 2,
    artifactType: "g4-l10-native-helper-v2-18-unpreserved-diagnostic",
    status: "ATTEMPT_RECEIPT_UNPRESERVED_NO_VERDICT",
    originalStatus,
    exitCode: 74,
    ...localTaskAuthenticationState(),
    untrustedRecoveredCommand: recovered.command,
    untrustedRecoveredScope: recovered.scope,
    untrustedRecoveredReviewerTaskId: recovered.reviewerTaskId,
    untrustedRecoveredReviewSetManifest: recovered.reviewSetManifest,
    untrustedRecoveredReviewSetManifestSha256: recovered.reviewSetManifestSha256,
    untrustedRecoveredPreflightReceipt: recovered.preflightReceipt,
    untrustedRecoveredSuccessOutput: recovered.successOutput,
    untrustedRecoveredErrorOutput: recovered.errorOutput,
    evidenceConclusion: false,
    error: summarizeError(error),
    receiptPersistenceError: persistenceError ? summarizeError(persistenceError) : null,
    authorityEffects: closedAuthority(),
  };
  return {
    ...body,
    contentDigest: sha256(Buffer.from(`G4L10-V218-UNPRESERVED\n${canonicalJson(body)}\n`, "utf8")),
  };
}

async function closeEvidencePrestate(evidencePrestate) {
  if (!evidencePrestate) return;
  const failures = [];
  for (const key of ["errorSiblingSnapshot", "snapshot"]) {
    if (!evidencePrestate[key]) continue;
    try {
      await evidencePrestate[key].handle.close();
    } catch (error) {
      failures.push({ key, error: summarizeError(error) });
    }
    evidencePrestate[key] = null;
  }
  if (failures.length > 0) {
    throw new MechanicalFailure("retained Phase A descriptor close failed", failures);
  }
}

async function bestEffortCleanup(context, evidencePrestate, reservation) {
  const failures = [];
  if (evidencePrestate) {
    for (const key of ["errorSiblingSnapshot", "snapshot"]) {
      if (!evidencePrestate[key]) continue;
      try {
        await evidencePrestate[key].handle.close();
        evidencePrestate[key] = null;
      } catch (error) {
        failures.push({ key, error: summarizeError(error) });
      }
    }
  }
  if (context) {
    try {
      await context.close();
    } catch (error) {
      failures.push(summarizeError(error));
    }
  }
  if (reservation) {
    try {
      await closeAttemptReservation(reservation);
    } catch (error) {
      failures.push(summarizeError(error));
    }
  }
  return failures;
}

export async function cleanupFailureDiagnosticForTest(context, evidencePrestate, reservation) {
  const failures = await bestEffortCleanup(context, evidencePrestate, reservation);
  const recovered = {
    command: "preflight",
    scope: "schema",
    reviewerTaskId: "test-task",
    reviewSetManifest: "/tmp/test-manifest.json",
    reviewSetManifestSha256: "00".repeat(32),
    preflightReceipt: null,
    successOutput: "/tmp/test-success.json",
    errorOutput: "/tmp/test-error.json",
  };
  return {
    failures,
    diagnostic: unpreservedDiagnostic(
      recovered,
      new MechanicalFailure("injected primary failure"),
      "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY",
      failures.length > 0
        ? new MechanicalFailure("injected cleanup failure", failures)
        : null,
    ),
  };
}

async function executeCli(argv) {
  const recovered = recoverInvocation(argv);
  let options = null;
  let context = null;
  let evidencePrestate = null;
  let reservation = null;
  let attemptedReceipt = null;
  try {
    options = parseCli(argv);
    context = await collectInputContext(options);

    let expectedParent = context.reviewSet.reviewer.outputParent;
    let expectedInventory = [];
    if (options.command === "evidence") {
      evidencePrestate = await prepareEvidencePrestate(options, context);
      expectedParent = evidencePrestate.expectedParent;
      expectedInventory = evidencePrestate.expectedInventory;
    }

    reservation = await reserveAttemptLeaves(
      options.successOutput,
      options.errorOutput,
      expectedParent,
      expectedInventory,
    );
    const phaseBinding = phaseBindingFromReservation(options, context, reservation);

    attemptedReceipt = options.command === "preflight"
      ? await buildPreflightReceipt(
        options,
        context,
        phaseBinding,
        options.phaseCapability,
      )
      : await buildEvidenceReceipt(
        options,
        context,
        phaseBinding,
        options.phaseCapability,
        evidencePrestate.supportingPreflight,
      );

    const extraSnapshots = evidencePrestate
      ? [evidencePrestate.snapshot, evidencePrestate.errorSiblingSnapshot].filter(Boolean)
      : [];
    await context.revalidateAllInputs(extraSnapshots);
    await assertOutputParentStillHeld(reservation.custody, reservation.parentAfter);
    const inspectedBeforePublication = await inspectOutputParent(reservation.custody);
    attemptInvariant(
      exactStringArray(
        inspectedBeforePublication.inventory,
        reservation.expectedInventory,
      ),
      "attempt inventory drifted immediately before publication",
    );

    const ready = attemptedReceipt.status === "READY_FOR_FORMAL_EVIDENCE"
      || attemptedReceipt.status === "VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW";
    const output = ready ? options.successOutput : options.errorOutput;
    await writeReservedReceipt(reservation, output, attemptedReceipt);

    await context.revalidateAllInputs(extraSnapshots);
    await assertOutputParentStillHeld(reservation.custody, reservation.parentAfter);
    const inspectedAfterPublication = await inspectOutputParent(reservation.custody);
    attemptInvariant(
      exactStringArray(
        inspectedAfterPublication.inventory,
        reservation.expectedInventory,
      ),
      "attempt inventory drifted after publication",
    );

    await closeEvidencePrestate(evidencePrestate);
    await context.close();
    context = null;
    await closeAttemptReservation(reservation);
    reservation = null;

    process.stdout.write(receiptBytes(attemptedReceipt));
    process.exitCode = exitCodeForStatus(attemptedReceipt.status);
    return;
  } catch (error) {
    const status = classifyFailure(recovered.command, error);
    if (reservation && context && options) {
      attachCapabilityBinding(error, reviewBinding(options, context), reservation);
      const report = errorReceiptFrom(
        options,
        context,
        reservation,
        error,
        status,
        attemptedReceipt,
      );
      try {
        const destination = await chooseErrorReceiptDestination(reservation);
        await writeReservedReceipt(
          reservation,
          destination.path,
          report,
          { allowNonzeroSibling: destination.allowNonzeroSibling },
        );
        const cleanupFailures = await bestEffortCleanup(
          context,
          evidencePrestate,
          reservation,
        );
        context = null;
        reservation = null;
        if (cleanupFailures.length > 0) {
          const unpreserved = unpreservedDiagnostic(
            recovered,
            error,
            status,
            new MechanicalFailure(
              "error receipt was persisted but retained-state cleanup failed",
              cleanupFailures,
            ),
          );
          process.stdout.write(receiptBytes(unpreserved));
          process.exitCode = 74;
          return;
        }
        process.stdout.write(receiptBytes(report));
        process.exitCode = exitCodeForStatus(status);
        return;
      } catch (persistenceError) {
        const cleanupFailures = await bestEffortCleanup(
          context,
          evidencePrestate,
          reservation,
        );
        context = null;
        reservation = null;
        const unpreserved = unpreservedDiagnostic(
          recovered,
          error,
          status,
          new MechanicalFailure("error receipt persistence failed", {
            persistenceError: summarizeError(persistenceError),
            cleanupFailures,
          }),
        );
        process.stdout.write(receiptBytes(unpreserved));
        process.exitCode = 74;
        return;
      }
    }

    const cleanupFailures = await bestEffortCleanup(
      context,
      evidencePrestate,
      reservation,
    );
    const unpreserved = unpreservedDiagnostic(
      recovered,
      error,
      status,
      cleanupFailures.length > 0
        ? new MechanicalFailure("pre-authentication cleanup failed", cleanupFailures)
        : null,
    );
    process.stdout.write(receiptBytes(unpreserved));
    process.exitCode = 74;
  }
}

const invokedAsMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (invokedAsMain) {
  executeCli(process.argv.slice(2)).catch((error) => {
    const recovered = recoverInvocation(process.argv.slice(2));
    const fallback = unpreservedDiagnostic(
      recovered,
      error,
      "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY",
    );
    process.stdout.write(receiptBytes(fallback));
    process.exitCode = 74;
  });
}
