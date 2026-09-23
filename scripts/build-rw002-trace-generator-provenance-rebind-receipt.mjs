#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const RW002_TRACE_REBIND_RECEIPT =
  "migrations/course-g05-l13-rw-002/audit/rw002-trace-generator-provenance-rebind-receipt.json";

const ANIMATION_ID = "course-g05-l13-rw-002";
const WORKSPACE = `migrations/${ANIMATION_ID}`;
const TRACE_GENERATOR = "scripts/build-course-trace-specs.mjs";
const TRACE_INDEX = "migrations/course-shell-pilot-trace-spec-index.json";
const GENERATOR_POINTER =
  "/sourceBindings/scheduleDerivation/generator/sha256";

const HISTORICAL_GENERATOR = Object.freeze({
  path: TRACE_GENERATOR,
  bytes: 126_835,
  sha256: "96deed49c23c753f073b74d9290940e74d5af0e94a22212970c2377209376599",
});

const CURRENT_GENERATOR = Object.freeze({
  path: TRACE_GENERATOR,
  bytes: 154_192,
  sha256: "e9eb23d2f76966672c215d8fff6202d7328bcff9046b0584e9f041873ab7ca1f",
});

const TRACE_TRANSITIONS = Object.freeze([
  Object.freeze({
    language: "en",
    requirementId: "req:sprite-334:default:en",
    traceId: "trace:sprite-334:default:en:seed-0",
    path:
      `${WORKSPACE}/audit/trace-specs/req-sprite-334-default-en.json`,
    bytes: 28_992,
    historicalSha256:
      "a77ffc7b52a12c1023122d37d250e607adaa7b34e3ab170a380d84c85705589e",
    currentSha256:
      "9b992c1344f103faa1ef117d6eedc7717d107277d1840b352d08cda201b31f4b",
  }),
  Object.freeze({
    language: "es",
    requirementId: "req:sprite-334:default:es",
    traceId: "trace:sprite-334:default:es:seed-0",
    path:
      `${WORKSPACE}/audit/trace-specs/req-sprite-334-default-es.json`,
    bytes: 28_992,
    historicalSha256:
      "c6f8f2e24f2fef404b79dbbac0903713de67836e2aa090497c702bcf10f4061e",
    currentSha256:
      "93489d567f0e6d0f02a54ad850143b364d6b690d85131c1b85452727eaabe4bf",
  }),
]);

const SOURCE_INPUTS = Object.freeze({
  sourceSwf: Object.freeze({
    path:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/RW/L13RW02.swf",
    bytes: 4_796_905,
    sha256: "bf9ab1d12832fbe54c5bef08d0dd51307169eefbae1f75188efd9db94ed9e4e6",
  }),
  geometryParser: Object.freeze({
    path: "scripts/parse-swfmill-course-button-trace.py",
    bytes: 11_481,
    sha256: "ce074ca3075cf63657fcdc1a03ad2451a6767a788a1720e0461f2f43e5ab494d",
  }),
  swfmillXml: Object.freeze({
    path: `${WORKSPACE}/audit/machine/swfmill.xml.gz`,
    bytes: 5_549_950,
    sha256: "ed3f5e973676f18d22473a5079b084f14e581c27ab31728dea30fff73480592f",
  }),
  ffdecScripts: Object.freeze({
    path: `${WORKSPACE}/audit/machine/ffdec-scripts.txt.gz`,
    bytes: 228,
    sha256: "d88251b1b31171a25cb97ba318f0ae77859531dc5e24dba143752576f211df55",
  }),
  scenarioInventory: Object.freeze({
    path: `${WORKSPACE}/audit/scenario-inventory.json`,
    sha256: "088dfbcd1281aa844b7e66ed364ed996c3429961a7a63cb7f4dd1c77eb25e597",
    technicalProjectionSha256:
      "8955827ee226b422640d3ca86af37a3e41aa8af8ff3028196e4aea656f043a0d",
  }),
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
  return sha256(stableJson(value));
}

function portable(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function projectPath(relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath),
    `invalid project-relative path: ${relativePath}`,
  );
  const resolved = path.resolve(projectRoot, relativePath);
  const relative = path.relative(projectRoot, resolved);
  invariant(
    relative &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    `path escapes the project root: ${relativePath}`,
  );
  return resolved;
}

async function readBinding(relativePath) {
  const absolute = projectPath(relativePath);
  const metadata = await lstat(absolute);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath} must be a regular non-symlink file`,
  );
  invariant(
    (await stat(absolute)).nlink === 1,
    `${relativePath} must not have multiple hard links`,
  );
  const contents = await readFile(absolute);
  return {
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
    contents,
  };
}

function withoutContents(binding) {
  const {contents, ...descriptor} = binding;
  return descriptor;
}

function assertPinned(binding, expected, label) {
  invariant(
    binding.path === expected.path &&
      binding.bytes === expected.bytes &&
      binding.sha256 === expected.sha256,
    `${label} differs from its pinned identity`,
  );
}

function resolveJsonPointer(document, pointer) {
  invariant(
    typeof pointer === "string" && pointer.startsWith("/"),
    `invalid JSON pointer: ${pointer}`,
  );
  return pointer
    .slice(1)
    .split("/")
    .reduce((value, token) => {
      const key = token.replaceAll("~1", "/").replaceAll("~0", "~");
      invariant(
        value !== null &&
          value !== undefined &&
          Object.hasOwn(value, key),
        `JSON pointer does not resolve: ${pointer}`,
      );
      return value[key];
    }, document);
}

function setJsonPointer(document, pointer, replacement) {
  const tokens = pointer
    .slice(1)
    .split("/")
    .map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~"));
  const key = tokens.pop();
  const parent = tokens.reduce((value, token) => value[token], document);
  invariant(
    parent !== null &&
      parent !== undefined &&
      typeof key === "string" &&
      Object.hasOwn(parent, key),
    `JSON pointer cannot be replaced: ${pointer}`,
  );
  parent[key] = replacement;
}

function escapedPointerToken(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

export function jsonDifferencePointers(left, right, pointer = "") {
  if (Object.is(left, right)) return [];
  const leftIsObject = left !== null && typeof left === "object";
  const rightIsObject = right !== null && typeof right === "object";
  if (!leftIsObject || !rightIsObject || Array.isArray(left) !== Array.isArray(right)) {
    return [pointer || "/"];
  }
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])]
    .sort((a, b) => a.localeCompare(b, "en"));
  const differences = [];
  for (const key of keys) {
    const childPointer = `${pointer}/${escapedPointerToken(key)}`;
    if (!Object.hasOwn(left, key) || !Object.hasOwn(right, key)) {
      differences.push(childPointer);
      continue;
    }
    differences.push(...jsonDifferencePointers(left[key], right[key], childPointer));
  }
  return differences;
}

function sourceInputProjection(trace) {
  const projection = structuredClone(trace.sourceBindings);
  delete projection.scheduleDerivation.generator.sha256;
  return projection;
}

export function reconstructHistoricalRw002Trace(currentTrace, transition) {
  invariant(
    currentTrace?.animationId === ANIMATION_ID &&
      currentTrace?.requirementId === transition.requirementId &&
      currentTrace?.identity?.traceId === transition.traceId &&
      currentTrace?.identity?.language === transition.language &&
      currentTrace?.identity?.frameDomainId === "sprite-334" &&
      currentTrace?.traceModel?.kind === "stateful-natural-trace" &&
      currentTrace?.traceSpecStatus ===
        "source-schedule-ready-for-authoritative-execution",
    `${transition.language} RW002 nested trace identity is invalid`,
  );
  invariant(
    resolveJsonPointer(currentTrace, GENERATOR_POINTER) ===
      CURRENT_GENERATOR.sha256,
    `${transition.language} RW002 trace does not bind the current generator`,
  );
  const historicalTrace = structuredClone(currentTrace);
  setJsonPointer(
    historicalTrace,
    GENERATOR_POINTER,
    HISTORICAL_GENERATOR.sha256,
  );
  const changedJsonPointers = jsonDifferencePointers(
    historicalTrace,
    currentTrace,
  );
  invariant(
    changedJsonPointers.length === 1 &&
      changedJsonPointers[0] === GENERATOR_POINTER,
    `${transition.language} RW002 trace changed outside the allowlisted generator provenance pointer`,
  );
  const rendered = stableJson(historicalTrace);
  invariant(
    Buffer.byteLength(rendered) === transition.bytes &&
      sha256(rendered) === transition.historicalSha256,
    `${transition.language} RW002 historical trace hash cannot be reconstructed`,
  );
  return {
    historicalTrace,
    rendered,
    changedJsonPointers,
    sourceInputProjectionSha256: fingerprint(
      sourceInputProjection(historicalTrace),
    ),
  };
}

function validateCurrentTrace({
  transition,
  binding,
  trace,
  currentGenerator,
  sourceInputs,
}) {
  assertPinned(
    binding,
    {
      path: transition.path,
      bytes: transition.bytes,
      sha256: transition.currentSha256,
    },
    `${transition.language} current RW002 trace`,
  );
  assertPinned(
    currentGenerator,
    CURRENT_GENERATOR,
    "current course trace generator",
  );
  const reconstruction = reconstructHistoricalRw002Trace(trace, transition);
  const currentProjectionSha256 = fingerprint(sourceInputProjection(trace));
  invariant(
    reconstruction.sourceInputProjectionSha256 === currentProjectionSha256,
    `${transition.language} RW002 source-input projection changed`,
  );
  const derivation = trace.sourceBindings.scheduleDerivation;
  invariant(
    derivation.generator.path === TRACE_GENERATOR &&
      derivation.generator.sha256 === currentGenerator.sha256 &&
      derivation.geometryParser.path ===
        SOURCE_INPUTS.geometryParser.path &&
      derivation.geometryParser.sha256 ===
        sourceInputs.geometryParser.sha256 &&
      derivation.sourceArtifacts.sourceSwf.path ===
        SOURCE_INPUTS.sourceSwf.path &&
      derivation.sourceArtifacts.sourceSwf.sha256 ===
        sourceInputs.sourceSwf.sha256 &&
      derivation.sourceArtifacts.swfmillXml.path ===
        "audit/machine/swfmill.xml.gz" &&
      derivation.sourceArtifacts.swfmillXml.sha256 ===
        sourceInputs.swfmillXml.sha256 &&
      derivation.sourceArtifacts.ffdecScripts.path ===
        "audit/machine/ffdec-scripts.txt.gz" &&
      derivation.sourceArtifacts.ffdecScripts.sha256 ===
        sourceInputs.ffdecScripts.sha256 &&
      derivation.sourceArtifacts.scenarioInventoryTechnicalProjection
        .sha256 === SOURCE_INPUTS.scenarioInventory.technicalProjectionSha256 &&
      trace.sourceBindings.coverageInventoryBinding
        .fileSha256AtSpecGeneration ===
        sourceInputs.scenarioInventory.sha256 &&
      trace.sourceBindings.coverageInventoryBinding
        .technicalProjectionSha256 ===
        SOURCE_INPUTS.scenarioInventory.technicalProjectionSha256 &&
      derivation.executionEvidenceCreated === false,
    `${transition.language} RW002 source-input binding is stale`,
  );
  invariant(
    trace.strictAcceptanceEffect?.startsWith("none") === true,
    `${transition.language} RW002 trace crossed its acceptance-neutral boundary`,
  );
  return {
    language: transition.language,
    requirementId: transition.requirementId,
    traceId: transition.traceId,
    changedJsonPointers: reconstruction.changedJsonPointers,
    historical: {
      path: transition.path,
      bytes: Buffer.byteLength(reconstruction.rendered),
      sha256: sha256(reconstruction.rendered),
      completePreimageReconstructed: true,
    },
    current: withoutContents(binding),
    currentIndexBindingVerified: true,
    historicalHashReconstructed: true,
    sourceInputProjectionSha256: currentProjectionSha256,
    sourceInputsUnchangedAcrossTransition: true,
    executionEvidenceCreated: false,
    strictAcceptanceEffect: "none",
  };
}

function validateIndex({index, indexBinding, traces}) {
  invariant(
    index?.schemaVersion === 1 &&
      index.artifactType === "course-shell-pilot-trace-spec-index" &&
      index.strictAcceptanceEffect?.startsWith("none") === true,
    "current course trace index identity or authority boundary is invalid",
  );
  const matchingPilots = index.pilots.filter(
    (pilot) => pilot.animationId === ANIMATION_ID,
  );
  invariant(
    matchingPilots.length === 1,
    "current course trace index must contain exactly one RW002 pilot",
  );
  const pilotIndex = index.pilots.indexOf(matchingPilots[0]);
  const pilot = matchingPilots[0];
  invariant(
    pilot.sourceSwfSha256 === SOURCE_INPUTS.sourceSwf.sha256 &&
      pilot.technicalBindings.manifest.sha256 ===
        traces[0].sourceBindings.migrationManifest.sha256 &&
      pilot.technicalBindings.coverage.sha256 ===
        traces[0].sourceBindings.fullFrameCoverage.sha256 &&
      pilot.technicalBindings.scenarioInventory.sha256 ===
        SOURCE_INPUTS.scenarioInventory.technicalProjectionSha256,
    "current RW002 trace index technical bindings are stale",
  );
  const indexedTraces = TRACE_TRANSITIONS.map((transition) => {
    const matches = pilot.traceSpecs.filter(
      (entry) =>
        entry.requirementId === transition.requirementId &&
        entry.traceId === transition.traceId &&
        entry.file === transition.path,
    );
    invariant(
      matches.length === 1 &&
        matches[0].sha256 === transition.currentSha256 &&
        matches[0].frameDomainId === "sprite-334" &&
        matches[0].language === transition.language &&
        matches[0].traceModel === "stateful-natural-trace" &&
        matches[0].status ===
          "source-schedule-ready-for-authoritative-execution",
      `${transition.language} RW002 current index entry is stale`,
    );
    return {
      language: transition.language,
      requirementId: transition.requirementId,
      file: transition.path,
      sha256: matches[0].sha256,
    };
  });
  return {
    ...withoutContents(indexBinding),
    pilotJsonPointer: `/pilots/${pilotIndex}`,
    indexedTraces,
    current: true,
    strictAcceptanceEffect: "none",
  };
}

function buildReceipt({
  traceResults,
  sourceInputs,
  currentGenerator,
  traceIndex,
  receiptGenerator,
}) {
  invariant(
    traceResults[0].sourceInputProjectionSha256 ===
      traceResults[1].sourceInputProjectionSha256,
    "RW002 EN/ES nested traces do not share the same source inputs",
  );
  const receipt = {
    schemaVersion: 1,
    artifactType: "rw002-trace-generator-provenance-rebind-receipt",
    receiptId: "course-g05-l13-rw-002-trace-generator-rebind-2026-07-27",
    animationId: ANIMATION_ID,
    status:
      "verified-acceptance-neutral-generator-provenance-only-rebind",
    reason:
      "The course trace generator changed while the RW002 nested trace source inputs and derived schedule remained unchanged. Each prior EN/ES trace is reconstructed byte-for-byte by changing only the generator SHA-256 provenance pointer.",
    transition: {
      historicalGenerator: HISTORICAL_GENERATOR,
      currentGenerator: withoutContents(currentGenerator),
      allowlistedChangedJsonPointers: [GENERATOR_POINTER],
      generatorPathUnchanged: true,
      generatorSha256Changed: true,
    },
    nestedTraces: traceResults,
    unchangedSourceInputs: {
      ...Object.fromEntries(
        Object.entries(sourceInputs).map(([key, value]) => [
          key,
          withoutContents(value),
        ]),
      ),
      sourceInputProjectionSha256:
        traceResults[0].sourceInputProjectionSha256,
      enEsSourceInputProjectionEqual: true,
      historicalVsCurrentSourceInputProjectionEqual: true,
    },
    currentTraceIndex: traceIndex,
    verification: {
      exactChangedJsonPointerCountPerTrace: 1,
      everyChangedJsonPointerAllowlisted: true,
      everyHistoricalTraceHashReconstructed: true,
      everyCurrentTraceHashVerified: true,
      currentTraceIndexVerified: true,
      sourceInputsPhysicallyHashVerified: true,
      sourceInputsUnchanged: true,
      legacyPreimageCopiedIntoProject: false,
    },
    authorityBoundary: {
      acceptanceNeutral: true,
      planningProvenanceOnly: true,
      originalRuntimeAuthorityCreated: false,
      audioAcceptanceCreated: false,
      humanReviewCreated: false,
      ownerAcceptanceCreated: false,
      strictCompletionCreated: false,
      completionLedgerWriteAuthorized: false,
      lessonReleaseWriteAuthorized: false,
      publicReleaseAuthorized: false,
      sourceAssetWriteAuthorized: false,
      strictAcceptanceEffect: "none",
    },
    generatedBy: withoutContents(receiptGenerator),
  };
  receipt.receiptFingerprintSha256 = fingerprint(receipt);
  return receipt;
}

function validateFingerprint(document) {
  const projection = structuredClone(document);
  delete projection.receiptFingerprintSha256;
  invariant(
    document.receiptFingerprintSha256 === fingerprint(projection),
    "RW002 trace rebind receipt fingerprint is stale",
  );
}

export function validateRw002TraceGeneratorProvenanceRebindReceipt(receipt) {
  invariant(
    receipt?.schemaVersion === 1 &&
      receipt.artifactType ===
        "rw002-trace-generator-provenance-rebind-receipt" &&
      receipt.animationId === ANIMATION_ID &&
      receipt.status ===
        "verified-acceptance-neutral-generator-provenance-only-rebind",
    "RW002 trace rebind receipt identity is invalid",
  );
  validateFingerprint(receipt);
  invariant(
    receipt.transition?.historicalGenerator?.sha256 ===
      HISTORICAL_GENERATOR.sha256 &&
      receipt.transition?.currentGenerator?.sha256 ===
        CURRENT_GENERATOR.sha256 &&
      receipt.transition?.generatorPathUnchanged === true &&
      receipt.transition?.generatorSha256Changed === true &&
      JSON.stringify(
        receipt.transition?.allowlistedChangedJsonPointers,
      ) === JSON.stringify([GENERATOR_POINTER]),
    "RW002 trace rebind generator transition is invalid",
  );
  invariant(
    receipt.nestedTraces?.length === TRACE_TRANSITIONS.length,
    "RW002 trace rebind receipt must cover EN and ES nested traces",
  );
  for (const transition of TRACE_TRANSITIONS) {
    const matches = receipt.nestedTraces.filter(
      (trace) =>
        trace.language === transition.language &&
        trace.requirementId === transition.requirementId,
    );
    invariant(
      matches.length === 1 &&
        matches[0].historical?.sha256 === transition.historicalSha256 &&
        matches[0].current?.sha256 === transition.currentSha256 &&
        matches[0].historical?.completePreimageReconstructed === true &&
        matches[0].historicalHashReconstructed === true &&
        matches[0].sourceInputsUnchangedAcrossTransition === true &&
        matches[0].executionEvidenceCreated === false &&
        matches[0].strictAcceptanceEffect === "none" &&
        JSON.stringify(matches[0].changedJsonPointers) ===
          JSON.stringify([GENERATOR_POINTER]),
      `${transition.language} RW002 trace rebind evidence is invalid`,
    );
  }
  invariant(
    receipt.unchangedSourceInputs?.enEsSourceInputProjectionEqual === true &&
      receipt.unchangedSourceInputs
        ?.historicalVsCurrentSourceInputProjectionEqual === true &&
      receipt.currentTraceIndex?.current === true &&
      receipt.currentTraceIndex?.indexedTraces?.length === 2 &&
      receipt.verification?.exactChangedJsonPointerCountPerTrace === 1 &&
      receipt.verification?.everyChangedJsonPointerAllowlisted === true &&
      receipt.verification?.everyHistoricalTraceHashReconstructed === true &&
      receipt.verification?.everyCurrentTraceHashVerified === true &&
      receipt.verification?.currentTraceIndexVerified === true &&
      receipt.verification?.sourceInputsPhysicallyHashVerified === true &&
      receipt.verification?.sourceInputsUnchanged === true &&
      receipt.verification?.legacyPreimageCopiedIntoProject === false,
    "RW002 trace rebind verification is incomplete",
  );
  invariant(
    receipt.authorityBoundary?.acceptanceNeutral === true &&
      receipt.authorityBoundary?.planningProvenanceOnly === true &&
      receipt.authorityBoundary?.originalRuntimeAuthorityCreated === false &&
      receipt.authorityBoundary?.audioAcceptanceCreated === false &&
      receipt.authorityBoundary?.humanReviewCreated === false &&
      receipt.authorityBoundary?.ownerAcceptanceCreated === false &&
      receipt.authorityBoundary?.strictCompletionCreated === false &&
      receipt.authorityBoundary?.completionLedgerWriteAuthorized === false &&
      receipt.authorityBoundary?.lessonReleaseWriteAuthorized === false &&
      receipt.authorityBoundary?.publicReleaseAuthorized === false &&
      receipt.authorityBoundary?.sourceAssetWriteAuthorized === false &&
      receipt.authorityBoundary?.strictAcceptanceEffect === "none",
    "RW002 trace rebind receipt crossed an authority boundary",
  );
  return receipt;
}

export async function buildRw002TraceGeneratorProvenanceRebindReceipt({
  check = false,
} = {}) {
  const [
    currentGenerator,
    indexBinding,
    receiptGenerator,
    ...sourceInputBindings
  ] = await Promise.all([
    readBinding(TRACE_GENERATOR),
    readBinding(TRACE_INDEX),
    readBinding(portable(scriptPath)),
    ...Object.values(SOURCE_INPUTS).map((descriptor) =>
      readBinding(descriptor.path),
    ),
  ]);
  assertPinned(
    currentGenerator,
    CURRENT_GENERATOR,
    "current course trace generator",
  );
  const sourceInputs = Object.fromEntries(
    Object.keys(SOURCE_INPUTS).map((key, index) => [
      key,
      sourceInputBindings[index],
    ]),
  );
  for (const [key, descriptor] of Object.entries(SOURCE_INPUTS)) {
    const expected = {
      path: descriptor.path,
      bytes: sourceInputs[key].bytes,
      sha256: descriptor.sha256,
    };
    if (descriptor.bytes !== undefined) expected.bytes = descriptor.bytes;
    assertPinned(sourceInputs[key], expected, `RW002 ${key}`);
  }
  const loadedTraces = await Promise.all(
    TRACE_TRANSITIONS.map(async (transition) => {
      const binding = await readBinding(transition.path);
      return {
        transition,
        binding,
        trace: JSON.parse(binding.contents.toString("utf8")),
      };
    }),
  );
  invariant(
    fingerprint(sourceInputProjection(loadedTraces[0].trace)) ===
      fingerprint(sourceInputProjection(loadedTraces[1].trace)),
    "RW002 EN/ES current source-input projections differ",
  );
  const traceResults = loadedTraces.map(({transition, binding, trace}) =>
    validateCurrentTrace({
      transition,
      binding,
      trace,
      currentGenerator,
      sourceInputs,
    }),
  );
  const index = JSON.parse(indexBinding.contents.toString("utf8"));
  const traceIndex = validateIndex({
    index,
    indexBinding,
    traces: loadedTraces.map(({trace}) => trace),
  });
  const receipt = buildReceipt({
    traceResults,
    sourceInputs,
    currentGenerator,
    traceIndex,
    receiptGenerator,
  });
  validateRw002TraceGeneratorProvenanceRebindReceipt(receipt);
  const rendered = stableJson(receipt);
  const output = projectPath(RW002_TRACE_REBIND_RECEIPT);
  if (check) {
    const observed = await readFile(output, "utf8");
    invariant(
      observed === rendered,
      "RW002 trace-generator provenance rebind receipt is stale",
    );
  } else {
    await mkdir(path.dirname(output), {recursive: true});
    await writeFile(output, rendered, "utf8");
  }
  return {
    action: check ? "verified" : "written",
    animationId: ANIMATION_ID,
    receipt: RW002_TRACE_REBIND_RECEIPT,
    receiptSha256: sha256(rendered),
    traceCount: traceResults.length,
    exactChangedJsonPointerCountPerTrace: 1,
    everyHistoricalTraceHashReconstructed: true,
    sourceInputsUnchanged: true,
    currentIndexVerified: true,
    strictAcceptanceEffect: "none",
  };
}

export function parseArguments(argv) {
  const options = {check: false, help: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`unknown argument: ${argument}`);
  }
  return options;
}

function usage() {
  return "Usage: node scripts/build-rw002-trace-generator-provenance-rebind-receipt.mjs [--check]\n";
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(usage());
    else {
      const result =
        await buildRw002TraceGeneratorProvenanceRebindReceipt(options);
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    }
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}
