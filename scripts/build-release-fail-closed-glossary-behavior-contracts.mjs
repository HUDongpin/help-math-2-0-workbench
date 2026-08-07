#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {
  HOST_GLOSSARY_ACTION_TYPE,
  HOST_GLOSSARY_FAMILY_ID,
  acceptanceNeutralHostGlossaryEffects,
  buildHostGlossaryFixtures,
  createFailClosedHostGlossaryState,
  deriveHostGlossaryMemberContract,
  validateHostGlossaryReleaseContract,
} from "./lib/fail-closed-host-glossary-contract.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(scriptPath), "..");
const GENERATOR_PATH =
  "scripts/build-release-fail-closed-glossary-behavior-contracts.mjs";
const CONTRACT_MODULE_PATH =
  "scripts/lib/fail-closed-host-glossary-contract.mjs";
const RELEASE_CATALOG_PATH = "catalog/lesson-releases.json";
const OUTPUT_PARENT = "reports/lesson-release-behavior-contracts";
const SOURCE_PREFIX =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectPath(relativePath, root = ROOT) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required");
  invariant(!path.isAbsolute(relativePath),
    `absolute project path is forbidden: ${relativePath}`);
  const resolved = path.resolve(root, relativePath);
  const projected = path.relative(root, resolved);
  invariant(projected && !projected.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(projected), `project path escapes root: ${relativePath}`);
  return resolved;
}

async function readBinding(relativePath, root = ROOT) {
  const absolutePath = projectPath(relativePath, root);
  const metadata = await lstat(absolutePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath}: expected an ordinary non-symlink file`);
  const contents = await readFile(absolutePath);
  return {
    path: portable(relativePath),
    bytes: contents.length,
    sha256: sha256(contents),
    mode: `0${(metadata.mode & 0o7777).toString(8)}`,
    readOnly: (metadata.mode & 0o222) === 0,
    contents,
  };
}

function withoutContents(binding, {includeMode = false} = {}) {
  return {
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
    ...(includeMode
      ? {mode: binding.mode, readOnly: binding.readOnly}
      : {}),
  };
}

function parseJson(binding) {
  return JSON.parse(binding.contents.toString("utf8"));
}

function outputPaths(releaseId) {
  const directory = `${OUTPUT_PARENT}/${releaseId}`;
  return {
    contract: `${directory}/host-glossary-release-contracts.json`,
    fixtures: `${directory}/host-glossary-release-fixtures.json`,
  };
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "en"));
}

export function parseArguments(argv) {
  const options = {
    check: false,
    ids: [],
    releaseId: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
    } else if (argument === "--release-id") {
      invariant(!options.releaseId, "--release-id may be provided only once");
      options.releaseId = argv[++index] ?? null;
      invariant(options.releaseId && !options.releaseId.startsWith("--"),
        "--release-id requires a value");
    } else if (argument === "--id") {
      const id = argv[++index] ?? null;
      invariant(id && !id.startsWith("--"), "--id requires a value");
      invariant(!options.ids.includes(id), `duplicate --id: ${id}`);
      options.ids.push(id);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  invariant(options.releaseId, "--release-id is required");
  return options;
}

function validateRelease(release, selectedIds) {
  invariant(release?.releaseId, "exact lesson release is required");
  invariant(release.publicationMode === "atomic",
    `${release.releaseId}: release must remain atomic`);
  invariant(release.expectedCounts?.members === release.members?.length,
    `${release.releaseId}: release member count drifted`);
  invariant(new Set(release.members.map(({animationId}) => animationId)).size ===
    release.members.length, `${release.releaseId}: duplicate member identity`);
  const selectedSet = selectedIds.length > 0
    ? new Set(selectedIds)
    : new Set(release.members.map(({animationId}) => animationId));
  for (const id of selectedSet) {
    invariant(release.members.some(({animationId}) => animationId === id),
      `${id}: not a member of exact release ${release.releaseId}`);
  }
  return release.members.filter(({animationId}) => selectedSet.has(animationId));
}

async function deriveMember(member, {root = ROOT} = {}) {
  const scenarioPath =
    `migrations/${member.animationId}/audit/scenario-inventory.json`;
  const scenarioBinding = await readBinding(scenarioPath, root);
  const scenario = parseJson(scenarioBinding);
  invariant(scenario.source?.swf === `${SOURCE_PREFIX}${member.source.path}`,
    `${member.animationId}: scenario source path disagrees with release`);
  const sourceBinding = await readBinding(scenario.source.swf, root);
  invariant(sourceBinding.readOnly,
    `${member.animationId}: canonical source unexpectedly has a write bit`);
  const memberContract = deriveHostGlossaryMemberContract({
    member,
    scenarioInventory: scenario,
    scenarioInventoryBinding: withoutContents(scenarioBinding),
    sourceBinding: withoutContents(sourceBinding, {includeMode: true}),
  });
  return memberContract;
}

function contractSummary(release, selectedMembers, memberContracts) {
  const intents = memberContracts.flatMap(({intents}) => intents);
  const exclusions = memberContracts.flatMap(({exclusions}) => exclusions);
  return {
    releaseMemberCount: release.members.length,
    selectedReleaseMemberCount: selectedMembers.length,
    scenarioInventoryCount: memberContracts.length,
    totalHandlerCount: memberContracts.reduce((sum, member) =>
      sum + member.totalHandlerCount, 0),
    glossaryCategoryHandlerCount: memberContracts.reduce((sum, member) =>
      sum + member.glossaryCategoryHandlerCount, 0),
    eligibleIntentCount: intents.length,
    excludedGlossaryHandlerCount: exclusions.length,
    memberWithEligibleIntentCount:
      memberContracts.filter(({eligibleIntentCount}) =>
        eligibleIntentCount > 0).length,
    memberWithoutEligibleIntentCount:
      memberContracts.filter(({eligibleIntentCount}) =>
        eligibleIntentCount === 0).length,
    uniqueLiteralTermCount:
      new Set(intents.map(({literalKeyAttribute}) =>
        literalKeyAttribute)).size,
    staticPlacementEvidenceCount: intents.reduce((sum, intent) =>
      sum + intent.staticButtonEvidence.placements.length, 0),
    staticHitShapeRecordCount: intents.reduce((sum, intent) =>
      sum + intent.staticButtonEvidence.hitRecords.length, 0),
    authoritativeRuntimeEvidenceCount: 0,
    hostEffectsExecutedCount: 0,
    rendererRegistrationCount: 0,
  };
}

export async function deriveReleaseHostGlossaryArtifacts({
  ids = [],
  releaseId,
  root = ROOT,
} = {}) {
  invariant(releaseId, "exact release ID is required");
  const [releaseCatalogBinding, generatorBinding, moduleBinding] =
    await Promise.all([
      readBinding(RELEASE_CATALOG_PATH, root),
      readBinding(GENERATOR_PATH, root),
      readBinding(CONTRACT_MODULE_PATH, root),
    ]);
  const releaseCatalog = parseJson(releaseCatalogBinding);
  const release = releaseCatalog.releases?.find((candidate) =>
    candidate.releaseId === releaseId);
  invariant(release, `Unknown release: ${releaseId}`);
  const selectedMembers = validateRelease(release, ids);
  invariant(selectedMembers.length > 0,
    `${releaseId}: selected member set is empty`);
  const memberContracts = await Promise.all(selectedMembers.map((member) =>
    deriveMember(member, {root})));
  const summary = contractSummary(release, selectedMembers, memberContracts);
  invariant(summary.eligibleIntentCount > 0,
    `${releaseId}: no exact host glossary release handlers were found`);

  const contract = {
    schemaVersion: 1,
    artifactType: "lesson-release-fail-closed-host-glossary-behavior-contracts",
    familyId: HOST_GLOSSARY_FAMILY_ID,
    releaseId,
    status: "static-contract-runtime-unverified",
    authorityStatement: [
      "This artifact converts one narrowly selected, statically complete AVM1 handler shape into executable fail-closed data: literal KeyAttribute assignment, DoHyperLinks callback request, and animation stop on an exact button release.",
      "The pure reducer projects the source intent but executes no legacy global/root write, host callback, timeline control, network request, audio operation, or renderer action.",
      "Static button definitions and placements do not prove natural runtime reachability, hit geometry, language behavior, callback output, or Adobe-runtime state transitions.",
      "No runtime, visual, audio, human, owner, strict-completion, release, or publication gate is advanced.",
    ],
    generator: withoutContents(generatorBinding),
    executableModule: {
      ...withoutContents(moduleBinding),
      actionType: HOST_GLOSSARY_ACTION_TYPE,
      reducerExport: "reduceFailClosedHostGlossaryAction",
      initialStateExport: "createFailClosedHostGlossaryState",
      fixtureExport: "buildHostGlossaryFixtures",
      executesLegacyHostCode: false,
    },
    releaseBinding: {
      catalog: withoutContents(releaseCatalogBinding),
      releaseType: release.releaseType,
      publicationMode: release.publicationMode,
      grade: release.grade,
      lesson: release.lesson,
      titleDisplay: release.titleDisplay,
      sourceLesson: release.sourceLesson,
      expectedCounts: release.expectedCounts,
    },
    selection: {
      subsetStatus: selectedMembers.length === release.members.length
        ? "all-release-members-inspected"
        : "explicit-release-member-subset-inspected",
      selectedAnimationIds: selectedMembers.map(({animationId}) => animationId),
      exactHandlerRule: {
        categoryIncludes: "glossary-or-hyperlink",
        scopeKind: "button-definition",
        event: ["release"],
        keyAttributeAssignment: "one exact JSON string literal",
        optionalAssignments:
          "zero or more exact _root.boolSendPageHLAClickRecord = true writes",
        callSequence: [
          "_root.DoHyperLinks()",
          "_root.animation_mc.animation.stop()",
        ],
        conditionals: 0,
        randomCalls: 0,
        externalSideEffects: 0,
        requiredStaticEvidence: [
          "matching DefineButton object identity",
          "at least one hit-shape record",
          "at least one static placement",
        ],
      },
      outOfScope: [
        "nonliteral glossary terms",
        "conditional, randomized, navigation, quiz, popup, audio, network, or shell-host handlers",
        "runtime reachability and pointer hit geometry",
        "DoHyperLinks host implementation and returned glossary content",
        "frame-domain, bilingual, audio, Replay, scoring, and terminal behavior",
      ],
    },
    summary,
    membersWithoutEligibleIntents: memberContracts
      .filter(({eligibleIntentCount}) => eligibleIntentCount === 0)
      .map(({animationId}) => animationId),
    literalTerms: sortedUnique(memberContracts.flatMap(({terms}) => terms)),
    excludedGlossaryHandlers:
      memberContracts.flatMap(({exclusions}) => exclusions),
    members: memberContracts,
    runtimeBlockers: [
      "authoritative original-runtime handler activation is absent",
      "static placements do not prove natural reachability or clickable geometry",
      "the lesson host DoHyperLinks implementation is not bound as an executable contract",
      "language suffixing, returned glossary content, close/resume behavior, and click reporting remain unobserved",
    ],
    acceptanceEffects: acceptanceNeutralHostGlossaryEffects(),
    rendererRegistryChanged: false,
    migrationStatusChanged: false,
    strictAcceptanceEffect: "none",
  };
  validateHostGlossaryReleaseContract(contract);
  return contract;
}

function validateFixtureArtifact(fixtures, contract) {
  invariant(fixtures?.schemaVersion === 1 &&
    fixtures.familyId === HOST_GLOSSARY_FAMILY_ID &&
    fixtures.releaseId === contract.releaseId,
  "host glossary fixture identity changed");
  invariant(fixtures.status === "executable-fixtures-runtime-unverified",
    "host glossary fixtures must stay runtime-unverified");
  invariant(fixtures.summary.validReleaseFixtureCount ===
    contract.summary.eligibleIntentCount,
  "valid release fixture coverage disagrees with contract");
  invariant(fixtures.summary.invalidActionFixtureCount >= 6,
    "invalid action fixture coverage is incomplete");
  invariant(fixtures.fixtures.validReleaseFixtures.every(({expectedState}) =>
    expectedState.status === "blocked-host-runtime-unverified" &&
      Object.values(expectedState.effectsExecuted).every((count) => count === 0)),
  "valid fixture executed a legacy effect");
  invariant(fixtures.fixtures.invalidActionFixtures.every(({expectedState}) =>
    expectedState.status === "blocked-invalid-action" &&
      Object.values(expectedState.effectsExecuted).every((count) => count === 0)),
  "invalid fixture did not fail closed");
  invariant(Object.values(fixtures.acceptanceEffects).every((value) =>
    value === false) && fixtures.strictAcceptanceEffect === "none",
  "fixtures advanced an acceptance gate");
  return true;
}

async function atomicWrite(relativePath, contents, root = ROOT) {
  const destination = projectPath(relativePath, root);
  await mkdir(path.dirname(destination), {recursive: true});
  const temporary = `${destination}.tmp-${process.pid}`;
  try {
    await writeFile(temporary, contents, {flag: "wx"});
    await rename(temporary, destination);
  } finally {
    await rm(temporary, {force: true});
  }
}

async function assertCurrent(relativePath, expected, root = ROOT) {
  const actual = await readFile(projectPath(relativePath, root), "utf8")
    .catch((error) => {
      if (error.code === "ENOENT") {
        throw new Error(`${relativePath}: generated artifact is missing`);
      }
      throw error;
    });
  invariant(actual === expected,
    `${relativePath}: generated artifact is stale; rerun without --check`);
}

export async function buildReleaseHostGlossaryArtifacts({
  check = false,
  ids = [],
  releaseId,
  root = ROOT,
} = {}) {
  const contract = await deriveReleaseHostGlossaryArtifacts({
    ids,
    releaseId,
    root,
  });
  const paths = outputPaths(releaseId);
  const contractText = stableJson(contract);
  const contractBinding = {
    path: paths.contract,
    bytes: Buffer.byteLength(contractText),
    sha256: sha256(contractText),
  };
  const fixtureSet = buildHostGlossaryFixtures(contract);
  const fixtures = {
    schemaVersion: 1,
    artifactType: "lesson-release-fail-closed-host-glossary-behavior-fixtures",
    familyId: HOST_GLOSSARY_FAMILY_ID,
    releaseId,
    status: "executable-fixtures-runtime-unverified",
    authorityStatement:
      "Each valid fixture must project a source term and then remain blocked; each invalid fixture must fail closed. No fixture executes or proves an original host effect.",
    contract: contractBinding,
    executableModule: contract.executableModule,
    initialState: createFailClosedHostGlossaryState(),
    summary: {
      validReleaseFixtureCount: fixtureSet.validReleaseFixtures.length,
      invalidActionFixtureCount: fixtureSet.invalidActionFixtures.length,
      projectedTermCount: contract.summary.uniqueLiteralTermCount,
      effectsExecutedCount: 0,
      runtimeVerifiedFixtureCount: 0,
    },
    fixtures: fixtureSet,
    acceptanceEffects: acceptanceNeutralHostGlossaryEffects(),
    rendererRegistryChanged: false,
    migrationStatusChanged: false,
    strictAcceptanceEffect: "none",
  };
  validateFixtureArtifact(fixtures, contract);
  const fixturesText = stableJson(fixtures);

  if (check) {
    await Promise.all([
      assertCurrent(paths.contract, contractText, root),
      assertCurrent(paths.fixtures, fixturesText, root),
    ]);
  } else {
    await atomicWrite(paths.contract, contractText, root);
    await atomicWrite(paths.fixtures, fixturesText, root);
  }
  return {
    operation: check ? "check" : "apply",
    releaseId,
    selectedMemberCount: contract.summary.selectedReleaseMemberCount,
    eligibleIntentCount: contract.summary.eligibleIntentCount,
    excludedGlossaryHandlerCount:
      contract.summary.excludedGlossaryHandlerCount,
    memberWithEligibleIntentCount:
      contract.summary.memberWithEligibleIntentCount,
    uniqueLiteralTermCount: contract.summary.uniqueLiteralTermCount,
    staticPlacementEvidenceCount:
      contract.summary.staticPlacementEvidenceCount,
    paths: {
      contract: {...contractBinding},
      fixtures: {
        path: paths.fixtures,
        bytes: Buffer.byteLength(fixturesText),
        sha256: sha256(fixturesText),
      },
    },
    rendererRegistryChanged: false,
    migrationStatusChanged: false,
    strictAcceptanceEffect: "none",
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const result = await buildReleaseHostGlossaryArtifacts(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] &&
    import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
