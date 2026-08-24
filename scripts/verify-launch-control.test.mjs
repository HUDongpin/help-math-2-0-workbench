import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

import {
  deriveReleaseReadiness,
  LIFECYCLE_STATES,
  verifyBacklog,
  verifyExternalAuthorizationAnchor,
  verifyExternalInputStatus,
  verifyPromotionAuthorization,
  verifyRejectedCommitProof,
  verifyTaskContract,
} from './verify-launch-control.mjs';
import {
  CATALOG_FULL_LOCAL_ONLY_TEST_NAMES,
  loadAndValidateHostedWorkbenchContract,
  MANDATORY_CATALOG_HOSTED_TEST_NAMES,
  MANDATORY_HOSTED_TEST_FILES,
  validateHostedWorkbenchContract,
} from './run-hosted-workbench-tests.mjs';

function validTask() {
  return {
    taskId: 'C0-TEST-001',
    objective: 'Prove the task contract.',
    priority: 'P0',
    lane: 'test',
    releaseBlocking: true,
    requiredTerminalState: 'INDEPENDENT_REVIEWED',
    baseCommit: null,
    baseTree: null,
    worktree: null,
    branch: null,
    readSet: [],
    changedPathAllowlist: [],
    predecessorReceiptHashes: [],
    allowedTools: [],
    forbiddenActions: [],
    verificationCommands: [],
    acceptanceCriteria: [],
    lease: {owner: null, expiresAt: null, attemptCount: 0},
    output: {commit: null, tree: null, artifactHashes: [], tokenUsage: null},
    producer: 'Producer',
    independentReviewer: 'Reviewer',
    status: 'QUEUED',
    result: null,
    gateEffects: {
      currentJs: false,
      strict: false,
      preview: false,
      released: false,
      production: false,
    },
  };
}

function validPromotionAuthorizationDocument() {
  const hash = (character) => character.repeat(64);
  return {
    schemaVersion: 1,
    releaseId: 'HELP_MATH_2_PUBLIC_LAUNCH_V1',
    status: 'AUTHORIZED',
    hardGates: {
      accessibilityGate: true,
      browserMatrixGate: true,
      cleanReleaseWorktree: true,
      cleanRoomReleaseSuite: true,
      exactArtifactIdentity: true,
      finalRecheckNoDrift: true,
      fortyEightHourSoak: true,
      githubHostedCi: true,
      independentReview: true,
      instantRollbackRehearsed: true,
      lastKnownGoodFrozen: true,
      legalPagesFinal: true,
      licenseGate: true,
      mainProtectionAndRequiredChecks: true,
      minimumTwoPreviewLessons: true,
      performanceGate: true,
      productionSmokeGate: true,
      publicFeaturesFailClosed: true,
      publicSurfaceConsistency: true,
      repositoryPrivate: true,
      sbomGate: true,
      secretAndPrivatePathGate: true,
      stagedDeploymentReady: true,
      supportMailboxTwoWayVerified: true,
      zeroP0P1: true,
    },
    disabledPublicFeatures: {
      auth: false,
      contactForm: false,
      family: false,
      lrs: false,
      novaTutor: false,
      teacher: false,
    },
    approvalReceiptSha256: {
      accessibility: hash('1'),
      englishSpanishMathInstruction: hash('2'),
      legalPrivacy: hash('3'),
      owner: hash('4'),
    },
    promotion: {
      automaticPromotionAllowed: true,
      exactCommit: 'a'.repeat(40),
      exactTree: 'b'.repeat(40),
      finalAuthorizationReceiptSha256: hash('5'),
      lastKnownGoodDeploymentId: 'dpl_LastKnownGood1',
      launchManifestSha256: hash('6'),
      productionDomains: ['helpmath.ai', 'www.helpmath.ai'],
      rollbackReceiptSha256: hash('7'),
      rollbackThresholdsReceiptSha256: hash('8'),
      runtimeAssetClosureSha256: hash('9'),
      stagedDeploymentId: 'dpl_StagedCandidate1',
      stagedDeploymentReceiptSha256: hash('a'),
      timeZone: 'Asia/Shanghai',
      windowEndsAt: '2026-09-30T10:30:00+08:00',
      windowStartsAt: '2026-09-30T09:30:00+08:00',
    },
  };
}

test('task contract requires every gate effect to be explicit', () => {
  const task = validTask();
  delete task.gateEffects.strict;
  assert.throws(() => verifyTaskContract(task), /gateEffects\.strict/u);
});

test('PASS cannot be asserted before local verification', () => {
  const task = validTask();
  task.result = 'PASS';
  assert.throws(() => verifyTaskContract(task), /cannot precede LOCAL_VERIFIED/u);
});

test('backlog rejects duplicate task identities and state-machine drift', () => {
  const task = validTask();
  assert.throws(
    () =>
      verifyBacklog({
        schemaVersion: 1,
        releaseId: 'HELP_MATH_2_PUBLIC_LAUNCH_V1',
        stateMachine: LIFECYCLE_STATES,
        tasks: [task, structuredClone(task)],
      }),
    /duplicate taskId/u,
  );
});

test('external input status stores receipt hashes but never private values', () => {
  const status = {
    schemaVersion: 1,
    releaseId: 'HELP_MATH_2_PUBLIC_LAUNCH_V1',
    privacyBoundary:
      'Values are stored only in the private release-input store; this file records presence and hash binding, never the values.',
    publicLaunchEffect: 'NO_GO_WHILE_ANY_REQUIRED_INPUT_IS_MISSING',
    inputs: {
      operatingLegalEntity: {received: false, privateReceiptSha256: null},
      jurisdictionStateAndCountry: {received: false, privateReceiptSha256: null},
      staffedAdultSupportEmail: {
        received: false,
        twoWayVerificationComplete: false,
        verificationBasis: 'owner-attested-verified-and-staffed',
        privateReceiptSha256: null,
      },
    },
    namedFinalReviewers: {
      owner: {assigned: false, privateIdentityReceiptSha256: null},
      legalPrivacy: {assigned: false, privateIdentityReceiptSha256: null},
      englishSpanishMathInstruction: {
        assigned: false,
        privateIdentityReceiptSha256: null,
      },
      accessibility: {assigned: false, privateIdentityReceiptSha256: null},
    },
  };
  assert.deepEqual(verifyExternalInputStatus(status), {
    receivedCount: 0,
    requiredCount: 3,
    namedReviewerCount: 0,
    requiredNamedReviewerCount: 4,
  });
  status.inputs.operatingLegalEntity.unexpectedPrivateField =
    'must-not-be-in-git';
  assert.throws(
    () => verifyExternalInputStatus(status),
    /operatingLegalEntity external input fields must be exact/u,
  );
});

test('received inputs alone cannot turn an unfinished release backlog green', () => {
  const task = validTask();
  const promotionAuthorization = verifyPromotionAuthorization(
    validPromotionAuthorizationDocument(),
  );
  const readiness = deriveReleaseReadiness({
    backlog: {tasks: [task]},
    externalInputs: {
      receivedCount: 3,
      requiredCount: 3,
      namedReviewerCount: 4,
      requiredNamedReviewerCount: 4,
    },
    promotionAuthorization,
    repository: {
      head: promotionAuthorization.exactCommit,
      tree: promotionAuthorization.exactTree,
    },
    externalAuthorizationAnchor: verifyExternalAuthorizationAnchor(
      promotionAuthorization,
      promotionAuthorization.finalAuthorizationReceiptSha256,
    ),
  });
  assert.equal(readiness.status, 'NO_GO');
  assert.deepEqual(readiness.blockingReasons, [
    'release-blocking-tasks-incomplete:C0-TEST-001',
    'exact-staged-production-task-count:0',
  ]);
});

test('promotion authorization requires every hard gate, approval, artifact, and public feature lock', () => {
  const document = validPromotionAuthorizationDocument();
  const authorization = verifyPromotionAuthorization(document);
  assert.equal(authorization.status, 'AUTHORIZED');
  assert.equal(authorization.exactArtifactsComplete, true);
  assert.deepEqual(authorization.falseHardGates, []);
  assert.equal(authorization.approvalCount, 4);

  document.disabledPublicFeatures.novaTutor = true;
  assert.throws(
    () => verifyPromotionAuthorization(document),
    /public feature must remain false for launch: novaTutor/u,
  );
});

test('NO_GO promotion document cannot become ready through task or reviewer state alone', () => {
  const document = validPromotionAuthorizationDocument();
  document.status = 'NO_GO';
  document.promotion.automaticPromotionAllowed = false;
  for (const name of Object.keys(document.hardGates)) document.hardGates[name] = false;
  for (const role of Object.keys(document.approvalReceiptSha256)) {
    document.approvalReceiptSha256[role] = null;
  }
  for (const field of Object.keys(document.promotion)) {
    if (!['automaticPromotionAllowed', 'productionDomains', 'timeZone'].includes(field)) {
      document.promotion[field] = null;
    }
  }
  const promotionAuthorization = verifyPromotionAuthorization(document);
  const readiness = deriveReleaseReadiness({
    backlog: {tasks: []},
    externalInputs: {
      receivedCount: 3,
      requiredCount: 3,
      namedReviewerCount: 4,
      requiredNamedReviewerCount: 4,
    },
    promotionAuthorization,
  });
  assert.equal(readiness.status, 'NO_GO');
  assert.ok(readiness.blockingReasons.includes('promotion-authorization-status:NO_GO'));
  assert.ok(readiness.blockingReasons.includes('automatic-promotion-not-authorized'));
  assert.ok(readiness.blockingReasons.includes('promotion-approval-receipts-missing:4'));
  assert.ok(readiness.blockingReasons.includes('exact-promotion-artifact-bindings-incomplete'));
});

test('GO requires one staged task bound to the exact authorized artifact hashes', () => {
  const promotionAuthorization = verifyPromotionAuthorization(
    validPromotionAuthorizationDocument(),
  );
  const task = validTask();
  task.lane = 'production-promotion';
  task.requiredTerminalState = 'STAGED_PRODUCTION_VERIFIED';
  task.status = 'STAGED_PRODUCTION_VERIFIED';
  task.result = 'PASS';
  task.output.commit = promotionAuthorization.exactCommit;
  task.output.tree = promotionAuthorization.exactTree;
  task.output.artifactHashes = [...promotionAuthorization.requiredTaskArtifacts];
  task.gateEffects.preview = true;
  task.gateEffects.production = true;
  const externalInputs = {
    receivedCount: 3,
    requiredCount: 3,
    namedReviewerCount: 4,
    requiredNamedReviewerCount: 4,
  };
  const repository = {
    head: promotionAuthorization.exactCommit,
    tree: promotionAuthorization.exactTree,
  };
  const externalAuthorizationAnchor = verifyExternalAuthorizationAnchor(
    promotionAuthorization,
    promotionAuthorization.finalAuthorizationReceiptSha256,
  );
  assert.equal(
    deriveReleaseReadiness({
      backlog: {tasks: [task]},
      externalInputs,
      promotionAuthorization,
      repository,
      externalAuthorizationAnchor,
    }).status,
    'GO',
  );

  task.output.artifactHashes = task.output.artifactHashes.slice(1);
  const mismatch = deriveReleaseReadiness({
    backlog: {tasks: [task]},
    externalInputs,
    promotionAuthorization,
    repository,
    externalAuthorizationAnchor,
  });
  assert.equal(mismatch.status, 'NO_GO');
  assert.ok(mismatch.blockingReasons.includes('staged-task-artifact-mismatch'));

  task.output.artifactHashes = [...promotionAuthorization.requiredTaskArtifacts];
  const wrongCheckout = deriveReleaseReadiness({
    backlog: {tasks: [task]},
    externalInputs,
    promotionAuthorization,
    repository: {...repository, head: 'c'.repeat(40)},
    externalAuthorizationAnchor,
  });
  assert.equal(wrongCheckout.status, 'NO_GO');
  assert.ok(
    wrongCheckout.blockingReasons.includes('exact-promotion-checkout-identity-mismatch'),
  );

  const missingExternalAnchor = deriveReleaseReadiness({
    backlog: {tasks: [task]},
    externalInputs,
    promotionAuthorization,
    repository,
    externalAuthorizationAnchor: verifyExternalAuthorizationAnchor(
      promotionAuthorization,
      '',
    ),
  });
  assert.equal(missingExternalAnchor.status, 'NO_GO');
  assert.ok(
    missingExternalAnchor.blockingReasons.includes('external-final-authorization-anchor:MISSING'),
  );
});

test('rejected mixed-commit ancestry proof distinguishes absent, error, ancestor, and non-ancestor', () => {
  assert.throws(
    () => verifyRejectedCommitProof({objectStatus: 128, ancestryStatus: null}),
    /object is unavailable/u,
  );
  assert.throws(
    () => verifyRejectedCommitProof({objectStatus: 0, ancestryStatus: 128}),
    /ancestry could not be verified/u,
  );
  assert.throws(
    () => verifyRejectedCommitProof({objectStatus: 0, ancestryStatus: 0}),
    /became an ancestor/u,
  );
  assert.equal(
    verifyRejectedCommitProof({objectStatus: 0, ancestryStatus: 1}),
    true,
  );
});

test('Hosted workbench contract preserves the full-local suite and mandatory baseline', () => {
  const result = loadAndValidateHostedWorkbenchContract();
  assert.equal(result.status, 'HOSTED_WORKBENCH_CONTRACT_PASS');
  assert.equal(result.fullyHostedTestFileCount, MANDATORY_HOSTED_TEST_FILES.length);
  assert.equal(
    result.selectedCatalogTestCount,
    MANDATORY_CATALOG_HOSTED_TEST_NAMES.length,
  );
  assert.equal(
    result.fullLocalOnlyCatalogTestCount,
    CATALOG_FULL_LOCAL_ONLY_TEST_NAMES.length,
  );
  assert.equal(
    result.fullLocalTestFileCount,
    result.hostedReferencedTestFileCount + result.notYetHostedClassifiedFileCount,
  );
});

test('Hosted workbench allowlist cannot silently shrink', () => {
  const contract = {
    schemaVersion: 1,
    releaseId: 'HELP_MATH_2_PUBLIC_LAUNCH_V1',
    pathSetEncoding: 'sorted-utf8-nul-terminated',
    fullLocalCommand:
      'node --import ./scripts/register-worktree-shared-dependencies.mjs --test --test-concurrency=4 lib/*.test.mjs scripts/*.test.mjs',
    fullLocalDiscovery: {
      directories: ['lib', 'scripts'],
      suffix: '.test.mjs',
      fileCount: 0,
      encodedByteLength: 0,
      sortedPathSetSha256: '',
    },
    fullyHostedProfile: {
      nodeArguments: [
        '--import',
        './scripts/register-worktree-shared-dependencies.mjs',
        '--import',
        'tsx',
        '--test',
        '--test-concurrency=4',
        '--test-reporter=tap',
      ],
      fileCount: MANDATORY_HOSTED_TEST_FILES.length - 1,
      encodedByteLength: 0,
      sortedPathSetSha256: '',
      expectedTestCount: 121,
      expectedPassCount: 121,
      expectedSkipCount: 0,
      testFiles: MANDATORY_HOSTED_TEST_FILES.slice(1),
    },
    mixedHostedProfiles: [
      {
        testFile: 'scripts/build-help-math-catalog.test.mjs',
        selectedTestNames: MANDATORY_CATALOG_HOSTED_TEST_NAMES,
        fullLocalOnlyTestNames: CATALOG_FULL_LOCAL_ONLY_TEST_NAMES,
        expectedTestCount: 5,
        expectedPassCount: 5,
        expectedSkipCount: 0,
        boundary: 'Full-local-only cases are not counted as Hosted PASS.',
      },
    ],
    notYetHostedClassifiedRemainder: {
      fileCount: 0,
      encodedByteLength: 0,
      sortedPathSetSha256: '',
      classificationStatus: 'NOT_INDIVIDUALLY_PROVEN_CLEAN_CHECKOUT_SAFE',
      reasonCodes: ['individual-classification-pending'],
      executionContract: 'Excluded tests are not PASS.',
    },
  };
  assert.throws(
    () => validateHostedWorkbenchContract({contract}),
    /cannot shrink below the mandatory baseline/u,
  );
});

test('Hosted structural verification preserves local evidence gates as explicit NOT_RUN results', () => {
  const child = spawnSync(
    process.execPath,
    [
      '--import',
      './scripts/register-worktree-shared-dependencies.mjs',
      'scripts/verify-workbench.mjs',
      '--hosted',
    ],
    {encoding: 'utf8'},
  );
  assert.equal(child.status, 0, child.stderr || child.stdout);
  assert.match(child.stdout, /Hosted workbench structural verification passed/u);
  assert.match(child.stdout, /preserved-source presence: NOT_RUN_REQUIRES_LOCAL_EVIDENCE/u);
  assert.match(
    child.stdout,
    /strict completion ledger currentness: NOT_RUN_REQUIRES_LOCAL_EVIDENCE/u,
  );
  assert.match(
    child.stdout,
    /atomic lesson release ledger currentness: NOT_RUN_REQUIRES_LOCAL_EVIDENCE/u,
  );
  assert.doesNotMatch(child.stdout, /strict completion ledger is current/u);
  assert.doesNotMatch(child.stdout, /atomic lesson release ledger is current/u);
});
