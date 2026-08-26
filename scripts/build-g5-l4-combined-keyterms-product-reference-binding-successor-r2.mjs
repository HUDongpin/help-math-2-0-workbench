#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  open,
  opendir,
  readFile,
  rm,
  rmdir,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {validateReceiptDocument} from
  "./verify-g5-l4-combined-keyterms-product-reference-successor.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const RELEASE_ID = "lesson-g05-l04-number-lines";
export const SUCCESSOR_ID =
  "g5-l4-combined-keyterms-product-reference-binding-successor-2026-08-01-r2";
export const OUTPUT_PREFIX = `reports/${SUCCESSOR_ID}`;
export const OUTPUT_PATHS = Object.freeze({
  json: `${OUTPUT_PREFIX}.json`,
  markdown: `${OUTPUT_PREFIX}.md`,
});
export const GENERATOR_PATH =
  "scripts/build-g5-l4-combined-keyterms-product-reference-binding-successor-r2.mjs";
export const TEST_PATH =
  "scripts/build-g5-l4-combined-keyterms-product-reference-binding-successor-r2.test.mjs";
export const PREDECESSOR_RECEIPT = Object.freeze({
  path:
    "catalog/owner-authorizations/g5-l4-combined-keyterms-product-reference-successor-2026-07-30.json",
  bytes: 7_719,
  sha256: "20a7b051fc59d13427069382d0a411da8408d4ddd3cf02a08a769c1302994c07",
});
export const PREDECESSOR_BROWSER = Object.freeze({
  path: "apps/web/components/legacy-key-terms-browser.tsx",
  bytes: 36_303,
  sha256: "a96c25458ef8475a22c6be72e42da75c17f5bfa14d15ea73a22d937c6166d60f",
});
export const CURRENT_BROWSER = Object.freeze({
  path: PREDECESSOR_BROWSER.path,
  bytes: 37_693,
  sha256: "2a2631603ebcf1c0dd78f10eb2cd8d16c152c9b1ffb6504ad02d0c4435d11714",
});
export const CURRENT_G5_CALLER = Object.freeze({
  path: "apps/web/components/descriptor-driven-whole-lesson-player.tsx",
  bytes: 29_352,
  sha256: "9d445a802c573fda6a42955f83a830951ebbdf6afdf70e974d9bd77d8b0aeea4",
});

export const PHYSICAL_KEYTERMS_ROOT =
  "/Volumes/WestWorld/HELP_OnlineKeyTerms_XML";
export const SQL_ARCHIVE_ROOT =
  "/Volumes/WestWorld/HELP MATH Related Files/Extracted_NewHelpProgram_20210203";

const UNCHANGED_PROJECT_BINDINGS = Object.freeze([
  Object.freeze({
    path: "source-assets/flash/intake/2026-07-30-venky-combined-keyterms/INTAKE_RECEIPT.json",
    bytes: 3_362,
    sha256: "f4324515451500fb641dd8d34ff04ce86baaefa2c5c29289bfdb8d8748abfc0c",
    role: "predecessor-intake-receipt",
  }),
  Object.freeze({
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml",
    bytes: 378_783,
    sha256: "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
    role: "selected-canonical-elementary-english-master",
  }),
  Object.freeze({
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml",
    bytes: 374_466,
    sha256: "7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00",
    role: "selected-canonical-elementary-spanish-master",
  }),
  Object.freeze({
    path: "source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTEG4.xml",
    bytes: 398_191,
    sha256: "d39fab547dde0476c27caa01c8e3e2443d71cc40eb2df725e7a50102d01ab42c",
    role: "unselected-owner-intake-2015-elementary-english-variant",
  }),
  Object.freeze({
    path: "source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTSG4.xml",
    bytes: 396_776,
    sha256: "a3aab5a75cd635f88ba5883a5fc2715ea144f51ac5efedac0341c5801c672c6d",
    role: "unselected-owner-intake-2015-elementary-spanish-variant",
  }),
  Object.freeze({
    path: "apps/web/public/generated/g5-l4-elementary-keyterms-reference-en.json",
    bytes: 971_582,
    sha256: "e4baaf8d98bb0d2032381a2faf107a877f8bbaea26413bd45dd49f10e7fbcdfd",
    role: "generated-g5-l4-combined-elementary-english-reference",
  }),
  Object.freeze({
    path: "apps/web/public/generated/g5-l4-elementary-keyterms-reference-es.json",
    bytes: 964_481,
    sha256: "0184db0cca0a3351ed4f210ddcac752eeee8756ed46a95ca63bec1980c41e7cb",
    role: "generated-g5-l4-combined-elementary-spanish-reference",
  }),
  Object.freeze({
    path: "scripts/build-g5-l4-elementary-keyterms-reference-data.mjs",
    bytes: 13_357,
    sha256: "f0e3594de19e1f3e7164427300fc76d8ce81a853f62698a56eae42088239cfcf",
    role: "combined-elementary-reference-data-generator",
  }),
  Object.freeze({
    path: "apps/web/lib/g5-l4-whole-lesson-player-descriptor.ts",
    bytes: 20_847,
    sha256: "cf97fada67b41b22c0c8bc27847adfa49dd295807535730a15319aa3e9aa62da",
    role: "g5-l4-whole-lesson-keyterms-descriptor",
  }),
]);

const EXTERNAL_BINDINGS = Object.freeze([
  Object.freeze({
    relativePath: "ELM/ELKTEG4.xml",
    path: `${PHYSICAL_KEYTERMS_ROOT}/ELM/ELKTEG4.xml`,
    bytes: 398_191,
    sha256: "d39fab547dde0476c27caa01c8e3e2443d71cc40eb2df725e7a50102d01ab42c",
    role: "physical-owner-intake-elementary-english-variant",
  }),
  Object.freeze({
    relativePath: "ELM/ELKTSG4.xml",
    path: `${PHYSICAL_KEYTERMS_ROOT}/ELM/ELKTSG4.xml`,
    bytes: 396_776,
    sha256: "a3aab5a75cd635f88ba5883a5fc2715ea144f51ac5efedac0341c5801c672c6d",
    role: "physical-owner-intake-elementary-spanish-variant",
  }),
  Object.freeze({
    relativePath: "MI/L1KTE01.xml",
    path: `${PHYSICAL_KEYTERMS_ROOT}/MI/L1KTE01.xml`,
    bytes: 345_838,
    sha256: "14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b",
    role: "physical-middle-school-english-reference-unselected-for-g5-l4",
  }),
  Object.freeze({
    relativePath: "MI/L1KTS01.xml",
    path: `${PHYSICAL_KEYTERMS_ROOT}/MI/L1KTS01.xml`,
    bytes: 344_456,
    sha256: "3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407",
    role: "physical-middle-school-spanish-reference-unselected-for-g5-l4",
  }),
]);

export const ACCEPTANCE_EFFECTS = Object.freeze({
  productQaComplete: false,
  migrationQaComplete: false,
  originalFlashSourceEstablished: false,
  lessonSpecificSourceRecoveryEstablished: false,
  lessonSpecificSubstitutionAuthorized: false,
  exactRuntimeByteVariantVerified: false,
  actionScriptExecutionVerified: false,
  authoritativeOriginalRuntimeEvidenceEstablished: false,
  audioAccepted: false,
  independentHumanReviewAccepted: false,
  ownerFidelityAcceptanceEstablished: false,
  strictCompletionEstablished: false,
  externalDeploymentAuthorized: false,
  publicationAuthorized: false,
  published: false,
});

const BROWSER_TRANSFORMS = Object.freeze([
  Object.freeze({
    id: "typed-host-selection-request-contract",
    current: "export interface LegacyKeyTermSelectionRequest {\n  readonly entryId: string;\n  readonly revision: number;\n  readonly sourceAnimationId: string;\n}\n\n",
    predecessor: "",
  }),
  Object.freeze({
    id: "optional-selection-request-destructure",
    current: "export function LegacyKeyTermsBrowser({\n  locale,\n  selectionRequest,\n  shellCandidate,\n",
    predecessor: "export function LegacyKeyTermsBrowser({\n  locale,\n  shellCandidate,\n",
  }),
  Object.freeze({
    id: "optional-selection-request-prop",
    current: "  selectionRequest?: LegacyKeyTermSelectionRequest | null;\n",
    predecessor: "",
  }),
  Object.freeze({
    id: "handled-request-revision-ref",
    current: "  const handledSelectionRequestRef = useRef('');\n",
    predecessor: "",
  }),
  Object.freeze({
    id: "fail-closed-local-entry-resolution-effect",
    current: "  const requestedEntry = selectionRequest\n    ? entries.find(({id}) => id === selectionRequest.entryId) ?? null\n    : null;\n  const selectionResolution = !selectionRequest\n    ? 'none'\n    : !activeDocument\n      ? 'pending-data'\n      : requestedEntry\n        ? 'matched-local-entry'\n        : 'blocked-entry-not-found';\n\n  useEffect(() => {\n    if (!selectionRequest || !activeDocument || !requestedEntry) return;\n    const requestKey = [\n      selectionRequest.sourceAnimationId,\n      selectionRequest.entryId,\n      selectionRequest.revision,\n      indexLanguage,\n    ].join(':');\n    if (handledSelectionRequestRef.current === requestKey) return;\n    handledSelectionRequestRef.current = requestKey;\n    setSelectedLetter('');\n    setQuery('');\n    setHistory([]);\n    setSelectedId(requestedEntry.id);\n  }, [\n    activeDocument,\n    indexLanguage,\n    requestedEntry,\n    selectionRequest,\n  ]);\n\n",
    predecessor: "\n",
  }),
  Object.freeze({
    id: "host-selection-diagnostic-data-attributes",
    current: "    data-host-selection-entry-id={selectionRequest?.entryId}\n    data-host-selection-resolution={selectionResolution}\n    data-host-selection-source-animation-id={\n      selectionRequest?.sourceAnimationId\n    }\n",
    predecessor: "",
  }),
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function exactKeys(value, keys, label) {
  invariant(value && typeof value === "object", `${label} is missing`);
  invariant(
    sameValue(Object.keys(value).sort(), [...keys].sort()),
    `${label} keys drifted`,
  );
}

function countOccurrences(source, token) {
  let count = 0;
  let offset = 0;
  while (true) {
    const index = source.indexOf(token, offset);
    if (index === -1) return count;
    count += 1;
    offset = index + token.length;
  }
}

function fragmentBinding(value) {
  const bytes = Buffer.from(value, "utf8");
  return {bytes: bytes.length, sha256: sha256(bytes)};
}

export const BROWSER_ALLOWLIST = Object.freeze(BROWSER_TRANSFORMS.map((entry) =>
  Object.freeze({
    id: entry.id,
    current: Object.freeze(fragmentBinding(entry.current)),
    predecessor: Object.freeze(fragmentBinding(entry.predecessor)),
    netAddedBytes:
      Buffer.byteLength(entry.current) - Buffer.byteLength(entry.predecessor),
  })
));

export function projectCurrentBrowserToPredecessor(currentBytes) {
  invariant(Buffer.isBuffer(currentBytes), "browser source must be a Buffer");
  let source = currentBytes.toString("utf8");
  invariant(
    Buffer.from(source, "utf8").equals(currentBytes),
    "browser source is not canonical UTF-8",
  );
  for (const transform of BROWSER_TRANSFORMS) {
    invariant(
      countOccurrences(source, transform.current) === 1,
      `browser allowlist transform ${transform.id} is not present exactly once`,
    );
    source = source.replace(transform.current, transform.predecessor);
  }
  const projectedBytes = Buffer.from(source, "utf8");
  invariant(
    projectedBytes.length === PREDECESSOR_BROWSER.bytes &&
      sha256(projectedBytes) === PREDECESSOR_BROWSER.sha256,
    "unexpected browser delta remains outside the exact allowlist",
  );
  const netAddedBytes = BROWSER_ALLOWLIST.reduce(
    (sum, entry) => sum + entry.netAddedBytes,
    0,
  );
  invariant(
    currentBytes.length - projectedBytes.length === netAddedBytes &&
      netAddedBytes === 1_390,
    "browser allowlist byte delta drifted",
  );
  return {
    projectedBytes,
    projectedBinding: {...PREDECESSOR_BROWSER},
    allowlist: BROWSER_ALLOWLIST.map((entry) => structuredClone(entry)),
    netAddedBytes,
    unexpectedDeltaBytes: 0,
  };
}

export function inspectG5CallerDormancy(callerBytes) {
  invariant(Buffer.isBuffer(callerBytes), "G5 caller source must be a Buffer");
  const source = callerBytes.toString("utf8");
  invariant(
    Buffer.from(source, "utf8").equals(callerBytes),
    "G5 caller source is not canonical UTF-8",
  );
  const invocations = source.match(/<LegacyKeyTermsBrowser\b[\s\S]*?\/>/g) ?? [];
  invariant(
    invocations.length === 1,
    "G5 caller must contain exactly one LegacyKeyTermsBrowser invocation",
  );
  const invocation = invocations[0];
  invariant(
    !invocation.includes("{...") &&
      !/\bselectionRequest\s*=/.test(invocation),
    "G5 caller activates or obscures the optional selectionRequest branch",
  );
  const props = [...invocation.matchAll(/\n\s+([A-Za-z_$][\w$]*)=/g)]
    .map((match) => match[1]);
  invariant(
    sameValue(props, ["key", "locale", "shellCandidate"]),
    "G5 caller LegacyKeyTermsBrowser prop set drifted",
  );
  return {
    componentInvocationCount: 1,
    explicitProps: props,
    selectionRequestPropPassed: false,
    optionalHostSelectionBranchDormant: true,
  };
}

function assertRelativePath(relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, `${label} is empty`);
  invariant(!path.isAbsolute(relativePath), `${label} must be relative`);
  invariant(!relativePath.includes("\\"), `${label} must use POSIX separators`);
  invariant(!relativePath.split("/").includes(".."), `${label} escapes the root`);
  return relativePath;
}

function resolveProjectPath(root, relativePath) {
  assertRelativePath(relativePath, "project path");
  const absolutePath = path.resolve(root, relativePath);
  const relative = path.relative(root, absolutePath);
  invariant(
    relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `project path escapes root: ${relativePath}`,
  );
  return absolutePath;
}

async function readRegularFile(absolutePath, label) {
  const metadata = await lstat(absolutePath);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink(),
    `${label} must be a regular non-symlink file`,
  );
  return readFile(absolutePath);
}

async function readProjectRecord(root, expected) {
  const bytes = await readRegularFile(
    resolveProjectPath(root, expected.path),
    expected.path,
  );
  const descriptor = {
    path: expected.path,
    bytes: bytes.length,
    sha256: sha256(bytes),
    ...(expected.role ? {role: expected.role} : {}),
  };
  invariant(
    descriptor.bytes === expected.bytes && descriptor.sha256 === expected.sha256,
    `${expected.path} identity changed`,
  );
  return {bytes, descriptor};
}

async function readCurrentProjectRecord(root, relativePath) {
  const bytes = await readRegularFile(
    resolveProjectPath(root, relativePath),
    relativePath,
  );
  return {
    bytes,
    descriptor: {
      path: relativePath,
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
  };
}

async function enumerateRelativeFiles(root) {
  const results = [];
  async function visit(directory, relativeDirectory) {
    const handle = await opendir(directory);
    for await (const entry of handle) {
      const relativePath = relativeDirectory
        ? path.posix.join(relativeDirectory, entry.name)
        : entry.name;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolutePath, relativePath);
      else if (entry.isFile()) results.push(relativePath);
      else invariant(false, `${absolutePath} is outside the regular file closure`);
    }
  }
  await visit(root, "");
  return results.sort((left, right) => left.localeCompare(right, "en"));
}

async function collectExternalEvidence({physicalKeytermsRoot, sqlArchiveRoot}) {
  const physicalPaths = await enumerateRelativeFiles(physicalKeytermsRoot);
  invariant(
    sameValue(
      physicalPaths.filter((value) => value !== ".DS_Store"),
      EXTERNAL_BINDINGS.map(({relativePath}) => relativePath)
        .sort((left, right) => left.localeCompare(right, "en")),
    ) && sameValue(
      physicalPaths.filter((value) => value === ".DS_Store"),
      [".DS_Store"],
    ),
    "physical combined KeyTerms folder closure drifted",
  );
  const files = [];
  const physicalBytes = new Map();
  for (const expected of EXTERNAL_BINDINGS) {
    const bytes = await readRegularFile(
      path.resolve(physicalKeytermsRoot, expected.relativePath),
      expected.path,
    );
    invariant(
      bytes.length === expected.bytes && sha256(bytes) === expected.sha256,
      `${expected.path} identity changed`,
    );
    physicalBytes.set(expected.relativePath, bytes);
    files.push({
      path: expected.path,
      bytes: expected.bytes,
      sha256: expected.sha256,
      role: expected.role,
    });
  }

  const sqlPaths = await enumerateRelativeFiles(sqlArchiveRoot);
  const xmlFiles = sqlPaths.filter((value) => value.toLowerCase().endsWith(".xml"));
  const keytermOrGlossaryFiles = sqlPaths.filter((value) =>
    /key[\s_-]*terms?|glossar/i.test(path.basename(value))
  );
  invariant(
    xmlFiles.length === 0 && keytermOrGlossaryFiles.length === 0,
    "reported SQL archive filename-only finding drifted",
  );
  return {
    document: {
      physicalFolder: PHYSICAL_KEYTERMS_ROOT,
      ignoredNonContentFiles: [".DS_Store"],
      exactContentClosureVerified: true,
      files,
      sqlArchive: {
        path: SQL_ARCHIVE_ROOT,
        inspectionBoundary:
          "read-only-filename-and-extension-enumeration-only-no-raw-sql-bcp-jsonl-or-personal-record-content-read",
        xmlFilesFound: 0,
        keyTermOrGlossaryNamedFilesFound: 0,
        containsCombinedElementaryOrMiddleSchoolKeyTermsXml: false,
      },
    },
    physicalBytes,
  };
}

function validateGeneratedDocument(document, language, expectedCount) {
  invariant(
    document?.schemaVersion === 1 &&
      document.dataKind === "g5-l4-combined-elementary-keyterms-reference" &&
      document.sourceDisposition ===
        "content-manager-authorized-reference-lesson-source-gap-open" &&
      document.indexLanguage === language &&
      document.counts?.clientTermCount === expectedCount &&
      Array.isArray(document.terms) && document.terms.length === expectedCount &&
      document.lessonBinding?.declaredEnglishLessonSourcePresent === false &&
      document.lessonBinding.declaredSpanishLessonSourcePresent === false &&
      document.lessonBinding.runtimeResolutionVerified === false &&
      document.lessonBinding.referenceUseAuthorized === true &&
      document.authority?.missingLessonSourcesRecovered === false &&
      document.authority.lessonSpecificSubstitutionAuthorized === false &&
      document.authority.exactRuntimeByteVariantVerified === false &&
      document.authority.originalRuntimeAccepted === false &&
      document.authority.humanVisualAccepted === false &&
      document.authority.ownerAccepted === false &&
      document.authority.fidelityVerified === false &&
      document.authority.strictCompletion === false &&
      document.authority.publicationAuthorized === false &&
      document.authority.publicRelease === false,
    `${language} generated Key Terms product document drifted`,
  );
}

function descriptorWithoutRelativePath(binding) {
  const {relativePath: _relativePath, ...descriptor} = binding;
  return descriptor;
}

function expectedExternalDocument() {
  return {
    physicalFolder: PHYSICAL_KEYTERMS_ROOT,
    ignoredNonContentFiles: [".DS_Store"],
    exactContentClosureVerified: true,
    files: EXTERNAL_BINDINGS.map(descriptorWithoutRelativePath),
    sqlArchive: {
      path: SQL_ARCHIVE_ROOT,
      inspectionBoundary:
        "read-only-filename-and-extension-enumeration-only-no-raw-sql-bcp-jsonl-or-personal-record-content-read",
      xmlFilesFound: 0,
      keyTermOrGlossaryNamedFilesFound: 0,
      containsCombinedElementaryOrMiddleSchoolKeyTermsXml: false,
    },
  };
}

function validateDescriptor(binding, expected, label, {roleRequired = true} = {}) {
  invariant(binding && typeof binding === "object", `${label} is missing`);
  const expectedKeys = ["path", "bytes", "sha256", ...(roleRequired ? ["role"] : [])];
  exactKeys(binding, expectedKeys, label);
  invariant(
    binding.path === expected.path &&
      binding.bytes === expected.bytes &&
      binding.sha256 === expected.sha256 &&
      (!roleRequired || binding.role === expected.role),
    `${label} drifted`,
  );
}

function validateDynamicDescriptor(binding, expectedPath, expectedRole, label) {
  exactKeys(binding, ["path", "bytes", "sha256", "role"], label);
  invariant(binding.path === expectedPath, `${label}.path drifted`);
  invariant(Number.isSafeInteger(binding.bytes) && binding.bytes > 0, `${label}.bytes invalid`);
  invariant(/^[a-f0-9]{64}$/.test(binding.sha256 || ""), `${label}.sha256 invalid`);
  invariant(binding.role === expectedRole, `${label}.role drifted`);
}

function bindingProjection(report) {
  return [
    report.sourceBindings.predecessorOwnerReceipt,
    ...report.sourceBindings.unchangedPredecessorProjectFiles,
    report.sourceBindings.currentKeyTermsBrowser,
    report.sourceBindings.currentG5Caller,
    report.sourceBindings.generator,
    report.sourceBindings.test,
    ...report.externalSourceClosure.files,
  ].map(({path: itemPath, bytes, sha256: digest, role}) => ({
    path: itemPath,
    bytes,
    sha256: digest,
    role,
  }));
}

export function renderMarkdown(report) {
  return `# G5 L4 combined Key Terms product-reference binding successor r2\n\n` +
    `Release: \`${RELEASE_ID}\`  \n` +
    "Evidence layer: **machine-only current-source binding reconciliation**  \n" +
    "Acceptance neutral: **true**  \n" +
    "Strict acceptance effect: **none**\n\n" +
    "The immutable 2026-07-30 Owner-relayed product-reference receipt remains the historical authorization antecedent. This successor creates no new Owner decision. It proves only that the current shared Key Terms browser differs from the receipt-bound predecessor by the exact allowlisted G4 L3 typed, memory-only host-selection bridge, while the G5 L4 caller does not pass `selectionRequest`.\n\n" +
    "The generated combined Elementary reference remains 761 English terms and 753 Spanish terms. `L4KTE01.xml` and `L4KTS01.xml` remain missing, and the combined reference does not substitute for either lesson-specific source.\n\n" +
    "No browser QA was executed or inherited by this successor. Original-runtime, audio, human, Owner-fidelity, strict-completion, deployment, publication, and published effects remain false.\n";
}

function attachCompanionMarkdown(report) {
  const bytes = Buffer.from(renderMarkdown(report), "utf8");
  report.companionMarkdown = {
    path: OUTPUT_PATHS.markdown,
    bytes: bytes.length,
    sha256: sha256(bytes),
    role: "human-readable-machine-binding-successor-boundary",
  };
  return report;
}

export function validateG5L4CombinedKeytermsProductReferenceBindingSuccessorR2(report) {
  exactKeys(report, [
    "schemaVersion",
    "evidenceType",
    "successorId",
    "releaseId",
    "assembledOn",
    "status",
    "evidenceState",
    "predecessorAuthorizationAntecedent",
    "sourceBindings",
    "externalSourceClosure",
    "changeReconciliation",
    "g5CallerBoundary",
    "contentBoundary",
    "missingLessonSpecificSourceBoundary",
    "browserQaExecutedByThisSuccessor",
    "predecessorBrowserObservationsInherited",
    "acceptanceEffects",
    "acceptanceNeutral",
    "strictAcceptanceEffect",
    "authorityBoundary",
    "boundFileCount",
    "sourceBindingSetSha256",
    "sourceStability",
    "companionMarkdown",
  ], "combined Key Terms binding successor");
  invariant(
    report?.schemaVersion === 1 &&
      report.evidenceType ===
        "g5-l4-combined-keyterms-product-reference-machine-binding-successor" &&
      report.successorId === SUCCESSOR_ID &&
      report.releaseId === RELEASE_ID &&
      report.assembledOn === "2026-08-01" &&
      report.status === "pass-machine-binding-reconciliation-current-js-only",
    "combined Key Terms binding successor identity drifted",
  );
  invariant(
    report.evidenceState ===
      "machine-only-current-source-binding-reconciliation-no-new-owner-original-runtime-human-strict-or-publication-authority",
    "combined Key Terms binding successor evidence state drifted",
  );

  exactKeys(report.predecessorAuthorizationAntecedent, [
    "ownerRelayedContentManagerDirectionPresent",
    "referenceUseAuthorized",
    "scope",
    "authorizationCarriedOnlyAsHistoricalAntecedent",
    "ownerAuthorizationReissuedByThisSuccessor",
  ], "predecessorAuthorizationAntecedent");
  invariant(
    report.predecessorAuthorizationAntecedent.ownerRelayedContentManagerDirectionPresent === true &&
      report.predecessorAuthorizationAntecedent.referenceUseAuthorized === true &&
      report.predecessorAuthorizationAntecedent.scope ===
        "combined-elementary-keyterms-product-reference-only" &&
      report.predecessorAuthorizationAntecedent
        .authorizationCarriedOnlyAsHistoricalAntecedent === true &&
      report.predecessorAuthorizationAntecedent
        .ownerAuthorizationReissuedByThisSuccessor === false,
    "historical authorization antecedent drifted",
  );

  exactKeys(report.sourceBindings, [
    "predecessorOwnerReceipt",
    "unchangedPredecessorProjectFiles",
    "currentKeyTermsBrowser",
    "currentG5Caller",
    "generator",
    "test",
  ], "sourceBindings");
  validateDescriptor(report.sourceBindings.predecessorOwnerReceipt, {
    ...PREDECESSOR_RECEIPT,
    role: "immutable-historical-owner-relayed-product-reference-receipt",
  }, "predecessor owner receipt");
  invariant(
    Array.isArray(report.sourceBindings.unchangedPredecessorProjectFiles) &&
      report.sourceBindings.unchangedPredecessorProjectFiles.length ===
        UNCHANGED_PROJECT_BINDINGS.length,
    "unchanged predecessor project binding count drifted",
  );
  report.sourceBindings.unchangedPredecessorProjectFiles.forEach((binding, index) =>
    validateDescriptor(
      binding,
      UNCHANGED_PROJECT_BINDINGS[index],
      `unchanged predecessor project binding ${index + 1}`,
    )
  );
  validateDescriptor(report.sourceBindings.currentKeyTermsBrowser, {
    ...CURRENT_BROWSER,
    role: "current-shared-keyterms-browser-after-allowlisted-g4-l3-bridge",
  }, "current Key Terms browser");
  validateDescriptor(report.sourceBindings.currentG5Caller, {
    ...CURRENT_G5_CALLER,
    role: "current-g5-l4-descriptor-driven-whole-lesson-caller",
  }, "current G5 caller");
  validateDynamicDescriptor(
    report.sourceBindings.generator,
    GENERATOR_PATH,
    "machine-binding-successor-generator-validator",
    "successor generator",
  );
  validateDynamicDescriptor(
    report.sourceBindings.test,
    TEST_PATH,
    "machine-binding-successor-targeted-test",
    "successor test",
  );

  invariant(
    sameValue(report.externalSourceClosure, expectedExternalDocument()),
    "external source closure drifted",
  );
  invariant(
    sameValue(report.changeReconciliation, {
      classification: "g4-l3-typed-memory-only-source-glossary-host-selection",
      currentBrowser: CURRENT_BROWSER,
      predecessorBrowser: PREDECESSOR_BROWSER,
      exactAllowlist: BROWSER_ALLOWLIST,
      netAllowlistedAddedBytes: 1_390,
      unexpectedDeltaBytes: 0,
      exactPredecessorRecovered: true,
      g5ProductContentChanged: false,
      g5EvidenceAuthorityChanged: false,
    }),
    "browser change reconciliation drifted",
  );
  invariant(
    sameValue(report.g5CallerBoundary, {
      componentInvocationCount: 1,
      explicitProps: ["key", "locale", "shellCandidate"],
      selectionRequestPropPassed: false,
      optionalHostSelectionBranchDormant: true,
      g4L3HostSelectionBridgeActivatedForG5L4: false,
    }),
    "current G5 caller dormancy boundary drifted",
  );
  invariant(
    sameValue(report.contentBoundary, {
      referenceScope: "combined-elementary-keyterms-product-reference-only",
      selectedVariant: "canonical-preserved-master",
      ownerIntake2015VariantSelectedForClient: false,
      englishClientTermCount: 761,
      spanishClientTermCount: 753,
      englishGeneratedDocument: {
        path: UNCHANGED_PROJECT_BINDINGS[5].path,
        bytes: UNCHANGED_PROJECT_BINDINGS[5].bytes,
        sha256: UNCHANGED_PROJECT_BINDINGS[5].sha256,
      },
      spanishGeneratedDocument: {
        path: UNCHANGED_PROJECT_BINDINGS[6].path,
        bytes: UNCHANGED_PROJECT_BINDINGS[6].bytes,
        sha256: UNCHANGED_PROJECT_BINDINGS[6].sha256,
      },
      generatedDocumentsValidated: true,
    }),
    "combined Key Terms content boundary drifted",
  );
  invariant(
    sameValue(report.missingLessonSpecificSourceBoundary, {
      missingBasenames: ["L4KTE01.xml", "L4KTS01.xml"],
      declaredEnglishSourcePresent: false,
      declaredSpanishSourcePresent: false,
      combinedReferenceSubstitutesForDeclaredLessonSources: false,
      sourceGapClosed: false,
    }),
    "lesson-specific Key Terms source gap drifted",
  );
  invariant(
    report.browserQaExecutedByThisSuccessor === false &&
      report.predecessorBrowserObservationsInherited === false,
    "binding successor invented or inherited browser observations",
  );
  exactKeys(report.acceptanceEffects, Object.keys(ACCEPTANCE_EFFECTS), "acceptanceEffects");
  for (const [key, value] of Object.entries(report.acceptanceEffects)) {
    invariant(typeof value === "boolean" && value === false, `acceptanceEffects.${key} must remain false`);
  }
  invariant(
    report.acceptanceNeutral === true && report.strictAcceptanceEffect === "none",
    "binding successor must remain acceptance-neutral",
  );
  invariant(
    sameValue(report.authorityBoundary, {
      evidenceLayer: "machine-only-current-source-binding-reconciliation",
      acceptanceNeutral: true,
      strictAcceptanceEffect: "none",
      ownerAuthorizationAuthority: false,
      originalRuntimeAuthority: false,
      audioAuthority: false,
      humanReviewAuthority: false,
      ownerFidelityAuthority: false,
      strictCompletionAuthority: false,
      deploymentAuthority: false,
      publicationAuthority: false,
    }),
    "binding successor authority boundary drifted",
  );
  const projection = bindingProjection(report);
  invariant(report.boundFileCount === projection.length, "boundFileCount drifted");
  invariant(
    report.sourceBindingSetSha256 === sha256(Buffer.from(stableJson(projection), "utf8")),
    "sourceBindingSetSha256 drifted",
  );
  exactKeys(
    report.sourceStability,
    ["allBindingsUnchangedDuringAssembly"],
    "sourceStability",
  );
  invariant(
    report.sourceStability.allBindingsUnchangedDuringAssembly === true,
    "source stability is false",
  );
  exactKeys(report.companionMarkdown, ["path", "bytes", "sha256", "role"], "companionMarkdown");
  const markdownBytes = Buffer.from(renderMarkdown(report), "utf8");
  invariant(
    report.companionMarkdown.path === OUTPUT_PATHS.markdown &&
      report.companionMarkdown.bytes === markdownBytes.length &&
      report.companionMarkdown.sha256 === sha256(markdownBytes) &&
      report.companionMarkdown.role ===
        "human-readable-machine-binding-successor-boundary",
    "companion Markdown binding drifted",
  );
  return report;
}

async function assertRecordStable(root, descriptor) {
  const bytes = await readRegularFile(
    resolveProjectPath(root, descriptor.path),
    descriptor.path,
  );
  invariant(
    bytes.length === descriptor.bytes && sha256(bytes) === descriptor.sha256,
    `${descriptor.path} changed during successor assembly`,
  );
}

export async function buildG5L4CombinedKeytermsProductReferenceBindingSuccessorR2({
  projectRoot = PROJECT_ROOT,
  physicalKeytermsRoot = PHYSICAL_KEYTERMS_ROOT,
  sqlArchiveRoot = SQL_ARCHIVE_ROOT,
} = {}) {
  const root = path.resolve(projectRoot);
  const receiptRecord = await readProjectRecord(root, PREDECESSOR_RECEIPT);
  const receipt = validateReceiptDocument(
    JSON.parse(receiptRecord.bytes.toString("utf8")),
  );

  const unchangedRecords = [];
  for (const expected of UNCHANGED_PROJECT_BINDINGS) {
    unchangedRecords.push(await readProjectRecord(root, expected));
  }
  const browserRecord = await readProjectRecord(root, CURRENT_BROWSER);
  const reconciliation = projectCurrentBrowserToPredecessor(browserRecord.bytes);
  invariant(
    sameValue(receipt.productBindings.keyTermsBrowser, PREDECESSOR_BROWSER),
    "predecessor receipt browser binding drifted",
  );
  const callerRecord = await readProjectRecord(root, CURRENT_G5_CALLER);
  const callerBoundary = inspectG5CallerDormancy(callerRecord.bytes);
  const generatorRecord = await readCurrentProjectRecord(root, GENERATOR_PATH);
  const testRecord = await readCurrentProjectRecord(root, TEST_PATH);

  const generatedEnglish = JSON.parse(unchangedRecords[5].bytes.toString("utf8"));
  const generatedSpanish = JSON.parse(unchangedRecords[6].bytes.toString("utf8"));
  validateGeneratedDocument(generatedEnglish, "en", 761);
  validateGeneratedDocument(generatedSpanish, "es", 753);

  const external = await collectExternalEvidence({
    physicalKeytermsRoot: path.resolve(physicalKeytermsRoot),
    sqlArchiveRoot: path.resolve(sqlArchiveRoot),
  });
  invariant(
    unchangedRecords[3].bytes.equals(external.physicalBytes.get("ELM/ELKTEG4.xml")) &&
      unchangedRecords[4].bytes.equals(external.physicalBytes.get("ELM/ELKTSG4.xml")),
    "owner-intake project copies no longer match the physical ELM sources",
  );

  const sourceBindings = {
    predecessorOwnerReceipt: {
      ...receiptRecord.descriptor,
      role: "immutable-historical-owner-relayed-product-reference-receipt",
    },
    unchangedPredecessorProjectFiles: unchangedRecords.map(({descriptor}) => descriptor),
    currentKeyTermsBrowser: {
      ...browserRecord.descriptor,
      role: "current-shared-keyterms-browser-after-allowlisted-g4-l3-bridge",
    },
    currentG5Caller: {
      ...callerRecord.descriptor,
      role: "current-g5-l4-descriptor-driven-whole-lesson-caller",
    },
    generator: {
      ...generatorRecord.descriptor,
      role: "machine-binding-successor-generator-validator",
    },
    test: {
      ...testRecord.descriptor,
      role: "machine-binding-successor-targeted-test",
    },
  };
  const report = {
    schemaVersion: 1,
    evidenceType:
      "g5-l4-combined-keyterms-product-reference-machine-binding-successor",
    successorId: SUCCESSOR_ID,
    releaseId: RELEASE_ID,
    assembledOn: "2026-08-01",
    status: "pass-machine-binding-reconciliation-current-js-only",
    evidenceState:
      "machine-only-current-source-binding-reconciliation-no-new-owner-original-runtime-human-strict-or-publication-authority",
    predecessorAuthorizationAntecedent: {
      ownerRelayedContentManagerDirectionPresent: true,
      referenceUseAuthorized: true,
      scope: "combined-elementary-keyterms-product-reference-only",
      authorizationCarriedOnlyAsHistoricalAntecedent: true,
      ownerAuthorizationReissuedByThisSuccessor: false,
    },
    sourceBindings,
    externalSourceClosure: external.document,
    changeReconciliation: {
      classification: "g4-l3-typed-memory-only-source-glossary-host-selection",
      currentBrowser: CURRENT_BROWSER,
      predecessorBrowser: reconciliation.projectedBinding,
      exactAllowlist: reconciliation.allowlist,
      netAllowlistedAddedBytes: reconciliation.netAddedBytes,
      unexpectedDeltaBytes: reconciliation.unexpectedDeltaBytes,
      exactPredecessorRecovered: true,
      g5ProductContentChanged: false,
      g5EvidenceAuthorityChanged: false,
    },
    g5CallerBoundary: {
      ...callerBoundary,
      g4L3HostSelectionBridgeActivatedForG5L4: false,
    },
    contentBoundary: {
      referenceScope: "combined-elementary-keyterms-product-reference-only",
      selectedVariant: "canonical-preserved-master",
      ownerIntake2015VariantSelectedForClient: false,
      englishClientTermCount: generatedEnglish.terms.length,
      spanishClientTermCount: generatedSpanish.terms.length,
      englishGeneratedDocument: {
        path: unchangedRecords[5].descriptor.path,
        bytes: unchangedRecords[5].descriptor.bytes,
        sha256: unchangedRecords[5].descriptor.sha256,
      },
      spanishGeneratedDocument: {
        path: unchangedRecords[6].descriptor.path,
        bytes: unchangedRecords[6].descriptor.bytes,
        sha256: unchangedRecords[6].descriptor.sha256,
      },
      generatedDocumentsValidated: true,
    },
    missingLessonSpecificSourceBoundary: {
      missingBasenames: ["L4KTE01.xml", "L4KTS01.xml"],
      declaredEnglishSourcePresent: false,
      declaredSpanishSourcePresent: false,
      combinedReferenceSubstitutesForDeclaredLessonSources: false,
      sourceGapClosed: false,
    },
    browserQaExecutedByThisSuccessor: false,
    predecessorBrowserObservationsInherited: false,
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    acceptanceNeutral: true,
    strictAcceptanceEffect: "none",
    authorityBoundary: {
      evidenceLayer: "machine-only-current-source-binding-reconciliation",
      acceptanceNeutral: true,
      strictAcceptanceEffect: "none",
      ownerAuthorizationAuthority: false,
      originalRuntimeAuthority: false,
      audioAuthority: false,
      humanReviewAuthority: false,
      ownerFidelityAuthority: false,
      strictCompletionAuthority: false,
      deploymentAuthority: false,
      publicationAuthority: false,
    },
    boundFileCount: 0,
    sourceBindingSetSha256: "",
    sourceStability: {allBindingsUnchangedDuringAssembly: true},
  };
  const projection = bindingProjection(report);
  report.boundFileCount = projection.length;
  report.sourceBindingSetSha256 = sha256(Buffer.from(stableJson(projection), "utf8"));
  attachCompanionMarkdown(report);
  validateG5L4CombinedKeytermsProductReferenceBindingSuccessorR2(report);

  for (const descriptor of [
    receiptRecord.descriptor,
    ...unchangedRecords.map(({descriptor}) => descriptor),
    browserRecord.descriptor,
    callerRecord.descriptor,
    generatorRecord.descriptor,
    testRecord.descriptor,
  ]) await assertRecordStable(root, descriptor);
  const externalAtEnd = await collectExternalEvidence({
    physicalKeytermsRoot: path.resolve(physicalKeytermsRoot),
    sqlArchiveRoot: path.resolve(sqlArchiveRoot),
  });
  invariant(
    sameValue(externalAtEnd.document, external.document),
    "external closure changed during successor assembly",
  );
  return validateG5L4CombinedKeytermsProductReferenceBindingSuccessorR2(report);
}

async function pathExists(absolutePath) {
  try {
    await lstat(absolutePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function assertAbsent(root, relativePath) {
  if (await pathExists(resolveProjectPath(root, relativePath))) {
    throw new Error(`${relativePath} already exists; immutable successor is never overwritten`);
  }
}

async function writeExclusiveSynced(absolutePath, bytes) {
  let handle;
  let created = false;
  try {
    handle = await open(absolutePath, "wx", 0o444);
    created = true;
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = null;
  } catch (error) {
    const cleanupErrors = [];
    if (handle) {
      try { await handle.close(); } catch (cleanupError) { cleanupErrors.push(cleanupError); }
    }
    if (created) {
      try { await unlink(absolutePath); } catch (cleanupError) {
        if (cleanupError?.code !== "ENOENT") cleanupErrors.push(cleanupError);
      }
    }
    if (cleanupErrors.length) {
      throw new AggregateError(
        [error, ...cleanupErrors],
        `exclusive write failed with incomplete cleanup: ${absolutePath}`,
      );
    }
    throw error;
  }
}

async function publishStagedPair({
  root,
  outputs,
  publishFailureAt = null,
}) {
  invariant(
    publishFailureAt === null || [1, 2, 3].includes(publishFailureAt),
    "publishFailureAt must be null or 1..3",
  );
  for (const output of outputs) await assertAbsent(root, output.path);
  const stagingRoot = await mkdtemp(path.resolve(root, ".g5-l4-keyterms-r2-stage-"));
  const staged = [];
  const createdFinals = [];
  let reportsRootCreated = false;
  let operationError = null;
  try {
    for (const [index, output] of outputs.entries()) {
      const stagedPath = path.join(stagingRoot, `${index}-${path.basename(output.path)}`);
      await writeExclusiveSynced(stagedPath, output.bytes);
      invariant(
        (await readFile(stagedPath)).equals(output.bytes),
        `${output.path}: staged bytes drifted`,
      );
      staged.push({...output, stagedPath});
    }
    for (const output of outputs) await assertAbsent(root, output.path);
    const reportsRoot = path.resolve(root, "reports");
    if (!(await pathExists(reportsRoot))) {
      await mkdir(reportsRoot, {recursive: false, mode: 0o755});
      reportsRootCreated = true;
    }
    for (const [index, output] of staged.entries()) {
      if (publishFailureAt === index + 1) {
        throw new Error(`injected publish failure at step ${publishFailureAt}`);
      }
      const finalPath = resolveProjectPath(root, output.path);
      try {
        await writeExclusiveSynced(finalPath, output.bytes);
      } catch (error) {
        if (await pathExists(finalPath)) createdFinals.push(output.path);
        throw error;
      }
      createdFinals.push(output.path);
    }
    if (publishFailureAt === 3) {
      throw new Error("injected publish failure at step 3");
    }
  } catch (error) {
    operationError = error;
  }

  const cleanupErrors = [];
  try {
    await rm(stagingRoot, {recursive: true, force: false});
  } catch (error) {
    cleanupErrors.push(new Error(`staging cleanup failed: ${error.message}`, {cause: error}));
  }
  if (operationError || cleanupErrors.length) {
    for (const relativePath of [...createdFinals].reverse()) {
      try {
        await unlink(resolveProjectPath(root, relativePath));
      } catch (error) {
        if (error?.code !== "ENOENT") {
          cleanupErrors.push(new Error(`rollback unlink failed for ${relativePath}: ${error.message}`, {cause: error}));
        }
      }
    }
    for (const relativePath of createdFinals) {
      if (await pathExists(resolveProjectPath(root, relativePath))) {
        cleanupErrors.push(new Error(`rollback residual remains: ${relativePath}`));
      }
    }
    if (await pathExists(stagingRoot)) {
      cleanupErrors.push(new Error(`staging residual remains: ${stagingRoot}`));
    }
    if (reportsRootCreated) {
      try { await rmdir(path.resolve(root, "reports")); } catch (error) {
        cleanupErrors.push(new Error(`created reports directory cleanup failed: ${error.message}`, {cause: error}));
      }
    }
    if (cleanupErrors.length) {
      throw new AggregateError(
        [operationError, ...cleanupErrors].filter(Boolean),
        "combined Key Terms r2 pair publication failed with cleanup errors",
      );
    }
    throw operationError;
  }
}

export async function writeOrCheckSuccessorPair({
  projectRoot = PROJECT_ROOT,
  report,
  check = false,
  publishFailureAt = null,
} = {}) {
  const root = path.resolve(projectRoot);
  validateG5L4CombinedKeytermsProductReferenceBindingSuccessorR2(report);
  const outputs = [
    {path: OUTPUT_PATHS.json, bytes: Buffer.from(stableJson(report), "utf8")},
    {path: OUTPUT_PATHS.markdown, bytes: Buffer.from(renderMarkdown(report), "utf8")},
  ];
  if (check) {
    for (const output of outputs) {
      const actual = await readRegularFile(
        resolveProjectPath(root, output.path),
        output.path,
      );
      invariant(actual.equals(output.bytes), `${output.path} is stale`);
    }
    return {
      action: "verified",
      outputs: outputs.map((output) => ({
        path: output.path,
        bytes: output.bytes.length,
        sha256: sha256(output.bytes),
      })),
    };
  }
  await publishStagedPair({root, outputs, publishFailureAt});
  return {
    action: "created",
    outputs: outputs.map((output) => ({
      path: output.path,
      bytes: output.bytes.length,
      sha256: sha256(output.bytes),
    })),
  };
}

export function parseArguments(argv) {
  invariant(
    argv.length === 1 && ["--build", "--check"].includes(argv[0]),
    "Use exactly one mode: --build or --check",
  );
  return {check: argv[0] === "--check"};
}

export async function main(argv = process.argv.slice(2)) {
  const {check} = parseArguments(argv);
  const report =
    await buildG5L4CombinedKeytermsProductReferenceBindingSuccessorR2();
  const result = await writeOrCheckSuccessorPair({report, check});
  process.stdout.write(stableJson({
    ...result,
    successorId: SUCCESSOR_ID,
    releaseId: RELEASE_ID,
    acceptanceNeutral: true,
    strictAcceptanceEffect: "none",
  }));
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  await main();
}
