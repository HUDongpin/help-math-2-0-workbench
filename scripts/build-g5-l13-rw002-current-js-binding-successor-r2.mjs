#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  buildRw002BindingSuccessorArtifacts,
} from './build-g5-l13-rw002-current-js-binding-successor.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

export const RW002_BINDING_SUCCESSOR_R2 = Object.freeze({
  jsonPath:
    'migrations/course-g05-l13-rw-002/evidence/current-javascript-shared-runtime-binding-successor-2026-08-07-r2.json',
  markdownPath:
    'migrations/course-g05-l13-rw-002/evidence/current-javascript-shared-runtime-binding-successor-2026-08-07-r2.md',
  predecessor: Object.freeze({
    file:
      'migrations/course-g05-l13-rw-002/evidence/current-javascript-shared-runtime-binding-successor-2026-08-01-r1.json',
    bytes: 10257,
    sha256:
      'f879c1d1c225247ab6186c05a752e79f51d451f84c4710e7bdf6e6cc358346e4',
  }),
});

const EXPECTED_R2_DRIFT = Object.freeze({
  productRuntime:
    'whole-lesson-playback-completion-and-host-narration-current-js-epoch',
  productQaContractTest:
    'rw002-r1-preservation-and-r2-current-binding-validation',
});

const ACCEPTANCE_EFFECTS = Object.freeze({
  audioAcceptance: false,
  originalRuntimeEvidence: false,
  humanVisualReview: false,
  ownerAcceptance: false,
  strictCompletion: false,
  publication: false,
});

const CLAIMS = Object.freeze({
  currentBrowserQa: false,
  authoritativeOriginalRuntimeBaseline: false,
  naturalOriginalRuntimeTraversal: false,
  interactionBranchParity: false,
  bilingualVisualParity: false,
  audioParity: false,
  audioListeningAcceptance: false,
  fullFrameCoverage: false,
  rmseAcceptance: false,
  humanVisualReview: false,
  engineeringAcceptance: false,
  ownerAcceptance: false,
  strictMigrationCompletion: false,
  publication: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertSafeRelative(relativePath, label) {
  invariant(
    typeof relativePath === 'string'
      && relativePath.length > 0
      && !path.isAbsolute(relativePath)
      && !relativePath.includes('\\')
      && !relativePath.includes('\0'),
    `${label} must be a safe project-relative path`,
  );
  invariant(
    relativePath
      .split('/')
      .every((segment) => segment.length > 0 && segment !== '.' && segment !== '..'),
    `${label} contains an unsafe path segment`,
  );
}

async function readRegularFile(root, relativePath) {
  assertSafeRelative(relativePath, relativePath);
  const absolutePath = path.join(root, ...relativePath.split('/'));
  const metadata = await lstat(absolutePath);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${relativePath}: expected a single-link regular non-symlink file`,
  );
  const content = await readFile(absolutePath);
  return {
    file: relativePath,
    bytes: content.length,
    sha256: sha256(content),
    content,
  };
}

function validateR1(report) {
  invariant(isPlainObject(report), 'RW002 r1 report must be an object');
  invariant(report.schemaVersion === 1, 'RW002 r1 schema changed');
  invariant(
    report.artifactType
      === 'g5-l13-rw002-current-javascript-shared-runtime-binding-successor',
    'RW002 r1 artifact type changed',
  );
  invariant(
    report.status
      === 'current-javascript-bindings-reconciled-browser-observations-not-revalidated',
    'RW002 r1 status changed',
  );
  invariant(report.acceptanceNeutral === true, 'RW002 r1 is not acceptance-neutral');
  invariant(report.strictAcceptanceEffect === 'none', 'RW002 r1 strict effect changed');
  invariant(
    isPlainObject(report.acceptanceEffects)
      && Object.values(report.acceptanceEffects).every((value) => value === false),
    'RW002 r1 acceptance effects changed',
  );
  invariant(
    isPlainObject(report.claims)
      && Object.values(report.claims).every((value) => value === false),
    'RW002 r1 claims changed',
  );
  invariant(isPlainObject(report.currentBindings), 'RW002 r1 bindings are missing');
}

export function buildRw002BindingSuccessorR2Report({
  currentProjection,
  generatorBinding,
  predecessorBinding,
  predecessorReport,
}) {
  validateR1(predecessorReport);
  invariant(
    isPlainObject(currentProjection?.currentBindings),
    'RW002 current projection bindings are missing',
  );

  const currentBindings = {};
  const changedRoles = [];
  const unchangedRoles = [];
  const predecessorRoles = Object.keys(predecessorReport.currentBindings);
  invariant(
    JSON.stringify(Object.keys(currentProjection.currentBindings))
      === JSON.stringify(predecessorRoles),
    'RW002 r2 binding role order or membership changed',
  );
  for (const role of predecessorRoles) {
    const predecessor = predecessorReport.currentBindings[role];
    const current = currentProjection.currentBindings[role];
    invariant(current.file === predecessor.file, `${role}: current path changed`);
    const changed = current.sha256 !== predecessor.sha256;
    const expectedCause = EXPECTED_R2_DRIFT[role];
    invariant(
      changed === Boolean(expectedCause),
      changed
        ? `${role}: unexpected r2 binding drift`
        : `${role}: expected r2 binding drift is absent`,
    );
    currentBindings[role] = {
      file: current.file,
      bytes: current.bytes,
      sha256: current.sha256,
      predecessorSuccessorSha256: predecessor.sha256,
      relationToPredecessorSuccessor: changed ? 'changed' : 'byte-identical',
      ...(expectedCause ? {changeCause: expectedCause} : {}),
    };
    (changed ? changedRoles : unchangedRoles).push(role);
  }

  invariant(
    JSON.stringify(changedRoles) === JSON.stringify(Object.keys(EXPECTED_R2_DRIFT)),
    'RW002 r2 changed-role order or membership differs from the fixed contract',
  );

  return {
    schemaVersion: 2,
    artifactType:
      'g5-l13-rw002-current-javascript-shared-runtime-binding-successor',
    animationId: 'course-g05-l13-rw-002',
    issuedOn: '2026-08-07',
    status:
      'current-javascript-bindings-reconciled-browser-observations-not-revalidated',
    authority:
      'Acceptance-neutral successor byte reconciliation for the current whole-lesson playback epoch.',
    authorityBoundary:
      'R2 preserves r1 byte-for-byte and binds the current files. It does not inherit, relabel, or refresh any browser observation. Playback completion and narration host wiring are current-JavaScript product behavior only and prove no RW002 equivalence, original-runtime behavior, audio correctness, fidelity, review, acceptance, strict completion, release, or publication.',
    generatedBy: {
      script: generatorBinding,
      invocation:
        'node scripts/build-g5-l13-rw002-current-js-binding-successor-r2.mjs --write-no-clobber',
      deterministic: true,
    },
    predecessorSuccessor: {
      ...predecessorBinding,
      retainedByteForByte: true,
      browserObservationDisposition: 'none-inherited-none-current',
    },
    originalBrowserReceipt: {
      ...currentProjection.predecessorReceipt,
      retainedByteForByte: true,
      browserObservationsInherited: false,
      browserObservationsCurrentForSuccessor: false,
    },
    driftSummary: {
      predecessorBindingCount: predecessorRoles.length,
      changedBindingCount: changedRoles.length,
      unchangedBindingCount: unchangedRoles.length,
      changedRoles,
      unchangedRoles,
      unexpectedDriftCount: 0,
    },
    currentBindings,
    changeCharacterization: {
      productRuntime: {
        bindingRole: 'productRuntime',
        sourceObservation:
          'The current product runtime adds whole-lesson playback completion reporting and host-owned narration controls.',
        causalAttributionEstablishedForCurrentJavascript: true,
        rw002BehavioralEquivalenceEstablished: false,
        originalRuntimeBehaviorInferred: false,
      },
      successorValidationTest: {
        bindingRole: 'productQaContractTest',
        purpose:
          'Preserve r1 as historical evidence and validate r2 against current bytes.',
        runtimeBehaviorChangedByThisFile: false,
      },
    },
    machineChecks: {
      r1ByteIdentityVerified: true,
      r1AcceptanceBoundaryVerified: true,
      originalBrowserReceiptIdentityVerifiedThroughCurrentProjection: true,
      everyR1BindingPathRead: true,
      everyNonAllowlistedBindingByteIdentical: true,
      expectedDriftRolesExactlyMatched: true,
      browserQaExecutedForSuccessor: false,
      predecessorBrowserObservationsReusedAsCurrent: false,
    },
    acceptanceNeutral: true,
    strictAcceptanceEffect: 'none',
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    claims: {...CLAIMS},
  };
}

export function renderRw002BindingSuccessorR2Markdown(report) {
  const changed = report.driftSummary.changedRoles
    .map((role) => `- \`${role}\`: \`${report.currentBindings[role].file}\``)
    .join('\n');
  return `# G5 L13 RW002 current-JavaScript binding successor r2\n\n`
    + `Status: **${report.status}**\n\n`
    + `R1 remains immutable at \`${report.predecessorSuccessor.sha256}\`. R2 binds the current whole-lesson playback epoch without inheriting or refreshing any browser observation.\n\n`
    + `## Changed bindings since r1\n\n${changed}\n\n`
    + `The product runtime change is attributed only to current-JavaScript playback completion and host-owned narration wiring. It does not establish RW002 behavior or original-runtime equivalence. The contract test change preserves r1 and validates this r2 successor.\n\n`
    + `## Evidence boundary\n\n`
    + `No current RW002 browser behavior, audio correctness, Spanish equivalence, original-runtime behavior, visual fidelity, human review, Owner acceptance, strict completion, release, or publication is established. All acceptance effects remain false; \`strictAcceptanceEffect\` is \`none\`.\n`;
}

export async function buildRw002BindingSuccessorR2Artifacts(root = PROJECT_ROOT) {
  const predecessor = await readRegularFile(
    root,
    RW002_BINDING_SUCCESSOR_R2.predecessor.file,
  );
  invariant(
    predecessor.bytes === RW002_BINDING_SUCCESSOR_R2.predecessor.bytes
      && predecessor.sha256 === RW002_BINDING_SUCCESSOR_R2.predecessor.sha256,
    'RW002 r1 predecessor byte identity changed',
  );
  const predecessorReport = JSON.parse(predecessor.content.toString('utf8'));
  validateR1(predecessorReport);

  const currentProjection = (
    await buildRw002BindingSuccessorArtifacts(root)
  ).report;
  const generator = await readRegularFile(
    root,
    'scripts/build-g5-l13-rw002-current-js-binding-successor-r2.mjs',
  );
  const report = buildRw002BindingSuccessorR2Report({
    currentProjection,
    generatorBinding: {
      file: generator.file,
      bytes: generator.bytes,
      sha256: generator.sha256,
    },
    predecessorBinding: {
      file: predecessor.file,
      bytes: predecessor.bytes,
      sha256: predecessor.sha256,
    },
    predecessorReport,
  });
  return {
    report,
    json: Buffer.from(stableJson(report)),
    markdown: Buffer.from(renderRw002BindingSuccessorR2Markdown(report)),
  };
}

export function parseArguments(argv) {
  invariant(argv.length <= 1, 'expected at most one mode');
  const value = argv[0] ?? '--check';
  if (value === '--write-no-clobber') return {mode: 'write'};
  if (value === '--check') return {mode: 'check'};
  if (value === '--json') return {mode: 'json'};
  if (value === '--help' || value === '-h') return {mode: 'help'};
  throw new Error(`Unknown option: ${value}`);
}

async function outputExists(root, relativePath) {
  try {
    await lstat(path.join(root, ...relativePath.split('/')));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function writeOutputs(root, artifacts) {
  invariant(
    !(await outputExists(root, RW002_BINDING_SUCCESSOR_R2.jsonPath)),
    `${RW002_BINDING_SUCCESSOR_R2.jsonPath}: immutable output already exists`,
  );
  invariant(
    !(await outputExists(root, RW002_BINDING_SUCCESSOR_R2.markdownPath)),
    `${RW002_BINDING_SUCCESSOR_R2.markdownPath}: immutable output already exists`,
  );
  const jsonAbsolute = path.join(
    root,
    ...RW002_BINDING_SUCCESSOR_R2.jsonPath.split('/'),
  );
  const markdownAbsolute = path.join(
    root,
    ...RW002_BINDING_SUCCESSOR_R2.markdownPath.split('/'),
  );
  await writeFile(
    jsonAbsolute,
    artifacts.json,
    {flag: 'wx', mode: 0o444},
  );
  const ownedJson = await lstat(jsonAbsolute);
  try {
    await writeFile(
      markdownAbsolute,
      artifacts.markdown,
      {flag: 'wx', mode: 0o444},
    );
  } catch (error) {
    const currentJson = await lstat(jsonAbsolute).catch(() => null);
    if (
      currentJson
      && currentJson.dev === ownedJson.dev
      && currentJson.ino === ownedJson.ino
      && currentJson.nlink === 1
    ) {
      await unlink(jsonAbsolute);
    }
    throw new Error(
      `RW002 r2 publication failed before the immutable pair completed: ${error.message}`,
      {cause: error},
    );
  }
}

async function checkOutputs(root, artifacts) {
  const json = await readRegularFile(root, RW002_BINDING_SUCCESSOR_R2.jsonPath);
  const markdown = await readRegularFile(
    root,
    RW002_BINDING_SUCCESSOR_R2.markdownPath,
  );
  invariant(json.content.equals(artifacts.json), 'RW002 r2 JSON drifted');
  invariant(markdown.content.equals(artifacts.markdown), 'RW002 r2 Markdown drifted');
}

async function main() {
  const {mode} = parseArguments(process.argv.slice(2));
  if (mode === 'help') {
    process.stdout.write(
      'Usage: node scripts/build-g5-l13-rw002-current-js-binding-successor-r2.mjs [--write-no-clobber|--check|--json]\n',
    );
    return;
  }
  const artifacts = await buildRw002BindingSuccessorR2Artifacts(PROJECT_ROOT);
  if (mode === 'write') {
    await writeOutputs(PROJECT_ROOT, artifacts);
    process.stdout.write(
      `wrote ${RW002_BINDING_SUCCESSOR_R2.jsonPath} and ${RW002_BINDING_SUCCESSOR_R2.markdownPath}\n`,
    );
  } else if (mode === 'check') {
    await checkOutputs(PROJECT_ROOT, artifacts);
    process.stdout.write('RW002 current-JavaScript binding successor r2: PASS\n');
  } else {
    process.stdout.write(artifacts.json);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
