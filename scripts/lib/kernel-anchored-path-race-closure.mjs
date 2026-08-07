import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import * as fsPromises from "node:fs/promises";
import path from "node:path";

const PLAN_SCHEMA_VERSION = 1;
const SHA256 = /^[a-f0-9]{64}$/;
const DECIMAL_IDENTITY = /^(?:0|[1-9][0-9]*)$/;
const TRANSACTION_ID = /^[a-z0-9][a-z0-9._-]{15,199}$/;
const REQUIRED_NODE_DIRFD_OPERATIONS = Object.freeze([
  "fstatat",
  "linkat",
  "mkdirat",
  "openat",
  "renameat",
  "renameatx_np",
  "unlinkat",
]);
const ALLOWED_OPERATION_KINDS = new Set([
  "mkdir-no-replace",
  "publish-file-no-replace",
  "replace-file-cas",
  "unlink-owned-file",
]);

export const KERNEL_ANCHORED_PATH_RACE_CLOSURE_REQUIRED_CODE =
  "KERNEL_ANCHORED_PATH_RACE_CLOSURE_REQUIRED";
export const KERNEL_ANCHORED_PATH_RACE_CLOSURE_WRITES_ENABLED = false;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function canonicalJson(value) {
  return JSON.stringify(stable(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function blockedError(action) {
  const error = new Error(
    `${KERNEL_ANCHORED_PATH_RACE_CLOSURE_REQUIRED_CODE}: ${action} is disabled until a reviewed native dirfd helper, a true coverage compare-and-swap design, adversarial tests, and independent security review are bound`,
  );
  error.code = KERNEL_ANCHORED_PATH_RACE_CLOSURE_REQUIRED_CODE;
  return error;
}

function portableRelativePath(value, label) {
  invariant(typeof value === "string" && value.length > 0, `${label} must be a non-empty path`);
  invariant(!value.includes("\0") && !value.includes("\\") && !path.posix.isAbsolute(value), `${label} must be a portable relative path`);
  invariant(value.normalize("NFKC") === value, `${label} must already be NFKC-normalized`);
  const components = value.split("/");
  invariant(
    components.every((component) => component.length > 0 && component !== "." && component !== ".."),
    `${label} contains an empty, dot, or parent component`,
  );
  invariant(path.posix.normalize(value) === value, `${label} must already be normalized`);
  invariant(components[0] !== "source-assets", `${label} cannot target source-assets`);
  return value;
}

function privateCanonicalRootPath(value) {
  invariant(typeof value === "string" && path.isAbsolute(value), "canonicalRootPath must be absolute");
  invariant(
    !value.includes("\0") && value.normalize("NFKC") === value && path.normalize(value) === value && path.resolve(value) === value,
    "canonicalRootPath must already be normalized and NFKC-stable",
  );
  invariant(value !== path.parse(value).root, "canonicalRootPath cannot be a filesystem root");
  const components = value.slice(path.parse(value).root.length).split(path.sep).filter(Boolean);
  invariant(!components.includes("source-assets"), "canonicalRootPath cannot be source-assets or a source-assets descendant");
  return value;
}

function permissionMode(value, label) {
  invariant(Number.isInteger(value) && value >= 0 && value <= 0o777, `${label} must be an integer permission mode`);
  return value;
}

function byteDescriptor(value, label, {withIdentity = false} = {}) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  invariant(SHA256.test(value.sha256 || ""), `${label}.sha256 must be a lowercase SHA-256`);
  invariant(Number.isSafeInteger(value.size) && value.size >= 0, `${label}.size must be a non-negative safe integer`);
  const result = {
    sha256: value.sha256,
    size: value.size,
    mode: permissionMode(value.mode, `${label}.mode`),
  };
  if (withIdentity) {
    invariant(DECIMAL_IDENTITY.test(value.device || ""), `${label}.device must be a decimal device identifier`);
    invariant(DECIMAL_IDENTITY.test(value.inode || ""), `${label}.inode must be a decimal inode identifier`);
    result.device = value.device;
    result.inode = value.inode;
  }
  return result;
}

function normalizeOperation(value, index) {
  const label = `operations[${index}]`;
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  invariant(ALLOWED_OPERATION_KINDS.has(value.kind), `${label}.kind is unsupported`);
  const operation = {
    ordinal: index + 1,
    kind: value.kind,
    relativePath: portableRelativePath(value.relativePath, `${label}.relativePath`),
  };
  if (value.kind === "mkdir-no-replace") {
    operation.mode = permissionMode(value.mode, `${label}.mode`);
  } else if (value.kind === "publish-file-no-replace") {
    operation.content = byteDescriptor(value.content, `${label}.content`);
  } else if (value.kind === "replace-file-cas") {
    operation.expected = byteDescriptor(value.expected, `${label}.expected`, {withIdentity: true});
    operation.replacement = byteDescriptor(value.replacement, `${label}.replacement`);
    invariant(
      operation.expected.sha256 !== operation.replacement.sha256,
      `${label} replacement must differ from the expected bytes`,
    );
  } else {
    operation.expected = byteDescriptor(value.expected, `${label}.expected`, {withIdentity: true});
  }
  return operation;
}

function blockers() {
  return [
    {
      code: "NODE_DIRFD_RELATIVE_MUTATION_API_UNAVAILABLE",
      requirement:
        "The public Node.js fs API must not be used as a pathname fallback. It does not expose openat, mkdirat, fstatat, linkat, renameatx_np, or unlinkat operations relative to pinned directory descriptors.",
    },
    {
      code: "REVIEWED_NATIVE_DIRFD_HELPER_REQUIRED",
      requirement:
        "Bind a separately reviewed and hash-pinned native helper or native addon that keeps root and ancestor directory descriptors open and performs every lookup and mutation relative to those descriptors with all-component no-symlink and beneath-root enforcement.",
    },
    {
      code: "KERNEL_CONDITIONAL_COVERAGE_CAS_UNAVAILABLE",
      requirement:
        "Provide a kernel-linearizable conditional replacement of coverage bound to the expected destination inode and bytes, or redesign coverage as immutable content-addressed no-replace versions behind a separately reviewed commit protocol. rename swap followed by inspection is not CAS because a failed operation becomes transiently visible and rollback can overwrite an independent writer.",
    },
    {
      code: "ADVERSARIAL_E2E_AND_INDEPENDENT_REVIEW_REQUIRED",
      requirement:
        "Prove ancestor replacement, real-directory substitution, symlink insertion, destination replacement, crash recovery, and concurrent-writer negatives against the exact production helper and filesystem, then complete independent security review.",
    },
  ];
}

/**
 * Reports the current public Node surface without treating platform kernel APIs
 * as callable capabilities. This is a fail-closed detector, not an authorizer.
 */
export function inspectKernelAnchoredPathRaceClosure() {
  const exportedPromiseMethods = Object.keys(fsPromises).sort();
  const exposedDirfdOperations = REQUIRED_NODE_DIRFD_OPERATIONS.filter(
    (name) => typeof fsPromises[name] === "function",
  );
  const missingDirfdOperations = REQUIRED_NODE_DIRFD_OPERATIONS.filter(
    (name) => !exposedDirfdOperations.includes(name),
  );
  return deepFreeze({
    schemaVersion: 1,
    reportType: "kernel-anchored-path-race-closure-capability",
    authority: "acceptance-neutral-fail-closed-machine-diagnostic",
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
    },
    publicNodeSurface: {
      exportedPromiseMethods,
      exposedDirfdOperations,
      missingDirfdOperations,
      leafFlags: {
        oDirectory: Number.isInteger(fsConstants.O_DIRECTORY),
        oExclusiveCreate: Number.isInteger(fsConstants.O_EXCL),
        oNoFollowFinalComponent: Number.isInteger(fsConstants.O_NOFOLLOW),
        oNoFollowAnyExposed: Number.isInteger(fsConstants.O_NOFOLLOW_ANY),
        oResolveBeneathExposed: Number.isInteger(fsConstants.O_RESOLVE_BENEATH),
      },
      pathnameFallbackPermitted: false,
    },
    darwinNativeContractCandidate: {
      applicable: process.platform === "darwin",
      callableFromCurrentPublicNodeSurface: false,
      requiredApis: ["openat", "fstatat", "mkdirat", "linkat", "renameatx_np", "unlinkat", "fsync"],
      requiredResolutionControls: [
        "O_NOFOLLOW_ANY",
        "O_RESOLVE_BENEATH",
        "AT_SYMLINK_NOFOLLOW_ANY",
        "AT_RESOLVE_BENEATH",
        "RENAME_NOFOLLOW_ANY",
        "RENAME_RESOLVE_BENEATH",
        "RENAME_EXCL",
      ],
      note:
        "These are requirements for a future reviewed native implementation, not capabilities granted by this JavaScript module.",
    },
    coverageCas: {
      kernelConditionalDestinationIdentityReplaceAvailable: false,
      renameSwapThenInspectAccepted: false,
      reason:
        "Swap-then-inspect exposes replacement bytes before the expected destination identity is known and cannot safely roll back over an independent concurrent writer.",
      acceptableFutureDirections: [
        "reviewed-kernel-conditional-destination-identity-cas",
        "immutable-content-addressed-coverage-versions-with-no-replace-commit",
        "trusted-single-writer-broker-with-all-readers-bound-to-its-commit-log",
      ],
    },
    blockers: blockers(),
    productionReady: false,
    productionWritesEnabled: KERNEL_ANCHORED_PATH_RACE_CLOSURE_WRITES_ENABLED,
    publicArtifactBoundary: {
      absoluteRootPathPermittedInPublicReportOrReceipt: false,
      operationPlanDisposition: "private-local-transaction-input-only",
    },
    strictAcceptanceEffect: "none",
  });
}

/**
 * Builds a deterministic, write-free descriptor for the operations a future
 * native engine would have to perform. It cannot be executed by this module.
 */
export function createKernelAnchoredPathRaceClosurePlan({
  transactionId,
  canonicalRootPath,
  rootIdentity,
  operations,
}) {
  invariant(TRANSACTION_ID.test(transactionId || ""), "transactionId must be a 16-200 character lowercase path-free identifier");
  const privateRoot = privateCanonicalRootPath(canonicalRootPath);
  invariant(rootIdentity && typeof rootIdentity === "object" && !Array.isArray(rootIdentity), "rootIdentity must be an object");
  invariant(DECIMAL_IDENTITY.test(rootIdentity.device || ""), "rootIdentity.device must be a decimal device identifier");
  invariant(DECIMAL_IDENTITY.test(rootIdentity.inode || ""), "rootIdentity.inode must be a decimal inode identifier");
  invariant(Array.isArray(operations) && operations.length > 0, "operations must be a non-empty array");
  const normalizedOperations = operations.map(normalizeOperation);
  const paths = normalizedOperations.map(({relativePath}) => relativePath);
  invariant(new Set(paths).size === paths.length, "operations must not target the same relative path twice");
  const descriptorWithoutHash = {
    schemaVersion: PLAN_SCHEMA_VERSION,
    artifactType: "kernel-anchored-path-race-closure-operation-plan",
    transactionId,
    root: {
      canonicalPath: privateRoot,
      device: rootIdentity.device,
      inode: rootIdentity.inode,
    },
    privacy: {
      disposition: "private-local-transaction-input-only",
      containsWorkstationAbsolutePath: true,
      publicReportOrReceiptEligible: false,
    },
    operations: normalizedOperations,
    requiredExecutionEngine: "reviewed-native-dirfd-helper-with-true-coverage-cas",
    executionEnabled: false,
    productionPromotionEnabled: false,
    acceptanceEffect: "none",
    blockers: blockers(),
  };
  const planSha256 = sha256(Buffer.from(canonicalJson(descriptorWithoutHash)));
  return deepFreeze(clone({...descriptorWithoutHash, planSha256}));
}

export function assertKernelAnchoredPathRaceClosureAvailable() {
  throw blockedError("kernel-anchored path transaction execution");
}

/** Production execution is intentionally impossible in this foundation. */
export async function executeKernelAnchoredPathRaceClosureTransaction() {
  throw blockedError("kernel-anchored path transaction execution");
}

/** Recovery mutates paths too and remains behind the same unconditional fuse. */
export async function recoverKernelAnchoredPathRaceClosureTransaction() {
  throw blockedError("kernel-anchored path transaction recovery");
}
