#!/usr/bin/env node

import { createHash, randomBytes } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildExpectedPendingCoverageDocuments,
  TS006_ANIMATION_ID,
  TS006_SCENARIOS,
} from "./materialize-g4-l3-valid-pending-root-coverage.mjs";
import { validateMaterializationReceipt } from "./materialize-g4-l3-workspace-inventories.mjs";
import {
  acquireWave2bLock,
  adoptWave2bLockForRecovery,
  applyWave2bCasBatch,
  recoverWave2bCasBatch,
  releaseWave2bLock,
} from "./rebind-g4-l3-source-static-source-audits-wave2b-cas.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const WORKSPACE = `migrations/${TS006_ANIMATION_ID}`;
const MIGRATION_PATH = `${WORKSPACE}/migration.json`;
const COVERAGE_PATH = `${WORKSPACE}/evidence/full-frame-coverage.json`;
const ASSET_INVENTORY_PATH = `${WORKSPACE}/asset-inventory.csv`;
const INVENTORY_OBSERVER_RECEIPT_PATH = `${WORKSPACE}/audit/machine/g4-l3-inventory-materialization.json`;
const BRIEF_PATH = `${WORKSPACE}/MIGRATION_BRIEF.md`;
const REPORT_PATH =
  "reports/g4-l3-ts006-current-javascript-workspace-binding.json";
const MARKDOWN_PATH =
  "reports/g4-l3-ts006-current-javascript-workspace-binding.md";
const RELEASE_PATH = "catalog/lesson-releases.json";
const COMPLETION_LEDGER_PATH = "catalog/completion-ledger.json";
const LESSON_RELEASE_LEDGER_PATH = "catalog/lesson-release-ledger.json";
const SOURCE_AUDIT_PATH = `${WORKSPACE}/audit/machine/g4-l3-source-audit.json`;
const STANDARD_MACHINE_AUDIT_PATH = `${WORKSPACE}/audit/machine/report.json`;
const AUTHORING_INDEX_PATH = "reports/g4-l3-animate-authoring-audit-index.json";
const CANDIDATE_REPORT_PATH =
  "reports/g4-l3-ts006-current-javascript-candidate.json";
const PACKAGE_LOCK_PATH = "package-lock.json";
const PENDING_COVERAGE_GENERATOR_PATH =
  "scripts/materialize-g4-l3-valid-pending-root-coverage.mjs";
const MODULE_PATH = `packages/demos/src/modules/${TS006_ANIMATION_ID}.tsx`;
const TIMELINE_PATH = `packages/demos/src/timelines/${TS006_ANIMATION_ID}.ts`;
const HELPER_PATH = "packages/demos/src/source-static-canvas-candidate.tsx";
const IMPLEMENTATION_ROUTE_FILE =
  "apps/web/app/[locale]/animations/[animationId]/page.tsx";
const REFERENCE_ROUTE_FILE =
  "apps/web/app/[locale]/reference/[animationId]/page.tsx";
const IMPLEMENTATION_TEST_PATH =
  "packages/demos/tests/course-g04-l03-ts-006.test.ts";
const CANDIDATE_GENERATOR_TEST_PATH =
  "scripts/build-g4-l3-ts006-current-js-candidate.test.mjs";
const PRODUCT_RUNTIME_PATH = "apps/web/components/animation-runtime.tsx";
const RUNTIME_CONTRACT_PATH = "packages/demos/src/contract.ts";
const RUNTIME_HELPERS_PATH = "packages/demos/src/runtime.ts";
const SPANISH_AUDIO_QA_GENERATOR_PATH =
  "scripts/qa-ts006-spanish-host-audio.mjs";
const SPANISH_AUDIO_QA_TEST_PATH =
  "scripts/qa-ts006-spanish-host-audio.test.mjs";
const SPANISH_AUDIO_PRODUCT_QA_PATH = `${WORKSPACE}/evidence/spanish-host-audio-current-js-product-qa.json`;
const PUBLIC_SPANISH_AUDIO_PATH =
  "public/flash-assets/audio/courses/course-g04-l03-ts-006/es.mp3";
const PUBLIC_AUDIO_MANIFEST_PATH =
  "public/flash-assets/audio/courses/manifest.json";
const REFRESH_PREIMAGE_ROOT =
  "work/g4-l3-v2-ts006-current-js-binding-refresh-preimages";
const INVENTORY_RECONCILIATION_RECEIPT_ROOT =
  "reports/g4-l3-ts006-current-javascript-asset-inventory-reconciliations";
const WAVE2B_CAS_ENGINE_PATH =
  "scripts/rebind-g4-l3-source-static-source-audits-wave2b-cas.mjs";
const OBSERVER_SUCCESSOR_TRANSITION_ID =
  "v17-ts006-inventory-observer-successor-receipt-only-rebind-2026-07-27";
const PROTECTED_PIN_PATHS = Object.freeze([
  "reports/current-javascript-output-human-approval.json",
  "reports/pilot-owner-review-packet.json",
  "reports/pilot-strict-acceptance.json",
  "reports/vb004-semantic-review-packet.json",
  "catalog/source-manifest.sha256",
  ".gitignore",
  ".vercelignore",
]);
const GLOBAL_INVENTORY_REFRESH_TRANSITION = Object.freeze({
  transactionId:
    "78d34420595778c22dd614f2d3e672f19ec2839484cd04703b2f173279717ae5",
  transactionRoot:
    "work/g4-l3-workspace-inventory-refresh-preimages/transactions/78d34420595778c22dd614f2d3e672f19ec2839484cd04703b2f173279717ae5",
  plan: Object.freeze({
    path: "work/g4-l3-workspace-inventory-refresh-preimages/transactions/78d34420595778c22dd614f2d3e672f19ec2839484cd04703b2f173279717ae5/plan.json",
    bytes: 180596,
    sha256: "8afa9e0a15169489cc65b0054ac83cc84189fecb82b7ed9d6562faf8c679a359",
  }),
  receipt: Object.freeze({
    path: "work/g4-l3-workspace-inventory-refresh-preimages/transactions/78d34420595778c22dd614f2d3e672f19ec2839484cd04703b2f173279717ae5/receipt.json",
    bytes: 1607,
    sha256: "8765b6b7c5c6a952eca0c8f53fd986df163739eb035996e928539f48601fc6b9",
  }),
  preimageArchiveRoot:
    "work/g4-l3-workspace-inventory-refresh-preimages/sets/77b8e14a14cead5b7c54b1d2a93aa50959c044424473e626de7ebe8bfaddf704",
  preimageArchiveManifest: Object.freeze({
    path: "work/g4-l3-workspace-inventory-refresh-preimages/sets/77b8e14a14cead5b7c54b1d2a93aa50959c044424473e626de7ebe8bfaddf704/manifest.json",
    bytes: 26575,
    sha256: "41c8dd7515fa74f415cd70d12d20006bbf6d6c19a6735138dfabf5d6373192d6",
  }),
  observerPreimage: Object.freeze({
    path: "work/g4-l3-workspace-inventory-refresh-preimages/sets/77b8e14a14cead5b7c54b1d2a93aa50959c044424473e626de7ebe8bfaddf704/files/migrations/course-g04-l03-ts-006/audit/machine/g4-l3-inventory-materialization.json",
    bytes: 5807,
    sha256: "03f51053974d2a7418d3bf7d28251c4a21fb4f91bffe152e27b6e9186919b49f",
  }),
  observerPostimage: Object.freeze({
    path: INVENTORY_OBSERVER_RECEIPT_PATH,
    bytes: 5807,
    sha256: "547a5fbd15958e9dde25e0f447ba509b200271b333e5c494eacf24cc31f2d5b8",
  }),
  canonicalAssetInventory: Object.freeze({
    path: ASSET_INVENTORY_PATH,
    bytes: 1470,
    sha256: "c65960d0ef5abeac6a7853dcdcc4c1c94e08a5adf6a89ee3b4aa96e9d3488a76",
  }),
});
const EXPECTED_INVENTORY_RECONCILIATION_TRANSITION = Object.freeze({
  transitionId: "v16-progress-inverse-gamma-current-js-rebind-2026-07-27",
  observerReceiptSha256:
    "547a5fbd15958e9dde25e0f447ba509b200271b333e5c494eacf24cc31f2d5b8",
  observerAssetInventorySha256:
    "c65960d0ef5abeac6a7853dcdcc4c1c94e08a5adf6a89ee3b4aa96e9d3488a76",
  currentWorkspaceReportSha256:
    "cca3b07fe65d4b024671dcef27641a2c1115b7ccabcf9e87e62a8a121f72ba6c",
  currentCandidateReportSha256:
    "3cbda00327043171a3cf766e39dd92d513d6636fefa42c1a6e6eda86443fdd1c",
  currentCandidateFingerprintSha256:
    "ed73fa45f5dc78675c2fa0d0c4fac33633fda7b37db85bc3044f651c0073a6b8",
  currentAssetManifestSha256:
    "eea637df94f8c7e9ba149138bcf05426e4f8fec1fc894e2703dc4a9b39a626a0",
  currentAssetInventorySha256:
    "c65960d0ef5abeac6a7853dcdcc4c1c94e08a5adf6a89ee3b4aa96e9d3488a76",
  nextAssetInventorySha256:
    "916210a15c8e293d9de89b9e2f0c1ad725d411f43ebc4873084fdb2265ed90e7",
});
const EXPECTED_OBSERVER_SUCCESSOR_REBIND = Object.freeze({
  transitionId: OBSERVER_SUCCESSOR_TRANSITION_ID,
  predecessorGenerator: Object.freeze({
    path:
      "scripts/materialize-g4-l3-ts006-current-js-workspace-binding.mjs",
    bytes: 91370,
    sha256: "11e5736de23a49715b57850b0c35d952e81919e1b8a4dcc1affa469420f88b4b",
  }),
  predecessorWorkspaceReport: Object.freeze({
    path: REPORT_PATH,
    bytes: 53181,
    sha256: "382e7be372e517ee987a626982df901853ed6a9533014d3cade89b9a4f09227b",
  }),
  predecessorWorkspaceMarkdown: Object.freeze({
    path: MARKDOWN_PATH,
    bytes: 1172,
    sha256: "6fb2bf170c060d354c82d1e9b297ff361cc6a3f547e8d0d822ddc45eb4b09e83",
  }),
  predecessorImmutableReceipt: Object.freeze({
    path:
      `${INVENTORY_RECONCILIATION_RECEIPT_ROOT}/` +
      "d8b7ccfbd9c6ed481cd29d7ee1a18b9d310a14c585a811326abba0bcca099fcb.json",
    bytes: 16596,
    sha256: "14ff58b24687d1db45b50839e01c688a59091f9da8ce137a75fa7abf4f931e69",
    receiptFingerprintSha256:
      "d8b7ccfbd9c6ed481cd29d7ee1a18b9d310a14c585a811326abba0bcca099fcb",
  }),
  predecessorObserverReceipt: Object.freeze({
    path: INVENTORY_OBSERVER_RECEIPT_PATH,
    bytes: 5807,
    sha256: "547a5fbd15958e9dde25e0f447ba509b200271b333e5c494eacf24cc31f2d5b8",
  }),
  currentObserverReceipt: Object.freeze({
    path: INVENTORY_OBSERVER_RECEIPT_PATH,
    bytes: 5807,
    sha256: "634e38a63df445b112e9b90969f95b2dcc50b80089a142c5d0b5f305f531cd28",
  }),
  workspaceDocuments: Object.freeze({
    migrationJson: Object.freeze({
      path: MIGRATION_PATH,
      bytes: 14053,
      sha256: "c065a67ddd72f5426ff3f71fa7ee92db7f5e06bb77dd8801ee0206d57b486590",
    }),
    fullFrameCoverage: Object.freeze({
      path: COVERAGE_PATH,
      bytes: 11080,
      sha256: "fc8608080a7a2a0af3dd46dfcd9419eda4f9a787f75e25316ae89bf386124b3f",
    }),
    assetInventory: Object.freeze({
      path: ASSET_INVENTORY_PATH,
      bytes: 1470,
      sha256: "916210a15c8e293d9de89b9e2f0c1ad725d411f43ebc4873084fdb2265ed90e7",
    }),
    migrationBrief: Object.freeze({
      path: BRIEF_PATH,
      bytes: 5186,
      sha256: "2f0db31abd77e6d5c156a8cbd96bc2332ee5b24f43f0bc82a8d5f7358a68607b",
    }),
  }),
  ledgers: Object.freeze({
    completion: Object.freeze({
      path: COMPLETION_LEDGER_PATH,
      bytes: 64286,
      sha256: "f0e070446e76d1201120dbf2f0c269ffeb3d71d8c18e9e215e7b64628d6f9647",
    }),
    lessonRelease: Object.freeze({
      path: LESSON_RELEASE_LEDGER_PATH,
      bytes: 49048,
      sha256: "699cc335e7e232c7e186cab7c0ba0027b582e3cd10962061dc1f60d372a1f155",
    }),
    releaseDeclaration: Object.freeze({
      path: RELEASE_PATH,
      bytes: 54579,
      sha256: "ab0ad5dac373f7bf192b603c4c2b0bc4dae9f73fe770eba3be7507d458bfc375",
    }),
  }),
  protectedPins: Object.freeze({
    currentJavascriptOutputHumanApproval: Object.freeze({
      path: "reports/current-javascript-output-human-approval.json",
      bytes: 3375444,
      sha256: "7f291bd72cf2a9c35cdb7d7fcbd3b52c1e3b88ec1e31e66e776b909e9c01cc5c",
    }),
    pilotOwnerReviewPacket: Object.freeze({
      path: "reports/pilot-owner-review-packet.json",
      bytes: 2237959,
      sha256: "79cde06c3447bed8792934c20e7bae2bc86a8ec2345b682fc37b3e3150e2ba62",
    }),
    pilotStrictAcceptance: Object.freeze({
      path: "reports/pilot-strict-acceptance.json",
      bytes: 878503,
      sha256: "dbd0ddcab28be5faf278c3d6bae7be59e5afa403e6c7dbfb77aaecf946875d39",
    }),
    vb004SemanticReviewPacket: Object.freeze({
      path: "reports/vb004-semantic-review-packet.json",
      bytes: 23325,
      sha256: "90cf63d2ee4eaf77c785df17752406b258aa79209f8c4fd18bb8d9719fff32a7",
    }),
    sourceManifest: Object.freeze({
      path: "catalog/source-manifest.sha256",
      bytes: 831011,
      sha256: "a9625fb4a99e026fea09e4a1929edc2fa9d47ccf6cdbca7de4ba9ca75adf211e",
    }),
    gitignore: Object.freeze({
      path: ".gitignore",
      bytes: 998,
      sha256: "6370bf2fa40eb4028e0d08cd11b1072b8de87b82ff51672fa5054828b53e3598",
    }),
    vercelignore: Object.freeze({
      path: ".vercelignore",
      bytes: 791,
      sha256: "a74757080ee9cfaeec0ba37691401c7cb0386839c7d3efba51f4ba7fe40cd939",
    }),
  }),
});
const ASSET_HEADER = [
  "asset_id",
  "swf_character_id",
  "library_symbol",
  "type",
  "source_file",
  "source_frame",
  "exported_file",
  "sha256",
  "format",
  "dimensions_or_bounds",
  "font_glyphs",
  "transformation",
  "confidence",
  "license_or_provenance",
  "notes",
];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

export function validateNormalizedProjectRelativePath(
  value,
  { label = "path", requiredPrefix = null } = {},
) {
  invariant(
    typeof value === "string" &&
      value.length > 0 &&
      !path.isAbsolute(value) &&
      portable(path.normalize(value)) === value &&
      value !== ".." &&
      !value.startsWith("../") &&
      !value.includes("/../") &&
      !value.includes("\0") &&
      (requiredPrefix === null ||
        value === requiredPrefix ||
        value.startsWith(`${requiredPrefix}/`)),
    `TS006 ${label} is not a normalized allowlisted project-relative path`,
  );
  return value;
}

function relative(file) {
  const value = portable(path.relative(ROOT, file));
  return validateNormalizedProjectRelativePath(value, {
    label: `${file} relative path`,
  });
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function parseCsvRows(bytes) {
  invariant(Buffer.isBuffer(bytes), "TS006 CSV input must be bytes");
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const text = bytes.toString("utf8");
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      invariant(cell.length === 0, "TS006 CSV quote starts inside a field");
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (character !== "\r") {
      cell += character;
    }
  }
  invariant(
    !quoted && row.length === 0 && cell.length === 0,
    "TS006 CSV is unterminated or lacks its final newline",
  );
  return rows;
}

export function assetInventorySemanticFields(bytes) {
  const rows = parseCsvRows(bytes);
  invariant(
    rows.length === 3 &&
      rows[0].length === ASSET_HEADER.length &&
      pretty(rows[0]) === pretty(ASSET_HEADER) &&
      rows.slice(1).every((row) => row.length === ASSET_HEADER.length),
    "TS006 asset inventory schema or exact two-row scope drifted",
  );
  return {
    schema: ASSET_HEADER,
    records: rows
      .slice(1)
      .map((row) =>
        Object.fromEntries(
          ASSET_HEADER.map((field, index) => [field, row[index]]),
        ),
      ),
  };
}

function bindingWithoutStat(binding) {
  return (
    binding && {
      path: binding.path,
      bytes: binding.bytes,
      sha256: binding.sha256,
    }
  );
}

function sameBinding(left, right) {
  return pretty(bindingWithoutStat(left)) === pretty(bindingWithoutStat(right));
}

function sameBindingContent(left, right) {
  return left?.bytes === right?.bytes && left?.sha256 === right?.sha256;
}

async function readImmutableEvidence(binding, requiredPrefix) {
  validateNormalizedProjectRelativePath(binding.path, {
    label: "immutable evidence path",
    requiredPrefix,
  });
  const absoluteAllowedRoot = path.resolve(ROOT, requiredPrefix);
  const absoluteTarget = path.resolve(ROOT, binding.path);
  invariant(
    portable(path.relative(ROOT, absoluteTarget)) === binding.path,
    "TS006 immutable evidence path escaped the project root",
  );
  const [allowedRealpath, targetRealpath, metadata] = await Promise.all([
    realpath(absoluteAllowedRoot),
    realpath(absoluteTarget),
    lstat(absoluteTarget),
  ]);
  invariant(
    targetRealpath.startsWith(`${allowedRealpath}${path.sep}`) &&
      metadata.isFile() &&
      !metadata.isSymbolicLink() &&
      metadata.nlink === 1 &&
      (metadata.mode & 0o777) === 0o444,
    "TS006 immutable evidence is not a no-link 0444 file inside its allowlist",
  );
  const bytes = await readFile(absoluteTarget);
  invariant(
    bytes.length === binding.bytes && sha256(bytes) === binding.sha256,
    `TS006 immutable evidence bytes drifted: ${binding.path}`,
  );
  return { bytes, value: JSON.parse(bytes), binding };
}

function semanticLeafChanges(before, after, prefix = "") {
  if (
    before &&
    after &&
    typeof before === "object" &&
    typeof after === "object" &&
    !Array.isArray(before) &&
    !Array.isArray(after)
  ) {
    const keys = [
      ...new Set([...Object.keys(before), ...Object.keys(after)]),
    ].sort();
    return keys.flatMap((key) =>
      semanticLeafChanges(before[key], after[key], `${prefix}/${key}`),
    );
  }
  if (pretty(before) === pretty(after)) return [];
  return [{ path: prefix, before, after }];
}

async function readBinding(relativePath) {
  const bytes = await readFile(path.join(ROOT, relativePath));
  return { path: relativePath, bytes: bytes.length, sha256: sha256(bytes) };
}

async function readDocument(relativePath) {
  const bytes = await readFile(path.join(ROOT, relativePath));
  return {
    bytes,
    value: JSON.parse(bytes.toString("utf8")),
    binding: { path: relativePath, bytes: bytes.length, sha256: sha256(bytes) },
  };
}

export async function readSafeRegularBinding(
  relativePath,
  { root = ROOT, requiredMode = null } = {},
) {
  validateNormalizedProjectRelativePath(relativePath, {
    label: "successor CAS path",
  });
  const absoluteRoot = path.resolve(root);
  const absoluteTarget = path.resolve(absoluteRoot, relativePath);
  invariant(
    portable(path.relative(absoluteRoot, absoluteTarget)) === relativePath,
    "TS006 successor CAS path escaped its root",
  );
  const rootMetadata = await lstat(absoluteRoot);
  invariant(
    rootMetadata.isDirectory() && !rootMetadata.isSymbolicLink(),
    "TS006 successor CAS root is not a real directory",
  );
  let ancestor = absoluteRoot;
  for (const segment of relativePath.split("/").slice(0, -1)) {
    ancestor = path.join(ancestor, segment);
    const ancestorMetadata = await lstat(ancestor);
    invariant(
      ancestorMetadata.isDirectory() &&
        !ancestorMetadata.isSymbolicLink(),
      "TS006 successor CAS ancestor contains a symlink or non-directory",
    );
  }
  const [rootRealpath, targetRealpath, metadata] = await Promise.all([
    realpath(absoluteRoot),
    realpath(absoluteTarget),
    lstat(absoluteTarget),
  ]);
  invariant(
    targetRealpath.startsWith(`${rootRealpath}${path.sep}`) &&
      metadata.isFile() &&
      !metadata.isSymbolicLink() &&
      metadata.nlink === 1 &&
      (requiredMode === null ||
        (metadata.mode & 0o777) === requiredMode),
    requiredMode === null
      ? "TS006 successor CAS input is not one regular no-link file inside its root"
      : "TS006 immutable successor evidence is not one 0444 regular no-link file inside its root",
  );
  const bytes = await readFile(absoluteTarget);
  return {
    bytes,
    binding: {
      path: relativePath,
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
  };
}

function assertExactBindingMap(actual, expected, label) {
  invariant(
    pretty(actual) === pretty(expected),
    `TS006 ${label} binding set drifted`,
  );
  return actual;
}

function flattenedBindings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  if (
    typeof value.path === "string" &&
    Number.isSafeInteger(value.bytes) &&
    /^[a-f0-9]{64}$/u.test(value.sha256 || "")
  ) {
    return [bindingWithoutStat(value)];
  }
  return Object.values(value).flatMap(flattenedBindings);
}

function exactReleaseItem(releaseDocument) {
  const release = releaseDocument.releases?.find(
    ({ releaseId }) => releaseId === "lesson-g04-l03-negative-numbers",
  );
  invariant(
    release?.publicationMode === "atomic" && release.members?.length === 40,
    "G4 L3 atomic release scope drifted",
  );
  const matches = release.members.filter(
    ({ animationId }) => animationId === TS006_ANIMATION_ID,
  );
  invariant(
    matches.length === 1,
    "G4 L3 release must contain exactly one TS006 member",
  );
  const member = matches[0];
  invariant(
    member.ordinal === 34 &&
      member.source?.sha256 ===
        "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47",
    "TS006 release sequence/source identity drifted",
  );
  return member;
}

function exactSourceAudit(document) {
  const runtime = document.machineFindings?.runtime;
  invariant(
    document.identity?.animationId === TS006_ANIMATION_ID &&
      document.provenance?.source?.swf?.sha256 ===
        "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47" &&
      runtime?.stage?.width === 800 &&
      runtime.stage.height === 600 &&
      runtime.fps === 12 &&
      runtime.rootFrameCount === 10 &&
      runtime.backgroundColor === "#b8d8f7" &&
      runtime.actionScriptVersion === "AS1/2" &&
      document.machineFindings?.scripts?.exportedScriptFileCount === 3 &&
      document.acceptance?.acceptanceEffect === "none",
    "TS006 machine source audit identity or findings drifted",
  );
  return document;
}

function exactStandardMachineAudit(document) {
  invariant(
    document.source?.hashMatches === true &&
      document.findings?.runtimeCrossCheck?.allMatch === true &&
      document.findings?.backgroundColor === "#b8d8f7" &&
      document.findings?.actionScriptVersion === "AS1/2" &&
      document.tools?.ffdec?.version ===
        "JPEXS Free Flash Decompiler v.26.2.1" &&
      document.tools?.swfmill?.version === "swfmill 0.3.6",
    "TS006 standard machine audit/tool binding drifted",
  );
  return document;
}

function exactAuthoringAudit(document) {
  const rows =
    document.items?.filter(
      ({ animationId }) => animationId === TS006_ANIMATION_ID,
    ) || [];
  invariant(
    rows.length === 1,
    "Animate authoring index must contain exactly one TS006 row",
  );
  const row = rows[0];
  invariant(
    row.status === "verified-work-only-authoring-audit" &&
      row.selectedPassingAudit?.runId === "run-tkpM0N" &&
      row.selectedPassingAudit?.animateVersion === "MAC 21,0,7,42652" &&
      row.selectedPassingAudit?.nativeMovie?.frameCount === 10 &&
      row.originalRuntimeBehaviorEstablished === false &&
      row.humanVisualReviewEstablished === false &&
      row.ownerAcceptanceEstablished === false &&
      row.strictAcceptanceEffect === false,
    "TS006 work-only Animate authoring evidence drifted or was promoted",
  );
  return row;
}

function exactCandidate(document) {
  const integrationPaths = new Set(
    document.integrationBindings?.map(({ path: bindingPath }) => bindingPath) ||
      [],
  );
  invariant(
    document.reportType === "current-javascript-engineering-candidate" &&
      document.animationId === TS006_ANIMATION_ID &&
      document.disposition?.currentJavaScriptCandidate === true &&
      document.disposition?.candidateRenderabilityOnly === true &&
      document.disposition?.prototypeRegistryOnly === true &&
      document.disposition?.spanishHostAudioEngineeringCandidate === true &&
      document.candidateRenderability?.frameDomain === "sprite-23" &&
      document.candidateRenderability?.executedFrameCount === 128 &&
      document.candidateRenderability?.uniqueVisualFrameCount === 1 &&
      document.candidateRenderability?.originalRuntimeBaselineUsed === false &&
      document.candidateRenderability?.rmseComputed === false &&
      document.hostAudioCandidate?.status ===
        "same-origin-user-activated-spanish-host-track-engineering-candidate-only" &&
      document.hostAudioCandidate?.activation === "user" &&
      document.hostAudioCandidate?.timelineBehavior === "pause-while-playing" &&
      document.hostAudioCandidate?.publicAsset?.path ===
        PUBLIC_SPANISH_AUDIO_PATH &&
      document.hostAudioCandidate?.publicAsset?.exactSourceBytes === true &&
      document.hostAudioCandidate?.embeddedAudioEnabled === false &&
      document.hostAudioCandidate?.sourceMediaMatchEstablished === false &&
      document.hostAudioCandidate?.authoritativeListeningComplete === false &&
      document.hostAudioCandidate?.implementationAuthorized === false &&
      document.hostAudioCandidate?.audioAccepted === false &&
      document.hostAudioCandidate?.ownerAccepted === false &&
      document.hostAudioCandidate?.strictMigrationComplete === false &&
      integrationPaths.has(IMPLEMENTATION_TEST_PATH) &&
      integrationPaths.has(PRODUCT_RUNTIME_PATH) &&
      integrationPaths.has(RUNTIME_CONTRACT_PATH) &&
      integrationPaths.has(RUNTIME_HELPERS_PATH) &&
      integrationPaths.has(SPANISH_AUDIO_QA_GENERATOR_PATH) &&
      integrationPaths.has(SPANISH_AUDIO_QA_TEST_PATH) &&
      Object.values(document.authorization || {}).every(
        (value) => value === false,
      ) &&
      Object.values(document.acceptance || {}).every(
        (value) => value === false,
      ) &&
      document.strictAcceptanceEffect === "none",
    "TS006 current-JavaScript candidate drifted or contains an authority/acceptance claim",
  );
  return document;
}

function exactPackageLock(document) {
  invariant(
    document.packages?.["node_modules/@ruffle-rs/ruffle"]?.version ===
      "0.4.1" &&
      document.packages?.["node_modules/@playwright/test"]?.version ===
        "1.61.1",
    "Ruffle or Playwright lockfile version drifted",
  );
  return document;
}

function exactSpanishHostAudioProductQa(document) {
  invariant(
    document.schemaVersion === 1 &&
      document.artifactType ===
        "ts006-current-js-spanish-host-audio-product-qa" &&
      document.animationId === TS006_ANIMATION_ID &&
      document.status === "passed-current-js-product-qa-acceptance-neutral" &&
      document.acceptanceEffect === "none" &&
      document.strictAcceptanceEffect === false &&
      document.migrationStatusChanged === false &&
      document.humanReviewRecorded === false &&
      document.ownerReviewRecorded === false &&
      document.bindingsUnchangedDuringObservation === true &&
      document.audioAssetIdentity?.exactBytesIdentical === true &&
      document.audioAssetIdentity?.pass === true &&
      document.normalPlaybackPage?.pass === true &&
      document.normalPlaybackPage?.beforeClick?.control?.text ===
        "Play Spanish audio" &&
      document.normalPlaybackPage?.observations
        ?.onlyExactSameOriginMp3MediaRequestedAfterClick === true &&
      document.deterministicCapturePage?.pass === true &&
      document.deterministicCapturePage?.beforeDisabledClick?.control
        ?.disabled === true &&
      document.audioAcceptance?.currentJsUserActivatedControlObserved ===
        true &&
      document.audioAcceptance?.sourceMediaMatchEstablished === false &&
      document.audioAcceptance?.spokenSpanishLanguageVerified === false &&
      document.audioAcceptance?.authoritativeListeningComplete === false &&
      document.audioAcceptance?.strictAudioAcceptance === "pending" &&
      Object.keys(document.claims || {}).length === 18 &&
      Object.values(document.claims || {}).every((value) => value === false),
    "TS006 Spanish host-audio product QA drifted or contains an acceptance claim",
  );
  return document;
}

function assertAcceptanceNeutral(manifest) {
  invariant(
    manifest.animationId === TS006_ANIMATION_ID &&
      manifest.status === "preserved",
    "TS006 manifest identity/status must remain preserved",
  );
  invariant(
    Object.values(manifest.accessibility || {}).every(
      (value) => value === false,
    ),
    "TS006 current-JavaScript binding cannot set accessibility acceptance",
  );
  for (const key of ["engineeringReview", "humanVisualReview", "ownerReview"]) {
    invariant(
      manifest.acceptance?.[key]?.decision === "pending",
      `TS006 current-JavaScript binding cannot change ${key}`,
    );
  }
  invariant(
    (manifest.acceptance?.knownExceptions || []).length === 0,
    "TS006 current-JavaScript binding cannot add an accepted exception",
  );
}

function withoutAcceptanceNeutralCandidateBindingFields(manifest) {
  const projected = structuredClone(manifest);
  delete projected.implementation?.rendering;
  delete projected.implementation?.testFile;
  delete projected.implementation?.candidateState;
  delete projected.evidence?.spanishHostAudioCurrentJsProductQa;
  return projected;
}

export function validateAcceptanceNeutralManifestRebind(before, after) {
  assertAcceptanceNeutral(before);
  assertAcceptanceNeutral(after);
  invariant(
    before.status === after.status &&
      before.assetId === after.assetId &&
      before.source?.swfSha256 === after.source?.swfSha256 &&
      before.source?.flaSha256 === after.source?.flaSha256,
    "TS006 acceptance-neutral rebind cannot change identity, source, or status",
  );
  invariant(
    pretty(withoutAcceptanceNeutralCandidateBindingFields(before)) ===
      pretty(withoutAcceptanceNeutralCandidateBindingFields(after)),
    "TS006 acceptance-neutral rebind exceeded the implementation/audio-QA allowlist",
  );
  const candidate = after.implementation?.candidateState;
  invariant(
    after.implementation?.testFile === IMPLEMENTATION_TEST_PATH &&
      candidate?.status === "current-javascript-engineering-candidate-only" &&
      candidate?.audioEnabled === true &&
      candidate?.audioEnablementScope ===
        "same-origin-user-activated-spanish-host-track-engineering-candidate-only" &&
      candidate?.embeddedAudioEnabled === false &&
      candidate?.sourceMediaMatchEstablished === false &&
      candidate?.authoritativeListeningComplete === false &&
      candidate?.strictAcceptanceEffect === "none" &&
      after.evidence?.spanishHostAudioCurrentJsProductQa?.audioAccepted ===
        false &&
      after.evidence?.spanishHostAudioCurrentJsProductQa
        ?.strictAcceptanceEffect === "none",
    "TS006 acceptance-neutral host-audio candidate rebind is incomplete or promoted",
  );
  return after;
}

export function validateUnboundPreimage({ manifest, assetInventoryBytes }) {
  assertAcceptanceNeutral(manifest);
  invariant(
    manifest.confidence === "unknown" &&
      manifest.runtime?.backgroundColor === "" &&
      manifest.runtime?.actionScriptVersion === "unknown" &&
      manifest.runtime?.complexity === "unknown" &&
      manifest.implementation?.rendering === "undecided" &&
      manifest.implementation?.route === "" &&
      manifest.implementation?.registryModule === "" &&
      manifest.baseline?.authority === "undecided" &&
      manifest.baseline?.route === "" &&
      manifest.audit?.assetsRequired === false,
    "Refusing to overwrite a TS006 manifest that is not the exact unbound candidate state",
  );
  invariant(
    assetInventoryBytes.toString("utf8") === `${ASSET_HEADER.join(",")}\n`,
    "Refusing to overwrite a non-template TS006 asset inventory",
  );
}

export function buildBoundManifest({
  manifest,
  sourceAudit,
  standardAudit,
  authoringAudit,
  packageLock,
  candidate,
  spanishAudioProductQa,
}) {
  assertAcceptanceNeutral(manifest);
  exactSourceAudit(sourceAudit);
  exactStandardMachineAudit(standardAudit);
  exactAuthoringAudit({ items: [authoringAudit] });
  exactPackageLock(packageLock);
  exactCandidate(candidate);
  exactSpanishHostAudioProductQa(spanishAudioProductQa.value);
  const next = structuredClone(manifest);
  next.confidence = "low";
  Object.assign(next.runtime, {
    backgroundColor: sourceAudit.machineFindings.runtime.backgroundColor,
    actionScriptVersion:
      sourceAudit.machineFindings.runtime.actionScriptVersion,
    complexity: "medium",
    fonts: [
      "3 embedded DefineFont2 definitions; exact authoring names remain unresolved",
    ],
    scripts: sourceAudit.machineFindings.scripts.files.map(
      ({ path: scriptPath }) => scriptPath,
    ),
    // Runtime dependencies may be added by later source-script audits. A
    // candidate-only rebind must preserve that stronger evidence instead of
    // silently projecting the original empty scaffold back over it.
    externalDependencies: structuredClone(
      manifest.runtime?.externalDependencies ?? [],
    ),
  });
  next.audit = {
    ...next.audit,
    assetsRequired: true,
    assetsNotRequiredReason: "",
  };
  next.scenarios = TS006_SCENARIOS.map((scenario) => structuredClone(scenario));
  next.toolVersions = {
    ruffle: `@ruffle-rs/ruffle ${packageLock.packages["node_modules/@ruffle-rs/ruffle"].version} (forensic reference only)`,
    browser: `Chromium ${candidate.candidateRenderability.browser.version} via Playwright ${packageLock.packages["node_modules/@playwright/test"].version}`,
    ffdec: standardAudit.tools.ffdec.version,
    swfmill: standardAudit.tools.swfmill.version,
    adobeAnimate: `Adobe Animate 2021 ${authoringAudit.selectedPassingAudit.animateVersion} (work-only authoring audit; not original runtime)`,
  };
  next.baseline = {
    ...next.baseline,
    authority: "undecided",
    renderer: `Ruffle ${packageLock.packages["node_modules/@ruffle-rs/ruffle"].version} forensic reference only; authoritative original runtime pending`,
    route: `/reference/${TS006_ANIMATION_ID}`,
    routeFile: REFERENCE_ROUTE_FILE,
    viewport: { width: 800, height: 600, deviceScaleFactor: 1 },
  };
  next.implementation = {
    ...next.implementation,
    rendering:
      "source-static Canvas engineering candidate plus an exact same-origin Spanish host-audio candidate; root, Spanish visuals, embedded audio, source-media matching, listening, interaction, Replay, and fidelity remain fail closed",
    route: `/animations/${TS006_ANIMATION_ID}`,
    routeFile: IMPLEMENTATION_ROUTE_FILE,
    component: MODULE_PATH,
    registryModule: `./modules/${TS006_ANIMATION_ID}`,
    timelineModule: TIMELINE_PATH,
    testFile: IMPLEMENTATION_TEST_PATH,
    defaultFrameDomainId: "sprite-23",
    candidateState: {
      status: "current-javascript-engineering-candidate-only",
      report: CANDIDATE_REPORT_PATH,
      sourceStaticFrameDomain: "sprite-23",
      sourceStaticFrames: { firstFrame: 1, lastFrame: 128 },
      rootEnabled: false,
      spanishEnabled: false,
      audioEnabled: true,
      audioEnablementScope:
        "same-origin-user-activated-spanish-host-track-engineering-candidate-only",
      embeddedAudioEnabled: false,
      sourceMediaMatchEstablished: false,
      authoritativeListeningComplete: false,
      replayParityEstablished: false,
      originalRuntimeBaselineUsed: false,
      rmseComputed: false,
      strictAcceptanceEffect: "none",
    },
  };
  next.evidence = {
    ...next.evidence,
    currentJavascriptCandidateReport: CANDIDATE_REPORT_PATH,
    currentJavascriptAssetManifest: candidate.outputs.canvasManifest.path,
    rendererFrameDomainSupport: "audit/renderer-frame-domain-support.json",
    spanishHostAudioCurrentJsProductQa: {
      path: SPANISH_AUDIO_PRODUCT_QA_PATH,
      sha256: spanishAudioProductQa.binding.sha256,
      authority: "acceptance-neutral-current-javascript-product-qa-only",
      sourceMediaMatchEstablished: false,
      authoritativeListeningComplete: false,
      audioAccepted: false,
      strictAcceptanceEffect: "none",
    },
  };
  return next;
}

export function buildAssetInventory(candidate) {
  const runtime = candidate.outputs.canvasRuntime;
  const manifest = candidate.outputs.canvasManifest;
  return csv([
    ASSET_HEADER,
    [
      "ts006-source-static-canvas-runtime",
      "23",
      "animation",
      "generated-deterministic-canvas-adapter",
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS06.swf",
      "1-128",
      runtime.path,
      runtime.sha256,
      "JavaScript Canvas",
      "800x600 backing canvas",
      "",
      "one-indexed sprite-23 frame n maps to zero-indexed FFDec export frame n-1; source root placement 8241,5668 twips",
      "engineering-candidate",
      "derived from owner-provided SWF",
      "Source-static drawing candidate only; root composition, Spanish, audio, interaction, Replay, natural runtime, RMSE, human review, owner acceptance, and strict completion remain unresolved.",
    ],
    [
      "ts006-source-static-canvas-manifest",
      "23",
      "animation",
      "generated-asset-manifest",
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS06.swf",
      "1-128",
      manifest.path,
      manifest.sha256,
      "JSON",
      "manifest",
      "",
      "hash-bound generator inputs, output, safety boundary, disabled behavior, and unresolved obligations",
      "machine-verified-candidate",
      "derived from owner-provided SWF",
      "The manifest is candidate evidence only and explicitly carries false authorization and acceptance fields.",
    ],
  ]);
}

export function buildBrief({
  manifest,
  candidate,
  sourceAudit,
  authoringAudit,
}) {
  const runtime = sourceAudit.machineFindings.runtime;
  return (
    `# ${TS006_ANIMATION_ID} Migration Brief\n\n` +
    `Created: ${manifest.created}\n\n` +
    `## Objective\n\nRebuild G4 L3 TS006 (4 Step Plan) as an 800×600 bilingual-capable HTML5 lesson page while preserving the original Flash timeline domains and failing closed wherever authoritative behavior is not yet established. The current implementation is an engineering candidate, not a faithful or accepted migration.\n\n` +
    `## Identity And Classification\n\n- Animation: \`${TS006_ANIMATION_ID}\`; immutable asset: \`${manifest.assetId}\`.\n- Course placement: Grade 4, Lesson 3, TS page 6; release sequence 34/40.\n- Knowledge point: 4 Step Plan / Plan de 4 Pasos.\n- Confidence: low until original-runtime, bilingual, audio, visual, and behavior evidence closes.\n\n` +
    `## Source Evidence\n\n- FLA: \`${manifest.source.fla}\` (SHA-256 \`${manifest.source.flaSha256}\`).\n- SWF: \`${manifest.source.swf}\` (SHA-256 \`${manifest.source.swfSha256}\`).\n- Work-only Animate audit: \`${authoringAudit.selectedPassingAudit.runId}\`, ${authoringAudit.selectedPassingAudit.animateVersion}; this is authoring structure only.\n- Sources remain owner-provided and byte-preserved.\n\n` +
    `## Runtime Audit\n\n- SWF v${runtime.swfVersion} ${runtime.swfSignature}; ${runtime.stage.width}×${runtime.stage.height}; ${runtime.fps} FPS; root 1–${runtime.rootFrameCount}; background ${runtime.backgroundColor}.\n- ActionScript: ${runtime.actionScriptVersion}; 3 exported frame scripts; no static external API candidates.\n- Frame domains: root 1–10; sprite-23 1–128 at root frame 6; sprite-3 is a one-frame scriptless composite child for independent-playhead disposition only.\n- Audio: sprite-23 contains one embedded stream. The exact associated L3TS06.mp3 is staged only as a same-origin, user-activated Spanish host-audio engineering candidate. Embedded audio, source-media matching, spoken content/language, original-host semantics, synchronization, listening, Replay reset, and acceptance remain unresolved.\n\n` +
    `## Baseline\n\n- Ruffle route: \`/reference/${TS006_ANIMATION_ID}\` for forensic reference only.\n- Authoritative original-runtime baseline: not captured; natural Lesson Shell trace: not executed.\n- Native capture viewport: 800×600 at device scale 1.\n\n` +
    `## Rendering Decision\n\nA source-static Canvas adapter is retained because the FFDec drawing bundle can be executed without legacy ActionScript, timers, network, storage, or embedded audio. The product host exposes the exact Spanish MP3 only after a user action and only from the same origin. This is current-JavaScript product behavior, not authorization or audio acceptance; root, Spanish visuals, embedded audio, companion rendering, original-host semantics, Replay parity, and fidelity remain blocked.\n\n` +
    `## Timeline Specification\n\n- \`root\`: 10 frames, current renderer scenario \`root-unavailable\`; every EN/ES frame remains a pending natural-trace requirement.\n- \`sprite-23\`: 128 frames, scenario \`source-static-frame\`; EN is renderer-addressable, ES remains blocked.\n- \`sprite-3\`: composite-child-with-parent for the independent local-playhead question; all visual and behavioral obligations remain pending.\n- Flash frames remain one-indexed.\n\n` +
    `## Asset Strategy\n\nThe generated Canvas runtime and its safety manifest are hash-bound in \`asset-inventory.csv\`. They are derived engineering assets and do not substitute for the preserved FLA/SWF or an authoritative runtime baseline.\n\n` +
    `## Implementation Map\n\n- Route: \`/animations/${TS006_ANIMATION_ID}\`.\n- React module: \`${MODULE_PATH}\`.\n- Pure timeline/config: \`${TIMELINE_PATH}\`.\n- Implementation test: \`${IMPLEMENTATION_TEST_PATH}\`.\n- Acceptance-neutral host-audio product QA: \`${SPANISH_AUDIO_PRODUCT_QA_PATH}\`.\n- Deterministic identity binds frameDomain, requirementId, trace, entryStateSha256, frame, scenario, lang, and seed.\n\n` +
    `## Verification Evidence\n\n- Candidate browser execution: ${candidate.candidateRenderability.executedFrameCount}/128 sprite-23 EN frames encoded; ${candidate.candidateRenderability.uniqueVisualFrameCount} unique visual hash.\n- The host-audio product QA observed user activation, exact same-origin MP3 routing, pause-while-playing state, and capture-mode withholding only.\n- Original-runtime baseline used: no; source-media match: no; authoritative listening: no; RMSE computed: no; visual/behavior/audio parity claimed: no.\n- Current candidate report: \`${CANDIDATE_REPORT_PATH}\`.\n- Renderer frame-domain support audit is required at \`audit/renderer-frame-domain-support.json\`.\n\n` +
    `## Exceptions And Decisions\n\nRoot composition and InternalPreloader behavior, natural entry, Spanish visuals, embedded audio, source-media matching, spoken Spanish/content, original-host audio semantics, synchronization, listening, interaction, terminal/Replay state, full-frame baseline/diffs/RMSE, accessibility, independent human review, Owner acceptance, and release admission remain unresolved. No UI enablement, waiver, authorization, or acceptance is created by this brief.\n\n` +
    `## Completion\n\n- Engineering review: pending.\n- Human visual review: pending.\n- Owner review: pending.\n- Strict validator: expected to fail closed until all listed obligations are complete.\n`
  );
}

async function loadInputs() {
  const [
    release,
    sourceAudit,
    standardAudit,
    authoring,
    candidate,
    packageLock,
    spanishAudioProductQa,
    manifest,
    coverage,
    inventoryObserverReceipt,
    assetInventoryBytes,
    briefBytes,
  ] = await Promise.all([
    readDocument(RELEASE_PATH),
    readDocument(SOURCE_AUDIT_PATH),
    readDocument(STANDARD_MACHINE_AUDIT_PATH),
    readDocument(AUTHORING_INDEX_PATH),
    readDocument(CANDIDATE_REPORT_PATH),
    readDocument(PACKAGE_LOCK_PATH),
    readDocument(SPANISH_AUDIO_PRODUCT_QA_PATH),
    readDocument(MIGRATION_PATH),
    readDocument(COVERAGE_PATH),
    readDocument(INVENTORY_OBSERVER_RECEIPT_PATH),
    readFile(path.join(ROOT, ASSET_INVENTORY_PATH)),
    readFile(path.join(ROOT, BRIEF_PATH)),
  ]);
  const member = exactReleaseItem(release.value);
  const exactSource = exactSourceAudit(sourceAudit.value);
  const exactStandard = exactStandardMachineAudit(standardAudit.value);
  const authoringRow = exactAuthoringAudit(authoring.value);
  const exactCandidateReport = exactCandidate(candidate.value);
  const exactLock = exactPackageLock(packageLock.value);
  exactSpanishHostAudioProductQa(spanishAudioProductQa.value);
  validateMaterializationReceipt(inventoryObserverReceipt.value);
  invariant(
    inventoryObserverReceipt.value.animationId === TS006_ANIMATION_ID &&
      inventoryObserverReceipt.value.canonicalInventoryFiles?.assetInventory
        ?.path === ASSET_INVENTORY_PATH &&
      inventoryObserverReceipt.value.canonicalInventoryFiles.assetInventory
        .changedByMaterializer === false &&
      Object.values(inventoryObserverReceipt.value.acceptance || {}).every(
        (value) => value === false,
      ) &&
      inventoryObserverReceipt.value.strictAcceptanceEffect === "none",
    "TS006 machine inventory observer receipt is invalid or contains acceptance",
  );
  const implementationBindings = {};
  for (const relativePath of [
    MODULE_PATH,
    TIMELINE_PATH,
    HELPER_PATH,
    IMPLEMENTATION_ROUTE_FILE,
    REFERENCE_ROUTE_FILE,
    IMPLEMENTATION_TEST_PATH,
    CANDIDATE_GENERATOR_TEST_PATH,
    PRODUCT_RUNTIME_PATH,
    RUNTIME_CONTRACT_PATH,
    RUNTIME_HELPERS_PATH,
    SPANISH_AUDIO_QA_GENERATOR_PATH,
    SPANISH_AUDIO_QA_TEST_PATH,
    PUBLIC_SPANISH_AUDIO_PATH,
    PUBLIC_AUDIO_MANIFEST_PATH,
  ]) {
    implementationBindings[relativePath] = await readBinding(relativePath);
  }
  for (const output of [
    exactCandidateReport.outputs.canvasRuntime,
    exactCandidateReport.outputs.canvasManifest,
  ]) {
    const observed = await readBinding(output.path);
    invariant(
      observed.sha256 === output.sha256 && observed.bytes === output.bytes,
      `TS006 candidate output differs from candidate report: ${output.path}`,
    );
  }
  return {
    member,
    sourceAudit: exactSource,
    standardAudit: exactStandard,
    authoringAudit: authoringRow,
    candidate: exactCandidateReport,
    packageLock: exactLock,
    spanishAudioProductQa,
    manifest: manifest.value,
    manifestBytes: manifest.bytes,
    coverage: coverage.value,
    coverageBytes: coverage.bytes,
    inventoryObserverReceipt,
    assetInventoryBytes,
    briefBytes,
    sourceBindings: {
      lessonRelease: release.binding,
      machineSourceAudit: sourceAudit.binding,
      standardMachineAudit: standardAudit.binding,
      workOnlyAuthoringIndex: authoring.binding,
      currentJavascriptCandidate: candidate.binding,
      spanishHostAudioCurrentJsProductQa: spanishAudioProductQa.binding,
      packageLock: packageLock.binding,
      pendingCoverageContractGenerator: await readBinding(
        PENDING_COVERAGE_GENERATOR_PATH,
      ),
      implementationFiles: implementationBindings,
    },
  };
}

function expectedOutputs(inputs) {
  const bound = buildBoundManifest(inputs);
  const planned = buildExpectedPendingCoverageDocuments({
    item: {
      animationId: TS006_ANIMATION_ID,
      sequence: inputs.member.ordinal,
      nativeRuntimeFacts: {
        rootFrameCount:
          inputs.sourceAudit.machineFindings.runtime.rootFrameCount,
      },
    },
    manifest: bound,
    coverage: inputs.coverage,
  });
  const manifestBytes = Buffer.from(pretty(planned.manifest));
  const coverageBytes = Buffer.from(pretty(planned.coverage));
  const assetInventoryBytes = Buffer.from(
    buildAssetInventory(inputs.candidate),
  );
  const briefBytes = Buffer.from(
    buildBrief({
      manifest: planned.manifest,
      candidate: inputs.candidate,
      sourceAudit: inputs.sourceAudit,
      authoringAudit: inputs.authoringAudit,
    }),
  );
  return {
    manifest: planned.manifest,
    coverage: planned.coverage,
    manifestBytes,
    coverageBytes,
    assetInventoryBytes,
    briefBytes,
  };
}

function outputBindings(outputs) {
  return {
    migrationJson: {
      path: MIGRATION_PATH,
      bytes: outputs.manifestBytes.length,
      sha256: sha256(outputs.manifestBytes),
    },
    fullFrameCoverage: {
      path: COVERAGE_PATH,
      bytes: outputs.coverageBytes.length,
      sha256: sha256(outputs.coverageBytes),
    },
    assetInventory: {
      path: ASSET_INVENTORY_PATH,
      bytes: outputs.assetInventoryBytes.length,
      sha256: sha256(outputs.assetInventoryBytes),
    },
    migrationBrief: {
      path: BRIEF_PATH,
      bytes: outputs.briefBytes.length,
      sha256: sha256(outputs.briefBytes),
    },
  };
}

function currentWorkspaceBindings(inputs) {
  return {
    migrationJson: {
      path: MIGRATION_PATH,
      bytes: inputs.manifestBytes.length,
      sha256: sha256(inputs.manifestBytes),
    },
    fullFrameCoverage: {
      path: COVERAGE_PATH,
      bytes: inputs.coverageBytes.length,
      sha256: sha256(inputs.coverageBytes),
    },
    assetInventory: {
      path: ASSET_INVENTORY_PATH,
      bytes: inputs.assetInventoryBytes.length,
      sha256: sha256(inputs.assetInventoryBytes),
    },
    migrationBrief: {
      path: BRIEF_PATH,
      bytes: inputs.briefBytes.length,
      sha256: sha256(inputs.briefBytes),
    },
  };
}

export function validateSpecializedRefreshPreimageOwnership({
  report,
  observedBindings,
}) {
  invariant(
    report?.reportType === "g4-l3-ts006-current-javascript-workspace-binding" &&
      report.schemaVersion === 1 &&
      report.scope?.animationId === TS006_ANIMATION_ID &&
      report.summary?.migrationStatusAfter === "preserved" &&
      report.summary?.strictCompletions === 0 &&
      Object.values(report.acceptance || {}).every(
        (value) => value === false,
      ) &&
      report.strictAcceptanceEffect?.startsWith("none;"),
    "TS006 workspace-binding receipt cannot refresh across authority or acceptance drift",
  );
  invariant(
    pretty(report.after) === pretty(observedBindings),
    "TS006 workspace-binding receipt does not own the current workspace preimage",
  );
  return report;
}

async function validateImmutableRefreshPreimage(preimage, { root = ROOT } = {}) {
  invariant(
    preimage?.ignoredWorkArtifact === true &&
      typeof preimage.root === "string" &&
      preimage.root.startsWith(`${REFRESH_PREIMAGE_ROOT}/`) &&
      /^[a-f0-9]{64}$/u.test(preimage.preimageSetSha256) &&
      preimage.bindings &&
      typeof preimage.bindings === "object",
    "TS006 immutable refresh preimage descriptor is invalid",
  );
  invariant(
    sha256(Buffer.from(pretty(preimage.bindings))) ===
      preimage.preimageSetSha256,
    "TS006 immutable refresh preimage set fingerprint is stale",
  );
  const absoluteRoot = path.resolve(root, preimage.root);
  const relativeRoot = portable(path.relative(root, absoluteRoot));
  invariant(
    relativeRoot === preimage.root &&
      relativeRoot.startsWith(`${REFRESH_PREIMAGE_ROOT}/`),
    "TS006 immutable refresh preimage escapes its ignored work root",
  );
  const rootMetadata = await lstat(absoluteRoot);
  invariant(
    rootMetadata.isDirectory() && !rootMetadata.isSymbolicLink(),
    "TS006 immutable refresh preimage root must be a real directory",
  );
  invariant(
    (await realpath(absoluteRoot)).startsWith(
      `${await realpath(path.join(root, REFRESH_PREIMAGE_ROOT))}${path.sep}`,
    ),
    "TS006 immutable refresh preimage resolves outside its ignored work root",
  );
  const usedBasenames = new Set();
  for (const [relativePath, binding] of Object.entries(preimage.bindings)) {
    invariant(
      binding?.path === relativePath &&
        Number.isSafeInteger(binding.bytes) &&
        binding.bytes >= 0 &&
        /^[a-f0-9]{64}$/u.test(binding.sha256),
      `TS006 immutable refresh binding is invalid: ${relativePath}`,
    );
    const basename = path.basename(relativePath);
    invariant(
      !usedBasenames.has(basename),
      `TS006 immutable refresh basename collision: ${basename}`,
    );
    usedBasenames.add(basename);
    const file = path.join(absoluteRoot, basename);
    const metadata = await lstat(file);
    invariant(
      metadata.isFile() &&
        !metadata.isSymbolicLink() &&
        metadata.nlink === 1 &&
        (metadata.mode & 0o777) === 0o444,
      `TS006 immutable refresh preimage is not a read-only regular file: ${file}`,
    );
    const bytes = await readFile(file);
    invariant(
      bytes.length === binding.bytes && sha256(bytes) === binding.sha256,
      `TS006 immutable refresh preimage bytes drifted: ${file}`,
    );
  }
  return preimage;
}

function acceptanceIsStrictlyNeutral(acceptance) {
  return (
    acceptance?.authoritativeRuntimeComplete === false &&
    acceptance.audioAccepted === false &&
    acceptance.independentHumanVisualReviewComplete === false &&
    acceptance.ownerAccepted === false &&
    acceptance.strictComplete === false &&
    acceptance.releasePublished === false &&
    acceptance.effect === "none"
  );
}

export function validateInventoryObserverTransactionDocuments({
  plan,
  planBinding,
  receipt,
  receiptBinding,
  archiveManifest,
  archiveManifestBinding,
  observerPreimage,
  observerPreimageBinding,
  observerPostimage,
  observerPostimageBinding,
  canonicalAssetInventoryBinding,
  canonicalAssetInventoryBytes,
}) {
  const expected = GLOBAL_INVENTORY_REFRESH_TRANSITION;
  invariant(
    sameBinding(planBinding, expected.plan) &&
      sameBinding(receiptBinding, expected.receipt) &&
      sameBinding(archiveManifestBinding, expected.preimageArchiveManifest) &&
      sameBinding(observerPreimageBinding, expected.observerPreimage) &&
      sameBinding(observerPostimageBinding, expected.observerPostimage) &&
      sameBinding(
        canonicalAssetInventoryBinding,
        expected.canonicalAssetInventory,
      ),
    "TS006 inventory observer transaction contains an unknown exact preimage or postimage",
  );
  invariant(
    plan?.schemaVersion === 1 &&
      plan.reportType === "g4-l3-workspace-inventory-safe-refresh-plan" &&
      plan.transactionId === expected.transactionId &&
      plan.preimageArchive?.relativeRoot === expected.preimageArchiveRoot &&
      plan.preimageArchive?.preimageSetSha256 ===
        archiveManifest.preimageSetSha256 &&
      plan.scope?.machinePaths?.length === 120 &&
      plan.scope?.canonicalPaths?.length === 80 &&
      plan.preflight?.memberCount === 40 &&
      plan.preflight?.machineOutputCount === 120 &&
      plan.preflight?.canonicalInventoryCount === 80 &&
      plan.strictAcceptanceEffect === "none" &&
      acceptanceIsStrictlyNeutral(plan.acceptance) &&
      acceptanceIsStrictlyNeutral(plan.preflight?.acceptance),
    "TS006 inventory observer refresh plan is stale or exceeds acceptance-neutral authority",
  );
  invariant(
    receipt?.schemaVersion === 1 &&
      receipt.reportType === "g4-l3-workspace-inventory-safe-refresh-receipt" &&
      receipt.transactionId === expected.transactionId &&
      receipt.planSha256 === expected.plan.sha256 &&
      receipt.memberCount === 40 &&
      receipt.machineOutputCount === 120 &&
      receipt.canonicalInventoryCount === 80 &&
      receipt.writesPerformed === 40 &&
      receipt.canonicalInventoriesUnchanged === true &&
      receipt.canonicalPreimageSetSha256 ===
        receipt.canonicalPostimageSetSha256 &&
      receipt.machinePreimageSetSha256 === archiveManifest.preimageSetSha256 &&
      receipt.releaseLedgerChanged === false &&
      receipt.registryChanged === false &&
      receipt.publicationChanged === false &&
      receipt.completionLedgerChanged === false &&
      receipt.strictAcceptanceEffect === "none" &&
      acceptanceIsStrictlyNeutral(receipt.acceptance),
    "TS006 inventory observer refresh receipt is incomplete or promoted",
  );
  invariant(
    archiveManifest?.schemaVersion === 1 &&
      archiveManifest.reportType ===
        "g4-l3-workspace-inventory-machine-preimage-set" &&
      archiveManifest.memberCount === 40 &&
      archiveManifest.fileCount === 120 &&
      archiveManifest.preimageSetSha256 ===
        "77b8e14a14cead5b7c54b1d2a93aa50959c044424473e626de7ebe8bfaddf704" &&
      acceptanceIsStrictlyNeutral(archiveManifest.acceptance),
    "TS006 inventory observer preimage archive manifest is invalid",
  );
  const observerPath = INVENTORY_OBSERVER_RECEIPT_PATH;
  const machinePreimages = plan.machinePreimages?.filter(
    ({ path: relativePath }) => relativePath === observerPath,
  );
  const desiredMachineOutputs = plan.desiredMachineOutputs?.filter(
    ({ path: relativePath }) => relativePath === observerPath,
  );
  const archivedObserverEntries = archiveManifest.files?.filter(
    ({ path: relativePath }) => relativePath === observerPath,
  );
  const canonicalInventoryEntries = plan.canonicalPreimages?.filter(
    ({ path: relativePath }) => relativePath === ASSET_INVENTORY_PATH,
  );
  invariant(
    machinePreimages?.length === 1 &&
      machinePreimages[0].path === observerPath &&
      sameBindingContent(machinePreimages[0], expected.observerPreimage) &&
      desiredMachineOutputs?.length === 1 &&
      sameBinding(desiredMachineOutputs[0], expected.observerPostimage) &&
      archivedObserverEntries?.length === 1 &&
      archivedObserverEntries[0].path === observerPath &&
      sameBindingContent(
        archivedObserverEntries[0],
        expected.observerPreimage,
      ) &&
      canonicalInventoryEntries?.length === 1 &&
      sameBinding(
        canonicalInventoryEntries[0],
        expected.canonicalAssetInventory,
      ),
    "TS006 inventory observer transaction does not prove its exact archived/current bindings",
  );
  validateMaterializationReceipt(observerPreimage);
  validateMaterializationReceipt(observerPostimage);
  const allowedSemanticChanges = [
    {
      path: "/canonicalInventoryFiles/assetInventory/sha256",
      before:
        "5cdbfbb9ea7c38bae41d46ad9bfefe19e38e03e995b7f36bcac8c51d5d0f1dfa",
      after: "c65960d0ef5abeac6a7853dcdcc4c1c94e08a5adf6a89ee3b4aa96e9d3488a76",
    },
    {
      path: "/reportFingerprintSha256",
      before:
        "d43e7830989cbdcb3afd4623fcbc683e5fcffc62664bdb42c120b94053985ffa",
      after: "6fd11dd65d937fa2e2d505ca9b3176593878af5b4f7bc2ca424ad2f8524b37a4",
    },
    {
      path: "/sourceBindings/assetDefinitionCensus/sha256",
      before:
        "176bd22a0cdf802798b2e7de3e20e3b60b8be4afdff67cddea0985cd5f4ec1f0",
      after: "278ab624428ef073d43b7487e6a8466b184256bfacce7369aba11675fb418a45",
    },
    {
      path: "/sourceBindings/catalogAudioMediaProbe/sha256",
      before:
        "7e9111af17783b650542d06d337f794eed22b3db359dae3f6862e72eb6bc2def",
      after: "5d9b6392254dbba2ce2429045d3cb7670c648c100fffbacc2ffd73798023b5fe",
    },
  ];
  invariant(
    pretty(semanticLeafChanges(observerPreimage, observerPostimage)) ===
      pretty(allowedSemanticChanges) &&
      observerPreimage.canonicalInventoryFiles.assetInventory
        .changedByMaterializer === false &&
      observerPostimage.canonicalInventoryFiles.assetInventory
        .changedByMaterializer === false &&
      observerPostimage.canonicalInventoryFiles.assetInventory.sha256 ===
        canonicalAssetInventoryBinding.sha256 &&
      canonicalAssetInventoryBytes.length ===
        canonicalAssetInventoryBinding.bytes &&
      sha256(canonicalAssetInventoryBytes) ===
        canonicalAssetInventoryBinding.sha256 &&
      Object.values(observerPostimage.acceptance || {}).every(
        (value) => value === false,
      ) &&
      observerPostimage.strictAcceptanceEffect === "none",
    "TS006 inventory observer changed outside its four allowlisted semantic leaves",
  );
  return {
    schemaVersion: 1,
    evidenceType: "g4-l3-workspace-inventory-safe-refresh-transition",
    transactionId: expected.transactionId,
    transactionRoot: expected.transactionRoot,
    plan: expected.plan,
    receipt: expected.receipt,
    preimageArchiveManifest: expected.preimageArchiveManifest,
    observerPreimage: expected.observerPreimage,
    observerPostimage: expected.observerPostimage,
    canonicalAssetInventory: expected.canonicalAssetInventory,
    canonicalAssetInventorySemanticFields: assetInventorySemanticFields(
      canonicalAssetInventoryBytes,
    ),
    allowedSemanticChanges,
    canonicalInventoriesUnchanged: true,
    protectedPinsChanged: false,
    completionOrReleaseLedgerChanged: false,
    strictAcceptanceEffect: "none",
  };
}

async function inventoryObserverTransactionWitness(
  inputs,
  canonicalAssetInventoryBytes = inputs.assetInventoryBytes,
) {
  const expected = GLOBAL_INVENTORY_REFRESH_TRANSITION;
  const [plan, receipt, archiveManifest, observerPreimage] = await Promise.all([
    readImmutableEvidence(expected.plan, expected.transactionRoot),
    readImmutableEvidence(expected.receipt, expected.transactionRoot),
    readImmutableEvidence(
      expected.preimageArchiveManifest,
      expected.preimageArchiveRoot,
    ),
    readImmutableEvidence(
      expected.observerPreimage,
      expected.preimageArchiveRoot,
    ),
  ]);
  const observerMetadata = await lstat(
    path.join(ROOT, INVENTORY_OBSERVER_RECEIPT_PATH),
  );
  invariant(
    observerMetadata.isFile() &&
      !observerMetadata.isSymbolicLink() &&
      observerMetadata.nlink === 1 &&
      sameBinding(
        inputs.inventoryObserverReceipt.binding,
        expected.observerPostimage,
      ),
    "TS006 current inventory observer is not the exact transaction postimage",
  );
  return validateInventoryObserverTransactionDocuments({
    plan: plan.value,
    planBinding: plan.binding,
    receipt: receipt.value,
    receiptBinding: receipt.binding,
    archiveManifest: archiveManifest.value,
    archiveManifestBinding: archiveManifest.binding,
    observerPreimage: observerPreimage.value,
    observerPreimageBinding: observerPreimage.binding,
    observerPostimage: inputs.inventoryObserverReceipt.value,
    observerPostimageBinding: inputs.inventoryObserverReceipt.binding,
    canonicalAssetInventoryBinding: {
      path: ASSET_INVENTORY_PATH,
      bytes: canonicalAssetInventoryBytes.length,
      sha256: sha256(canonicalAssetInventoryBytes),
    },
    canonicalAssetInventoryBytes,
  });
}

async function inventoryObserverLineageWitness({ report, observerReceipt }) {
  const observedAssetInventory =
    observerReceipt.value.canonicalInventoryFiles.assetInventory;
  const witnesses = [];
  const history = report.refreshHistory || [];
  for (let index = 0; index < history.length; index += 1) {
    const entry = history[index];
    if (!entry.immutablePreimage) continue;
    await validateImmutableRefreshPreimage(entry.immutablePreimage);
    const binding = entry.immutablePreimage.bindings[ASSET_INVENTORY_PATH];
    if (
      binding?.sha256 === observedAssetInventory.sha256 &&
      binding.bytes === observedAssetInventory.bytes
    ) {
      witnesses.push({
        historyIndex: index,
        priorReportSha256: entry.priorReportSha256,
        immutablePreimage: entry.immutablePreimage,
        assetInventory: binding,
      });
    }
  }
  invariant(
    witnesses.length === 1,
    "TS006 generic inventory observer pin lacks one exact immutable specialized-writer ancestor",
  );
  return witnesses[0];
}

export function validateExactAssetInventoryManifestCellTransition({
  beforeBytes,
  afterBytes,
  nextManifestSha256,
}) {
  invariant(
    Buffer.isBuffer(beforeBytes) &&
      Buffer.isBuffer(afterBytes) &&
      /^[a-f0-9]{64}$/u.test(nextManifestSha256),
    "TS006 asset-inventory transition inputs are invalid",
  );
  const beforeLines = beforeBytes.toString("utf8").split("\n");
  const afterLines = afterBytes.toString("utf8").split("\n");
  invariant(
    beforeLines.length === 4 &&
      afterLines.length === 4 &&
      beforeLines[0] === afterLines[0] &&
      beforeLines[1] === afterLines[1] &&
      beforeLines[3] === "" &&
      afterLines[3] === "",
    "TS006 asset-inventory transition changed structure or the Canvas runtime row",
  );
  const priorHashes = beforeLines[2].match(/[a-f0-9]{64}/gu) || [];
  const nextHashes = afterLines[2].match(/[a-f0-9]{64}/gu) || [];
  invariant(
    priorHashes.length === 1 &&
      nextHashes.length === 1 &&
      priorHashes[0] !== nextManifestSha256 &&
      nextHashes[0] === nextManifestSha256 &&
      beforeLines[2].replace(priorHashes[0], nextManifestSha256) ===
        afterLines[2],
    "TS006 asset-inventory refresh must change exactly one manifest SHA-256 cell",
  );
  return {
    row: 3,
    field: "sha256",
    priorSha256: priorHashes[0],
    nextSha256: nextManifestSha256,
    allOtherBytesUnchanged: true,
  };
}

async function buildInventoryObserverReconciliation({
  currentReport,
  inputs,
  outputs,
  plannedPreimage,
}) {
  validateSpecializedRefreshPreimageOwnership({
    report: currentReport.value,
    observedBindings: currentWorkspaceBindings(inputs),
  });
  const observerRefreshTransaction =
    await inventoryObserverTransactionWitness(inputs);
  const nextAssetInventory = outputBindings(outputs).assetInventory;
  const plannedAssetInventory =
    plannedPreimage?.bindings?.[ASSET_INVENTORY_PATH];
  const plannedWorkspaceReport = plannedPreimage?.bindings?.[REPORT_PATH];
  invariant(
    sameBinding(
      plannedAssetInventory,
      currentReport.value.after.assetInventory,
    ) &&
      sameBinding(plannedWorkspaceReport, currentReport.binding) &&
      plannedAssetInventory.sha256 ===
        observerRefreshTransaction.canonicalAssetInventory.sha256,
    "TS006 planned immutable preimage does not bind the exact c659 specialized-writer state",
  );
  const witness = {
    historyIndex: (currentReport.value.refreshHistory || []).length,
    priorReportSha256: currentReport.binding.sha256,
    immutablePreimage: plannedPreimage,
    assetInventory: plannedAssetInventory,
  };
  invariant(
    inputs.inventoryObserverReceipt.binding.sha256 ===
      EXPECTED_INVENTORY_RECONCILIATION_TRANSITION.observerReceiptSha256 &&
      inputs.inventoryObserverReceipt.value.canonicalInventoryFiles
        .assetInventory.sha256 ===
        EXPECTED_INVENTORY_RECONCILIATION_TRANSITION.observerAssetInventorySha256 &&
      currentReport.binding.sha256 ===
        EXPECTED_INVENTORY_RECONCILIATION_TRANSITION.currentWorkspaceReportSha256 &&
      inputs.sourceBindings.currentJavascriptCandidate.sha256 ===
        EXPECTED_INVENTORY_RECONCILIATION_TRANSITION.currentCandidateReportSha256 &&
      inputs.candidate.reportFingerprintSha256 ===
        EXPECTED_INVENTORY_RECONCILIATION_TRANSITION.currentCandidateFingerprintSha256 &&
      inputs.candidate.outputs.canvasManifest.sha256 ===
        EXPECTED_INVENTORY_RECONCILIATION_TRANSITION.currentAssetManifestSha256 &&
      currentReport.value.after.assetInventory.sha256 ===
        EXPECTED_INVENTORY_RECONCILIATION_TRANSITION.currentAssetInventorySha256 &&
      nextAssetInventory.sha256 ===
        EXPECTED_INVENTORY_RECONCILIATION_TRANSITION.nextAssetInventorySha256,
    "TS006 allowlisted cross-writer inventory reconciliation transition drifted",
  );
  const exactCellTransition = validateExactAssetInventoryManifestCellTransition(
    {
      beforeBytes: inputs.assetInventoryBytes,
      afterBytes: outputs.assetInventoryBytes,
      nextManifestSha256: inputs.candidate.outputs.canvasManifest.sha256,
    },
  );
  return {
    schemaVersion: 1,
    transitionId: EXPECTED_INVENTORY_RECONCILIATION_TRANSITION.transitionId,
    evidenceType:
      "g4-l3-ts006-current-javascript-asset-inventory-cross-writer-reconciliation",
    applicationStatus: "prepared-intent-not-standalone-application-proof",
    status: "cross-writer-lineage-verified-observer-remains-stale",
    workspaceReportPreimage: currentReport.binding,
    observerReceipt: inputs.inventoryObserverReceipt.binding,
    observerAssetInventory:
      inputs.inventoryObserverReceipt.value.canonicalInventoryFiles
        .assetInventory,
    specializedWriterCurrentAssetInventory:
      currentReport.value.after.assetInventory,
    specializedWriterNextAssetInventory: nextAssetInventory,
    currentJavascriptCandidate:
      inputs.sourceBindings.currentJavascriptCandidate,
    currentJavascriptCandidateFingerprintSha256:
      inputs.candidate.reportFingerprintSha256,
    candidateAssetManifest: {
      path: inputs.candidate.outputs.canvasManifest.path,
      bytes: inputs.candidate.outputs.canvasManifest.bytes,
      sha256: inputs.candidate.outputs.canvasManifest.sha256,
    },
    specializedWriterCurrentAssetInventorySemanticFields:
      assetInventorySemanticFields(inputs.assetInventoryBytes),
    specializedWriterNextAssetInventorySemanticFields:
      assetInventorySemanticFields(outputs.assetInventoryBytes),
    exactCellTransition,
    lineageWitness: witness,
    observerRefreshTransaction,
    conflictPreserved: true,
    observerReceiptRewrittenByThisWriter: false,
    observerExplicitlyStaleAfterSpecializedRefresh: true,
    sourceAssetsChanged: false,
    protectedPinsChanged: false,
    acceptanceChanged: false,
    completionOrReleaseLedgerChanged: false,
    strictAcceptanceEffect: "none",
  };
}

export function buildImmutableInventoryReconciliationReceipt({
  reconciliation,
  generator,
}) {
  invariant(
    reconciliation?.evidenceType ===
      "g4-l3-ts006-current-javascript-asset-inventory-cross-writer-reconciliation" &&
      reconciliation.applicationStatus ===
        "prepared-intent-not-standalone-application-proof" &&
      reconciliation.conflictPreserved === true &&
      reconciliation.observerReceiptRewrittenByThisWriter === false &&
      reconciliation.observerExplicitlyStaleAfterSpecializedRefresh === true &&
      reconciliation.observerRefreshTransaction?.transactionId ===
        GLOBAL_INVENTORY_REFRESH_TRANSITION.transactionId &&
      reconciliation.lineageWitness?.immutablePreimage?.preimageSetSha256 &&
      reconciliation.sourceAssetsChanged === false &&
      reconciliation.protectedPinsChanged === false &&
      reconciliation.acceptanceChanged === false &&
      reconciliation.completionOrReleaseLedgerChanged === false &&
      reconciliation.strictAcceptanceEffect === "none" &&
      generator?.path === relative(SCRIPT_PATH) &&
      /^[a-f0-9]{64}$/u.test(generator.sha256),
    "TS006 immutable inventory reconciliation receipt inputs are invalid",
  );
  const withoutFingerprint = {
    schemaVersion: 1,
    receiptType:
      "g4-l3-ts006-current-javascript-asset-inventory-cross-writer-reconciliation-intent",
    transactionSemantics:
      "content-addressed-no-replace-prepared-intent; application requires the workspace report refresh-history binding",
    generator,
    reconciliation,
    writeContract: {
      contentAddressed: true,
      noReplace: true,
      compareAndSwapRequired: true,
      orphanPreparedReceiptIsNotApplicationProof: true,
      sourceAssetsWritable: false,
      protectedPinsWritable: false,
      acceptanceWritable: false,
      completionOrReleaseLedgerWritable: false,
    },
    strictAcceptanceEffect: "none",
  };
  const receiptFingerprintSha256 = sha256(
    Buffer.from(pretty(withoutFingerprint)),
  );
  const document = {
    ...withoutFingerprint,
    receiptFingerprintSha256,
  };
  const bytes = Buffer.from(pretty(document));
  const receiptPath =
    `${INVENTORY_RECONCILIATION_RECEIPT_ROOT}/` +
    `${receiptFingerprintSha256}.json`;
  return {
    path: receiptPath,
    bytes,
    binding: {
      path: receiptPath,
      bytes: bytes.length,
      sha256: sha256(bytes),
      receiptFingerprintSha256,
    },
    document,
  };
}

async function writeImmutableInventoryReconciliationReceipt(receipt) {
  const target = path.join(ROOT, receipt.path);
  await mkdir(path.dirname(target), { recursive: true });
  const existingMetadata = await lstat(target).catch((error) =>
    error.code === "ENOENT" ? null : Promise.reject(error),
  );
  if (existingMetadata) {
    invariant(
      existingMetadata.isFile() &&
        !existingMetadata.isSymbolicLink() &&
        existingMetadata.nlink === 1 &&
        (existingMetadata.mode & 0o777) === 0o444,
      "TS006 immutable inventory reconciliation receipt path is unsafe",
    );
    invariant(
      (await readFile(target)).equals(receipt.bytes),
      "TS006 immutable inventory reconciliation receipt collision",
    );
    return { ...receipt.binding, reusedExistingExactBytes: true };
  }
  await writeFile(target, receipt.bytes, { flag: "wx", mode: 0o444 });
  return { ...receipt.binding, reusedExistingExactBytes: false };
}

function refreshWorkspaceChanges({ inputs, outputs }) {
  return [
    {
      path: MIGRATION_PATH,
      before: inputs.manifestBytes,
      after: outputs.manifestBytes,
    },
    {
      path: ASSET_INVENTORY_PATH,
      before: inputs.assetInventoryBytes,
      after: outputs.assetInventoryBytes,
    },
    {
      path: BRIEF_PATH,
      before: inputs.briefBytes,
      after: outputs.briefBytes,
    },
  ].filter(({ before, after }) => !before.equals(after));
}

async function atomicWrite(file, bytes) {
  const temporary = `${file}.pending-${process.pid}`;
  await writeFile(temporary, bytes, { flag: "wx" });
  await rename(temporary, file);
}

async function assertExactPreimage(relativePath, expectedBytes) {
  const observed = await readFile(path.join(ROOT, relativePath));
  invariant(
    observed.equals(expectedBytes),
    `CAS precondition failed; ${relativePath} changed after input validation`,
  );
}

export function describeImmutableRefreshPreimage(files) {
  invariant(
    Array.isArray(files) &&
      files.length > 0 &&
      files.every(
        (file) =>
          Buffer.isBuffer(file?.before) &&
          validateNormalizedProjectRelativePath(file.path),
      ),
    "TS006 immutable refresh preimage inputs are invalid",
  );
  invariant(
    new Set(files.map(({ path: relativePath }) => relativePath)).size ===
      files.length &&
      new Set(
        files.map(({ path: relativePath }) => path.basename(relativePath)),
      ).size === files.length,
    "TS006 immutable refresh preimage paths or basenames collide",
  );
  const bindings = Object.fromEntries(
    files.map(({ path: relativePath, before }) => [
      relativePath,
      { path: relativePath, bytes: before.length, sha256: sha256(before) },
    ]),
  );
  const preimageSetSha256 = sha256(Buffer.from(pretty(bindings)));
  const backupRoot = `work/g4-l3-v2-ts006-current-js-binding-refresh-preimages/${preimageSetSha256}`;
  return {
    root: backupRoot,
    preimageSetSha256,
    bindings,
    ignoredWorkArtifact: true,
  };
}

async function immutableRefreshPreimage(files, descriptor) {
  const expected = describeImmutableRefreshPreimage(files);
  invariant(
    pretty(descriptor) === pretty(expected),
    "TS006 immutable refresh preimage descriptor drifted before write",
  );
  const backupRoot = descriptor.root;
  await mkdir(path.join(ROOT, backupRoot), { recursive: true });
  for (const file of files) {
    const destination = path.join(ROOT, backupRoot, path.basename(file.path));
    const existing = await readFile(destination).catch((error) =>
      error.code === "ENOENT" ? null : Promise.reject(error),
    );
    if (existing) {
      invariant(
        existing.equals(file.before),
        `immutable refresh preimage collision: ${destination}`,
      );
      continue;
    }
    await writeFile(destination, file.before, {
      flag: "wx",
      mode: 0o444,
    });
    await chmod(destination, 0o444);
  }
  await validateImmutableRefreshPreimage(descriptor);
  return descriptor;
}

async function replaceSelectedOutputsWithRollback(files) {
  const written = [];
  try {
    for (const file of files) {
      await assertExactPreimage(file.path, file.before);
      await atomicWrite(path.join(ROOT, file.path), file.after);
      written.push(file);
    }
  } catch (error) {
    for (const file of written.reverse()) {
      await atomicWrite(path.join(ROOT, file.path), file.before);
    }
    throw error;
  } finally {
    for (const file of files) {
      await removeIfPresent(
        `${path.join(ROOT, file.path)}.pending-${process.pid}`,
      );
    }
  }
}

async function removeIfPresent(file) {
  await unlink(file).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}

async function replaceOutputsWithRollback(inputs, outputs) {
  const files = [
    {
      path: MIGRATION_PATH,
      before: inputs.manifestBytes,
      after: outputs.manifestBytes,
    },
    {
      path: COVERAGE_PATH,
      before: inputs.coverageBytes,
      after: outputs.coverageBytes,
    },
    {
      path: ASSET_INVENTORY_PATH,
      before: inputs.assetInventoryBytes,
      after: outputs.assetInventoryBytes,
    },
    { path: BRIEF_PATH, before: inputs.briefBytes, after: outputs.briefBytes },
  ];
  const written = [];
  try {
    for (const file of files) {
      await atomicWrite(path.join(ROOT, file.path), file.after);
      written.push(file);
    }
  } catch (error) {
    for (const file of written.reverse())
      await atomicWrite(path.join(ROOT, file.path), file.before);
    throw error;
  } finally {
    for (const file of files)
      await removeIfPresent(
        `${path.join(ROOT, file.path)}.pending-${process.pid}`,
      );
  }
}

export function buildWorkspaceBindingMarkdown(report) {
  const successorReceipt =
    report.refreshHistory?.at(-1)?.immutableObserverSuccessorReceipt;
  return (
    `# G4 L3 TS006 Current-JavaScript Workspace Binding\n\n` +
    `The existing source-static Canvas output and exact same-origin user-activated Spanish host-audio control are explicitly bound into the TS006 migration workspace as engineering candidates. This is specification, product-QA, and provenance work only.\n\n` +
    `- Migration status: **${report.summary.migrationStatusBefore} → ${report.summary.migrationStatusAfter}**.\n` +
    `- Declared renderer frame domains: **${report.summary.declaredFrameDomains}**.\n` +
    `- Pending natural-trace requirements: **${report.summary.pendingRequirements}**.\n` +
    `- Candidate sprite-23 frames executed: **${report.summary.executedCandidateFrames}/128**; unique visual hashes: **${report.summary.uniqueCandidateVisuals}**.\n` +
    `- Spanish host-audio current-JS candidate: **user-activated / same-origin / embedded audio disabled**.\n` +
    `- Original-runtime sessions / RMSE / strict completions: **0 / 0 / 0**.\n` +
    `- Preimages: ignored \`${report.backup.root}\`; set SHA-256 \`${report.backup.preimageSetSha256}\`.\n\n` +
    `Root, Spanish visuals, embedded audio, source-media matching, spoken content, authoritative listening, original-host semantics, synchronization, interaction, Replay, fidelity, accessibility, human review, Owner acceptance, and publication remain fail-closed.\n` +
    (successorReceipt
      ? `\nReceipt-only observer successor: \`${successorReceipt.path}\` (` +
        `SHA-256 \`${successorReceipt.sha256}\`). No migration workspace document or acceptance state was changed.\n`
      : "")
  );
}

function buildReport({ inputs, outputs, before, backup, generator }) {
  return {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-current-javascript-workspace-binding",
    generator,
    scope: {
      animationId: TS006_ANIMATION_ID,
      releaseId: "lesson-g04-l03-negative-numbers",
      sequence: 34,
    },
    sourceBindings: inputs.sourceBindings,
    before,
    after: outputBindings(outputs),
    backup,
    summary: {
      migrationStatusBefore: inputs.manifest.status,
      migrationStatusAfter: outputs.manifest.status,
      confidenceAfter: outputs.manifest.confidence,
      declaredFrameDomains: outputs.manifest.implementation.frameDomains.length,
      pendingRequirements: outputs.coverage.requirements.length,
      executedCandidateFrames:
        inputs.candidate.candidateRenderability.executedFrameCount,
      uniqueCandidateVisuals:
        inputs.candidate.candidateRenderability.uniqueVisualFrameCount,
      spanishHostAudioEngineeringCandidate: true,
      embeddedAudioEnabled: false,
      sourceMediaMatchEstablished: false,
      authoritativeListeningComplete: false,
      originalRuntimeSessions: 0,
      rmseComparisons: 0,
      strictCompletions: 0,
    },
    disposition: {
      migrationWorkspaceChanged: true,
      currentJavascriptCandidateBound: true,
      currentJavascriptCandidateOnly: true,
      sourceAssetsChanged: false,
      completionLedgerChanged: false,
      approvalOrPinChanged: false,
      productRouteAddedByThisMaterializer: false,
      migrationStatusChanged: false,
    },
    acceptance: {
      implementationAuthorized: false,
      authoritativeOriginalRuntimeComplete: false,
      naturalRuntimeReachabilityComplete: false,
      bilingualVisualParityComplete: false,
      audioAccepted: false,
      replayParityComplete: false,
      fullFrameRmseComplete: false,
      accessibilityQaComplete: false,
      humanVisualReviewAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
    },
    strictAcceptanceEffect:
      "none; this binds an existing current-JavaScript engineering candidate and its unresolved obligations without authorizing fidelity, acceptance, ledger admission, or publication",
  };
}

export function buildObserverSuccessorRefreshedReport({
  currentReport,
  currentModel,
  successorRebind,
  immutableReceiptBinding,
}) {
  validateInventoryObserverSuccessorRebind(successorRebind);
  invariant(
    sameBinding(
      currentReport.binding,
      successorRebind.predecessor.workspaceBindingReport,
    ) &&
      immutableReceiptBinding?.path?.startsWith(
        `${INVENTORY_RECONCILIATION_RECEIPT_ROOT}/`,
      ) &&
      path.basename(immutableReceiptBinding.path) ===
        `${immutableReceiptBinding.receiptFingerprintSha256}.json` &&
      Number.isSafeInteger(immutableReceiptBinding.bytes) &&
      /^[a-f0-9]{64}$/u.test(immutableReceiptBinding.sha256 || "") &&
      Object.values(currentModel.acceptance || {}).every(
        (value) => value === false,
      ),
    "TS006 successor report inputs are stale or promoted",
  );
  return {
    ...currentReport.value,
    ...currentModel,
    before: currentReport.value.before,
    backup: currentReport.value.backup,
    refreshHistory: [
      ...(currentReport.value.refreshHistory || []),
      {
        priorReportSha256: currentReport.binding.sha256,
        workspaceDocumentsRewritten: false,
        rewrittenWorkspaceDocuments: [],
        coverageRewritten: false,
        compareAndSwapPreconditionsRequired: true,
        immutablePreimage: null,
        historicalInventoryObserverReconciliationPreserved: true,
        observerSuccessorRebind: successorRebind,
        immutableObserverSuccessorReceipt: immutableReceiptBinding,
        acceptanceChanged: false,
        completionOrReleaseLedgerChanged: false,
        strictAcceptanceEffect: "none",
        disposition:
          "receipt-only-observer-successor-rebind-after-exact-workspace-validation",
      },
    ],
  };
}

export function validateWorkspaceBindingReport({
  report,
  inputs,
  outputs,
  generator,
}) {
  invariant(
    report.reportType === "g4-l3-ts006-current-javascript-workspace-binding" &&
      report.schemaVersion === 1,
    "TS006 current-JavaScript workspace-binding report identity drifted",
  );
  invariant(
    pretty(report.generator) === pretty(generator),
    "TS006 workspace-binding generator binding is stale",
  );
  invariant(
    pretty(report.sourceBindings) === pretty(inputs.sourceBindings),
    "TS006 workspace-binding source chain is stale",
  );
  invariant(
    pretty(report.after) === pretty(outputBindings(outputs)),
    "TS006 workspace-binding output hashes are stale",
  );
  invariant(
    report.summary?.migrationStatusAfter === "preserved" &&
      report.summary?.pendingRequirements === 4 &&
      report.summary?.spanishHostAudioEngineeringCandidate === true &&
      report.summary?.embeddedAudioEnabled === false &&
      report.summary?.sourceMediaMatchEstablished === false &&
      report.summary?.authoritativeListeningComplete === false &&
      report.summary?.originalRuntimeSessions === 0 &&
      report.summary?.strictCompletions === 0 &&
      Object.values(report.acceptance || {}).every(
        (value) => value === false,
      ) &&
      report.strictAcceptanceEffect?.startsWith("none;"),
    "TS006 workspace binding was promoted or regressed",
  );
  return report;
}

async function validateImmutableInventoryReconciliationReceiptBinding({
  binding,
  reconciliation,
  generator,
  root = ROOT,
}) {
  invariant(
    binding?.path?.startsWith(`${INVENTORY_RECONCILIATION_RECEIPT_ROOT}/`) &&
      binding.path.endsWith(".json") &&
      Number.isSafeInteger(binding.bytes) &&
      /^[a-f0-9]{64}$/u.test(binding.sha256) &&
      /^[a-f0-9]{64}$/u.test(binding.receiptFingerprintSha256),
    "TS006 immutable inventory reconciliation receipt binding is invalid",
  );
  const expectedName = `${binding.receiptFingerprintSha256}.json`;
  invariant(
    path.basename(binding.path) === expectedName,
    "TS006 immutable inventory reconciliation receipt is not content addressed",
  );
  const immutable = await readSafeRegularBinding(binding.path, {
    root,
    requiredMode: 0o444,
  });
  const bytes = immutable.bytes;
  invariant(
    sameBinding(immutable.binding, binding),
    "TS006 immutable inventory reconciliation receipt bytes drifted",
  );
  const document = JSON.parse(bytes);
  const { receiptFingerprintSha256, ...withoutFingerprint } = document;
  invariant(
    receiptFingerprintSha256 === binding.receiptFingerprintSha256 &&
      sha256(Buffer.from(pretty(withoutFingerprint))) ===
        receiptFingerprintSha256 &&
      pretty(document.reconciliation) === pretty(reconciliation) &&
      pretty(document.generator) === pretty(generator) &&
      document.writeContract?.contentAddressed === true &&
      document.writeContract?.noReplace === true &&
      document.writeContract?.compareAndSwapRequired === true &&
      document.writeContract?.orphanPreparedReceiptIsNotApplicationProof ===
        true &&
      Object.values({
        sourceAssetsWritable: document.writeContract?.sourceAssetsWritable,
        protectedPinsWritable: document.writeContract?.protectedPinsWritable,
        acceptanceWritable: document.writeContract?.acceptanceWritable,
        completionOrReleaseLedgerWritable:
          document.writeContract?.completionOrReleaseLedgerWritable,
      }).every((value) => value === false) &&
      document.strictAcceptanceEffect === "none",
    "TS006 immutable inventory reconciliation receipt is stale or exceeds authority",
  );
  return document;
}

function lastHistoricalInventoryReconciliationEntry(report) {
  const historicalEntries = (report.refreshHistory || [])
    .map((entry, historyIndex) => ({ entry, historyIndex }))
    .filter(({ entry }) => entry.inventoryObserverReconciliation);
  invariant(
    historicalEntries.length >= 1,
    "TS006 historical inventory reconciliation lineage is missing",
  );
  return historicalEntries.at(-1);
}

async function validateHistoricalInventoryReconciliationAncestor({
  report,
  root = ROOT,
  predecessorGenerator =
    EXPECTED_OBSERVER_SUCCESSOR_REBIND.predecessorGenerator,
}) {
  const { entry, historyIndex } =
    lastHistoricalInventoryReconciliationEntry(report);
  const reconciliation = entry.inventoryObserverReconciliation;
  const expected = EXPECTED_OBSERVER_SUCCESSOR_REBIND;
  invariant(
    reconciliation?.schemaVersion === 1 &&
      reconciliation.transitionId ===
        EXPECTED_INVENTORY_RECONCILIATION_TRANSITION.transitionId &&
      reconciliation.status ===
        "cross-writer-lineage-verified-observer-remains-stale" &&
      sameBinding(
        reconciliation.observerReceipt,
        expected.predecessorObserverReceipt,
      ) &&
      reconciliation.observerAssetInventory?.sha256 ===
        EXPECTED_INVENTORY_RECONCILIATION_TRANSITION
          .observerAssetInventorySha256 &&
      sameBinding(
        reconciliation.specializedWriterNextAssetInventory,
        expected.workspaceDocuments.assetInventory,
      ) &&
      reconciliation.conflictPreserved === true &&
      reconciliation.observerReceiptRewrittenByThisWriter === false &&
      reconciliation.observerExplicitlyStaleAfterSpecializedRefresh === true &&
      reconciliation.sourceAssetsChanged === false &&
      reconciliation.protectedPinsChanged === false &&
      reconciliation.acceptanceChanged === false &&
      reconciliation.completionOrReleaseLedgerChanged === false &&
      reconciliation.strictAcceptanceEffect === "none",
    "TS006 historical cross-writer reconciliation was erased, rewritten, or promoted",
  );
  invariant(
    sameBinding(
      entry.immutableReconciliationReceipt,
      expected.predecessorImmutableReceipt,
    ),
    "TS006 historical immutable reconciliation receipt binding drifted",
  );
  await validateImmutableInventoryReconciliationReceiptBinding({
    binding: entry.immutableReconciliationReceipt,
    reconciliation,
    generator: predecessorGenerator,
    root,
  });
  await validateImmutableRefreshPreimage(reconciliation.lineageWitness.immutablePreimage, {
    root,
  });
  const archivedAssetBinding =
    reconciliation.lineageWitness.immutablePreimage.bindings[
      ASSET_INVENTORY_PATH
    ];
  invariant(
    sameBinding(
      archivedAssetBinding,
      reconciliation.specializedWriterCurrentAssetInventory,
    ) &&
      reconciliation.lineageWitness.historyIndex === historyIndex &&
      reconciliation.lineageWitness.priorReportSha256 ===
        reconciliation.workspaceReportPreimage.sha256 &&
      reconciliation.observerRefreshTransaction?.transactionId ===
        GLOBAL_INVENTORY_REFRESH_TRANSITION.transactionId &&
      sameBinding(
        reconciliation.observerRefreshTransaction.plan,
        GLOBAL_INVENTORY_REFRESH_TRANSITION.plan,
      ) &&
      sameBinding(
        reconciliation.observerRefreshTransaction.receipt,
        GLOBAL_INVENTORY_REFRESH_TRANSITION.receipt,
      ) &&
      sameBinding(
        reconciliation.observerRefreshTransaction.preimageArchiveManifest,
        GLOBAL_INVENTORY_REFRESH_TRANSITION.preimageArchiveManifest,
      ),
    "TS006 historical reconciliation ancestor lineage is stale",
  );
  return {
    historyIndex,
    reconciliation,
    immutableReceipt: bindingWithoutStat(
      entry.immutableReconciliationReceipt,
    ),
    predecessorGenerator,
  };
}

function validateCurrentAcceptanceNeutralInventoryObserver({
  observer,
  observerBinding,
  assetInventoryBinding,
}) {
  validateMaterializationReceipt(observer);
  const expected = EXPECTED_OBSERVER_SUCCESSOR_REBIND;
  invariant(
    observer.schemaVersion === 2 &&
      sameBinding(observerBinding, expected.currentObserverReceipt) &&
      sameBinding(
        observer.canonicalInventoryFiles?.assetInventory,
        expected.workspaceDocuments.assetInventory,
      ) &&
      observer.canonicalInventoryFiles.assetInventory.changedByMaterializer ===
        false &&
      sameBinding(assetInventoryBinding, expected.workspaceDocuments.assetInventory) &&
      Object.values(observer.acceptance || {}).length > 0 &&
      Object.values(observer.acceptance || {}).every((value) => value === false) &&
      observer.strictAcceptanceEffect === "none" &&
      /^[a-f0-9]{64}$/u.test(observer.reportFingerprintSha256 || "") &&
      sameBinding(
        observer.sourceBindings?.lessonRelease,
        expected.ledgers.releaseDeclaration,
      ),
    "TS006 current inventory observer is not the exact acceptance-neutral 634e successor",
  );
  return observer;
}

async function readAndValidateLockedBindings(
  expectedBindings,
  { root = ROOT, label } = {},
) {
  const observed = {};
  for (const [key, expected] of Object.entries(expectedBindings)) {
    const artifact = await readSafeRegularBinding(expected.path, { root });
    invariant(
      sameBinding(artifact.binding, expected),
      `TS006 ${label} changed before successor rebind: ${expected.path}`,
    );
    observed[key] = artifact.binding;
  }
  return observed;
}

async function buildInventoryObserverSuccessorRebind({
  currentReport,
  currentMarkdown,
  inputs,
  outputs,
  generator,
  root = ROOT,
}) {
  const expected = EXPECTED_OBSERVER_SUCCESSOR_REBIND;
  invariant(
    sameBinding(currentReport.binding, expected.predecessorWorkspaceReport),
    "TS006 observer successor predecessor report is not the locked canonical report",
  );
  const currentMarkdownBinding = {
    path: MARKDOWN_PATH,
    bytes: currentMarkdown.length,
    sha256: sha256(currentMarkdown),
  };
  invariant(
    sameBinding(
      currentMarkdownBinding,
      expected.predecessorWorkspaceMarkdown,
    ),
    "TS006 observer successor predecessor Markdown drifted",
  );
  const observedWorkspace = currentWorkspaceBindings(inputs);
  invariant(
    pretty(observedWorkspace) === pretty(outputBindings(outputs)) &&
      pretty(observedWorkspace) === pretty(expected.workspaceDocuments),
    "TS006 observer successor requires four exact unchanged workspace documents",
  );
  const historical = await validateHistoricalInventoryReconciliationAncestor({
    report: currentReport.value,
    root,
  });
  validateCurrentAcceptanceNeutralInventoryObserver({
    observer: inputs.inventoryObserverReceipt.value,
    observerBinding: inputs.inventoryObserverReceipt.binding,
    assetInventoryBinding: observedWorkspace.assetInventory,
  });
  const [ledgers, protectedPins, casEngineArtifact] = await Promise.all([
    readAndValidateLockedBindings(expected.ledgers, {
      root,
      label: "completion/release ledger",
    }),
    readAndValidateLockedBindings(expected.protectedPins, {
      root,
      label: "protected pin",
    }),
    readSafeRegularBinding(WAVE2B_CAS_ENGINE_PATH, { root }),
  ]);
  const successorRebind = {
    schemaVersion: 1,
    transitionId: expected.transitionId,
    evidenceType:
      "g4-l3-ts006-current-javascript-inventory-observer-successor-rebind",
    status:
      "receipt-only-successor-observer-rebound-after-historical-conflict-reconciliation",
    predecessor: {
      workspaceBindingReport: currentReport.binding,
      workspaceBindingMarkdown: currentMarkdownBinding,
      workspaceBindingReportGenerator: historical.predecessorGenerator,
      immutableReconciliationReceipt: historical.immutableReceipt,
      historicalReconciliationTransitionId:
        historical.reconciliation.transitionId,
      historicalObserverReceipt:
        historical.reconciliation.observerReceipt,
      historicalObserverAssetInventory:
        historical.reconciliation.observerAssetInventory,
      specializedWriterConvergedAssetInventory:
        historical.reconciliation.specializedWriterNextAssetInventory,
      historicalConflictPreserved: true,
      historicalObserverWasExplicitlyStale: true,
    },
    successor: {
      observerReceipt: inputs.inventoryObserverReceipt.binding,
      canonicalAssetInventory:
        inputs.inventoryObserverReceipt.value.canonicalInventoryFiles
          .assetInventory,
      observerSchemaVersion: inputs.inventoryObserverReceipt.value.schemaVersion,
      observerReportFingerprintSha256:
        inputs.inventoryObserverReceipt.value.reportFingerprintSha256,
      acceptanceNeutral: true,
      observerNowMatchesSpecializedWriterAssetInventory: true,
      independentlyValidatedCurrentPostState: true,
      oldTransactionProvesCurrentObserver: false,
    },
    unchangedWorkspaceDocuments: observedWorkspace,
    ledgers,
    protectedPins,
    generator,
    casEngine: casEngineArtifact.binding,
    writeSet: {
      reportJson: REPORT_PATH,
      reportMarkdown: MARKDOWN_PATH,
      immutableSuccessorReceiptRoot:
        INVENTORY_RECONCILIATION_RECEIPT_ROOT,
      workspaceDocuments: [],
      sourceAssets: [],
      protectedPins: [],
      completionOrReleaseLedgers: [],
    },
    compareAndSwapPreconditions: {
      predecessorWorkspaceReport: currentReport.binding,
      predecessorWorkspaceMarkdown: currentMarkdownBinding,
      predecessorImmutableReconciliationReceipt:
        historical.immutableReceipt,
      currentObserverReceipt: inputs.inventoryObserverReceipt.binding,
      unchangedWorkspaceDocuments: observedWorkspace,
      ledgers,
      protectedPins,
      casEngine: casEngineArtifact.binding,
    },
    historicalConflictErased: false,
    sourceAssetsChanged: false,
    protectedPinsChanged: false,
    acceptanceChanged: false,
    completionOrReleaseLedgerChanged: false,
    strictAcceptanceEffect: "none",
  };
  return validateInventoryObserverSuccessorRebind(successorRebind);
}

export function validateInventoryObserverSuccessorRebind(successorRebind) {
  const expected = EXPECTED_OBSERVER_SUCCESSOR_REBIND;
  invariant(
    successorRebind?.schemaVersion === 1 &&
      successorRebind.transitionId === expected.transitionId &&
      successorRebind.evidenceType ===
        "g4-l3-ts006-current-javascript-inventory-observer-successor-rebind" &&
      successorRebind.predecessor?.historicalConflictPreserved === true &&
      successorRebind.predecessor?.historicalObserverWasExplicitlyStale ===
        true &&
      sameBinding(
        successorRebind.predecessor?.immutableReconciliationReceipt,
        expected.predecessorImmutableReceipt,
      ) &&
      sameBinding(
        successorRebind.predecessor?.workspaceBindingReportGenerator,
        expected.predecessorGenerator,
      ) &&
      sameBinding(
        successorRebind.predecessor?.historicalObserverReceipt,
        expected.predecessorObserverReceipt,
      ) &&
      sameBinding(
        successorRebind.successor?.observerReceipt,
        expected.currentObserverReceipt,
      ) &&
      sameBinding(
        successorRebind.successor?.canonicalAssetInventory,
        expected.workspaceDocuments.assetInventory,
      ) &&
      successorRebind.successor?.acceptanceNeutral === true &&
      successorRebind.successor
        ?.observerNowMatchesSpecializedWriterAssetInventory === true &&
      successorRebind.successor?.independentlyValidatedCurrentPostState ===
        true &&
      successorRebind.successor?.oldTransactionProvesCurrentObserver ===
        false &&
      pretty(successorRebind.unchangedWorkspaceDocuments) ===
        pretty(expected.workspaceDocuments) &&
      pretty(successorRebind.ledgers) === pretty(expected.ledgers) &&
      pretty(successorRebind.protectedPins) ===
        pretty(expected.protectedPins) &&
      successorRebind.casEngine?.path === WAVE2B_CAS_ENGINE_PATH &&
      Number.isSafeInteger(successorRebind.casEngine?.bytes) &&
      /^[a-f0-9]{64}$/u.test(successorRebind.casEngine?.sha256 || "") &&
      sameBinding(
        successorRebind.compareAndSwapPreconditions
          ?.predecessorWorkspaceReport,
        successorRebind.predecessor.workspaceBindingReport,
      ) &&
      sameBinding(
        successorRebind.compareAndSwapPreconditions
          ?.predecessorWorkspaceMarkdown,
        successorRebind.predecessor.workspaceBindingMarkdown,
      ) &&
      sameBinding(
        successorRebind.compareAndSwapPreconditions
          ?.predecessorImmutableReconciliationReceipt,
        successorRebind.predecessor.immutableReconciliationReceipt,
      ) &&
      sameBinding(
        successorRebind.compareAndSwapPreconditions?.currentObserverReceipt,
        successorRebind.successor.observerReceipt,
      ) &&
      pretty(
        successorRebind.compareAndSwapPreconditions
          ?.unchangedWorkspaceDocuments,
      ) === pretty(successorRebind.unchangedWorkspaceDocuments) &&
      pretty(successorRebind.compareAndSwapPreconditions?.ledgers) ===
        pretty(successorRebind.ledgers) &&
      pretty(successorRebind.compareAndSwapPreconditions?.protectedPins) ===
        pretty(successorRebind.protectedPins) &&
      sameBinding(
        successorRebind.compareAndSwapPreconditions?.casEngine,
        successorRebind.casEngine,
      ) &&
      successorRebind.writeSet?.workspaceDocuments?.length === 0 &&
      successorRebind.writeSet?.sourceAssets?.length === 0 &&
      successorRebind.writeSet?.protectedPins?.length === 0 &&
      successorRebind.writeSet?.completionOrReleaseLedgers?.length === 0 &&
      successorRebind.historicalConflictErased === false &&
      successorRebind.sourceAssetsChanged === false &&
      successorRebind.protectedPinsChanged === false &&
      successorRebind.acceptanceChanged === false &&
      successorRebind.completionOrReleaseLedgerChanged === false &&
      successorRebind.strictAcceptanceEffect === "none",
    "TS006 inventory observer successor rebind is stale, incomplete, or promoted",
  );
  return successorRebind;
}

export function buildImmutableInventoryObserverSuccessorReceipt({
  successorRebind,
  generator,
  receiptRoot = INVENTORY_RECONCILIATION_RECEIPT_ROOT,
}) {
  validateInventoryObserverSuccessorRebind(successorRebind);
  invariant(
    generator?.path === relative(SCRIPT_PATH) &&
      Number.isSafeInteger(generator.bytes) &&
      /^[a-f0-9]{64}$/u.test(generator.sha256 || "") &&
      pretty(successorRebind.generator) === pretty(generator),
    "TS006 immutable observer successor receipt generator is invalid",
  );
  validateNormalizedProjectRelativePath(receiptRoot, {
    label: "observer successor receipt root",
  });
  const acceptance = {
    authoritativeOriginalRuntimeComplete: false,
    audioAccepted: false,
    independentHumanVisualReviewComplete: false,
    ownerAccepted: false,
    strictComplete: false,
    releasePublished: false,
  };
  const withoutFingerprint = {
    schemaVersion: 1,
    receiptType:
      "g4-l3-ts006-current-javascript-inventory-observer-successor-rebind",
    transactionSemantics:
      "content-addressed-no-replace-receipt-only-successor-rebind",
    generator,
    successorRebind,
    writeContract: {
      contentAddressed: true,
      noReplace: true,
      compareAndSwapRequired: true,
      replayRequiresExactBytes: true,
      orphanPreparedReceiptIsNotApplicationProof: true,
      reportJsonWritable: true,
      reportMarkdownWritable: true,
      workspaceDocumentsWritable: false,
      sourceAssetsWritable: false,
      protectedPinsWritable: false,
      acceptanceWritable: false,
      completionOrReleaseLedgerWritable: false,
    },
    acceptance,
    strictAcceptanceEffect: "none",
  };
  const receiptFingerprintSha256 = sha256(
    Buffer.from(pretty(withoutFingerprint)),
  );
  const document = {
    ...withoutFingerprint,
    receiptFingerprintSha256,
  };
  const bytes = Buffer.from(pretty(document));
  const receiptPath = `${receiptRoot}/${receiptFingerprintSha256}.json`;
  return {
    path: receiptPath,
    bytes,
    binding: {
      path: receiptPath,
      bytes: bytes.length,
      sha256: sha256(bytes),
      receiptFingerprintSha256,
    },
    document,
  };
}

export async function validateImmutableInventoryObserverSuccessorReceipt({
  binding,
  successorRebind,
  generator,
  root = ROOT,
  receiptRoot = INVENTORY_RECONCILIATION_RECEIPT_ROOT,
}) {
  invariant(
    binding?.path?.startsWith(`${receiptRoot}/`) &&
      path.dirname(binding.path) === receiptRoot &&
      path.basename(binding.path) ===
        `${binding.receiptFingerprintSha256}.json`,
    "TS006 immutable observer successor receipt is not content addressed",
  );
  const artifact = await readSafeRegularBinding(binding.path, {
    root,
    requiredMode: 0o444,
  });
  invariant(
    sameBinding(artifact.binding, binding),
    "TS006 immutable observer successor receipt bytes drifted",
  );
  const document = JSON.parse(artifact.bytes);
  const { receiptFingerprintSha256, ...withoutFingerprint } = document;
  invariant(
    receiptFingerprintSha256 === binding.receiptFingerprintSha256 &&
      sha256(Buffer.from(pretty(withoutFingerprint))) ===
        receiptFingerprintSha256 &&
      pretty(document.successorRebind) === pretty(successorRebind) &&
      pretty(document.generator) === pretty(generator) &&
      Object.values(document.acceptance || {}).length === 6 &&
      Object.values(document.acceptance || {}).every(
        (value) => value === false,
      ) &&
      document.writeContract?.contentAddressed === true &&
      document.writeContract?.noReplace === true &&
      document.writeContract?.compareAndSwapRequired === true &&
      document.writeContract?.replayRequiresExactBytes === true &&
      document.writeContract?.orphanPreparedReceiptIsNotApplicationProof ===
        true &&
      document.writeContract?.reportJsonWritable === true &&
      document.writeContract?.reportMarkdownWritable === true &&
      [
        "workspaceDocumentsWritable",
        "sourceAssetsWritable",
        "protectedPinsWritable",
        "acceptanceWritable",
        "completionOrReleaseLedgerWritable",
      ].every((key) => document.writeContract?.[key] === false) &&
      document.strictAcceptanceEffect === "none",
    "TS006 immutable observer successor receipt is stale or exceeds authority",
  );
  validateInventoryObserverSuccessorRebind(document.successorRebind);
  return document;
}

async function validateSafeDirectoryTree(root, relativeDirectory) {
  validateNormalizedProjectRelativePath(relativeDirectory, {
    label: "successor receipt directory",
  });
  const absoluteRoot = path.resolve(root);
  const rootMetadata = await lstat(absoluteRoot);
  invariant(
    rootMetadata.isDirectory() && !rootMetadata.isSymbolicLink(),
    "TS006 successor root is not a real directory",
  );
  let cursor = absoluteRoot;
  for (const segment of relativeDirectory.split("/")) {
    cursor = path.join(cursor, segment);
    const metadata = await lstat(cursor);
    invariant(
      metadata.isDirectory() && !metadata.isSymbolicLink(),
      "TS006 successor receipt directory contains a symlink or non-directory",
    );
  }
  const [rootRealpath, directoryRealpath] = await Promise.all([
    realpath(absoluteRoot),
    realpath(cursor),
  ]);
  invariant(
    directoryRealpath.startsWith(`${rootRealpath}${path.sep}`),
    "TS006 successor receipt directory escaped its root",
  );
  return cursor;
}

export async function writeImmutableInventoryObserverSuccessorReceipt(
  receipt,
  {
    root = ROOT,
    receiptRoot = INVENTORY_RECONCILIATION_RECEIPT_ROOT,
  } = {},
) {
  invariant(
    receipt?.path === receipt?.binding?.path &&
      Buffer.isBuffer(receipt.bytes) &&
      receipt.bytes.length === receipt.binding.bytes &&
      sha256(receipt.bytes) === receipt.binding.sha256 &&
      path.dirname(receipt.path) === receiptRoot,
    "TS006 immutable observer successor receipt write input is invalid",
  );
  const directory = await validateSafeDirectoryTree(root, receiptRoot);
  const target = path.join(directory, path.basename(receipt.path));
  const existingMetadata = await lstat(target).catch((error) =>
    error.code === "ENOENT" ? null : Promise.reject(error),
  );
  if (existingMetadata) {
    invariant(
      existingMetadata.isFile() &&
        !existingMetadata.isSymbolicLink() &&
        existingMetadata.nlink === 1 &&
        (existingMetadata.mode & 0o777) === 0o444,
      "TS006 immutable observer successor receipt path is unsafe",
    );
    invariant(
      (await readFile(target)).equals(receipt.bytes),
      "TS006 immutable observer successor receipt collision",
    );
    await validateImmutableInventoryObserverSuccessorReceipt({
      binding: receipt.binding,
      successorRebind: receipt.document.successorRebind,
      generator: receipt.document.generator,
      root,
      receiptRoot,
    });
    return { ...receipt.binding, reusedExistingExactBytes: true };
  }
  await writeFile(target, receipt.bytes, { flag: "wx", mode: 0o444 });
  await chmod(target, 0o444);
  await validateImmutableInventoryObserverSuccessorReceipt({
    binding: receipt.binding,
    successorRebind: receipt.document.successorRebind,
    generator: receipt.document.generator,
    root,
    receiptRoot,
  });
  return { ...receipt.binding, reusedExistingExactBytes: false };
}

function uniqueCasBindings(successorRebind) {
  const byPath = new Map();
  for (const binding of flattenedBindings(
    successorRebind.compareAndSwapPreconditions,
  )) {
    const prior = byPath.get(binding.path);
    invariant(
      !prior || sameBinding(prior, binding),
      `TS006 successor CAS contains conflicting bindings for ${binding.path}`,
    );
    byPath.set(binding.path, binding);
  }
  return [...byPath.values()];
}

async function assertCasBindings(
  successorRebind,
  {
    root,
    allowAppliedReport = null,
    allowAppliedMarkdown = null,
  },
) {
  for (const expected of uniqueCasBindings(successorRebind)) {
    const observed = await readSafeRegularBinding(expected.path, {
      root,
      requiredMode:
        expected.path ===
        successorRebind.predecessor.immutableReconciliationReceipt.path
          ? 0o444
          : null,
    });
    const applied =
      (expected.path === REPORT_PATH &&
        allowAppliedReport &&
        sameBinding(observed.binding, allowAppliedReport)) ||
      (expected.path === MARKDOWN_PATH &&
        allowAppliedMarkdown &&
        sameBinding(observed.binding, allowAppliedMarkdown));
    invariant(
      sameBinding(observed.binding, expected) || applied,
      `TS006 successor CAS precondition drifted: ${expected.path}`,
    );
  }
}

async function assertProtectedSuccessorCasBindings(successorRebind, root) {
  for (const expected of uniqueCasBindings(successorRebind)) {
    if (expected.path === REPORT_PATH || expected.path === MARKDOWN_PATH) {
      continue;
    }
    const observed = await readSafeRegularBinding(expected.path, {
      root,
      requiredMode:
        expected.path ===
        successorRebind.predecessor.immutableReconciliationReceipt.path
          ? 0o444
          : null,
    });
    invariant(
      sameBinding(observed.binding, expected),
      `TS006 protected successor CAS binding drifted: ${expected.path}`,
    );
  }
}

const OBSERVER_SUCCESSOR_TRANSACTION_ROOT =
  "work/g4-l3-v2-ts006-current-js-binding-successor-transactions";

async function durableWriteNoReplace(file, bytes, mode = 0o444) {
  const handle = await open(file, "wx", 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.chmod(mode);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const directory = await open(path.dirname(file), "r");
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
}

function validateSuccessorTransactionId(transactionId) {
  invariant(
    typeof transactionId === "string" &&
      /^[a-f0-9]{64}-[a-f0-9]{32}$/u.test(transactionId),
    "TS006 successor transaction ID is invalid",
  );
  return transactionId;
}

function successorTransactionPaths(root, transactionId) {
  validateSuccessorTransactionId(transactionId);
  const relativeRoot =
    `${OBSERVER_SUCCESSOR_TRANSACTION_ROOT}/${transactionId}`;
  validateNormalizedProjectRelativePath(relativeRoot, {
    label: "successor transaction root",
    requiredPrefix: OBSERVER_SUCCESSOR_TRANSACTION_ROOT,
  });
  const absoluteRoot = path.join(path.resolve(root), relativeRoot);
  return {
    relativeRoot,
    absoluteRoot,
    lockPath: path.join(absoluteRoot, "lock"),
    planPath: path.join(absoluteRoot, "transaction-plan.json"),
    lockBindingPath: path.join(absoluteRoot, "lock-binding.json"),
    journalDirectory: path.join(absoluteRoot, "journal"),
  };
}

function buildSuccessorCasItems({
  root,
  transactionId,
  currentReport,
  currentMarkdown,
  refreshedReportBytes,
  refreshedMarkdownBytes,
}) {
  const transaction = successorTransactionPaths(root, transactionId);
  return [
    {
      id: "ts006-workspace-binding-report-json",
      relativePath: REPORT_PATH,
      preBytes: currentReport.bytes,
      postBytes: refreshedReportBytes,
    },
    {
      id: "ts006-workspace-binding-report-markdown",
      relativePath: MARKDOWN_PATH,
      preBytes: currentMarkdown.bytes,
      postBytes: refreshedMarkdownBytes,
    },
  ].map((file, index) => ({
    id: file.id,
    rootPath: path.resolve(root),
    targetPath: path.join(path.resolve(root), file.relativePath),
    tempOwnershipPath: path.join(
      transaction.absoluteRoot,
      "active",
      `${index}.temp.owner`,
    ),
    tempPath: path.join(
      transaction.absoluteRoot,
      "active",
      `${index}.post.tmp`,
    ),
    quarantinePath: path.join(
      transaction.absoluteRoot,
      "active",
      `${index}.pre.quarantine`,
    ),
    postArchivePath: path.join(
      transaction.absoluteRoot,
      "recovery",
      `${index}.post.archive`,
    ),
    preimage: {
      bytes: file.preBytes.length,
      sha256: sha256(file.preBytes),
    },
    postimage: {
      bytes: file.postBytes.length,
      sha256: sha256(file.postBytes),
    },
    postBytes: file.postBytes,
    originalMode: 0o644,
  }));
}

function publicSuccessorTransactionPlan({
  transactionId,
  receipt,
  items,
}) {
  return {
    schemaVersion: 1,
    transactionType:
      "g4-l3-ts006-observer-successor-receipt-only-wave2b-cas",
    transactionId,
    immutableReceipt: receipt.binding,
    items: items.map((item) => ({
      id: item.id,
      targetPath: portable(path.relative(item.rootPath, item.targetPath)),
      tempOwnershipPath: portable(
        path.relative(item.rootPath, item.tempOwnershipPath),
      ),
      tempPath: portable(path.relative(item.rootPath, item.tempPath)),
      quarantinePath: portable(
        path.relative(item.rootPath, item.quarantinePath),
      ),
      postArchivePath: portable(
        path.relative(item.rootPath, item.postArchivePath),
      ),
      preimage: item.preimage,
      postimage: item.postimage,
      postBytesBase64: item.postBytes.toString("base64"),
      originalMode: item.originalMode,
    })),
    sourceAssetsChanged: false,
    protectedPinsChanged: false,
    acceptanceChanged: false,
    completionOrReleaseLedgerChanged: false,
    strictAcceptanceEffect: "none",
  };
}

function itemsFromSuccessorTransactionPlan({
  root,
  plan,
  expectedTransactionId,
  immutableReceiptBinding,
  successorRebind,
}) {
  validateSuccessorTransactionId(expectedTransactionId);
  const transaction = successorTransactionPaths(root, expectedTransactionId);
  invariant(
    plan.schemaVersion === 1 &&
      plan.transactionType ===
        "g4-l3-ts006-observer-successor-receipt-only-wave2b-cas" &&
      plan.transactionId === expectedTransactionId &&
      expectedTransactionId.startsWith(
        `${immutableReceiptBinding.receiptFingerprintSha256}-`,
      ) &&
      sameBinding(plan.immutableReceipt, immutableReceiptBinding) &&
      Array.isArray(plan.items) &&
      plan.items.length === 2 &&
      plan.sourceAssetsChanged === false &&
      plan.protectedPinsChanged === false &&
      plan.acceptanceChanged === false &&
      plan.completionOrReleaseLedgerChanged === false &&
      plan.strictAcceptanceEffect === "none",
    "TS006 successor recovery transaction plan is invalid",
  );
  const exactFiles = [
    {
      id: "ts006-workspace-binding-report-json",
      targetPath: REPORT_PATH,
      preimage: successorRebind.predecessor.workspaceBindingReport,
    },
    {
      id: "ts006-workspace-binding-report-markdown",
      targetPath: MARKDOWN_PATH,
      preimage: successorRebind.predecessor.workspaceBindingMarkdown,
    },
  ];
  const decodedPostimages = plan.items.map((item) =>
    Buffer.from(item.postBytesBase64, "base64"),
  );
  const refreshedReport = JSON.parse(decodedPostimages[0]);
  const latest = refreshedReport.refreshHistory?.at(-1);
  invariant(
    pretty(latest?.observerSuccessorRebind) === pretty(successorRebind) &&
      sameBinding(
        latest?.immutableObserverSuccessorReceipt,
        immutableReceiptBinding,
      ) &&
      refreshedReport.generator?.sha256 === successorRebind.generator.sha256 &&
      Object.values(refreshedReport.acceptance || {}).every(
        (value) => value === false,
      ) &&
      refreshedReport.strictAcceptanceEffect?.startsWith("none;") &&
      decodedPostimages[1].equals(
        Buffer.from(buildWorkspaceBindingMarkdown(refreshedReport)),
      ),
    "TS006 successor recovery postimages are not receipt-derived report/Markdown",
  );
  return plan.items.map((item, index) => {
    const exact = exactFiles[index];
    const exactTransactionPaths = {
      tempOwnershipPath: portable(
        path.relative(
          path.resolve(root),
          path.join(transaction.absoluteRoot, "active", `${index}.temp.owner`),
        ),
      ),
      tempPath: portable(
        path.relative(
          path.resolve(root),
          path.join(transaction.absoluteRoot, "active", `${index}.post.tmp`),
        ),
      ),
      quarantinePath: portable(
        path.relative(
          path.resolve(root),
          path.join(
            transaction.absoluteRoot,
            "active",
            `${index}.pre.quarantine`,
          ),
        ),
      ),
      postArchivePath: portable(
        path.relative(
          path.resolve(root),
          path.join(
            transaction.absoluteRoot,
            "recovery",
            `${index}.post.archive`,
          ),
        ),
      ),
    };
    for (const key of [
      "targetPath",
      "tempOwnershipPath",
      "tempPath",
      "quarantinePath",
      "postArchivePath",
    ]) {
      validateNormalizedProjectRelativePath(item[key], {
        label: `successor recovery ${key}`,
      });
    }
    const postBytes = decodedPostimages[index];
    invariant(
      item.id === exact.id &&
        item.targetPath === exact.targetPath &&
        sameBindingContent(item.preimage, exact.preimage) &&
        Object.entries(exactTransactionPaths).every(
          ([key, expected]) => item[key] === expected,
        ) &&
      postBytes.length === item.postimage.bytes &&
        sha256(postBytes) === item.postimage.sha256 &&
        item.originalMode === 0o644,
      "TS006 successor recovery item is not the exact receipt-derived target/hash plan",
    );
    return {
      id: item.id,
      rootPath: path.resolve(root),
      targetPath: path.join(path.resolve(root), item.targetPath),
      tempOwnershipPath: path.join(
        path.resolve(root),
        item.tempOwnershipPath,
      ),
      tempPath: path.join(path.resolve(root), item.tempPath),
      quarantinePath: path.join(
        path.resolve(root),
        item.quarantinePath,
      ),
      postArchivePath: path.join(
        path.resolve(root),
        item.postArchivePath,
      ),
      preimage: item.preimage,
      postimage: item.postimage,
      postBytes,
      originalMode: item.originalMode,
    };
  });
}

async function makeDurableSuccessorJournal(transaction) {
  await mkdir(transaction.journalDirectory, {
    recursive: false,
    mode: 0o700,
  }).catch((error) => {
    if (error.code !== "EEXIST") throw error;
  });
  const [transactionRealpath, journalRealpath, journalMetadata] =
    await Promise.all([
      realpath(transaction.absoluteRoot),
      realpath(transaction.journalDirectory),
      lstat(transaction.journalDirectory),
    ]);
  invariant(
    journalMetadata.isDirectory() &&
      !journalMetadata.isSymbolicLink() &&
      journalRealpath.startsWith(`${transactionRealpath}${path.sep}`),
    "TS006 successor journal directory is unsafe",
  );
  const entries = (await readdir(transaction.journalDirectory)).sort();
  invariant(
    entries.every((name) => /^\d{6}-[a-f0-9]{64}\.json$/u.test(name)),
    "TS006 successor journal contains an unknown member",
  );
  let priorEntrySha256 = null;
  for (const [index, name] of entries.entries()) {
    const match = name.match(/^(\d{6})-([a-f0-9]{64})\.json$/u);
    const journalPath = path.join(transaction.journalDirectory, name);
    const metadata = await lstat(journalPath);
    invariant(
      metadata.isFile() &&
        !metadata.isSymbolicLink() &&
        metadata.nlink === 1 &&
        (metadata.mode & 0o777) === 0o444,
      "TS006 successor journal member is unsafe",
    );
    const bytes = await readFile(journalPath);
    const document = JSON.parse(bytes);
    const expectedSequence = index + 1;
    invariant(
      Number(match?.[1]) === expectedSequence &&
        match?.[1] === String(expectedSequence).padStart(6, "0") &&
        sha256(bytes) === match?.[2] &&
        document.schemaVersion === 1 &&
        document.transactionId ===
          path.basename(transaction.absoluteRoot) &&
        document.sequence === expectedSequence &&
        document.previousEntrySha256 === priorEntrySha256 &&
        document.event &&
        typeof document.event === "object",
      "TS006 successor journal content hash, sequence, transaction, or chain is invalid",
    );
    priorEntrySha256 = match[2];
  }
  let sequence = entries.length;
  return async (event) => {
    const [currentRealpath, currentMetadata] = await Promise.all([
      realpath(transaction.journalDirectory),
      lstat(transaction.journalDirectory),
    ]);
    invariant(
      currentRealpath === journalRealpath &&
        currentMetadata.isDirectory() &&
        !currentMetadata.isSymbolicLink(),
      "TS006 successor journal ancestor changed during the transaction",
    );
    sequence += 1;
    const bytes = Buffer.from(
      pretty({
        schemaVersion: 1,
        transactionId: path.basename(transaction.absoluteRoot),
        sequence,
        previousEntrySha256: priorEntrySha256,
        event,
      }),
    );
    const file = path.join(
      transaction.journalDirectory,
      `${String(sequence).padStart(6, "0")}-${sha256(bytes)}.json`,
    );
    await durableWriteNoReplace(file, bytes, 0o444);
    priorEntrySha256 = sha256(bytes);
  };
}

function guardSuccessorJournal(journal, successorRebind, root) {
  return async (event) => {
    await assertProtectedSuccessorCasBindings(successorRebind, root);
    await journal(event);
    await assertProtectedSuccessorCasBindings(successorRebind, root);
  };
}

function guardSuccessorHooks(testHooks, successorRebind, root) {
  const guard = () =>
    assertProtectedSuccessorCasBindings(successorRebind, root);
  return {
    ...(testHooks || {}),
    async afterState(event) {
      await guard();
      if (testHooks?.afterState) await testHooks.afterState(event);
      await guard();
    },
    async afterValidatedState(event) {
      await guard();
      if (testHooks?.afterValidatedState) {
        await testHooks.afterValidatedState(event);
      }
      await guard();
    },
  };
}

async function persistSuccessorTransaction({
  transaction,
  plan,
  lock,
}) {
  await durableWriteNoReplace(
    transaction.planPath,
    Buffer.from(pretty(plan)),
    0o444,
  );
  await durableWriteNoReplace(
    transaction.lockBindingPath,
    Buffer.from(pretty(lock.persistedBinding)),
    0o444,
  );
}

export async function recoverInventoryObserverSuccessorReceiptOnlyRebind({
  root = ROOT,
  transactionId,
  decideOwnerLiveness,
  testHooks = null,
}) {
  invariant(
    typeof decideOwnerLiveness === "function",
    "TS006 successor recovery requires an explicit exact owner-liveness decision",
  );
  const transaction = successorTransactionPaths(root, transactionId);
  const [planArtifact, lockBindingArtifact] = await Promise.all([
    readSafeRegularBinding(
      portable(path.relative(path.resolve(root), transaction.planPath)),
      { root, requiredMode: 0o444 },
    ),
    readSafeRegularBinding(
      portable(path.relative(path.resolve(root), transaction.lockBindingPath)),
      { root, requiredMode: 0o444 },
    ),
  ]);
  const plan = JSON.parse(planArtifact.bytes);
  const persistedBinding = JSON.parse(lockBindingArtifact.bytes);
  const receiptArtifact = await readSafeRegularBinding(
    plan.immutableReceipt.path,
    { root, requiredMode: 0o444 },
  );
  invariant(
    sameBinding(receiptArtifact.binding, plan.immutableReceipt),
    "TS006 successor recovery receipt binding drifted",
  );
  const receiptDocument = JSON.parse(receiptArtifact.bytes);
  const successorRebind = validateInventoryObserverSuccessorRebind(
    receiptDocument.successorRebind,
  );
  await validateImmutableInventoryObserverSuccessorReceipt({
    binding: plan.immutableReceipt,
    successorRebind,
    generator: receiptDocument.generator,
    root,
  });
  const items = itemsFromSuccessorTransactionPlan({
    root,
    plan,
    expectedTransactionId: transactionId,
    immutableReceiptBinding: plan.immutableReceipt,
    successorRebind,
  });
  const journal = guardSuccessorJournal(
    await makeDurableSuccessorJournal(transaction),
    successorRebind,
    root,
  );
  const adopted = await adoptWave2bLockForRecovery({
    rootPath: path.resolve(root),
    lockPath: transaction.lockPath,
    items,
    persistedBinding,
    decideOwnerLiveness,
    journal,
  });
  try {
    const recovery = await recoverWave2bCasBatch({
      items,
      lock: adopted,
      journal,
      hooks: guardSuccessorHooks(testHooks, successorRebind, root),
    });
    return {
      ...recovery,
      transactionId,
      restoredToPreimage: true,
      strictAcceptanceEffect: "none",
    };
  } finally {
    await releaseWave2bLock(adopted);
  }
}

export async function commitInventoryObserverSuccessorReceiptOnlyRebind({
  root = ROOT,
  receipt,
  refreshedReportBytes,
  refreshedMarkdownBytes,
  testHooks = null,
  leaveInterruptedForTest = false,
  transactionNonce = null,
}) {
  invariant(
    Buffer.isBuffer(refreshedReportBytes) &&
      Buffer.isBuffer(refreshedMarkdownBytes),
    "TS006 successor refreshed report outputs must be bytes",
  );
  validateInventoryObserverSuccessorRebind(
    receipt?.document?.successorRebind,
  );
  const successorRebind = receipt.document.successorRebind;
  invariant(
    receipt.document.generator &&
      pretty(receipt.document.generator) ===
        pretty(successorRebind.generator),
    "TS006 successor receipt generator drifted",
  );
  const refreshedReportBinding = {
    path: REPORT_PATH,
    bytes: refreshedReportBytes.length,
    sha256: sha256(refreshedReportBytes),
  };
  const refreshedMarkdownBinding = {
    path: MARKDOWN_PATH,
    bytes: refreshedMarkdownBytes.length,
    sha256: sha256(refreshedMarkdownBytes),
  };
  const parsedReport = JSON.parse(refreshedReportBytes);
  const latest = parsedReport.refreshHistory?.at(-1);
  invariant(
    pretty(latest?.observerSuccessorRebind) === pretty(successorRebind) &&
      sameBinding(latest?.immutableObserverSuccessorReceipt, receipt.binding) &&
      latest?.workspaceDocumentsRewritten === false &&
      Array.isArray(latest?.rewrittenWorkspaceDocuments) &&
      latest.rewrittenWorkspaceDocuments.length === 0 &&
      latest?.strictAcceptanceEffect === "none",
    "TS006 successor refreshed report does not bind the receipt-only transition",
  );
  const currentReport = await readSafeRegularBinding(REPORT_PATH, { root });
  const currentMarkdown = await readSafeRegularBinding(MARKDOWN_PATH, {
    root,
  });
  const replay =
    sameBinding(currentReport.binding, refreshedReportBinding) &&
    sameBinding(currentMarkdown.binding, refreshedMarkdownBinding);
  if (replay) {
    await assertCasBindings(successorRebind, {
      root,
      allowAppliedReport: refreshedReportBinding,
      allowAppliedMarkdown: refreshedMarkdownBinding,
    });
    const receiptBinding =
      await writeImmutableInventoryObserverSuccessorReceipt(receipt, {
        root,
      });
    return {
      applied: false,
      idempotentReplay: true,
      receipt: receiptBinding,
      report: refreshedReportBinding,
      markdown: refreshedMarkdownBinding,
      rewrittenWorkspaceDocuments: [],
    };
  }
  invariant(
    sameBinding(
      currentReport.binding,
      successorRebind.predecessor.workspaceBindingReport,
    ) &&
      sameBinding(
        currentMarkdown.binding,
        successorRebind.predecessor.workspaceBindingMarkdown,
      ),
    "TS006 successor report/Markdown preimage drifted",
  );
  await assertCasBindings(successorRebind, { root });
  const receiptBinding =
    await writeImmutableInventoryObserverSuccessorReceipt(receipt, {
      root,
    });
  await assertCasBindings(successorRebind, { root });
  const nonce = transactionNonce || randomBytes(16).toString("hex");
  invariant(
    /^[a-f0-9]{32}$/u.test(nonce),
    "TS006 successor transaction nonce is invalid",
  );
  const transactionId =
    `${receipt.binding.receiptFingerprintSha256}-${nonce}`;
  const transaction = successorTransactionPaths(root, transactionId);
  const items = buildSuccessorCasItems({
    root,
    transactionId,
    currentReport,
    currentMarkdown,
    refreshedReportBytes,
    refreshedMarkdownBytes,
  });
  invariant(
    items.every(
      (item) => item.preimage.sha256 !== item.postimage.sha256,
    ),
    "TS006 successor report and Markdown postimages must each differ",
  );
  const lock = await acquireWave2bLock({
    rootPath: path.resolve(root),
    lockPath: transaction.lockPath,
    owner: {
      transactionId,
      pid: process.pid,
      actorKind: "software-process",
      authority: "receipt-only-report-rebind-single-writer",
      projectOwnerRoleClaimed: false,
      humanReviewerRoleClaimed: false,
      releaseCustodianRoleClaimed: false,
    },
  });
  let retainInterruptedLock = false;
  try {
    const plan = publicSuccessorTransactionPlan({
      transactionId,
      receipt,
      items,
    });
    await persistSuccessorTransaction({ transaction, plan, lock });
    const journal = guardSuccessorJournal(
      await makeDurableSuccessorJournal(transaction),
      successorRebind,
      root,
    );
    const applied = await applyWave2bCasBatch({
      items,
      lock,
      journal,
      hooks: guardSuccessorHooks(testHooks, successorRebind, root),
      leaveInterruptedForTest,
    });
    await assertCasBindings(successorRebind, {
      root,
      allowAppliedReport: refreshedReportBinding,
      allowAppliedMarkdown: refreshedMarkdownBinding,
    });
    await validateImmutableInventoryObserverSuccessorReceipt({
      binding: receipt.binding,
      successorRebind,
      generator: receipt.document.generator,
      root,
    });
    return {
      applied: true,
      idempotentReplay: false,
      transactionId,
      cas: applied,
      receipt: receiptBinding,
      report: refreshedReportBinding,
      markdown: refreshedMarkdownBinding,
      rewrittenWorkspaceDocuments: [],
    };
  } catch (error) {
    if (leaveInterruptedForTest) {
      retainInterruptedLock = true;
      error.successorRecovery = { transactionId };
    }
    throw error;
  } finally {
    if (!retainInterruptedLock) await releaseWave2bLock(lock);
  }
}

async function validateCurrentInventoryObserverReconciliation({
  report,
  inputs,
  root = ROOT,
}) {
  if (!report.refreshHistory?.length) return null;
  const latest = report.refreshHistory?.at(-1);
  if (latest?.observerSuccessorRebind) {
    const successorRebind = validateInventoryObserverSuccessorRebind(
      latest.observerSuccessorRebind,
    );
    invariant(
      latest.workspaceDocumentsRewritten === false &&
        Array.isArray(latest.rewrittenWorkspaceDocuments) &&
        latest.rewrittenWorkspaceDocuments.length === 0 &&
        latest.coverageRewritten === false &&
        latest.immutablePreimage === null &&
        latest.historicalInventoryObserverReconciliationPreserved === true &&
        latest.acceptanceChanged === false &&
        latest.completionOrReleaseLedgerChanged === false &&
        latest.strictAcceptanceEffect === "none" &&
        sameBinding(
          successorRebind.successor.observerReceipt,
          inputs.inventoryObserverReceipt.binding,
        ) &&
        pretty(successorRebind.unchangedWorkspaceDocuments) ===
          pretty(currentWorkspaceBindings(inputs)),
      "TS006 observer successor report history is stale or promoted",
    );
    validateCurrentAcceptanceNeutralInventoryObserver({
      observer: inputs.inventoryObserverReceipt.value,
      observerBinding: inputs.inventoryObserverReceipt.binding,
      assetInventoryBinding:
        successorRebind.unchangedWorkspaceDocuments.assetInventory,
    });
    await validateHistoricalInventoryReconciliationAncestor({
      report,
      root,
      predecessorGenerator:
        successorRebind.predecessor.workspaceBindingReportGenerator,
    });
    const [ledgers, protectedPins, casEngine] = await Promise.all([
      readAndValidateLockedBindings(
        EXPECTED_OBSERVER_SUCCESSOR_REBIND.ledgers,
        { root, label: "completion/release ledger" },
      ),
      readAndValidateLockedBindings(
        EXPECTED_OBSERVER_SUCCESSOR_REBIND.protectedPins,
        { root, label: "protected pin" },
      ),
      readSafeRegularBinding(WAVE2B_CAS_ENGINE_PATH, { root }),
    ]);
    assertExactBindingMap(
      ledgers,
      successorRebind.ledgers,
      "successor ledger",
    );
    assertExactBindingMap(
      protectedPins,
      successorRebind.protectedPins,
      "successor protected pin",
    );
    invariant(
      sameBinding(casEngine.binding, successorRebind.casEngine),
      "TS006 successor CAS engine binding drifted",
    );
    await validateImmutableInventoryObserverSuccessorReceipt({
      binding: latest.immutableObserverSuccessorReceipt,
      successorRebind,
      generator: successorRebind.generator,
      root,
    });
    return successorRebind;
  }
  const reconciliation = latest?.inventoryObserverReconciliation;
  invariant(
    reconciliation?.schemaVersion === 1 &&
      reconciliation.transitionId ===
        EXPECTED_INVENTORY_RECONCILIATION_TRANSITION.transitionId &&
      reconciliation.status ===
        "cross-writer-lineage-verified-observer-remains-stale" &&
      pretty(reconciliation.observerReceipt) ===
        pretty(inputs.inventoryObserverReceipt.binding) &&
      pretty(reconciliation.observerAssetInventory) ===
        pretty(
          inputs.inventoryObserverReceipt.value.canonicalInventoryFiles
            .assetInventory,
        ) &&
      pretty(reconciliation.specializedWriterNextAssetInventory) ===
        pretty(report.after.assetInventory) &&
      reconciliation.candidateAssetManifest?.path ===
        inputs.candidate.outputs.canvasManifest.path &&
      reconciliation.candidateAssetManifest?.bytes ===
        inputs.candidate.outputs.canvasManifest.bytes &&
      reconciliation.candidateAssetManifest?.sha256 ===
        inputs.candidate.outputs.canvasManifest.sha256 &&
      reconciliation.conflictPreserved === true &&
      reconciliation.observerReceiptRewrittenByThisWriter === false &&
      reconciliation.observerExplicitlyStaleAfterSpecializedRefresh === true &&
      reconciliation.sourceAssetsChanged === false &&
      reconciliation.protectedPinsChanged === false &&
      reconciliation.acceptanceChanged === false &&
      reconciliation.completionOrReleaseLedgerChanged === false &&
      reconciliation.strictAcceptanceEffect === "none",
    "TS006 cross-writer inventory reconciliation is missing, stale, or promoted",
  );
  const witness = await inventoryObserverLineageWitness({
    report,
    observerReceipt: inputs.inventoryObserverReceipt,
  });
  invariant(
    pretty(reconciliation.lineageWitness) === pretty(witness),
    "TS006 cross-writer inventory lineage witness is stale",
  );
  const archivedAssetInventoryBytes = await readFile(
    path.join(
      ROOT,
      witness.immutablePreimage.root,
      path.basename(ASSET_INVENTORY_PATH),
    ),
  );
  const observerRefreshTransaction = await inventoryObserverTransactionWitness(
    inputs,
    archivedAssetInventoryBytes,
  );
  invariant(
    pretty(reconciliation.observerRefreshTransaction) ===
      pretty(observerRefreshTransaction) &&
      pretty(
        reconciliation.specializedWriterCurrentAssetInventorySemanticFields,
      ) === pretty(assetInventorySemanticFields(archivedAssetInventoryBytes)) &&
      pretty(
        reconciliation.specializedWriterNextAssetInventorySemanticFields,
      ) === pretty(assetInventorySemanticFields(inputs.assetInventoryBytes)) &&
      reconciliation.observerAssetInventory.sha256 !==
        report.after.assetInventory.sha256,
    "TS006 inventory observer transition proof is stale, semantically incomplete, or no longer explicitly stale",
  );
  await validateImmutableInventoryReconciliationReceiptBinding({
    binding: latest.immutableReconciliationReceipt,
    reconciliation,
    generator: report.generator,
  });
  return reconciliation;
}

async function verify() {
  const inputs = await loadInputs();
  const outputs = expectedOutputs(inputs);
  invariant(
    inputs.manifestBytes.equals(outputs.manifestBytes),
    "TS006 candidate-bound migration.json drifted",
  );
  invariant(
    inputs.coverageBytes.equals(outputs.coverageBytes),
    "TS006 candidate-bound full-frame coverage drifted",
  );
  invariant(
    inputs.assetInventoryBytes.equals(outputs.assetInventoryBytes),
    "TS006 candidate-bound asset inventory drifted",
  );
  invariant(
    inputs.briefBytes.equals(outputs.briefBytes),
    "TS006 candidate-bound migration brief drifted",
  );
  const [reportInput, generator] = await Promise.all([
    readDocument(REPORT_PATH),
    readBinding(relative(SCRIPT_PATH)),
  ]);
  const report = validateWorkspaceBindingReport({
    report: reportInput.value,
    inputs,
    outputs,
    generator,
  });
  await validateCurrentInventoryObserverReconciliation({ report, inputs });
  return report;
}

async function refreshReport() {
  const inputs = await loadInputs();
  const outputs = expectedOutputs(inputs);
  invariant(
    inputs.coverageBytes.equals(outputs.coverageBytes),
    "TS006 coverage must be canonical before this materializer runs; refresh never writes coverage",
  );
  assertAcceptanceNeutral(inputs.manifest);
  validateAcceptanceNeutralManifestRebind(inputs.manifest, outputs.manifest);
  const [current, currentMarkdown, generator] = await Promise.all([
    readDocument(REPORT_PATH),
    readFile(path.join(ROOT, MARKDOWN_PATH)),
    readBinding(relative(SCRIPT_PATH)),
  ]);
  validateSpecializedRefreshPreimageOwnership({
    report: current.value,
    observedBindings: currentWorkspaceBindings(inputs),
  });
  const workspaceChanges = refreshWorkspaceChanges({ inputs, outputs });
  if (workspaceChanges.length === 0) {
    const observerSuccessorRebind =
      await buildInventoryObserverSuccessorRebind({
        currentReport: current,
        currentMarkdown,
        inputs,
        outputs,
        generator,
      });
    const immutableObserverSuccessorReceipt =
      buildImmutableInventoryObserverSuccessorReceipt({
        successorRebind: observerSuccessorRebind,
        generator,
      });
    const currentModel = buildReport({
      inputs,
      outputs,
      before: current.value.before,
      backup: current.value.backup,
      generator,
    });
    const refreshed = buildObserverSuccessorRefreshedReport({
      currentReport: current,
      currentModel,
      successorRebind: observerSuccessorRebind,
      immutableReceiptBinding: immutableObserverSuccessorReceipt.binding,
    });
    validateWorkspaceBindingReport({
      report: refreshed,
      inputs,
      outputs,
      generator,
    });
    await commitInventoryObserverSuccessorReceiptOnlyRebind({
      receipt: immutableObserverSuccessorReceipt,
      refreshedReportBytes: Buffer.from(pretty(refreshed)),
      refreshedMarkdownBytes: Buffer.from(
        buildWorkspaceBindingMarkdown(refreshed),
      ),
    });
    return verify();
  }
  invariant(
    workspaceChanges.length === 1 &&
      workspaceChanges[0].path === ASSET_INVENTORY_PATH,
    "TS006 one-time cross-writer reconciliation may rewrite only asset-inventory.csv",
  );
  const preimageFiles = [
    ...workspaceChanges,
    { path: REPORT_PATH, before: current.bytes },
    { path: MARKDOWN_PATH, before: currentMarkdown },
  ];
  const plannedPreimage = describeImmutableRefreshPreimage(preimageFiles);
  const inventoryObserverReconciliation =
    await buildInventoryObserverReconciliation({
      currentReport: current,
      inputs,
      outputs,
      plannedPreimage,
    });
  const immutableReconciliationReceipt =
    buildImmutableInventoryReconciliationReceipt({
      reconciliation: inventoryObserverReconciliation,
      generator,
    });
  const preimage = await immutableRefreshPreimage(
    preimageFiles,
    plannedPreimage,
  );
  const immutableReconciliationReceiptBinding =
    await writeImmutableInventoryReconciliationReceipt(
      immutableReconciliationReceipt,
    );
  const currentModel = buildReport({
    inputs,
    outputs,
    before: current.value.before,
    backup: current.value.backup,
    generator,
  });
  const refreshed = {
    ...current.value,
    ...currentModel,
    // The original materialization boundary remains the immutable historical
    // before/backup pair. Refreshes only append their own preimage receipts.
    before: current.value.before,
    backup: current.value.backup,
    refreshHistory: [
      ...(current.value.refreshHistory || []),
      {
        priorReportSha256: current.binding.sha256,
        workspaceDocumentsRewritten: workspaceChanges.length > 0,
        rewrittenWorkspaceDocuments: workspaceChanges.map(
          ({ path: relativePath }) => relativePath,
        ),
        coverageRewritten: false,
        compareAndSwapPreconditionsRequired: true,
        immutablePreimage: preimage,
        inventoryObserverReconciliation,
        immutableReconciliationReceipt: immutableReconciliationReceiptBinding,
        disposition:
          workspaceChanges.length > 0
            ? "allowlisted-acceptance-neutral-cross-writer-reconciled-candidate-manifest-asset-and-brief-rebind"
            : "receipt-only-rebind-after-exact-candidate-workspace-validation",
      },
    ],
  };
  validateWorkspaceBindingReport({
    report: refreshed,
    inputs,
    outputs,
    generator,
  });
  const refreshedReportBytes = Buffer.from(pretty(refreshed));
  const refreshedMarkdownBytes = Buffer.from(
    buildWorkspaceBindingMarkdown(refreshed),
  );
  await replaceSelectedOutputsWithRollback([
    ...workspaceChanges,
    { path: REPORT_PATH, before: current.bytes, after: refreshedReportBytes },
    {
      path: MARKDOWN_PATH,
      before: currentMarkdown,
      after: refreshedMarkdownBytes,
    },
  ]);
  return verify();
}

async function planRefreshReport() {
  const inputs = await loadInputs();
  const outputs = expectedOutputs(inputs);
  invariant(
    inputs.coverageBytes.equals(outputs.coverageBytes),
    "TS006 coverage must be canonical before this materializer runs; refresh never writes coverage",
  );
  assertAcceptanceNeutral(inputs.manifest);
  validateAcceptanceNeutralManifestRebind(inputs.manifest, outputs.manifest);
  const [current, currentMarkdown, generator] = await Promise.all([
    readDocument(REPORT_PATH),
    readFile(path.join(ROOT, MARKDOWN_PATH)),
    readBinding(relative(SCRIPT_PATH)),
  ]);
  validateSpecializedRefreshPreimageOwnership({
    report: current.value,
    observedBindings: currentWorkspaceBindings(inputs),
  });
  const workspaceChanges = refreshWorkspaceChanges({ inputs, outputs });
  if (workspaceChanges.length === 0) {
    const observerSuccessorRebind =
      await buildInventoryObserverSuccessorRebind({
        currentReport: current,
        currentMarkdown,
        inputs,
        outputs,
        generator,
      });
    const immutableObserverSuccessorReceipt =
      buildImmutableInventoryObserverSuccessorReceipt({
        successorRebind: observerSuccessorRebind,
        generator,
      });
    return {
      schemaVersion: 1,
      reportType:
        "g4-l3-ts006-current-javascript-workspace-binding-refresh-plan",
      status: "validated-plan-no-files-written",
      animationId: TS006_ANIMATION_ID,
      refreshMode: "receipt-only-observer-successor-rebind",
      currentReport: current.binding,
      currentWorkspace: currentWorkspaceBindings(inputs),
      plannedWorkspace: outputBindings(outputs),
      workspaceDocumentsRewritten: false,
      rewrittenWorkspaceDocuments: [],
      coverageRewritten: false,
      reportAndMarkdownWillBeRebound: true,
      compareAndSwapPreconditionsRequired: true,
      immutablePreimage: null,
      historicalInventoryObserverReconciliationPreserved: true,
      observerSuccessorRebind,
      immutableObserverSuccessorReceipt:
        immutableObserverSuccessorReceipt.binding,
      acceptance: {
        sourceAssetsChanged: false,
        protectedPinsChanged: false,
        humanOrOwnerDecisionChanged: false,
        completionOrReleaseLedgerChanged: false,
        migrationStatusChanged: false,
        strictMigrationComplete: false,
      },
      strictAcceptanceEffect: "none",
    };
  }
  invariant(
    workspaceChanges.length === 1 &&
      workspaceChanges[0].path === ASSET_INVENTORY_PATH,
    "TS006 one-time cross-writer reconciliation may rewrite only asset-inventory.csv",
  );
  const plannedPreimage = describeImmutableRefreshPreimage([
    ...workspaceChanges,
    { path: REPORT_PATH, before: current.bytes },
    { path: MARKDOWN_PATH, before: currentMarkdown },
  ]);
  const inventoryObserverReconciliation =
    await buildInventoryObserverReconciliation({
      currentReport: current,
      inputs,
      outputs,
      plannedPreimage,
    });
  const immutableReconciliationReceipt =
    buildImmutableInventoryReconciliationReceipt({
      reconciliation: inventoryObserverReconciliation,
      generator,
    });
  return {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-current-javascript-workspace-binding-refresh-plan",
    status: "validated-plan-no-files-written",
    animationId: TS006_ANIMATION_ID,
    currentReport: current.binding,
    currentWorkspace: currentWorkspaceBindings(inputs),
    plannedWorkspace: outputBindings(outputs),
    rewrittenWorkspaceDocuments: workspaceChanges.map(
      ({ path: relativePath }) => relativePath,
    ),
    coverageRewritten: false,
    reportAndMarkdownWillBeRebound: true,
    compareAndSwapPreconditionsRequired: true,
    immutablePreimage: plannedPreimage,
    inventoryObserverReconciliation,
    immutableReconciliationReceipt: immutableReconciliationReceipt.binding,
    acceptance: {
      sourceAssetsChanged: false,
      protectedPinsChanged: false,
      humanOrOwnerDecisionChanged: false,
      completionOrReleaseLedgerChanged: false,
      migrationStatusChanged: false,
      strictMigrationComplete: false,
    },
    strictAcceptanceEffect: "none",
  };
}

export async function materializeTs006CurrentJsWorkspaceBinding({
  check = false,
  refresh = false,
  planRefresh = false,
} = {}) {
  invariant(
    [check, refresh, planRefresh].filter(Boolean).length <= 1,
    "--check, --refresh, and --plan-refresh are mutually exclusive",
  );
  const reportExists = await lstat(path.join(ROOT, REPORT_PATH)).catch(
    (error) => (error.code === "ENOENT" ? null : Promise.reject(error)),
  );
  if (check) return verify();
  if (planRefresh) {
    invariant(
      reportExists,
      "Cannot plan refresh for a missing TS006 workspace-binding report",
    );
    return planRefreshReport();
  }
  if (reportExists) return refresh ? refreshReport() : verify();
  invariant(
    !refresh,
    "Cannot refresh a missing TS006 workspace-binding report",
  );
  const inputs = await loadInputs();
  validateUnboundPreimage(inputs);
  const outputs = expectedOutputs(inputs);
  assertAcceptanceNeutral(outputs.manifest);
  invariant(
    outputs.manifest.status === inputs.manifest.status &&
      Object.values(outputs.manifest.accessibility).every(
        (value) => value === false,
      ) &&
      outputs.coverage.requirements.every(
        ({ status, baselineAuthority }) =>
          status === "pending" && baselineAuthority === "unresolved",
      ),
    "TS006 candidate binding target contains an acceptance or status promotion",
  );

  const before = {
    migrationJson: {
      path: MIGRATION_PATH,
      bytes: inputs.manifestBytes.length,
      sha256: sha256(inputs.manifestBytes),
    },
    fullFrameCoverage: {
      path: COVERAGE_PATH,
      bytes: inputs.coverageBytes.length,
      sha256: sha256(inputs.coverageBytes),
    },
    assetInventory: {
      path: ASSET_INVENTORY_PATH,
      bytes: inputs.assetInventoryBytes.length,
      sha256: sha256(inputs.assetInventoryBytes),
    },
    migrationBrief: {
      path: BRIEF_PATH,
      bytes: inputs.briefBytes.length,
      sha256: sha256(inputs.briefBytes),
    },
  };
  const preimageSetSha256 = sha256(Buffer.from(pretty(before)));
  const backupRoot = `work/g4-l3-v2-ts006-current-js-binding-preimages/${preimageSetSha256}`;
  await mkdir(path.join(ROOT, backupRoot), { recursive: true });
  for (const [name, source] of [
    ["migration.json", MIGRATION_PATH],
    ["full-frame-coverage.json", COVERAGE_PATH],
    ["asset-inventory.csv", ASSET_INVENTORY_PATH],
    ["MIGRATION_BRIEF.md", BRIEF_PATH],
  ]) {
    const destination = path.join(ROOT, backupRoot, name);
    await copyFile(
      path.join(ROOT, source),
      destination,
      fsConstants.COPYFILE_EXCL,
    );
    await chmod(destination, 0o444);
  }
  await replaceOutputsWithRollback(inputs, outputs);
  const generator = await readBinding(relative(SCRIPT_PATH));
  const report = buildReport({
    inputs,
    outputs,
    before,
    backup: { root: backupRoot, preimageSetSha256, ignoredWorkArtifact: true },
    generator,
  });
  await atomicWrite(path.join(ROOT, REPORT_PATH), Buffer.from(pretty(report)));
  await atomicWrite(
    path.join(ROOT, MARKDOWN_PATH),
    Buffer.from(buildWorkspaceBindingMarkdown(report)),
  );
  return verify();
}

export function parseArguments(argv) {
  const options = { check: false, refresh: false, planRefresh: false };
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--refresh") options.refresh = true;
    else if (argument === "--plan-refresh") options.planRefresh = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  invariant(
    [options.check, options.refresh, options.planRefresh].filter(Boolean)
      .length <= 1,
    "--check, --refresh, and --plan-refresh are mutually exclusive",
  );
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  materializeTs006CurrentJsWorkspaceBinding(
    parseArguments(process.argv.slice(2)),
  )
    .then((report) => {
      if (
        report.reportType ===
        "g4-l3-ts006-current-javascript-workspace-binding-refresh-plan"
      ) {
        process.stdout.write(pretty(report));
        return;
      }
      process.stdout.write(
        `PASS: TS006 current-JavaScript candidate bound to workspace; ${report.summary.pendingRequirements} requirements remain pending; strict completion 0.\n`,
      );
    })
    .catch((error) => {
      process.stderr.write(`${error.stack || error.message}\n`);
      process.exitCode = 1;
    });
}
